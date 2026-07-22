// Shared types + static UI constants (brands, categories, FAQ, stores).
// Product/offer data now comes from Lovable Cloud — see src/services/catalog.ts.

export type Store = "Amazon" | "Flipkart" | "Croma" | "Reliance Digital";

export interface StorePrice {
  store: Store;
  storeId?: string;
  price: number;
  originalPrice: number;
  discount: number;
  rating: number;
  reviews: number;
  delivery: string;
  bankOffer: string;
  bestDeal?: boolean;
  url: string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  image: string;
  images: string[];
  lowestPrice: number;
  highestPrice: number;
  rating: number;
  reviews: number;
  specs: Record<string, string>;
  pros: string[];
  cons: string[];
  stores: StorePrice[];
  createdAt?: string | null;
}

export const categories = [
  "All",
  "Smartphones",
  "Laptops",
  "Audio",
  "Home Appliances",
  "TVs",
  "Wearables",
];

export const brands = ["Apple", "Samsung", "Sony", "boAt", "Dyson", "OnePlus", "Xiaomi"];

export const supportedStores: { name: Store; tagline: string }[] = [
  { name: "Amazon", tagline: "Fastest delivery" },
  { name: "Flipkart", tagline: "Big billion deals" },
  { name: "Croma", tagline: "Retail experience" },
  { name: "Reliance Digital", tagline: "Exchange offers" },
];

export const faqs = [
  { q: "How does CartSense find the best price?", a: "We scan across supported stores in real-time and normalize offers, coupons and bank discounts so you see the true landed price." },
  { q: "Is CartSense free to use?", a: "Yes — the core price comparison and alerts are free. Premium plans add unlimited alerts and price history charts." },
  { q: "Which stores do you support?", a: "Currently Amazon, Flipkart, Croma and Reliance Digital. More stores are being added every month." },
  { q: "How do price alerts work?", a: "Save a product to your dashboard and pick a target price. We'll notify you the moment any store crosses that threshold." },
  { q: "Do you sell products directly?", a: "No. CartSense is a neutral comparison layer — you'll always check out on the retailer's own site." },
];
