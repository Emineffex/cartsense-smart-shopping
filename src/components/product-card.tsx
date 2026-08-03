import { Link } from "@tanstack/react-router";
import { Star, TrendingDown } from "lucide-react";
import type { Product } from "@/lib/sample-data";
import { formatINR } from "@/lib/format";
import { CompareToggle } from "@/components/compare-toggle";


export function ProductCard({ product }: { product: Product }) {
  const savings = product.highestPrice - product.lowestPrice;
  const savingsPct = Math.round((savings / product.highestPrice) * 100);
  return (
    <Link
      to="/product/$id"
      params={{ id: product.id }}
      className="group flex flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10"
    >
      <div className="relative aspect-square overflow-hidden bg-muted">
        <ProductImage
          src={product.image}
          alt={product.name}
          label={product.brand}
          sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
          className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
        {savingsPct > 0 && (
          <span className="absolute left-3 top-3 rounded-full bg-brand-gradient px-2.5 py-1 text-xs font-semibold text-brand-foreground shadow">
            Save {savingsPct}%
          </span>
        )}
        <CompareToggle productId={product.id} className="absolute right-3 top-3 shadow" />
      </div>

      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {product.brand}
          </p>
          <h3 className="mt-1 line-clamp-2 text-sm font-semibold leading-snug">
            {product.name}
          </h3>
        </div>
        <div className="flex items-center gap-2 text-xs">
          <span className="inline-flex items-center gap-1 rounded-md bg-orange-100 px-1.5 py-0.5 font-semibold text-orange-700">
            <Star className="h-3 w-3 fill-current" />
            {product.rating}
          </span>
          <span className="text-muted-foreground">
            {product.reviews.toLocaleString()} reviews
          </span>
        </div>
        <div className="mt-auto flex items-end justify-between">
          <div>
            <p className="text-lg font-bold">{formatINR(product.lowestPrice)}</p>
            <p className="text-xs text-muted-foreground line-through">
              {formatINR(product.highestPrice)}
            </p>
          </div>
          <span className="inline-flex items-center gap-1 rounded-lg bg-primary/10 px-2 py-1 text-xs font-semibold text-primary">
            <TrendingDown className="h-3 w-3" />
            {product.stores.length} stores
          </span>
        </div>
      </div>
    </Link>
  );
}
