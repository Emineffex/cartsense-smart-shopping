import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Sparkles,
  Bell,
  BarChart3,
  ShieldCheck,
  Zap,
  Package,
  ChevronDown,
  Star,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AnimatedBackground } from "@/components/animated-background";
import { SearchBar } from "@/components/search-bar";
import { ProductCard } from "@/components/product-card";
import { products, supportedStores, faqs } from "@/lib/sample-data";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "CartSense — Compare prices across Amazon, Flipkart, Croma & Reliance" },
      { name: "description", content: "Find the lowest price in seconds. CartSense compares products across India's top stores with real-time price alerts and bank offers." },
      { property: "og:title", content: "CartSense — Smarter shopping, better prices" },
      { property: "og:description", content: "Compare products across Amazon, Flipkart, Croma & Reliance Digital in one place." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Zap, title: "Real-time comparison", desc: "Live prices from every major retailer, refreshed the moment stores update." },
  { icon: Bell, title: "Smart price alerts", desc: "Get notified the instant a product hits your target price — never overpay again." },
  { icon: BarChart3, title: "Price history charts", desc: "See 90-day trends and spot the perfect time to buy with confidence." },
  { icon: ShieldCheck, title: "Bank offer aware", desc: "We factor in card offers and coupons so you see the true landed price." },
  { icon: Package, title: "Delivery ETA", desc: "Compare not just price but how fast it reaches your doorstep." },
  { icon: Sparkles, title: "AI recommendations", desc: "Personalized suggestions that learn what you love, minus the noise." },
];

function Landing() {
  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <Navbar />

      {/* Hero */}
      <section className="relative mx-auto max-w-7xl px-4 pt-16 pb-24 sm:px-6 lg:px-8 lg:pt-24">
        <div className="mx-auto max-w-3xl text-center animate-fade-up">
          <span className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-medium text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Now tracking 10M+ products across India
          </span>
          <h1 className="mt-6 font-display text-5xl font-bold leading-[1.05] tracking-tight sm:text-6xl lg:text-7xl">
            Shop smart.
            <br />
            <span className="text-brand-gradient">Pay the lowest price.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg text-muted-foreground">
            CartSense scans Amazon, Flipkart, Croma and Reliance Digital in real time —
            so you always know you're getting the best deal.
          </p>
          <div className="mx-auto mt-10 max-w-2xl">
            <SearchBar />
          </div>
          <div className="mt-4 flex flex-wrap items-center justify-center gap-2 text-xs text-muted-foreground">
            <span>Popular:</span>
            {["iPhone 15 Pro", "Sony WH-1000XM5", "MacBook Air M3", "Galaxy S24 Ultra"].map((t) => (
              <Link
                key={t}
                to="/search"
                search={{ q: t } as never}
                className="rounded-full border border-border bg-background/60 px-3 py-1 hover:border-primary hover:text-primary transition-colors"
              >
                {t}
              </Link>
            ))}
          </div>
        </div>

        {/* stats */}
        <div className="mx-auto mt-20 grid max-w-4xl grid-cols-2 gap-6 sm:grid-cols-4">
          {[
            ["10M+", "Products tracked"],
            ["4", "Major stores"],
            ["₹2.4Cr", "Saved by users"],
            ["4.8★", "User rating"],
          ].map(([v, k]) => (
            <div key={k} className="rounded-2xl border border-border/60 bg-card/60 backdrop-blur p-5 text-center">
              <p className="font-display text-2xl font-bold text-brand-gradient">{v}</p>
              <p className="mt-1 text-xs text-muted-foreground">{k}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Everything you need to <span className="text-brand-gradient">shop wisely</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Built for shoppers who want the truth about pricing — not marketing.
          </p>
        </div>
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 transition-all hover:-translate-y-1 hover:border-primary/40 hover:shadow-xl hover:shadow-primary/10"
            >
              <div className="grid h-11 w-11 place-items-center rounded-xl bg-brand-gradient text-brand-foreground shadow-lg shadow-primary/20">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-5 text-lg font-semibold">{f.title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">{f.desc}</p>
              <div className="absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
            </div>
          ))}
        </div>
      </section>

      {/* Supported stores */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-2xl text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Supported <span className="text-brand-gradient">stores</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Compare across India's most trusted marketplaces — all in one search.
          </p>
        </div>
        <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {supportedStores.map((s, i) => (
            <div
              key={s.name}
              className="group relative overflow-hidden rounded-2xl border border-border bg-card p-6 text-center transition-all hover:-translate-y-1 hover:shadow-xl hover:shadow-primary/10"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="mx-auto grid h-14 w-14 place-items-center rounded-2xl bg-gradient-to-br from-orange-100 to-red-100 text-2xl font-bold text-primary">
                {s.name[0]}
              </div>
              <h3 className="mt-4 text-lg font-semibold">{s.name}</h3>
              <p className="mt-1 text-xs text-muted-foreground">{s.tagline}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Trending products */}
      <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between">
          <div>
            <h2 className="font-display text-3xl font-bold sm:text-4xl">
              Trending <span className="text-brand-gradient">right now</span>
            </h2>
            <p className="mt-2 text-sm text-muted-foreground">Hand-picked deals with real price drops.</p>
          </div>
          <Link
            to="/search"
            className="hidden sm:inline-flex text-sm font-semibold text-primary hover:underline"
          >
            View all →
          </Link>
        </div>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {products.slice(0, 4).map((p) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      </section>

      {/* Testimonial strip */}
      <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="relative overflow-hidden rounded-3xl border border-border bg-brand-gradient p-10 text-brand-foreground shadow-2xl shadow-primary/20">
          <div className="relative z-10 grid gap-8 md:grid-cols-3">
            {[
              ["₹8,400", "Average savings", "per shopper"],
              ["4.8/5", "User rating", "across 12K+ reviews"],
              ["<1s", "Compare speed", "for any product"],
            ].map(([v, t, s]) => (
              <div key={t} className="text-center">
                <p className="font-display text-4xl font-bold">{v}</p>
                <p className="mt-1 font-semibold">{t}</p>
                <p className="text-sm opacity-80">{s}</p>
              </div>
            ))}
          </div>
          <div className="absolute -right-24 -top-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
          <div className="absolute -left-24 -bottom-24 h-64 w-64 rounded-full bg-white/10 blur-3xl" />
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4 py-20 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="font-display text-4xl font-bold tracking-tight sm:text-5xl">
            Frequently asked <span className="text-brand-gradient">questions</span>
          </h2>
        </div>
        <div className="mt-12 space-y-3">
          {faqs.map((f, i) => (
            <FaqItem key={i} q={f.q} a={f.a} defaultOpen={i === 0} />
          ))}
        </div>
      </section>

      <Footer />
    </div>
  );
}

function FaqItem({ q, a, defaultOpen = false }: { q: string; a: string; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="overflow-hidden rounded-2xl border border-border bg-card">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between gap-4 px-5 py-4 text-left"
      >
        <span className="font-medium">{q}</span>
        <ChevronDown className={`h-5 w-5 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      <div
        className={`grid transition-all duration-300 ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-sm text-muted-foreground">{a}</p>
        </div>
      </div>
    </div>
  );
}
