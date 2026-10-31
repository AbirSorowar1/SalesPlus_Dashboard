import { useEffect, useMemo, useState, type ReactNode } from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { useIsFetching, useQueryClient } from "@tanstack/react-query";
import { LayoutDashboard, TrendingUp, Users, Package, Megaphone, RefreshCw, Filter, X, Menu } from "lucide-react";
import { useFilters } from "@/lib/filters";
import { useSheet } from "@/lib/data";

const NAV = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/sales", label: "Sales", icon: TrendingUp },
  { to: "/customers", label: "Customers", icon: Users },
  { to: "/products", label: "Products", icon: Package },
  { to: "/marketing", label: "Marketing", icon: Megaphone },
] as const;

function SidebarContent({ path, onNavigate }: { path: string; onNavigate?: () => void }) {
  return (
    <>
      <div className="mb-8 flex items-center gap-2 px-2">
        <div className="grid h-9 w-9 place-items-center rounded-xl bg-gradient-brand font-bold text-primary-foreground">৳</div>
        <div><p className="font-bold text-sidebar-foreground">SalesPulse</p><p className="text-xs text-muted-foreground">Bangladesh</p></div>
      </div>
      <nav className="space-y-1">
        {NAV.map((n) => {
          const active = path === n.to;
          return (
            <Link key={n.to} to={n.to} onClick={onNavigate} className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition ${active ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-soft" : "text-sidebar-foreground hover:bg-sidebar-accent"}`}>
              <n.icon className="h-4 w-4" />{n.label}
            </Link>
          );
        })}
      </nav>
      <p className="mt-auto px-2 pt-6 text-xs text-muted-foreground">Auto-refreshes every 60s</p>
    </>
  );
}

function FilterBar({ onClose }: { onClose?: () => void }) {
  const { filters, setFilters, reset } = useFilters();
  const { data = [] } = useSheet("orders");
  const opts = useMemo(() => {
    const u = (k: string) => [...new Set(data.map((r) => r[k]).filter(Boolean))].sort();
    return { division: u("Division"), category: u("Category"), status: u("Order_Status") };
  }, [data]);
  const field = "w-full rounded-xl border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring";
  const sel = (k: "division" | "category" | "status", label: string) => (
    <label className="text-xs text-muted-foreground">{label}
      <select className={field + " mt-1"} value={filters[k]} onChange={(e) => setFilters({ ...filters, [k]: e.target.value })}>
        <option value="all">All</option>
        {opts[k].map((o) => <option key={o}>{o}</option>)}
      </select>
    </label>
  );
  return (
    <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6 xl:items-end">
      <label className="text-xs text-muted-foreground">From<input type="date" className={field + " mt-1"} value={filters.from} onChange={(e) => setFilters({ ...filters, from: e.target.value })} /></label>
      <label className="text-xs text-muted-foreground">To<input type="date" className={field + " mt-1"} value={filters.to} onChange={(e) => setFilters({ ...filters, to: e.target.value })} /></label>
      {sel("division", "Division")}
      {sel("category", "Category")}
      {sel("status", "Order status")}
      <div className="flex gap-2">
        <button onClick={reset} className="flex-1 rounded-xl border px-3 py-2 text-sm hover:bg-muted">Reset</button>
        {onClose && <button onClick={onClose} className="flex-1 rounded-xl bg-primary px-3 py-2 text-sm text-primary-foreground">Done</button>}
      </div>
    </div>
  );
}

export function Shell({ children }: { children: ReactNode }) {
  const path = useRouterState({ select: (s) => s.location.pathname });
  const qc = useQueryClient();
  const fetching = useIsFetching() > 0;
  const [showFilters, setShowFilters] = useState(false);
  const [navOpen, setNavOpen] = useState(false);
  const { dataUpdatedAt } = useSheet("orders");
  const [updated, setUpdated] = useState("");
  useEffect(() => { if (dataUpdatedAt) setUpdated(new Date(dataUpdatedAt).toLocaleTimeString()); }, [dataUpdatedAt]);
  useEffect(() => { setNavOpen(false); }, [path]);
  const title = NAV.find((n) => n.to === path)?.label ?? "Dashboard";

  return (
    <div className="flex min-h-screen w-full bg-background">
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-20 border-b bg-background/85 backdrop-blur">
          <div className="flex items-center gap-2 px-4 py-3 sm:px-6">
            <button onClick={() => setNavOpen(true)} className="grid h-9 w-9 shrink-0 place-items-center rounded-xl border bg-card text-foreground hover:bg-muted lg:hidden" aria-label="Open menu"><Menu className="h-4 w-4" /></button>
            <div className="min-w-0 flex-1">
              <h1 className="truncate text-lg font-bold text-foreground sm:text-xl">{title}</h1>
              <p className="text-xs text-muted-foreground">{updated ? `Live from Google Sheets · updated ${updated}` : "Connecting to Google Sheets…"}</p>
            </div>
            <button onClick={() => setShowFilters((v) => !v)} className="grid h-9 w-9 place-items-center rounded-xl border bg-card text-foreground hover:bg-muted xl:hidden" aria-label="Filters"><Filter className="h-4 w-4" /></button>
            <button onClick={() => qc.invalidateQueries({ queryKey: ["sheet"] })} className="inline-flex h-9 items-center gap-2 rounded-xl bg-primary px-3 text-sm font-medium text-primary-foreground hover:opacity-90">
              <RefreshCw className={`h-4 w-4 ${fetching ? "animate-spin" : ""}`} /><span className="hidden sm:inline">Refresh</span>
            </button>
          </div>
          <div className={`${showFilters ? "block" : "hidden"} border-t px-4 py-3 sm:px-6 xl:block`}>
            <FilterBar onClose={showFilters ? () => setShowFilters(false) : undefined} />
          </div>
        </header>
        <main className="flex-1 space-y-4 p-4 sm:p-6">{children}</main>
      </div>

      {/* Right sidebar (desktop) */}
      <aside className="sticky top-0 hidden h-screen w-60 shrink-0 flex-col border-l bg-sidebar p-4 lg:flex">
        <SidebarContent path={path} />
      </aside>

      {/* Sidebar drawer (mobile/tablet) */}
      {navOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button aria-label="Close menu" onClick={() => setNavOpen(false)} className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
          <aside className="absolute right-0 top-0 flex h-full w-64 flex-col border-l bg-sidebar p-4 shadow-2xl">
            <button aria-label="Close menu" onClick={() => setNavOpen(false)} className="absolute left-3 top-3 grid h-8 w-8 place-items-center rounded-lg text-muted-foreground hover:bg-sidebar-accent"><X className="h-4 w-4" /></button>
            <SidebarContent path={path} onNavigate={() => setNavOpen(false)} />
          </aside>
        </div>
      )}
    </div>
  );
}
