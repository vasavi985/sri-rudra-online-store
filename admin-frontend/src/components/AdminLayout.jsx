import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import {
  LayoutDashboard,
  Package,
  FolderTree,
  ShoppingBag,
  Boxes,
  LogOut,
  Menu,
  X,
  UserCheck,
} from 'lucide-react';
import sriRudraLogo from '../assets/sri-rudra-logo.png';
import './AdminLayout.css';

const AdminLayout = () => {
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login', { replace: true });
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const closeMobileNav = () => {
    setMobileNavOpen(false);
  };

  const getAdminDisplayName = () => {
    if (!currentUser) return 'Store Manager';
    if (currentUser.displayName) return currentUser.displayName;
    if (currentUser.email) return currentUser.email.split('@')[0];
    return 'Store Manager';
  };

  return (
    <div className="admin-shell">
      {/* Top Bar for Mobile Navigation & Brand */}
      <header className="admin-mobile-header">
        <button
          type="button"
          className="admin-menu-toggle"
          onClick={() => setMobileNavOpen((prev) => !prev)}
          aria-label={mobileNavOpen ? 'Close navigation' : 'Open navigation'}
        >
          {mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
        </button>

        <div className="admin-mobile-brand">
          <div className="admin-mobile-logo-wrap">
            <img
              src={sriRudraLogo}
              alt="Sri Rudra"
              className="admin-mobile-logo-img"
            />
          </div>
          <div className="admin-mobile-title-wrap">
            <span className="admin-mobile-title">SRI RUDRA</span>
            <span className="admin-brand-badge">ADMIN</span>
          </div>
        </div>

        <button
          type="button"
          className="admin-mobile-logout"
          onClick={handleLogout}
          title="Sign Out"
          aria-label="Sign Out"
        >
          <LogOut size={18} />
        </button>
      </header>

      {/* Main Workspace Layout */}
      <div className="admin-workspace">
        {/* Mobile Backdrop */}
        {mobileNavOpen && (
          <div
            className="admin-nav-backdrop"
            onClick={closeMobileNav}
            aria-hidden="true"
          />
        )}

        {/* Left Sidebar */}
        <aside className={`admin-sidebar ${mobileNavOpen ? 'drawer-open' : ''}`}>
          {/* Desktop Brand Header */}
          <div className="admin-sidebar-header">
            <div className="admin-brand-logo-wrap">
              <img
                src={sriRudraLogo}
                alt="Sri Rudra"
                className="admin-brand-logo-img"
              />
            </div>
            <div className="admin-brand-text">
              <div className="admin-brand-title-row">
                <span className="admin-brand-title">SRI RUDRA</span>
              </div>
              <span className="admin-brand-sub">Munaga Anilkumar Traders</span>
            </div>
          </div>

          {/* Navigation Items */}
          <div className="admin-nav-section">
            <span className="admin-nav-heading">STORE MANAGEMENT</span>
            <nav className="admin-nav-menu" aria-label="Store Admin Navigation">
              <NavLink
                to="/admin/overview"
                className={({ isActive }) =>
                  isActive ? 'admin-nav-item active' : 'admin-nav-item'
                }
                onClick={closeMobileNav}
              >
                <LayoutDashboard size={19} className="nav-icon" />
                <span>Overview</span>
              </NavLink>

              <NavLink
                to="/admin/products"
                className={({ isActive }) =>
                  isActive ? 'admin-nav-item active' : 'admin-nav-item'
                }
                onClick={closeMobileNav}
              >
                <Package size={19} className="nav-icon" />
                <span>Products</span>
              </NavLink>

              <NavLink
                to="/admin/categories"
                className={({ isActive }) =>
                  isActive ? 'admin-nav-item active' : 'admin-nav-item'
                }
                onClick={closeMobileNav}
              >
                <FolderTree size={19} className="nav-icon" />
                <span>Categories</span>
              </NavLink>

              <NavLink
                to="/admin/orders"
                className={({ isActive }) =>
                  isActive ? 'admin-nav-item active' : 'admin-nav-item'
                }
                onClick={closeMobileNav}
              >
                <ShoppingBag size={19} className="nav-icon" />
                <span>Orders</span>
              </NavLink>

              <NavLink
                to="/admin/inventory"
                className={({ isActive }) =>
                  isActive ? 'admin-nav-item active' : 'admin-nav-item'
                }
                onClick={closeMobileNav}
              >
                <Boxes size={19} className="nav-icon" />
                <span>Inventory</span>
              </NavLink>
            </nav>
          </div>

          {/* Sidebar Footer with Profile & Logout */}
          <div className="admin-sidebar-footer">
            <div className="admin-store-info">
              <strong>Munaga Anilkumar Traders</strong>
              <span>S V G Market, Rajahmundry</span>
            </div>

            <div className="admin-user-card" title={currentUser?.email || 'Store Manager'}>
              <div className="admin-user-avatar">
                <UserCheck size={16} />
              </div>
              <div className="admin-user-details">
                <span className="admin-user-name">{getAdminDisplayName()}</span>
                <span className="admin-user-role">Administrator</span>
              </div>
            </div>

            <button
              type="button"
              className="btn-admin-logout"
              onClick={handleLogout}
              title="Sign Out of Store Admin"
            >
              <LogOut size={16} />
              <span>Logout</span>
            </button>
          </div>
        </aside>

        {/* Content Viewport */}
        <main className="admin-viewport">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
