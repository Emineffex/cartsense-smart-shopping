import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

// ------------- Dashboard stats -------------

export function useAdminStats() {
  return useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const [users, searches, alerts, wishlist] = await Promise.all([
        supabase.from("profiles").select("id", { count: "exact", head: true }),
        supabase.from("search_events").select("id", { count: "exact", head: true }),
        supabase.from("price_alerts").select("id", { count: "exact", head: true }),
        supabase.from("wishlists").select("id", { count: "exact", head: true }),
      ]);
      return {
        totalUsers: users.count ?? 0,
        totalSearches: searches.count ?? 0,
        totalAlerts: alerts.count ?? 0,
        totalWishlist: wishlist.count ?? 0,
      };
    },
  });
}

// ------------- Featured deals -------------

export interface FeaturedDeal {
  id: string;
  title: string;
  description: string | null;
  image_url: string | null;
  url: string | null;
  product_id: string | null;
  starts_at: string | null;
  expires_at: string | null;
  is_active: boolean;
}

export function useFeaturedDeals() {
  return useQuery({
    queryKey: ["admin", "deals"],
    queryFn: async (): Promise<FeaturedDeal[]> => {
      const { data, error } = await supabase
        .from("featured_deals")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as FeaturedDeal[];
    },
  });
}

export function useSaveDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (deal: Partial<FeaturedDeal> & { id?: string }) => {
      const payload = {
        title: deal.title ?? "",
        description: deal.description ?? null,
        image_url: deal.image_url ?? null,
        url: deal.url ?? null,
        product_id: deal.product_id ?? null,
        starts_at: deal.starts_at ?? null,
        expires_at: deal.expires_at ?? null,
        is_active: deal.is_active ?? true,
      };
      if (deal.id) {
        const { error } = await supabase.from("featured_deals").update(payload).eq("id", deal.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("featured_deals").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "deals"] }),
  });
}

export function useDeleteDeal() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("featured_deals").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "deals"] }),
  });
}

// ------------- Coupons -------------

export interface Coupon {
  id: string;
  code: string;
  store_id: string | null;
  title: string | null;
  discount: string | null;
  expires_at: string | null;
  is_active: boolean;
}

export function useCoupons() {
  return useQuery({
    queryKey: ["admin", "coupons"],
    queryFn: async (): Promise<Coupon[]> => {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Coupon[];
    },
  });
}

export function useSaveCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (c: Partial<Coupon> & { id?: string }) => {
      const payload = {
        code: c.code ?? "",
        store_id: c.store_id ?? null,
        title: c.title ?? null,
        discount: c.discount ?? null,
        expires_at: c.expires_at ?? null,
        is_active: c.is_active ?? true,
      };
      if (c.id) {
        const { error } = await supabase.from("coupons").update(payload).eq("id", c.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("coupons").insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "coupons"] }),
  });
}

export function useDeleteCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("coupons").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "coupons"] }),
  });
}

// ------------- Stores -------------

export interface AdminStore {
  id: string;
  name: string;
  slug: string;
  tagline: string | null;
  affiliate_url: string | null;
  is_active: boolean;
}

export function useAdminStores() {
  return useQuery({
    queryKey: ["admin", "stores"],
    queryFn: async (): Promise<AdminStore[]> => {
      const { data, error } = await supabase
        .from("stores")
        .select("id,name,slug,tagline,affiliate_url,is_active")
        .order("name");
      if (error) throw error;
      return data as AdminStore[];
    },
  });
}

export function useSaveStore() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (s: Pick<AdminStore, "id" | "affiliate_url" | "is_active">) => {
      const { error } = await supabase
        .from("stores")
        .update({ affiliate_url: s.affiliate_url, is_active: s.is_active })
        .eq("id", s.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin", "stores"] }),
  });
}

// ------------- Analytics -------------

export function useMostSearched(limit = 10) {
  return useQuery({
    queryKey: ["admin", "most-searched", limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("search_events")
        .select("query")
        .order("created_at", { ascending: false })
        .limit(2000);
      if (error) throw error;
      const counts = new Map<string, number>();
      for (const row of data ?? []) {
        const key = (row.query ?? "").trim().toLowerCase();
        if (!key) continue;
        counts.set(key, (counts.get(key) ?? 0) + 1);
      }
      return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([query, count]) => ({ query, count }));
    },
  });
}

export function useTopStoresByClicks(limit = 10) {
  return useQuery({
    queryKey: ["admin", "top-stores", limit],
    queryFn: async () => {
      const [{ data: clicks, error: e1 }, { data: stores, error: e2 }] = await Promise.all([
        supabase.from("store_clicks").select("store_id").limit(5000),
        supabase.from("stores").select("id,name"),
      ]);
      if (e1) throw e1;
      if (e2) throw e2;
      const nameById = new Map((stores ?? []).map((s) => [s.id as string, s.name as string]));
      const counts = new Map<string, number>();
      for (const c of clicks ?? []) {
        const id = c.store_id as string;
        counts.set(id, (counts.get(id) ?? 0) + 1);
      }
      return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([id, count]) => ({ storeId: id, name: nameById.get(id) ?? "Unknown", count }));
    },
  });
}
