import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { fetchItems, deleteItem } from '../services/user_api';

export default function AdminPage() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    fetchItems('users')
      .then((data) => {
        const allUsers = data.data.data.data;
        const filteredUsers = allUsers.filter(
          (u) => u.id !== currentUser?.id && u._id !== currentUser?.id
        );
        setUsers(filteredUsers);
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load users');
        setLoading(false);
      });
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this user?')) return;
    try {
      const item = users.find((u) => u.id === id || u._id === id);
      await deleteItem('users', item);
      setUsers((prev) => prev.filter((u) => u.id !== id && u._id !== id));
      alert('User deleted successfully.');
    } catch (err) {
      alert('Failed to delete user.');
    }
  };

  const filteredUsers = users.filter((user) => {
    const term = search.toLowerCase();
    const matchesRole = roleFilter ? user.role === roleFilter : true;
    return (
      matchesRole &&
      (user.name?.toLowerCase().includes(term) ||
        user.email?.toLowerCase().includes(term) ||
        user.role?.toLowerCase().includes(term) ||
        user.address?.toLowerCase().includes(term) ||
        user.phone?.toString().toLowerCase().includes(term))
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold text-gray-800">All Users</h1>
          <Link
            to="/add-new/admin"
            className="inline-block px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-lg shadow transition-colors duration-200"
          >
            + Add New
          </Link>
        </div>
        {loading ? (
          <div className="text-center text-lg text-gray-500">
            Loading users...
          </div>
        ) : error ? (
          <div className="text-center text-red-600">{error}</div>
        ) : users.length === 0 ? (
          <div className="text-center text-gray-500">No users found.</div>
        ) : (
          <>
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex gap-2 items-center">
                <label className="font-semibold">Filter by Role:</label>
                <select
                  className="border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  value={roleFilter}
                  onChange={(e) => setRoleFilter(e.target.value)}
                >
                  <option value="">All</option>
                  <option value="admin">Admin</option>
                  <option value="superadmin">Superadmin</option>
                  <option value="creator">Creator</option>
                  <option value="user">User</option>
                  <option value="rider">Rider</option>
                  <option value="merchant">Merchant</option>
                </select>
              </div>
              <input
                type="text"
                className="border border-gray-300 rounded px-4 py-2 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Search users..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="overflow-x-auto rounded-lg shadow bg-white">
              <table
                className="min-w-full w-auto max-w-full divide-y divide-gray-200"
                style={{ minWidth: 1000 }}
              >
                <thead className="bg-gray-100">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Phone
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Email
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Address
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredUsers.map((user) => (
                    <tr
                      key={user.id || user._id}
                      className="hover:bg-gray-50 cursor-pointer"
                      onClick={() =>
                        navigate(`/add-new/editadmin?id=${user.id || user._id}`)
                      }
                    >
                      <td className="px-6 py-4 whitespace-nowrap font-semibold text-gray-800">
                        {user.name}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.role || 'User'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.phone}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.email}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {user.address}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-xs text-gray-400">
                        {user.createdAt
                          ? new Date(user.createdAt).toLocaleString()
                          : ''}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          className="px-3 py-1 bg-red-500 hover:bg-red-600 text-white text-xs rounded shadow"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(user.id || user._id);
                          }}
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
