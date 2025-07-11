import React, { useEffect, useState } from 'react';
import { deleteItem, fetchItems } from '../services/user_api';
import { useNavigate } from 'react-router-dom';

export default function ServicePage() {
  const [services, setServices] = useState([]);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const statusOptions = [
    '',
    'pending',
    'delivered',
    'in-transit',
    'picked-up',
    'cancelled',
  ];

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    setLoading(true);
    try {
      await fetchItems('services').then((res) => {
        if (res.status === 200) {
          setServices(res.data.data.data || []);
        } else {
          throw new Error('Failed to load services');
        }
      });
    } catch (err) {
      setError('Failed to load services');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this service?'))
      return;
    setLoading(true);
    try {
      await deleteItem('services', { _id: id });
      setServices((prev) => prev.filter((service) => service._id !== id));
    } catch (err) {
      setError('Failed to delete service');
    } finally {
      setLoading(false);
    }
  };

  const filteredServices = services.filter((service) => {
    const term = search.toLowerCase();
    const matchesStatus = statusFilter ? service.status === statusFilter : true;
    return (
      matchesStatus &&
      (service.name?.toLowerCase().includes(term) ||
        service.artisan?.name?.toLowerCase().includes(term) ||
        service.artisanShop?.name?.toLowerCase().includes(term))
    );
  });

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search services..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 w-64"
          />
        </div>
        <button
          onClick={() => navigate('/add-new/service')}
          className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 transition"
        >
          Add New Service
        </button>
      </div>
      {loading ? (
        <div className="text-center py-10 text-lg text-gray-500">
          Loading...
        </div>
      ) : error ? (
        <div className="text-center py-10 text-red-500">{error}</div>
      ) : filteredServices.length === 0 ? (
        <div className="text-gray-500 text-center">No services found.</div>
      ) : (
        <div className="overflow-x-auto rounded shadow bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Price</th>
                <th className="px-4 py-3 text-left font-semibold">Artisan</th>
                <th className="px-4 py-3 text-left font-semibold">Shop</th>
                <th className="px-4 py-3 text-left font-semibold">Duration</th>
                <th className="px-4 py-3 text-left font-semibold">Verified</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredServices.map((service) => (
                <tr
                  key={service._id}
                  className="border-b hover:bg-blue-50 transition cursor-pointer"
                  onClick={() =>
                    navigate(`/add-new/service-details?id=${service._id}`)
                  }
                >
                  <td className="px-4 py-2">{service.name}</td>
                  <td className="px-4 py-2">₦{service.price}</td>
                  <td className="px-4 py-2">
                    {service.artisan?.name || service.artisan}
                  </td>
                  <td className="px-4 py-2">
                    {service.artisanShop?.name || service.artisanShop}
                  </td>
                  <td className="px-4 py-2">{service.duration} hours</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        service.isVerified
                          ? 'bg-green-100 text-green-700 px-2 py-1 rounded'
                          : 'bg-red-100 text-red-700 px-2 py-1 rounded'
                      }
                    >
                      {service.isVerified ? 'Verified' : 'Not Verified'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/add-new/editservice?id=${service._id}`);
                      }}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(service._id);
                      }}
                      className="bg-red-500 text-white px-3 py-1 rounded hover:bg-red-600 transition"
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
  );
}
