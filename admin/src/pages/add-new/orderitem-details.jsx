import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchItem } from '../../services/user_api';

export default function OrderItemDetails() {
  const location = useLocation();
  const id = new URLSearchParams(location.search).get('id');
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getItem = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchItem('orderitems', id);
        setItem(res.data.data.data);
      } catch (err) {
        setError('Failed to fetch order item details');
      }
      setLoading(false);
    };
    if (id) getItem();
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
  if (!item) {
    return (
      <div className="text-gray-500 text-center mt-10">
        Order item not found.
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-xl">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">
          Order Item Details
        </h2>
        <div className="mb-2">
          <span className="font-semibold">Order Item ID:</span>{' '}
          <span className="ml-2">{item._id}</span>
        </div>
        <div className="mb-2">
          <span className="font-semibold">Order ID:</span>{' '}
          <span className="ml-2">{item.order}</span>
        </div>
        <div className="mb-2">
          <span className="font-semibold">Product:</span>{' '}
          <span className="ml-2">{item.product?.name || item.product}</span>
        </div>
        <div className="mb-2">
          <span className="font-semibold">Quantity:</span>{' '}
          <span className="ml-2">{item.quantity}</span>
        </div>
        <div className="mb-2">
          <span className="font-semibold">Variety:</span>{' '}
          <span className="ml-2">{item.variety || '-'}</span>
        </div>
        <div className="mb-2">
          <span className="font-semibold">Preference:</span>{' '}
          <span className="ml-2">{item.preference || '-'}</span>
        </div>
        <div className="mb-2">
          <span className="font-semibold">Amount:</span>{' '}
          <span className="ml-2">₦{item.amount?.toLocaleString() || '-'}</span>
        </div>
        <div className="mb-2">
          <span className="font-semibold">Status:</span>{' '}
          <span className="ml-2">{item.status}</span>
        </div>
        <div className="mb-4">
          <span className="font-semibold">Options:</span>
          <ul className="list-disc ml-6">
            {item.orderoptions?.map((opt, idx) => (
              <li key={idx}>
                {opt.name}:{' '}
                {opt.options
                  ?.map((o, i) => `${o.optionname} (x${o.quantity})`)
                  .join(', ')}
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-between mt-8">
          <button
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded font-semibold"
            onClick={() => navigate('/orderitem')}
          >
            Back
          </button>
        </div>
      </div>
    </div>
  );
}
