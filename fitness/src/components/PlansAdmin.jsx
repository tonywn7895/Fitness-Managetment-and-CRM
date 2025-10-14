import React, { useEffect, useState } from 'react';

const API = 'http://localhost:5001';

export default function PlansAdmin() {
  const [plans, setPlans] = useState([]);
  const [error, setError] = useState(null);
  const [form, setForm] = useState({ code:'', name:'', price:0, duration_interval:'1 month', visit_limit:'', active:true });
  const [editingId, setEditingId] = useState(null);

  const headers = () => ({
    'Content-Type':'application/json',
    Authorization: `Bearer ${localStorage.getItem('token') || ''}`,
  });

  const load = async () => {
    try {
      setError(null);
      const res = await fetch(`${API}/api/plans`, { headers: headers() });
      if (!res.ok) throw new Error(`Plans load failed ${res.status}`);
      const data = await res.json();
      setPlans(Array.isArray(data.data) ? data.data : []);
    } catch (e) {
      setError(e.message);
    }
  };

  useEffect(() => { load(); }, []);

  const formatInterval = (v) => {
    if (!v) return '';
    if (typeof v === 'string') return v;
    if (typeof v === 'object') {
      const parts = [];
      if (v.years) parts.push(`${v.years} year${v.years > 1 ? 's' : ''}`);
      if (v.months) parts.push(`${v.months} month${v.months > 1 ? 's' : ''}`);
      if (v.days) parts.push(`${v.days} day${v.days > 1 ? 's' : ''}`);
      if (v.hours) parts.push(`${v.hours} hour${v.hours > 1 ? 's' : ''}`);
      if (v.minutes) parts.push(`${v.minutes} min`);
      if (v.seconds) parts.push(`${v.seconds} sec`);
      return parts.join(' ') || '0 days';
    }
    return String(v);
  };

  const submit = async (e) => {
    e.preventDefault();
    try {
      setError(null);
      const body = { ...form };
      if (body.visit_limit === '') body.visit_limit = null;
      const url = editingId ? `${API}/api/plans/${editingId}` : `${API}/api/plans`;
      const method = editingId ? 'PUT' : 'POST';
      const res = await fetch(url, { method, headers: headers(), body: JSON.stringify(body) });
      if (!res.ok) throw new Error(`Save failed ${res.status}`);
      await res.json();
      setForm({ code:'', name:'', price:0, duration_interval:'1 month', visit_limit:'', active:true });
      setEditingId(null);
      load();
    } catch (e) {
      setError(e.message);
    }
  };

  const edit = (p) => {
    setEditingId(p.id);
    setForm({
      code: p.code,
      name: p.name,
      price: Number(p.price || 0),
      duration_interval: formatInterval(p.duration_interval) || '1 month',
      visit_limit: p.visit_limit ?? '',
      active: !!p.active,
    });
  };

  const del = async (id) => {
    if (!window.confirm('Delete this plan?')) return;
    try {
      const res = await fetch(`${API}/api/plans/${id}`, { method:'DELETE', headers: headers() });
      if (!res.ok) throw new Error(`Delete failed ${res.status}`);
      load();
    } catch (e) { setError(e.message); }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4">Plans</h2>
      {error && <div className="text-red-500 mb-3">{error}</div>}
      <form onSubmit={submit} className="mb-6 grid grid-cols-1 md:grid-cols-6 gap-2">
        <input className="p-2 border rounded" placeholder="Code" value={form.code} onChange={e=>setForm({...form, code:e.target.value})} required />
        <input className="p-2 border rounded" placeholder="Name" value={form.name} onChange={e=>setForm({...form, name:e.target.value})} required />
        <input type="number" step="0.01" className="p-2 border rounded" placeholder="Price" value={form.price} onChange={e=>setForm({...form, price: parseFloat(e.target.value) || 0})} />
        <input className="p-2 border rounded" placeholder="Duration (e.g. 1 month)" value={form.duration_interval} onChange={e=>setForm({...form, duration_interval:e.target.value})} />
        <input type="number" className="p-2 border rounded" placeholder="Visit limit (optional)" value={form.visit_limit} onChange={e=>setForm({...form, visit_limit: e.target.value})} />
        <label className="flex items-center gap-2"><input type="checkbox" checked={form.active} onChange={e=>setForm({...form, active:e.target.checked})} /> Active</label>
        <div className="md:col-span-6 flex gap-2">
          <button className="bg-blue-600 text-white px-3 py-2 rounded" type="submit">{editingId? 'Update' : 'Create'}</button>
          {editingId && <button type="button" className="bg-gray-500 text-white px-3 py-2 rounded" onClick={()=>{ setEditingId(null); setForm({ code:'', name:'', price:0, duration_interval:'1 month', visit_limit:'', active:true }); }}>Cancel</button>}
        </div>
      </form>

      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">ID</th>
            <th className="border p-2">Code</th>
            <th className="border p-2">Name</th>
            <th className="border p-2">Price</th>
            <th className="border p-2">Duration</th>
            <th className="border p-2">Active</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {plans.map(p=> (
            <tr key={p.id}>
              <td className="border p-2">{p.id}</td>
              <td className="border p-2">{p.code}</td>
              <td className="border p-2">{p.name}</td>
              <td className="border p-2">{Number(p.price || 0).toFixed(2)}</td>
              <td className="border p-2">{formatInterval(p.duration_interval)}</td>
              <td className="border p-2">{p.active ? 'Yes' : 'No'}</td>
              <td className="border p-2 space-x-2">
                <button className="bg-yellow-500 text-white px-2 py-1 rounded" onClick={()=>edit(p)}>Edit</button>
                <button className="bg-red-600 text-white px-2 py-1 rounded" onClick={()=>del(p.id)}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
