import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchItems, fetchItem, submitUpdate } from '../../services/user_api';

export default function AddReview() {
  const [review, setReview] = useState('');
  const [rating, setRating] = useState(5);
  const [artisanShop, setArtisanShop] = useState('');
  const [service, setService] = useState('');
  const [user, setUser] = useState('');
  const [artisanShops, setArtisanShops] = useState([]);
  const [services, setServices] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const location = useLocation();
  const id = new URLSearchParams(location.search).get('id');

  useEffect(() => {
    // Fetch artisanShops, services, users for dropdowns
    const fetchData = async () => {
      try {
        const [artisanShopRes, serviceRes, userRes] = await Promise.all([
          fetchItems('artisanshops'),
          fetchItems('services'),
          fetchItems('users'),
        ]);
        setArtisanShops(artisanShopRes.data.data.data || []);
        setServices(serviceRes.data.data.data || []);
        setUsers(userRes.data.data.data || []);
      } catch (err) {
        setError('Failed to fetch dropdown data');
      }
    };
    fetchData();
  }, []);

  // When a service is selected, auto-populate its artisanShop
  useEffect(() => {
    if (service && services.length > 0) {
      const selectedService = services.find((p) => p._id === service);
      if (selectedService && selectedService.artisanShop) {
        setArtisanShop(
          selectedService.artisanShop._id || selectedService.artisanShop
        );
      }
    }
  }, [service, services]);

  // When a artisanShop is selected, filter services to only those in the artisanShop
  const filteredServices = artisanShop
    ? services.filter(
        (p) => (p.artisanShop?._id || p.artisanShop) === artisanShop
      )
    : services;

  useEffect(() => {
    // Fetch review data
    const fetchReview = async () => {
      if (!id) return;
      setLoading(true);
      try {
        const res = await fetchItem('artisanreviews', id);
        const data = res.data.data.data;
        console.log('====================================');
        console.log(data);
        console.log('====================================');
        setReview(data.review || '');
        setRating(data.rating || 5);
        setArtisanShop(data.artisanShop?._id || data.artisanShop || '');
        setService(data.service?._id || data.service || '');
        setUser(data.user?._id || data.user || '');
      } catch (err) {
        console.log('====================================');
        console.log(err);
        console.log('====================================');
        setError(err || 'Failed to fetch Artisan Review');
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
      await submitUpdate(
        { review, rating, artisanShop, service, user },
        `artisanreviews/${id}`
      ).then((res) => {
        if (res.status === 200) {
          alert('Review updated successfully!');
          navigate('/rating');
        } else {
          console.log('====================================');
          console.log(res);
          console.log('====================================');
          throw new Error(res.message || 'Failed to add review');
        }
      });
    } catch (err) {
      console.log('====================================');
      console.log(err);
      console.log('====================================');
      setError(
        err?.message || 'Failed to add review. Please check all fields.'
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
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Add New Review
        </h2>
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
          <label className="block mb-1 font-semibold">Artisan Shop</label>
          <select
            className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={artisanShop}
            onChange={(e) => setArtisanShop(e.target.value)}
            required
          >
            <option value="">Select Artisan Shop</option>
            {artisanShops.map((s) => (
              <option key={s._id} value={s._id}>
                {s.name}
              </option>
            ))}
          </select>
        </div>
        <div className="mb-4">
          <label className="block mb-1 font-semibold">Service</label>
          <select
            className="border border-gray-300 rounded px-3 py-2 w-full focus:outline-none focus:ring-2 focus:ring-blue-500"
            value={service}
            onChange={(e) => setService(e.target.value)}
            required
          >
            <option value="">Select Service</option>
            {filteredServices.map((p) => (
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
            onClick={() => navigate('/rating')}
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
