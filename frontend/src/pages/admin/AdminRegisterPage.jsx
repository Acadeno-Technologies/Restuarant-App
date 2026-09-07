import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { Eye, EyeOff, AlertCircle, CheckCircle2 } from 'lucide-react';
import '../../styles/admin.css';

export const AdminRegisterPage = () => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const { registerAdmin, login } = useAuth();
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!formData.username.trim() || !formData.email.trim() || !formData.password.trim()) {
      setError('Please fill in all fields.');
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return;
    }

    setLoading(true);

    try {
      await registerAdmin({
        username: formData.username.trim(),
        email: formData.email.trim(),
        first_name: formData.username.trim(),
        password: formData.password,
        role: 'admin',
      });

      setSuccess('Account created successfully! Redirecting...');

      setTimeout(async () => {
        try {
          await login(formData.username.trim(), formData.password);
          navigate('/admin/dashboard', { replace: true });
        } catch {
          navigate('/admin/login', { replace: true });
        }
      }, 1000);
    } catch (err) {
      console.error('Admin registration failed:', err);
      const serverErr =
        err.response?.data?.username?.[0] ||
        err.response?.data?.email?.[0] ||
        err.response?.data?.detail ||
        err.response?.data?.error ||
        'Registration failed. Username or email may already be taken.';
      setError(serverErr);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-auth-page-wrapper">
      {/* ── Geometric Dual-Tone Background (Warm Brown Upper + Light Cream Lower with Diagonal Angle) ── */}
      <div className="admin-auth-bg-layer" />

      {/* ── Center Signup Card ── */}
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

        {/* Headings */}
        <h1 className="admin-signup-title">Create Account</h1>
        <p className="admin-signup-subtitle">A Taste of Tradition</p>

        {/* Alerts */}
        {error && (
          <div className="admin-auth-alert-error">
            <AlertCircle size={16} style={{ flexShrink: 0 }} />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="admin-auth-alert-success">
            <CheckCircle2 size={16} style={{ flexShrink: 0 }} />
            <span>{success}</span>
          </div>
        )}

        {/* Underline Form Fields */}
        <form onSubmit={handleSubmit} className="admin-signin-form">
          {/* USER NAME */}
          <div className="admin-underline-field">
            <label className="admin-field-label">USER NAME</label>
            <input
              type="text"
              name="username"
              placeholder="Create Username"
              value={formData.username}
              onChange={handleChange}
              className="admin-underline-input"
              autoComplete="username"
              required
            />
          </div>

          {/* EMAIL */}
          <div className="admin-underline-field">
            <label className="admin-field-label">EMAIL</label>
            <input
              type="email"
              name="email"
              placeholder="Enter your Email"
              value={formData.email}
              onChange={handleChange}
              className="admin-underline-input"
              autoComplete="email"
              required
            />
          </div>

          {/* PASSWORD */}
          <div className="admin-underline-field">
            <label className="admin-field-label">PASSWORD</label>
            <div className="admin-input-relative">
              <input
                type={showPassword ? 'text' : 'password'}
                name="password"
                placeholder="Create Password"
                value={formData.password}
                onChange={handleChange}
                className="admin-underline-input"
                autoComplete="new-password"
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

          {/* Create Account Button */}
          <button
            type="submit"
            className="admin-signup-submit-btn"
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Create Account'}
          </button>
        </form>

        {/* Bottom Navigation */}
        <div className="admin-signup-footer">
          <span className="admin-footer-text">Already have an account? </span>
          <Link to="/admin/login" className="admin-footer-link">
            Login
          </Link>
        </div>
      </div>
    </div>
  );
};

export default AdminRegisterPage;
