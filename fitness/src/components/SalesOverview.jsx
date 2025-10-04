import React, { useEffect, useState } from "react";
import {
  LineChart, Line,
  BarChart, Bar,
  PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";

const COLORS = ["#4F46E5", "#16A34A", "#F59E0B", "#EF4444", "#06B6D4"];

function SalesOverview() {
  const [salesData, setSalesData] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [topCustomers, setTopCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("monthly"); // daily, weekly, monthly
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSalesData = async () => {
      setLoading(true);
      try {
        const res = await fetch(`http://localhost:5001/api/sales/${filter}`);
        if (!res.ok) throw new Error("API failed");
        const data = await res.json();

        console.log("API DATA:", data); // ✅ debug log

        // --- Sales Data ---
        setSalesData(
          (data.sales && data.sales.length > 0)
            ? data.sales.map(item => ({
                date: item.date,
                amount: parseFloat(item.amount),
              }))
            : [
                { date: "2025-08-01", amount: 100 },
                { date: "2025-08-02", amount: 150 },
              ] // fallback mock
        );

        // --- Top Products ---
        setTopProducts(
          (data.top_products && data.top_products.length > 0)
            ? data.top_products
            : [
                { name: "Membership", value: 1000 },
                { name: "Supplements", value: 800 },
              ]
        );

        // --- Top Customers ---
        setTopCustomers(
          (data.top_customers && data.top_customers.length > 0)
            ? data.top_customers
            : [
                { name: "John Doe", value: 500 },
                { name: "Jane Smith", value: 350 },
              ]
        );

      } catch (err) {
        console.error("Frontend fetch error:", err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchSalesData();
  }, [filter]);

  if (loading) return <div className="p-6 text-center">Loading...</div>;
  if (error) return <div className="p-6 text-center text-red-500">Error: {error}</div>;

  return (
    <div className="p-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
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
              <Pie
                data={topProducts}
                dataKey="value"
                nameKey="name"
                outerRadius={100}
                label
              >
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
