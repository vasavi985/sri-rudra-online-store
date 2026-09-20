import { useState, useEffect } from 'react';
import { getAdminOrders, updateOrderStatus } from '../../services/adminService';
import {
  ShoppingBag,
  CheckCircle2,
  MapPin,
  Phone,
  User,
  AlertCircle,
  RefreshCw,
  X
} from 'lucide-react';
import './AdminOrders.css';

const STATUS_FILTERS = [
  { id: 'ALL', label: 'All Orders' },
  { id: 'CREATED', label: 'New / Pending' },
  { id: 'CONFIRMED', label: 'Confirmed / Packaging' },
  { id: 'SHIPPED', label: 'Shipped / Dispatched' },
  { id: 'DELIVERED', label: 'Delivered' },
  { id: 'CANCELLED', label: 'Cancelled' },
];

const AdminOrders = () => {
  const [orders, setOrders] = useState([]);
  const [activeFilter, setActiveFilter] = useState('ALL');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Selected Order for Modal
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [newStatus, setNewStatus] = useState('');
  const [deliveryFeeInput, setDeliveryFeeInput] = useState('');
  const [updating, setUpdating] = useState(false);
  const [updateError, setUpdateError] = useState('');

  const loadOrders = async (status = activeFilter) => {
    setLoading(true);
    setError('');
    try {
      const data = await getAdminOrders(status);
      setOrders(Array.isArray(data) ? data : []);
    } catch (err) {
      console.error('Failed to load orders:', err);
      setError('Unable to load orders. Please verify server connection.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let isMounted = true;
    getAdminOrders(activeFilter)
      .then((data) => {
        if (isMounted) {
          setOrders(Array.isArray(data) ? data : []);
          setError('');
        }
      })
      .catch((err) => {
        console.error('Failed to load orders:', err);
        if (isMounted) setError('Unable to load orders. Please verify server connection.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [activeFilter]);

  const showNotification = (msg) => {
    setSuccessMsg(msg);
    setTimeout(() => {
      setSuccessMsg('');
    }, 4000);
  };

  const handleOpenManageModal = (order) => {
    setSelectedOrder(order);
    setNewStatus(order.orderStatus || 'CREATED');
    setDeliveryFeeInput(
      order.deliveryFee != null ? String(order.deliveryFee) : ''
    );
    setUpdateError('');
  };

  const handleUpdateOrder = async (e) => {
    e.preventDefault();
    if (!selectedOrder) return;
    setUpdateError('');

    let parsedFee = null;
    if (deliveryFeeInput.trim() !== '') {
      parsedFee = Number(deliveryFeeInput);
      if (isNaN(parsedFee) || parsedFee < 0) {
        setUpdateError('Delivery fee must be a valid non-negative number.');
        return;
      }
    }

    setUpdating(true);
    try {
      const updated = await updateOrderStatus(selectedOrder.id, {
        orderStatus: newStatus,
        deliveryFee: parsedFee,
      });

      setOrders((prev) =>
        prev.map((o) => (o.id === selectedOrder.id ? updated : o))
      );
      setSelectedOrder(null);
      showNotification('Order updated successfully.');
    } catch (err) {
      console.error('Failed to update order:', err);
      const serverMessage =
        err.response?.data?.message || err.message || '';
      setUpdateError(
        serverMessage
          ? `Unable to update order: ${serverMessage}`
          : 'Unable to update order. Please try again.'
      );
    } finally {
      setUpdating(false);
    }
  };

  const formatCurrency = (val) => {
    const num = Number(val) || 0;
    return '₹' + num.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return 'N/A';
    return new Date(timestamp).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
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

  // Live total preview in modal
  const modalSubtotal = selectedOrder?.subtotal || 0;
  const modalDeliveryFee =
    deliveryFeeInput.trim() !== '' && !isNaN(Number(deliveryFeeInput))
      ? Number(deliveryFeeInput)
      : selectedOrder?.deliveryFee || 0;
  const modalLiveTotal = modalSubtotal + modalDeliveryFee;

  return (
    <div className="admin-orders-page">
      {/* Page Header */}
      <div className="admin-page-header">
        <div>
          <h1 className="admin-page-title">Orders</h1>
          <p className="admin-page-subtitle">
            Review customer grocery orders, set delivery fees, and update delivery status.
          </p>
        </div>
        <div className="header-actions">
          <button type="button" className="btn btn-outline" onClick={() => loadOrders(activeFilter)}>
            <RefreshCw size={15} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {successMsg && (
        <div className="admin-alert-success" role="status">
          <CheckCircle2 size={18} />
          <span>{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="admin-alert-error" role="alert">
          <AlertCircle size={18} />
          <span>{error}</span>
        </div>
      )}

      {/* Filter Tabs */}
      <div className="order-filter-tabs" role="tablist">
        {STATUS_FILTERS.map((tab) => (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={activeFilter === tab.id}
            className={`order-filter-tab-btn ${activeFilter === tab.id ? 'active' : ''}`}
            onClick={() => setActiveFilter(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Orders Table */}
      {loading ? (
        <div className="admin-loading-container">
          <div className="spinner"></div>
          <p>Loading orders...</p>
        </div>
      ) : orders.length === 0 ? (
        <div className="empty-section-card">
          <ShoppingBag size={40} className="empty-icon" />
          <p>No orders found under "{STATUS_FILTERS.find((f) => f.id === activeFilter)?.label}".</p>
        </div>
      ) : (
        <div className="table-responsive admin-table-card">
          <table className="admin-data-table">
            <thead>
              <tr>
                <th>Order #</th>
                <th>Date</th>
                <th>Customer</th>
                <th>Destination</th>
                <th>Items</th>
                <th>Subtotal</th>
                <th>Delivery Fee</th>
                <th>Total</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {orders.map((ord) => (
                <tr key={ord.id}>
                  <td>
                    <strong className="order-id-label">{ord.id}</strong>
                  </td>
                  <td>{formatDate(ord.createdAt)}</td>
                  <td>
                    <div className="order-customer-cell">
                      <strong>{ord.address?.fullName || 'Customer'}</strong>
                      {ord.address?.mobileNumber && (
                        <a href={`tel:${ord.address.mobileNumber}`} className="customer-phone-tag">
                          <Phone size={12} /> {ord.address.mobileNumber}
                        </a>
                      )}
                    </div>
                  </td>
                  <td>
                    <span className="destination-tag">
                      {ord.address?.city || 'Rajahmundry'}
                    </span>
                  </td>
                  <td>{ord.items?.length || 0} items</td>
                  <td>{formatCurrency(ord.subtotal)}</td>
                  <td>
                    {ord.deliveryFee != null ? (
                      formatCurrency(ord.deliveryFee)
                    ) : (
                      <span className="fee-to-confirm-pill">To Confirm</span>
                    )}
                  </td>
                  <td>
                    <strong className="order-total-highlight">
                      {formatCurrency(ord.total || ord.subtotal)}
                    </strong>
                  </td>
                  <td>{getStatusBadge(ord.orderStatus)}</td>
                  <td>
                    <button
                      type="button"
                      className="btn btn-sm btn-primary"
                      onClick={() => handleOpenManageModal(ord)}
                    >
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Manage Order Modal */}
      {selectedOrder && (
        <div className="admin-modal-backdrop">
          <div className="admin-modal-container order-modal-width">
            <div className="admin-modal-header">
              <div>
                <h2 className="admin-modal-title">
                  Manage Order <span className="modal-order-number">#{selectedOrder.id}</span>
                </h2>
                <span className="modal-date-info">
                  Placed on {formatDate(selectedOrder.createdAt)}
                </span>
              </div>
              <button
                type="button"
                className="modal-close-icon-btn"
                onClick={() => setSelectedOrder(null)}
              >
                <X size={20} />
              </button>
            </div>

            {updateError && (
              <div className="admin-alert-error" role="alert" style={{ margin: '1rem 1.5rem 0' }}>
                <AlertCircle size={16} />
                <span>{updateError}</span>
              </div>
            )}

            <div className="admin-modal-body">
              {/* Customer & Delivery Address */}
              <div className="order-info-two-col">
                <div className="order-info-card">
                  <div className="info-card-header">
                    <User size={16} />
                    <span>Customer &amp; Contact</span>
                  </div>
                  <strong className="info-card-name">{selectedOrder.address?.fullName}</strong>
                  {selectedOrder.address?.mobileNumber && (
                    <a
                      href={`tel:${selectedOrder.address.mobileNumber}`}
                      className="info-card-phone"
                    >
                      <Phone size={14} />
                      <span>{selectedOrder.address.mobileNumber}</span>
                    </a>
                  )}
                </div>

                <div className="order-info-card">
                  <div className="info-card-header">
                    <MapPin size={16} />
                    <span>Delivery Address</span>
                  </div>
                  <div className="info-card-address">
                    <p>{selectedOrder.address?.addressLine1}</p>
                    {selectedOrder.address?.addressLine2 && (
                      <p>{selectedOrder.address?.addressLine2}</p>
                    )}
                    <p>
                      {selectedOrder.address?.city}, {selectedOrder.address?.state} - <strong>{selectedOrder.address?.pincode}</strong>
                    </p>
                  </div>
                </div>
              </div>

              {/* Ordered Products Table */}
              <div className="form-section-card">
                <h3 className="form-section-heading">
                  Ordered Products ({selectedOrder.items?.length || 0})
                </h3>
                <div className="table-responsive">
                  <table className="order-items-table">
                    <thead>
                      <tr>
                        <th>Product</th>
                        <th>Pack Size</th>
                        <th>Qty</th>
                        <th>Price</th>
                        <th>Subtotal</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedOrder.items?.map((item, idx) => (
                        <tr key={idx}>
                          <td><strong>{item.productName}</strong></td>
                          <td><span className="pack-tag">{item.weight}</span></td>
                          <td>{item.quantity}</td>
                          <td>{formatCurrency(item.price)}</td>
                          <td><strong>{formatCurrency(item.subtotal)}</strong></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Status & Delivery Fee Form */}
              <form onSubmit={handleUpdateOrder} className="form-section-card">
                <h3 className="form-section-heading">Update Fulfillment Status</h3>

                <div className="form-grid-2-inputs">
                  <div className="form-group">
                    <label htmlFor="order-status-select">
                      Order Status <span className="req-star">*</span>
                    </label>
                    <select
                      id="order-status-select"
                      className="form-input"
                      value={newStatus}
                      onChange={(e) => setNewStatus(e.target.value)}
                    >
                      <option value="CREATED">New / Pending Confirmation</option>
                      <option value="RECEIVED">Received</option>
                      <option value="CONFIRMED">Confirmed</option>
                      <option value="PROCESSING">Processing</option>
                      <option value="PACKAGING">Packaging</option>
                      <option value="SHIPPED">Shipped</option>
                      <option value="DISPATCHED">Dispatched</option>
                      <option value="DELIVERED">Delivered</option>
                      <option value="CANCELLED">Cancelled</option>
                    </select>
                  </div>

                  <div className="form-group">
                    <label htmlFor="order-fee-input">
                      Delivery Fee (₹)
                    </label>
                    <input
                      id="order-fee-input"
                      type="number"
                      step="1"
                      min="0"
                      placeholder="e.g. 40 (or 0 for free delivery)"
                      className="form-input"
                      value={deliveryFeeInput}
                      onChange={(e) => setDeliveryFeeInput(e.target.value)}
                    />
                    <span className="input-hint-text">
                      This fee is updated on the customer's order and displayed in My Orders.
                    </span>
                  </div>
                </div>

                {/* Recalculated Total Breakdown */}
                <div className="recalculated-totals-card">
                  <div className="recalc-row">
                    <span>Items Subtotal:</span>
                    <span>{formatCurrency(modalSubtotal)}</span>
                  </div>
                  <div className="recalc-row">
                    <span>Delivery Fee:</span>
                    <span>{formatCurrency(modalDeliveryFee)}</span>
                  </div>
                  <div className="recalc-row recalc-total-row">
                    <span>Payable Total:</span>
                    <strong className="recalc-total-val">{formatCurrency(modalLiveTotal)}</strong>
                  </div>
                </div>

                <div className="admin-modal-footer">
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => setSelectedOrder(null)}
                    disabled={updating}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary" disabled={updating}>
                    {updating ? <span>Updating Order...</span> : <span>Save Order Changes</span>}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminOrders;
