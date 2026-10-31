import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { useSheet, type Row } from "@/lib/data";

export type Filters = { from: string; to: string; division: string; category: string; status: string };
const empty: Filters = { from: "", to: "", division: "all", category: "all", status: "all" };

const Ctx = createContext<{ filters: Filters; setFilters: (f: Filters) => void; reset: () => void } | null>(null);

export function FiltersProvider({ children }: { children: ReactNode }) {
  const [filters, setFilters] = useState<Filters>(empty);
  return <Ctx.Provider value={{ filters, setFilters, reset: () => setFilters(empty) }}>{children}</Ctx.Provider>;
}

export function useFilters() {
  const c = useContext(Ctx);
  if (!c) throw new Error("FiltersProvider missing");
  return c;
}

export function applyFilters(rows: Row[], f: Filters) {
  return rows.filter((r) => {
    const d = (r.Order_Date ?? "").slice(0, 10);
    if (f.from && d < f.from) return false;
    if (f.to && d > f.to) return false;
    if (f.division !== "all" && r.Division !== f.division) return false;
    if (f.category !== "all" && r.Category !== f.category) return false;
    if (f.status !== "all" && r.Order_Status !== f.status) return false;
    return true;
  });
}

export function useFilteredOrders() {
  const q = useSheet("orders");
  const { filters } = useFilters();
  const orders = useMemo(() => applyFilters(q.data ?? [], filters), [q.data, filters]);
  return { ...q, orders, all: q.data ?? [] };
}
