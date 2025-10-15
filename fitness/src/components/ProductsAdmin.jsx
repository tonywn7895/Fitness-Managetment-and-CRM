import React, { useEffect, useState } from 'react';

const API = 'http://localhost:5001';

export default function ProductsAdmin() {
  const [items, setItems] = useState([]);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ sku:'', name:'', price_cash:0, price_points:0, stock:0, active:true, category:'' });
  const [editingId, setEditingId] = useState(null);
  const [uploadTargetId, setUploadTargetId] = useState(null);

  const headers = () => ({ 'Content-Type':'application/json', Authorization: `Bearer ${localStorage.getItem('token') || ''}` });

  const load = async () => {
    try {
      setError(null);
      const res = await fetch(`${API}/api/products`, { headers: headers() });
      if (!res.ok) throw new Error(`Products load failed ${res.status}`);
      const data = await res.json();
      setItems(Array.isArray(data.data) ? data.data : []);
    } catch (e) { setError(e.message); }
  };

  useEffect(()=>{ load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    try {
      const url = editingId ? `${API}/api/products/${editingId}` : `${API}/api/products`;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(form) });
      if (!res.ok) throw new Error(`Save failed ${res.status}`);
      await res.json();
      setEditingId(null);
      setForm({ sku:'', name:'', price_cash:0, price_points:0, stock:0, active:true, category:'' });
      load();
    } catch (e) { setError(e.message); }
  };

  const edit = (p) => {
    setEditingId(p.id);
    setForm({
      sku: p.sku,
      name: p.name,
      price_cash: Number(p.price_cash || 0),
      price_points: Number(p.price_points || 0),
      stock: Number(p.stock || 0),
      active: !!p.active,
      category: p.category || ''
    });
  };

  const del = async (id) => {
    if (!window.confirm('Delete this product?')) return;
    try {
      const res = await fetch(`${API}/api/products/${id}`, { method:'DELETE', headers: headers() });
      if (!res.ok) throw new Error(`Delete failed ${res.status}`);
      load();
    } catch (e) { setError(e.message); }
  };

  const triggerUpload = (id) => {
    setUploadTargetId(id);
    const input = document.getElementById('product-image-input');
    if (input) input.click();
  };

  const onFileChange = async (e) => {
    const file = e.target.files?.[0];
    if (!file || !uploadTargetId) return;
    try {
      const fd = new FormData();
      fd.append('image', file);
      const res = await fetch(`${API}/api/products/${uploadTargetId}/image`, { method:'POST', headers: { Authorization: `Bearer ${localStorage.getItem('token')||''}` }, body: fd });
      if (!res.ok) throw new Error(`Upload failed ${res.status}`);
      await res.json();
      alert('Image uploaded successfully');
      setUploadTargetId(null);
      e.target.value = '';
      load();
    } catch (err) { setError(err.message); }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Products</h2>
      {error && <div className="text-red-500 mb-3">{error}</div>}
      <form onSubmit={submit} className="mb-6 grid grid-cols-1 md:grid-cols-7 gap-2">
        <input className="p-2 border rounded" placeholder="SKU" value={form.sku} onChange={e=>setForm({...form, sku:e.target.value})} required />
        <input className="p-2 border rounded" placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
        <input type="number" step="0.01" className="p-2 border rounded" placeholder="Price (cash)" value={form.price_cash} onChange={e=>setForm({...form, price_cash: parseFloat(e.target.value) || 0})} />
        <input type="number" className="p-2 border rounded" placeholder="Price (points)" value={form.price_points} onChange={e=>setForm({...form, price_points: parseInt(e.target.value||0,10)})} />
        <input type="number" className="p-2 border rounded" placeholder="Stock" value={form.stock} onChange={e=>setForm({...form, stock: parseInt(e.target.value||0,10)})} />
        <input className="p-2 border rounded" placeholder="Category" value={form.category} onChange={e=>setForm({...form, category:e.target.value})} />
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={e=>setForm({...form, active:e.target.checked})} /> Active</label>
        <div className="md:col-span-7 flex gap-2">
          <button className="bg-blue-600 text-white px-3 py-2 rounded" type="submit">{editingId? 'Update' : 'Create'}</button>
          {editingId && <button type="button" className="bg-gray-500 text-white px-3 py-2 rounded" onClick={()=>{ setEditingId(null); setForm({ sku:'', name:'', price_cash:0, price_points:0, stock:0, active:true, category:'' }); }}>Cancel</button>}
        </div>
      </form>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">ID</th>
            <th className="border p-2">SKU</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Cash</th>
            <th className="border p-2">Points</th>
            <th className="border p-2">Stock</th>
            <th className="border p-2">Active</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {items.map(p => (
            <tr key={p.id}>
              <td className="border p-2">{p.id}</td>
              <td className="border p-2">{p.sku}</td>
              <td className="border p-2">{p.name}</td>
              <td className="border p-2">{Number(p.price_cash || 0).toFixed(2)}</td>
              <td className="border p-2">{p.price_points}</td>
              <td className="border p-2">{p.stock}</td>
              <td className="border p-2">{p.active ? 'Yes' : 'No'}</td>
              <td className="border p-2 space-x-2">
                <button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={()=>edit(p)}>Edit</button>
                <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={()=>del(p.id)}>Delete</button>
                <button className="bg-indigo-600 text-white px-2 py-1 rounded" onClick={()=>triggerUpload(p.id)}>Upload Image</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      <input id="product-image-input" type="file" accept="image/*" className="hidden" onChange={onFileChange} />
    </div>
  );
}
