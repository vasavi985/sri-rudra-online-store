import { useState } from 'react';
import { NavLink, Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Store,
  LogOut,
  Menu,
  X,
  UserCheck
} from 'lucide-react';
import './AdminLayout.css';

const AdminLayout = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const closeMobileNav = () => {
    setMobileNavOpen(false);
  };

  const getUserLabel = () => {
    if (!currentUser) return 'Store Manager';
    if (currentUser.displayName) return currentUser.displayName;
    if (currentUser.email) return currentUser.email.split('@')[0];
    return 'Store Manager';
  };

  return (
    <div className="admin-shell">
      {/* Top Admin Bar */}
      <header className="admin-topbar">
        <div className="admin-topbar-left">
          <button
            type="button"
            className="admin-mobile-toggle"
            onClick={() => setMobileNavOpen((prev) => !prev)}
            aria-label="Toggle navigation menu"
          >
            {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
          </button>

          <Link to="/admin/overview" className="admin-brand-link">
            <span className="admin-brand-name">RUDRA</span>
            <span className="admin-brand-badge">ADMIN</span>
          </Link>
        </div>

        <div className="admin-topbar-right">
          <Link to="/" className="btn-view-storefront" title="View Customer Storefront">
            <Store size={16} />
            <span className="view-store-text">View Store</span>
          </Link>

          <div className="admin-account-pill" title={currentUser?.email || 'Store Manager'}>
            <UserCheck size={15} />
            <span className="admin-account-name">{getUserLabel()}</span>
          </div>

          <button
            type="button"
            className="admin-logout-action"
            onClick={handleLogout}
            title="Log Out of Admin Panel"
          >
            <LogOut size={16} />
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </header>

      {/* Main Admin Workspace with Sidebar */}
      <div className="admin-workspace">
        {/* Backdrop for mobile drawer */}
        {mobileNavOpen && (
          <div
            className="admin-mobile-backdrop"
            onClick={closeMobileNav}
            aria-hidden="true"
          />
        )}

        {/* Sidebar Navigation */}
        <aside className={`admin-sidebar ${mobileNavOpen ? 'mobile-open' : ''}`}>
          <div className="admin-sidebar-section">
            <span className="sidebar-section-title">STORE MANAGEMENT</span>
            <nav className="admin-nav-list" aria-label="Admin Sections">
              <NavLink
                to="/admin/overview"
                className={({ isActive }) =>
                  isActive ? 'admin-nav-link active' : 'admin-nav-link'
                }
                onClick={closeMobileNav}
              >
                <LayoutDashboard size={19} className="nav-icon" />
                <span>Dashboard</span>
              </NavLink>

              <NavLink
                to="/admin/products"
                className={({ isActive }) =>
                  isActive ? 'admin-nav-link active' : 'admin-nav-link'
                }
                onClick={closeMobileNav}
              >
                <Package size={19} className="nav-icon" />
                <span>Products</span>
              </NavLink>

              <NavLink
                to="/admin/categories"
                className={({ isActive }) =>
                  isActive ? 'admin-nav-link active' : 'admin-nav-link'
                }
                onClick={closeMobileNav}
              >
                <FolderTree size={19} className="nav-icon" />
                <span>Categories</span>
              </NavLink>

              <NavLink
                to="/admin/orders"
                className={({ isActive }) =>
                  isActive ? 'admin-nav-link active' : 'admin-nav-link'
                }
                onClick={closeMobileNav}
              >
                <ShoppingBag size={19} className="nav-icon" />
                <span>Orders</span>
              </NavLink>
            </nav>
          </div>

          <div className="admin-sidebar-footer">
            <div className="store-location-info">
              <strong>Munaga Anilkumar Traders</strong>
              <span>S V G Market, Rajahmundry</span>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="admin-main-viewport">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
