import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import { useAuth } from '../context/AuthContext';
import { createOrder } from '../services/orderService';
import {
  MapPin,
  ShoppingBag,
  ArrowLeft,
  Truck,
  ShieldCheck,
  AlertCircle,
  Phone,
  User,
  Home,
  Check,
  Banknote
} from 'lucide-react';
import { placeholderImg } from '../utils/productImages';
import './Checkout.css';

const INDIAN_MOBILE_REGEX = /^[6-9]\d{9}$/;
const INDIAN_PINCODE_REGEX = /^[1-9][0-9]{5}$/;

const Checkout = () => {
  const { cartItems, totalQuantity, subtotal, hasUnpricedItems, clearCart } = useCart();
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  // Address state with prefill from user profile
  const [formData, setFormData] = useState({
    fullName: currentUser?.displayName || '',
    mobileNumber: '',
    addressLine1: '',
    addressLine2: '',
    city: 'Rajahmundry',
    state: 'Andhra Pradesh',
    pincode: '',
  });

  const [paymentMethod, setPaymentMethod] = useState('COD');
  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Validate form
  const validateForm = () => {
    const errs = {};

    if (!formData.fullName.trim()) {
      errs.fullName = 'Full Name is required.';
    }

    if (!formData.mobileNumber.trim()) {
      errs.mobileNumber = 'Mobile number is required.';
    } else if (!INDIAN_MOBILE_REGEX.test(formData.mobileNumber.trim())) {
      errs.mobileNumber = 'Please enter a valid 10-digit Indian mobile number (e.g., 9876543210).';
    }

    if (!formData.addressLine1.trim()) {
      errs.addressLine1 = 'Door No. / House / Street Address is required.';
    }

    if (!formData.city.trim()) {
      errs.city = 'City / Town is required.';
    }

    if (!formData.state.trim()) {
      errs.state = 'State is required.';
    }

    if (!formData.pincode.trim()) {
      errs.pincode = 'Pincode is required.';
    } else if (!INDIAN_PINCODE_REGEX.test(formData.pincode.trim())) {
      errs.pincode = 'Please enter a valid 6-digit postal pincode (e.g., 533101).';
    }

    if (!paymentMethod) {
      errs.paymentMethod = 'Please select a payment method.';
    }

    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleInputChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (formErrors[field]) {
      setFormErrors((prev) => ({ ...prev, [field]: null }));
    }
  };

  const handleSubmitOrder = async (e) => {
    e.preventDefault();
    setServerError('');

    if (cartItems.length === 0) {
      setServerError('Your cart is empty. Please add items before placing an order.');
      return;
    }

    if (hasUnpricedItems) {
      setServerError('Checkout is unavailable because some product prices are not configured yet.');
      return;
    }

    if (!validateForm()) {
      window.scrollTo({ top: 120, behavior: 'smooth' });
      return;
    }

    setIsSubmitting(true);

    try {
      const orderPayload = {
        items: cartItems.map((item) => ({
          productId: item.productId,
          variantId: item.variantId,
          quantity: item.quantity,
        })),
        address: {
          fullName: formData.fullName.trim(),
          mobileNumber: formData.mobileNumber.trim(),
          addressLine1: formData.addressLine1.trim(),
          addressLine2: formData.addressLine2.trim() || null,
          city: formData.city.trim(),
          state: formData.state.trim(),
          pincode: formData.pincode.trim(),
        },
        paymentMethod: paymentMethod || 'COD',
      };

      const createdOrder = await createOrder(orderPayload);
      clearCart();
      navigate(`/order-success/${createdOrder.id}`, {
        replace: true,
        state: { order: createdOrder },
      });
    } catch (err) {
      console.error('Order creation error:', err);
      const responseData = err.response?.data;
      const status = err.response?.status;

      if (status === 401) {
        setServerError('Your session has expired. Please sign in again.');
      } else if (status === 400 && responseData?.message) {
        setServerError(responseData.message);
      } else if (err.code === 'ERR_NETWORK') {
        setServerError('Network error: Unable to connect to server. Please check your connection.');
      } else {
        setServerError(
          responseData?.message || 'Unable to place order at this time. Please try again.'
        );
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // If cart is empty
  if (cartItems.length === 0) {
    return (
      <div className="checkout-page">
        <div className="container">
          <div className="checkout-empty-card">
            <ShoppingBag size={48} className="checkout-empty-icon" />
            <h1 className="checkout-empty-title">Your Basket is Empty</h1>
            <p className="checkout-empty-desc">
              Please add items to your basket before proceeding to checkout.
            </p>
            <Link to="/products" className="btn btn-primary">
              <ArrowLeft size={16} />
              <span>Browse Products</span>
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-page">
      <div className="container">
        {/* Navigation Breadcrumb */}
        <div className="checkout-header-bar">
          <Link to="/cart" className="checkout-back-link">
            <ArrowLeft size={16} />
            <span>Return to Basket</span>
          </Link>
          <span className="checkout-badge-pill">SRI RUDRA CHECKOUT</span>
        </div>

        <h1 className="checkout-main-title">Delivery &amp; Checkout</h1>
        <p className="checkout-firm-sub">Munaga Anilkumar Traders • S V G Market, Rajahmundry</p>

        {serverError && (
          <div className="checkout-error-banner" role="alert">
            <AlertCircle size={20} className="checkout-error-icon" />
            <span>{serverError}</span>
          </div>
        )}

        <div className="checkout-grid">
          {/* Left Column: Delivery Information Form */}
          <div className="checkout-form-column">
            <form onSubmit={handleSubmitOrder} noValidate>
              <section className="checkout-card" aria-label="Delivery Information">
                <div className="card-header-bar">
                  <div className="card-header-icon-box">
                    <MapPin size={20} />
                  </div>
                  <div>
                    <h2 className="card-title">Delivery Information</h2>
                    <p className="card-subtitle">
                      Please enter your contact details and shipping address.
                    </p>
                  </div>
                </div>

                <div className="form-fields-grid">
                  {/* Full Name */}
                  <div className="form-group span-full">
                    <label htmlFor="fullName" className="form-label">
                      Full Name *
                    </label>
                    <div className="input-wrap">
                      <User size={16} className="input-icon" />
                      <input
                        id="fullName"
                        type="text"
                        placeholder="e.g. Ramesh Kumar"
                        value={formData.fullName}
                        onChange={(e) => handleInputChange('fullName', e.target.value)}
                        className={`form-input ${formErrors.fullName ? 'error' : ''}`}
                      />
                    </div>
                    {formErrors.fullName && <span className="field-error">{formErrors.fullName}</span>}
                  </div>

                  {/* Indian Mobile Number */}
                  <div className="form-group span-full">
                    <label htmlFor="mobileNumber" className="form-label">
                      Contact Mobile Number *
                    </label>
                    <div className="input-wrap">
                      <Phone size={16} className="input-icon" />
                      <input
                        id="mobileNumber"
                        type="tel"
                        maxLength="10"
                        placeholder="10-digit mobile number (e.g. 9949406863)"
                        value={formData.mobileNumber}
                        onChange={(e) => handleInputChange('mobileNumber', e.target.value)}
                        className={`form-input ${formErrors.mobileNumber ? 'error' : ''}`}
                      />
                    </div>
                    {formErrors.mobileNumber && <span className="field-error">{formErrors.mobileNumber}</span>}
                  </div>

                  {/* Address Line 1 */}
                  <div className="form-group span-full">
                    <label htmlFor="addressLine1" className="form-label">
                      Door No. / House / Street Address *
                    </label>
                    <div className="input-wrap">
                      <Home size={16} className="input-icon" />
                      <input
                        id="addressLine1"
                        type="text"
                        placeholder="House / Door No., Street, Landmark"
                        value={formData.addressLine1}
                        onChange={(e) => handleInputChange('addressLine1', e.target.value)}
                        className={`form-input ${formErrors.addressLine1 ? 'error' : ''}`}
                      />
                    </div>
                    {formErrors.addressLine1 && <span className="field-error">{formErrors.addressLine1}</span>}
                  </div>

                  {/* Address Line 2 */}
                  <div className="form-group span-full">
                    <label htmlFor="addressLine2" className="form-label">
                      Area / Locality <span className="optional-tag">(Optional)</span>
                    </label>
                    <input
                      id="addressLine2"
                      type="text"
                      placeholder="Apartment, suite, or area details"
                      value={formData.addressLine2}
                      onChange={(e) => handleInputChange('addressLine2', e.target.value)}
                      className="form-input no-icon"
                    />
                  </div>

                  {/* City */}
                  <div className="form-group span-half">
                    <label htmlFor="city" className="form-label">
                      City / Town *
                    </label>
                    <input
                      id="city"
                      type="text"
                      value={formData.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className={`form-input no-icon ${formErrors.city ? 'error' : ''}`}
                    />
                    {formErrors.city && <span className="field-error">{formErrors.city}</span>}
                  </div>

                  {/* State */}
                  <div className="form-group span-half">
                    <label htmlFor="state" className="form-label">
                      State *
                    </label>
                    <input
                      id="state"
                      type="text"
                      value={formData.state}
                      onChange={(e) => handleInputChange('state', e.target.value)}
                      className={`form-input no-icon ${formErrors.state ? 'error' : ''}`}
                    />
                    {formErrors.state && <span className="field-error">{formErrors.state}</span>}
                  </div>

                  {/* Postal Pincode */}
                  <div className="form-group span-half">
                    <label htmlFor="pincode" className="form-label">
                      Postal Pincode *
                    </label>
                    <input
                      id="pincode"
                      type="text"
                      maxLength="6"
                      placeholder="6-digit pincode (e.g. 533101)"
                      value={formData.pincode}
                      onChange={(e) => handleInputChange('pincode', e.target.value)}
                      className={`form-input no-icon ${formErrors.pincode ? 'error' : ''}`}
                    />
                    {formErrors.pincode && <span className="field-error">{formErrors.pincode}</span>}
                  </div>
                </div>
              </section>

              {/* Section 2: Payment Method */}
              <section className="checkout-card payment-method-card" aria-labelledby="payment-heading">
                <div className="card-header-bar">
                  <div className="card-header-icon-box">
                    <Banknote size={20} />
                  </div>
                  <div>
                    <h2 id="payment-heading" className="card-title">Payment Method</h2>
                    <p className="card-subtitle">Choose how you wish to pay for your groceries</p>
                  </div>
                </div>

                <div className="payment-options-list">
                  <label className={`payment-option-card ${paymentMethod === 'COD' ? 'selected' : ''}`}>
                    <div className="payment-radio-wrap">
                      <input
                        type="radio"
                        name="checkoutPaymentMethod"
                        value="COD"
                        checked={paymentMethod === 'COD'}
                        onChange={() => setPaymentMethod('COD')}
                        className="payment-radio-input"
                      />
                      <span className="payment-custom-radio" />
                    </div>
                    <div className="payment-option-info">
                      <div className="payment-option-title-row">
                        <span className="payment-option-name">Cash on Delivery</span>
                        <span className="payment-badge-available">Available</span>
                      </div>
                      <p className="payment-option-desc">
                        Pay in cash when your order is delivered.
                      </p>
                    </div>
                  </label>
                </div>

                {formErrors.paymentMethod && (
                  <span className="field-error payment-field-error">{formErrors.paymentMethod}</span>
                )}
              </section>

              <div className="form-submit-row">
                <button
                  type="submit"
                  className="btn btn-primary btn-block checkout-submit-btn"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <span>Placing Order...</span>
                  ) : (
                    <>
                      <Check size={18} />
                      <span>Place Order (₹{subtotal.toFixed(2)})</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Right Column: Order Summary Card */}
          <aside className="checkout-summary-column" aria-label="Order Summary">
            <div className="checkout-card summary-card">
              <h2 className="summary-card-title">Order Summary</h2>

              {/* Items List */}
              <div className="checkout-items-preview">
                {cartItems.map((item) => (
                  <div key={item.id} className="preview-item-row">
                    <img
                      src={item.image || placeholderImg}
                      alt={item.name}
                      className="preview-item-img"
                    />
                    <div className="preview-item-info">
                      <h4 className="preview-item-name">{item.name}</h4>
                      <span className="preview-item-meta">
                        Pack: {item.weight} × {item.quantity}
                      </span>
                    </div>
                    <span className="preview-item-price">
                      ₹{((item.price || 0) * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Calculation Rows */}
              <div className="summary-calc-rows">
                <div className="calc-row">
                  <span>Items Subtotal ({totalQuantity} items)</span>
                  <span>₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="calc-row">
                  <span>Delivery Charges</span>
                  <span className="free-badge">Free</span>
                </div>
                <div className="calc-row total-calc-row">
                  <span>Total Amount</span>
                  <span className="grand-total">₹{subtotal.toFixed(2)}</span>
                </div>
                <div className="calc-row payment-method-summary-row">
                  <span>Payment Method</span>
                  <span className="payment-method-summary-badge">Cash on Delivery</span>
                </div>
              </div>

              <div className="checkout-assurances-box">
                <div className="assurance-line">
                  <ShieldCheck size={16} />
                  <span>100% Authentic Quality Guaranteed</span>
                </div>
                <div className="assurance-line">
                  <Truck size={16} />
                  <span>Direct Delivery from S V G Market, Rajahmundry</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Checkout;
