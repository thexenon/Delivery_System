import React, { useState } from 'react';
import { user_login } from '../services/user_api';
import { useNavigate } from 'react-router-dom';

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      await user_login({ email, password }).then(async (result) => {
        if (result.status === 200 || result.status === 201) {
          // Save token and user to localStorage
          localStorage.setItem('token', result.data.token);
          localStorage.setItem('user', JSON.stringify(result.data.data.user));
          localStorage.setItem('userRole', result.data.data.user.role);
          localStorage.setItem('userUID', result.data.data.user._id);
          setError('');
          navigate('/dashboard', { replace: true });
        } else {
          setError(result.message || 'Failed to sign in');
        }
      });
    } catch (err) {
      setError(err?.message || 'An error occurred during sign in');
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-blue-300">
      <div className="w-full max-w-md bg-white rounded-xl shadow-lg p-8">
        <h2 className="text-3xl font-bold text-center text-blue-700 mb-6">
          Sign In
        </h2>
        <form className="space-y-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-900"
              placeholder="Enter your email"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password
            </label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-400 focus:outline-none text-gray-900"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 px-6 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold text-lg transition-colors duration-200 disabled:opacity-60"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
          {error && (
            <div className="text-center text-red-600 font-medium mt-2">
              {error}
            </div>
          )}
        </form>
      </div>
    </div>
  );
};

export default SignIn;
