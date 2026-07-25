import { supabase } from "@/integrations/supabase/client";

export async function logSearch(query: string, resultsCount: number, userId?: string | null) {
  const q = query.trim();
  if (!q) return;
  try {
    await supabase.from("search_events").insert({
      query: q,
      results_count: resultsCount,
      user_id: userId ?? null,
    });
  } catch {
    /* no-op */
  }
}

export async function logStoreClick(storeId: string, productId?: string, userId?: string | null) {
  try {
    await supabase.from("store_clicks").insert({
      store_id: storeId,
      product_id: productId ?? null,
      user_id: userId ?? null,
    });
  } catch {
    /* no-op */
  }
}

function getSessionId(): string {
  if (typeof window === "undefined") return "";
  try {
    let sid = window.sessionStorage.getItem("cs_session_id");
    if (!sid) {
      sid = (crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`);
      window.sessionStorage.setItem("cs_session_id", sid);
    }
    return sid;
  } catch {
    return "";
  }
}

export interface AffiliateClickInput {
  storeId: string;
  productId?: string | null;
  provider?: string | null;
  destinationUrl?: string | null;
  userId?: string | null;
}

/**
 * Fire-and-forget affiliate click log. Safe to call from onClick handlers
 * right before the browser follows the outbound link — the insert races the
 * navigation but keepalive-like behavior is provided by the fact that anchor
 * clicks with target="_blank" don't unload the current page.
 */
export function logAffiliateClick(input: AffiliateClickInput): void {
  if (!input.storeId) return;
  try {
    void supabase.from("affiliate_clicks").insert({
      store_id: input.storeId,
      product_id: input.productId ?? null,
      user_id: input.userId ?? null,
      provider: input.provider ?? null,
      destination_url: input.destinationUrl ?? null,
      session_id: getSessionId() || null,
    });
  } catch {
    /* no-op */
  }
}
