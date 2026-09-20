import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, AlertCircle, CheckCircle2, ArrowRight, ArrowLeft } from 'lucide-react';
import sriRudraLogo from '../assets/sri-rudra-logo.png';
import './AdminLogin.css';

const AdminLogin = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password state
  const [showForgotPassword, setShowForgotPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState('');
  const [resetError, setResetError] = useState('');
  const [resetSuccess, setResetSuccess] = useState('');
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);

  const { login, requestPasswordReset, currentUser, isAdmin, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/admin/overview';

  // If already authenticated as verified admin, automatically redirect to admin overview
  useEffect(() => {
    if (!loading && currentUser && isAdmin) {
      navigate('/admin/overview', { replace: true });
    }
  }, [loading, currentUser, isAdmin, navigate]);

  const validateLoginForm = () => {
    const errs = {};

    if (!email.trim()) {
      errs.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errs.password = 'Please enter your password.';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleLoginSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateLoginForm()) return;

    setIsSubmitting(true);

    try {
      await login(email.trim(), password);
      navigate(redirectPath, { replace: true });
    } catch (err) {
      console.error('Manager sign-in attempt:', err);
      const code = err.code || '';

      if (code === 'auth/unauthorized-admin') {
        setServerError("You don't have permission to access the store administration.");
      } else if (
        code === 'auth/invalid-credential' ||
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password'
      ) {
        setServerError('Incorrect email or password.');
      } else if (code === 'auth/invalid-email') {
        setServerError('Please enter a valid email address.');
      } else if (code === 'auth/too-many-requests') {
        setServerError('Too many attempts. Please try again later.');
      } else if (code === 'auth/network-request-failed') {
        setServerError('Network connection issue. Please check your internet connection.');
      } else {
        setServerError('Unable to sign in. Please verify your credentials and try again.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setResetError('');
    setResetSuccess('');

    if (!resetEmail.trim()) {
      setResetError('Please enter your email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(resetEmail.trim())) {
      setResetError('Please enter a valid email address.');
      return;
    }

    setIsResetSubmitting(true);

    try {
      await requestPasswordReset(resetEmail.trim());
      setResetSuccess('Password reset email sent. Please check your inbox.');
    } catch (err) {
      console.error('Password reset request error:', err);
      const code = err.code || '';

      if (code === 'auth/invalid-email' || code === 'auth/user-not-found') {
        setResetError('Unable to send reset email. Please check the email address.');
      } else if (code === 'auth/too-many-requests') {
        setResetError('Too many attempts. Please try again later.');
      } else if (code === 'auth/network-request-failed') {
        setResetError('Network connection issue. Please check your internet connection.');
      } else {
        setResetError('Unable to send reset email. Please try again.');
      }
    } finally {
      setIsResetSubmitting(false);
    }
  };

  const openForgotPassword = () => {
    setShowForgotPassword(true);
    setResetEmail(email.trim());
    setResetError('');
    setResetSuccess('');
  };

  const closeForgotPassword = () => {
    setShowForgotPassword(false);
    setResetError('');
    setResetSuccess('');
  };

  return (
    <div className="admin-login-page">
      <div className="admin-login-card">
        {/* Brand Header */}
        <div className="admin-brand-emblem" aria-hidden="true">
          <img
            src={sriRudraLogo}
            alt="Sri Rudra"
            className="admin-login-logo-img"
          />
        </div>
        <h2 className="admin-brand-name">SRI RUDRA</h2>
        <p className="admin-brand-merchant">MUNAGA ANILKUMAR TRADERS</p>

        {showForgotPassword ? (
          /* ================= Forgot Password View ================= */
          <div className="admin-view-transition">
            <div className="admin-heading-group">
              <h1 className="admin-login-title">Reset Password</h1>
              <p className="admin-login-subtitle">
                Enter your store email to receive password reset instructions
              </p>
            </div>

            {resetError && (
              <div className="admin-feedback-banner error" role="alert">
                <AlertCircle size={18} className="feedback-icon" />
                <span>{resetError}</span>
              </div>
            )}

            {resetSuccess && (
              <div className="admin-feedback-banner success" role="status">
                <CheckCircle2 size={18} className="feedback-icon" />
                <span>{resetSuccess}</span>
              </div>
            )}

            <form className="admin-login-form" onSubmit={handleResetSubmit} noValidate>
              <div className="admin-form-field">
                <label htmlFor="reset-email" className="admin-form-label">
                  Email Address
                </label>
                <div className="admin-input-wrap">
                  <Mail size={17} className="admin-input-icon" />
                  <input
                    id="reset-email"
                    type="email"
                    placeholder="manager@example.com"
                    className="admin-form-input"
                    value={resetEmail}
                    onChange={(e) => {
                      setResetEmail(e.target.value);
                      if (resetError) setResetError('');
                    }}
                    autoComplete="email"
                    disabled={isResetSubmitting}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-admin-submit"
                disabled={isResetSubmitting}
              >
                {isResetSubmitting ? (
                  <span>Sending instructions...</span>
                ) : (
                  <>
                    <span>Send Reset Link</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>

              <button
                type="button"
                className="btn-admin-back"
                onClick={closeForgotPassword}
                disabled={isResetSubmitting}
              >
                <ArrowLeft size={15} />
                <span>Back to Sign In</span>
              </button>
            </form>
          </div>
        ) : (
          /* ================= Normal Admin Sign In View ================= */
          <div className="admin-view-transition">
            <div className="admin-heading-group">
              <h1 className="admin-login-title">Admin Login</h1>
              <p className="admin-login-subtitle">Sign in to manage your store</p>
            </div>

            {serverError && (
              <div className="admin-feedback-banner error" role="alert">
                <AlertCircle size={18} className="feedback-icon" />
                <span>{serverError}</span>
              </div>
            )}

            <form className="admin-login-form" onSubmit={handleLoginSubmit} noValidate>
              {/* Email Address */}
              <div className="admin-form-field">
                <label htmlFor="admin-email" className="admin-form-label">
                  Email Address
                </label>
                <div className="admin-input-wrap">
                  <Mail size={17} className="admin-input-icon" />
                  <input
                    id="admin-email"
                    type="email"
                    placeholder="manager@example.com"
                    className={`admin-form-input ${errors.email ? 'input-error' : ''}`}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                    }}
                    autoComplete="email"
                    disabled={isSubmitting}
                  />
                </div>
                {errors.email && <span className="admin-field-error">{errors.email}</span>}
              </div>

              {/* Password */}
              <div className="admin-form-field">
                <label htmlFor="admin-password" className="admin-form-label">
                  Password
                </label>
                <div className="admin-input-wrap">
                  <Lock size={17} className="admin-input-icon" />
                  <input
                    id="admin-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className={`admin-form-input has-toggle ${errors.password ? 'input-error' : ''}`}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                    }}
                    autoComplete="current-password"
                    disabled={isSubmitting}
                  />
                  <button
                    type="button"
                    className="admin-password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={isSubmitting}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <span className="admin-field-error">{errors.password}</span>}
              </div>

              {/* Sign In Button */}
              <button
                type="submit"
                className="btn-admin-submit"
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <span>Signing in...</span>
                ) : (
                  <>
                    <span>Sign In</span>
                    <ArrowRight size={16} />
                  </>
                )}
              </button>
            </form>

            {/* Forgot Password Trigger */}
            <div className="admin-forgot-wrap">
              <button
                type="button"
                className="admin-forgot-btn"
                onClick={openForgotPassword}
                disabled={isSubmitting}
              >
                Forgot Password?
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminLogin;
