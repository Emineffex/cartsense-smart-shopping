import { createFileRoute, Link, Outlet, useNavigate, useRouterState } from "@tanstack/react-router";
import { useEffect } from "react";
import { LayoutDashboard, Tag, Ticket, Store, BarChart3, ShieldCheck } from "lucide-react";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { AnimatedBackground } from "@/components/animated-background";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin, bootstrapFirstAdmin } from "@/hooks/use-admin";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";

export const Route = createFileRoute("/admin")({
  head: () => ({
    meta: [
      { title: "Admin — CartSense" },
      { name: "description", content: "CartSense admin panel." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLayout,
});

const tabs: ReadonlyArray<{ to: string; label: string; icon: typeof LayoutDashboard; exact?: boolean }> = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, exact: true },
  { to: "/admin/deals", label: "Featured Deals", icon: Tag },
  { to: "/admin/coupons", label: "Coupons", icon: Ticket },
  { to: "/admin/stores", label: "Stores", icon: Store },
  { to: "/admin/analytics", label: "Analytics", icon: BarChart3 },
];

function AdminLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { data: isAdmin, isLoading: checking, refetch } = useIsAdmin();
  const qc = useQueryClient();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth" });
  }, [loading, user, navigate]);

  const busy = loading || checking || !user;

  if (busy) {
    return (
      <div className="relative min-h-screen">
        <AnimatedBackground />
        <Navbar />
        <div className="mx-auto max-w-7xl px-4 py-24">
          <div className="h-64 animate-pulse rounded-3xl bg-card/50" />
        </div>
        <Footer />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="relative min-h-screen">
        <AnimatedBackground />
        <Navbar />
        <div className="mx-auto flex max-w-2xl flex-col items-center px-4 py-24 text-center">
          <div className="grid h-14 w-14 place-items-center rounded-2xl bg-brand-gradient text-brand-foreground shadow-lg shadow-primary/20">
            <ShieldCheck className="h-6 w-6" />
          </div>
          <h1 className="mt-4 font-display text-3xl font-bold">Admin access required</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            This area is restricted to admins. If no admin has been set up yet, you can claim the
            first admin role for your account.
          </p>
          <button
            onClick={async () => {
              const ok = await bootstrapFirstAdmin();
              if (ok) {
                await qc.invalidateQueries({ queryKey: ["is-admin"] });
                refetch();
              } else {
                alert("An admin already exists. Ask an existing admin to grant you access.");
              }
            }}
            className="mt-6 rounded-lg bg-brand-gradient px-4 py-2 text-sm font-semibold text-brand-foreground shadow-lg shadow-primary/20"
          >
            Claim first admin
          </button>
          <Link to="/" className="mt-3 text-sm text-muted-foreground hover:text-primary">
            Back to home
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />
      <Navbar />
      <div className="mx-auto max-w-7xl px-4 pt-10 pb-16 sm:px-6 lg:px-8">
        <div className="mb-8">
          <p className="text-xs font-semibold uppercase tracking-wider text-primary">Admin</p>
          <h1 className="mt-1 font-display text-3xl font-bold sm:text-4xl">
            <span className="text-brand-gradient">CartSense</span> Control Panel
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Manage deals, coupons, stores and analytics.
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[240px_1fr]">
          <aside className="rounded-2xl border border-border bg-card p-2 h-fit lg:sticky lg:top-24">
            <nav className="flex gap-1 overflow-x-auto lg:flex-col lg:overflow-visible">
              {tabs.map((t) => {
                const active = t.exact ? pathname === t.to : pathname.startsWith(t.to);
                return (
                  <Link
                    key={t.to}
                    to={t.to}
                    className={cn(
                      "flex w-full items-center gap-3 whitespace-nowrap rounded-xl px-3 py-2.5 text-sm font-medium transition-colors",
                      active
                        ? "bg-brand-gradient text-brand-foreground shadow"
                        : "text-muted-foreground hover:bg-muted hover:text-foreground",
                    )}
                  >
                    <t.icon className="h-4 w-4" />
                    {t.label}
                  </Link>
                );
              })}
            </nav>
          </aside>

          <div className="min-w-0">
            <Outlet />
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
}
