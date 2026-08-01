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

export function resolveOfferUrl(offer: OfferLinkFields, fallback = "#"): string {
  return (
    clean(offer.affiliate_url) ??
    clean(offer.canonical_product_url) ??
    clean(offer.url) ??
    fallback
  );
}

/** Column list shared by catalog + provider selects. */
export const OFFER_LINK_COLUMNS = "url,affiliate_url,canonical_product_url";
