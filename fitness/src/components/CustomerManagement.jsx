import React, { useState, useEffect } from 'react';

function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [newCustomer, setNewCustomer] = useState({ username: '', email: '', subscription_status: 'pending', password: '', role: 'customer' });
  const [editCustomer, setEditCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [error, setError] = useState(null);
  const [history, setHistory] = useState({});

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    try {
      const response = await fetch('http://localhost:5001/api/customers');
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.success) {
        const customersWithPoints = await Promise.all(data.data.map(async (customer) => {
          const pointsRes = await fetch(`http://localhost:5001/api/points/total?customer_id=${customer.id}`);
          const pointsData = await pointsRes.json();
          return { ...customer, total_points: pointsData.success ? pointsData.data.total_points : 0 };
        }));
        setCustomers(customersWithPoints.sort((a, b) => a.id - b.id));
      } else {
        setError(data.message || 'Failed to load customers');
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
      console.error('Fetch customers error:', err);
    }
  };

  const fetchHistory = async (customerId) => {
    try {
      const response = await fetch(`http://localhost:5001/api/customers/${customerId}/history`);
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.success) {
        setHistory((prev) => ({ ...prev, [customerId]: data.data }));
      } else {
        setError(data.message || 'Failed to load history');
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
      console.error('Fetch history error:', err);
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch('http://localhost:5001/api/customers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: newCustomer.username,
          email: newCustomer.email,
          password: newCustomer.password, // เพิ่ม password
          subscription_status: newCustomer.subscription_status,
          role: newCustomer.role, // เพิ่ม role
        }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result.success) {
        setNewCustomer({ username: '', email: '', subscription_status: 'pending', password: '', role: 'customer' });
        fetchCustomers();
      } else {
        setError(result.message || 'Failed to create customer');
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
      console.error('Create error:', err);
    }
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editCustomer || !editCustomer.id) {
      setError('No customer selected for update');
      return;
    }
    try {
      const response = await fetch(`http://localhost:5001/api/customers/${editCustomer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          username: editCustomer.username,
          email: editCustomer.email,
          subscription_status: editCustomer.subscription_status,
        }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result.success && editCustomer.pointsChange) {
        await addOrSubtractPoints(editCustomer.id, editCustomer.pointsChange, editCustomer.actionType);
      }
      if (result.success) {
        setEditCustomer(null);
        fetchCustomers();
        fetchHistory(editCustomer.id);
      } else {
        setError(result.message || 'Failed to update customer');
      }
    } catch (err) {
      setError(`Network error while updating customer: ${err.message}`);
      console.error('Update error:', err);
    }
  };

  const addOrSubtractPoints = async (customerId, points, actionType) => {
    try {
      const method = actionType === 'subtract' ? 'DELETE' : 'POST';
      const url = `http://localhost:5001/api/points/${actionType === 'subtract' ? 'subtract' : 'add'}`;
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ customer_id: customerId, points: Math.abs(points) }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (!result.success) throw new Error(result.message || 'Failed to update points');
      fetchHistory(customerId);
    } catch (err) {
      throw err;
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure?')) {
      try {
        const response = await fetch(`http://localhost:5001/api/customers/${id}`, { method: 'DELETE' });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        if (result.success) fetchCustomers();
        else setError(result.message || 'Failed to delete customer');
      } catch (err) {
        setError(`Network error: ${err.message}`);
        console.error('Delete error:', err);
      }
    }
  };

  const handleToggleStatus = async (customer) => {
    const newStatus = customer.subscription_status === 'Active' ? 'Not Active' : 'Active';
    try {
      const response = await fetch(`http://localhost:5001/api/customers/${customer.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...customer, subscription_status: newStatus }),
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const result = await response.json();
      if (result.success) {
        fetchCustomers();
        fetchHistory(customer.id);
      } else {
        setError(result.message || 'Failed to update status');
      }
    } catch (err) {
      setError(`Network error while updating status: ${err.message}`);
      console.error('Toggle status error:', err);
    }
  };

  const filteredCustomers = customers.filter((customer) =>
    customer.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
    customer.id.toString().includes(searchTerm)
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Customer Management</h2>
      {error && <div className="text-red-500 mb-4">{error}</div>}
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by Username or ID"
          className="p-2 border rounded mr-2"
        />
      </div>
      <form onSubmit={handleCreate} className="mb-4">
        <input
          type="text"
          value={newCustomer.username}
          onChange={(e) => setNewCustomer({ ...newCustomer, username: e.target.value })}
          placeholder="Username"
          className="p-2 border rounded mr-2"
          required
        />
        <input
          type="email"
          value={newCustomer.email}
          onChange={(e) => setNewCustomer({ ...newCustomer, email: e.target.value })}
          placeholder="Email"
          className="p-2 border rounded mr-2"
          required
        />
        <input
          type="password"
          value={newCustomer.password}
          onChange={(e) => setNewCustomer({ ...newCustomer, password: e.target.value })}
          placeholder="Password"
          className="p-2 border rounded mr-2"
          required
        />
        <select
          value={newCustomer.subscription_status}
          onChange={(e) => setNewCustomer({ ...newCustomer, subscription_status: e.target.value })}
          className="p-2 border rounded mr-2"
          required
        >
          <option value="pending">Pending</option>
          <option value="Active">Active</option>
          <option value="Not Active">Not Active</option>
        </select>
        <button type="submit" className="bg-blue-500 text-white p-2 rounded">
          Add Customer
        </button>
      </form>
      <table className="w-full border-collapse">
        <thead>
          <tr className="bg-gray-200">
            <th className="border p-2">ID</th>
            <th className="border p-2">Username</th>
            <th className="border p-2">Email</th>
            <th className="border p-2">Status</th>
            <th className="border p-2">Points</th>
            <th className="border p-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredCustomers.map((customer) => (
            <tr key={customer.id}>
              <td className="border p-2">{customer.id}</td>
              <td className="border p-2">
                {editCustomer?.id === customer.id ? (
                  <input
                    type="text"
                    value={editCustomer.username}
                    onChange={(e) => setEditCustomer({ ...editCustomer, username: e.target.value })}
                    className="p-1 border rounded"
                    required
                  />
                ) : (
                  customer.username
                )}
              </td>
              <td className="border p-2">
                {editCustomer?.id === customer.id ? (
                  <input
                    type="email"
                    value={editCustomer.email}
                    onChange={(e) => setEditCustomer({ ...editCustomer, email: e.target.value })}
                    className="p-1 border rounded"
                    required
                  />
                ) : (
                  customer.email
                )}
              </td>
              <td className="border p-2">
                {editCustomer?.id === customer.id ? (
                  <select
                    value={editCustomer.subscription_status}
                    onChange={(e) => setEditCustomer({ ...editCustomer, subscription_status: e.target.value })}
                    className="p-1 border rounded"
                    required
                  >
                    <option value="pending">Pending</option>
                    <option value="Active">Active</option>
                    <option value="Not Active">Not Active</option>
                  </select>
                ) : (
                  customer.subscription_status
                )}
              </td>
              <td className="border p-2">{customer.total_points || 0}</td>
              <td className="border p-2">
                {editCustomer?.id === customer.id ? (
                  <>
                    <select
                      value={editCustomer.actionType || 'add'}
                      onChange={(e) => setEditCustomer({ ...editCustomer, actionType: e.target.value })}
                      className="p-1 border rounded mr-2"
                    >
                      <option value="add">Add</option>
                      <option value="subtract">Subtract</option>
                    </select>
                    <input
                      type="number"
                      value={editCustomer.pointsChange || ''}
                      onChange={(e) => setEditCustomer({ ...editCustomer, pointsChange: parseInt(e.target.value) || 0 })}
                      placeholder="Points"
                      className="p-1 border rounded mr-2"
                      min="0"
                    />
                    <button
                      onClick={handleUpdate}
                      className="bg-green-500 text-white p-1 rounded mr-2"
                    >
                      Save
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditCustomer({ ...customer, pointsChange: 0, actionType: 'add' });
                        fetchHistory(customer.id);
                      }}
                      className="bg-yellow-500 text-white p-1 rounded mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(customer)}
                      className={`p-1 rounded mr-2 ${customer.subscription_status === 'Active' ? 'bg-red-500' : 'bg-green-500'} text-white`}
                    >
                      {customer.subscription_status === 'Active' ? 'Deactivate' : 'Activate'}
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id)}
                      className="bg-red-500 text-white p-1 rounded"
                    >
                      Delete
                    </button>
                  </>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {editCustomer && history[editCustomer.id] && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2">History for {editCustomer.username}</h3>
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-gray-200">
                <th className="border p-2">Date</th>
                <th className="border p-2">Action</th>
                <th className="border p-2">Details</th>
              </tr>
            </thead>
            <tbody>
              {history[editCustomer.id].map((entry, index) => (
                <tr key={index}>
                  <td className="border p-2">{new Date(entry.timestamp).toLocaleString()}</td>
                  <td className="border p-2">{entry.action}</td>
                  <td className="border p-2">{entry.details}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

export default CustomerManagement;