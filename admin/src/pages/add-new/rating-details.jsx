import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchItem } from '../../services/user_api';

export default function ReviewDetails() {
  const location = useLocation();
  const id = new URLSearchParams(location.search).get('id');
  const [review, setReview] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getReview = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchItem('reviews', id);
        setReview(res.data.data.data);
      } catch (err) {
        setError('Failed to fetch review details');
      }
      setLoading(false);
    };
    if (id) getReview();
  }, [id]);

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }
  if (error) {
    return <div className="text-red-500 text-center mt-10">{error}</div>;
  }
  if (!review) {
    return (
      <div className="text-gray-500 text-center mt-10">
        Artisan Review not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-xl">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Review Details
        </h2>
        <div className="mb-4">
          <span className="font-semibold">Artisan Review:</span>
          <div className="mt-1 text-gray-700 whitespace-pre-line">
            {review.review}
          </div>
        </div>
        <div className="mb-4">
          <span className="font-semibold">Rating:</span>
          <span className="ml-2 text-yellow-500 font-bold">
            {review.rating} / 5
          </span>
        </div>
        <div className="mb-4">
          <span className="font-semibold">User:</span>
          <span className="ml-2">{review.user?.name || '-'}</span>
        </div>
        <div className="mb-4">
          <span className="font-semibold">Store:</span>
          <span className="ml-2">{review.store?.name || '-'}</span>
        </div>
        <div className="mb-4">
          <span className="font-semibold">Product:</span>
          <span className="ml-2">{review.product?.name || '-'}</span>
        </div>
        <div className="mb-4">
          <span className="font-semibold">Created At:</span>
          <span className="ml-2">
            {new Date(review.createdAt).toLocaleString()}
          </span>
        </div>
        <div className="flex justify-between mt-8">
          <button
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded font-semibold"
            onClick={() => navigate('/rating')}
          >
            Back
          </button>
          <button
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold"
            onClick={() => navigate(`/add-new/editrating?id=${review._id}`)}
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
