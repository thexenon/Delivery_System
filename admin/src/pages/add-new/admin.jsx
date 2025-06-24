import React, { useState } from 'react';
import { user_signup } from '../../services/user_api';

const initialState = {
  name: '',
  email: '',
  phone: '',
  password: '',
  passwordConfirm: '',
};

export default function AddAdmin() {
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [passwordError, setPasswordError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
    if (name === 'password' || name === 'passwordConfirm') {
      if (
        (name === 'password' && value !== form.passwordConfirm) ||
        (name === 'passwordConfirm' && value !== form.password)
      ) {
        setPasswordError('Passwords do not match');
      } else {
        setPasswordError('');
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    if (form.password !== form.passwordConfirm) {
      setPasswordError('Passwords do not match');
      setLoading(false);
      return;
    }
    setPasswordError('');
    try {
      //   const { passwordConfirm, ...submitData } = form;
      const result = await user_signup(form);
      if (result.status === 201 || result.status === 200) {
        setMessage('User added successfully!');
        setForm(initialState);
      } else {
        setMessage(result?.data?.message || 'Failed to add user');
      }
    } catch (err) {
      setMessage('An error occurred.');
    }
    setLoading(false);
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded shadow">
      <h2 className="text-2xl font-bold mb-4">Add New User</h2>
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
          <label className="block font-medium">Password</label>
          <input
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
        </div>
        <div>
          <label className="block font-medium">Confirm Password</label>
          <input
            name="passwordConfirm"
            type="password"
            value={form.passwordConfirm}
            onChange={handleChange}
            required
            className="w-full border rounded px-3 py-2"
          />
          {passwordError && (
            <div className="text-red-600 text-sm mt-1">{passwordError}</div>
          )}
        </div>
        <div className="text-sm text-gray-600 mb-2">
          Note: Password must be at least 8 characters long.
        </div>
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded"
          disabled={loading}
        >
          {loading ? 'Adding...' : 'Add User'}
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
