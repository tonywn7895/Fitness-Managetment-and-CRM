import React, { useEffect, useState } from "react";
import { Card, CardContent } from "./ui/card";
import { Button } from "./ui/button";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const Dashboard = () => {
  const [kpi, setKpi] = useState({ members: 0, sales: 0, points: 0 });
  const [salesData, setSalesData] = useState([]);
  const [memberGrowth, setMemberGrowth] = useState([]);
  const [pointsUsage, setPointsUsage] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [error, setError] = useState(null);

  //  Helper Functions
  const formatDate = (dateString) => {
    if (!dateString) return "N/A";
    return new Date(dateString).toLocaleDateString("en-GB", {
      year: "numeric",
      month: "short",
    });
  };

  const formatCurrency = (amount) => {
    return amount.toLocaleString("th-TH", {
      style: "currency",
      currency: "THB",
      minimumFractionDigits: 2,
    });
  };

  useEffect(() => {
    const fetchData = async () => {
  try {
    const token = localStorage.getItem("token");
    const headers = {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${token}`,
    };

    const [membersRes, salesRes, pointsRes, trendRes, growthRes] = await Promise.all([
      fetch("http://localhost:5001/api/customers/count", { headers }),
      fetch("http://localhost:5001/api/sales", { headers }),
      fetch("http://localhost:5001/api/points/total/all", { headers }),
      fetch("http://localhost:5001/api/sales/daily", { headers }),
      fetch("http://localhost:5001/api/members/growth", { headers }),
    ]);


        if (!membersRes.ok) throw new Error(`Members API failed`);
        if (!salesRes.ok) throw new Error(`Sales API failed`);
        if (!pointsRes.ok) throw new Error(`Points API failed`);
        if (!trendRes.ok) throw new Error(`Trend API failed`);
        if (!growthRes.ok) throw new Error(`Growth API failed`);

        const members = await membersRes.json();
        const sales = await salesRes.json();
        const points = await pointsRes.json();
        const trend = await trendRes.json();
        const growth = await growthRes.json();

        setKpi({
          members: members.data?.count || 0,
          sales: sales.data?.total_sales || 0,
          points: points.data?.total_points || 0,
        });

        setSalesData(
          trend.data?.map((item) => ({
            date: formatDate(item.date || item.month),
            amount: Number(item.amount || item.sales || 0),
          })) || []
        );

        setMemberGrowth(
          growth.data?.map((item) => {
            const active = Number(item.active) || 0;
            const notActive = Number(item.not_active) || 0;
            return {
              month: formatDate(item.month),
              active,
              not_active: notActive,
              total: active + notActive,
            };
          }) || []
        );
      } catch (err) {
        setError(err.message);
        console.error("Fetch error:", err);

        // Fallback Dummy Data
        setKpi({ members: 10, sales: 5000, points: 2000 });
        setSalesData([
          { date: formatDate("2025-08-01"), amount: 1000 },
          { date: formatDate("2025-08-02"), amount: 2000 },
          { date: formatDate("2025-08-03"), amount: 1500 },
        ]);
        setMemberGrowth([
          { month: formatDate("2025-07-01"), active: 5, not_active: 2, total: 7 },
          { month: formatDate("2025-08-01"), active: 7, not_active: 3, total: 10 },
        ]);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {/* KPI Cards */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold">Members</h2>
          <p className="text-2xl font-bold">{kpi.members.toLocaleString()}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold">Sales</h2>
          <p className="text-2xl font-bold">{formatCurrency(kpi.sales)}</p>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold">Points</h2>
          <p className="text-2xl font-bold">{kpi.points.toLocaleString()}</p>
        </CardContent>
      </Card>

      {/* Sales Line Chart */}
      <Card className="col-span-1 md:col-span-2">
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold mb-4">Sales Overview</h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={salesData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Line
                type="monotone"
                dataKey="amount"
                stroke="#4F46E5"
                strokeWidth={2}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          {salesData.length === 0 && (
            <p className="text-center text-gray-500">
              No sales data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Member Growth Stacked Bar Chart */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold mb-4">Member Growth</h2>
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={memberGrowth}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="active" stackId="1" fill="#16A34A" name="Active" />
              <Bar dataKey="not_active" stackId="1" fill="#EF4444" name="Not Active" />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#4F46E5"
                strokeWidth={2}
                name="Total"
              />
            </BarChart>
          </ResponsiveContainer>
          {memberGrowth.length === 0 && (
            <p className="text-center text-gray-500">
              No member growth data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Points Usage */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold mb-4">Points Usage</h2>
          <ul>
            {pointsUsage.map((item, i) => (
              <li key={i} className="flex justify-between py-2 border-b">
                <span>{item.category}</span>
                <span>{item.points.toLocaleString()}</span>
              </li>
            ))}
          </ul>
          {pointsUsage.length === 0 && (
            <p className="text-center text-gray-500">
              No points usage data available
            </p>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card>
        <CardContent className="p-4">
          <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
          <ul>
            {recentActivity.map((item) => (
              <li key={item.id} className="py-2 border-b">
                <p>{item.action}</p>
                <span className="text-sm text-gray-500">
                  {formatDate(item.date)}
                </span>
              </li>
            ))}
          </ul>
          {recentActivity.length === 0 && (
            <p className="text-center text-gray-500">
              No recent activity available
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default Dashboard;
