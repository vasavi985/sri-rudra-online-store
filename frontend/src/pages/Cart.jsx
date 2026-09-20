import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import {
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Trash2,
  Plus,
  Minus,
  ShieldCheck,
  Truck,
  Info,
  Sparkles
} from 'lucide-react';
import { placeholderImg } from '../utils/productImages';
import './Cart.css';

const Cart = () => {
  const {
    cartItems,
    updateQuantity,
    removeFromCart,
    totalQuantity,
    hasUnpricedItems,
    subtotal
  } = useCart();

  // 1. Clean Empty Cart State
  if (cartItems.length === 0) {
    return (
      <div className="cart-page">
        <div className="container">
          <div className="cart-empty-card">
            <div className="cart-empty-icon-wrap">
              <ShoppingBag size={48} className="cart-empty-icon" />
            </div>
            <span className="cart-empty-badge">SHOPPING BASKET</span>
            <h1 className="cart-empty-title">Your Cart is Currently Empty</h1>
            <p className="cart-empty-desc">
              Explore our authentic selection of Sri Rudra pulses, stone-ground flours, and traditional ravva to fill your basket.
            </p>
            <div className="cart-empty-action">
              <Link to="/products" className="btn btn-primary">
                <span>Browse Products</span>
                <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 2. Active Cart State with Items
  return (
    <div className="cart-page">
      <div className="container">
        {/* Cart Page Title Header */}
        <div className="cart-header-wrap">
          <div>
            <div className="cart-brand-tag">
              <Sparkles size={14} />
              <span>MUNAGA ANILKUMAR TRADERS • RAJAHMUNDRY</span>
            </div>
            <h1 className="cart-main-title">Shopping Basket</h1>
            <p className="cart-subtitle">
              Review your selected authentic Sri Rudra grocery staples before checkout.
            </p>
          </div>
          <span className="cart-count-pill">
            {totalQuantity} {totalQuantity === 1 ? 'Item' : 'Items'}
          </span>
        </div>

        {/* 2-Column Responsive Layout */}
        <div className="cart-layout-grid">
          {/* Left Column: Cart Items List */}
          <div className="cart-items-list" aria-label="Cart Items">
            {cartItems.map((item) => {
              const itemHasPrice = typeof item.price === 'number' && item.price > 0;
              const lineTotal = itemHasPrice ? item.price * item.quantity : null;

              return (
                <article key={item.id} className="cart-item-card">
                  {/* Product Thumbnail */}
                  <Link
                    to={`/products/${item.productId}`}
                    className="cart-item-img-wrap"
                    aria-label={`View ${item.name}`}
                  >
                    <img
                      src={item.image || placeholderImg}
                      alt={`Packaging of ${item.name}`}
                      className="cart-item-img"
                      onError={(e) => {
                        e.currentTarget.src = placeholderImg;
                      }}
                    />
                  </Link>

                  {/* Product Details */}
                  <div className="cart-item-details">
                    <div className="cart-item-top-row">
                      <span className="cart-item-weight-badge">
                        Pack: {item.weight || 'Standard'}
                      </span>
                      <button
                        type="button"
                        className="cart-item-remove-btn"
                        onClick={() => removeFromCart(item.id)}
                        aria-label={`Remove ${item.name} (${item.weight}) from cart`}
                        title="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>

                    <h2 className="cart-item-title">
                      <Link to={`/products/${item.productId}`}>{item.name}</Link>
                    </h2>

                    {/* Unit Price */}
                    <div className="cart-item-pricing-row">
                      {itemHasPrice ? (
                        <span className="cart-unit-price">
                          ₹{item.price.toFixed(2)} / pack
                        </span>
                      ) : (
                        <span className="cart-price-pending">Price available soon</span>
                      )}
                    </div>

                    {/* Bottom Bar: Quantity Stepper & Line Total */}
                    <div className="cart-item-bottom-bar">
                      <div
                        className="cart-quantity-control"
                        role="group"
                        aria-label={`Quantity controls for ${item.name}`}
                      >
                        <button
                          type="button"
                          className="cart-qty-btn"
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          aria-label="Decrease quantity"
                        >
                          <Minus size={14} />
                        </button>
                        <span className="cart-qty-value" aria-live="polite">
                          {item.quantity}
                        </span>
                        <button
                          type="button"
                          className="cart-qty-btn"
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          disabled={item.quantity >= 99}
                          aria-label="Increase quantity"
                        >
                          <Plus size={14} />
                        </button>
                      </div>

                      <div className="cart-line-total">
                        {itemHasPrice ? (
                          <span className="line-total-amount">
                            ₹{lineTotal.toFixed(2)}
                          </span>
                        ) : (
                          <span className="line-total-pending">Pricing Pending</span>
                        )}
                      </div>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Right Column: Order Summary Sidebar */}
          <aside className="cart-summary-column" aria-label="Order Summary">
            <div className="cart-summary-card">
              <h2 className="summary-title">Order Summary</h2>

              <div className="summary-rows">
                <div className="summary-row">
                  <span>Total Items</span>
                  <span className="summary-val">{totalQuantity}</span>
                </div>

                <div className="summary-row">
                  <span>Packaging &amp; Handling</span>
                  <span className="summary-val free-val">Free</span>
                </div>

                <div className="summary-row total-row">
                  <span>Estimated Total</span>
                  {hasUnpricedItems ? (
                    <span className="summary-pending-text">Pricing Pending</span>
                  ) : (
                    <span className="summary-total-amount">
                      ₹{subtotal.toFixed(2)}
                    </span>
                  )}
                </div>
              </div>

              {/* Notice for unpriced items */}
              {hasUnpricedItems ? (
                <div className="cart-pricing-notice-box" role="status">
                  <Info size={18} className="notice-icon" />
                  <div>
                    <strong>Checkout Unavailable</strong>
                    <p>
                      Checkout is disabled because some items in your cart do not have active pricing configured.
                    </p>
                  </div>
                </div>
              ) : (
                <p className="summary-note">
                  Prices inclusive of all applicable taxes.
                </p>
              )}

              {/* Checkout Action Button */}
              {hasUnpricedItems ? (
                <button
                  type="button"
                  className="btn btn-primary btn-block btn-checkout-disabled"
                  disabled
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={16} />
                </button>
              ) : (
                <Link
                  to="/checkout"
                  className="btn btn-primary btn-block btn-checkout-active"
                >
                  <span>Proceed to Checkout</span>
                  <ArrowRight size={16} />
                </Link>
              )}

              {/* Continue Shopping */}
              <Link to="/products" className="btn btn-outline btn-block btn-back-shopping">
                <ArrowLeft size={16} />
                <span>Continue Shopping</span>
              </Link>

              {/* Trust Assurances */}
              <div className="cart-assurances">
                <div className="cart-assurance-item">
                  <ShieldCheck size={16} className="assurance-icon" />
                  <span>100% Authentic Sri Rudra Products</span>
                </div>
                <div className="cart-assurance-item">
                  <Truck size={16} className="assurance-icon" />
                  <span>Munaga Anilkumar Traders, Rajahmundry</span>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
};

export default Cart;
