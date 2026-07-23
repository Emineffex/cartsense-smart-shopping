import { useQuery } from "@tanstack/react-query";
import type { MergedProduct, ProductProvider, ProviderOffer, ProviderQuery, StoreName } from "./types";
import { AmazonProvider } from "./amazon";
import { FlipkartProvider } from "./flipkart";
import { CromaProvider } from "./croma";
import { RelianceDigitalProvider } from "./reliance";
import { VijaySalesProvider } from "./vijaysales";

export interface ProviderRunResult {
  products: MergedProduct[];
  errors: { store: StoreName; error: unknown }[];
}

/**
 * Fans a single query out to every registered provider in parallel,
 * tolerates individual provider failures, and merges duplicate products
 * (same `productKey`) into one `MergedProduct` with a combined offers list.
 *
 * Designed to be background-job friendly: `search()` is pure I/O and takes
 * an AbortSignal, so it can be reused from a Supabase edge function or
 * cron worker to refresh the catalog on a schedule.
 */
export class ProviderManager {
  private readonly providers: ProductProvider[];

  constructor(providers?: ProductProvider[]) {
    this.providers =
      providers ??
      [
        new AmazonProvider(),
        new FlipkartProvider(),
        new CromaProvider(),
        new RelianceDigitalProvider(),
        new VijaySalesProvider(),
      ];
  }

  get registered(): StoreName[] {
    return this.providers.filter((p) => p.enabled).map((p) => p.store);
  }

  async search(query: ProviderQuery): Promise<ProviderRunResult> {
    const active = this.providers.filter((p) => p.enabled);
    const settled = await Promise.allSettled(active.map((p) => p.search(query)));

    const errors: ProviderRunResult["errors"] = [];
    const allOffers: ProviderOffer[] = [];
    settled.forEach((res, i) => {
      if (res.status === "fulfilled") {
        allOffers.push(...res.value);
      } else {
        // One provider failing must never take down the search page.
        errors.push({ store: active[i].store, error: res.reason });
        // eslint-disable-next-line no-console
        console.warn(`[ProviderManager] ${active[i].store} failed:`, res.reason);
      }
    });

    return { products: mergeOffers(allOffers), errors };
  }
}

/** Merge offers sharing the same `productKey` into a single product. */
export function mergeOffers(offers: ProviderOffer[]): MergedProduct[] {
  const byKey = new Map<string, MergedProduct>();
  for (const offer of offers) {
    const existing = byKey.get(offer.productKey);
    if (existing) {
      existing.offers.push(offer);
      existing.lowestPrice = Math.min(existing.lowestPrice, offer.price);
      existing.highestPrice = Math.max(existing.highestPrice, offer.originalPrice, offer.price);
      // Prefer the richer image / spec set if this offer has more info.
      if (!existing.image && offer.image) existing.image = offer.image;
      if (offer.images?.length && offer.images.length > existing.images.length) existing.images = offer.images;
      if (Object.keys(offer.specifications).length > Object.keys(existing.specifications).length) {
        existing.specifications = offer.specifications;
      }
    } else {
      byKey.set(offer.productKey, {
        key: offer.productKey,
        title: offer.title,
        image: offer.image,
        images: offer.images ?? [],
        brand: offer.brand ?? "",
        category: offer.category ?? "",
        rating: offer.rating,
        reviewCount: offer.reviewCount,
        lowestPrice: offer.price,
        highestPrice: Math.max(offer.originalPrice, offer.price),
        specifications: offer.specifications,
        offers: [offer],
      });
    }
  }
  // Sort each product's offers cheapest first & flag best deal implicitly by order.
  for (const p of byKey.values()) {
    p.offers.sort((a, b) => a.price - b.price);
  }
  return Array.from(byKey.values());
}

/** Shared singleton for app-side callers. Edge/cron workers should instantiate their own. */
export const providerManager = new ProviderManager();

export function useProviderSearch(query: ProviderQuery) {
  return useQuery({
    queryKey: ["provider-search", query],
    queryFn: ({ signal }) => providerManager.search({ ...query, signal }),
    staleTime: 60_000,
  });
}
