import React, { useState, useEffect } from "react";

function CustomerManagement() {
  const [customers, setCustomers] = useState([]);
  const [newCustomer, setNewCustomer] = useState({
    username: "",
    email: "",
    subscription_status: "pending",
    password: "",
    role: "customer",
  });
  const [editCustomer, setEditCustomer] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [error, setError] = useState(null);
  const [history, setHistory] = useState({});

  const API = "http://localhost:5001";

  useEffect(() => {
    fetchCustomers();
  }, []);

  // ✅ ดึงข้อมูลลูกค้าทั้งหมด
  const fetchCustomers = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) throw new Error("No authentication token found");
      const response = await fetch(`${API}/api/customers`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.success) {
        setCustomers(data.data.sort((a, b) => a.id - b.id));
      } else {
        setError(data.message || "Failed to load customers");
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
      console.error("Fetch customers error:", err);
    }
  };

  // ✅ ดึงประวัติลูกค้า
  const fetchHistory = async (customerId) => {
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API}/api/customers/${customerId}/history`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
      const data = await response.json();
      if (data.success) {
        setHistory((prev) => ({ ...prev, [customerId]: data.data }));
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
    }
  };

  // ✅ เพิ่มลูกค้าใหม่
  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API}/api/customers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(newCustomer),
      });
      const result = await response.json();
      if (result.success) {
        setNewCustomer({
          username: "",
          email: "",
          subscription_status: "pending",
          password: "",
          role: "customer",
        });
        fetchCustomers();
      } else {
        setError(result.message || "Failed to create customer");
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
    }
  };

  // ✅ เพิ่ม/ลบแต้ม
  const addOrSubtractPoints = async (customerId, points, actionType) => {
    try {
      const token = localStorage.getItem("token");
      const method = actionType === "subtract" ? "DELETE" : "POST";
      const url =
        actionType === "subtract"
          ? `${API}/api/customers/${customerId}/points/subtract`
          : `${API}/api/customers/${customerId}/points`;

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ points: Math.abs(points) }),
      });
      const result = await res.json();
      if (!result.success) throw new Error(result.message);
      fetchHistory(customerId);
      fetchCustomers();
    } catch (err) {
      setError(`Points update error: ${err.message}`);
    }
  };

  // ✅ อัปเดตลูกค้า
  const handleUpdate = async (e) => {
    e.preventDefault();
    if (!editCustomer?.id) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API}/api/customers/${editCustomer.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          username: editCustomer.username,
          email: editCustomer.email,
          subscription_status: editCustomer.subscription_status,
        }),
      });
      const result = await response.json();
      if (result.success && editCustomer.pointsChange) {
        await addOrSubtractPoints(
          editCustomer.id,
          editCustomer.pointsChange,
          editCustomer.actionType
        );
      }
      if (result.success) {
        setEditCustomer(null);
        fetchCustomers();
        fetchHistory(editCustomer.id);
      } else {
        setError(result.message || "Failed to update customer");
      }
    } catch (err) {
      setError(`Network error while updating customer: ${err.message}`);
    }
  };

  // ✅ ลบลูกค้า
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure?")) return;
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API}/api/customers/${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      const result = await response.json();
      if (result.success) fetchCustomers();
      else setError(result.message || "Failed to delete customer");
    } catch (err) {
      setError(`Network error: ${err.message}`);
    }
  };

  // ✅ เปลี่ยนสถานะสมาชิก
  const handleToggleStatus = async (customer) => {
    const newStatus =
      customer.subscription_status === "Active" ? "Not Active" : "Active";
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API}/api/customers/${customer.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ ...customer, subscription_status: newStatus }),
      });
      const result = await response.json();
      if (result.success) {
        fetchCustomers();
        fetchHistory(customer.id);
      } else {
        setError(result.message || "Failed to update status");
      }
    } catch (err) {
      setError(`Network error: ${err.message}`);
    }
  };

  const filteredCustomers = customers.filter(
    (c) =>
      c.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
      c.id.toString().includes(searchTerm)
  );

  return (
    <div>
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Customer Management
      </h2>
      {error && <div className="text-red-500 mb-4">{error}</div>}

      {/* 🔍 ค้นหา */}
      <div className="mb-4">
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search by Username or ID"
          className="p-2 border rounded mr-2"
        />
      </div>

      {/* 🧾 ฟอร์มเพิ่มลูกค้า */}
      <form onSubmit={handleCreate} className="mb-4">
        <input
          type="text"
          value={newCustomer.username}
          onChange={(e) =>
            setNewCustomer({ ...newCustomer, username: e.target.value })
          }
          placeholder="Username"
          className="p-2 border rounded mr-2"
          required
        />
        <input
          type="email"
          value={newCustomer.email}
          onChange={(e) =>
            setNewCustomer({ ...newCustomer, email: e.target.value })
          }
          placeholder="Email"
          className="p-2 border rounded mr-2"
          required
        />
        <input
          type="password"
          value={newCustomer.password}
          onChange={(e) =>
            setNewCustomer({ ...newCustomer, password: e.target.value })
          }
          placeholder="Password"
          className="p-2 border rounded mr-2"
          required
        />
        <select
          value={newCustomer.subscription_status}
          onChange={(e) =>
            setNewCustomer({
              ...newCustomer,
              subscription_status: e.target.value,
            })
          }
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

      {/* 📋 ตารางข้อมูลลูกค้า */}
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
          {filteredCustomers.map((c) => (
            <tr key={c.id}>
              <td className="border p-2">{c.id}</td>
              <td className="border p-2">
                {editCustomer?.id === c.id ? (
                  <input
                    type="text"
                    value={editCustomer.username}
                    onChange={(e) =>
                      setEditCustomer({
                        ...editCustomer,
                        username: e.target.value,
                      })
                    }
                    className="p-1 border rounded"
                    required
                  />
                ) : (
                  c.username
                )}
              </td>
              <td className="border p-2">
                {editCustomer?.id === c.id ? (
                  <input
                    type="email"
                    value={editCustomer.email}
                    onChange={(e) =>
                      setEditCustomer({
                        ...editCustomer,
                        email: e.target.value,
                      })
                    }
                    className="p-1 border rounded"
                    required
                  />
                ) : (
                  c.email
                )}
              </td>
              <td className="border p-2">
                {editCustomer?.id === c.id ? (
                  <select
                    value={editCustomer.subscription_status}
                    onChange={(e) =>
                      setEditCustomer({
                        ...editCustomer,
                        subscription_status: e.target.value,
                      })
                    }
                    className="p-1 border rounded"
                  >
                    <option value="pending">Pending</option>
                    <option value="Active">Active</option>
                    <option value="Not Active">Not Active</option>
                  </select>
                ) : (
                  c.subscription_status
                )}
              </td>
              <td className="border p-2">{c.total_points || 0}</td>
              <td className="border p-2">
                {editCustomer?.id === c.id ? (
                  <>
                    <select
                      value={editCustomer.actionType || "add"}
                      onChange={(e) =>
                        setEditCustomer({
                          ...editCustomer,
                          actionType: e.target.value,
                        })
                      }
                      className="p-1 border rounded mr-2"
                    >
                      <option value="add">Add</option>
                      <option value="subtract">Subtract</option>
                    </select>
                    <input
                      type="number"
                      value={editCustomer.pointsChange || ""}
                      onChange={(e) =>
                        setEditCustomer({
                          ...editCustomer,
                          pointsChange: parseInt(e.target.value) || 0,
                        })
                      }
                      placeholder="Points"
                      className="p-1 border rounded mr-2"
                    />
                    <button
                      onClick={handleUpdate}
                      className="bg-green-500 text-white p-1 rounded mr-2"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditCustomer(null)}
                      className="bg-gray-400 text-white p-1 rounded"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <>
                    <button
                      onClick={() => {
                        setEditCustomer({
                          ...c,
                          pointsChange: 0,
                          actionType: "add",
                        });
                        fetchHistory(c.id);
                      }}
                      className="bg-yellow-500 text-white p-1 rounded mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleToggleStatus(c)}
                      className={`p-1 rounded mr-2 ${
                        c.subscription_status === "Active"
                          ? "bg-red-500"
                          : "bg-green-500"
                      } text-white`}
                    >
                      {c.subscription_status === "Active"
                        ? "Deactivate"
                        : "Activate"}
                    </button>
                    <button
                      onClick={() => handleDelete(c.id)}
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

      {/* 🕒 ประวัติแต้ม */}
      {editCustomer && history[editCustomer.id] && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2">
            History for {editCustomer.username}
          </h3>
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
                  <td className="border p-2">
                    {new Date(entry.timestamp).toLocaleString()}
                  </td>
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