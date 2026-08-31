/**
 * Affiliate link resolution.
 *
 * Precedence: affiliate_url -> canonical_product_url -> url -> "#".
 * Both new columns are optional, so older rows (and providers that don't
 * supply them) keep working exactly as before.
 */
export interface OfferLinkFields {
  affiliate_url?: string | null;
  canonical_product_url?: string | null;
  url?: string | null;
}

const clean = (v: string | null | undefined): string | null => {
  const s = typeof v === "string" ? v.trim() : "";
  if (!s || s === "#") return null;
  return s;
};

/** Amazon Associates tracking ID for CartSense (public identifier, not a secret). */
export const AMAZON_ASSOCIATES_TAG = "cartsense00-21";

const AMAZON_HOST = /(^|\.)amazon\.[a-z.]{2,6}$|(^|\.)amzn\.to$/i;

export function isAmazonUrl(url: string): boolean {
  try {
    return AMAZON_HOST.test(new URL(url).hostname);
  } catch {
    return false;
  }
}

/**
 * Attach (or replace) the Amazon Associates tag on an Amazon URL.
 * Non-Amazon URLs and unparseable input are returned untouched.
 */
export function withAmazonAffiliateTag(url: string, tag = AMAZON_ASSOCIATES_TAG): string {
  const s = clean(url);
  if (!s) return url;
  try {
    const u = new URL(s);
    if (!AMAZON_HOST.test(u.hostname)) return url;
    u.searchParams.set("tag", tag);
    if (!u.searchParams.has("ascsubtag")) u.searchParams.set("ascsubtag", "cartsense");
    return u.toString();
  } catch {
    return url; // fail safe: keep the original valid URL
  }
}

export function resolveOfferUrl(offer: OfferLinkFields, fallback = "#"): string {
  const resolved =
    clean(offer.affiliate_url) ??
    clean(offer.canonical_product_url) ??
    clean(offer.url);
  if (!resolved) return fallback;
  return withAmazonAffiliateTag(resolved);
}

/** Column list shared by catalog + provider selects. */
export const OFFER_LINK_COLUMNS = "url,affiliate_url,canonical_product_url";

