import { useEffect, useState } from 'react';
import { Link, useParams, useLocation } from 'react-router-dom';
import { getOrderById } from '../services/orderService';
import {
  CheckCircle,
  Package,
  MapPin,
  ArrowRight,
  ShieldCheck,
  ShoppingBag,
  Store
} from 'lucide-react';
import './OrderSuccess.css';

const OrderSuccess = () => {
  const { orderId } = useParams();
  const location = useLocation();

  // If order object was passed through navigation state, use it directly
  const [order, setOrder] = useState(location.state?.order || null);
  const [loading, setLoading] = useState(!location.state?.order);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!order && orderId) {
      let isMounted = true;
      getOrderById(orderId)
        .then((fetchedOrder) => {
          if (isMounted) {
            setOrder(fetchedOrder);
            setLoading(false);
          }
        })
        .catch((err) => {
          console.error('Failed to load order:', err);
          if (isMounted) {
            setError('Unable to load order details.');
            setLoading(false);
          }
        });
      return () => {
        isMounted = false;
      };
    }
  }, [order, orderId]);

  if (loading) {
    return (
      <div className="order-success-page">
        <div className="container success-state-box">
          <div className="spinner" />
          <p className="state-text">Retrieving order confirmation...</p>
        </div>
      </div>
    );
  }

  const address = order?.address;
  const items = order?.items || [];
  const orderTotal = order?.total || order?.subtotal || 0;

  return (
    <div className="order-success-page">
      <div className="container">
        <div className="order-success-card">
          {/* Top Success Emblem */}
          <div className="order-success-header">
            <div className="success-icon-wrap">
              <CheckCircle size={48} className="success-check-icon" />
            </div>
            <span className="success-eyebrow">ORDER CONFIRMED</span>
            <h1 className="success-headline">Thank You for Your Order!</h1>
            <p className="order-ref-text">
              Order Reference: <strong className="ref-highlight">{orderId}</strong>
            </p>
          </div>

          {/* Munaga Anilkumar Traders Notice */}
          <div className="order-store-notice">
            <Store size={20} className="notice-icon" />
            <div>
              <strong>Order Received by Munaga Anilkumar Traders</strong>
              <p>
                Your grocery staples are being prepared for packaging at S V G Market, Rajahmundry. You will receive an update once your items are dispatched.
              </p>
            </div>
          </div>

          {error && <div className="order-error-banner">{error}</div>}

          {/* Details Grid */}
          <div className="order-details-grid">
            {/* Delivery Address Section */}
            <div className="order-info-section">
              <div className="info-header">
                <MapPin size={18} className="info-icon" />
                <h2>Delivery Address</h2>
              </div>
              {address ? (
                <div className="address-content-box">
                  <strong className="customer-name">{address.fullName}</strong>
                  <p className="address-line">{address.addressLine1}</p>
                  {address.addressLine2 && (
                    <p className="address-line">{address.addressLine2}</p>
                  )}
                  <p className="address-line">
                    {address.city}, {address.state} - <strong>{address.pincode}</strong>
                  </p>
                  <p className="address-phone">Phone: {address.mobileNumber}</p>
                </div>
              ) : (
                <p className="fallback-text">Address details recorded on file.</p>
              )}
            </div>

            {/* Order Items & Total Summary */}
            <div className="order-info-section">
              <div className="info-header">
                <Package size={18} className="info-icon" />
                <h2>Order Summary</h2>
              </div>

              {items.length > 0 ? (
                <div className="order-items-compact-list">
                  {items.map((item, index) => (
                    <div key={item.variantId || index} className="compact-item-row">
                      <div className="compact-item-info">
                        <span className="compact-item-name">{item.productName}</span>
                        <span className="compact-item-meta">
                          Pack: {item.weight} × {item.quantity}
                        </span>
                      </div>
                      <span className="compact-item-price">
                        ₹{(item.subtotal || 0).toFixed(2)}
                      </span>
                    </div>
                  ))}

                  <div className="order-pricing-summary">
                    <div className="summary-row">
                      <span>Items Subtotal</span>
                      <span>₹{(order?.subtotal || 0).toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                      <span>Delivery Charges</span>
                      <span className="delivery-free-tag">Free</span>
                    </div>
                    <div className="summary-row grand-total-row">
                      <span>Total Amount</span>
                      <span className="grand-total-amount">₹{orderTotal.toFixed(2)}</span>
                    </div>
                    <div className="summary-row">
                      <span>Payment Method</span>
                      <strong style={{ color: 'var(--color-primary)' }}>
                        {order?.paymentMethod === 'ONLINE' ? 'Online Payment' : 'Cash on Delivery'}
                      </strong>
                    </div>
                  </div>
                </div>
              ) : (
                <p className="fallback-text">Items registered under order reference {orderId}.</p>
              )}
            </div>
          </div>

          {/* Action CTAs */}
          <div className="order-success-actions-row">
            <Link to="/orders" className="btn btn-primary">
              <Package size={18} />
              <span>View My Orders</span>
            </Link>
            <Link to="/products" className="btn btn-outline">
              <ShoppingBag size={18} />
              <span>Continue Shopping</span>
              <ArrowRight size={16} />
            </Link>
          </div>

          {/* Footer Merchant Seal */}
          <div className="order-success-footer-seal">
            <ShieldCheck size={16} />
            <span>
              SRI RUDRA • Munaga Anilkumar Traders • S V G Market, Rajahmundry • Support: 9949406863
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
