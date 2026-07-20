import { createFileRoute } from "@tanstack/react-router";
import { Check, Star, Truck, Tag, Trophy } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AnimatedBackground } from "@/components/animated-background";
import { products, getProduct } from "@/lib/sample-data";
import { formatINR } from "@/lib/format";
import { useState } from "react";

type Search = { id?: string };

export const Route = createFileRoute("/compare")({
  validateSearch: (s: Record<string, unknown>): Search => ({
    id: typeof s.id === "string" ? s.id : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Compare prices — CartSense" },
      { name: "description", content: "Side-by-side price comparison across Amazon, Flipkart, Croma and Reliance Digital." },
    ],
  }),
  component: ComparePage,
});

function ComparePage() {
  const { id } = Route.useSearch();
  const [selected, setSelected] = useState(id ?? products[0].id);
  const product = getProduct(selected);
  const bestPrice = Math.min(...product.stores.map((s) => s.price));

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 pt-10 pb-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Comparison</p>
            <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">
              Compare across <span className="text-brand-gradient">4 stores</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Real-time pricing, delivery times and bank offers side-by-side.
            </p>
          </div>
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="rounded-lg border border-border bg-card px-4 py-2.5 text-sm outline-none focus:border-primary"
          >
            {products.map((p) => (
              <option key={p.id} value={p.id}>{p.name}</option>
            ))}
          </select>
        </div>

        <div className="rounded-3xl border border-border bg-card p-6 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
            <img src={product.image} alt={product.name} className="h-32 w-32 rounded-xl object-cover" />
            <div className="flex-1">
              <p className="text-xs font-semibold uppercase text-muted-foreground">{product.brand}</p>
              <h2 className="mt-1 font-display text-2xl font-bold">{product.name}</h2>
              <div className="mt-2 flex items-center gap-3 text-sm">
                <span className="inline-flex items-center gap-1 rounded-md bg-orange-100 px-2 py-0.5 font-semibold text-orange-700">
                  <Star className="h-3.5 w-3.5 fill-current" /> {product.rating}
                </span>
                <span className="text-muted-foreground">{product.reviews.toLocaleString()} reviews</span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-xs text-muted-foreground">Best price today</p>
              <p className="font-display text-3xl font-bold text-brand-gradient">{formatINR(bestPrice)}</p>
            </div>
          </div>
        </div>

        {/* Desktop table */}
        <div className="mt-8 hidden overflow-hidden rounded-2xl border border-border bg-card lg:block">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-4">Store</th>
                <th className="px-4 py-4">Product</th>
                <th className="px-4 py-4">Current Price</th>
                <th className="px-4 py-4">Original</th>
                <th className="px-4 py-4">Discount</th>
                <th className="px-4 py-4">Rating</th>
                <th className="px-4 py-4">Delivery</th>
                <th className="px-4 py-4">Bank Offer</th>
                <th className="px-4 py-4"></th>
              </tr>
            </thead>
            <tbody>
              {product.stores.map((s) => (
                <tr key={s.store} className="border-t border-border transition-colors hover:bg-muted/30">
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-2">
                      <div className="grid h-9 w-9 place-items-center rounded-lg bg-gradient-to-br from-orange-100 to-red-100 text-sm font-bold text-primary">
                        {s.store[0]}
                      </div>
                      <div>
                        <p className="font-semibold">{s.store}</p>
                        {s.bestDeal && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-primary">
                            <Trophy className="h-3 w-3" /> BEST DEAL
                          </span>
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <img src={product.image} alt="" className="h-12 w-12 rounded-md object-cover" />
                  </td>
                  <td className="px-4 py-4 font-bold text-lg">{formatINR(s.price)}</td>
                  <td className="px-4 py-4 text-muted-foreground line-through">{formatINR(s.originalPrice)}</td>
                  <td className="px-4 py-4">
                    <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                      {s.discount}% OFF
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1">
                      <Star className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                      <span className="font-semibold">{s.rating}</span>
                      <span className="text-xs text-muted-foreground">({s.reviews.toLocaleString()})</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex items-center gap-1.5">
                      <Truck className="h-3.5 w-3.5 text-muted-foreground" />
                      <span>{s.delivery}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4 max-w-[180px]">
                    <div className="flex items-start gap-1.5">
                      <Tag className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                      <span className="text-xs">{s.bankOffer}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <a
                      href={s.url}
                      className={`inline-flex whitespace-nowrap rounded-lg px-4 py-2 text-xs font-semibold transition-transform hover:scale-[1.02] ${
                        s.bestDeal
                          ? "bg-brand-gradient text-brand-foreground shadow-lg shadow-primary/25"
                          : "border border-border bg-background hover:border-primary hover:text-primary"
                      }`}
                    >
                      Buy Now
                    </a>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Mobile cards */}
        <div className="mt-8 space-y-4 lg:hidden">
          {product.stores.map((s) => (
            <div
              key={s.store}
              className={`relative rounded-2xl border p-5 ${
                s.bestDeal ? "border-primary bg-primary/5" : "border-border bg-card"
              }`}
            >
              {s.bestDeal && (
                <span className="absolute -top-2 left-4 inline-flex items-center gap-1 rounded-full bg-brand-gradient px-2.5 py-0.5 text-[10px] font-bold text-brand-foreground">
                  <Trophy className="h-3 w-3" /> BEST DEAL
                </span>
              )}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="grid h-10 w-10 place-items-center rounded-lg bg-gradient-to-br from-orange-100 to-red-100 font-bold text-primary">
                    {s.store[0]}
                  </div>
                  <p className="font-semibold">{s.store}</p>
                </div>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-bold text-primary">
                  {s.discount}% OFF
                </span>
              </div>
              <div className="mt-3 flex items-end justify-between">
                <div>
                  <p className="text-xl font-bold">{formatINR(s.price)}</p>
                  <p className="text-xs text-muted-foreground line-through">{formatINR(s.originalPrice)}</p>
                </div>
                <div className="flex items-center gap-1 text-xs">
                  <Star className="h-3.5 w-3.5 fill-orange-500 text-orange-500" />
                  {s.rating} · {s.reviews.toLocaleString()}
                </div>
              </div>
              <div className="mt-3 grid gap-1.5 text-xs">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Truck className="h-3.5 w-3.5" /> {s.delivery}
                </div>
                <div className="flex items-start gap-1.5">
                  <Tag className="mt-0.5 h-3.5 w-3.5 text-primary" />
                  <span>{s.bankOffer}</span>
                </div>
              </div>
              <a
                href={s.url}
                className={`mt-4 inline-flex w-full items-center justify-center rounded-lg px-4 py-2.5 text-sm font-semibold ${
                  s.bestDeal
                    ? "bg-brand-gradient text-brand-foreground shadow-lg shadow-primary/25"
                    : "border border-border bg-background"
                }`}
              >
                <Check className="mr-2 h-4 w-4" /> Buy on {s.store}
              </a>
            </div>
          ))}
        </div>
      </div>
      <Footer />
    </div>
  );
}
