import React, { useEffect, useState } from 'react';
import { fetchItems, deleteItem } from '../services/user_api';
import { useNavigate } from 'react-router-dom';

const statusOptions = [
  'pending',
  'accepted',
  'in_progress',
  'completed',
  'cancelled',
];

export default function Request() {
  const [requests, setRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const loadRequests = async () => {
    setLoading(true);
    const res = await fetchItems('servicerequests');
    setRequests(res?.data?.data.data || []);
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const handleDelete = async (item) => {
    if (window.confirm('Delete this service request?')) {
      await deleteItem('serviceRequests', item);
      loadRequests();
    }
  };

  const filteredRequests = requests.filter((request) => {
    const term = searchTerm.toLowerCase();
    const matchesStatus = statusFilter ? request.status === statusFilter : true;
    return (
      matchesStatus &&
      (request._id?.toLowerCase().includes(term) ||
        request.customer?.name?.toLowerCase().includes(term) ||
        request.service?.name?.toLowerCase().includes(term) ||
        request.artisan?.name?.toLowerCase().includes(term) ||
        request.artisanShop?.name?.toLowerCase().includes(term))
    );
  });

  return (
    <div className="p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6 gap-4">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search by customer/service/artisan..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="border rounded px-3 py-2 w-64 focus:outline-none focus:ring focus:border-blue-300"
          />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="border rounded px-3 py-2 focus:outline-none focus:ring focus:border-blue-300"
          >
            <option value="">All Status</option>
            {statusOptions
              .filter((s) => s)
              .map((opt) => (
                <option key={opt} value={opt}>
                  {opt.charAt(0).toUpperCase() + opt.slice(1)}
                </option>
              ))}
          </select>
        </div>
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          onClick={() => navigate('/add-new/request')}
        >
          + Add New Request
        </button>
      </div>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded shadow">
          <thead>
            <tr className="bg-gray-100">
              <th className="py-2 px-4 text-left">ID</th>
              <th className="py-2 px-4 text-left">Customer</th>
              <th className="py-2 px-4 text-left">Service</th>
              <th className="py-2 px-4 text-left">Artisan</th>
              <th className="py-2 px-4 text-left">Shop</th>
              <th className="py-2 px-4 text-left">Status</th>
              <th className="py-2 px-4 text-left">Scheduled Time</th>
              <th className="py-2 px-4 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="text-center py-6">
                  Loading...
                </td>
              </tr>
            ) : requests.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6">
                  No service requests found.
                </td>
              </tr>
            ) : filteredRequests.length === 0 ? (
              <tr>
                <td colSpan={7} className="text-center py-6 text-gray-500">
                  No Service Requests Found
                </td>
              </tr>
            ) : (
              filteredRequests.map((req) => (
                <tr key={req._id} className="border-b hover:bg-gray-50">
                  <td
                    className="py-2 px-4"
                    onClick={() =>
                      navigate(`/add-new/request-details?id=${req._id}`)
                    }
                  >
                    {req.id}
                  </td>
                  <td className="py-2 px-4">
                    {req.customer?.name || req.customer}
                  </td>
                  <td className="py-2 px-4">
                    {req.service?.name || req.service}
                  </td>
                  <td className="py-2 px-4">
                    {req.artisan?.name || req.artisan}
                  </td>
                  <td className="py-2 px-4">
                    {req.artisanShop?.name || req.artisanShop}
                  </td>
                  <td className="py-2 px-4">
                    <span
                      className={`px-2 py-1 rounded text-xs ${
                        req.status === 'pending'
                          ? 'bg-yellow-100 text-yellow-800'
                          : req.status === 'completed'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-gray-200 text-gray-800'
                      }`}
                    >
                      {req.status}
                    </span>
                  </td>
                  <td className="py-2 px-4">
                    {req.scheduledTime
                      ? new Date(req.scheduledTime).toLocaleString()
                      : ''}
                  </td>
                  <td className="py-2 px-4 flex gap-2">
                    <button
                      className="bg-blue-500 text-white px-2 py-1 rounded text-xs hover:bg-blue-600"
                      onClick={() =>
                        navigate(`/add-new/editrequest?id=${req._id}`)
                      }
                    >
                      Edit
                    </button>
                    <button
                      className="bg-red-500 text-white px-2 py-1 rounded text-xs hover:bg-red-600"
                      onClick={() => handleDelete(req)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
