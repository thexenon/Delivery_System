import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchItems, deleteItem } from '../services/user_api';

export default function Category() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [showAdd, setShowAdd] = useState(false);
  const navigate = useNavigate();

  const getCategories = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchItems('categories');
      setCategories(res.data.data.data || []);
    } catch (err) {
      setError('Failed to fetch categories');
    }
    setLoading(false);
  };

  useEffect(() => {
    getCategories();
  }, []);

  const handleDelete = async (cat) => {
    if (!window.confirm('Are you sure you want to delete this category?'))
      return;
    try {
      await deleteItem('categories', cat);
      setCategories((prev) => prev.filter((c) => c._id !== cat._id));
    } catch (err) {
      alert('Failed to delete category');
    }
  };

  const filteredCategories = categories.filter((cat) => {
    const term = searchTerm.toLowerCase();
    return (
      cat.name?.toLowerCase().includes(term) ||
      cat.subcategory?.toString().toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-gray-800">Categories</h1>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold shadow"
            onClick={() => navigate('/add-new/category')}
          >
            + Add New Category
          </button>
        </div>
        <div className="mb-6 flex justify-end">
          <input
            type="text"
            className="border border-gray-300 rounded px-4 py-2 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search categories..."
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
        ) : filteredCategories.length === 0 ? (
          <div className="text-gray-500 text-center">No categories found.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Subcategories
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredCategories.map((cat) => (
                  <tr key={cat._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-800">
                      {cat.name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {Array.isArray(cat.subcategory) &&
                      cat.subcategory.length > 0
                        ? cat.subcategory.join(', ')
                        : '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                      <button
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                        onClick={() =>
                          navigate(`/add-new/editcategory?id=${cat._id}`)
                        }
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                        onClick={() => handleDelete(cat)}
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
        {showAdd && (
          <AddCategoryModal
            onClose={() => {
              setShowAdd(false);
              getCategories();
            }}
          />
        )}
      </div>
    </div>
  );
}

function AddCategoryModal({ onClose }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await fetchItems('categories', {
        method: 'POST',
        data: { name, description },
      });
      onClose();
    } catch (err) {
      setError('Failed to add category');
    }
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-lg p-8 w-full max-w-md relative">
        <button
          className="absolute top-2 right-2 text-gray-400 hover:text-gray-600 text-2xl"
          onClick={onClose}
        >
          &times;
        </button>
        <h2 className="text-xl font-bold mb-4">Add New Category</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Name</label>
            <input
              type="text"
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700 mb-2">Description</label>
            <textarea
              className="w-full border border-gray-300 rounded px-3 py-2"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
            />
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg shadow"
            disabled={loading}
          >
            {loading ? 'Adding...' : 'Add Category'}
          </button>
        </form>
      </div>
    </div>
  );
}
