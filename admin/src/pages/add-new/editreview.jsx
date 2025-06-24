import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchItems, fetchItem, submitUpdate } from '../../services/user_api';

export default function EditReview() {
  const location = useLocation();
  const id = new URLSearchParams(location.search).get('id');
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(5);
  const [store, setStore] = useState('');
  const [product, setProduct] = useState('');
  const [user, setUser] = useState('');
  const [stores, setStores] = useState([]);
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch dropdown data
    const fetchData = async () => {
      try {
        const [storeRes, productRes, userRes] = await Promise.all([
          fetchItems('stores'),
          fetchItems('products'),
          fetchItems('users'),
        ]);
        setStores(storeRes.data.data.data || []);
        setProducts(productRes.data.data.data || []);
        setUsers(userRes.data.data.data || []);
      } catch (err) {
        setError('Failed to fetch dropdown data');
      }
    };
    fetchData();
  }, []);

  // When a product is selected, auto-populate its store
  useEffect(() => {
    if (product && products.length > 0) {
      const selectedProduct = products.find((p) => p._id === product);
      if (selectedProduct && selectedProduct.store) {
        setStore(selectedProduct.store._id || selectedProduct.store);
      }
    }
  }, [product, products]);

  // When a store is selected, filter products to only those in the store
  const filteredProducts = store
    ? products.filter((p) => (p.store?._id || p.store) === store)
    : products;

  useEffect(() => {
    // Fetch review data
    const fetchReview = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await fetchItem('reviews', id);
        const data = res.data.data.data;
        setReview(data.review || '');
        setRating(data.rating || 5);
        setStore(data.store?._id || data.store || '');
        setProduct(data.product?._id || data.product || '');
        setUser(data.user?._id || data.user || '');
      } catch (err) {
        setError('Failed to fetch review');
      }
      setLoading(false);
    };
    fetchReview();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const data = { review, rating, store, product, user };
      await submitUpdate(data, `reviews/${id}`).then((res) => {
        if (res.status === 200 || res.status === 201) {
          alert('Review updated successfully!');
          navigate('/review');
        } else {
          throw new Error(res.data.message || 'Failed to update review');
        }
      });
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          'Failed to update review. Please check all fields.'
      );
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <form
        className="bg-white shadow-lg rounded-lg p-8 w-full max-w-lg"
        onSubmit={handleSubmit}
      >
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Edit Review</h2>
        {error && <div className="text-red-500 mb-4">{error}</div>}
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Review</label>
          <textarea
            className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={review}
            onChange={(e) => setReview(e.target.value)}
            required
            rows={3}
          />
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Rating</label>
          <select
            className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={rating}
            onChange={(e) => setRating(Number(e.target.value))}
            required
          >
            {[1, 2, 3, 4, 5].map((num) => (
              <option key={num} value={num}>
                {num}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Store</label>
          <select
            className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={store}
            onChange={(e) => setStore(e.target.value)}
            required
          >
            <option value="">Select Store</option>
            {stores.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Product</label>
          <select
            className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={product}
            onChange={(e) => setProduct(e.target.value)}
            required
          >
            <option value="">Select Product</option>
            {filteredProducts.map((p) => (
              <option key={p._id} value={p._id}>
                {p.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-6">
          <label className="block mb-1 font-semibold">User</label>
          <select
            className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={user}
            onChange={(e) => setUser(e.target.value)}
            required
          >
            <option value="">Select User</option>
            {users.map((u) => (
              <option key={u._id} value={u._id}>
                {u.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex justify-between">
          <button
            type="button"
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded font-semibold"
            onClick={() => navigate('/review')}
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded font-semibold shadow"
            disabled={loading}
          >
            {loading ? 'Saving...' : 'Update Review'}
          </button>
        </div>
      </form>
    </div>
  );
}
