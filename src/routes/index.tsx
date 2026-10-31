import { createFileRoute } from "@tanstack/react-router";
import { useMemo } from "react";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, CartesianGrid, BarChart, Bar, PieChart, Pie, Cell, Legend } from "recharts";
import { Wallet, PiggyBank, ShoppingCart, Receipt, Star, Undo2 } from "lucide-react";
import { useFilteredOrders } from "@/lib/filters";
import { num, fmtBDT, fmtShort, fmtNum, groupSum, isReturned, monthly, type Row } from "@/lib/data";
import { Card, Kpi, PageGrid, ChartTooltip, CHART_COLORS, DataTable, StatusBadge, type Col } from "@/components/dash/ui";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Overview · SalesPulse Dashboard" },
      { name: "description", content: "Live sales KPIs, revenue trends and recent orders from Google Sheets." },
      { property: "og:title", content: "Overview · SalesPulse Dashboard" },
      { property: "og:description", content: "Live sales KPIs, revenue trends and recent orders from Google Sheets." },
    ],
  }),
  component: Overview,
});

const axis = { stroke: "var(--muted-foreground)", fontSize: 11, tickLine: false, axisLine: false };

function Overview() {
  const { orders, isLoading, error, refetch } = useFilteredOrders();
  const s = useMemo(() => {
    const rev = orders.reduce((a, r) => a + num(r.Total_Amount), 0);
    const profit = orders.reduce((a, r) => a + num(r.Profit), 0);
    const rated = orders.filter((r) => num(r.Customer_Rating) > 0);
    return {
      rev, profit, n: orders.length,
      aov: orders.length ? rev / orders.length : 0,
      rating: rated.length ? rated.reduce((a, r) => a + num(r.Customer_Rating), 0) / rated.length : 0,
      ret: orders.length ? (orders.filter(isReturned).length / orders.length) * 100 : 0,
      monthly: monthly(orders),
      cat: groupSum(orders, "Category", (r) => num(r.Total_Amount)),
      pay: groupSum(orders, "Payment_Method", () => 1),
      div: groupSum(orders, "Division", (r) => num(r.Total_Amount)),
      recent: [...orders].sort((a, b) => (b.Order_Date > a.Order_Date ? 1 : -1)),
    };
  }, [orders]);

  const cols: Col<Row>[] = [
    { key: "Order_ID", label: "Order" },
    { key: "Order_Date", label: "Date" },
    { key: "Customer_Name", label: "Customer" },
    { key: "Product_Name", label: "Product" },
    { key: "Division", label: "Division" },
    { key: "Total_Amount", label: "Amount", align: "right", sort: (r) => num(r.Total_Amount), render: (r) => fmtBDT(num(r.Total_Amount)) },
    { key: "Order_Status", label: "Status", render: (r) => <StatusBadge s={r.Order_Status} /> },
  ];

  return (
    <PageGrid loading={isLoading} error={error} refetch={refetch}>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 2xl:grid-cols-6">
        <Kpi label="Total Revenue" value={fmtBDT(s.rev)} icon={<Wallet className="h-5 w-5" />} />
        <Kpi label="Total Profit" value={fmtBDT(s.profit)} icon={<PiggyBank className="h-5 w-5" />} tone="teal" />
        <Kpi label="Orders" value={fmtNum(s.n)} icon={<ShoppingCart className="h-5 w-5" />} tone="orange" />
        <Kpi label="Avg Order Value" value={fmtBDT(s.aov)} icon={<Receipt className="h-5 w-5" />} />
        <Kpi label="Avg Rating" value={s.rating.toFixed(2) + " ★"} icon={<Star className="h-5 w-5" />} tone="orange" />
        <Kpi label="Return Rate" value={s.ret.toFixed(1) + "%"} icon={<Undo2 className="h-5 w-5" />} tone="teal" />
      </div>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card title="Monthly revenue" className="lg:col-span-2">
          <div className="h-72"><ResponsiveContainer>
            <LineChart data={s.monthly}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="month" {...axis} /><YAxis {...axis} tickFormatter={fmtShort} width={55} /><ChartTooltip />
              <Line type="monotone" dataKey="revenue" name="Revenue" stroke="var(--chart-1)" strokeWidth={3} dot={false} activeDot={{ r: 5 }} />
              <Line type="monotone" dataKey="profit" name="Profit" stroke="var(--chart-2)" strokeWidth={2} dot={false} />
            </LineChart></ResponsiveContainer></div>
        </Card>
        <Card title="Payment methods (orders)">
          <div className="h-72"><ResponsiveContainer>
            <PieChart><Pie data={s.pay} dataKey="value" nameKey="name" innerRadius="55%" outerRadius="80%" paddingAngle={3}>
              {s.pay.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % 5]} stroke="var(--card)" />)}</Pie>
              <ChartTooltip money={false} /><Legend wrapperStyle={{ fontSize: 11 }} /></PieChart></ResponsiveContainer></div>
        </Card>
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        <Card title="Revenue by category">
          <div className="h-72"><ResponsiveContainer>
            <BarChart data={s.cat}><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" vertical={false} />
              <XAxis dataKey="name" {...axis} /><YAxis {...axis} tickFormatter={fmtShort} width={55} /><ChartTooltip />
              <Bar dataKey="value" name="Revenue" radius={[8, 8, 0, 0]}>{s.cat.map((_, i) => <Cell key={i} fill={CHART_COLORS[i % 5]} />)}</Bar>
            </BarChart></ResponsiveContainer></div>
        </Card>
        <Card title="Revenue by division">
          <div className="h-72"><ResponsiveContainer>
            <BarChart data={s.div} layout="vertical"><CartesianGrid strokeDasharray="3 3" stroke="var(--border)" horizontal={false} />
              <XAxis type="number" {...axis} tickFormatter={fmtShort} /><YAxis type="category" dataKey="name" {...axis} width={85} /><ChartTooltip />
              <Bar dataKey="value" name="Revenue" fill="var(--chart-2)" radius={[0, 8, 8, 0]} />
            </BarChart></ResponsiveContainer></div>
        </Card>
      </div>
      <Card title="Recent orders"><DataTable rows={s.recent} cols={cols} pageSize={8} /></Card>
    </PageGrid>
  );
}
