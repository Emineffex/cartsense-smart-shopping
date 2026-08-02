// Spec normalisation + heuristic ("AI-style") product insights used by the
// multi-product comparison. Pure client-side derivation from data already in
// the database (product.specs / offers / rating) — no schema changes needed.
import type { Product } from "@/lib/sample-data";

export interface SpecRow {
  key: string;
  label: string;
  /** higher numeric value = better ("max"), lower = better ("min"), or not comparable */
  better: "max" | "min" | "none";
  value: (p: Product) => string;
  numeric?: (p: Product) => number | null;
}

const specLookup = (p: Product, ...needles: string[]): string | null => {
  const entries = Object.entries(p.specs ?? {});
  for (const needle of needles) {
    const hit = entries.find(([k]) => k.toLowerCase().replace(/[^a-z]/g, "").includes(needle));
    if (hit && String(hit[1]).trim()) return String(hit[1]).trim();
  }
  return null;
};

const num = (s: string | null): number | null => {
  if (!s) return null;
  const m = s.replace(/,/g, "").match(/(\d+(\.\d+)?)/);
  return m ? Number(m[1]) : null;
};

const storageGb = (s: string | null): number | null => {
  const n = num(s);
  if (n === null) return null;
  return /tb/i.test(s ?? "") ? n * 1024 : n;
};

const dash = "—";

export const bestPriceOf = (p: Product) =>
  p.stores.length ? Math.min(...p.stores.map((s) => s.price)) : p.lowestPrice;

export const SPEC_ROWS: SpecRow[] = [
  {
    key: "price",
    label: "Best price",
    better: "min",
    value: (p) => `₹${Math.round(bestPriceOf(p)).toLocaleString("en-IN")}`,
    numeric: (p) => bestPriceOf(p) || null,
  },
  { key: "brand", label: "Brand", better: "none", value: (p) => p.brand || dash },
  { key: "category", label: "Category", better: "none", value: (p) => p.category || dash },
  { key: "display", label: "Display", better: "max", value: (p) => specLookup(p, "display", "screen") ?? dash, numeric: (p) => num(specLookup(p, "display", "screen")) },
  { key: "processor", label: "Processor", better: "none", value: (p) => specLookup(p, "processor", "chipset", "chip", "cpu") ?? dash },
  { key: "ram", label: "RAM", better: "max", value: (p) => specLookup(p, "ram", "memory") ?? dash, numeric: (p) => storageGb(specLookup(p, "ram", "memory")) },
  { key: "storage", label: "Storage", better: "max", value: (p) => specLookup(p, "storage", "ssd", "rom") ?? dash, numeric: (p) => storageGb(specLookup(p, "storage", "ssd", "rom")) },
  { key: "camera", label: "Camera", better: "max", value: (p) => specLookup(p, "camera", "rearcamera") ?? dash, numeric: (p) => num(specLookup(p, "camera", "rearcamera")) },
  { key: "battery", label: "Battery", better: "max", value: (p) => specLookup(p, "battery") ?? dash, numeric: (p) => num(specLookup(p, "battery")) },
  { key: "charging", label: "Charging", better: "max", value: (p) => specLookup(p, "charging", "charge") ?? dash, numeric: (p) => num(specLookup(p, "charging", "charge")) },
  { key: "os", label: "Operating system", better: "none", value: (p) => specLookup(p, "operatingsystem", "os", "software") ?? dash },
  { key: "weight", label: "Weight", better: "min", value: (p) => specLookup(p, "weight") ?? dash, numeric: (p) => num(specLookup(p, "weight")) },
  { key: "connectivity", label: "Connectivity", better: "none", value: (p) => specLookup(p, "connectivity", "network", "wireless") ?? dash },
  { key: "warranty", label: "Warranty", better: "none", value: (p) => specLookup(p, "warranty") ?? dash },
  {
    key: "stores",
    label: "Store availability",
    better: "max",
    value: (p) => (p.stores.length ? p.stores.map((s) => s.store).join(", ") : "Not in stock"),
    numeric: (p) => p.stores.length || null,
  },
  {
    key: "rating",
    label: "User rating",
    better: "max",
    value: (p) => (p.rating ? `${p.rating} ★ (${p.reviews.toLocaleString()})` : dash),
    numeric: (p) => p.rating || null,
  },
  {
    key: "discount",
    label: "Max discount",
    better: "max",
    value: (p) => (p.stores.length ? `${Math.max(...p.stores.map((s) => s.discount))}% off` : dash),
    numeric: (p) => (p.stores.length ? Math.max(...p.stores.map((s) => s.discount)) : null),
  },
];

/** index of the winning product for a row, or -1 */
export function bestIndex(row: SpecRow, products: Product[]): number {
  if (row.better === "none" || !row.numeric) return -1;
  let best = -1;
  let bestVal = row.better === "max" ? -Infinity : Infinity;
  products.forEach((p, i) => {
    const v = row.numeric!(p);
    if (v === null || !Number.isFinite(v)) return;
    if (row.better === "max" ? v > bestVal : v < bestVal) {
      bestVal = v;
      best = i;
    }
  });
  // no winner if everyone ties
  const values = products.map((p) => row.numeric!(p)).filter((v): v is number => v !== null);
  if (values.length < 2 || values.every((v) => v === bestVal)) return -1;
  return best;
}

export interface ProductInsight {
  pros: string[];
  cons: string[];
  bestFor: string;
  score: number; // 1-10
}

const specNum = (p: Product, row: string) => {
  const r = SPEC_ROWS.find((x) => x.key === row);
  return r?.numeric ? r.numeric(p) : null;
};

export function buildInsight(p: Product, all: Product[]): ProductInsight {
  const pros = [...(p.pros ?? [])];
  const cons = [...(p.cons ?? [])];
  const price = bestPriceOf(p);
  const prices = all.map(bestPriceOf).filter(Boolean);
  const cheapest = prices.length ? Math.min(...prices) : price;
  const dearest = prices.length ? Math.max(...prices) : price;

  const ram = specNum(p, "ram");
  const battery = specNum(p, "battery");
  const camera = specNum(p, "camera");
  const storage = specNum(p, "storage");
  const charging = specNum(p, "charging");

  const maxOf = (k: string) => {
    const vals = all.map((x) => specNum(x, k)).filter((v): v is number => v !== null);
    return vals.length ? Math.max(...vals) : null;
  };

  if (price === cheapest && all.length > 1) pros.push("Lowest price in this comparison");
  if (p.rating >= 4.5) pros.push(`Strong ${p.rating}★ user rating`);
  if (ram && ram === maxOf("ram")) pros.push(`Most RAM (${ram} GB)`);
  if (storage && storage === maxOf("storage")) pros.push("Largest storage capacity");
  if (battery && battery === maxOf("battery")) pros.push("Biggest battery");
  if (camera && camera === maxOf("camera")) pros.push("Highest resolution camera");
  if (charging && charging === maxOf("charging")) pros.push("Fastest charging");
  if (p.stores.length >= 3) pros.push(`Available at ${p.stores.length} stores`);

  if (price === dearest && all.length > 1 && dearest !== cheapest) cons.push("Most expensive option here");
  if (p.rating > 0 && p.rating < 4) cons.push("Below-average user rating");
  if (p.stores.length <= 1) cons.push("Limited store availability");
  if (ram !== null && maxOf("ram") && ram < (maxOf("ram") as number)) cons.push("Less RAM than the best in this list");
  if (battery !== null && maxOf("battery") && battery < (maxOf("battery") as number)) cons.push("Smaller battery than rivals");

  // Best for
  let bestFor = "Everyday all-round use";
  if (price === cheapest && all.length > 1) bestFor = "Budget-conscious buyers";
  if (camera && camera === maxOf("camera")) bestFor = "Photography and content creation";
  if (battery && battery === maxOf("battery")) bestFor = "Heavy users who need all-day battery";
  if (ram && ram === maxOf("ram")) bestFor = "Power users, gaming and multitasking";

  // Score 1-10: rating (60%) + value (25%) + availability/discount (15%)
  const ratingScore = (p.rating || 3.8) / 5;
  const valueSpan = Math.max(dearest - cheapest, 1);
  const valueScore = dearest === cheapest ? 0.7 : 1 - (price - cheapest) / valueSpan;
  const discount = p.stores.length ? Math.max(...p.stores.map((s) => s.discount)) : 0;
  const extraScore = Math.min(p.stores.length / 4, 1) * 0.6 + Math.min(discount / 40, 1) * 0.4;
  const score = ratingScore * 6 + valueScore * 2.5 + extraScore * 1.5;

  return {
    pros: Array.from(new Set(pros)).slice(0, 4),
    cons: Array.from(new Set(cons)).slice(0, 3),
    bestFor,
    score: Math.max(1, Math.min(10, Math.round(score * 10) / 10)),
  };
}

export type BadgeKey =
  | "Best Camera"
  | "Best Battery"
  | "Best Performance"
  | "Best Display"
  | "Best Value"
  | "Best Overall";

/** Map product id -> badges it wins. */
export function computeBadges(products: Product[], insights: ProductInsight[]): Record<string, BadgeKey[]> {
  const out: Record<string, BadgeKey[]> = {};
  const give = (i: number, badge: BadgeKey) => {
    if (i < 0 || !products[i]) return;
    (out[products[i].id] ??= []).push(badge);
  };
  const winner = (key: string, better: "max" | "min" = "max") => {
    const row = SPEC_ROWS.find((r) => r.key === key);
    if (!row) return -1;
    return bestIndex({ ...row, better }, products);
  };

  if (products.length < 2) return out;
  give(winner("camera"), "Best Camera");
  give(winner("battery"), "Best Battery");
  give(winner("ram"), "Best Performance");
  give(winner("display"), "Best Display");

  // Best value: highest score-per-rupee
  let valueIdx = -1;
  let valueBest = -Infinity;
  products.forEach((p, i) => {
    const price = bestPriceOf(p) || 1;
    const v = insights[i].score / price;
    if (v > valueBest) { valueBest = v; valueIdx = i; }
  });
  give(valueIdx, "Best Value");

  let overallIdx = -1;
  let overallBest = -Infinity;
  insights.forEach((ins, i) => {
    if (ins.score > overallBest) { overallBest = ins.score; overallIdx = i; }
  });
  give(overallIdx, "Best Overall");

  return out;
}
