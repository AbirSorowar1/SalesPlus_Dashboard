import Papa from "papaparse";
import { useQuery } from "@tanstack/react-query";
import { SHEET_URLS, REFRESH_INTERVAL_MS } from "@/config/sheets";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type Row = Record<string, any>;

export const num = (v: unknown) => {
  const n = parseFloat(String(v ?? "").replace(/[,৳\s%]/g, ""));
  return Number.isFinite(n) ? n : 0;
};

async function fetchCsv(url: string): Promise<Row[]> {
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) throw new Error(`Could not load sheet (HTTP ${res.status})`);
  const text = await res.text();
  if (text.trim().startsWith("<")) throw new Error("Sheet is not public or URL is wrong");
  const parsed = Papa.parse<Row>(text, { header: true, skipEmptyLines: true });
  return parsed.data;
}

export function useSheet(key: keyof typeof SHEET_URLS) {
  return useQuery({
    queryKey: ["sheet", key],
    queryFn: () => fetchCsv(SHEET_URLS[key]),
    refetchInterval: REFRESH_INTERVAL_MS,
    staleTime: 30_000,
  });
}

export const fmtBDT = (n: number) =>
  "৳" + Math.round(n).toLocaleString("en-US");
export const fmtShort = (n: number) => {
  const a = Math.abs(n);
  if (a >= 1e7) return "৳" + (n / 1e7).toFixed(1) + "Cr";
  if (a >= 1e5) return "৳" + (n / 1e5).toFixed(1) + "L";
  if (a >= 1e3) return "৳" + (n / 1e3).toFixed(0) + "K";
  return "৳" + Math.round(n);
};
export const fmtNum = (n: number) => Math.round(n).toLocaleString("en-US");

export function groupSum<T extends Row>(rows: T[], key: string, val: (r: T) => number) {
  const m = new Map<string, number>();
  rows.forEach((r) => m.set(r[key] || "—", (m.get(r[key] || "—") ?? 0) + val(r)));
  return [...m.entries()].map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
}

export const isReturned = (r: Row) => /return/i.test(r.Order_Status ?? "");

export function monthly(orders: Row[]) {
  const m = new Map<string, { revenue: number; profit: number; orders: number }>();
  orders.forEach((r) => {
    const k = (r.Order_Date ?? "").slice(0, 7);
    if (!k) return;
    const e = m.get(k) ?? { revenue: 0, profit: 0, orders: 0 };
    e.revenue += num(r.Total_Amount); e.profit += num(r.Profit); e.orders++;
    m.set(k, e);
  });
  return [...m.entries()].sort().map(([month, v]) => ({ month, ...v }));
}
