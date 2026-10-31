import { useMemo, useState, type ReactNode } from "react";
import { ArrowUpDown, Search, AlertTriangle } from "lucide-react";
import { Tooltip as RTooltip } from "recharts";
import { fmtBDT } from "@/lib/data";

export const CHART_COLORS = [
  "var(--chart-1)", "var(--chart-2)", "var(--chart-3)", "var(--chart-4)", "var(--chart-5)",
];

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-xl bg-muted ${className}`} />;
}

export function Card({ title, children, className = "", action }: { title?: string; children: ReactNode; className?: string; action?: ReactNode }) {
  return (
    <section className={`rounded-2xl border bg-card p-4 shadow-soft transition-shadow hover:shadow-lift sm:p-5 ${className}`}>
      {title && (
        <div className="mb-3 flex items-center justify-between gap-2">
          <h3 className="text-sm font-semibold text-card-foreground">{title}</h3>
          {action}
        </div>
      )}
      {children}
    </section>
  );
}

export function Kpi({ label, value, icon, tone = "primary" }: { label: string; value: string; icon: ReactNode; tone?: "primary" | "teal" | "orange" }) {
  const toneCls = { primary: "bg-primary/10 text-primary", teal: "bg-teal/15 text-teal", orange: "bg-orange/15 text-orange" }[tone];
  return (
    <div className="flex items-center gap-3 rounded-2xl border bg-card p-4 shadow-soft transition hover:-translate-y-0.5 hover:shadow-lift">
      <div className={`grid h-11 w-11 shrink-0 place-items-center rounded-xl ${toneCls}`}>{icon}</div>
      <div className="min-w-0">
        <p className="truncate text-xs text-muted-foreground">{label}</p>
        <p title={value} className="truncate text-lg font-bold tracking-tight text-card-foreground sm:text-xl">{value}</p>
      </div>
    </div>
  );
}

export function ErrorBox({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-start gap-3 rounded-2xl border border-destructive/40 bg-destructive/10 p-4 text-sm sm:flex-row sm:items-center">
      <AlertTriangle className="h-5 w-5 text-destructive" />
      <p className="flex-1 text-foreground">Couldn't load data from Google Sheets: {(error as Error)?.message}</p>
      <button onClick={onRetry} className="rounded-lg bg-destructive px-3 py-1.5 font-medium text-destructive-foreground">Retry</button>
    </div>
  );
}

export function ChartTooltip({ money = true }: { money?: boolean }) {
  return (
    <RTooltip
      cursor={{ fill: "var(--muted)", opacity: 0.5 }}
      contentStyle={{ background: "var(--popover)", border: "1px solid var(--border)", borderRadius: 12, color: "var(--popover-foreground)", boxShadow: "var(--shadow-lift)" }}
      labelStyle={{ color: "var(--muted-foreground)" }}
      formatter={(v: number) => (money ? fmtBDT(v) : Math.round(v).toLocaleString("en-US"))}
    />
  );
}

export type Col<T> = { key: string; label: string; render?: (r: T) => ReactNode; sort?: (r: T) => number | string; align?: "right" };

export function DataTable<T extends Record<string, unknown>>({ rows, cols, pageSize = 10, searchable = true }: { rows: T[]; cols: Col<T>[]; pageSize?: number; searchable?: boolean }) {
  const [q, setQ] = useState("");
  const [sort, setSort] = useState<{ key: string; dir: 1 | -1 } | null>(null);
  const [page, setPage] = useState(0);
  const data = useMemo(() => {
    let d = rows;
    if (q) {
      const s = q.toLowerCase();
      d = d.filter((r) => Object.values(r).some((v) => String(v).toLowerCase().includes(s)));
    }
    if (sort) {
      const c = cols.find((c) => c.key === sort.key)!;
      const get = c.sort ?? ((r: T) => String(r[c.key] ?? ""));
      d = [...d].sort((a, b) => (get(a) > get(b) ? 1 : get(a) < get(b) ? -1 : 0) * sort.dir);
    }
    return d;
  }, [rows, q, sort, cols]);
  const pages = Math.max(1, Math.ceil(data.length / pageSize));
  const p = Math.min(page, pages - 1);
  return (
    <div>
      {searchable && (
        <div className="relative mb-3 max-w-xs">
          <Search className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
          <input value={q} onChange={(e) => { setQ(e.target.value); setPage(0); }} placeholder="Search…" className="w-full rounded-xl border bg-background py-2 pl-9 pr-3 text-sm outline-none focus:ring-2 focus:ring-ring" />
        </div>
      )}
      <div className="overflow-x-auto rounded-xl border">
        <table className="w-full min-w-[600px] text-sm">
          <thead className="bg-muted/60 text-left text-xs text-muted-foreground">
            <tr>
              {cols.map((c) => (
                <th key={c.key} className={`px-3 py-2.5 font-medium ${c.align === "right" ? "text-right" : ""}`}>
                  <button className="inline-flex items-center gap-1 hover:text-foreground" onClick={() => setSort((s) => ({ key: c.key, dir: s?.key === c.key && s.dir === 1 ? -1 : 1 }))}>
                    {c.label}<ArrowUpDown className="h-3 w-3" />
                  </button>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(p * pageSize, (p + 1) * pageSize).map((r, i) => (
              <tr key={i} className="border-t transition-colors hover:bg-muted/40">
                {cols.map((c) => (
                  <td key={c.key} className={`whitespace-nowrap px-3 py-2.5 ${c.align === "right" ? "text-right tabular-nums" : ""}`}>{c.render ? c.render(r) : String(r[c.key] ?? "")}</td>
                ))}
              </tr>
            ))}
            {data.length === 0 && <tr><td colSpan={cols.length} className="px-3 py-8 text-center text-muted-foreground">No results</td></tr>}
          </tbody>
        </table>
      </div>
      {pages > 1 && (
        <div className="mt-3 flex items-center justify-end gap-2 text-xs text-muted-foreground">
          <button disabled={p === 0} onClick={() => setPage(p - 1)} className="rounded-lg border px-2.5 py-1 disabled:opacity-40">Prev</button>
          <span>{p + 1} / {pages}</span>
          <button disabled={p >= pages - 1} onClick={() => setPage(p + 1)} className="rounded-lg border px-2.5 py-1 disabled:opacity-40">Next</button>
        </div>
      )}
    </div>
  );
}

export function StatusBadge({ s }: { s: string }) {
  const cls = /deliver|complete/i.test(s) ? "bg-teal/15 text-teal" : /return|cancel/i.test(s) ? "bg-destructive/15 text-destructive" : "bg-orange/15 text-orange";
  return <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${cls}`}>{s}</span>;
}

export function PageGrid({ loading, error, refetch, children }: { loading: boolean; error: unknown; refetch: () => void; children: ReactNode }) {
  if (error) return <ErrorBox error={error} onRetry={refetch} />;
  if (loading)
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">{Array.from({ length: 6 }).map((_, i) => <Skeleton key={i} className="h-20" />)}</div>
        <div className="grid gap-4 lg:grid-cols-2"><Skeleton className="h-72" /><Skeleton className="h-72" /></div>
        <Skeleton className="h-80" />
      </div>
    );
  return <>{children}</>;
}
