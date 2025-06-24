import React, { useEffect, useState } from 'react';
import {
  submitUserUpdate,
  userPassword,
  fetchItems,
} from '../services/user_api';

const Settings = () => {
  const [form, setForm] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [pwForm, setPwForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [pwSaving, setPwSaving] = useState(false);
  const [pwMessage, setPwMessage] = useState('');
  const [userRole, setUserRole] = useState('');

  useEffect(() => {
    const currentUser = JSON.parse(localStorage.getItem('user'));
    if (!currentUser) {
      setForm(null);
      setLoading(false);
      return;
    }
    setUserRole(currentUser.role ? currentUser.role.toUpperCase() : '');
    fetchItems('users')
      .then((data) => {
        const users = data.data.data.data;
        const user = users.find(
          (u) => u.id === currentUser.id || u._id === currentUser.id
        );
        if (user) {
          setForm({
            name: user.name || '',
            email: user.email || '',
            phone: user.phone || '',
          });
        }
        setLoading(false);
      })
      .catch(() => {
        setForm(null);
        setLoading(false);
      });
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const result = await submitUserUpdate(form);
      if (result.status === 200) {
        setMessage('Profile updated!');
      } else {
        setMessage(result?.data?.message || 'Failed to update profile');
      }
    } catch (err) {
      setMessage('An error occurred.');
    }
    setSaving(false);
  };

  const handlePwChange = (e) => {
    const { name, value } = e.target;
    setPwForm({ ...pwForm, [name]: value });
  };

  const handlePwSubmit = async (e) => {
    e.preventDefault();
    setPwSaving(true);
    setPwMessage('');
    try {
      const currentUser = JSON.parse(localStorage.getItem('user'));
      const passbody = JSON.stringify({
        passwordCurrent: pwForm.oldPassword,
        password: pwForm.newPassword,
        passwordConfirm: pwForm.confirmPassword,
      });
      await userPassword(passbody).then((result) => {
        if (result.status === 200) {
          setPwMessage('Password updated! Logging out...');
          setPwForm({ oldPassword: '', newPassword: '', confirmPassword: '' });
          setTimeout(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            document.cookie =
              'jwt=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
            window.location.href = '/';
          }, 1200);
        } else {
          setPwMessage(result?.data?.message || 'Failed to update password');
        }
      });
    } catch {
      setPwMessage('An error occurred.');
    }
    setPwSaving(false);
  };

  if (loading) return <div className="p-8 text-center">Loading...</div>;
  if (!form)
    return (
      <div className="p-8 text-center text-red-600">
        Failed to load user info.
      </div>
    );

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded shadow">
      {userRole && (
        <div className="text-center mb-2">
          <span className="font-bold text-lg text-blue-700">{userRole}</span>
        </div>
      )}
      <h1 className="text-2xl font-bold mb-4">Settings</h1>
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
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={saving}
        >
          {saving ? 'Updating...' : 'Update'}
        </button>
        {message && (
          <div className="mt-2 text-center text-sm text-blue-700">
            {message}
          </div>
        )}
      </form>
      <hr className="my-8" />
      <h2 className="text-xl font-bold mb-4">Change Password</h2>
      <form onSubmit={handlePwSubmit} className="space-y-4">
        <div>
          <label className="block font-medium">Old Password</label>
          <input
            name="oldPassword"
            type="password"
            value={pwForm.oldPassword}
            onChange={handlePwChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-medium">New Password</label>
          <input
            name="newPassword"
            type="password"
            value={pwForm.newPassword}
            onChange={handlePwChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-medium">Confirm New Password</label>
          <input
            name="confirmPassword"
            type="password"
            value={pwForm.confirmPassword}
            onChange={handlePwChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={pwSaving}
        >
          {pwSaving ? 'Updating...' : 'Update Password'}
        </button>
        {pwMessage && (
          <div className="mt-2 text-center text-sm text-blue-700">
            {pwMessage}
          </div>
        )}
      </form>
    </div>
  );
};

export default Settings;
