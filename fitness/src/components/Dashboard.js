import React, { useState, useEffect } from 'react';

function Dashboard() {
  const [memberCount, setMemberCount] = useState(null);
  const [totalSales, setTotalSales] = useState(null);
  const [totalPoints, setTotalPoints] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [membersRes, salesRes, pointsRes] = await Promise.all([
          fetch('http://localhost:5001/api/customers/count'),
          fetch('http://localhost:5001/api/sales'),
          fetch('http://localhost:5001/api/points/total/all'), // เปลี่ยนที่นี่
        ]);
        if (!membersRes.ok) throw new Error(`Members API failed: ${membersRes.status}`);
        if (!salesRes.ok) throw new Error(`Sales API failed: ${salesRes.status}`);
        if (!pointsRes.ok) throw new Error(`Points API failed: ${pointsRes.status}`);
        const [membersData, salesData, pointsData] = await Promise.all([
          membersRes.json(),
          salesRes.json(),
          pointsRes.json(),
        ]);
        console.log('Fetched data:', { membersData, salesData, pointsData }); // Debug
        setMemberCount(membersData.data?.count || membersData.count || 0);
        setTotalSales(salesData.data?.total_sales || salesData.total_sales || 0);
        setTotalPoints(pointsData.data?.total_points || pointsData.total_points || 0);
      } catch (err) {
        setError(`Failed to fetch data: ${err.message}. Check server logs.`);
        console.error('Fetch error:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (error) return <div className="text-center p-6 text-red-500">{error}</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Fitness Dashboard</h2>
      <div className="grid grid-cols-3 gap-6 mb-6">
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-gray-500">Total Members</p>
          <h3 className="text-3xl font-semibold text-green-600">{memberCount !== null ? memberCount : 'N/A'}</h3>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-gray-500">Total Sales</p>
          <h3 className="text-3xl font-semibold text-blue-600">{totalSales !== null ? `$${totalSales}` : 'N/A'}</h3>
        </div>
        <div className="bg-white p-4 rounded-lg shadow-md">
          <p className="text-gray-500">Total Points</p>
          <h3 className="text-3xl font-semibold text-yellow-600">{totalPoints !== null ? totalPoints : 'N/A'}</h3>
        </div>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Sales Trend (Last 7 Days)</h3>
        <div className="h-64">Chart Placeholder</div>
      </div>
    </div>
  );
}

export default Dashboard;