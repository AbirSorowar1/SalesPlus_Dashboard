import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Legend } from "recharts";
import { useFilteredOrders } from "@/lib/filters";
import { useSheet, num, fmtBDT, fmtShort, fmtNum, groupSum, type Row } from "@/lib/data";
import { Card, PageGrid, ChartTooltip, CHART_COLORS, DataTable, type Col } from "@/components/dash/ui";

export const Route = createFileRoute("/products")({
  head: () => ({
    meta: [
      { title: "Products · SalesPulse Dashboard" },
      { name: "description", content: "Top products, category profit, margins and stock levels." },
      { property: "og:title", content: "Products · SalesPulse Dashboard" },
      { property: "og:description", content: "Top products, category profit, margins and stock levels." },
    ],
  }),
  component: Products,
});

const axis = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: false };

function Products() {
  const { orders, isLoading, error, refetch } = useFilteredOrders();
  const prod = useSheet("products");
  const d = useMemo(() => {
    const agg = new Map<string, { rev: number; qty: number; profit: number }>();
    orders.forEach((o) => { const e = agg.get(o.Product_ID) ?? { rev: 0, qty: 0, profit: 0 }; e.rev += num(o.Total_Amount); e.qty += num(o.Quantity); e.profit += num(o.Profit); agg.set(o.Product_ID, e); });
    const rows = (prod.data ?? []).map((p): Row => {
      const a = agg.get(p.Product_ID) ?? { rev: 0, qty: 0, profit: 0 };
      const up = num(p.Unit_Price), cp = num(p.Cost_Price);
      return { ...p, revenue: a.rev, sold: a.qty, profit: a.profit, margin: up ? ((up - cp) / up) * 100 : 0, stock: num(p.Stock_Qty) };
    });
    return {
      rows,
      top: [...rows].sort((a, b) => b.revenue - a.revenue).slice(0, 10).map((r) => ({ name: r.Product_Name, value: r.revenue })),
      catProfit: groupSum(orders, "Category", (r) => num(r.Profit)),
      catQty: groupSum(orders, "Category", (r) => num(r.Quantity)),
    };
  }, [orders, prod.data]);
  type R = (typeof d.rows)[number];
  const cols: Col<R>[] = [
    { key: "Product_ID", label: "ID" }, { key: "Product_Name", label: "Product" }, { key: "Category", label: "Category" }, { key: "Supplier", label: "Supplier" },
    { key: "Unit_Price", label: "Price", align: "right", sort: (r) => num(r.Unit_Price), render: (r) => fmtBDT(num(r.Unit_Price)) },
    { key: "margin", label: "Margin", align: "right", sort: (r) => r.margin, render: (r) => r.margin.toFixed(0) + "%" },
    { key: "stock", label: "Stock", align: "right", sort: (r) => r.stock, render: (r) => <span className={r.stock < 50 ? "font-semibold text-orange" : ""}>{fmtNum(r.stock)}</span> },
    { key: "sold", label: "Sold", align: "right", sort: (r) => r.sold, render: (r) => fmtNum(r.sold) },
    { key: "revenue", label: "Revenue", align: "right", sort: (r) => r.revenue, render: (r) => fmtBDT(r.revenue) },
  ];
  return (
    <PageGrid loading={isLoading || prod.isLoading} error={error || prod.error} refetch={() => { refetch(); prod.refetch(); }}>
      <Card title="Top 10 products by revenue"><div className="h-80"><ResponsiveContainer><BarChart data={d.top} layout="vertical" margin={{ left: 10 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} /><XAxis type="number" {...axis} tickFormatter={fmtShort} /><YAxis type="category" dataKey="name" {...axis} width={120} /><ChartTooltip />
        <Bar dataKey="value" name="Revenue" fill="var(--chart-1)" radius={[0, 8, 8, 0]} /></BarChart></ResponsiveContainer></div></Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Profit by category"><div className="h-72"><ResponsiveContainer><BarChart data={d.catProfit}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} /><XAxis dataKey="name" {...axis} /><YAxis {...axis} tickFormatter={fmtShort} width={55} /><ChartTooltip />
          <Bar dataKey="value" name="Profit" radius={[8, 8, 0, 0]}>{d.catProfit.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % 5]} />)}</Bar></BarChart></ResponsiveContainer></div></Card>
        <Card title="Units sold by category"><div className="h-72"><ResponsiveContainer><PieChart>
          <Pie data={d.catQty} dataKey="value" nameKey="name" innerRadius="50%" outerRadius="80%" paddingAngle={3}>{d.catQty.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % 5]} stroke="var(--card)" />)}</Pie>
          <ChartTooltip money={false} /><Legend wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer></div></Card>
      </div>
      <Card title="Product catalog"><DataTable rows={d.rows} cols={cols} /></Card>
    </PageGrid>
  );
}
