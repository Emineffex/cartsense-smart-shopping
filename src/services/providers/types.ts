// Standardized product-provider contracts.
// A "provider" abstracts one source of product/offer data (a retailer,
// a scraping service, or — today — our own Supabase catalog filtered by store).
// Real HTTP-backed providers can be swapped in later without touching callers.

export type StoreName =
  | "Amazon"
  | "Flipkart"
  | "Croma"
  | "Reliance Digital"
  | "Vijay Sales";

export interface BankOffer {
  bank: string;
  description: string;
  discount?: number;
}

export interface ProviderOffer {
  /** Stable id of the product across providers (SKU / model / normalized name). */
  productKey: string;
  title: string;
  image: string;
  images?: string[];
  brand?: string;
  category?: string;
  price: number;
  originalPrice: number;
  rating: number;
  reviewCount: number;
  store: StoreName;
  storeId?: string;
  productUrl: string;
  availability: "in_stock" | "out_of_stock" | "limited";
  deliveryTime: string;
  bankOffers: BankOffer[];
  specifications: Record<string, string>;
}

export interface ProviderQuery {
  q?: string;
  category?: string;
  brand?: string[];
  limit?: number;
  signal?: AbortSignal;
}

export interface ProductProvider {
  readonly store: StoreName;
  readonly enabled: boolean;
  search(query: ProviderQuery): Promise<ProviderOffer[]>;
}

/** Result of merging offers from multiple providers for a single product. */
export interface MergedProduct {
  key: string;
  title: string;
  image: string;
  images: string[];
  brand: string;
  category: string;
  rating: number;
  reviewCount: number;
  lowestPrice: number;
  highestPrice: number;
  specifications: Record<string, string>;
  offers: ProviderOffer[];
}
