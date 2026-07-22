import { createFileRoute } from "@tanstack/react-router";
import { Users, Search as SearchIcon, Bell, Heart } from "lucide-react";
import { useAdminStats } from "@/services/admin";

export const Route = createFileRoute("/admin/")({
  component: AdminIndex,
});

function AdminIndex() {
  const { data, isLoading, isError, refetch } = useAdminStats();

  return (
    <div className="space-y-6">
      <SectionCard title="Overview" subtitle="Key metrics across the platform">
        {isLoading ? (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-28 animate-pulse rounded-2xl bg-background" />
            ))}
          </div>
        ) : isError ? (
          <ErrorState onRetry={() => refetch()} />
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <Stat icon={Users} label="Total Users" value={data!.totalUsers} accent="from-red-500 to-orange-500" />
            <Stat icon={SearchIcon} label="Total Searches" value={data!.totalSearches} accent="from-orange-500 to-amber-500" />
            <Stat icon={Bell} label="Total Price Alerts" value={data!.totalAlerts} accent="from-amber-500 to-red-500" />
            <Stat icon={Heart} label="Total Wishlist Items" value={data!.totalWishlist} accent="from-red-500 to-pink-500" />
          </div>
        )}
      </SectionCard>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent: string;
}) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-border bg-background p-5">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">{label}</p>
          <p className="mt-3 font-display text-4xl font-bold">{value.toLocaleString()}</p>
        </div>
        <div className={`grid h-11 w-11 place-items-center rounded-xl bg-gradient-to-br ${accent} text-white shadow-lg`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}

export function SectionCard({
  title,
  subtitle,
  children,
  action,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-border bg-card p-6">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="font-display text-xl font-bold">{title}</h2>
          {subtitle && <p className="mt-1 text-sm text-muted-foreground">{subtitle}</p>}
        </div>
        {action}
      </div>
      {children}
    </div>
  );
}

export function ErrorState({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-background/50 p-8 text-center">
      <p className="text-sm text-muted-foreground">Something went wrong loading this data.</p>
      <button
        onClick={onRetry}
        className="mt-3 rounded-lg border border-border bg-background px-4 py-2 text-sm font-semibold hover:border-primary hover:text-primary"
      >
        Retry
      </button>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-background/50 p-8 text-center">
      <p className="text-sm text-muted-foreground">{message}</p>
    </div>
  );
}
