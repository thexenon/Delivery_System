import React, { useEffect, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { fetchItem } from '../../services/user_api';

export default function ServiceDetails() {
  const location = useLocation();
  const id = new URLSearchParams(location.search).get('id');
  const [service, setService] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchItem('services', id)
      .then((res) => {
        setService(res.data.data.data);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load service details');
        setLoading(false);
      });
  }, [id]);

  if (loading)
    return (
      <div className="text-center py-10 text-lg text-gray-500">Loading...</div>
    );
  if (error)
    return <div className="text-center py-10 text-red-500">{error}</div>;
  if (!service) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow max-w-2xl w-full">
        <h2 className="text-3xl font-bold mb-4 text-blue-800">
          {service.name}
        </h2>
        <div className="flex flex-col md:flex-row gap-6 mb-6">
          <div className="flex-1">
            <div className="mb-2 text-lg font-semibold text-gray-700">
              ₦{service.price}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Duration:</span>{' '}
              {service.duration} hours
            </div>
            <div className="mb-2">
              <span className="font-semibold">Verified:</span>{' '}
              <span
                className={
                  service.isVerified ? 'text-green-600' : 'text-red-600'
                }
              >
                {service.isVerified ? 'Yes' : 'No'}
              </span>
            </div>
            <div className="mb-2">
              <span className="font-semibold">Summary:</span> {service.summary}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Description:</span>{' '}
              {service.description}
            </div>
            <div className="mb-2">
              <span className="font-semibold">Images:</span>
            </div>
            <div className="flex flex-wrap gap-2 mb-4">
              {service.images?.map((img, idx) => (
                <img
                  key={idx}
                  src={img}
                  alt={`Service ${idx + 1}`}
                  className="w-24 h-24 object-cover rounded shadow"
                />
              ))}
            </div>
          </div>
          <div className="flex-1 bg-gray-50 rounded-lg p-4 shadow">
            <h3 className="text-lg font-bold text-gray-700 mb-2">
              Artisan Details
            </h3>
            {service.artisan && (
              <div className="mb-2">
                <div className="font-semibold">Name:</div>{' '}
                {service.artisan.name || service.artisan}
                {service.artisan.email && (
                  <div>
                    <span className="font-semibold">Email:</span>{' '}
                    {service.artisan.email}
                  </div>
                )}
                {service.artisan.phone && (
                  <div>
                    <span className="font-semibold">Phone:</span>+233
                    {service.artisan.phone}
                  </div>
                )}
                {service.artisan.bio && (
                  <div>
                    <span className="font-semibold">Bio:</span>{' '}
                    {service.artisan.bio}
                  </div>
                )}
              </div>
            )}
            <h3 className="text-lg font-bold text-gray-700 mt-4 mb-2">
              Artisan Shop Details
            </h3>
            {service.artisanShop && (
              <div className="mb-2">
                <div className="font-semibold">Name:</div>{' '}
                {service.artisanShop.name || service.artisanShop}
                {service.artisanShop.address && (
                  <div>
                    <span className="font-semibold">Address:</span>{' '}
                    {service.artisanShop.address}
                  </div>
                )}
                {service.artisanShop.phone && (
                  <div>
                    <span className="font-semibold">Phone:</span>+233
                    {service.artisanShop.phone}
                  </div>
                )}
                {service.artisanShop.email && (
                  <div>
                    <span className="font-semibold">Email:</span>{' '}
                    {service.artisanShop.email}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
        <div className="bg-gray-50 rounded-lg p-4 shadow mt-4">
          <h3 className="text-lg font-bold text-gray-700 mb-2">Reviews</h3>
          {service.reviews && service.reviews.length > 0 ? (
            <div className="space-y-4">
              {service.reviews.map((review, idx) => (
                <div key={idx} className="border-b pb-2">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold text-blue-700">
                      {review.user?.name || review.user || 'Anonymous'}
                    </span>
                    <span className="text-yellow-500">
                      {'★'.repeat(review.rating || 0)}
                    </span>
                  </div>
                  <div className="text-gray-700">{review.comment}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-500">No reviews yet.</div>
          )}
        </div>
      </div>
    </div>
  );
}
