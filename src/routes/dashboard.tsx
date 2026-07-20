import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import {
  Heart,
  Bell,
  Clock,
  Settings as SettingsIcon,
  TrendingDown,
  Search as SearchIcon,
  Trash2,
  ChevronRight,
} from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AnimatedBackground } from "@/components/animated-background";
import { products } from "@/lib/sample-data";
import { formatINR } from "@/lib/format";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard — CartSense" },
      { name: "description", content: "Manage saved products, price alerts and recent searches on CartSense." },
    ],
  }),
  component: Dashboard,
});

const tabs = [
  { id: "saved", label: "Saved Products", icon: Heart },
  { id: "alerts", label: "Price Alerts", icon: Bell },
  { id: "recent", label: "Recently Viewed", icon: Clock },
  { id: "settings", label: "Settings", icon: SettingsIcon },
] as const;

type Tab = (typeof tabs)[number]["id"];

const savedIds = ["iphone-15-pro", "sony-wh1000xm5", "macbook-air-m3", "dyson-v15"];
const recentIds = ["samsung-s24-ultra", "boat-airdopes-141", "iphone-15-pro"];
const alerts = [
  { productId: "iphone-15-pro", targetPrice: 124999, currentPrice: 128999, status: "watching" as const },
  { productId: "sony-wh1000xm5", targetPrice: 22999, currentPrice: 24990, status: "watching" as const },
  { productId: "macbook-air-m3", targetPrice: 99900, currentPrice: 99900, status: "triggered" as const },
];
const searches = [
  "iPhone 15 Pro",
  "Sony WH-1000XM5",
  "MacBook Air M3",
  "Air fryer under 10000",
  "Samsung Galaxy S24 Ultra",
];

function Dashboard() {
  const [tab, setTab] = useState<Tab>("saved");
  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 pt-10 pb-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Your dashboard</p>
          <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">
            Welcome back, <span className="text-brand-gradient">Alex</span>
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Here's what's happening with your tracked products.
          </p>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={Heart} label="Saved Products" value={savedIds.length} accent="from-red-500 to-orange-500" />
          <StatCard icon={Bell} label="Active Alerts" value={alerts.filter((a) => a.status === "watching").length} accent="from-orange-500 to-amber-500" hint="1 triggered today" />
          <StatCard icon={SearchIcon} label="Recent Searches" value={searches.length} accent="from-amber-500 to-red-500" />
        </div>

        <div className="mt-10 grid gap-6 lg:grid-cols-[240px_1fr]">
          {/* Sidebar */}
          <aside className="rounded-2xl border border-border bg-card p-2 h-fit lg:sticky lg:top-24">
            <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`flex w-full items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition-colors ${
                    tab === t.id
                      ? "bg-brand-gradient text-brand-foreground shadow"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  <t.icon className="h-4 w-4" />
                  {t.label}
                </button>
              ))}
            </nav>
          </aside>

          {/* Content */}
          <div>
            {tab === "saved" && <SavedProducts />}
            {tab === "alerts" && <PriceAlerts />}
            {tab === "recent" && <RecentlyViewed />}
            {tab === "settings" && <SettingsPanel />}
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
  accent,
  hint,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: string;
  hint?: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-card p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-3 font-display text-4xl font-bold">{value}</p>
          {hint && <p className="mt-1 text-xs text-primary">{hint}</p>}
        </div>
        <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-lg`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

function SavedProducts() {
  const items = savedIds.map((id) => products.find((p) => p.id === id)!).filter(Boolean);
  return (
    <SectionCard title="Saved products" subtitle={`${items.length} products tracked`}>
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((p) => (
          <Link
            key={p.id}
            to="/product/$id"
            params={{ id: p.id }}
            className="group flex gap-4 rounded-2xl border border-border bg-background p-4 transition-all hover:border-primary/50 hover:shadow-md"
          >
            <img src={p.image} alt="" className="h-20 w-20 rounded-lg object-cover" />
            <div className="min-w-0 flex-1">
              <p className="line-clamp-2 text-sm font-semibold">{p.name}</p>
              <p className="mt-1 text-lg font-bold">{formatINR(p.lowestPrice)}</p>
              <p className="text-xs text-emerald-600 font-medium">
                <TrendingDown className="inline h-3 w-3" /> Down 4% this week
              </p>
            </div>
            <ChevronRight className="h-5 w-5 self-center text-muted-foreground group-hover:text-primary" />
          </Link>
        ))}
      </div>
    </SectionCard>
  );
}

function PriceAlerts() {
  return (
    <SectionCard title="Price alerts" subtitle="We'll notify you when prices drop">
      <div className="space-y-3">
        {alerts.map((a, i) => {
          const p = products.find((x) => x.id === a.productId)!;
          const diff = a.currentPrice - a.targetPrice;
          return (
            <div key={i} className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4">
              <img src={p.image} alt="" className="h-14 w-14 rounded-lg object-cover" />
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{p.name}</p>
                <p className="text-xs text-muted-foreground">
                  Target: {formatINR(a.targetPrice)} · Current: {formatINR(a.currentPrice)}
                </p>
              </div>
              {a.status === "triggered" ? (
                <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                  Price hit!
                </span>
              ) : (
                <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                  {formatINR(Math.abs(diff))} to go
                </span>
              )}
              <button className="text-muted-foreground hover:text-destructive" aria-label="Remove">
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          );
        })}
      </div>
    </SectionCard>
  );
}

function RecentlyViewed() {
  const items = recentIds.map((id) => products.find((p) => p.id === id)!).filter(Boolean);
  return (
    <SectionCard title="Recently viewed" subtitle="Pick up where you left off">
      <div className="grid gap-4 sm:grid-cols-2">
        {items.map((p) => (
          <Link
            key={p.id}
            to="/product/$id"
            params={{ id: p.id }}
            className="flex gap-4 rounded-2xl border border-border bg-background p-4 hover:border-primary/50"
          >
            <img src={p.image} alt="" className="h-20 w-20 rounded-lg object-cover" />
            <div className="flex-1">
              <p className="line-clamp-2 text-sm font-semibold">{p.name}</p>
              <p className="mt-1 text-lg font-bold">{formatINR(p.lowestPrice)}</p>
              <p className="text-xs text-muted-foreground">Viewed 2 days ago</p>
            </div>
          </Link>
        ))}
      </div>
      <div className="mt-6">
        <h4 className="text-sm font-semibold">Recent searches</h4>
        <div className="mt-3 flex flex-wrap gap-2">
          {searches.map((s) => (
            <Link
              key={s}
              to="/search"
              search={{ q: s } as never}
              className="rounded-full border border-border bg-background px-3 py-1.5 text-xs hover:border-primary hover:text-primary"
            >
              {s}
            </Link>
          ))}
        </div>
      </div>
    </SectionCard>
  );
}

function SettingsPanel() {
  return (
    <SectionCard title="Settings" subtitle="Manage your preferences">
      <div className="space-y-6">
        <Field label="Display name" defaultValue="Alex Sharma" />
        <Field label="Email address" defaultValue="alex@example.com" />
        <div>
          <p className="text-sm font-semibold">Notifications</p>
          <div className="mt-3 space-y-2">
            {[
              ["Email me price drops", true],
              ["Weekly deal digest", true],
              ["Marketing updates", false],
            ].map(([label, on]) => (
              <label key={label as string} className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm">
                <span>{label}</span>
                <span className={`inline-flex h-6 w-11 items-center rounded-full transition-colors ${on ? "bg-brand-gradient" : "bg-muted"}`}>
                  <span className={`h-5 w-5 rounded-full bg-white shadow transition-transform ${on ? "translate-x-5" : "translate-x-0.5"}`} />
                </span>
              </label>
            ))}
          </div>
        </div>
        <button className="rounded-xl bg-brand-gradient px-5 py-2.5 text-sm font-semibold text-brand-foreground shadow-lg shadow-primary/25">
          Save changes
        </button>
      </div>
    </SectionCard>
  );
}

function Field({ label, defaultValue }: { label: string; defaultValue: string }) {
  return (
    <label className="block">
      <span className="text-sm font-semibold">{label}</span>
      <input
        defaultValue={defaultValue}
        className="mt-2 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary"
      />
    </label>
  );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle: string; children: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-border bg-card p-6">
      <div className="mb-6">
        <h2 className="font-display text-xl font-bold">{title}</h2>
        <p className="text-sm text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}
