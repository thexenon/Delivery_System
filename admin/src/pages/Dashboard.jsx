import React, { useEffect, useState } from 'react';
import { fetchItems } from '../services/user_api';
import { useNavigate } from 'react-router-dom';
import { Bar, Pie, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Tooltip,
  Legend
);

export default function Dashboard() {
  const [stats, setStats] = useState({
    products: 0,
    orders: 0,
    orderitems: 0,
    categories: 0,
    stores: 0,
    users: 0,
    reviews: 0,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const userrole = localStorage.getItem('userrole');
  const isAdmin =
    userrole === 'admin' || userrole === 'superadmin' || userrole === 'creator';
  const isSuperAdmin = userrole === 'superadmin' || userrole === 'creator';

  const navigate = useNavigate();

  useEffect(() => {
    if (!isAdmin) return;
    async function fetchStats() {
      setLoading(true);
      setError(null);
      try {
        const promises = [
          fetchItems('products'),
          fetchItems('orders'),
          fetchItems('orderitems'),
          fetchItems('categories'),
          fetchItems('stores'),
        ];
        if (isSuperAdmin) {
          promises.push(fetchItems('users'));
          promises.push(fetchItems('reviews'));
        }
        const results = await Promise.all(promises);
        setStats({
          products: results[0].data.data.data.length,
          orders: results[1].data.data.data.length,
          orderitems: results[2].data.data.data.length,
          categories: results[3].data.data.data.length,
          stores: results[4].data.data.data.length,
          users: isSuperAdmin ? results[5].data.data.data.length : 0,
          reviews: isSuperAdmin ? results[6].data.data.data.length : 0,
        });
      } catch (err) {
        setError('Failed to fetch dashboard statistics');
      }
      setLoading(false);
    }
    fetchStats();
  }, [isAdmin, isSuperAdmin]);

  if (!isAdmin) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-2xl text-gray-500">
          You do not have access to this dashboard.
        </div>
      </div>
    );
  }

  const barData = {
    labels: [
      'Products',
      'Orders',
      'Order Items',
      'Categories',
      'Stores',
      ...(isSuperAdmin ? ['Users', 'Reviews'] : []),
    ],
    datasets: [
      {
        label: 'Count',
        data: [
          stats.products,
          stats.orders,
          stats.orderitems,
          stats.categories,
          stats.stores,
          ...(isSuperAdmin ? [stats.users, stats.reviews] : []),
        ],
        backgroundColor: [
          '#3b82f6',
          '#10b981',
          '#f59e42',
          '#f43f5e',
          '#6366f1',
          ...(isSuperAdmin ? ['#fbbf24', '#8b5cf6'] : []),
        ],
      },
    ],
  };
  const pieData = {
    labels: [
      'Products',
      'Orders',
      'Order Items',
      'Categories',
      'Stores',
      ...(isSuperAdmin ? ['Users', 'Reviews'] : []),
    ],
    datasets: [
      {
        data: [
          stats.products,
          stats.orders,
          stats.orderitems,
          stats.categories,
          stats.stores,
          ...(isSuperAdmin ? [stats.users, stats.reviews] : []),
        ],
        backgroundColor: [
          '#3b82f6',
          '#10b981',
          '#f59e42',
          '#f43f5e',
          '#6366f1',
          ...(isSuperAdmin ? ['#fbbf24', '#8b5cf6'] : []),
        ],
      },
    ],
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-8">
        Dashboard Analytics
      </h1>
      {loading ? (
        <div className="flex justify-center items-center h-40">
          <span className="loading loading-spinner loading-lg"></span>
        </div>
      ) : error ? (
        <div className="text-red-500 text-center">{error}</div>
      ) : (
        <>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-10">
            <div
              className="bg-white rounded shadow p-6 text-center cursor-pointer hover:bg-blue-50"
              onClick={() => navigate('/product')}
            >
              <div className="text-2xl font-bold text-blue-600">
                {stats.products}
              </div>
              <div className="text-gray-600">Products</div>
            </div>
            <div
              className="bg-white rounded shadow p-6 text-center cursor-pointer hover:bg-green-50"
              onClick={() => navigate('/order')}
            >
              <div className="text-2xl font-bold text-green-600">
                {stats.orders}
              </div>
              <div className="text-gray-600">Orders</div>
            </div>
            <div
              className="bg-white rounded shadow p-6 text-center cursor-pointer hover:bg-yellow-50"
              onClick={() => navigate('/orderitem')}
            >
              <div className="text-2xl font-bold text-yellow-600">
                {stats.orderitems}
              </div>
              <div className="text-gray-600">Order Items</div>
            </div>
            <div
              className="bg-white rounded shadow p-6 text-center cursor-pointer hover:bg-pink-50"
              onClick={() => navigate('/category')}
            >
              <div className="text-2xl font-bold text-pink-600">
                {stats.categories}
              </div>
              <div className="text-gray-600">Categories</div>
            </div>
            <div
              className="bg-white rounded shadow p-6 text-center cursor-pointer hover:bg-indigo-50"
              onClick={() => navigate('/store')}
            >
              <div className="text-2xl font-bold text-indigo-600">
                {stats.stores}
              </div>
              <div className="text-gray-600">Stores</div>
            </div>
            {isSuperAdmin && (
              <>
                <div
                  className="bg-white rounded shadow p-6 text-center cursor-pointer hover:bg-amber-50"
                  onClick={() => navigate('/admin')}
                >
                  <div className="text-2xl font-bold text-amber-600">
                    {stats.users}
                  </div>
                  <div className="text-gray-600">Users</div>
                </div>
                <div
                  className="bg-white rounded shadow p-6 text-center cursor-pointer hover:bg-violet-50"
                  onClick={() => navigate('/review')}
                >
                  <div className="text-2xl font-bold text-violet-600">
                    {stats.reviews}
                  </div>
                  <div className="text-gray-600">Reviews</div>
                </div>
              </>
            )}
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div className="bg-white rounded shadow p-6">
              <h2 className="text-xl font-semibold mb-4">Overview Bar Chart</h2>
              <Bar
                data={barData}
                options={{
                  responsive: true,
                  plugins: { legend: { display: false } },
                }}
              />
            </div>
            <div className="bg-white rounded shadow p-6">
              <h2 className="text-xl font-semibold mb-4">
                Distribution Pie Chart
              </h2>
              <Pie data={pieData} options={{ responsive: true }} />
            </div>
          </div>
        </>
      )}
    </div>
  );
}
