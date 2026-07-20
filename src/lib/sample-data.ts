export type Store = "Amazon" | "Flipkart" | "Croma" | "Reliance Digital";

export interface StorePrice {
  store: Store;
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
}

const img = (seed: string, w = 600, h = 600) =>
  `https://picsum.photos/seed/${seed}/${w}/${h}`;

export const products: Product[] = [
  {
    id: "iphone-15-pro",
    name: "Apple iPhone 15 Pro (256GB, Natural Titanium)",
    brand: "Apple",
    category: "Smartphones",
    image: img("iphone15pro"),
    images: [img("iphone15pro-1"), img("iphone15pro-2"), img("iphone15pro-3"), img("iphone15pro-4")],
    lowestPrice: 128999,
    highestPrice: 139900,
    rating: 4.7,
    reviews: 12483,
    specs: {
      Display: "6.1\" Super Retina XDR",
      Processor: "Apple A17 Pro",
      RAM: "8 GB",
      Storage: "256 GB",
      Camera: "48MP + 12MP + 12MP",
      Battery: "3274 mAh",
      OS: "iOS 17",
    },
    pros: ["Titanium build feels premium", "Class-leading performance", "Excellent camera system", "USB-C finally"],
    cons: ["Expensive", "No charger in box", "Heats up under load"],
    stores: [
      { store: "Amazon", price: 128999, originalPrice: 139900, discount: 8, rating: 4.6, reviews: 8421, delivery: "Tomorrow", bankOffer: "10% off with HDFC Card", bestDeal: true, url: "#" },
      { store: "Flipkart", price: 129900, originalPrice: 139900, discount: 7, rating: 4.7, reviews: 3120, delivery: "2 days", bankOffer: "5% cashback with Axis", url: "#" },
      { store: "Croma", price: 134900, originalPrice: 139900, discount: 4, rating: 4.5, reviews: 542, delivery: "3 days", bankOffer: "No cost EMI available", url: "#" },
      { store: "Reliance Digital", price: 132900, originalPrice: 139900, discount: 5, rating: 4.5, reviews: 400, delivery: "2-4 days", bankOffer: "₹5000 off on exchange", url: "#" },
    ],
  },
  {
    id: "sony-wh1000xm5",
    name: "Sony WH-1000XM5 Wireless Noise Cancelling Headphones",
    brand: "Sony",
    category: "Audio",
    image: img("sonyxm5"),
    images: [img("sonyxm5-1"), img("sonyxm5-2"), img("sonyxm5-3")],
    lowestPrice: 24990,
    highestPrice: 29990,
    rating: 4.6,
    reviews: 8321,
    specs: {
      Type: "Over-ear",
      "Battery Life": "30 hours",
      "Noise Cancelling": "Yes, industry-leading",
      Connectivity: "Bluetooth 5.2, 3.5mm",
      Weight: "250g",
      "Fast Charging": "3 hrs in 3 min",
    },
    pros: ["Best-in-class ANC", "Comfortable for long sessions", "Excellent call quality"],
    cons: ["Not foldable", "Case is bulky"],
    stores: [
      { store: "Amazon", price: 24990, originalPrice: 29990, discount: 17, rating: 4.6, reviews: 5210, delivery: "Tomorrow", bankOffer: "10% off with SBI Card", bestDeal: true, url: "#" },
      { store: "Flipkart", price: 25999, originalPrice: 29990, discount: 13, rating: 4.5, reviews: 2100, delivery: "2 days", bankOffer: "5% off with Flipkart Axis", url: "#" },
      { store: "Croma", price: 27990, originalPrice: 29990, discount: 7, rating: 4.4, reviews: 320, delivery: "3 days", bankOffer: "No cost EMI 6 months", url: "#" },
      { store: "Reliance Digital", price: 26990, originalPrice: 29990, discount: 10, rating: 4.5, reviews: 210, delivery: "2-4 days", bankOffer: "₹2000 off on exchange", url: "#" },
    ],
  },
  {
    id: "macbook-air-m3",
    name: "Apple MacBook Air M3 (13-inch, 8GB, 256GB)",
    brand: "Apple",
    category: "Laptops",
    image: img("mba-m3"),
    images: [img("mba-m3-1"), img("mba-m3-2"), img("mba-m3-3")],
    lowestPrice: 99900,
    highestPrice: 114900,
    rating: 4.8,
    reviews: 5210,
    specs: {
      Chip: "Apple M3",
      Display: "13.6\" Liquid Retina",
      RAM: "8 GB",
      Storage: "256 GB SSD",
      Battery: "Up to 18 hours",
      Weight: "1.24 kg",
    },
    pros: ["Silent fanless design", "Insane battery life", "Vibrant display"],
    cons: ["Only 2 ports", "8GB feels tight"],
    stores: [
      { store: "Amazon", price: 99900, originalPrice: 114900, discount: 13, rating: 4.8, reviews: 3200, delivery: "Tomorrow", bankOffer: "10% off with ICICI Card", bestDeal: true, url: "#" },
      { store: "Flipkart", price: 101990, originalPrice: 114900, discount: 11, rating: 4.7, reviews: 1420, delivery: "2 days", bankOffer: "5% cashback with Axis", url: "#" },
      { store: "Croma", price: 109900, originalPrice: 114900, discount: 4, rating: 4.6, reviews: 320, delivery: "3 days", bankOffer: "No cost EMI 12 months", url: "#" },
      { store: "Reliance Digital", price: 104900, originalPrice: 114900, discount: 9, rating: 4.6, reviews: 270, delivery: "2-4 days", bankOffer: "₹7000 off on exchange", url: "#" },
    ],
  },
  {
    id: "samsung-s24-ultra",
    name: "Samsung Galaxy S24 Ultra (12GB, 256GB, Titanium Black)",
    brand: "Samsung",
    category: "Smartphones",
    image: img("s24ultra"),
    images: [img("s24ultra-1"), img("s24ultra-2"), img("s24ultra-3")],
    lowestPrice: 121999,
    highestPrice: 134999,
    rating: 4.6,
    reviews: 9420,
    specs: {
      Display: "6.8\" QHD+ Dynamic AMOLED 2X",
      Processor: "Snapdragon 8 Gen 3",
      RAM: "12 GB",
      Storage: "256 GB",
      Camera: "200MP + 50MP + 12MP + 10MP",
      Battery: "5000 mAh",
    },
    pros: ["Best-in-class zoom camera", "Bright display", "S Pen included"],
    cons: ["Bulky", "Slow charging"],
    stores: [
      { store: "Amazon", price: 122999, originalPrice: 134999, discount: 9, rating: 4.6, reviews: 4200, delivery: "Tomorrow", bankOffer: "10% off with HDFC Card", url: "#" },
      { store: "Flipkart", price: 121999, originalPrice: 134999, discount: 10, rating: 4.6, reviews: 3120, delivery: "2 days", bankOffer: "5% cashback with Axis", bestDeal: true, url: "#" },
      { store: "Croma", price: 129999, originalPrice: 134999, discount: 4, rating: 4.5, reviews: 542, delivery: "3 days", bankOffer: "No cost EMI 9 months", url: "#" },
      { store: "Reliance Digital", price: 126999, originalPrice: 134999, discount: 6, rating: 4.5, reviews: 400, delivery: "2-4 days", bankOffer: "₹6000 off on exchange", url: "#" },
    ],
  },
  {
    id: "dyson-v15",
    name: "Dyson V15 Detect Absolute Cordless Vacuum",
    brand: "Dyson",
    category: "Home Appliances",
    image: img("dysonv15"),
    images: [img("dysonv15-1"), img("dysonv15-2"), img("dysonv15-3")],
    lowestPrice: 62900,
    highestPrice: 74900,
    rating: 4.5,
    reviews: 2130,
    specs: {
      "Suction Power": "230 AW",
      "Battery Life": "Up to 60 min",
      "Bin Volume": "0.77 L",
      Weight: "3.1 kg",
      Filtration: "Whole-machine HEPA",
    },
    pros: ["Laser reveals hidden dust", "Powerful suction", "LCD screen"],
    cons: ["Premium price", "Trigger-style grip tires hand"],
    stores: [
      { store: "Amazon", price: 62900, originalPrice: 74900, discount: 16, rating: 4.5, reviews: 900, delivery: "Tomorrow", bankOffer: "10% off with HDFC Card", bestDeal: true, url: "#" },
      { store: "Flipkart", price: 64900, originalPrice: 74900, discount: 13, rating: 4.5, reviews: 620, delivery: "2 days", bankOffer: "5% cashback with Axis", url: "#" },
      { store: "Croma", price: 69900, originalPrice: 74900, discount: 7, rating: 4.4, reviews: 210, delivery: "3 days", bankOffer: "No cost EMI 6 months", url: "#" },
      { store: "Reliance Digital", price: 67900, originalPrice: 74900, discount: 9, rating: 4.4, reviews: 180, delivery: "2-4 days", bankOffer: "₹3000 off on exchange", url: "#" },
    ],
  },
  {
    id: "boat-airdopes-141",
    name: "boAt Airdopes 141 True Wireless Earbuds",
    brand: "boAt",
    category: "Audio",
    image: img("boat141"),
    images: [img("boat141-1"), img("boat141-2")],
    lowestPrice: 1099,
    highestPrice: 2999,
    rating: 4.1,
    reviews: 32100,
    specs: {
      "Battery Life": "42 hours total",
      Driver: "8mm",
      Connectivity: "Bluetooth 5.1",
      "Water Resistance": "IPX4",
    },
    pros: ["Excellent value", "Long battery life", "Low latency mode"],
    cons: ["Average call quality", "No ANC"],
    stores: [
      { store: "Amazon", price: 1099, originalPrice: 2999, discount: 63, rating: 4.1, reviews: 18200, delivery: "Tomorrow", bankOffer: "5% off with SBI Card", bestDeal: true, url: "#" },
      { store: "Flipkart", price: 1199, originalPrice: 2999, discount: 60, rating: 4.1, reviews: 12100, delivery: "2 days", bankOffer: "Flipkart Axis 5%", url: "#" },
      { store: "Croma", price: 1499, originalPrice: 2999, discount: 50, rating: 4.0, reviews: 810, delivery: "3 days", bankOffer: "No cost EMI available", url: "#" },
      { store: "Reliance Digital", price: 1399, originalPrice: 2999, discount: 53, rating: 4.0, reviews: 620, delivery: "2-4 days", bankOffer: "₹200 instant discount", url: "#" },
    ],
  },
];

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

export const getProduct = (id: string) => products.find((p) => p.id === id) ?? products[0];
