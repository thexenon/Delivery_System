import React, { useEffect, useState } from 'react';
import { fetchItem } from '../../services/user_api';
import { useLocation, useNavigate } from 'react-router-dom';

export default function ProductDetails() {
  const location = useLocation();
  const id = new URLSearchParams(location.search).get('id');
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentImage, setCurrentImage] = useState(0);
  const navigate = useNavigate();

  useEffect(() => {
    const getProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetchItem('products', id);
        setProduct(res.data.data.data);
      } catch (err) {
        setError('Failed to load product details');
      }
      setLoading(false);
    };
    getProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <span className="loading loading-spinner loading-lg"></span>
      </div>
    );
  }
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-red-500">{error}</div>
      </div>
    );
  }
  if (!product) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow max-w-2xl w-full">
        <button
          className="mb-4 text-blue-600 hover:underline"
          onClick={() => navigate(-1)}
        >
          ← Back
        </button>
        <h2 className="text-3xl font-bold mb-4 text-gray-800">
          {product.name}
        </h2>
        <div className="flex flex-wrap gap-6 mb-6">
          {product.images && product.images.length > 0 && (
            <div className="flex flex-col items-center gap-2">
              <div className="relative w-64 h-64 flex items-center justify-center">
                <img
                  src={product.images[currentImage]}
                  alt={`Product ${currentImage + 1}`}
                  className="w-64 h-64 object-cover rounded border shadow"
                />
                {product.images.length > 1 && (
                  <>
                    <button
                      type="button"
                      className="absolute left-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 text-xl shadow hover:bg-blue-100"
                      onClick={() =>
                        setCurrentImage((prev) =>
                          prev === 0 ? product.images.length - 1 : prev - 1
                        )
                      }
                      aria-label="Previous image"
                    >
                      &#8592;
                    </button>
                    <button
                      type="button"
                      className="absolute right-2 top-1/2 -translate-y-1/2 bg-white bg-opacity-80 rounded-full p-2 text-xl shadow hover:bg-blue-100"
                      onClick={() =>
                        setCurrentImage((prev) =>
                          prev === product.images.length - 1 ? 0 : prev + 1
                        )
                      }
                      aria-label="Next image"
                    >
                      &#8594;
                    </button>
                  </>
                )}
                <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1">
                  {product.images.map((_, idx) => (
                    <span
                      key={idx}
                      className={`inline-block w-2 h-2 rounded-full ${
                        idx === currentImage ? 'bg-blue-600' : 'bg-gray-300'
                      }`}
                    ></span>
                  ))}
                </div>
              </div>
              <div className="text-sm text-gray-500">
                Image {currentImage + 1} of {product.images.length}
              </div>
            </div>
          )}
          <div className="flex-1 min-w-[220px]">
            <div className="mb-2 text-lg text-gray-700">
              <span className="font-semibold">Price:</span> GHS{' '}
              {product.price?.toLocaleString()}
            </div>
            {product.priceDiscount && (
              <div className="mb-2 text-lg text-green-600">
                <span className="font-semibold">Discount Price:</span> GHS{' '}
                {product.priceDiscount?.toLocaleString()}
              </div>
            )}
            {product.priceDiscountPercent && (
              <div className="mb-2 text-lg text-green-600">
                <span className="font-semibold">Discount Percent:</span>{' '}
                {product.priceDiscountPercent?.toLocaleString()}% Off
              </div>
            )}
            <div className="mb-2 text-gray-700">
              <span className="font-semibold">Stock:</span> {product.stock}
            </div>
            <div className="mb-2 text-gray-700">
              <span className="font-semibold">Category:</span>{' '}
              {product.category?.name || product.category}
            </div>
            <div className="mb-2 text-gray-700">
              <span className="font-semibold">Subcategory:</span>{' '}
              {product.subcategory}
            </div>
            <div className="mb-2 text-gray-700">
              <span className="font-semibold">Store:</span>{' '}
              {product.store?.name || product.store}
            </div>
            <div className="mb-2 text-gray-700">
              <span className="font-semibold">Duration:</span>{' '}
              {product.duration} min
            </div>
            <div className="mb-2 text-gray-700">
              <span className="font-semibold">Max Order:</span>{' '}
              {product.maxOrder}
            </div>
            <div className="mb-2 text-gray-700">
              <span className="font-semibold">Ratings:</span>{' '}
              {product.ratingsAverage || '-'} ({product.ratingsQuantity || 0})
            </div>
          </div>
        </div>
        <div className="mb-4">
          <h3 className="font-semibold text-lg mb-1 text-gray-800">Summary</h3>
          <div className="text-gray-700 whitespace-pre-line">
            {product.summary}
          </div>
        </div>
        <div className="mb-4">
          <h3 className="font-semibold text-lg mb-1 text-gray-800">
            Description
          </h3>
          <div className="text-gray-700 whitespace-pre-line">
            {product.description}
          </div>
        </div>
        {product.varieties && product.varieties.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold text-lg mb-1 text-gray-800">
              Varieties
            </h3>
            <ul className="list-disc ml-6 text-gray-700">
              {product.varieties.map((v, idx) => (
                <li key={idx}>
                  {v.name} (Diff: GHS {v.priceDifference})
                </li>
              ))}
            </ul>
          </div>
        )}
        {product.productoptions && product.productoptions.length > 0 && (
          <div className="mb-4">
            <h3 className="font-semibold text-lg mb-1 text-gray-800">
              Product Options
            </h3>
            {product.productoptions.map((po, idx) => (
              <div key={idx} className="mb-2">
                <div className="font-semibold text-gray-700">
                  {po.name}{' '}
                  {po.required ? (
                    <span className="text-xs text-blue-600">(Required)</span>
                  ) : (
                    ''
                  )}
                </div>
                <ul className="list-disc ml-6 text-gray-700">
                  {po.options &&
                    po.options.map((opt, oidx) => (
                      <li key={oidx}>
                        {opt.name} (+GHS {opt.additionalCost})
                      </li>
                    ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
