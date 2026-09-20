import { useState, useRef, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import {
  ShoppingCart,
  User,
  Menu,
  X,
  Phone,
  MapPin,
  LogOut,
  Shield,
  Search,
  PackageCheck,
  Sparkles
} from 'lucide-react';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import sriRudraLogo from '../assets/sri-rudra-logo.png';
import './Navbar.css';

const POPULAR_SEARCHES = ['Toor Dal', 'Gram Flour', 'Idli Ravva', 'Puffed Gram Dal', 'Rice Flour', 'Moong Dal'];

const Navbar = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchFocused, setSearchFocused] = useState(false);
  const searchWrapperRef = useRef(null);
  const { totalQuantity } = useCart();
  const { currentUser, isAdmin, loading: authLoading, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Sync search bar text when navigating on /products page with query
  useEffect(() => {
    if (location.pathname === '/products') {
      const q = new URLSearchParams(location.search).get('q') || '';
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setSearchQuery(q);
    }
  }, [location.pathname, location.search]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchWrapperRef.current && !searchWrapperRef.current.contains(event.target)) {
        setSearchFocused(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const toggleMobileMenu = () => {
    setMobileMenuOpen((prev) => !prev);
  };

  const closeMobileMenu = () => {
    setMobileMenuOpen(false);
    setSearchFocused(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      closeMobileMenu();
      navigate('/');
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?q=${encodeURIComponent(searchQuery.trim())}`);
      setSearchFocused(false);
      closeMobileMenu();
    }
  };

  const handleTagClick = (tag) => {
    setSearchQuery(tag);
    navigate(`/products?q=${encodeURIComponent(tag)}`);
    setSearchFocused(false);
    closeMobileMenu();
  };

  const handleClearSearch = () => {
    setSearchQuery('');
  };

  const getFirstName = () => {
    if (!currentUser) return '';
    if (currentUser.displayName) {
      const parts = currentUser.displayName.trim().split(/\s+/);
      if (parts[0]) return parts[0];
    }
    return 'Account';
  };

  return (
    <header className="navbar-wrapper">
      {/* 1. Top Information Bar */}
      <div className="navbar-top-bar">
        <div className="container top-bar-content">
          <div className="top-bar-left">
            <MapPin size={13} className="top-bar-icon" />
            <span>Munaga Anilkumar Traders • S V G Market, Rajahmundry</span>
          </div>
          <div className="top-bar-right">
            <Phone size={13} className="top-bar-icon" />
            <a href="tel:9949406863" className="top-bar-link">9949406863</a>
            <span className="top-bar-separator">|</span>
            <a href="tel:9246650441" className="top-bar-link">9246650441</a>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <nav className="navbar" aria-label="Main Navigation">
        <div className="container navbar-container">
          {/* Authentic Sri Rudra Brand Logo */}
          <Link to="/" className="navbar-brand" onClick={closeMobileMenu} aria-label="Sri Rudra Home">
            <div className="brand-logo-frame">
              <img
                src={sriRudraLogo}
                alt="Sri Rudra Logo"
                className="brand-logo-image"
              />
            </div>
            <div className="brand-titles">
              <span className="brand-title-main">SRI RUDRA</span>
              <span className="brand-title-sub">Munaga Anilkumar Traders</span>
            </div>
          </Link>

          {/* Desktop Navigation: Home | Products | [Search box] | Orders | Cart | Account | Logout */}
          <div className="navbar-main-nav">
            {/* Primary Nav Links */}
            <div className="navbar-links">
              <NavLink
                to="/"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                Home
              </NavLink>
              <NavLink
                to="/products"
                className={({ isActive }) => (isActive ? 'nav-link active' : 'nav-link')}
              >
                Products
              </NavLink>
            </div>

            {/* Integrated Search Bar between Products and Orders */}
            <div className="navbar-search-wrapper" ref={searchWrapperRef}>
              <form className={`navbar-search-form ${searchFocused ? 'focused' : ''}`} onSubmit={handleSearchSubmit} role="search">
                <input
                  type="text"
                  placeholder="Search dals, flours, ravva..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onKeyDown={(e) => {
                    if (e.key === 'Escape') {
                      setSearchFocused(false);
                      e.target.blur();
                    }
                  }}
                  className="navbar-search-input"
                  aria-label="Search dals, flours, ravva"
                />
                {searchQuery && (
                  <button
                    type="button"
                    className="search-clear-btn"
                    onClick={handleClearSearch}
                    aria-label="Clear search text"
                    title="Clear text"
                  >
                    <X size={14} />
                  </button>
                )}
                <button
                  type="submit"
                  className="search-submit-btn"
                  aria-label="Submit search"
                  title="Search"
                >
                  <span className="search-submit-text">Search</span>
                  <Search size={14} className="search-submit-icon" />
                </button>
              </form>

              {/* Quick Suggestions Dropdown */}
              {searchFocused && (
                <div className="search-dropdown-menu">
                  <div className="search-dropdown-header">
                    <Sparkles size={13} className="search-dropdown-icon" />
                    <span>Popular Searches</span>
                  </div>
                  <div className="search-tags-list">
                    {POPULAR_SEARCHES.map((tag) => (
                      <button
                        key={tag}
                        type="button"
                        className="search-tag-chip"
                        onMouseDown={(e) => {
                          e.preventDefault();
                          handleTagClick(tag);
                        }}
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Orders, Cart, Admin & Auth Actions */}
            <div className="navbar-actions">
              {/* Orders Link */}
              <NavLink
                to="/orders"
                className={({ isActive }) => (isActive ? 'action-btn active' : 'action-btn')}
                title="My Orders"
                aria-label="My Orders"
              >
                <PackageCheck size={18} />
                <span className="action-text">Orders</span>
              </NavLink>

              {/* Shopping Cart with Badge */}
              <NavLink
                to="/cart"
                className={({ isActive }) => (isActive ? 'action-btn cart-btn active' : 'action-btn cart-btn')}
                title={`Shopping Cart (${totalQuantity} items)`}
                aria-label={`Shopping Cart, ${totalQuantity} items`}
              >
                <div className="cart-icon-wrapper">
                  <ShoppingCart size={19} />
                  {totalQuantity > 0 && (
                    <span className="cart-count-badge">{totalQuantity}</span>
                  )}
                </div>
                <span className="action-text">Cart</span>
              </NavLink>

              {/* Admin Portal Link if Admin — points to separate Admin Frontend */}
              {isAdmin && (
                <a
                  href={import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174'}
                  className="action-btn admin-badge-btn"
                  title="Store Admin Portal"
                >
                  <Shield size={16} />
                  <span className="action-text">Admin</span>
                </a>
              )}

              {/* Auth Actions */}
              {authLoading ? (
                <div className="navbar-auth-skeleton" aria-hidden="true" />
              ) : currentUser ? (
                <div className="navbar-user-section">
                  <div className="user-pill" title={currentUser.displayName || currentUser.email}>
                    <User size={15} />
                    <span className="user-name">{getFirstName()}</span>
                  </div>
                  <button
                    type="button"
                    className="action-btn logout-action-btn"
                    onClick={handleLogout}
                    title="Sign Out"
                    aria-label="Sign Out"
                  >
                    <LogOut size={16} />
                    <span className="action-text">Logout</span>
                  </button>
                </div>
              ) : (
                <NavLink
                  to="/login"
                  className={({ isActive }) => (isActive ? 'btn btn-primary btn-sm login-nav-btn active' : 'btn btn-primary btn-sm login-nav-btn')}
                  title="Sign In to Sri Rudra"
                >
                  <User size={15} />
                  <span>Login</span>
                </NavLink>
              )}
            </div>
          </div>

          {/* Mobile Right Controls: Cart & Hamburger Toggle */}
          <div className="navbar-mobile-controls">
            <NavLink
              to="/cart"
              className="action-btn mobile-cart-btn"
              title={`Shopping Cart (${totalQuantity} items)`}
              aria-label={`Shopping Cart, ${totalQuantity} items`}
            >
              <div className="cart-icon-wrapper">
                <ShoppingCart size={20} />
                {totalQuantity > 0 && (
                  <span className="cart-count-badge">{totalQuantity}</span>
                )}
              </div>
            </NavLink>
            <button
              type="button"
              className="mobile-hamburger-btn"
              onClick={toggleMobileMenu}
              aria-label="Toggle navigation menu"
              aria-expanded={mobileMenuOpen}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* 3. Mobile Navigation Drawer */}
        {mobileMenuOpen && (
          <div className="mobile-drawer">
            {/* Mobile Search */}
            <form className="mobile-search-form" onSubmit={handleSearchSubmit} role="search">
              <input
                type="text"
                placeholder="Search dals, flours, ravva..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="mobile-search-input"
                aria-label="Search products"
              />
              {searchQuery && (
                <button
                  type="button"
                  className="search-clear-btn"
                  onClick={handleClearSearch}
                  aria-label="Clear search text"
                >
                  <X size={14} />
                </button>
              )}
              <button
                type="submit"
                className="mobile-search-submit-btn"
                aria-label="Submit search"
                title="Search"
              >
                <Search size={15} />
              </button>
            </form>

            <div className="mobile-nav-links">
              <NavLink
                to="/"
                className={({ isActive }) => (isActive ? 'mobile-link active' : 'mobile-link')}
                onClick={closeMobileMenu}
              >
                Home
              </NavLink>
              <NavLink
                to="/products"
                className={({ isActive }) => (isActive ? 'mobile-link active' : 'mobile-link')}
                onClick={closeMobileMenu}
              >
                Products
              </NavLink>
              <NavLink
                to="/orders"
                className={({ isActive }) => (isActive ? 'mobile-link active' : 'mobile-link')}
                onClick={closeMobileMenu}
              >
                <PackageCheck size={18} />
                <span>My Orders</span>
              </NavLink>
              <NavLink
                to="/cart"
                className={({ isActive }) => (isActive ? 'mobile-link active' : 'mobile-link')}
                onClick={closeMobileMenu}
              >
                <div className="mobile-cart-wrap">
                  <ShoppingCart size={18} />
                  {totalQuantity > 0 && (
                    <span className="cart-count-badge mobile-badge">{totalQuantity}</span>
                  )}
                </div>
                <span>Shopping Cart ({totalQuantity})</span>
              </NavLink>

              {isAdmin && (
                <a
                  href={import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174'}
                  className="mobile-link admin-mobile-link"
                  onClick={closeMobileMenu}
                >
                  <Shield size={18} />
                  <span>Admin Portal</span>
                </a>
              )}
            </div>

            {/* Mobile Auth Bar */}
            <div className="mobile-auth-footer">
              {!authLoading && (
                currentUser ? (
                  <div className="mobile-user-row">
                    <div className="mobile-user-info">
                      <User size={16} />
                      <span>{currentUser.displayName || currentUser.email}</span>
                    </div>
                    <button
                      type="button"
                      className="btn btn-outline btn-sm mobile-logout-btn"
                      onClick={handleLogout}
                    >
                      <LogOut size={15} />
                      <span>Logout</span>
                    </button>
                  </div>
                ) : (
                  <NavLink
                    to="/login"
                    className="btn btn-primary btn-sm mobile-login-cta"
                    onClick={closeMobileMenu}
                  >
                    <User size={16} />
                    <span>Customer Login</span>
                  </NavLink>
                )
              )}
            </div>
          </div>
        )}
      </nav>
    </header>
  );
};

export default Navbar;
