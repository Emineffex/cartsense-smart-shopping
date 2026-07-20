import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/sample-data";
import { useAuth } from "@/hooks/use-auth";

interface UserProductRow {
  product_id: string;
  products: {
    id: string;
    name: string;
    brand: string;
    category: string;
    image: string;
    lowest_price: number;
    highest_price: number;
    rating: number;
    reviews_count: number;
  } | null;
}

export interface WishlistItem {
  productId: string;
  product: Pick<Product, "id" | "name" | "brand" | "category" | "image" | "lowestPrice" | "highestPrice" | "rating" | "reviews">;
}

export interface AlertItem extends WishlistItem {
  id: string;
  targetPrice: number;
  status: "watching" | "triggered";
}

function toSummary(row: UserProductRow["products"]) {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    brand: row.brand,
    category: row.category,
    image: row.image,
    lowestPrice: Number(row.lowest_price),
    highestPrice: Number(row.highest_price),
    rating: Number(row.rating),
    reviews: row.reviews_count,
  };
}

export function useWishlist() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["wishlist", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<WishlistItem[]> => {
      const { data, error } = await supabase
        .from("wishlists")
        .select("product_id, products(id,name,brand,category,image,lowest_price,highest_price,rating,reviews_count)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? [])
        .map((r) => {
          const product = toSummary((r as unknown as UserProductRow).products);
          return product ? { productId: r.product_id, product } : null;
        })
        .filter((x): x is WishlistItem => x !== null);
    },
  });
}

export function useToggleWishlist() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, saved }: { productId: string; saved: boolean }) => {
      if (!user) throw new Error("Sign in required");
      if (saved) {
        const { error } = await supabase
          .from("wishlists")
          .delete()
          .eq("user_id", user.id)
          .eq("product_id", productId);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from("wishlists")
          .insert({ user_id: user.id, product_id: productId });
        if (error) throw error;
      }
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["wishlist"] }),
  });
}

export function usePriceAlerts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ["alerts", user?.id],
    enabled: !!user,
    queryFn: async (): Promise<AlertItem[]> => {
      const { data, error } = await supabase
        .from("price_alerts")
        .select("id, product_id, target_price, status, products(id,name,brand,category,image,lowest_price,highest_price,rating,reviews_count)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? [])
        .map((r) => {
          const row = r as unknown as UserProductRow & {
            id: string;
            target_price: number;
            status: string;
          };
          const product = toSummary(row.products);
          if (!product) return null;
          return {
            id: row.id,
            productId: row.product_id,
            product,
            targetPrice: Number(row.target_price),
            status: (row.status === "triggered" ? "triggered" : "watching") as
              | "triggered"
              | "watching",
          };
        })
        .filter((x): x is AlertItem => x !== null);
    },
  });
}

export function useCreateAlert() {
  const { user } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, targetPrice }: { productId: string; targetPrice: number }) => {
      if (!user) throw new Error("Sign in required");
      const { error } = await supabase.from("price_alerts").upsert(
        {
          user_id: user.id,
          product_id: productId,
          target_price: targetPrice,
          status: "watching",
        },
        { onConflict: "user_id,product_id" },
      );
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}

export function useDeleteAlert() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("price_alerts").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["alerts"] }),
  });
}
