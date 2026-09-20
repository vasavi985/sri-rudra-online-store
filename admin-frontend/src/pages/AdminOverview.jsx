import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Package,
  FolderTree,
  ShoppingBag,
  AlertTriangle,
  ArrowRight,
  TrendingUp,
  Clock,
  CheckCircle,
  PlusCircle,
  RefreshCw,
  Boxes,
} from 'lucide-react';
import adminService from '../services/adminService';
import './AdminOverview.css';

const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchDashboardData = () => {
    setLoading(true);
    setError('');

    Promise.all([
      adminService.getDashboardStats(),
      adminService.getAllOrders(),
    ])
      .then(([statsData, ordersData]) => {
        setStats(statsData);
        const sortedOrders = [...(ordersData || [])].sort((a, b) => {
          const timeA = a.createdAt || 0;
          const timeB = b.createdAt || 0;
          return timeB - timeA;
        });
        setRecentOrders(sortedOrders.slice(0, 6));
      })
      .catch((err) => {
        console.error('Error loading dashboard stats:', err);
        setError(err.userFriendlyMessage || 'Unable to load store metrics. Please try again.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    let isMounted = true;

    Promise.all([
      adminService.getDashboardStats(),
      adminService.getAllOrders(),
    ])
      .then(([statsData, ordersData]) => {
        if (!isMounted) return;
        setStats(statsData);
        const sortedOrders = [...(ordersData || [])].sort((a, b) => {
          const timeA = a.createdAt || 0;
          const timeB = b.createdAt || 0;
          return timeB - timeA;
        });
        setRecentOrders(sortedOrders.slice(0, 6));
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error loading dashboard stats:', err);
        setError(err.userFriendlyMessage || 'Unable to load store metrics. Please try again.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(num);
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '—';
    try {
      return new Date(timestamp).toLocaleDateString('en-IN', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return '—';
    }
  };

  const getOrderStatusClass = (status) => {
    const s = String(status || '').toUpperCase();
    switch (s) {
      case 'DELIVERED':
        return 'status-pill status-delivered';
      case 'CONFIRMED':
      case 'PROCESSING':
      case 'PACKAGING':
      case 'SHIPPED':
      case 'DISPATCHED':
        return 'status-pill status-active';
      case 'CANCELLED':
        return 'status-pill status-cancelled';
      case 'CREATED':
      case 'RECEIVED':
      default:
        return 'status-pill status-pending';
    }
  };

  return (
    <div className="admin-page">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Store Overview</h1>
          <p className="admin-page-desc">
            Operational snapshot and key metrics for Munaga Anilkumar Traders
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="btn-admin-action btn-refresh"
            onClick={fetchDashboardData}
            disabled={loading}
            title="Refresh metrics"
          >
            <RefreshCw size={15} className={loading ? 'spinning' : ''} />
            <span>Refresh</span>
          </button>

          <Link to="/admin/products?action=add" className="btn-admin-primary">
            <PlusCircle size={16} />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="admin-alert-banner error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={fetchDashboardData} className="btn-retry-inline">
            Retry
          </button>
        </div>
      )}

      {/* Summary KPI Cards Grid */}
      <div className="admin-kpi-grid">
        {/* Total Revenue */}
        <div className="admin-kpi-card highlight">
          <div className="kpi-header">
            <span className="kpi-label">Total Store Revenue</span>
            <div className="kpi-icon-wrap revenue">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="kpi-value">
            {loading ? <span className="kpi-skeleton" /> : error ? '—' : formatCurrency(stats?.totalRevenue)}
          </div>
          <span className="kpi-subtext">Delivered & confirmed customer orders</span>
        </div>

        {/* Total Orders */}
        <div className="admin-kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Total Orders</span>
            <div className="kpi-icon-wrap orders">
              <ShoppingBag size={20} />
            </div>
          </div>
          <div className="kpi-value">
            {loading ? <span className="kpi-skeleton" /> : error ? '—' : (stats?.totalOrders ?? 0)}
          </div>
          <Link to="/admin/orders" className="kpi-link">
            <span>View all orders</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Pending Orders */}
        <div className="admin-kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Pending Orders</span>
            <div className="kpi-icon-wrap pending">
              <Clock size={20} />
            </div>
          </div>
          <div className="kpi-value warning">
            {loading ? <span className="kpi-skeleton" /> : error ? '—' : (stats?.pendingOrders ?? 0)}
          </div>
          <Link to="/admin/orders?status=CREATED" className="kpi-link">
            <span>Review pending</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Total Products */}
        <div className="admin-kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Total Products</span>
            <div className="kpi-icon-wrap products">
              <Package size={20} />
            </div>
          </div>
          <div className="kpi-value">
            {loading ? <span className="kpi-skeleton" /> : error ? '—' : (stats?.totalProducts ?? 0)}
          </div>
          <span className="kpi-subtext">
            {loading ? '...' : error ? '—' : `${stats?.activeProducts ?? 0} currently active`}
          </span>
        </div>

        {/* Categories */}
        <div className="admin-kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Categories</span>
            <div className="kpi-icon-wrap categories">
              <FolderTree size={20} />
            </div>
          </div>
          <div className="kpi-value">
            {loading ? <span className="kpi-skeleton" /> : error ? '—' : (stats?.totalCategories ?? 0)}
          </div>
          <Link to="/admin/categories" className="kpi-link">
            <span>Manage categories</span>
            <ArrowRight size={13} />
          </Link>
        </div>

        {/* Low Stock Items */}
        <div className="admin-kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Low Stock Alerts</span>
            <div className="kpi-icon-wrap alert">
              <AlertTriangle size={20} />
            </div>
          </div>
          <div className={`kpi-value ${!error && (stats?.lowStockCount || 0) > 0 ? 'critical' : ''}`}>
            {loading ? <span className="kpi-skeleton" /> : error ? '—' : (stats?.lowStockCount ?? 0)}
          </div>
          <Link to="/admin/inventory" className="kpi-link">
            <span>Inspect inventory</span>
            <ArrowRight size={13} />
          </Link>
        </div>
      </div>

      {/* Quick Action Navigation Buttons */}
      <div className="admin-quick-actions-bar">
        <span className="quick-actions-title">Quick Actions</span>
        <div className="quick-actions-buttons">
          <Link to="/admin/products" className="btn-quick-action">
            <Package size={16} />
            <span>Manage Products</span>
          </Link>
          <Link to="/admin/categories" className="btn-quick-action">
            <FolderTree size={16} />
            <span>Manage Categories</span>
          </Link>
          <Link to="/admin/orders" className="btn-quick-action">
            <ShoppingBag size={16} />
            <span>Manage Orders</span>
          </Link>
          <Link to="/admin/inventory" className="btn-quick-action">
            <Boxes size={16} />
            <span>Manage Inventory</span>
          </Link>
        </div>
      </div>

      {/* Recent Orders Section */}
      <div className="admin-section-card">
        <div className="section-card-header">
          <div>
            <h2 className="section-title">Recent Orders</h2>
            <p className="section-subtitle">Latest customer purchases placed on the storefront</p>
          </div>
          <Link to="/admin/orders" className="btn-text-link">
            <span>View All Orders</span>
            <ArrowRight size={14} />
          </Link>
        </div>

        <div className="admin-table-container">
          {loading ? (
            <div className="table-loading-wrap">
              <div className="table-spinner" />
              <span>Loading recent orders...</span>
            </div>
          ) : error ? (
            <div className="table-empty-state">
              <AlertTriangle size={36} className="empty-icon text-error" />
              <p className="empty-title">Failed to load recent orders</p>
              <p className="empty-desc">{error}</p>
              <button type="button" onClick={fetchDashboardData} className="btn-admin-action" style={{ marginTop: '0.75rem' }}>
                <RefreshCw size={14} />
                <span>Retry</span>
              </button>
            </div>
          ) : recentOrders.length === 0 ? (
            <div className="table-empty-state">
              <CheckCircle size={36} className="empty-icon" />
              <p className="empty-title">No orders found</p>
              <p className="empty-desc">New customer grocery orders will show up here automatically.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date & Time</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="table-cell-id">
                      <span className="order-id-badge">#{order.id.slice(-6).toUpperCase()}</span>
                    </td>
                    <td>
                      <div className="customer-cell">
                        <span className="customer-name">{order.address?.fullName || 'Customer'}</span>
                        <span className="customer-phone">{order.address?.mobileNumber || '—'}</span>
                      </div>
                    </td>
                    <td className="table-cell-date">{formatDate(order.createdAt)}</td>
                    <td className="table-cell-amount">{formatCurrency(order.total)}</td>
                    <td>
                      <span className="payment-badge">
                        {order.paymentMethod || 'Cash on Delivery'}
                      </span>
                    </td>
                    <td>
                      <span className={getOrderStatusClass(order.orderStatus)}>
                        {order.orderStatus || 'CREATED'}
                      </span>
                    </td>
                    <td className="text-right">
                      <Link
                        to={`/admin/orders?orderId=${order.id}`}
                        className="btn-table-action"
                      >
                        Review
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminOverview;
