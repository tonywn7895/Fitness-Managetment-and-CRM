import React, { useEffect, useState } from "react";
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";

const API = "http://localhost:5001";
const COLORS = ["#4F46E5", "#16A34A", "#F59E0B", "#EF4444", "#06B6D4"];

function SalesOverview() {
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [summary, setSummary] = useState(null);
  const [checkinsByHour, setCheckinsByHour] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("monthly");
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);

      try {
        const token = localStorage.getItem("token");
        const authHeader = token ? { Authorization: `Bearer ${token}` } : {};

        const [resSale, resSummary] = await Promise.all([
          fetch(`${API}/api/sale/${filter}`, { headers: authHeader }),
          fetch(`${API}/api/dashboard/summary`, { headers: authHeader }),
        ]);

        if (!resSale.ok) throw new Error(`Sales API failed with status ${resSale.status}`);
        if (!resSummary.ok) throw new Error(`Summary API failed with status ${resSummary.status}`);

        const dataSale = await resSale.json();
        const dataSummary = await resSummary.json();

        // --- Sales Data ---
        setSalesData(
          (dataSale.sales && dataSale.sales.length > 0)
            ? dataSale.sales.map(item => ({
                date: item.date,
                amount: parseFloat(item.amount),
              }))
            : [
                { date: "2025-08-01", amount: 100 },
                { date: "2025-08-02", amount: 150 },
              ]
        );

        // --- Top Products ---
        setTopProducts(
          (dataSale.top_products && dataSale.top_products.length > 0)
            ? dataSale.top_products
            : [
                { name: "Membership", value: 1000 },
                { name: "Supplements", value: 800 },
              ]
        );

        // --- Top Customers ---
        setTopCustomers(
          (dataSale.top_customers && dataSale.top_customers.length > 0)
            ? dataSale.top_customers
            : [
                { name: "John Doe", value: 500 },
                { name: "Jane Smith", value: 350 },
              ]
        );

        // --- Dashboard Summary ---
        const s = dataSummary?.data || null;
        setSummary(s);

        const hourly = (s?.checkinsByHour || []).map(h => ({
          hour: `${h.hour}:00`,
          count: h.cnt,
        }));
        setCheckinsByHour(hourly);

        console.log("API SALES:", dataSale);
        console.log("API SUMMARY:", s);
      } catch (err) {
        console.error("Frontend fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchAll();
  }, [filter]);

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-500">Error: {error}</div>;

  const kpi = summary ? [
    { label: "Active Members", value: summary.activeMembers },
    { label: "New 7d", value: summary.newSignups7d },
    { label: "Expiring 7d", value: summary.expiring7d },
    { label: "Check-ins Today", value: summary.checkinsToday },
    { label: "Revenue Today", value: summary.revenueToday },
    { label: "Revenue MTD", value: summary.revenueMTD },
    { label: "MoM %", value: summary.revenueMoM ?? "—" },
    { label: "Churn 30d", value: summary.churn30d },
  ] : [];

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">

      {/* ✅ Dashboard Summary */}
      <Card className="col-span-2">
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold mb-3">Dashboard Summary</h2>
          {summary ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {kpi.map((x) => (
                <div key={x.label} className="rounded-lg border p-3">
                  <div className="text-xs opacity-70">{x.label}</div>
                  <div className="text-xl font-semibold">{x.value}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm opacity-70">No summary data</div>
          )}
        </CardContent>
      </Card>

      {/* Sales Trend */}
      <Card className="col-span-2">
        <CardContent className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Sales Trend</h2>
            <div className="space-x-2">
              <Button onClick={() => setFilter("daily")}>Daily</Button>
              <Button onClick={() => setFilter("weekly")}>Weekly</Button>
              <Button onClick={() => setFilter("monthly")}>Monthly</Button>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line type="monotone" dataKey="amount" stroke="#4F46E5" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Products */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold mb-4">Top Products</h2>
          <ResponsiveContainer width="100%" height={250}>
            <PieChart>
              <Pie data={topProducts} dataKey="value" nameKey="name" outerRadius={100} label>
                {topProducts.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Top Customers */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold mb-4">Top Customers</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={topCustomers}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="value" fill="#16A34A" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* ✅ Check-ins by Hour */}
      <Card className="col-span-2">
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold mb-4">Attendance Today (Hourly)</h2>
          <ResponsiveContainer width="100%" height={260}>
            <BarChart data={checkinsByHour}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#06B6D4" />
            </BarChart>
          </ResponsiveContainer>
          {!checkinsByHour?.length && (
            <div className="text-xs opacity-70 mt-2">No check-in data today</div>
          )}
        </CardContent>
      </Card>

      {/* Raw Table */}
      <Card className="col-span-2">
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold mb-4">Sales Records</h2>
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-200">
              <tr>
                <th className="border p-2">Date</th>
                <th className="border p-2">Invoice</th>
                <th className="border p-2">Customer</th>
                <th className="border p-2">Amount</th>
              </tr>
            </thead>
            <tbody>
              {salesData.length > 0 ? (
                salesData.map((s, i) => (
                  <tr key={i}>
                    <td className="border p-2">{s.date}</td>
                    <td className="border p-2">INV-{1000 + i}</td>
                    <td className="border p-2">Customer {i + 1}</td>
                    <td className="border p-2">฿{s.amount}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="4" className="border p-2 text-center">No sales data</td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

export default SalesOverview;