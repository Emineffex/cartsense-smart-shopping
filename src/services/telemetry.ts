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
