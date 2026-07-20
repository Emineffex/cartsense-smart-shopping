// Adapter interface for external price providers.
// Swap MockPriceProvider for a real scraper/API without changing the frontend.

import type { Store, StorePrice } from "@/lib/sample-data";

export interface PriceProvider {
  /** Fetch live prices for a product from every configured store. */
  fetchLivePrices(productId: string): Promise<StorePrice[]>;
}

/**
 * Default provider used when no external service is wired up.
 * It reads offers directly from Lovable Cloud (seeded data).
 */
export class SupabasePriceProvider implements PriceProvider {
  async fetchLivePrices(productId: string): Promise<StorePrice[]> {
    const { supabase } = await import("@/integrations/supabase/client");
    const { data, error } = await supabase
      .from("product_offers")
      .select("price,original_price,discount,rating,reviews,delivery,bank_offer,best_deal,url,stores(name)")
      .eq("product_id", productId);
    if (error) throw error;
    return (data ?? []).map((o) => {
      const storeRel = (o as { stores: { name: string } | { name: string }[] | null }).stores;
      const storeName = Array.isArray(storeRel) ? storeRel[0]?.name : storeRel?.name;
      return {
        store: (storeName ?? "Amazon") as Store,
        price: Number(o.price),
        originalPrice: Number(o.original_price),
        discount: o.discount as number,
        rating: Number(o.rating),
        reviews: o.reviews as number,
        delivery: (o.delivery as string | null) ?? "",
        bankOffer: (o.bank_offer as string | null) ?? "",
        bestDeal: Boolean(o.best_deal),
        url: (o.url as string | null) ?? "#",
      };
    });
  }
}

export const priceProvider: PriceProvider = new SupabasePriceProvider();
