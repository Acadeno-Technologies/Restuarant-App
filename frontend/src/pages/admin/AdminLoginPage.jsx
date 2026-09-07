import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import '../../styles/admin.css';

export const AdminLoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  // If already authenticated as admin, redirect to admin dashboard
  React.useEffect(() => {
    if (user && user.role === 'admin') {
      navigate('/admin/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please enter both User Name and Password.');
      return;
    }

    setLoading(true);

    try {
      const res = await login(username.trim(), password);
      const userRole = res?.user?.role || (username.toLowerCase().includes('staff') ? 'staff' : 'admin');

      if (userRole !== 'admin') {
        setError('Access restricted to Administrators. Please use Staff Login.');
        return;
      }

      navigate('/admin/dashboard', { replace: true });
    } catch (err) {
      console.error('Admin login error:', err);
      setError(
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Invalid Admin credentials. Please check your User Name and Password.'
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth-page-wrapper">
      {/* ── Geometric Dual-Tone Background (Warm Brown Upper + Light Cream Lower) ── */}
      <div className="admin-auth-bg-layer" />

      {/* ── Center Login Card ── */}
      <div className="admin-signup-card">
        {/* Top Logo */}
        <div className="admin-signup-logo-box">
          <img
            src="/logo.png"
            alt="Tea Clock Logo"
            className="admin-signup-logo-img"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = '/cart.png';
            }}
          />
        </div>

        {/* Heading */}
        <h1 className="admin-signup-title" style={{ marginBottom: '75px' }}>
          Welcome back
        </h1>

        {/* Alerts */}
        {error && (
          <div className="admin-auth-alert-error">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {/* Form */}
        <form onSubmit={handleSubmit} className="admin-login-form">
          {/* User Name */}
          <div className="admin-underline-field">
            <input
              type="text"
              placeholder="User Name"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="admin-underline-input"
              autoComplete="username"
              required
            />
          </div>

          {/* Password */}
          <div className="admin-underline-field">
            <div className="admin-input-relative">
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="admin-underline-input"
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="admin-eye-toggle-btn"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex={-1}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? (
                  <EyeOff size={18} strokeWidth={1.8} color="#9CA3AF" />
                ) : (
                  <Eye size={18} strokeWidth={1.8} color="#9CA3AF" />
                )}
              </button>
            </div>
          </div>

          {/* Login Button */}
          <button
            type="submit"
            className="admin-signup-submit-btn"
            disabled={loading}
          >
            {loading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        {/* Bottom Navigation */}
        <div className="admin-signup-footer">
          <span className="admin-footer-text">New here? </span>
          <Link to="/admin/register" className="admin-footer-link">
            Create your account
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminLoginPage;
