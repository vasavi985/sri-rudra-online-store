import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getAdminStats, getAdminOrders, getAdminProducts } from '../../services/adminService';
import {
  ShoppingBag,
  Clock,
  Package,
  AlertTriangle,
  ArrowRight,
  RefreshCw,
  PlusCircle,
  Phone,
  CheckCircle2
} from 'lucide-react';
import './AdminOverview.css';

const AdminOverview = () => {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [lowStockProducts, setLowStockProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadDashboardData = async () => {
    setLoading(true);
    setError('');
    try {
      const [statsData, ordersData, productsData] = await Promise.all([
        getAdminStats(),
        getAdminOrders('ALL'),
        getAdminProducts(),
      ]);

      setStats(statsData);
      setRecentOrders(Array.isArray(ordersData) ? ordersData.slice(0, 5) : []);

      // Extract low stock items from products
      const lowStockList = [];
      if (Array.isArray(productsData)) {
        productsData.forEach((p) => {
          if (p.variants) {
            p.variants.forEach((v) => {
              if (v.active !== false && v.stock != null && v.stock <= 5) {
                lowStockList.push({
                  productId: p.id,
                  productName: p.name,
                  packSize: v.weight,
                  stock: v.stock,
                  price: v.price,
                });
              }
            });
          }
        });
      }
      setLowStockProducts(lowStockList.slice(0, 6));
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
      setError('Unable to load dashboard data. Please verify your connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    Promise.all([
      getAdminStats(),
      getAdminOrders('ALL'),
      getAdminProducts(),
    ])
      .then(([statsData, ordersData, productsData]) => {
        if (!isMounted) return;
        setStats(statsData);
        setRecentOrders(Array.isArray(ordersData) ? ordersData.slice(0, 5) : []);

        const lowStockList = [];
        if (Array.isArray(productsData)) {
          productsData.forEach((p) => {
            if (p.variants) {
              p.variants.forEach((v) => {
                if (v.active !== false && v.stock != null && v.stock <= 5) {
                  lowStockList.push({
                    productId: p.id,
                    productName: p.name,
                    packSize: v.weight,
                    stock: v.stock,
                    price: v.price,
                  });
                }
              });
            }
          });
        }
        setLowStockProducts(lowStockList.slice(0, 6));
        setError('');
      })
      .catch((err) => {
        console.error('Failed to load dashboard data:', err);
        if (isMounted) setError('Unable to load dashboard data. Please verify your connection.');
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
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const getStatusBadge = (status) => {
    const s = String(status || 'CREATED').toUpperCase();
    switch (s) {
      case 'DELIVERED':
        return <span className="status-tag status-delivered">Delivered</span>;
      case 'SHIPPED':
      case 'DISPATCHED':
        return <span className="status-tag status-shipped">Shipped</span>;
      case 'CONFIRMED':
        return <span className="status-tag status-confirmed">Confirmed</span>;
      case 'PROCESSING':
      case 'PACKAGING':
        return <span className="status-tag status-processing">Packaging</span>;
      case 'CANCELLED':
        return <span className="status-tag status-cancelled">Cancelled</span>;
      case 'CREATED':
      case 'RECEIVED':
      default:
        return <span className="status-tag status-pending">New / Pending</span>;
    }
  };

  if (loading) {
    return (
      <div className="admin-loading-container">
        <div className="spinner"></div>
        <p>Loading dashboard...</p>
      </div>
    );
  }

  return (
    <div className="admin-dashboard-page">
      {/* Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Store Dashboard</h1>
          <p className="admin-page-subtitle">
            Welcome back! Here is an overview of your orders and grocery catalog.
          </p>
        </div>
        <div className="header-actions">
          <button
            type="button"
            className="btn btn-outline"
            onClick={loadDashboardData}
            title="Refresh Data"
          >
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
          <Link to="/admin/products" className="btn btn-primary">
            <PlusCircle size={16} />
            <span>Add Product</span>
          </Link>
        </div>
      </div>

      {error && (
        <div className="admin-alert-error" role="alert">
          <AlertTriangle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* 4 Focused KPI Cards */}
      <div className="overview-kpi-grid">
        {/* 1. Products */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Active Products</span>
            <div className="kpi-icon-wrap icon-maroon">
              <Package size={22} />
            </div>
          </div>
          <div className="kpi-value">{stats?.activeProducts ?? stats?.totalProducts ?? 0}</div>
          <span className="kpi-detail">
            {stats?.totalProducts ?? 0} total items in catalog
          </span>
        </div>

        {/* 2. Total Orders */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Total Orders</span>
            <div className="kpi-icon-wrap icon-gold">
              <ShoppingBag size={22} />
            </div>
          </div>
          <div className="kpi-value">{stats?.totalOrders ?? recentOrders.length}</div>
          <span className="kpi-detail">Recorded customer orders</span>
        </div>

        {/* 3. Pending Orders */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Pending Orders</span>
            <div className="kpi-icon-wrap icon-amber">
              <Clock size={22} />
            </div>
          </div>
          <div className="kpi-value highlight-amber">
            {stats?.pendingOrders ?? 0}
          </div>
          <span className="kpi-detail">Awaiting delivery confirmation</span>
        </div>

        {/* 4. Low Stock */}
        <div className="kpi-card">
          <div className="kpi-header">
            <span className="kpi-label">Low Stock</span>
            <div className="kpi-icon-wrap icon-red">
              <AlertTriangle size={22} />
            </div>
          </div>
          <div className="kpi-value highlight-red">
            {stats?.lowStockCount ?? lowStockProducts.length}
          </div>
          <span className="kpi-detail">Items with 5 or fewer units</span>
        </div>
      </div>

      {/* Section 1: Recent Orders */}
      <div className="admin-card-section">
        <div className="section-header-bar">
          <div>
            <h2 className="section-title">Recent Orders</h2>
            <p className="section-subtitle">Latest orders placed by customers</p>
          </div>
          <Link to="/admin/orders" className="section-header-link">
            <span>View All Orders</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {recentOrders.length === 0 ? (
          <div className="empty-section-card">
            <ShoppingBag size={36} className="empty-icon" />
            <p>No orders recorded yet.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Order #</th>
                  <th>Customer</th>
                  <th>Contact</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {recentOrders.map((ord) => (
                  <tr key={ord.id}>
                    <td>
                      <strong className="order-id-label">{ord.id}</strong>
                    </td>
                    <td>{ord.address?.fullName || 'Customer'}</td>
                    <td>
                      {ord.address?.mobileNumber ? (
                        <span className="customer-phone-tag">
                          <Phone size={12} /> {ord.address.mobileNumber}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>{ord.items?.length || 0} items</td>
                    <td>
                      <strong>{formatCurrency(ord.total || ord.subtotal)}</strong>
                    </td>
                    <td>{getStatusBadge(ord.orderStatus)}</td>
                    <td>
                      <Link to="/admin/orders" className="btn btn-sm btn-outline">
                        Manage
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Section 2: Low Stock Products */}
      <div className="admin-card-section">
        <div className="section-header-bar">
          <div>
            <h2 className="section-title">Low Stock Products</h2>
            <p className="section-subtitle">Items that may need inventory replenishment soon</p>
          </div>
          <Link to="/admin/products" className="section-header-link">
            <span>View All Products</span>
            <ArrowRight size={15} />
          </Link>
        </div>

        {lowStockProducts.length === 0 ? (
          <div className="empty-section-card success-empty">
            <CheckCircle2 size={32} className="success-icon" />
            <p>All product variants have sufficient inventory levels.</p>
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-data-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>Pack Size</th>
                  <th>Selling Price</th>
                  <th>Stock Remaining</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {lowStockProducts.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <strong>{item.productName}</strong>
                    </td>
                    <td>
                      <span className="pack-tag">{item.packSize}</span>
                    </td>
                    <td>
                      {item.price != null && item.price > 0 ? (
                        formatCurrency(item.price)
                      ) : (
                        <span className="price-pending-tag">Price not set</span>
                      )}
                    </td>
                    <td>
                      <span className={`stock-badge ${item.stock <= 2 ? 'stock-critical' : 'stock-low'}`}>
                        {item.stock} units remaining
                      </span>
                    </td>
                    <td>
                      <Link to="/admin/products" className="btn btn-sm btn-outline">
                        Update Stock
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOverview;
