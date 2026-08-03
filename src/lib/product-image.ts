// Central rules for deciding whether a product image is a REAL product photo.
// Stock/random photo services (picsum, unsplash, placeholder generators) produce
// unrelated landscape imagery — we never show those. Callers fall back to a
// clean branded "Image coming soon" placeholder instead.

const BLOCKED_HOST_FRAGMENTS = [
  "picsum.photos",
  "unsplash.com",
  "loremflickr",
  "placehold",
  "placeholder.com",
  "dummyimage",
  "placekitten",
  "example.com",
  "lorempixel",
  "fakeimg",
];

export function isUsableProductImage(src?: string | null): boolean {
  if (!src) return false;
  const url = src.trim();
  if (!url) return false;
  if (url.startsWith("data:image/")) return true;
  const lower = url.toLowerCase();
  if (!/^https?:\/\//.test(lower) && !lower.startsWith("/")) return false;
  return !BLOCKED_HOST_FRAGMENTS.some((frag) => lower.includes(frag));
}

/** All real, de-duplicated images for a product (main image first). */
export function usableProductImages(product: {
  image?: string | null;
  images?: string[] | null;
}): string[] {
  const all = [product.image ?? "", ...(product.images ?? [])];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const src of all) {
    if (!isUsableProductImage(src)) continue;
    const key = src.trim();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(key);
  }
  return out;
}

export type ViewerMode = "spin" | "parallax" | "none";

/** Pseudo-360 needs enough frames to read as rotation; otherwise tilt or nothing. */
export function viewerModeFor(images: string[]): ViewerMode {
  if (images.length >= 4) return "spin";
  if (images.length >= 1) return "parallax";
  return "none";
}

/** Deterministic hue so a product's placeholder is stable across renders. */
export function placeholderHue(seed: string): number {
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) % 360;
  return h;
}
