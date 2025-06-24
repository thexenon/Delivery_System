import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchItem, fetchItems } from '../../services/user_api';

export default function StoreDetails() {
  const location = useLocation();
  const navigate = useNavigate();
  const id = new URLSearchParams(location.search).get('id');
  const [store, setStore] = useState(null);
  const [products, setProducts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchAll() {
      setLoading(true);
      setError(null);
      try {
        const storeRes = await fetchItem('stores', id);
        setStore(storeRes.data.data.data);
        setProducts(storeRes.data.data.data.products || []);
        setReviews(storeRes.data.data.data.reviews || []);
      } catch (err) {
        setError('Failed to load store details');
      }
      setLoading(false);
    }
    if (id) fetchAll();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }
  if (error) {
    return <div className="text-red-500 text-center mt-10">{error}</div>;
  }
  if (!store) {
    return (
      <div className="text-gray-500 text-center mt-10">Store not found.</div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto bg-white rounded-lg shadow p-8">
        <button
          className="mb-6 text-blue-600 hover:underline"
          onClick={() => navigate(-1)}
        >
          &larr; Back
        </button>
        {/* About Section */}
        <h1 className="text-3xl font-bold mb-2 text-gray-800">{store.name}</h1>
        <div className="flex flex-col md:flex-row gap-6 mb-8">
          {store.image && (
            <img
              src={store.image}
              alt={store.name}
              className="w-40 h-40 object-cover rounded shadow"
            />
          )}
          <div className="flex-1">
            <h2 className="text-xl font-semibold mb-2">About</h2>
            <div className="mb-2 text-gray-700">
              <span className="font-semibold">Address:</span>{' '}
              {store.address || '-'}
            </div>
            <div className="mb-2 text-gray-700">
              <span className="font-semibold">Phone:</span> +233-
              {store.phone || '-'}
            </div>
            <div className="mb-2 text-gray-700">
              <span className="font-semibold">Merchant:</span>{' '}
              {store.owner?.name || '-'}
            </div>
            <div className="mb-2 text-gray-700">
              <span className="font-semibold">Location:</span>{' '}
            </div>
            {store.location && store.location.coordinates && (
              <div className="mb-2">
                <iframe
                  title="Store Location"
                  width="100%"
                  height="300"
                  style={{
                    border: 0,
                    borderRadius: '8px',
                    boxShadow: '0 2px 8px #0001',
                  }}
                  loading="lazy"
                  allowFullScreen
                  referrerPolicy="no-referrer-when-downgrade"
                  src={`https://www.google.com/maps?q=${store.location.coordinates[1]},${store.location.coordinates[0]}&z=17&output=embed`}
                ></iframe>
                <div className="text-xs text-gray-500 mt-1">
                  Lat: {store.location.coordinates[1]}, Lng:{' '}
                  {store.location.coordinates[0]}
                </div>
              </div>
            )}
            <div className="mb-2 text-gray-700">
              <span className="font-semibold">Ratings:</span>{' '}
              {store.ratingsAverage || '-'} ({store.ratingsQunatity || 0})
            </div>
            <div className="mb-2 text-gray-700">
              <span className="font-semibold">Working Hours:</span>
              <ul className="ml-4 list-disc">
                {store.workingHours && store.workingHours.length > 0 ? (
                  store.workingHours.map((wh) => (
                    <li key={wh.day}>
                      {wh.day}: {wh.open} - {wh.close}
                    </li>
                  ))
                ) : (
                  <li>-</li>
                )}
              </ul>
            </div>
          </div>
        </div>
        {/* Products Section */}
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Products</h2>
        {products.length === 0 ? (
          <div className="text-gray-500 mb-8">
            No products found for this store.
          </div>
        ) : (
          <div className="overflow-x-auto mb-8">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    SubCategory
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products.map((product) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-4 py-2 font-semibold text-gray-800">
                      {product.name}
                    </td>
                    <td className="px-4 py-2">{product.price}</td>
                    <td className="px-4 py-2">{product.subcategory || '-'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {/* Reviews Section */}
        <h2 className="text-2xl font-bold mb-4 text-gray-800">Reviews</h2>
        {reviews.length === 0 ? (
          <div className="text-gray-500">No reviews for this store yet.</div>
        ) : (
          <div className="space-y-4">
            {reviews.map((review) => (
              <div key={review._id} className="bg-gray-100 rounded p-4">
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-semibold text-gray-700">
                    {review.user?.name || 'Anonymous'}
                  </span>
                  <span className="text-yellow-500">
                    {'★'.repeat(Math.round(review.rating))}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                <div className="text-gray-700">{review.review}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
