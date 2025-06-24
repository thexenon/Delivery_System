import React, { useEffect, useState } from 'react';
import { fetchItems, deleteItem } from '../services/user_api';
import { useNavigate } from 'react-router-dom';

export default function Order() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const navigate = useNavigate();

  const statusOptions = [
    '',
    'pending',
    'delivered',
    'in-transit',
    'picked-up',
    'cancelled',
  ];

  const getOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchItems('orders');
      setOrders(res.data.data.data || []);
    } catch (err) {
      setError('Failed to fetch orders');
    }
    setLoading(false);
  };

  useEffect(() => {
    getOrders();
  }, []);

  const handleDelete = async (order) => {
    if (!window.confirm('Are you sure you want to delete this order?')) return;
    try {
      await deleteItem('orders', order);
      setOrders((prev) => prev.filter((o) => o._id !== order._id));
    } catch (err) {
      alert('Failed to delete order');
    }
  };

  const filteredOrders = orders.filter((order) => {
    const term = search.toLowerCase();
    const matchesStatus = statusFilter ? order.status === statusFilter : true;
    return (
      matchesStatus &&
      (order._id?.toLowerCase().includes(term) ||
        order.user?.name?.toLowerCase().includes(term) ||
        order.status?.toLowerCase().includes(term) ||
        order.rider?.name?.toLowerCase().includes(term))
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
          <h1 className="text-3xl font-bold text-gray-800">All Orders</h1>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold shadow"
            onClick={() => navigate('/add-new/order')}
          >
            + Add New Order
          </button>
        </div>
        <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex gap-2 items-center">
            <label className="font-semibold">Filter by Status:</label>
            <select
              className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All</option>
              {statusOptions
                .filter((s) => s)
                .map((status) => (
                  <option key={status} value={status}>
                    {status.charAt(0).toUpperCase() + status.slice(1)}
                  </option>
                ))}
            </select>
          </div>
          <input
            type="text"
            className="border border-gray-300 rounded px-4 py-2 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search orders..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-gray-500 text-center">No orders found.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Customer
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rider
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Total
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredOrders.map((order) => (
                  <tr key={order._id} className="hover:bg-gray-50">
                    <td
                      className="px-6 py-4 whitespace-nowrap font-semibold text-gray-800 cursor-pointer hover:underline text-blue-700"
                      onClick={() =>
                        navigate(`/add-new/order-details?id=${order._id}`)
                      }
                    >
                      {order._id}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.user?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.rider?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {order.status}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ₦ {order.totalAmount?.toLocaleString() || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                      <button
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                        onClick={() =>
                          navigate(`/add-new/editorder?id=${order._id}`)
                        }
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                        onClick={() => handleDelete(order)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
