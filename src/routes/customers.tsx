import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { useFilteredOrders } from "@/lib/filters";
import { useSheet, num, fmtBDT, fmtShort, groupSum, type Row } from "@/lib/data";
import { Card, PageGrid, ChartTooltip, CHART_COLORS, DataTable, type Col } from "@/components/dash/ui";

export const Route = createFileRoute("/customers")({
  head: () => ({
    meta: [
      { title: "Customers · SalesPulse Dashboard" },
      { name: "description", content: "Customer segments, demographics and top spenders." },
      { property: "og:title", content: "Customers · SalesPulse Dashboard" },
      { property: "og:description", content: "Customer segments, demographics and top spenders." },
    ],
  }),
  component: Customers,
});

const axis = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: false };

function Customers() {
  const { orders, isLoading, error, refetch } = useFilteredOrders();
  const cust = useSheet("customers");
  const d = useMemo(() => {
    const cs = cust.data ?? [];
    const spend = new Map<string, { s: number; n: number }>();
    orders.forEach((o) => { const e = spend.get(o.Customer_ID) ?? { s: 0, n: 0 }; e.s += num(o.Total_Amount); e.n++; spend.set(o.Customer_ID, e); });
    const rows = cs.map((c): Row => ({ ...c, spend: spend.get(c.Customer_ID)?.s ?? 0, orders: spend.get(c.Customer_ID)?.n ?? 0 }));
    const segRev = new Map(cs.map((c) => [c.Customer_ID, c.Segment]));
    const ageRev = new Map(cs.map((c) => [c.Customer_ID, c.Age_Group]));
    return {
      rows,
      segment: groupSum(cs, "Segment", () => 1),
      gender: groupSum(cs, "Gender", () => 1),
      age: groupSum(orders.map((o): Row => ({ ...o, g: ageRev.get(o.Customer_ID) ?? "—" })), "g", (r) => num(r.Total_Amount)).sort((a, b) => a.name.localeCompare(b.name)),
      segRevenue: groupSum(orders.map((o): Row => ({ ...o, g: segRev.get(o.Customer_ID) ?? "—" })), "g", (r) => num(r.Total_Amount)),
    };
  }, [orders, cust.data]);
  type R = (typeof d.rows)[number];
  const cols: Col<R>[] = [
    { key: "Customer_ID", label: "ID" }, { key: "Customer_Name", label: "Name" }, { key: "Gender", label: "Gender" },
    { key: "Age", label: "Age", align: "right", sort: (r) => num(r.Age) }, { key: "Division", label: "Division" }, { key: "City", label: "City" },
    { key: "Segment", label: "Segment" }, { key: "orders", label: "Orders", align: "right", sort: (r) => r.orders },
    { key: "spend", label: "Spend", align: "right", sort: (r) => r.spend, render: (r) => fmtBDT(r.spend) },
  ];
  return (
    <PageGrid loading={isLoading || cust.isLoading} error={error || cust.error} refetch={() => { refetch(); cust.refetch(); }}>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <Card title="Customers by segment"><div className="h-64"><ResponsiveContainer><PieChart>
          <Pie data={d.segment} dataKey="value" nameKey="name" innerRadius="50%" outerRadius="80%" paddingAngle={3}>{d.segment.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % 5]} stroke="var(--card)" />)}</Pie>
          <ChartTooltip money={false} /><Legend wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer></div></Card>
        <Card title="Gender split"><div className="h-64"><ResponsiveContainer><PieChart>
          <Pie data={d.gender} dataKey="value" nameKey="name" outerRadius="80%">{d.gender.map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 1) % 5]} stroke="var(--card)" />)}</Pie>
          <ChartTooltip money={false} /><Legend wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer></div></Card>
        <Card title="Revenue by segment" className="md:col-span-2 xl:col-span-1"><div className="h-64"><ResponsiveContainer><BarChart data={d.segRevenue}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} /><XAxis dataKey="name" {...axis} /><YAxis {...axis} tickFormatter={fmtShort} width={55} /><ChartTooltip />
          <Bar dataKey="value" name="Revenue" fill="var(--chart-3)" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
      </div>
      <Card title="Revenue by age group"><div className="h-64"><ResponsiveContainer><BarChart data={d.age}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} /><XAxis dataKey="name" {...axis} /><YAxis {...axis} tickFormatter={fmtShort} width={55} /><ChartTooltip />
        <Bar dataKey="value" name="Revenue" fill="var(--chart-2)" radius={[8, 8, 0, 0]} /></BarChart></ResponsiveContainer></div></Card>
      <Card title="Customer directory"><DataTable rows={d.rows} cols={cols} /></Card>
    </PageGrid>
  );
}
