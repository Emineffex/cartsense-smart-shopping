import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Check, X, Sparkles, Star, Bell, Heart, Trophy } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AnimatedBackground } from "@/components/animated-background";
import { ProductCard } from "@/components/product-card";
import { formatINR } from "@/lib/format";
import { useProduct, useProducts, usePriceHistory, type PricePoint } from "@/services/catalog";
import { useAuth } from "@/hooks/use-auth";
import { useToggleWishlist, useWishlist, useCreateAlert } from "@/services/user-data";

export const Route = createFileRoute("/product/$id")({
  head: () => ({
    meta: [
      { title: "Product — CartSense" },
      { name: "description", content: "Compare prices across Amazon, Flipkart, Croma & Reliance Digital." },
    ],
  }),
  component: ProductDetails,
});

function ProductDetails() {
  const { id } = Route.useParams();
  const { data: product, isLoading } = useProduct(id);
  const { data: all = [] } = useProducts();
  const { user } = useAuth();
  const { data: wishlist = [] } = useWishlist();
  const toggleWishlist = useToggleWishlist();
  const createAlert = useCreateAlert();
  const [active, setActive] = useState(0);

  useEffect(() => setActive(0), [id]);

  if (isLoading) {
    return (
      <div className="relative min-h-screen">
        <AnimatedBackground />
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-24 sm:px-6 lg:px-8">
          <div className="h-96 animate-pulse rounded-3xl bg-card/50" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!product) {
    return (
      <div className="relative min-h-screen">
        <AnimatedBackground />
        <Navbar />
        <div className="mx-auto max-w-3xl px-4 py-24 text-center">
          <h1 className="font-display text-3xl font-bold">Product not found</h1>
          <p className="mt-2 text-muted-foreground">This product may have been removed.</p>
          <Link to="/search" className="mt-6 inline-flex rounded-lg bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-brand-foreground">
            Back to search
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const bestPrice = product.stores.length ? Math.min(...product.stores.map((s) => s.price)) : product.lowestPrice;
  const similar = all.filter((p) => p.id !== product.id && p.category === product.category).slice(0, 4);
  const fallback = similar.length ? similar : all.filter((p) => p.id !== product.id).slice(0, 4);
  const isSaved = wishlist.some((w) => w.productId === product.id);

  const handleSave = () => {
    if (!user) { window.location.href = "/auth"; return; }
    toggleWishlist.mutate({ productId: product.id, saved: isSaved });
  };
  const handleAlert = () => {
    if (!user) { window.location.href = "/auth"; return; }
    const val = window.prompt("Notify me when the price drops to (₹):", String(Math.round(bestPrice * 0.95)));
    if (!val) return;
    const target = Number(val);
    if (!Number.isFinite(target) || target <= 0) return;
    createAlert.mutate({ productId: product.id, targetPrice: target });
  };

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 pt-8 pb-16 sm:px-6 lg:px-8">
        <nav className="mb-6 text-xs text-muted-foreground">
          <Link to="/" className="hover:text-foreground">Home</Link> ·{" "}
          <Link to="/search" className="hover:text-foreground">{product.category}</Link> ·{" "}
          <span className="text-foreground">{product.brand}</span>
        </nav>

        <div className="grid gap-10 lg:grid-cols-2">
          {/* Gallery */}
          <div>
            <div className="overflow-hidden rounded-3xl border border-border bg-card">
              <img
                src={product.images[active] ?? product.image}
                alt={product.name}
                className="aspect-square w-full object-cover"
              />
            </div>
            <div className="mt-4 grid grid-cols-4 gap-3">
              {product.images.map((src, i) => (
                <button
                  key={src}
                  onClick={() => setActive(i)}
                  className={`overflow-hidden rounded-xl border-2 transition-all ${
                    i === active ? "border-primary shadow-lg shadow-primary/20" : "border-border hover:border-primary/50"
                  }`}
                >
                  <img src={src} alt="" className="aspect-square w-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Details */}
          <div>
            <p className="text-xs font-semibold uppercase text-primary">{product.brand}</p>
            <h1 className="mt-2 font-display text-3xl font-bold tracking-tight sm:text-4xl">{product.name}</h1>
            <div className="mt-3 flex flex-wrap items-center gap-3 text-sm">
              <span className="inline-flex items-center gap-1 rounded-md bg-orange-100 px-2 py-1 font-semibold text-orange-700">
                <Star className="h-3.5 w-3.5 fill-current" /> {product.rating}
              </span>
              <span className="text-muted-foreground">{product.reviews.toLocaleString()} reviews</span>
              <span className="text-muted-foreground">·</span>
              <span className="text-muted-foreground">{product.category}</span>
            </div>

            <div className="mt-6 rounded-2xl border border-border bg-card p-6">
              <p className="text-xs text-muted-foreground">Best price across stores</p>
              <div className="mt-1 flex items-end gap-3">
                <p className="font-display text-4xl font-bold text-brand-gradient">{formatINR(bestPrice)}</p>
                <p className="pb-1 text-sm text-muted-foreground line-through">{formatINR(product.highestPrice)}</p>
              </div>
              <div className="mt-5 flex flex-wrap gap-3">
                <Link
                  to="/compare"
                  search={{ id: product.id } as never}
                  className="inline-flex items-center gap-2 rounded-xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-brand-foreground shadow-lg shadow-primary/25 transition-transform hover:scale-[1.02]"
                >
                  <Trophy className="h-4 w-4" /> Compare all stores
                </Link>
                <button onClick={handleAlert} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-5 py-3 text-sm font-semibold hover:border-primary hover:text-primary">
                  <Bell className="h-4 w-4" /> Price alert
                </button>
                <button
                  onClick={handleSave}
                  className={`inline-flex items-center gap-2 rounded-xl border px-5 py-3 text-sm font-semibold ${isSaved ? "border-primary bg-primary/10 text-primary" : "border-border bg-background hover:border-primary hover:text-primary"}`}
                >
                  <Heart className={`h-4 w-4 ${isSaved ? "fill-current" : ""}`} /> {isSaved ? "Saved" : "Save"}
                </button>
              </div>
            </div>

            {/* AI recommendation placeholder */}
            <div className="mt-6 relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-orange-50 to-red-50 p-6">
              <div className="flex items-start gap-3">
                <div className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-brand-gradient text-brand-foreground">
                  <Sparkles className="h-5 w-5" />
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-wider text-primary">AI Recommendation</p>
                  <p className="mt-1 font-semibold">Buy now — prices are near their 90-day low</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Our model suggests <span className="font-semibold text-foreground">Amazon</span> offers the best combined value factoring in delivery speed and bank offers. Historically this product drops another 3–4% during sale events.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Price comparison mini table */}
        <section className="mt-14">
          <h2 className="font-display text-2xl font-bold">Price comparison</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {product.stores.map((s) => (
              <div
                key={s.store}
                className={`relative rounded-2xl border p-5 transition-all hover:-translate-y-1 ${
                  s.bestDeal ? "border-primary bg-primary/5 shadow-lg shadow-primary/10" : "border-border bg-card"
                }`}
              >
                {s.bestDeal && (
                  <span className="absolute -top-2 left-4 rounded-full bg-brand-gradient px-2.5 py-0.5 text-[10px] font-bold text-brand-foreground">
                    BEST DEAL
                  </span>
                )}
                <p className="text-sm font-semibold">{s.store}</p>
                <p className="mt-3 text-2xl font-bold">{formatINR(s.price)}</p>
                <p className="text-xs text-muted-foreground line-through">{formatINR(s.originalPrice)}</p>
                <p className="mt-2 text-xs text-primary font-semibold">{s.discount}% off · {s.delivery}</p>
                <a href={s.url} className="mt-4 inline-flex w-full items-center justify-center rounded-lg bg-foreground px-3 py-2 text-xs font-semibold text-background hover:opacity-90">
                  Buy on {s.store}
                </a>
              </div>
            ))}
          </div>
        </section>

        {/* Specs + Pros/Cons */}
        <section className="mt-14 grid gap-8 lg:grid-cols-2">
          <div className="rounded-2xl border border-border bg-card p-6">
            <h2 className="font-display text-xl font-bold">Specifications</h2>
            <dl className="mt-4 divide-y divide-border">
              {Object.entries(product.specs).map(([k, v]) => (
                <div key={k} className="grid grid-cols-3 gap-4 py-3 text-sm">
                  <dt className="text-muted-foreground">{k}</dt>
                  <dd className="col-span-2 font-medium">{String(v)}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="grid gap-6">
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="flex items-center gap-2 font-display text-lg font-bold">
                <Check className="h-5 w-5 text-emerald-600" /> Pros
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                {product.pros.map((p) => (
                  <li key={p} className="flex gap-2">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600" />
                    <span>{p}</span>
                  </li>
                ))}
              </ul>
            </div>
            <div className="rounded-2xl border border-border bg-card p-6">
              <h3 className="flex items-center gap-2 font-display text-lg font-bold">
                <X className="h-5 w-5 text-primary" /> Cons
              </h3>
              <ul className="mt-3 space-y-2 text-sm">
                {product.cons.map((c) => (
                  <li key={c} className="flex gap-2">
                    <X className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                    <span>{c}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>

        {/* Similar */}
        <section className="mt-16">
          <h2 className="font-display text-2xl font-bold">Similar products</h2>
          <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {fallback.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        </section>
      </div>
      <Footer />
    </div>
  );
}
