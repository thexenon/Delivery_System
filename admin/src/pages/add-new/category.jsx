import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { fetchItems, submitPost } from '../../services/user_api';

export default function AddCategory() {
  const [name, setName] = useState('');
  const [subcategories, setSubcategories] = useState(['']);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  const handleSubcategoryChange = (idx, value) => {
    setSubcategories((prev) =>
      prev.map((item, i) => (i === idx ? value : item))
    );
  };

  const handleAddSubcategory = () => {
    setSubcategories((prev) => [...prev, '']);
  };

  const handleRemoveSubcategory = (idx) => {
    setSubcategories((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      await submitPost(
        {
          name,
          subcategory: subcategories.filter((sub) => sub.trim() !== ''),
        },
        'categories'
      );
      navigate('/category');
    } catch (err) {
      setError('Failed to add category');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <form
        className="bg-white p-8 rounded-lg shadow max-w-md w-full"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Add New Category
        </h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
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
          <label className="block text-gray-700 mb-2">Subcategories</label>
          {subcategories.map((sub, idx) => (
            <div key={idx} className="flex gap-2 mb-2">
              <input
                type="text"
                className="w-full border border-gray-300 rounded px-3 py-2"
                value={sub}
                onChange={(e) => handleSubcategoryChange(idx, e.target.value)}
                placeholder={`Subcategory ${idx + 1}`}
              />
              {subcategories.length > 1 && (
                <button
                  type="button"
                  className="text-red-500 px-2"
                  onClick={() => handleRemoveSubcategory(idx)}
                >
                  &times;
                </button>
              )}
            </div>
          ))}
          <button
            type="button"
            className="bg-gray-200 hover:bg-gray-300 text-gray-700 px-3 py-1 rounded mt-2"
            onClick={handleAddSubcategory}
          >
            + Add Subcategory
          </button>
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
  );
}
