import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getMyOrders } from '../services/orderService';
import {
  Clock,
  CheckCircle2,
  Truck,
  PackageCheck,
  XCircle,
  MapPin,
  RefreshCw,
  ShoppingBag,
  AlertCircle,
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import './MyOrders.css';

const MyOrders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadOrders = async () => {
    setLoading(true);
    setError('');
    try {
      const data = await getMyOrders();
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to fetch my orders:', err);
      setError('Unable to load your orders. Please check your internet connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    getMyOrders()
      .then((data) => {
        if (isMounted) {
          setOrders(Array.isArray(data) ? data : []);
          setError('');
        }
      })
      .catch((err) => {
        console.error('Failed to fetch my orders:', err);
        if (isMounted) setError('Unable to load your orders. Please check your internet connection.');
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

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getStepProgress = (status) => {
    const s = String(status || 'CREATED').toUpperCase();
    if (s === 'CANCELLED') return -1;
    if (s === 'DELIVERED') return 4;
    if (s === 'SHIPPED' || s === 'DISPATCHED') return 3;
    if (s === 'CONFIRMED' || s === 'PROCESSING' || s === 'PACKAGING') return 2;
    if (s === 'CREATED' || s === 'RECEIVED') return 1;
    return 1; // Default to initial step
  };

  const getStatusBadge = (status) => {
    const s = String(status || 'CREATED').toUpperCase();
    switch (s) {
      case 'DELIVERED':
        return <span className="status-badge status-badge-delivered"><CheckCircle2 size={13} /> Delivered</span>;
      case 'SHIPPED':
      case 'DISPATCHED':
        return <span className="status-badge status-badge-shipped"><Truck size={13} /> Dispatched</span>;
      case 'CONFIRMED':
      case 'PROCESSING':
      case 'PACKAGING':
        return <span className="status-badge status-badge-confirmed"><PackageCheck size={13} /> Packaging</span>;
      case 'CANCELLED':
        return <span className="status-badge status-badge-cancelled"><XCircle size={13} /> Cancelled</span>;
      case 'CREATED':
      case 'RECEIVED':
      default:
        return <span className="status-badge status-badge-pending"><Clock size={13} /> Order Received</span>;
    }
  };

  if (loading) {
    return (
      <div className="my-orders-page">
        <div className="container">
          <div className="orders-state-box">
            <div className="spinner" />
            <p className="state-msg">Retrieving your order history...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="my-orders-page">
      <div className="container">
        {/* Header */}
        <div className="orders-page-header">
          <div>
            <span className="orders-eyebrow">CUSTOMER PORTAL</span>
            <h1 className="orders-page-title">My Orders</h1>
            <p className="orders-page-subtitle">
              Track your authentic grocery deliveries from Munaga Anilkumar Traders, Rajahmundry.
            </p>
          </div>
          <button
            type="button"
            className="btn btn-outline btn-refresh-orders"
            onClick={loadOrders}
          >
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>

        {error && (
          <div className="orders-alert-error" role="alert">
            <AlertCircle size={18} />
            <span>{error}</span>
          </div>
        )}

        {/* Empty State */}
        {orders.length === 0 && !error ? (
          <div className="orders-empty-card">
            <div className="empty-icon-wrap">
              <ShoppingBag size={48} />
            </div>
            <h2 className="empty-title">No Orders Placed Yet</h2>
            <p className="empty-desc">
              You haven't placed any grocery orders with Sri Rudra yet. Explore our fresh collection of flours, pulses, and ravva!
            </p>
            <Link to="/products" className="btn btn-primary">
              <span>Start Shopping</span>
              <ArrowRight size={16} />
            </Link>
          </div>
        ) : (
          <div className="orders-cards-list">
            {orders.map((order) => {
              const currentStatus = order.orderStatus || order.status || 'CREATED';
              const currentStep = getStepProgress(currentStatus);
              const isCancelled = currentStep === -1;
              const address = order.address || {};
              const items = Array.isArray(order.items) ? order.items : [];
              const orderTotal = order.total || order.subtotal || 0;

              return (
                <article key={order.id} className="order-history-card">
                  {/* Order Card Top Bar */}
                  <div className="order-card-header">
                    <div className="order-id-group">
                      <span className="order-id-label">Order #</span>
                      <strong className="order-id-val">{order.id}</strong>
                      {order.createdAt && (
                        <span className="order-date-text">Placed on {formatDate(order.createdAt)}</span>
                      )}
                    </div>
                    <div className="order-badges-group">
                      {getStatusBadge(currentStatus)}
                    </div>
                  </div>

                  {/* Order Progress Tracker */}
                  {!isCancelled && (
                    <div className="order-progress-tracker" aria-label="Delivery progress tracker">
                      <div className={`tracker-step ${currentStep >= 1 ? 'completed' : ''}`}>
                        <div className="step-circle">{currentStep > 1 ? <CheckCircle2 size={14} /> : '1'}</div>
                        <span className="step-label">Received</span>
                      </div>
                      <div className={`tracker-line ${currentStep >= 2 ? 'completed' : ''}`} />
                      <div className={`tracker-step ${currentStep >= 2 ? 'completed' : ''}`}>
                        <div className="step-circle">{currentStep > 2 ? <CheckCircle2 size={14} /> : '2'}</div>
                        <span className="step-label">Packaging</span>
                      </div>
                      <div className={`tracker-line ${currentStep >= 3 ? 'completed' : ''}`} />
                      <div className={`tracker-step ${currentStep >= 3 ? 'completed' : ''}`}>
                        <div className="step-circle">{currentStep > 3 ? <CheckCircle2 size={14} /> : '3'}</div>
                        <span className="step-label">Dispatched</span>
                      </div>
                      <div className={`tracker-line ${currentStep >= 4 ? 'completed' : ''}`} />
                      <div className={`tracker-step ${currentStep >= 4 ? 'completed' : ''}`}>
                        <div className="step-circle">{currentStep === 4 ? <CheckCircle2 size={14} /> : '4'}</div>
                        <span className="step-label">Delivered</span>
                      </div>
                    </div>
                  )}

                  {/* Card Content: Items + Delivery Address */}
                  <div className="order-card-body">
                    {/* Items List */}
                    <div className="order-card-items-col">
                      <h3 className="section-mini-heading">Ordered Products ({items.length})</h3>
                      <div className="order-items-scroll">
                        {items.map((item, idx) => (
                          <div key={item.variantId || idx} className="order-item-line">
                            <div className="item-text-info">
                              <span className="item-name">{item.productName}</span>
                              <span className="item-pack-qty">
                                Pack: {item.weight} × {item.quantity}
                              </span>
                            </div>
                            <span className="item-total-price">
                              {formatCurrency(item.subtotal || 0)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Delivery Address & Merchant Info */}
                    <div className="order-card-address-col">
                      <h3 className="section-mini-heading">
                        <MapPin size={15} /> Delivery Address
                      </h3>
                      {address.fullName ? (
                        <div className="address-snippet">
                          <strong>{address.fullName}</strong>
                          <p>{address.addressLine1}</p>
                          {address.addressLine2 && <p>{address.addressLine2}</p>}
                          <p>{address.city}, {address.state} - {address.pincode}</p>
                          <p className="phone-line">Phone: {address.mobileNumber}</p>
                        </div>
                      ) : (
                        <p className="fallback-address">Recorded address on file.</p>
                      )}
                      <div className="order-payment-meta">
                        <div className="payment-meta-line">
                          <span className="meta-label">Payment Method:</span>
                          <strong className="meta-val">
                            {order.paymentMethod === 'ONLINE' ? 'Online Payment' : 'Cash on Delivery'}
                          </strong>
                        </div>
                        <div className="payment-meta-line">
                          <span className="meta-label">Payment Status:</span>
                          <span className="payment-status-pill pending">
                            {order.paymentStatus || 'PENDING'}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Order Card Footer */}
                  <div className="order-card-footer">
                    <div className="footer-merchant-tag">
                      <ShieldCheck size={14} />
                      <span>Munaga Anilkumar Traders • S V G Market, Rajahmundry</span>
                    </div>
                    <div className="footer-total-box">
                      <span className="total-label">Total Amount:</span>
                      <strong className="total-val">{formatCurrency(orderTotal)}</strong>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrders;
