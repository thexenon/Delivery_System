import React, { useEffect, useState } from 'react';
import { fetchItems, deleteItem } from '../services/user_api';
import { useNavigate } from 'react-router-dom';

export default function Product() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [search, setSearch] = useState('');
  const navigate = useNavigate();

  const getProducts = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetchItems('products');
      setProducts(res.data.data.data || []);
    } catch (err) {
      setError('Failed to fetch products');
    }
    setLoading(false);
  };

  useEffect(() => {
    getProducts();
  }, []);

  const handleDelete = async (product) => {
    if (!window.confirm('Are you sure you want to delete this product?'))
      return;
    try {
      await deleteItem('products', product);
      setProducts((prev) => prev.filter((p) => p._id !== product._id));
    } catch (err) {
      alert('Failed to delete product');
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex justify-between items-center mb-8 gap-4 flex-wrap">
          <h1 className="text-3xl font-bold text-gray-800">All Products</h1>
          <input
            type="text"
            className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            placeholder="Search products..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <button
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2 rounded-lg font-semibold shadow"
            onClick={() => navigate('/add-new/product')}
          >
            + Add New Product
          </button>
        </div>
        {loading ? (
          <div className="flex justify-center items-center h-40">
            <span className="loading loading-spinner loading-lg"></span>
          </div>
        ) : error ? (
          <div className="text-red-500 text-center">{error}</div>
        ) : products.length === 0 ? (
          <div className="text-gray-500 text-center">No products found.</div>
        ) : (
          <div className="overflow-x-auto rounded-lg shadow bg-white">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Store
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Price
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Category
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Stock
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {products
                  .filter(
                    (product) =>
                      search.trim() === '' ||
                      product.name
                        .toLowerCase()
                        .includes(search.toLowerCase()) ||
                      (product.category?.name || '')
                        .toLowerCase()
                        .includes(search.toLowerCase()) ||
                      (product.store?.name || '')
                        .toLowerCase()
                        .includes(search.toLowerCase())
                  )
                  .map((product) => (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td
                        className="px-6 py-4 whitespace-nowrap font-semibold text-gray-800 cursor-pointer hover:underline text-blue-700 flex items-center gap-3"
                        onClick={() =>
                          navigate(`/add-new/product-details?id=${product._id}`)
                        }
                      >
                        {product.images && product.images.length > 0 && (
                          <img
                            src={product.images[0]}
                            alt={product.name}
                            className="w-30 h-10 object-cover rounded border"
                          />
                        )}
                        {product.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.store?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.price}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.category?.name || '-'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {product.stock}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap flex gap-2">
                        <button
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded"
                          onClick={() =>
                            navigate(`/add-new/editproduct?id=${product._id}`)
                          }
                        >
                          Edit
                        </button>
                        <button
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                          onClick={() => handleDelete(product)}
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
