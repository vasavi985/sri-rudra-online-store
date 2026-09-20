import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Mail, Lock, Eye, EyeOff, AlertCircle, ArrowRight } from 'lucide-react';
import GoogleIcon from '../components/GoogleIcon';
import sriRudraLogo from '../assets/sri-rudra-logo.png';
import './Auth.css';

const Register = () => {
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isGoogleSubmitting, setIsGoogleSubmitting] = useState(false);

  const { register, loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const redirectPath = location.state?.from?.pathname || '/';

  const validateForm = () => {
    const errs = {};

    if (!fullName.trim()) {
      errs.fullName = 'Please enter your full name.';
    }

    if (!email.trim()) {
      errs.email = 'Please enter your email address.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      errs.email = 'Please enter a valid email address.';
    }

    if (!password) {
      errs.password = 'Please enter a password.';
    } else if (password.length < 6) {
      errs.password = 'Password must be at least 6 characters.';
    }

    if (!confirmPassword) {
      errs.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      errs.confirmPassword = 'Passwords do not match.';
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
      await register(email.trim(), password, fullName.trim());
      const target = redirectPath && !redirectPath.startsWith('/admin') ? redirectPath : '/';
      navigate(target, { replace: true });
    } catch (err) {
      console.error('Registration error:', err);
      const code = err.code || '';

      if (code === 'auth/email-already-in-use') {
        setServerError('An account with this email already exists. Please sign in instead.');
      } else if (code === 'auth/invalid-email') {
        setServerError('Please enter a valid email address.');
      } else if (code === 'auth/weak-password') {
        setServerError('Password is too weak. Please use at least 6 characters.');
      } else {
        setServerError('Unable to create account. Please verify your details.');
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

  return (
    <div className="auth-page">
      <div className="auth-card register-card">
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

        {/* Welcome */}
        <div className="auth-welcome-text">
          <h1 className="auth-title">Create Account</h1>
          <p className="auth-subtitle">Sign up to start ordering fresh groceries</p>
        </div>

        {serverError && (
          <div className="auth-error-banner" role="alert">
            <AlertCircle size={18} className="auth-error-icon" />
            <span>{serverError}</span>
          </div>
        )}

        {/* Form */}
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div className="auth-field">
            <label htmlFor="reg-name" className="auth-label">
              Full Name
            </label>
            <div className="auth-input-wrapper">
              <User size={17} className="auth-input-icon" />
              <input
                id="reg-name"
                type="text"
                placeholder="e.g. Ramesh Kumar"
                className={`auth-input ${errors.fullName ? 'input-error' : ''}`}
                value={fullName}
                onChange={(e) => {
                  setFullName(e.target.value);
                  if (errors.fullName) setErrors((prev) => ({ ...prev, fullName: null }));
                }}
                autoComplete="name"
                disabled={isSubmitting || isGoogleSubmitting}
              />
            </div>
            {errors.fullName && <span className="auth-field-error">{errors.fullName}</span>}
          </div>

          {/* Email */}
          <div className="auth-field">
            <label htmlFor="reg-email" className="auth-label">
              Email Address
            </label>
            <div className="auth-input-wrapper">
              <Mail size={17} className="auth-input-icon" />
              <input
                id="reg-email"
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
            <label htmlFor="reg-password" className="auth-label">
              <span>Password</span>
              <span className="auth-label-hint">Min. 6 characters</span>
            </label>
            <div className="auth-input-wrapper">
              <Lock size={17} className="auth-input-icon" />
              <input
                id="reg-password"
                type={showPassword ? 'text' : 'password'}
                placeholder="Create a password"
                className={`auth-input has-toggle ${errors.password ? 'input-error' : ''}`}
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (errors.password) setErrors((prev) => ({ ...prev, password: null }));
                }}
                autoComplete="new-password"
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

          {/* Confirm Password */}
          <div className="auth-field">
            <label htmlFor="reg-confirm-password" className="auth-label">
              Confirm Password
            </label>
            <div className="auth-input-wrapper">
              <Lock size={17} className="auth-input-icon" />
              <input
                id="reg-confirm-password"
                type={showConfirmPassword ? 'text' : 'password'}
                placeholder="Re-enter your password"
                className={`auth-input has-toggle ${errors.confirmPassword ? 'input-error' : ''}`}
                value={confirmPassword}
                onChange={(e) => {
                  setConfirmPassword(e.target.value);
                  if (errors.confirmPassword) setErrors((prev) => ({ ...prev, confirmPassword: null }));
                }}
                autoComplete="new-password"
                disabled={isSubmitting || isGoogleSubmitting}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                disabled={isSubmitting || isGoogleSubmitting}
              >
                {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            {errors.confirmPassword && (
              <span className="auth-field-error">{errors.confirmPassword}</span>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            className="btn btn-primary btn-block auth-submit-btn"
            disabled={isSubmitting || isGoogleSubmitting}
          >
            {isSubmitting ? (
              <span>Creating account...</span>
            ) : (
              <>
                <span>Create Account</span>
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

        {/* Login Prompt */}
        <div className="auth-footer-prompt">
          <span>Already have an account?</span>
          <Link to="/login" state={location.state} className="auth-link">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Register;
