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
    artisanshops: 0,
    requests: 0,
    services: 0,
    users: 0,
    reviews: 0,
    artisanreviews: 0,
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
          fetchItems('services'),
          fetchItems('artisanshops'),
          fetchItems('servicerequests'),
        ];
        if (isSuperAdmin) {
          promises.push(fetchItems('users'));
          promises.push(fetchItems('reviews'));
          promises.push(fetchItems('artisanreviews'));
        }
        const results = await Promise.all(promises);
        setStats({
          products: results[0].data.data.data.length,
          orders: results[1].data.data.data.length,
          orderitems: results[2].data.data.data.length,
          categories: results[3].data.data.data.length,
          stores: results[4].data.data.data.length,
          services: results[5].data.data.data.length,
          artisanshops: results[6].data.data.data.length,
          requests: results[7].data.data.data.length,
          users: isSuperAdmin ? results[8].data.data.data.length : 0,
          reviews: isSuperAdmin ? results[9].data.data.data.length : 0,
          artisanreviews: isSuperAdmin ? results[10].data.data.data.length : 0,
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
      'Product Stores',
      'Services',
      'Artisan Shops',
      'Service Requests',
      ...(isSuperAdmin ? ['Users', 'Reviews', 'Artisan Reviews'] : []),
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
          stats.services,
          stats.artisanshops,
          stats.requests,
          ...(isSuperAdmin
            ? [stats.users, stats.reviews, stats.artisanreviews]
            : []),
        ],
        backgroundColor: [
          '#3b82f6',
          '#10b981',
          '#f59e42',
          '#f43f5e',
          '#6366f1',
          '#559e42',
          '#943f5e',
          '#a366f1',
          ...(isSuperAdmin ? ['#fbbf24', '#8b5cf6', '#cb5cf6'] : []),
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
      'Product Stores',
      'Services',
      'Artisan Shops',
      'Service Requests',
      ...(isSuperAdmin ? ['Users', 'Reviews', 'Artisan Reviews'] : []),
    ],
    datasets: [
      {
        data: [
          stats.products,
          stats.orders,
          stats.orderitems,
          stats.categories,
          stats.stores,
          stats.services,
          stats.artisanshops,
          stats.requests,
          ...(isSuperAdmin
            ? [stats.users, stats.reviews, stats.artisanreviews]
            : []),
        ],
        backgroundColor: [
          '#3b82f6',
          '#10b981',
          '#f59e42',
          '#f43f5e',
          '#6366f1',
          '#559e42',
          '#943f5e',
          '#a366f1',
          ...(isSuperAdmin ? ['#fbbf24', '#8b5cf6', '#cb5cf6'] : []),
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
            <div
              className="bg-white rounded shadow p-6 text-center cursor-pointer hover:bg-indigo-50"
              onClick={() => navigate('/request')}
            >
              <div className="text-2xl font-bold text-indigo-600">
                {stats.requests}
              </div>
              <div className="text-gray-600">Service Requests</div>
            </div>
            <div
              className="bg-white rounded shadow p-6 text-center cursor-pointer hover:bg-indigo-50"
              onClick={() => navigate('/service')}
            >
              <div className="text-2xl font-bold text-indigo-600">
                {stats.services}
              </div>
              <div className="text-gray-600">Artisan Services</div>
            </div>
            <div
              className="bg-white rounded shadow p-6 text-center cursor-pointer hover:bg-indigo-50"
              onClick={() => navigate('/shop')}
            >
              <div className="text-2xl font-bold text-indigo-600">
                {stats.artisanshops}
              </div>
              <div className="text-gray-600">Artisan Shops</div>
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
                <div
                  className="bg-white rounded shadow p-6 text-center cursor-pointer hover:bg-violet-50"
                  onClick={() => navigate('/rating')}
                >
                  <div className="text-2xl font-bold text-violet-600">
                    {stats.artisanreviews}
                  </div>
                  <div className="text-gray-600">Artisan Reviews</div>
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
