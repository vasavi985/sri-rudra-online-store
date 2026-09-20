import { useEffect } from 'react';
import { Navigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldAlert, ArrowLeft, LogIn } from 'lucide-react';
import './AdminRoute.css';

const AdminRoute = () => {
  const { currentUser, isAdmin, loading } = useAuth();
  const location = useLocation();

  useEffect(() => {
    if (!loading && currentUser && isAdmin) {
      const adminBaseUrl = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174';
      const targetUrl = `${adminBaseUrl.replace(/\/$/, '')}${location.pathname}${location.search}`;
      window.location.replace(targetUrl);
    }
  }, [loading, currentUser, isAdmin, location]);

  if (loading) {
    return (
      <div className="admin-guard-state">
        <div className="spinner"></div>
        <p>Verifying access...</p>
      </div>
    );
  }

  if (!currentUser) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (!isAdmin) {
    return (
      <div className="admin-access-denied-page">
        <div className="container">
          <div className="admin-access-denied-card">
            <div className="denied-icon-wrap">
              <ShieldAlert size={44} className="denied-icon" />
            </div>
            <span className="denied-badge">ADMIN ACCESS ONLY</span>
            <h1 className="denied-title">Administrator Account Required</h1>
            <p className="denied-desc">
              You are currently signed in as <strong>{currentUser.email || currentUser.displayName || 'Customer'}</strong>.
              This management area is restricted to authorized store managers.
            </p>
            <div className="denied-actions">
              <Link to="/" className="btn btn-primary">
                <ArrowLeft size={16} />
                <span>Return to Store</span>
              </Link>
              <Link to="/login" className="btn btn-outline">
                <LogIn size={16} />
                <span>Sign In with Manager Account</span>
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const adminBaseUrl = import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174';
  const targetUrl = `${adminBaseUrl.replace(/\/$/, '')}${location.pathname}${location.search}`;

  // When admin accesses /admin on the customer frontend, redirect to separate admin frontend (http://localhost:5174)
  return (
    <div className="admin-guard-state">
      <div className="spinner"></div>
      <p>Redirecting to Sri Rudra Admin Portal...</p>
      <a
        href={targetUrl}
        style={{ marginTop: '0.5rem', color: '#6B222B', fontWeight: 600, textDecoration: 'underline' }}
      >
        Click here if you are not redirected automatically
      </a>
    </div>
  );
};

export default AdminRoute;
