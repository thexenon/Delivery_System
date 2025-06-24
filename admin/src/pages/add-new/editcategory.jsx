import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchItem, submitUpdate } from '../../services/user_api';

export default function EditCategory() {
  const location = useLocation();
  const id = new URLSearchParams(location.search).get('id');
  const [name, setName] = useState('');
  const [subcategories, setSubcategories] = useState(['']);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    async function fetchCategory() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchItem('categories', id);
        const cat = res.data.data.data;
        setName(cat.name || '');
        setSubcategories(
          Array.isArray(cat.subcategory) && cat.subcategory.length > 0
            ? cat.subcategory
            : ['']
        );
      } catch (err) {
        setError('Failed to load category');
      }
      setLoading(false);
    }
    if (id) fetchCategory();
  }, [id]);

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
    setSaving(true);
    setError(null);
    try {
      await submitUpdate(
        {
          name,
          subcategory: subcategories.filter((s) => s.trim() !== ''),
        },
        `categories/${id}`
      );
      navigate('/category');
    } catch (err) {
      setError('Failed to update category');
    }
    setSaving(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <form
        className="bg-white p-8 rounded-lg shadow max-w-md w-full"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Category</h2>
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
          disabled={saving}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </button>
      </form>
    </div>
  );
}
