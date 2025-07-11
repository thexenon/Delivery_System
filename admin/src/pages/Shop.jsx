import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchItems, deleteItem } from '../services/user_api';

export default function ShopPage() {
  const [shops, setShops] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchShops();
  }, []);

  const fetchShops = async () => {
    setLoading(true);
    try {
      fetchItems('artisanshops').then((res) => {
        if (res.status === 200) {
          setShops(res.data.data.data || []);
        } else {
          throw new Error('Failed to load shops');
        }
      });
    } catch (err) {
      setError('Failed to load shops');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this shop?')) return;
    setLoading(true);
    try {
      await deleteItem('artisanshops', { _id: id });
      setShops((prev) => prev.filter((shop) => shop._id !== id));
    } catch (err) {
      setError('Failed to delete shop');
    } finally {
      setLoading(false);
    }
  };

  const filteredShops = shops.filter((shop) => {
    const term = searchTerm.toLowerCase();
    return (
      shop.name?.toLowerCase().includes(term) ||
      shop.address?.toLowerCase().includes(term) ||
      shop.profession?.toLowerCase().includes(term) ||
      shop.artisan?.name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search shops..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="px-4 py-2 rounded border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-400 w-64"
          />
        </div>
        <button
          onClick={() => navigate('/add-new/shop')}
          className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 transition"
        >
          Add New Shop
        </button>
      </div>
      {loading ? (
        <div className="text-center py-10 text-lg text-gray-500">
          Loading...
        </div>
      ) : error ? (
        <div className="text-center py-10 text-red-500">{error}</div>
      ) : filteredShops.length === 0 ? (
        <div className="text-gray-500 text-center">No shops found.</div>
      ) : (
        <div className="overflow-x-auto rounded shadow bg-white">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-3 text-left font-semibold">Name</th>
                <th className="px-4 py-3 text-left font-semibold">Artisan</th>
                <th className="px-4 py-3 text-left font-semibold">
                  Profession
                </th>
                <th className="px-4 py-3 text-left font-semibold">Phone</th>
                <th className="px-4 py-3 text-left font-semibold">Address</th>
                <th className="px-4 py-3 text-left font-semibold">Available</th>
                <th className="px-4 py-3 text-left font-semibold">Verified</th>
                <th className="px-4 py-3 text-left font-semibold">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredShops.map((shop) => (
                <tr
                  key={shop._id}
                  className="border-b hover:bg-blue-50 transition cursor-pointer"
                  onClick={() =>
                    navigate(`/add-new/shop-details?id=${shop._id}`)
                  }
                >
                  <td className="px-4 py-2">{shop.name}</td>
                  <td className="px-4 py-2">
                    {shop.artisan?.name || shop.artisan}
                  </td>
                  <td className="px-4 py-2">{shop.profession}</td>
                  <td className="px-4 py-2">+233{shop.phone}</td>
                  <td className="px-4 py-2">{shop.address}</td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        shop.available
                          ? 'bg-green-100 text-green-700 px-2 py-1 rounded'
                          : 'bg-red-100 text-red-700 px-2 py-1 rounded'
                      }
                    >
                      {shop.available ? 'Available' : 'Unavailable'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <span
                      className={
                        shop.isVerified
                          ? 'bg-green-100 text-green-700 px-2 py-1 rounded'
                          : 'bg-yellow-100 text-yellow-700 px-2 py-1 rounded'
                      }
                    >
                      {shop.isVerified ? 'Verified' : 'Unverified'}
                    </span>
                  </td>
                  <td className="px-4 py-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/add-new/editshop?id=${shop._id}`);
                      }}
                      className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600 transition mr-2"
                    >
                      Edit
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(shop._id);
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
