import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import axios from 'axios';
import { KeyRound, ShieldCheck, AlertCircle, ArrowRight, ArrowLeft, Lock, CheckCircle2 } from 'lucide-react';
import './AdminSetup.css';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

const AdminSetup = () => {
  const { currentUser, isAdmin, refreshAdminStatus, loginWithGoogle } = useAuth();
  const [setupSecret, setSetupSecret] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const navigate = useNavigate();

  const handleGoogleSignIn = async () => {
    setError('');
    try {
      await loginWithGoogle();
    } catch (err) {
      console.error('Google sign in error:', err);
      setError('Unable to sign in with Google. Please try again.');
    }
  };

  const handleSetup = async (e) => {
    e.preventDefault();
    setError('');

    if (!currentUser) {
      setError('You must be signed in with your Google account or email before claiming admin access.');
      return;
    }

    if (!setupSecret.trim()) {
      setError('Please enter the Admin Setup Secret.');
      return;
    }

    setLoading(true);

    try {
      const idToken = await currentUser.getIdToken();
      const response = await axios.post(
        `${API_BASE_URL}/admin/setup`,
        { setupSecret: setupSecret.trim() },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
            'Content-Type': 'application/json',
          },
        }
      );

      if (response.data?.success) {
        // Force refresh Firebase token to retrieve updated admin custom claims
        await refreshAdminStatus();
        setSuccess(true);
      } else {
        setError(response.data?.message || 'Failed to complete admin setup.');
      }
    } catch (err) {
      console.error('Admin setup error:', err);
      const msg = err.response?.data?.message || 'Admin setup failed. Please verify the setup secret.';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-setup-page">
      <div className="container">
        <div className="admin-setup-card">
          <div className="setup-header">
            <div className="setup-icon-wrap">
              {success ? (
                <CheckCircle2 size={40} className="setup-icon icon-success" />
              ) : (
                <KeyRound size={40} className="setup-icon" />
              )}
            </div>
            <span className="setup-badge">ONE-TIME CONFIGURATION</span>
            <h1 className="setup-title">
              {success ? 'Admin Access Activated' : 'Store Administrator Setup'}
            </h1>
            <p className="setup-subtitle">
              Munaga Anilkumar Traders • Secure Role Provisioning
            </p>
          </div>

          {error && (
            <div className="setup-alert-error" role="alert">
              <AlertCircle size={18} />
              <span>{error}</span>
            </div>
          )}

          {success ? (
            <div className="setup-success-view">
              <div className="success-banner">
                <ShieldCheck size={20} className="success-shield-icon" />
                <div>
                  <strong>Admin Privileges Granted!</strong>
                  <p>
                    Account <strong>{currentUser?.email || currentUser?.displayName}</strong> has been registered with Administrator role in Firebase Auth.
                  </p>
                </div>
              </div>

              <div className="setup-actions">
                <button
                  type="button"
                  className="btn btn-primary btn-block"
                  onClick={() => navigate('/admin/dashboard')}
                >
                  <span>Proceed to Admin Dashboard</span>
                  <ArrowRight size={16} />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Account Status */}
              <div className="setup-account-status">
                {currentUser ? (
                  <div className="signed-in-box">
                    <span className="account-label">Target Account:</span>
                    <strong className="account-value">{currentUser.email || currentUser.displayName}</strong>
                    <span className="account-uid">UID: {currentUser.uid}</span>
                    {isAdmin && (
                      <span className="already-admin-pill">Already Administrator</span>
                    )}
                  </div>
                ) : (
                  <div className="sign-in-prompt-box">
                    <p>
                      Please sign in with the Google account you wish to authorize as the Store Administrator.
                    </p>
                    <button
                      type="button"
                      className="btn btn-outline google-signin-btn"
                      onClick={handleGoogleSignIn}
                    >
                      <span>Sign In with Google</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Setup Secret Form */}
              <form onSubmit={handleSetup} className="setup-form">
                <div className="form-group">
                  <label htmlFor="setupSecret">
                    Admin Setup Secret Passkey: <span className="req-star">*</span>
                  </label>
                  <div className="input-wrap">
                    <Lock size={16} className="input-icon" />
                    <input
                      id="setupSecret"
                      type="password"
                      placeholder="Enter the master setup secret"
                      value={setupSecret}
                      onChange={(e) => setSetupSecret(e.target.value)}
                      disabled={loading || !currentUser}
                      className="form-input"
                      autoComplete="off"
                    />
                  </div>
                  <span className="input-hint">
                    Configured securely on the server via the <code>ADMIN_SETUP_SECRET</code> environment variable.
                  </span>
                </div>

                <div className="setup-btn-group">
                  <button
                    type="submit"
                    className="btn btn-primary btn-block"
                    disabled={loading || !currentUser}
                  >
                    {loading ? (
                      <span>Activating Administrator Access...</span>
                    ) : (
                      <>
                        <ShieldCheck size={18} />
                        <span>Activate Administrator Role</span>
                      </>
                    )}
                  </button>

                  <Link to="/" className="btn btn-outline btn-block">
                    <ArrowLeft size={16} />
                    <span>Cancel and Return to Store</span>
                  </Link>
                </div>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminSetup;
