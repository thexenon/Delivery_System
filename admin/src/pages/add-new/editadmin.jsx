import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { fetchItems, submitUpdate } from '../../services/user_api';

export default function EditAdmin() {
  const location = useLocation();
  const navigate = useNavigate();
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const userId = params.get('id');
    if (!userId) {
      setError('No user selected');
      setLoading(false);
      return;
    }
    fetchItems('users')
      .then((data) => {
        const users = data.data.data.data;
        const user = users.find(
          (u) =>
            String(u.id) === String(userId) || String(u._id) === String(userId)
        );
        if (user) {
          setForm({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
            address: user.address || '',
            description: user.description || '',
            role: user.role || '',
          });
        } else {
          setError('User not found');
        }
        setLoading(false);
      })
      .catch(() => {
        setError('Failed to load user');
        setLoading(false);
      });
  }, [location.search]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const result = await submitUpdate(
        form,
        `users/${new URLSearchParams(location.search).get('id')}`
      );
      if (result.status === 200) {
        setMessage('User updated successfully!');
        setTimeout(() => navigate(-1), 1200);
      } else {
        setMessage(result?.data?.message || 'Failed to update user');
      }
    } catch (err) {
      setMessage('An error occurred.');
    }
    setSaving(false);
  };

  if (loading) return <div className="text-center p-8">Loading...</div>;
  if (error) return <div className="text-center text-red-600 p-8">{error}</div>;
  if (!form) return null;

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Edit User</h2>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Name</label>
          <input
            name="name"
            value={form.name}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-medium">Email</label>
          <input
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-medium">Phone</label>
          <input
            name="phone"
            type="tel"
            value={form.phone}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-medium">Address</label>
          <input
            name="address"
            type="text"
            value={form.address}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-medium">Role</label>
          <select
            name="role"
            value={form.role}
            onChange={handleChange}
            className="w-full border rounded px-3 py-2"
          >
            <option value="user">User</option>
            <option value="rider">Rider</option>
            <option value="merchant">Merchant</option>
            <option value="artisan">Artisan</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={saving}
        >
          {saving ? 'Updating...' : 'Update User'}
        </button>
        {message && (
          <div className="mt-2 text-center text-sm text-blue-700">
            {message}
          </div>
        )}
      </form>
    </div>
  );
}
