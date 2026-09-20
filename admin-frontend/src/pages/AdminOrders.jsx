import { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  CheckCircle2,
  AlertCircle,
  X,
  ShoppingBag,
  Clock,
  MapPin,
  Phone,
  User,
  Check,
  RefreshCw,
} from 'lucide-react';
import adminService from '../services/adminService';
import './AdminOrders.css';

const ORDER_STATUS_LIST = [
  { value: 'CREATED', label: 'Created / Pending' },
  { value: 'RECEIVED', label: 'Received' },
  { value: 'CONFIRMED', label: 'Confirmed' },
  { value: 'PROCESSING', label: 'Processing' },
  { value: 'PACKAGING', label: 'Packaging' },
  { value: 'SHIPPED', label: 'Shipped' },
  { value: 'DISPATCHED', label: 'Dispatched' },
  { value: 'DELIVERED', label: 'Delivered' },
  { value: 'CANCELLED', label: 'Cancelled' },
];

const AdminOrders = () => {
  const [searchParams] = useSearchParams();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || 'ALL');
  const [paymentFilter, setPaymentFilter] = useState('ALL');

  // Order Details Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [editStatus, setEditStatus] = useState('');
  const [editDeliveryFee, setEditDeliveryFee] = useState(0);
  const [isUpdatingOrder, setIsUpdatingOrder] = useState(false);

  const openOrderModal = useCallback((order) => {
    setSelectedOrder(order);
    setEditStatus(order.orderStatus || 'CREATED');
    setEditDeliveryFee(order.deliveryFee ?? 0);
    setModalOpen(true);
  }, []);

  const closeOrderModal = () => {
    if (isUpdatingOrder) return;
    setModalOpen(false);
    setSelectedOrder(null);
  };

  const loadOrders = () => {
    setLoading(true);
    setError('');

    adminService
      .getAllOrders(statusFilter)
      .then((data) => {
        const sorted = [...(data || [])].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setOrders(sorted);
      })
      .catch((err) => {
        console.error('Error loading orders:', err);
        setError(err.userFriendlyMessage || 'Unable to retrieve customer orders.');
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    let isMounted = true;

    adminService
      .getAllOrders(statusFilter)
      .then((data) => {
        if (!isMounted) return;
        const sorted = [...(data || [])].sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0));
        setOrders(sorted);

        const queryOrderId = searchParams.get('orderId');
        if (queryOrderId) {
          const found = sorted.find((o) => o.id === queryOrderId);
          if (found) {
            openOrderModal(found);
          }
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.error('Error loading orders:', err);
        setError(err.userFriendlyMessage || 'Unable to retrieve customer orders.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter]);

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesId = (o.id || '').toLowerCase().includes(q);
        const matchesName = (o.address?.fullName || '').toLowerCase().includes(q);
        const matchesPhone = (o.address?.mobileNumber || '').toLowerCase().includes(q);
        const matchesCity = (o.address?.city || '').toLowerCase().includes(q);
        if (!matchesId && !matchesName && !matchesPhone && !matchesCity) {
          return false;
        }
      }

      // Payment Status
      if (paymentFilter !== 'ALL') {
        const pStatus = (o.paymentStatus || 'PENDING').toUpperCase();
        if (pStatus !== paymentFilter) return false;
      }

      return true;
    });
  }, [orders, searchQuery, paymentFilter]);

  const handleUpdateOrderStatus = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;

    setIsUpdatingOrder(true);
    setFeedback({ type: '', message: '' });

    try {
      const updated = await adminService.updateOrderStatus(
        selectedOrder.id,
        editStatus,
        parseFloat(editDeliveryFee) || 0
      );

      setOrders((prev) =>
        prev.map((o) => (o.id === updated.id ? { ...o, ...updated } : o))
      );
      setSelectedOrder(updated);

      setFeedback({
        type: 'success',
        message: `Order #${selectedOrder.id.slice(-6).toUpperCase()} updated successfully.`,
      });
      closeOrderModal();
    } catch (err) {
      console.error('Error updating order:', err);
      setFeedback({
        type: 'error',
        message: err.userFriendlyMessage || 'Failed to update order status. Please try again.',
      });
    } finally {
      setIsUpdatingOrder(false);
    }
  };

  const formatCurrency = (val) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(Number(val) || 0);
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

  const formatPaymentMethod = (method) => {
    if (!method || String(method).toUpperCase() === 'COD') return 'Cash on Delivery';
    return method;
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

  // Live recalculated total in modal
  const liveTotal = useMemo(() => {
    if (!selectedOrder) return 0;
    const sub = Number(selectedOrder.subtotal) || 0;
    const fee = Number(editDeliveryFee) || 0;
    return sub + fee;
  }, [selectedOrder, editDeliveryFee]);

  return (
    <div className="admin-page">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Orders Management</h1>
          <p className="admin-page-desc">
            Track customer grocery orders, fulfillment stages, delivery addresses, and payments
          </p>
        </div>

        <div className="admin-header-actions">
          <button
            type="button"
            className="btn-admin-action"
            onClick={loadOrders}
            disabled={loading}
            title="Refresh order records"
          >
            <RefreshCw size={15} className={loading ? 'spinning' : ''} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Feedback Banner */}
      {feedback.message && (
        <div className={`admin-alert-banner ${feedback.type}`} role="alert">
          <div className="feedback-content">
            {feedback.type === 'success' ? (
              <CheckCircle2 size={18} />
            ) : (
              <AlertCircle size={18} />
            )}
            <span>{feedback.message}</span>
          </div>
          <button
            type="button"
            className="btn-close-banner"
            onClick={() => setFeedback({ type: '', message: '' })}
          >
            <X size={15} />
          </button>
        </div>
      )}

      {error && (
        <div className="admin-alert-banner error" role="alert">
          <span>{error}</span>
          <button type="button" onClick={loadOrders} className="btn-retry-inline">
            Retry
          </button>
        </div>
      )}

      {/* Filter & Search Bar */}
      <div className="admin-filter-bar">
        <div className="admin-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search by Order ID, customer name, or phone number..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="admin-search-input"
          />
          {searchQuery && (
            <button
              type="button"
              className="btn-clear-search"
              onClick={() => setSearchQuery('')}
            >
              <X size={14} />
            </button>
          )}
        </div>

        <div className="admin-filters-group">
          <select
            className="admin-select-filter"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="ALL">All Order Statuses</option>
            {ORDER_STATUS_LIST.map((s) => (
              <option key={s.value} value={s.value}>
                {s.label}
              </option>
            ))}
          </select>

          <select
            className="admin-select-filter"
            value={paymentFilter}
            onChange={(e) => setPaymentFilter(e.target.value)}
          >
            <option value="ALL">All Payment Statuses</option>
            <option value="PENDING">Payment Pending</option>
            <option value="COMPLETED">Payment Completed</option>
            <option value="FAILED">Payment Failed</option>
          </select>
        </div>
      </div>

      {/* Orders Table Card */}
      <div className="admin-section-card">
        <div className="section-card-header">
          <span className="section-title">
            Orders {error ? '' : `(${filteredOrders.length})`}
          </span>
        </div>

        <div className="admin-table-container">
          {loading ? (
            <div className="table-loading-wrap">
              <div className="table-spinner" />
              <span>Loading orders from store database...</span>
            </div>
          ) : error ? (
            <div className="table-empty-state">
              <AlertCircle size={36} className="empty-icon text-error" />
              <p className="empty-title">Failed to load orders</p>
              <p className="empty-desc">{error}</p>
              <button type="button" onClick={loadOrders} className="btn-admin-action" style={{ marginTop: '0.75rem' }}>
                <RefreshCw size={14} />
                <span>Retry</span>
              </button>
            </div>
          ) : filteredOrders.length === 0 ? (
            <div className="table-empty-state">
              <ShoppingBag size={36} className="empty-icon" />
              <p className="empty-title">No orders found</p>
              <p className="empty-desc">No orders match the selected filters or search parameters.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer</th>
                  <th>Date</th>
                  <th>Items</th>
                  <th>Subtotal</th>
                  <th>Delivery</th>
                  <th>Total</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th className="text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const itemsCount = order.items
                    ? order.items.reduce((s, it) => s + (it.quantity || 1), 0)
                    : 0;

                  return (
                    <tr key={order.id}>
                      <td className="table-cell-id">
                        <span className="order-id-badge">
                          #{order.id.slice(-6).toUpperCase()}
                        </span>
                      </td>
                      <td>
                        <div className="customer-cell">
                          <span className="customer-name">
                            {order.address?.fullName || 'Customer'}
                          </span>
                          <span className="customer-phone">
                            {order.address?.mobileNumber || '—'}
                          </span>
                        </div>
                      </td>
                      <td className="table-cell-date">{formatDate(order.createdAt)}</td>
                      <td>
                        <span className="items-count-badge">
                          {itemsCount} {itemsCount === 1 ? 'item' : 'items'}
                        </span>
                      </td>
                      <td>{formatCurrency(order.subtotal)}</td>
                      <td>
                        {order.deliveryFee && order.deliveryFee > 0
                          ? formatCurrency(order.deliveryFee)
                          : 'Free'}
                      </td>
                      <td className="table-cell-amount">{formatCurrency(order.total)}</td>
                      <td>
                        <div className="payment-cell">
                          <span className="payment-badge">
                            {formatPaymentMethod(order.paymentMethod)}
                          </span>
                          <span
                            className={`payment-status-tag ${
                              (order.paymentStatus || 'PENDING').toLowerCase()
                            }`}
                          >
                            {order.paymentStatus || 'PENDING'}
                          </span>
                        </div>
                      </td>
                      <td>
                        <span className={getOrderStatusClass(order.orderStatus)}>
                          {order.orderStatus || 'CREATED'}
                        </span>
                      </td>
                      <td className="text-right">
                        <button
                          type="button"
                          className="btn-table-action"
                          onClick={() => openOrderModal(order)}
                        >
                          Review & Update
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* ================= Order Details & Status Update Modal ================= */}
      {modalOpen && selectedOrder && (
        <div className="admin-modal-backdrop" onClick={closeOrderModal}>
          <div
            className="admin-modal-dialog modal-lg"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            <div className="admin-modal-header">
              <div className="modal-title-group">
                <div className="order-modal-header-line">
                  <h2 className="admin-modal-title">
                    Order #{selectedOrder.id.slice(-8).toUpperCase()}
                  </h2>
                  <span className={getOrderStatusClass(selectedOrder.orderStatus)}>
                    {selectedOrder.orderStatus || 'CREATED'}
                  </span>
                </div>
                <p className="admin-modal-subtitle">
                  Placed on {formatDate(selectedOrder.createdAt)}
                </p>
              </div>
              <button
                type="button"
                className="btn-modal-close"
                onClick={closeOrderModal}
                disabled={isUpdatingOrder}
              >
                <X size={20} />
              </button>
            </div>

            <form className="admin-modal-form" onSubmit={handleUpdateOrderStatus}>
              <div className="modal-body-scroll">
                {/* Customer & Delivery Information Cards */}
                <div className="order-info-split">
                  {/* Customer Card */}
                  <div className="order-card-box">
                    <div className="order-box-title">
                      <User size={15} />
                      <span>Customer Contact</span>
                    </div>
                    <div className="order-box-content">
                      <div className="info-line">
                        <span className="info-label">Name:</span>
                        <strong className="info-value">
                          {selectedOrder.address?.fullName || 'Customer'}
                        </strong>
                      </div>
                      <div className="info-line">
                        <span className="info-label">Phone:</span>
                        <a
                          href={`tel:${selectedOrder.address?.mobileNumber || ''}`}
                          className="info-value-link"
                        >
                          <Phone size={13} />
                          <span>{selectedOrder.address?.mobileNumber || '—'}</span>
                        </a>
                      </div>
                      <div className="info-line">
                        <span className="info-label">Order ID:</span>
                        <span className="info-mono">{selectedOrder.id}</span>
                      </div>
                    </div>
                  </div>

                  {/* Delivery Address Card */}
                  <div className="order-card-box">
                    <div className="order-box-title">
                      <MapPin size={15} />
                      <span>Delivery Address</span>
                    </div>
                    <div className="order-box-content">
                      <p className="address-full">
                        {selectedOrder.address?.addressLine1}
                        {selectedOrder.address?.addressLine2 && `, ${selectedOrder.address.addressLine2}`}
                      </p>
                      <p className="address-city">
                        {selectedOrder.address?.city}, {selectedOrder.address?.state} -{' '}
                        <strong>{selectedOrder.address?.pincode}</strong>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Ordered Items Table */}
                <div className="order-card-box">
                  <div className="order-box-title">
                    <ShoppingBag size={15} />
                    <span>Ordered Grocery Items ({selectedOrder.items?.length || 0})</span>
                  </div>

                  <table className="order-items-table">
                    <thead>
                      <tr>
                        <th>Item Details</th>
                        <th>Pack Size</th>
                        <th className="text-center">Quantity</th>
                        <th className="text-right">Unit Price</th>
                        <th className="text-right">Line Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedOrder.items || []).map((item, idx) => (
                        <tr key={item.productId ? `${item.productId}_${idx}` : idx}>
                          <td>
                            <span className="item-name">{item.productName || 'Grocery Item'}</span>
                          </td>
                          <td>
                            <span className="variant-tag">{item.weight || 'Standard'}</span>
                          </td>
                          <td className="text-center font-bold">{item.quantity}</td>
                          <td className="text-right">{formatCurrency(item.price)}</td>
                          <td className="text-right font-bold">
                            {formatCurrency(item.subtotal || (item.price || 0) * (item.quantity || 1))}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Payment Summary */}
                <div className="order-payment-box">
                  <div className="payment-row">
                    <span>Payment Method:</span>
                    <strong>{formatPaymentMethod(selectedOrder.paymentMethod)}</strong>
                  </div>
                  <div className="payment-row">
                    <span>Payment Status:</span>
                    <span
                      className={`payment-status-tag ${
                        (selectedOrder.paymentStatus || 'PENDING').toLowerCase()
                      }`}
                    >
                      {selectedOrder.paymentStatus || 'PENDING'}
                    </span>
                  </div>
                  <div className="payment-row">
                    <span>Items Subtotal:</span>
                    <span>{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  <div className="payment-row">
                    <span>Configured Delivery Fee:</span>
                    <span>{formatCurrency(editDeliveryFee)}</span>
                  </div>
                  <div className="payment-row total-row">
                    <span>Calculated Total:</span>
                    <strong>{formatCurrency(liveTotal)}</strong>
                  </div>
                </div>

                {/* Fulfillment Status & Delivery Fee Configuration */}
                <div className="order-fulfillment-section">
                  <div className="order-box-title">
                    <Clock size={15} />
                    <span>Update Fulfillment & Delivery Charges</span>
                  </div>

                  <div className="form-row-2">
                    {/* Order Status */}
                    <div className="admin-form-group">
                      <label className="form-label" htmlFor="edit-order-status">
                        Fulfillment Status *
                      </label>
                      <select
                        id="edit-order-status"
                        className="form-input"
                        value={editStatus}
                        onChange={(e) => setEditStatus(e.target.value)}
                        disabled={isUpdatingOrder}
                      >
                        {ORDER_STATUS_LIST.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Delivery Fee */}
                    <div className="admin-form-group">
                      <label className="form-label" htmlFor="edit-delivery-fee">
                        Delivery Fee (₹)
                      </label>
                      <input
                        id="edit-delivery-fee"
                        type="number"
                        min="0"
                        step="1"
                        className="form-input"
                        value={editDeliveryFee}
                        onChange={(e) => setEditDeliveryFee(parseFloat(e.target.value) || 0)}
                        disabled={isUpdatingOrder}
                      />
                      <span className="form-help-text">
                        Delivery fee is automatically added to the order subtotal.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Modal Footer */}
              <div className="admin-modal-footer">
                <button
                  type="button"
                  className="btn-modal-cancel"
                  onClick={closeOrderModal}
                  disabled={isUpdatingOrder}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn-modal-save"
                  disabled={isUpdatingOrder}
                >
                  {isUpdatingOrder ? (
                    <span>Saving Changes...</span>
                  ) : (
                    <>
                      <Check size={16} />
                      <span>Save Order Changes</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
