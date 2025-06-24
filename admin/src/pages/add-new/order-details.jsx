import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { fetchItem, fetchItems } from '../../services/user_api';

export default function OrderDetails() {
  const location = useLocation();
  const id = new URLSearchParams(location.search).get('id');
  const [order, setOrder] = useState(null);
  const [orderItems, setOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const getOrder = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchItem('orders', id);
        setOrder(res.data.data.data);
        // Fetch order items for this order
        const itemsRes = await fetchItems(`orderitems?order=${id}`);
        setOrderItems(itemsRes.data.data.data || []);
      } catch (err) {
        setError('Failed to fetch order details');
      }
      setLoading(false);
    };
    if (id) getOrder();
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
  if (!order) {
    return (
      <div className="text-gray-500 text-center mt-10">Order not found.</div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 flex items-center justify-center">
      <div className="bg-white shadow-lg rounded-lg p-8 w-full max-w-2xl">
        <h2 className="text-2xl font-bold mb-6 text-gray-800">Order Details</h2>
        <div className="mb-2">
          <span className="font-semibold">Order ID:</span>{' '}
          <span className="ml-2">{order._id}</span>
        </div>
        <div className="mb-2">
          <span className="font-semibold">Customer Name:</span>{' '}
          <span className="ml-2">{order.user?.name || '-'}</span>
        </div>{' '}
        <div className="mb-2">
          <span className="font-semibold">Customer Address:</span>{' '}
          <span className="ml-2">{order.user?.address || '-'}</span>
        </div>{' '}
        <div className="mb-2">
          <span className="font-semibold">Customer Number:</span>{' '}
          <span className="ml-2">{order.user?.phone || '-'}</span>
        </div>
        <div className="mb-2">
          <span className="font-semibold">Rider Name:</span>{' '}
          <span className="ml-2">{order.rider?.name || '-'}</span>
        </div>
        <div className="mb-2">
          <span className="font-semibold">Rider Number:</span>{' '}
          <span className="ml-2">{order.rider?.phone || '-'}</span>
        </div>
        <div className="mb-2">
          <span className="font-semibold">Status:</span>{' '}
          <span className="ml-2">{order.status}</span>
        </div>
        <div className="mb-2">
          <span className="font-semibold">Payment:</span>{' '}
          <span className="ml-2">{order.payment}</span>
        </div>
        <div className="mb-2">
          <span className="font-semibold">Total:</span>{' '}
          <span className="ml-2">
            ₦{order.totalAmount?.toLocaleString() || '-'}
          </span>
        </div>
        <div className="mb-2">
          <span className="font-semibold">Location:</span>{' '}
          <span className="ml-2">
            Lng: {order.location?.coordinates?.[0]}, Lat:{' '}
            {order.location?.coordinates?.[1]}
          </span>
        </div>
        <div className="mb-2">
          <span className="font-semibold">Created At:</span>{' '}
          <span className="ml-2">
            {new Date(order.createdAt).toLocaleString()}
          </span>
        </div>
        <div className="mb-4">
          <span className="font-semibold">Products:</span>
          <ul className="list-disc ml-6">
            {order.products?.map((p) => (
              <li key={p._id || p}>{p.name || p}</li>
            ))}
          </ul>
        </div>
        <div className="mb-4">
          <span className="font-semibold">Order Items:</span>
          <ul className="list-disc ml-6">
            {orderItems.map((item) => (
              <li key={item._id} className="mb-2">
                <div>
                  <span className="font-semibold">Product:</span>{' '}
                  {item.product?.name || item.product}
                </div>
                <div>
                  <span className="font-semibold">Quantity:</span>{' '}
                  {item.quantity}
                </div>
                <div>
                  <span className="font-semibold">Variety:</span>{' '}
                  {item.variety || '-'}
                </div>
                <div>
                  <span className="font-semibold">Preference:</span>{' '}
                  {item.preference || '-'}
                </div>
                <div>
                  <span className="font-semibold">Amount:</span> ₦
                  {item.amount?.toLocaleString() || '-'}
                </div>
                <div>
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
              </li>
            ))}
          </ul>
        </div>
        <div className="flex justify-between mt-8">
          <button
            className="bg-gray-300 hover:bg-gray-400 text-gray-800 px-4 py-2 rounded font-semibold"
            onClick={() => navigate('/order')}
          >
            Back
          </button>
          <button
            className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded font-semibold"
            onClick={() => navigate(`/add-new/editorder?id=${order._id}`)}
          >
            Edit
          </button>
        </div>
      </div>
    </div>
  );
}
