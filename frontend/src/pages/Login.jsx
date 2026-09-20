import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { sendPasswordResetEmail } from 'firebase/auth';
import { auth } from '../firebase';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight, ArrowLeft, CheckCircle2 } from 'lucide-react';
import GoogleIcon from '../components/GoogleIcon';
import sriRudraLogo from '../assets/sri-rudra-logo.png';
import './Auth.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  // Forgot Password state
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);
  const [isForgotSubmitting, setIsForgotSubmitting] = useState(false);

  const { login, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/';

  const validateForm = () => {
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

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validateForm()) return;

    setIsSubmitting(true);

    try {
      await login(email.trim(), password);

      // Customer website: all users (including admin) remain on the customer website
      const target = redirectPath && !redirectPath.startsWith('/admin') ? redirectPath : '/';
      navigate(target, { replace: true });
    } catch (err) {
      console.error('Sign in error:', err);
      const code = err.code || '';

      if (
        code === 'auth/invalid-credential' ||
        code === 'auth/user-not-found' ||
        code === 'auth/wrong-password'
      ) {
        setServerError('Incorrect email or password. Please try again.');
      } else if (code === 'auth/invalid-email') {
        setServerError('Please enter a valid email address.');
      } else if (code === 'auth/too-many-requests') {
        setServerError('Too many attempts. Please wait a moment before trying again.');
      } else if (code === 'auth/network-request-failed') {
        setServerError('Network connection issue. Please check your internet connection.');
      } else {
        setServerError('Unable to sign in. Please verify your credentials.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setServerError('');
    setIsGoogleSubmitting(true);

    try {
      await loginWithGoogle();

      // Customer website: all users (including admin) remain on the customer website
      const target = redirectPath && !redirectPath.startsWith('/admin') ? redirectPath : '/';
      navigate(target, { replace: true });
    } catch (err) {
      console.error('Google sign-in error:', err);
      const code = err.code || '';

      if (code === 'auth/popup-closed-by-user') {
        setServerError('Google sign-in was cancelled.');
      } else if (code === 'auth/popup-blocked') {
        setServerError('Sign-in popup was blocked. Please allow popups for this site.');
      } else if (code === 'auth/cancelled-popup-request') {
        // Suppress duplicate popup cancellation
      } else {
        setServerError('Unable to sign in with Google. Please try again.');
      }
    } finally {
      setIsGoogleSubmitting(false);
    }
  };

  const handleSwitchToForgot = () => {
    setIsForgotPassword(true);
    setForgotEmail(email.trim());
    setForgotError('');
    setServerError('');
    setForgotSuccess(false);
  };

  const handleSwitchToLogin = () => {
    setIsForgotPassword(false);
    if (forgotEmail.trim() && !email.trim()) {
      setEmail(forgotEmail.trim());
    }
    setForgotError('');
    setServerError('');
    setForgotSuccess(false);
  };

  const handleForgotSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setForgotError('');

    const trimmedEmail = forgotEmail.trim();

    if (!trimmedEmail) {
      setForgotError('Please enter your email address.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmedEmail)) {
      setForgotError('Please enter a valid email address.');
      return;
    }

    setIsForgotSubmitting(true);

    try {
      await sendPasswordResetEmail(auth, trimmedEmail);
      setForgotSuccess(true);
    } catch (err) {
      console.error('Password reset error:', err);
      const code = err.code || '';

      if (code === 'auth/user-not-found') {
        // SECURITY: Do not reveal whether an email exists in the system
        setForgotSuccess(true);
      } else if (code === 'auth/invalid-email') {
        setForgotError('Please enter a valid email address.');
      } else if (code === 'auth/too-many-requests') {
        setServerError('Too many attempts. Please wait a moment before trying again.');
      } else if (code === 'auth/network-request-failed') {
        setServerError('Network connection issue. Please check your internet connection.');
      } else {
        setServerError("We couldn't send the reset email. Please check the email address and try again.");
      }
    } finally {
      setIsForgotSubmitting(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        {/* Real Sri Rudra Logo */}
        <div className="auth-brand-header">
          <div className="auth-logo-frame">
            <img
              src={sriRudraLogo}
              alt="Sri Rudra Logo"
              className="auth-logo-img"
            />
          </div>
          <h2 className="auth-brand-name">SRI RUDRA</h2>
          <p className="auth-brand-firm">Munaga Anilkumar Traders • Rajahmundry</p>
        </div>

        {isForgotPassword ? (
          <>
            {/* Forgot Password Header */}
            <div className="auth-welcome-text">
              <h1 className="auth-title">Forgot Password?</h1>
              <p className="auth-subtitle">
                Enter your email address and we'll send you a password reset link.
              </p>
            </div>

            {/* Server Error Message */}
            {serverError && (
              <div className="auth-error-banner" role="alert">
                <AlertCircle size={18} className="auth-error-icon" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Success State */}
            {forgotSuccess ? (
              <div>
                <div className="auth-success-banner" role="status">
                  <CheckCircle2 size={18} className="auth-success-icon" />
                  <span>
                    If an account exists with this email address, a password reset link has been sent. Please check your email.
                  </span>
                </div>
                <button
                  type="button"
                  className="btn btn-primary btn-block auth-submit-btn"
                  onClick={handleSwitchToLogin}
                >
                  <ArrowLeft size={16} />
                  <span>Back to Sign In</span>
                </button>
              </div>
            ) : (
              /* Forgot Password Form */
              <form className="auth-form" onSubmit={handleForgotSubmit} noValidate>
                {/* Email */}
                <div className="auth-field">
                  <label htmlFor="forgot-email" className="auth-label">
                    Email Address
                  </label>
                  <div className="auth-input-wrapper">
                    <Mail size={17} className="auth-input-icon" />
                    <input
                      id="forgot-email"
                      type="email"
                      placeholder="name@example.com"
                      className={`auth-input ${forgotError ? 'input-error' : ''}`}
                      value={forgotEmail}
                      onChange={(e) => {
                        setForgotEmail(e.target.value);
                        if (forgotError) setForgotError('');
                        if (serverError) setServerError('');
                      }}
                      autoComplete="email"
                      disabled={isForgotSubmitting}
                    />
                  </div>
                  {forgotError && <span className="auth-field-error">{forgotError}</span>}
                </div>

                {/* Submit Reset Link */}
                <button
                  type="submit"
                  className="btn btn-primary btn-block auth-submit-btn"
                  disabled={isForgotSubmitting}
                >
                  {isForgotSubmitting ? (
                    <span>Sending Reset Link...</span>
                  ) : (
                    <>
                      <span>Send Reset Link</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>

                {/* Back to Sign In link */}
                <div className="auth-footer-prompt">
                  <button
                    type="button"
                    className="auth-back-link"
                    onClick={handleSwitchToLogin}
                    disabled={isForgotSubmitting}
                  >
                    <ArrowLeft size={15} />
                    <span>Back to Sign In</span>
                  </button>
                </div>
              </form>
            )}
          </>
        ) : (
          <>
            {/* Header */}
            <div className="auth-welcome-text">
              <h1 className="auth-title">Welcome Back</h1>
              <p className="auth-subtitle">Sign in to manage your grocery orders</p>
            </div>

            {/* Server Error Message */}
            {serverError && (
              <div className="auth-error-banner" role="alert">
                <AlertCircle size={18} className="auth-error-icon" />
                <span>{serverError}</span>
              </div>
            )}

            {/* Form */}
            <form className="auth-form" onSubmit={handleSubmit} noValidate>
              {/* Email */}
              <div className="auth-field">
                <label htmlFor="login-email" className="auth-label">
                  Email Address
                </label>
                <div className="auth-input-wrapper">
                  <Mail size={17} className="auth-input-icon" />
                  <input
                    id="login-email"
                    type="email"
                    placeholder="name@example.com"
                    className={`auth-input ${errors.email ? 'input-error' : ''}`}
                    value={email}
                    onChange={(e) => {
                      setEmail(e.target.value);
                      if (errors.email) setErrors((prev) => ({ ...prev, email: null }));
                    }}
                    autoComplete="email"
                    disabled={isSubmitting || isGoogleSubmitting}
                  />
                </div>
                {errors.email && <span className="auth-field-error">{errors.email}</span>}
              </div>

              {/* Password */}
              <div className="auth-field">
                <div className="auth-label">
                  <label htmlFor="login-password">Password</label>
                  <button
                    type="button"
                    className="auth-forgot-link"
                    onClick={handleSwitchToForgot}
                  >
                    Forgot Password?
                  </button>
                </div>
                <div className="auth-input-wrapper">
                  <Lock size={17} className="auth-input-icon" />
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter your password"
                    className={`auth-input has-toggle ${errors.password ? 'input-error' : ''}`}
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                    }}
                    autoComplete="current-password"
                    disabled={isSubmitting || isGoogleSubmitting}
                  />
                  <button
                    type="button"
                    className="auth-password-toggle"
                    onClick={() => setShowPassword((prev) => !prev)}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    disabled={isSubmitting || isGoogleSubmitting}
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {errors.password && <span className="auth-field-error">{errors.password}</span>}
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="btn btn-primary btn-block auth-submit-btn"
                disabled={isSubmitting || isGoogleSubmitting}
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

            {/* Divider */}
            <div className="auth-divider" role="separator">
              <span>OR</span>
            </div>

            {/* Google Sign-In */}
            <button
              type="button"
              className="btn-auth-google"
              onClick={handleGoogleSignIn}
              disabled={isSubmitting || isGoogleSubmitting}
              aria-label="Continue with Google"
            >
              <GoogleIcon className="auth-google-icon" />
              <span>{isGoogleSubmitting ? 'Signing in...' : 'Continue with Google'}</span>
            </button>

            {/* Register Prompt */}
            <div className="auth-footer-prompt">
              <span>Don't have an account?</span>
              <Link to="/register" state={location.state} className="auth-link">
                Create Account
              </Link>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Login;
