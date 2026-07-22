import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product, Store, StorePrice } from "@/lib/sample-data";

interface DbOffer {
  price: number;
  original_price: number;
  discount: number;
  rating: number;
  reviews: number;
  delivery: string | null;
  bank_offer: string | null;
  best_deal: boolean;
  url: string | null;
  stores: { id: string; name: string } | { id: string; name: string }[] | null;
}

interface DbProduct {
  id: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  images: unknown;
  specs: unknown;
  pros: unknown;
  cons: unknown;
  rating: number;
  reviews_count: number;
  lowest_price: number;
  highest_price: number;
  created_at?: string;
  product_offers?: DbOffer[];
}

const asArray = <T>(v: unknown): T[] => (Array.isArray(v) ? (v as T[]) : []);
const asRecord = (v: unknown): Record<string, string> =>
  v && typeof v === "object" ? (v as Record<string, string>) : {};

function mapOffer(o: DbOffer): StorePrice {
  const storeName =
    (Array.isArray(o.stores) ? o.stores[0]?.name : o.stores?.name) ?? "Amazon";
  return {
    store: storeName as Store,
    price: Number(o.price),
    originalPrice: Number(o.original_price),
    discount: o.discount,
    rating: Number(o.rating),
    reviews: o.reviews,
    delivery: o.delivery ?? "",
    bankOffer: o.bank_offer ?? "",
    bestDeal: o.best_deal,
    url: o.url ?? "#",
  };
}

function mapProduct(p: DbProduct): Product {
  const offers = (p.product_offers ?? []).map(mapOffer);
  // Sort so best_deal / lowest price first, matching UI expectations
  offers.sort((a, b) => (b.bestDeal ? 1 : 0) - (a.bestDeal ? 1 : 0) || a.price - b.price);
  return {
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    image: p.image,
    images: asArray<string>(p.images),
    lowestPrice: Number(p.lowest_price),
    highestPrice: Number(p.highest_price),
    rating: Number(p.rating),
    reviews: p.reviews_count,
    specs: asRecord(p.specs),
    pros: asArray<string>(p.pros),
    cons: asArray<string>(p.cons),
    stores: offers,
    createdAt: p.created_at ?? null,
  };
}

const PRODUCT_SELECT =
  "id,name,brand,category,image,images,specs,pros,cons,rating,reviews_count,lowest_price,highest_price,created_at,product_offers(price,original_price,discount,rating,reviews,delivery,bank_offer,best_deal,url,stores(name))";

export interface CatalogFilters {
  q?: string;
  category?: string;
  brand?: string[];
}

export async function fetchProducts(filters: CatalogFilters = {}): Promise<Product[]> {
  let query = supabase.from("products").select(PRODUCT_SELECT);
  if (filters.q?.trim()) {
    const term = `%${filters.q.trim()}%`;
    query = query.or(`name.ilike.${term},brand.ilike.${term}`);
  }
  if (filters.category && filters.category !== "All") {
    query = query.eq("category", filters.category);
  }
  if (filters.brand && filters.brand.length) {
    query = query.in("brand", filters.brand);
  }
  const { data, error } = await query.order("rating", { ascending: false });
  if (error) throw error;
  return (data ?? []).map((row) => mapProduct(row as unknown as DbProduct));
}

export async function fetchProduct(id: string): Promise<Product | null> {
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_SELECT)
    .eq("id", id)
    .maybeSingle();
  if (error) throw error;
  return data ? mapProduct(data as unknown as DbProduct) : null;
}

export async function fetchProductSummaries(): Promise<
  Array<Pick<Product, "id" | "name" | "brand" | "category" | "image" | "lowestPrice" | "highestPrice" | "rating" | "reviews">>
> {
  const { data, error } = await supabase
    .from("products")
    .select("id,name,brand,category,image,rating,reviews_count,lowest_price,highest_price")
    .order("name");
  if (error) throw error;
  return (data ?? []).map((p) => ({
    id: p.id,
    name: p.name,
    brand: p.brand,
    category: p.category,
    image: p.image,
    rating: Number(p.rating),
    reviews: p.reviews_count,
    lowestPrice: Number(p.lowest_price),
    highestPrice: Number(p.highest_price),
  }));
}

export function useProducts(filters: CatalogFilters = {}) {
  return useQuery({
    queryKey: ["products", filters],
    queryFn: () => fetchProducts(filters),
  });
}

export function useProduct(id: string | undefined) {
  return useQuery({
    queryKey: ["product", id],
    queryFn: () => fetchProduct(id!),
    enabled: !!id,
  });
}

export function useProductSummaries() {
  return useQuery({
    queryKey: ["product-summaries"],
    queryFn: fetchProductSummaries,
  });
}

export interface PricePoint {
  date: string;
  price: number;
}

export async function fetchPriceHistory(productId: string): Promise<PricePoint[]> {
  const { data, error } = await supabase
    .from("price_history")
    .select("captured_at, price")
    .eq("product_id", productId)
    .order("captured_at", { ascending: true });
  if (error) throw error;
  // Aggregate to daily minimum (best price of the day across stores)
  const byDay = new Map<string, number>();
  for (const row of data ?? []) {
    const day = String(row.captured_at).slice(0, 10);
    const price = Number(row.price);
    const prev = byDay.get(day);
    if (prev === undefined || price < prev) byDay.set(day, price);
  }
  return Array.from(byDay.entries()).map(([date, price]) => ({ date, price }));
}

export function usePriceHistory(productId: string | undefined) {
  return useQuery({
    queryKey: ["price-history", productId],
    queryFn: () => fetchPriceHistory(productId!),
    enabled: !!productId,
  });
}
