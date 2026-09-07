import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';

export const LoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!username.trim() || !password.trim()) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);

    try {
      const res = await login(username, password);
      const userRole =
        res?.user?.role ||
        (username.toLowerCase().includes('staff')
          ? 'staff'
          : username.toLowerCase().includes('kitchen')
          ? 'kitchen'
          : 'admin');

      if (userRole === 'staff') {
        navigate('/staff/tables');
      } else if (userRole === 'kitchen') {
        navigate('/staff/kitchen');
      } else {
        navigate('/admin/dashboard');
      }
    } catch (err) {
      console.error(err);
      setError('Invalid email/username or password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <style>{`
        /* Hide browser default password reveal & autofill icons */
        input::-ms-reveal,
        input::-ms-clear,
        input::-webkit-contacts-auto-fill-button,
        input::-webkit-credentials-auto-fill-button {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
          visibility: hidden !important;
          pointer-events: none !important;
        }

        /* Root Page Wrapper - Clean full viewport, no card container */
        .staff-login-page {
          min-height: 100vh;
          min-height: 100dvh;
          width: 100vw;
          background-color: #FFFFFF;
          font-family: 'Plus Jakarta Sans', -apple-system, BlinkMacSystemFont, sans-serif;
          margin: 0;
          padding: 0;
          box-sizing: border-box;
          display: flex;
          flex-direction: column;
          position: relative;
          overflow-x: hidden;
        }

        /* Upper ~35% Warm Brown Hero Section */
        .staff-brown-hero {
          width: 100%;
          height: 38vh;
          min-height: 250px;
          max-height: 340px;
          background-color: #B77D56;
          position: relative;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }

        /* Logo Circle inside Hero */
        .staff-logo-circle {
          width: 110px;
          height: 110px;
          border-radius: 50%;
          overflow: hidden;
          background-color: #000000;
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 8px 24px rgba(0, 0, 0, 0.25);
          border: 2px solid rgba(255, 255, 255, 0.3);
          z-index: 2;
          margin-top: -10px;
        }

        .staff-logo-img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }

        /* Smooth Irregular Organic Wave Transition SVG at Bottom of Hero */
        .staff-hero-wave-svg {
          position: absolute;
          bottom: -1px;
          left: 0;
          width: 100%;
          height: 85px;
          pointer-events: none;
          z-index: 1;
        }

        /* Pure White Form Container (Sits directly on white background) */
        .staff-form-section {
          width: 100%;
          max-width: 440px;
          margin: 0 auto;
          flex: 1;
          padding: 1.25rem 1.75rem calc(2.5rem + env(safe-area-inset-bottom, 0px)) 1.75rem;
          background-color: #FFFFFF;
          display: flex;
          flex-direction: column;
          box-sizing: border-box;
          z-index: 2;
        }

        .staff-login-title {
          font-family: 'Outfit', 'Plus Jakarta Sans', sans-serif;
          font-size: 2.1rem;
          font-weight: 500;
          color: #1A1715;
          margin: 0 0 0.35rem 0;
          letter-spacing: -0.01em;
        }

        .staff-login-subtitle {
          font-size: 0.925rem;
          color: #78716C;
          margin: 0 0 2rem 0;
          line-height: 1.35;
          font-weight: 400;
        }

        .staff-login-form {
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
          width: 100%;
        }

        .staff-field-group {
          display: flex;
          flex-direction: column;
        }

        /* Underline Input - No Box Background, Thin Bottom Border */
        .staff-underline-input {
          width: 100%;
          border: none;
          border-bottom: 1.5px solid #8C7D73;
          padding: 0.6rem 0;
          font-size: 0.95rem;
          color: #1C1917;
          background: transparent;
          outline: none;
          font-family: inherit;
          font-weight: 400;
          transition: border-color 0.2s ease;
          box-sizing: border-box;
        }

        .staff-underline-input::placeholder {
          color: #9C8E84;
          font-size: 0.925rem;
        }

        .staff-underline-input:focus {
          border-bottom-color: #B77D56;
        }

        .password-relative-wrapper {
          position: relative;
          width: 100%;
          display: flex;
          align-items: center;
        }

        .eye-toggle-button {
          position: absolute;
          right: 0;
          top: 50%;
          transform: translateY(-50%);
          background: none;
          border: none;
          color: #78716C;
          cursor: pointer;
          padding: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .eye-toggle-button:hover {
          color: #1C1917;
        }

        /* Full-Width Dark Brown Pill Login Button */
        .staff-submit-btn {
          width: 100%;
          height: 48px;
          background-color: #350505;
          color: #FFFFFF;
          border: none;
          border-radius: 9999px;
          font-size: 1.025rem;
          font-weight: 700;
          cursor: pointer;
          margin-top: 2rem;
          box-shadow: 0 8px 20px rgba(53, 5, 5, 0.28);
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
        }

        .staff-submit-btn:active {
          transform: scale(0.99);
        }

        .staff-alert-badge {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          width: 100%;
          padding: 0.55rem 0.8rem;
          border-radius: 8px;
          font-size: 0.85rem;
          background-color: #FEF2F2;
          border: 1px solid #FEE2E2;
          color: #DC2626;
          margin-bottom: 1rem;
          box-sizing: border-box;
        }
      `}</style>

      <div className="staff-login-page">
        {/* Upper ~35% Warm Brown Hero Section */}
        <div className="staff-brown-hero">
          <div className="staff-logo-circle">
            <img src="/logo.png" alt="T Clock Logo" className="staff-logo-img" />
          </div>

          {/* Smooth Irregular Curved Wave SVG Bottom Edge */}
          <svg
            className="staff-hero-wave-svg"
            viewBox="0 0 500 150"
            preserveAspectRatio="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M 0 35 C 130 90, 230 20, 340 55 C 420 80, 470 105, 500 120 L 500 150 L 0 150 Z"
              fill="#FFFFFF"
            />
          </svg>
        </div>

        {/* Pure White Form Section (No centered card) */}
        <div className="staff-form-section">
          <h1 className="staff-login-title">Welcome back</h1>
          <p className="staff-login-subtitle">Your floor. Your control. Sign in to T Clock.</p>

          {error && (
            <div className="staff-alert-badge">
              <AlertCircle size={16} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="staff-login-form">
            <div className="staff-field-group">
              <input
                type="text"
                className="staff-underline-input"
                placeholder="User Name"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>

            <div className="staff-field-group">
              <div className="password-relative-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  className="staff-underline-input"
                  placeholder="Password"
                  style={{ paddingRight: '2.25rem' }}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button
                  type="button"
                  className="eye-toggle-button"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button type="submit" className="staff-submit-btn" disabled={loading}>
              {loading ? 'Logging in...' : 'Login'}
            </button>

            <div style={{ textAlign: 'center', marginTop: '1.25rem' }}>
              <a
                href="/admin/login"
                style={{
                  fontSize: '0.78rem',
                  color: '#B77D56',
                  textDecoration: 'none',
                  fontWeight: 600,
                }}
              >
                Administrator? Go to Admin Portal →
              </a>
            </div>
          </form>
        </div>
      </div>
    </>
  );
};
