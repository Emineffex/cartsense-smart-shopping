import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
import { formatINR } from "@/lib/format";
import { useAuth } from "@/hooks/use-auth";
import {
  useWishlist,
  useToggleWishlist,
  usePriceAlerts,
  useDeleteAlert,
  useUpdateAlert,
  useProfile,
  useUpdateProfile,
} from "@/services/user-data";

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

function Dashboard() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<Tab>("saved");

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const { data: wishlist = [] } = useWishlist();
  const { data: alerts = [] } = usePriceAlerts();

  if (loading || !user) {
    return (
      <div className="relative min-h-screen">
        <AnimatedBackground />
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-24">
          <div className="h-64 animate-pulse rounded-3xl bg-card/50" />
        </div>
      </div>
    );
  }

  const displayName =
    (user.user_metadata?.name as string | undefined) ??
    (user.user_metadata?.full_name as string | undefined) ??
    user.email?.split("@")[0] ??
    "there";

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 pt-10 pb-16 sm:px-6 lg:px-8">
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wider text-primary">Your dashboard</p>
            <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">
              Welcome back, <span className="text-brand-gradient">{displayName}</span>
            </h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Here's what's happening with your tracked products.
            </p>
          </div>
          <button
            onClick={() => signOut().then(() => navigate({ to: "/" }))}
            className="rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary"
          >
            Sign out
          </button>
        </div>

        {/* Stats */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={Heart} label="Saved Products" value={wishlist.length} accent="from-red-500 to-orange-500" />
          <StatCard
            icon={Bell}
            label="Active Alerts"
            value={alerts.filter((a) => a.status === "watching").length}
            accent="from-orange-500 to-amber-500"
            hint={alerts.some((a) => a.status === "triggered") ? "1 triggered today" : undefined}
          />
          <StatCard icon={SearchIcon} label="Recent Searches" value={0} accent="from-amber-500 to-red-500" />
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
            {tab === "settings" && <SettingsPanel email={user.email ?? ""} displayName={displayName} />}
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
  const { data: wishlist = [], isLoading } = useWishlist();
  const toggle = useToggleWishlist();
  return (
    <SectionCard title="Saved products" subtitle={`${wishlist.length} products tracked`}>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : wishlist.length === 0 ? (
        <EmptyState message="You haven't saved any products yet." cta="Browse products" to="/search" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {wishlist.map(({ product }) => (
            <div key={product.id} className="group flex gap-4 rounded-2xl border border-border bg-background p-4 transition-all hover:border-primary/50 hover:shadow-md">
              <Link to="/product/$id" params={{ id: product.id }} className="flex flex-1 gap-4 min-w-0">
                <img src={product.image} alt="" className="h-20 w-20 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-2 text-sm font-semibold">{product.name}</p>
                  <p className="mt-1 text-lg font-bold">{formatINR(product.lowestPrice)}</p>
                  <p className="text-xs text-emerald-600 font-medium">
                    <TrendingDown className="inline h-3 w-3" /> Best deal available
                  </p>
                </div>
                <ChevronRight className="h-5 w-5 self-center text-muted-foreground group-hover:text-primary" />
              </Link>
              <button
                onClick={() => toggle.mutate({ productId: product.id, saved: true })}
                className="text-muted-foreground hover:text-destructive"
                aria-label="Remove"
              >
                <Trash2 className="h-4 w-4" />
              </button>
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function PriceAlerts() {
  const { data: alerts = [], isLoading } = usePriceAlerts();
  const del = useDeleteAlert();
  const update = useUpdateAlert();
  const handleEdit = (id: string, current: number) => {
    const val = window.prompt("Update target price (₹):", String(current));
    if (!val) return;
    const n = Number(val);
    if (!Number.isFinite(n) || n <= 0) return;
    update.mutate({ id, targetPrice: n });
  };
  return (
    <SectionCard title="Price alerts" subtitle="We'll notify you when prices drop">
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading…</p>
      ) : alerts.length === 0 ? (
        <EmptyState message="No price alerts yet. Set one from any product page." cta="Browse products" to="/search" />
      ) : (
        <div className="space-y-3">
          {alerts.map((a) => {
            const diff = a.product.lowestPrice - a.targetPrice;
            return (
              <div key={a.id} className="flex items-center gap-4 rounded-2xl border border-border bg-background p-4">
                <img src={a.product.image} alt="" className="h-14 w-14 rounded-lg object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{a.product.name}</p>
                  <p className="text-xs text-muted-foreground">
                    Target: {formatINR(a.targetPrice)} · Current: {formatINR(a.product.lowestPrice)}
                  </p>
                </div>
                {diff <= 0 ? (
                  <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-bold text-emerald-700">
                    Price hit!
                  </span>
                ) : (
                  <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-bold text-orange-700">
                    {formatINR(diff)} to go
                  </span>
                )}
                <button
                  onClick={() => handleEdit(a.id, a.targetPrice)}
                  className="rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:border-primary hover:text-primary"
                >
                  Edit
                </button>
                <button
                  onClick={() => del.mutate(a.id)}
                  className="text-muted-foreground hover:text-destructive"
                  aria-label="Remove"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </SectionCard>
  );
}

function RecentlyViewed() {
  const { data: wishlist = [] } = useWishlist();
  const items = wishlist.slice(0, 4);
  return (
    <SectionCard title="Recently viewed" subtitle="Pick up where you left off">
      {items.length === 0 ? (
        <EmptyState message="Browse products to see them here." cta="Browse products" to="/search" />
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {items.map(({ product }) => (
            <Link
              key={product.id}
              to="/product/$id"
              params={{ id: product.id }}
              className="flex gap-4 rounded-2xl border border-border bg-background p-4 hover:border-primary/50"
            >
              <img src={product.image} alt="" className="h-20 w-20 rounded-lg object-cover" />
              <div className="flex-1">
                <p className="line-clamp-2 text-sm font-semibold">{product.name}</p>
                <p className="mt-1 text-lg font-bold">{formatINR(product.lowestPrice)}</p>
                <p className="text-xs text-muted-foreground">In your wishlist</p>
              </div>
            </Link>
          ))}
        </div>
      )}
    </SectionCard>
  );
}

function SettingsPanel({ email, displayName }: { email: string; displayName: string }) {
  return (
    <SectionCard title="Settings" subtitle="Manage your preferences">
      <div className="space-y-6">
        <Field label="Display name" defaultValue={displayName} />
        <Field label="Email address" defaultValue={email} readOnly />
        <div>
          <p className="text-sm font-semibold">Notifications</p>
          <div className="mt-3 space-y-2">
            {[
              ["Email me price drops", true],
              ["Weekly deal digest", true],
              ["Marketing updates", false],
            ].map(([label, on]) => (
              <label key={label as string} className="flex items-center justify-between rounded-xl border border-border bg-background px-4 py-3 text-sm">
                <span>{label as string}</span>
                <input type="checkbox" defaultChecked={on as boolean} className="h-4 w-4 accent-primary" />
              </label>
            ))}
          </div>
        </div>
      </div>
    </SectionCard>
  );
}

function SectionCard({ title, subtitle, children }: { title: string; subtitle?: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-5">
        <h2 className="font-display text-xl font-bold">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
      </div>
      {children}
    </div>
  );
}

function EmptyState({ message, cta, to }: { message: string; cta: string; to: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-background/50 p-10 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
      <Link to={to} className="mt-4 inline-flex rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-brand-foreground">
        {cta}
      </Link>
    </div>
  );
}

function Field({ label, defaultValue, readOnly }: { label: string; defaultValue: string; readOnly?: boolean }) {
  return (
    <div>
      <label className="text-sm font-semibold">{label}</label>
      <input
        defaultValue={defaultValue}
        readOnly={readOnly}
        className="mt-2 w-full rounded-lg border border-border bg-background px-4 py-2.5 text-sm outline-none focus:border-primary read-only:opacity-70"
      />
    </div>
  );
}
