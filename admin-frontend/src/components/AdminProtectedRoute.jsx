import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShoppingBag } from 'lucide-react';
import './AdminProtectedRoute.css';

const AdminProtectedRoute = ({ children }) => {
  const { currentUser, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="admin-loading-screen" role="status" aria-label="Verifying manager access">
        <div className="admin-loading-card">
          <div className="admin-loading-badge">
            <ShoppingBag size={24} />
          </div>
          <div className="admin-spinner" />
          <p className="admin-loading-text">Verifying manager access...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || !isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default AdminProtectedRoute;
