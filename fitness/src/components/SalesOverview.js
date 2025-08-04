import React, { useState, useEffect } from 'react';

function SalesOverview() {
  const [salesData, setSalesData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchSalesData = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:5001/api/sales/daily');
        if (!response.ok) throw new Error('API response failed');
        const data = await response.json();
        console.log('Sales data:', data); // Debug
        if (data.success) setSalesData(data.data || []);
        else setError('No sales data available');
      } catch (err) {
        setError(`Failed to fetch sales data: ${err.message}`);
        console.error('Fetch error:', err);
        // ใส่ข้อมูลตัวอย่างถ้า API ล้มเหลว
        setSalesData([
          { date: '2025-08-01', amount: 100 },
          { date: '2025-08-02', amount: 150 },
        ]);
      } finally {
        setLoading(false);
      }
    };
    fetchSalesData();
  }, []);

  if (loading) return <div className="text-center p-6">Loading...</div>;
  if (error) return <div className="text-center p-6 text-red-500">{error}</div>;

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Sales Overview</h2>
      <table className="w-full border-collapse mb-6">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">Date</th>
            <th className="border p-2">Amount</th>
          </tr>
        </thead>
        <tbody>
          {salesData.length > 0 ? (
            salesData.map((sale) => (
              <tr key={sale.date}>
                <td className="border p-2">{sale.date}</td>
                <td className="border p-2">${sale.amount}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan="2" className="border p-2 text-center">No data available</td>
            </tr>
          )}
        </tbody>
      </table>
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h3 className="text-xl font-semibold mb-4">Sales Trend</h3>
        <div className="h-64">Chart Placeholder</div>
      </div>
    </div>
  );
}

export default SalesOverview;