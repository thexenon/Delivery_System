import React, { useEffect, useState } from 'react';
import { fetchItems } from '../services/user_api';
import { useNavigate } from 'react-router-dom';

export default function OrderItem() {
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const statusOptions = [
    '',
    'pending',
    'delivered',
    'in-transit',
    'picked-up',
    'cancelled',
    'accepted',
  ];
  const navigate = useNavigate();

  useEffect(() => {
    const getOrderItems = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchItems('orderitems');
        setOrderItems(res.data.data.data || []);
      } catch (err) {
        setError('Failed to fetch order items');
      }
      setLoading(false);
    };
    getOrderItems();
  }, []);

  const filteredItems = orderItems.filter((item) => {
    const term = search.toLowerCase();
    const matchesStatus = statusFilter ? item.status === statusFilter : true;
    return (
      matchesStatus &&
      (item._id?.toLowerCase().includes(term) ||
        item.product?.name?.toLowerCase().includes(term) ||
        item.order?.toLowerCase().includes(term) ||
        item.status?.toLowerCase().includes(term))
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-8">
          All Order Items
        </h1>
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
            placeholder="Search order items..."
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
        ) : filteredItems.length === 0 ? (
          <div className="text-gray-500 text-center">No order items found.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order Item ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Order ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Quantity
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Variety
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredItems.map((item) => (
                  <tr
                    key={item._id}
                    className="hover:bg-gray-50 cursor-pointer"
                    onClick={() =>
                      navigate(`/add-new/orderitem-details?id=${item._id}`)
                    }
                  >
                    <td className="px-6 py-4 whitespace-nowrap">{item._id}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.order}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.product?.name || item.product}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.quantity}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.variety || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {item.status || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      ₦{item.amount?.toLocaleString() || '-'}
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
