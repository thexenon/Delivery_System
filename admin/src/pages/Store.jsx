import React, { useEffect, useState } from 'react';
import { fetchItems, deleteItem } from '../services/user_api';
import { useNavigate } from 'react-router-dom';

export default function Store() {
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const navigate = useNavigate();

  const getStores = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchItems('stores');
      setStores(res.data.data.data || []);
    } catch (err) {
      setError('Failed to fetch stores');
    }
    setLoading(false);
  };

  useEffect(() => {
    getStores();
  }, []);

  const handleDelete = async (store) => {
    if (!window.confirm('Are you sure you want to delete this store?')) return;
    try {
      await deleteItem('stores', store);
      setStores((prev) => prev.filter((s) => s._id !== store._id));
    } catch (err) {
      alert('Failed to delete store');
    }
  };

  const filteredStores = stores.filter((store) => {
    const term = searchTerm.toLowerCase();
    return (
      store.name?.toLowerCase().includes(term) ||
      store.address?.toLowerCase().includes(term) ||
      store.owner?.name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">All Stores</h1>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold shadow"
            onClick={() => navigate('/add-new/store')}
          >
            + Add New Store
          </button>
        </div>
        <div className="mb-6 flex justify-end">
          <input
            type="text"
            className="border border-gray-300 rounded px-4 py-2 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search stores..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : filteredStores.length === 0 ? (
          <div className="text-gray-500 text-center">No stores found.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Owner
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Address
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Number
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStores.map((store) => (
                  <tr key={store._id} className="hover:bg-gray-50">
                    <td
                      className="px-6 py-4 whitespace-nowrap font-semibold text-gray-800 cursor-pointer hover:underline text-blue-600"
                      onClick={() =>
                        navigate(`/add-new/store-details?id=${store._id}`)
                      }
                    >
                      {store.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {store.owner?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {store.address}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      +233-{store.phone}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                      <button
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                        onClick={() =>
                          navigate(`/add-new/editstore?id=${store._id}`)
                        }
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                        onClick={() => handleDelete(store)}
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
