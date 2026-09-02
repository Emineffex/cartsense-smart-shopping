import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/use-auth";

export type VerificationStatus = "pending" | "approved" | "rejected" | "suspended";

export interface RetailerProfile {
  id: string;
  user_id: string;
  store_id: string | null;
  business_name: string;
  owner_name: string;
  phone: string | null;
  address: string | null;
  gstin: string | null;
  logo_url: string | null;
  verification_status: VerificationStatus;
  created_at: string;
}

export interface RetailerOffer {
  id: string;
  product_id: string;
  price: number;
  original_price: number;
  discount: number;
  delivery: string | null;
  url: string | null;
  sku: string | null;
  stock_quantity: number;
  availability: string;
  is_active: boolean;
  products: {
    id: string;
    name: string;
    brand: string;
    category: string;
    image: string;
    description: string | null;
  } | null;
}

export interface RetailerRegistrationInput {
  businessName: string;
  ownerName: string;
  phone?: string;
  address?: string;
  gstin?: string;
  logoUrl?: string;
}

export interface RetailerProductInput {
  name: string;
  brand: string;
  category: string;
  description?: string;
  image: string;
  sku?: string;
  price: number;
  mrp: number;
  stock: number;
  availability: string;
  url?: string;
  delivery?: string;
}

const slugify = (s: string) =>
  s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || "product";

export function calcDiscount(price: number, mrp: number): number {
  if (!mrp || mrp <= price) return 0;
  return Math.round(((mrp - price) / mrp) * 100);
}

// ---------------- profile ----------------

export function useRetailerProfile() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["retailer", "profile", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<RetailerProfile | null> => {
      const { data, error } = await supabase
        .from("retailer_profiles")
        .select("*")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      return (data as RetailerProfile | null) ?? null;
    },
  });
}

export function useRegisterRetailer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RetailerRegistrationInput) => {
      const { data, error } = await supabase.rpc("register_retailer", {
        _business_name: input.businessName,
        _owner_name: input.ownerName,
        _phone: input.phone ?? null,
        _address: input.address ?? null,
        _gstin: input.gstin ?? null,
        _logo_url: input.logoUrl ?? null,
      });
      if (error) throw error;
      return data as string;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["retailer"] });
      qc.invalidateQueries({ queryKey: ["is-admin"] });
    },
  });
}

export function useUpdateRetailerProfile() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (
      patch: Partial<Pick<RetailerProfile, "business_name" | "owner_name" | "phone" | "address" | "gstin" | "logo_url">> & {
        id: string;
        store_id?: string | null;
      },
    ) => {
      const { id, store_id, ...rest } = patch;
      const { error } = await supabase.from("retailer_profiles").update(rest).eq("id", id);
      if (error) throw error;
      if (store_id) {
        const { error: sErr } = await supabase
          .from("stores")
          .update({
            name: rest.business_name ?? undefined,
            logo_url: rest.logo_url ?? undefined,
          })
          .eq("id", store_id);
        if (sErr) throw sErr;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["retailer"] }),
  });
}

// ---------------- products / offers ----------------

export function useRetailerOffers(storeId: string | null | undefined) {
  return useQuery({
    queryKey: ["retailer", "offers", storeId],
    enabled: !!storeId,
    queryFn: async (): Promise<RetailerOffer[]> => {
      const { data, error } = await supabase
        .from("product_offers")
        .select(
          "id,product_id,price,original_price,discount,delivery,url,sku,stock_quantity,availability,is_active,products(id,name,brand,category,image,description)",
        )
        .eq("store_id", storeId!)
        .order("updated_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as RetailerOffer[];
    },
  });
}

export function useRetailerStats(storeId: string | null | undefined) {
  return useQuery({
    queryKey: ["retailer", "stats", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const [all, active, oos, clicks] = await Promise.all([
        supabase.from("product_offers").select("id", { count: "exact", head: true }).eq("store_id", storeId!),
        supabase
          .from("product_offers")
          .select("id", { count: "exact", head: true })
          .eq("store_id", storeId!)
          .eq("is_active", true),
        supabase
          .from("product_offers")
          .select("id", { count: "exact", head: true })
          .eq("store_id", storeId!)
          .eq("availability", "out_of_stock"),
        supabase.from("affiliate_clicks").select("id", { count: "exact", head: true }).eq("store_id", storeId!),
      ]);
      return {
        totalProducts: all.count ?? 0,
        activeProducts: active.count ?? 0,
        outOfStock: oos.count ?? 0,
        totalClicks: clicks.count ?? 0,
      };
    },
  });
}

export function useRecentRetailerClicks(storeId: string | null | undefined) {
  return useQuery({
    queryKey: ["retailer", "clicks", storeId],
    enabled: !!storeId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("affiliate_clicks")
        .select("id,product_id,destination_url,clicked_at")
        .eq("store_id", storeId!)
        .order("clicked_at", { ascending: false })
        .limit(10);
      if (error) throw error;
      return data ?? [];
    },
  });
}

/** Creates the product (if new) + the retailer's offer, in that order. */
export function useCreateRetailerProduct(storeId: string | null | undefined, userId: string | undefined) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (input: RetailerProductInput) => {
      if (!storeId || !userId) throw new Error("Retailer store not ready");
      const productId = `ret_${slugify(input.name)}-${Math.random().toString(36).slice(2, 7)}`;

      const { error: pErr } = await supabase.from("products").insert({
        id: productId,
        name: input.name.trim(),
        brand: input.brand.trim(),
        category: input.category.trim(),
        description: input.description?.trim() || null,
        image: input.image.trim(),
        images: [input.image.trim()],
        created_by: userId,
        lowest_price: input.price,
        highest_price: input.mrp || input.price,
      });
      if (pErr) throw pErr;

      const { error: oErr } = await supabase.from("product_offers").insert({
        product_id: productId,
        store_id: storeId,
        price: input.price,
        original_price: input.mrp || input.price,
        discount: calcDiscount(input.price, input.mrp),
        sku: input.sku?.trim() || null,
        stock_quantity: input.stock,
        availability: input.availability,
        delivery: input.delivery?.trim() || null,
        url: input.url?.trim() || null,
        is_active: true,
      });
      if (oErr) throw oErr;
      // price_history is appended automatically by the database trigger.
      return productId;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["retailer"] }),
  });
}

export interface OfferUpdate {
  id: string;
  productId: string;
  price?: number;
  original_price?: number;
  stock_quantity?: number;
  availability?: string;
  url?: string | null;
  is_active?: boolean;
  image?: string;
}

export function useUpdateRetailerOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (patch: OfferUpdate) => {
      const { id, productId, image, ...rest } = patch;
      const payload: Record<string, unknown> = { ...rest };
      if (rest.price != null && rest.original_price != null) {
        payload["discount"] = calcDiscount(rest.price, rest.original_price);
      }
      const { error } = await supabase.from("product_offers").update(payload).eq("id", id);
      if (error) throw error;
      if (image) {
        const { error: iErr } = await supabase
          .from("products")
          .update({ image, images: [image] })
          .eq("id", productId);
        if (iErr) throw iErr;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["retailer"] }),
  });
}

export function useDeleteRetailerOffer() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("product_offers").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["retailer"] }),
  });
}

// ---------------- admin ----------------

export interface AdminRetailer extends RetailerProfile {
  stores: { id: string; name: string; slug: string } | null;
}

export function useAdminRetailers() {
  return useQuery({
    queryKey: ["admin", "retailers"],
    queryFn: async (): Promise<AdminRetailer[]> => {
      const { data, error } = await supabase
        .from("retailer_profiles")
        .select("*, stores(id,name,slug)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as unknown as AdminRetailer[];
    },
  });
}

export function useSetRetailerStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ profileId, status }: { profileId: string; status: VerificationStatus }) => {
      const { error } = await supabase.rpc("set_retailer_status", {
        _profile_id: profileId,
        _status: status,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "retailers"] }),
  });
}
