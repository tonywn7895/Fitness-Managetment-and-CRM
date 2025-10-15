import React, { useEffect, useState } from 'react';
import Navbar from './Navbar';

const API = 'http://localhost:5001';

export default function Shop() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [busy, setBusy] = useState(false);

  const load = async () => {
    try {
      setError(null);
      const res = await fetch(`${API}/api/products/public/list`);
      if (!res.ok) throw new Error(`Load failed ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data.data) ? data.data : []);
    } catch (e) { setError(e.message); }
  };

  useEffect(()=>{ load(); }, []);

  const buy = async (product_id, mode='cash') => {
    try {
      setBusy(true); setError(null);
      const token = localStorage.getItem('token');
      if (!token) throw new Error('Please log in');
      const url = mode==='cash' ? `${API}/api/shop/customer/checkout` : `${API}/api/shop/customer/redeem`;
      const res = await fetch(url, {
        method:'POST',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${token}` },
        body: JSON.stringify({ items:[{ product_id, qty:1 }] })
      });
      if (!res.ok) {
        const txt = await res.text();
        throw new Error(`Purchase failed ${res.status}: ${txt}`);
      }
      await res.json();
      alert('Success!');
      load();
    } catch (e) { setError(e.message); }
    finally { setBusy(false); }
  };

  return (
    <>
      <Navbar />
      <div className="p-6 max-w-6xl mx-auto pt-[110px]">
      <h2 className="text-2xl font-bold mb-4">Shop</h2>
      {error && <div className="text-red-500 mb-3">{error}</div>}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {items.map(p => (
          <div key={p.id} className="border rounded p-3">
            {p.image_url ? (
              <img src={`http://localhost:5001${p.image_url}`} alt={p.name} className="w-full h-40 object-cover mb-2" />
            ) : (
              <div className="w-full h-40 bg-gray-200 flex items-center justify-center mb-2">No Image</div>
            )}
            <div className="font-semibold">{p.name}</div>
            <div className="text-sm text-gray-600">SKU: {p.sku}</div>
            <div className="mt-2">Cash: {Number(p.price_cash||0).toFixed(2)} THB</div>
            <div>Points: {p.price_points}</div>
            <div>Stock: {p.stock}</div>
            <div className="mt-3 flex gap-2">
              <button disabled={busy || p.stock<=0} onClick={()=>buy(p.id,'cash')} className="bg-blue-600 text-white px-3 py-1 rounded disabled:opacity-50">Buy</button>
              <button disabled={busy || p.stock<=0} onClick={()=>buy(p.id,'points')} className="bg-green-600 text-white px-3 py-1 rounded disabled:opacity-50">Redeem</button>
            </div>
          </div>
        ))}
      </div>
    </div>
    </>
  );
}
