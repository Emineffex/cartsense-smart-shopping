import { supabase } from "@/integrations/supabase/client";
import type { ProductProvider, ProviderOffer, ProviderQuery, StoreName } from "./types";

/**
 * Base provider backed by our own Supabase catalog, scoped to a single store.
 * Real integrations should extend `ProductProvider` directly and hit their
 * upstream API; keeping the base here means CartSense works today without
 * external credentials while the interface stays production-ready.
 */
export abstract class SupabaseBackedProvider implements ProductProvider {
  abstract readonly store: StoreName;
  readonly enabled: boolean = true;

  protected mapAvailability(): ProviderOffer["availability"] {
    return "in_stock";
  }

  protected parseBankOffer(raw: string | null | undefined): ProviderOffer["bankOffers"] {
    if (!raw) return [];
    // Very light parsing — e.g. "HDFC Bank: 10% instant discount"
    const [bank, ...rest] = raw.split(":");
    const description = rest.join(":").trim() || raw;
    const match = description.match(/(\d{1,2})\s?%/);
    return [{ bank: bank.trim(), description, discount: match ? Number(match[1]) : undefined }];
  }

  async search(query: ProviderQuery): Promise<ProviderOffer[]> {
    const { q, category, brand, limit = 60, signal } = query;
    let req = supabase
      .from("products")
      .select(
        "id,name,brand,category,image,images,specs,rating,reviews_count,product_offers!inner(price,original_price,rating,reviews,delivery,bank_offer,url,stores!inner(id,name))"
      )
      .eq("product_offers.stores.name", this.store)
      .limit(limit);

    if (q?.trim()) {
      const term = `%${q.trim()}%`;
      req = req.or(`name.ilike.${term},brand.ilike.${term}`);
    }
    if (category && category !== "All") req = req.eq("category", category);
    if (brand?.length) req = req.in("brand", brand);

    if (signal) req = req.abortSignal(signal);

    const { data, error } = await req;
    if (error) throw error;

    const offers: ProviderOffer[] = [];
    for (const row of data ?? []) {
      const specs = (row.specs && typeof row.specs === "object" ? row.specs : {}) as Record<string, string>;
      const images = Array.isArray(row.images) ? (row.images as string[]) : [];
      for (const offer of row.product_offers ?? []) {
        const store = Array.isArray(offer.stores) ? offer.stores[0] : offer.stores;
        if (!store || store.name !== this.store) continue;
        offers.push({
          productKey: row.id,
          title: row.name,
          image: row.image,
          images,
          brand: row.brand,
          category: row.category,
          price: Number(offer.price),
          originalPrice: Number(offer.original_price),
          rating: Number(offer.rating ?? row.rating),
          reviewCount: offer.reviews ?? row.reviews_count,
          store: this.store,
          storeId: store.id,
          productUrl: offer.url ?? "#",
          availability: this.mapAvailability(),
          deliveryTime: offer.delivery ?? "Standard delivery",
          bankOffers: this.parseBankOffer(offer.bank_offer),
          specifications: specs,
        });
      }
    }
    return offers;
  }
}
