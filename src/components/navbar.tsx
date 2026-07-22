import { Link, useRouterState } from "@tanstack/react-router";
import { Search, LayoutDashboard, Menu, LogIn, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/use-auth";
import { useIsAdmin } from "@/hooks/use-admin";

export function Navbar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const [open, setOpen] = useState(false);
  const { user, loading } = useAuth();
  const { data: isAdmin } = useIsAdmin();

  const links = [
    { to: "/", label: "Home" },
    { to: "/search", label: "Search" },
    { to: "/compare", label: "Compare" },
    { to: "/dashboard", label: "Dashboard" },
  ] as const;

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/70 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link to="/" className="flex items-center gap-2 group">
          <span className="grid h-9 w-9 place-items-center rounded-xl bg-brand-gradient text-brand-foreground shadow-lg shadow-primary/20 transition-transform group-hover:scale-105">
            <Search className="h-4 w-4" strokeWidth={2.5} />
          </span>
          <span className="font-display text-xl font-bold tracking-tight">
            Cart<span className="text-brand-gradient">Sense</span>
          </span>
        </Link>

        <nav className="hidden md:flex items-center gap-1">
          {links.map((l) => {
            const active = l.to === "/" ? pathname === "/" : pathname.startsWith(l.to);
            return (
              <Link
                key={l.to}
                to={l.to}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium rounded-lg transition-colors",
                  active
                    ? "text-primary"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {l.label}
                {active && (
                  <span className="absolute inset-x-3 -bottom-0.5 h-0.5 rounded-full bg-brand-gradient" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2">
          {!loading && (user ? (
            <Link
              to="/dashboard"
              className="hidden md:inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-4 py-2 text-sm font-medium text-brand-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02]"
            >
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </Link>
          ) : (
            <Link
              to="/auth"
              className="hidden md:inline-flex items-center gap-2 rounded-lg bg-brand-gradient px-4 py-2 text-sm font-medium text-brand-foreground shadow-lg shadow-primary/20 transition-transform hover:scale-[1.02]"
            >
              <LogIn className="h-4 w-4" />
              Sign in
            </Link>
          ))}
          <button
            onClick={() => setOpen((v) => !v)}
            className="md:hidden grid h-10 w-10 place-items-center rounded-lg border border-border"
            aria-label="Menu"
          >
            <Menu className="h-5 w-5" />
          </button>
        </div>
      </div>
      {open && (
        <div className="md:hidden border-t border-border bg-background">
          <div className="flex flex-col p-2">
            {links.map((l) => (
              <Link
                key={l.to}
                to={l.to}
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-3 text-sm font-medium hover:bg-muted"
              >
                {l.label}
              </Link>
            ))}
            {!user && (
              <Link
                to="/auth"
                onClick={() => setOpen(false)}
                className="rounded-lg px-4 py-3 text-sm font-semibold text-primary hover:bg-muted"
              >
                Sign in
              </Link>
            )}
          </div>
        </div>
      )}
    </header>
  );
}
