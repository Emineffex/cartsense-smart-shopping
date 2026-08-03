import { Link } from "@tanstack/react-router";
import { Check, Trophy, X, Sparkles, Star } from "lucide-react";
import type { Product } from "@/lib/sample-data";
import { formatINR } from "@/lib/format";
import { useCompare } from "@/hooks/use-compare";
import { SPEC_ROWS, bestIndex, bestPriceOf, buildInsight, computeBadges } from "@/lib/compare-insights";

export function MultiCompare({
  products,
  isLoading,
  onBuy,
}: {
  products: Product[];
  isLoading?: boolean;
  onBuy?: (product: Product, store: Product["stores"][number]) => void;
}) {
  const { remove, clear, count, max } = useCompare();

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-3xl bg-card/50" />;
  }

  if (!products.length) {
    return (
      <div className="rounded-2xl border border-dashed border-border bg-card/50 p-12 text-center">
        <p className="font-semibold">No products in your comparison yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Add up to {max} products from Search or a Product Details page to compare them side-by-side.
        </p>
        <Link
          to="/search"
          search={{ q: "" }}
          className="mt-4 inline-flex rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-brand-foreground"
        >
          Browse products
        </Link>
      </div>
    );
  }

  const insights = products.map((p) => buildInsight(p, products));
  const badges = computeBadges(products, insights);
  const colWidth = "min-w-[240px] w-[240px]";

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Comparing <span className="font-semibold text-foreground">{count}</span> of {max} products
        </p>
        <button
          onClick={clear}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-1.5 text-xs font-semibold hover:border-primary hover:text-primary"
        >
          <X className="h-3.5 w-3.5" /> Clear all
        </button>
      </div>

      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full min-w-max border-collapse text-sm">
          <thead>
            <tr className="border-b border-border">
              <th className="sticky left-0 z-10 min-w-[160px] bg-card px-4 py-4 text-left text-xs uppercase tracking-wider text-muted-foreground">
                Product
              </th>
              {products.map((p) => (
                <th key={p.id} className={`${colWidth} border-l border-border px-4 py-4 text-left align-top`}>
                  <div className="flex items-start justify-between gap-2">
                    <ProductImage src={p.image} alt={p.name} label={p.brand} className="h-16 w-16 rounded-lg object-cover" />
                    <button
                      onClick={() => remove(p.id)}
                      aria-label={`Remove ${p.name} from comparison`}
                      className="rounded-md border border-border p-1 text-muted-foreground hover:border-primary hover:text-primary"
                    >
                      <X className="h-3.5 w-3.5" />
                    </button>
                  </div>
                  <Link
                    to="/product/$id"
                    params={{ id: p.id }}
                    className="mt-2 block text-sm font-semibold leading-snug hover:text-primary"
                  >
                    {p.name}
                  </Link>
                  <div className="mt-2 flex flex-wrap gap-1">
                    {(badges[p.id] ?? []).map((b) => (
                      <span
                        key={b}
                        className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold text-primary"
                      >
                        <Trophy className="h-2.5 w-2.5" /> {b}
                      </span>
                    ))}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {SPEC_ROWS.map((row) => {
              const winner = bestIndex(row, products);
              return (
                <tr key={row.key} className="border-b border-border last:border-0">
                  <th className="sticky left-0 z-10 bg-card px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    {row.label}
                  </th>
                  {products.map((p, i) => (
                    <td
                      key={p.id}
                      className={`${colWidth} border-l border-border px-4 py-3 align-top ${
                        i === winner ? "bg-primary/5 font-semibold text-primary" : ""
                      }`}
                    >
                      <span className="inline-flex items-start gap-1.5">
                        {i === winner && <Check className="mt-0.5 h-3.5 w-3.5 shrink-0" />}
                        <span>{row.value(p)}</span>
                      </span>
                    </td>
                  ))}
                </tr>
              );
            })}

            {/* AI-style summary */}
            <tr className="border-b border-border">
              <th className="sticky left-0 z-10 bg-card px-4 py-3 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                AI summary
              </th>
              {products.map((p, i) => {
                const ins = insights[i];
                return (
                  <td key={p.id} className={`${colWidth} border-l border-border px-4 py-3 align-top`}>
                    <div className="mb-2 flex items-center gap-2">
                      <span className="grid h-6 w-6 place-items-center rounded-md bg-brand-gradient text-brand-foreground">
                        <Sparkles className="h-3 w-3" />
                      </span>
                      <span className="text-xs font-bold text-primary">{ins.score}/10 overall</span>
                    </div>
                    <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Pros</p>
                    <ul className="mt-1 space-y-1 text-xs">
                      {ins.pros.length ? ins.pros.map((x) => (
                        <li key={x} className="flex gap-1.5">
                          <Check className="mt-0.5 h-3 w-3 shrink-0 text-emerald-600" />
                          <span>{x}</span>
                        </li>
                      )) : <li className="text-muted-foreground">—</li>}
                    </ul>
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Cons</p>
                    <ul className="mt-1 space-y-1 text-xs">
                      {ins.cons.length ? ins.cons.map((x) => (
                        <li key={x} className="flex gap-1.5">
                          <X className="mt-0.5 h-3 w-3 shrink-0 text-primary" />
                          <span>{x}</span>
                        </li>
                      )) : <li className="text-muted-foreground">—</li>}
                    </ul>
                    <p className="mt-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Best for</p>
                    <p className="mt-1 text-xs">{ins.bestFor}</p>
                  </td>
                );
              })}
            </tr>

            {/* Buy Now */}
            <tr>
              <th className="sticky left-0 z-10 bg-card px-4 py-4 text-left text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                Buy now
              </th>
              {products.map((p) => {
                const best = p.stores.length
                  ? p.stores.reduce((a, b) => (b.price < a.price ? b : a))
                  : null;
                return (
                  <td key={p.id} className={`${colWidth} border-l border-border px-4 py-4 align-top`}>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Star className="h-3 w-3 fill-orange-500 text-orange-500" /> {p.rating}
                    </div>
                    <p className="mt-1 text-lg font-bold">{formatINR(bestPriceOf(p))}</p>
                    {best ? (
                      <a
                        href={best.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        onClick={() => onBuy?.(p, best)}
                        className="mt-3 inline-flex w-full items-center justify-center rounded-lg bg-brand-gradient px-4 py-2 text-xs font-semibold text-brand-foreground shadow-lg shadow-primary/25"
                      >
                        Buy on {best.store}
                      </a>
                    ) : (
                      <p className="mt-3 text-xs text-muted-foreground">No offers available</p>
                    )}
                  </td>
                );
              })}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
