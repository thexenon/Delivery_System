import React, { useEffect, useState } from 'react';
import { fetchItems, deleteItemm } from '../services/user_api';
import { useNavigate } from 'react-router-dom';

export default function Review() {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const getReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchItems('reviews');
      setReviews(res.data.data.data || []);
    } catch (err) {
      setError('Failed to fetch reviews');
    }
    setLoading(false);
  };

  useEffect(() => {
    getReviews();
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this review?')) return;
    try {
      const review = reviews.find((u) => u.id === id || u._id === id);
      const res = await deleteItemm(`reviews/${id}`);
      // .then((res) => {
      console.log('====================================');
      console.log(res);
      console.log('====================================');
      if (res.status === 204) {
        alert('Review Deleted Successfully...');
        setReviews((prev) => prev.filter((r) => r._id !== id));
      } else {
        alert(res.message || 'Failed to delete review');
      }
      // });
    } catch (err) {
      console.log('====================================');
      console.log(err.message);
      console.log('====================================');
      alert('Failed to delete review');
    }
  };

  const filteredReviews = reviews.filter((review) => {
    const term = search.toLowerCase();
    return (
      review.review?.toLowerCase().includes(term) ||
      review.user?.name?.toLowerCase().includes(term) ||
      review.store?.name?.toLowerCase().includes(term) ||
      review.product?.name?.toLowerCase().includes(term)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
          <h1 className="text-3xl font-bold text-gray-800">All Reviews</h1>
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold shadow"
            onClick={() => navigate('/add-new/review')}
          >
            + Add New Review
          </button>
        </div>
        <div className="mb-6 flex justify-end">
          <input
            type="text"
            className="border border-gray-300 rounded px-4 py-2 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Search reviews..."
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
        ) : filteredReviews.length === 0 ? (
          <div className="text-gray-500 text-center">No reviews found.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Review
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rating
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Store
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredReviews.map((review) => (
                  <tr key={review._id} className="hover:bg-gray-50">
                    <td
                      className="px-6 py-4 whitespace-nowrap font-semibold text-gray-800 cursor-pointer hover:underline text-blue-700"
                      onClick={() =>
                        navigate(`/add-new/review-details?id=${review._id}`)
                      }
                    >
                      {review.review}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {review.rating}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {review.user?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {review.store?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {review.product?.name || '-'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                      <button
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                        onClick={() =>
                          navigate(`/add-new/editreview?id=${review._id}`)
                        }
                      >
                        Edit
                      </button>
                      <button
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                        onClick={() => handleDelete(review.id || review._id)}
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
