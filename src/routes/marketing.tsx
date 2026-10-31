import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, LineChart, Line, PieChart, Pie, Cell, Legend } from "recharts";
import { Megaphone, MousePointerClick, Eye, Target } from "lucide-react";
import { useSheet, num, fmtBDT, fmtShort, fmtNum, groupSum, type Row } from "@/lib/data";
import { useFilters } from "@/lib/filters";
import { Card, Kpi, PageGrid, ChartTooltip, CHART_COLORS, DataTable, type Col } from "@/components/dash/ui";

export const Route = createFileRoute("/marketing")({
  head: () => ({
    meta: [
      { title: "Marketing · SalesPulse Dashboard" },
      { name: "description", content: "Ad spend, clicks, conversions and cost per conversion by channel." },
      { property: "og:title", content: "Marketing · SalesPulse Dashboard" },
      { property: "og:description", content: "Ad spend, clicks, conversions and cost per conversion by channel." },
    ],
  }),
  component: Marketing,
});

const axis = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: false };

function Marketing() {
  const q = useSheet("marketing");
  const { filters } = useFilters();
  const d = useMemo(() => {
    const rows = (q.data ?? []).filter((r) => {
      const m = (r.Month ?? "").slice(0, 7);
      return (!filters.from || m >= filters.from.slice(0, 7)) && (!filters.to || m <= filters.to.slice(0, 7));
    }).map((r): Row => ({ ...r, spend: num(r.Spend_BDT), imp: num(r.Impressions), clicks: num(r.Clicks), conv: num(r.Conversions) }));
    const t = rows.reduce((a, r) => ({ spend: a.spend + r.spend, imp: a.imp + r.imp, clicks: a.clicks + r.clicks, conv: a.conv + r.conv }), { spend: 0, imp: 0, clicks: 0, conv: 0 });
    const channels = [...new Set(rows.map((r) => r.Channel))];
    const byMonth = new Map<string, Row>();
    rows.forEach((r) => { const k = r.Month.slice(0, 7); const e: Row = byMonth.get(k) ?? { month: k }; e[r.Channel] = r.spend; byMonth.set(k, e); });
    const ch = channels.map((c) => {
      const rs = rows.filter((r) => r.Channel === c);
      const s = rs.reduce((a, r) => a + r.spend, 0), cv = rs.reduce((a, r) => a + r.conv, 0), cl = rs.reduce((a, r) => a + r.clicks, 0);
      return { name: c, cpa: cv ? s / cv : 0, ctr: 0, cl, cv };
    });
    return { rows, t, channels, trend: [...byMonth.values()].sort((a, b) => String(a.month).localeCompare(String(b.month))), spend: groupSum(rows, "Channel", (r) => num(r.Spend_BDT)), ch };
  }, [q.data, filters]);
  type R = (typeof d.rows)[number];
  const cols: Col<R>[] = [
    { key: "Month", label: "Month" }, { key: "Channel", label: "Channel" },
    { key: "spend", label: "Spend", align: "right", sort: (r) => r.spend, render: (r) => fmtBDT(r.spend) },
    { key: "imp", label: "Impressions", align: "right", sort: (r) => r.imp, render: (r) => fmtNum(r.imp) },
    { key: "clicks", label: "Clicks", align: "right", sort: (r) => r.clicks, render: (r) => fmtNum(r.clicks) },
    { key: "ctr", label: "CTR", align: "right", sort: (r) => (r.imp ? r.clicks / r.imp : 0), render: (r) => (r.imp ? ((r.clicks / r.imp) * 100).toFixed(2) : "0") + "%" },
    { key: "conv", label: "Conversions", align: "right", sort: (r) => r.conv, render: (r) => fmtNum(r.conv) },
    { key: "cpa", label: "Cost / conv.", align: "right", sort: (r) => (r.conv ? r.spend / r.conv : 0), render: (r) => fmtBDT(r.conv ? r.spend / r.conv : 0) },
  ];
  return (
    <PageGrid loading={q.isLoading} error={q.error} refetch={q.refetch}>
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <Kpi label="Total Spend" value={fmtBDT(d.t.spend)} icon={<Megaphone className="h-5 w-5" />} />
        <Kpi label="Impressions" value={fmtNum(d.t.imp)} icon={<Eye className="h-5 w-5" />} tone="teal" />
        <Kpi label="Clicks (CTR)" value={`${fmtNum(d.t.clicks)} · ${d.t.imp ? ((d.t.clicks / d.t.imp) * 100).toFixed(1) : 0}%`} icon={<MousePointerClick className="h-5 w-5" />} tone="orange" />
        <Kpi label="Conversions" value={`${fmtNum(d.t.conv)} · ${fmtBDT(d.t.conv ? d.t.spend / d.t.conv : 0)}/conv`} icon={<Target className="h-5 w-5" />} />
      </div>
      <Card title="Monthly spend by channel"><div className="h-72"><ResponsiveContainer><LineChart data={d.trend}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} /><XAxis dataKey="month" {...axis} /><YAxis {...axis} tickFormatter={fmtShort} width={55} /><ChartTooltip /><Legend wrapperStyle={{ fontSize: 11 }} />
        {d.channels.map((c, i) => <Line key={c} type="monotone" dataKey={c} stroke={CHART_COLORS[i % 5]} strokeWidth={2.5} dot={false} />)}
      </LineChart></ResponsiveContainer></div></Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Spend share"><div className="h-72"><ResponsiveContainer><PieChart>
          <Pie data={d.spend} dataKey="value" nameKey="name" innerRadius="50%" outerRadius="80%" paddingAngle={3}>{d.spend.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % 5]} stroke="var(--card)" />)}</Pie>
          <ChartTooltip /><Legend wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer></div></Card>
        <Card title="Cost per conversion by channel"><div className="h-72"><ResponsiveContainer><BarChart data={d.ch}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} /><XAxis dataKey="name" {...axis} /><YAxis {...axis} tickFormatter={fmtShort} width={55} /><ChartTooltip />
          <Bar dataKey="cpa" name="Cost / conversion" radius={[8, 8, 0, 0]}>{d.ch.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % 5]} />)}</Bar></BarChart></ResponsiveContainer></div></Card>
      </div>
      <Card title="Campaign data"><DataTable rows={d.rows} cols={cols} /></Card>
    </PageGrid>
  );
}
