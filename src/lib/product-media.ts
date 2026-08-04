// Media resolution + caching rules for product photos and 3D models.
// Keeps every surface (details, compare, quick preview) consistent.

import { isUsableProductImage, usableProductImages } from "@/lib/product-image";

export interface ProductMediaSource {
  image?: string | null;
  images?: string[] | null;
  modelUrl?: string | null;
  modelPosterUrl?: string | null;
}

const MODEL_EXT = [".glb", ".gltf"];

/** A model URL is only usable when it is an absolute/rooted glb|gltf asset. */
export function isUsableModelUrl(src?: string | null): boolean {
  if (!src) return false;
  const url = src.trim().toLowerCase();
  if (!url) return false;
  if (!/^https?:\/\//.test(url) && !url.startsWith("/")) return false;
  const path = url.split("?")[0]!.split("#")[0]!;
  return MODEL_EXT.some((ext) => path.endsWith(ext));
}

export interface ResolvedMedia {
  images: string[];
  modelUrl: string | null;
  poster: string | null;
  /** What the gallery should open with. */
  primary: "model" | "image" | "placeholder";
}

export function resolveProductMedia(product: ProductMediaSource): ResolvedMedia {
  const images = usableProductImages(product);
  const modelUrl = isUsableModelUrl(product.modelUrl) ? product.modelUrl!.trim() : null;
  const poster = isUsableProductImage(product.modelPosterUrl)
    ? product.modelPosterUrl!.trim()
    : (images[0] ?? null);
  return {
    images,
    modelUrl,
    poster,
    primary: modelUrl ? "model" : images.length ? "image" : "placeholder",
  };
}

/* ---------------------------------------------------------------- caching */

const STORAGE_KEY = "cartsense:media-cache:v1";
const MAX_ENTRIES = 400;

type Status = "ok" | "failed";

const memory = new Map<string, Status>();
let hydrated = false;

function hydrate() {
  if (hydrated || typeof window === "undefined") return;
  hydrated = true;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return;
    const parsed = JSON.parse(raw) as Record<string, Status>;
    for (const [k, v] of Object.entries(parsed)) memory.set(k, v);
  } catch {
    /* cache is best-effort */
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    const entries = [...memory.entries()].slice(-MAX_ENTRIES);
    memory.clear();
    for (const [k, v] of entries) memory.set(k, v);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(Object.fromEntries(entries)));
  } catch {
    /* quota / private mode — ignore */
  }
}

/** "ok" = loaded before (render instantly, skip blur-up), "failed" = go straight to fallback. */
export function getMediaStatus(url?: string | null): Status | undefined {
  if (!url) return undefined;
  hydrate();
  return memory.get(url);
}

export function setMediaStatus(url: string | null | undefined, status: Status) {
  if (!url) return;
  hydrate();
  if (memory.get(url) === status) return;
  memory.set(url, status);
  persist();
}

/** Warm the browser cache for gallery frames without blocking the main image. */
export function prefetchImages(urls: string[]) {
  if (typeof window === "undefined") return;
  for (const url of urls) {
    if (!isUsableProductImage(url) || getMediaStatus(url)) continue;
    const img = new Image();
    img.decoding = "async";
    img.onload = () => setMediaStatus(url, "ok");
    img.onerror = () => setMediaStatus(url, "failed");
    img.src = url;
  }
}

/** Mobile/low-power devices should not auto-download heavy 3D assets. */
export function shouldAutoLoadModel(): boolean {
  if (typeof window === "undefined") return false;
  const nav = navigator as Navigator & {
    connection?: { saveData?: boolean; effectiveType?: string };
    deviceMemory?: number;
  };
  if (nav.connection?.saveData) return false;
  if (nav.connection?.effectiveType && /2g|slow/.test(nav.connection.effectiveType)) return false;
  if (typeof nav.deviceMemory === "number" && nav.deviceMemory <= 2) return false;
  return window.innerWidth >= 768;
}
