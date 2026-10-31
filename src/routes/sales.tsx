import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, PieChart, Pie, Cell, Legend, AreaChart, Area } from "recharts";
import { useFilteredOrders } from "@/lib/filters";
import { useSheet, num, fmtBDT, fmtShort, groupSum, monthly, type Row } from "@/lib/data";
import { Card, PageGrid, ChartTooltip, CHART_COLORS, DataTable, StatusBadge, type Col } from "@/components/dash/ui";

export const Route = createFileRoute("/sales")({
  head: () => ({
    meta: [
      { title: "Sales · SalesPulse Dashboard" },
      { name: "description", content: "Sales channels, order status, rep performance and all orders." },
      { property: "og:title", content: "Sales · SalesPulse Dashboard" },
      { property: "og:description", content: "Sales channels, order status, rep performance and all orders." },
    ],
  }),
  component: Sales,
});

const axis = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: false };

function Sales() {
  const { orders, isLoading, error, refetch } = useFilteredOrders();
  const team = useSheet("salesTeam");
  const d = useMemo(() => {
    const reps = new Map((team.data ?? []).map((r) => [r.Rep_ID, r]));
    const months = new Set(orders.map((o) => o.Order_Date?.slice(0, 7))).size || 1;
    const repRows = groupSum(orders, "Sales_Rep_ID", (r) => num(r.Total_Amount)).map((g) => {
      const rep = reps.get(g.name);
      const target = num(rep?.Monthly_Target) * months;
      const os = orders.filter((o) => o.Sales_Rep_ID === g.name);
      return { Rep_ID: g.name, Rep_Name: rep?.Rep_Name ?? g.name, Division: rep?.Division ?? "", revenue: g.value, profit: os.reduce((a, o) => a + num(o.Profit), 0), orders: os.length, target, pct: target ? (g.value / target) * 100 : 0 };
    });
    return {
      monthly: monthly(orders),
      channel: groupSum(orders, "Sales_Channel", (r) => num(r.Total_Amount)),
      status: groupSum(orders, "Order_Status", () => 1),
      repRows,
    };
  }, [orders, team.data]);

  const orderCols: Col<Row>[] = [
    { key: "Order_ID", label: "Order" }, { key: "Order_Date", label: "Date" }, { key: "Customer_Name", label: "Customer" },
    { key: "Product_Name", label: "Product" }, { key: "Sales_Channel", label: "Channel" },
    { key: "Quantity", label: "Qty", align: "right", sort: (r) => num(r.Quantity) },
    { key: "Total_Amount", label: "Amount", align: "right", sort: (r) => num(r.Total_Amount), render: (r) => fmtBDT(num(r.Total_Amount)) },
    { key: "Profit", label: "Profit", align: "right", sort: (r) => num(r.Profit), render: (r) => fmtBDT(num(r.Profit)) },
    { key: "Order_Status", label: "Status", render: (r) => <StatusBadge s={r.Order_Status} /> },
  ];
  type Rep = (typeof d.repRows)[number];
  const repCols: Col<Rep>[] = [
    { key: "Rep_Name", label: "Rep" }, { key: "Division", label: "Division" },
    { key: "orders", label: "Orders", align: "right", sort: (r) => r.orders },
    { key: "revenue", label: "Revenue", align: "right", sort: (r) => r.revenue, render: (r) => fmtBDT(r.revenue) },
    { key: "profit", label: "Profit", align: "right", sort: (r) => r.profit, render: (r) => fmtBDT(r.profit) },
    { key: "target", label: "Target", align: "right", sort: (r) => r.target, render: (r) => fmtBDT(r.target) },
    { key: "pct", label: "Achieved", align: "right", sort: (r) => r.pct, render: (r) => <span className={r.pct >= 100 ? "text-teal font-semibold" : "text-orange font-semibold"}>{r.pct.toFixed(0)}%</span> },
  ];

  return (
    <PageGrid loading={isLoading} error={error} refetch={refetch}>
      <Card title="Revenue & profit trend">
        <div className="h-72"><ResponsiveContainer><AreaChart data={d.monthly}>
          <defs><linearGradient id="g1" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stopColor="var(--chart-2)" stopOpacity={0.4} /><stop offset="100%" stopColor="var(--chart-2)" stopOpacity={0} /></linearGradient></defs>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} /><XAxis dataKey="month" {...axis} /><YAxis {...axis} tickFormatter={fmtShort} width={55} /><ChartTooltip />
          <Area type="monotone" dataKey="revenue" name="Revenue" stroke="var(--chart-2)" fill="url(#g1)" strokeWidth={2.5} />
          <Area type="monotone" dataKey="profit" name="Profit" stroke="var(--chart-3)" fill="transparent" strokeWidth={2} />
        </AreaChart></ResponsiveContainer></div>
      </Card>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Revenue by sales channel"><div className="h-72"><ResponsiveContainer><BarChart data={d.channel}>
          <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} /><XAxis dataKey="name" {...axis} /><YAxis {...axis} tickFormatter={fmtShort} width={55} /><ChartTooltip />
          <Bar dataKey="value" name="Revenue" radius={[8, 8, 0, 0]}>{d.channel.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % 5]} />)}</Bar>
        </BarChart></ResponsiveContainer></div></Card>
        <Card title="Order status"><div className="h-72"><ResponsiveContainer><PieChart>
          <Pie data={d.status} dataKey="value" nameKey="name" innerRadius="50%" outerRadius="80%" paddingAngle={3}>{d.status.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % 5]} stroke="var(--card)" />)}</Pie>
          <ChartTooltip money={false} /><Legend wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer></div></Card>
      </div>
      <Card title="Sales team performance"><DataTable rows={d.repRows} cols={repCols} searchable={false} /></Card>
      <Card title="All orders"><DataTable rows={orders} cols={orderCols} /></Card>
    </PageGrid>
  );
}
