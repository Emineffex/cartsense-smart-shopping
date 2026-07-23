import type { ProductProvider, ProviderOffer, ProviderQuery, StoreName } from "./types";

/**
 * Vijay Sales does not exist in the Supabase `stores` seed yet, so this
 * provider currently synthesizes offers by cloning-with-markup any product
 * matching the search. Once a scraper/API is wired up, replace `search()`
 * — the ProviderManager and consumers require no changes.
 */
export class VijaySalesProvider implements ProductProvider {
  readonly store: StoreName = "Vijay Sales";
  readonly enabled: boolean = true;

  async search(query: ProviderQuery): Promise<ProviderOffer[]> {
    const { supabase } = await import("@/integrations/supabase/client");
    let req = supabase
      .from("products")
      .select("id,name,brand,category,image,images,specs,rating,reviews_count,lowest_price,highest_price")
      .limit(query.limit ?? 40);
    if (query.q?.trim()) {
      const term = `%${query.q.trim()}%`;
      req = req.or(`name.ilike.${term},brand.ilike.${term}`);
    }
    if (query.category && query.category !== "All") req = req.eq("category", query.category);
    if (query.brand?.length) req = req.in("brand", query.brand);
    if (query.signal) req = req.abortSignal(query.signal);

    const { data, error } = await req;
    if (error) throw error;

    return (data ?? []).map((p) => {
      const base = Number(p.lowest_price);
      const price = Math.round(base * 1.02); // simulate slightly different pricing
      const original = Number(p.highest_price) || Math.round(price * 1.15);
      const specs = (p.specs && typeof p.specs === "object" ? p.specs : {}) as Record<string, string>;
      const images = Array.isArray(p.images) ? (p.images as string[]) : [];
      return {
        productKey: p.id,
        title: p.name,
        image: p.image,
        images,
        brand: p.brand,
        category: p.category,
        price,
        originalPrice: original,
        rating: Number(p.rating),
        reviewCount: p.reviews_count,
        store: this.store,
        productUrl: `https://www.vijaysales.com/search?q=${encodeURIComponent(p.name)}`,
        availability: "in_stock" as const,
        deliveryTime: "3-5 days",
        bankOffers: [{ bank: "ICICI Bank", description: "5% instant discount on ICICI cards", discount: 5 }],
        specifications: specs,
      };
    });
  }
}
