import { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getProductById } from '../services/productService';
import { CANONICAL_PRODUCTS } from '../utils/productCatalog';
import { useCart } from '../context/CartContext';
import {
  ArrowLeft,
  CheckCircle2,
  ShieldCheck,
  Truck,
  Sparkles,
  Package,
  Plus,
  Minus,
  Check,
  ShoppingCart,
  ChevronLeft,
  ChevronRight,
  Store
} from 'lucide-react';
import { getProductImage, getProductAlt, placeholderImg } from '../utils/productImages';
import './ProductDetails.css';

const ProductDetails = () => {
  const { id } = useParams();
  const { addToCart } = useCart();

  const [product, setProduct] = useState(null);
  const [selectedVariantIndex, setSelectedVariantIndex] = useState(0);
  const [selectedImgIndex, setSelectedImgIndex] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [addedSuccess, setAddedSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [imgErrorId, setImgErrorId] = useState(null);

  // Fetch product from backend on mount
  useEffect(() => {
    let isMounted = true;

    getProductById(id)
      .then((data) => {
        if (!isMounted) return;
        if (data && data.active !== false) {
          const canonical = CANONICAL_PRODUCTS.find(
            (p) => p.id === id || p.name?.toLowerCase() === data.name?.toLowerCase()
          );
          setProduct({
            description: canonical?.description || 'Authentic traditional grocery essential.',
            ...data,
          });
          if (data.variants && data.variants.length > 0) {
            const firstActive = data.variants.findIndex((v) => v && v.active !== false);
            setSelectedVariantIndex(firstActive >= 0 ? firstActive : 0);
          }
        } else {
          setProduct(null);
          setError('This product is no longer available or has been removed.');
        }
      })
      .catch((err) => {
        if (!isMounted) return;
        console.warn('Product not found in backend:', err);
        setProduct(null);
        setError('Unable to load product details or product not found.');
      })
      .finally(() => {
        if (isMounted) setLoading(false);
      });

    return () => {
      isMounted = false;
    };
  }, [id]);

  // Derived gallery images (up to 4 images)
  const allImages = useMemo(() => {
    if (!product) return [placeholderImg];

    let images = [];
    if (Array.isArray(product.imageUrls) && product.imageUrls.length > 0) {
      images = product.imageUrls.filter(Boolean);
    } else {
      const single = getProductImage(product);
      if (single) images.push(single);
    }

    if (images.length === 0) {
      images.push(placeholderImg);
    }

    // Support up to 4 images in gallery
    return images.slice(0, 4);
  }, [product]);

  // Computed variant fields
  const variants = useMemo(() => {
    return Array.isArray(product?.variants) ? product.variants : [];
  }, [product]);

  const hasVariants = variants.length > 0;
  const currentVariant = hasVariants ? (variants[selectedVariantIndex] || variants[0]) : null;

  const rawPrice = currentVariant?.price;
  const rawMrp = currentVariant?.mrp;
  const rawStock = currentVariant?.stock;

  const hasValidPrice = typeof rawPrice === 'number' && rawPrice > 0;
  const hasValidMrp = typeof rawMrp === 'number' && rawMrp > 0;
  const price = hasValidPrice ? rawPrice : null;
  const mrp = hasValidMrp ? rawMrp : null;

  const hasDiscount = hasValidPrice && hasValidMrp && mrp > price;
  const discountPercent = hasDiscount ? Math.round(((mrp - price) / mrp) * 100) : 0;
  const savings = hasDiscount ? (mrp - price).toFixed(2) : null;

  const hasStockCount = typeof rawStock === 'number';
  const inStock = hasStockCount ? rawStock > 0 : true;

  const currentProductId = product?.id || id;
  const hasImgError = imgErrorId === currentProductId;

  const activeImgSrc = hasImgError
    ? placeholderImg
    : allImages[selectedImgIndex] || allImages[0] || placeholderImg;

  // Handlers
  const handlePrevImage = () => {
    setSelectedImgIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  };

  const handleNextImage = () => {
    setSelectedImgIndex((prev) => (prev + 1) % allImages.length);
  };

  const handleDecrement = () => {
    setQuantity((prev) => Math.max(1, prev - 1));
  };

  const handleIncrement = () => {
    setQuantity((prev) => Math.min(99, prev + 1));
  };

  const handleQuantityChange = (e) => {
    const val = parseInt(e.target.value, 10);
    if (!isNaN(val) && val >= 1 && val <= 99) {
      setQuantity(val);
    } else if (e.target.value === '') {
      setQuantity(1);
    }
  };

  const handleAddToCart = () => {
    if (!hasVariants || !currentVariant || !hasValidPrice) return;

    addToCart(product, currentVariant, quantity);
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
    }, 2200);
  };

  // Render Loading State
  if (loading) {
    return (
      <div className="product-details-page">
        <div className="container product-details-state">
          <div className="spinner" />
          <p className="state-title">Loading product details...</p>
        </div>
      </div>
    );
  }

  // Render Error State
  if (error || !product) {
    return (
      <div className="product-details-page">
        <div className="container product-details-state">
          <Package size={48} className="error-icon" />
          <h2 className="state-title">Product Not Found</h2>
          <p className="state-desc">{error || 'The requested product could not be located in our catalog.'}</p>
          <Link to="/products" className="btn btn-primary">
            <ArrowLeft size={16} />
            <span>Back to All Products</span>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="product-details-page">
      <div className="container">
        {/* Navigation Breadcrumb */}
        <div className="details-breadcrumb">
          <Link to="/" className="breadcrumb-link">Home</Link>
          <span className="breadcrumb-separator">/</span>
          <Link to="/products" className="breadcrumb-link">Products</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{product.name}</span>
        </div>

        {/* 2-Column Product Layout */}
        <div className="product-details-grid">
          {/* Left Column: Multi-image Gallery */}
          <div className="product-gallery-card">
            <div className="main-image-viewport">
              <img
                key={`${currentProductId}-${selectedImgIndex}`}
                src={activeImgSrc}
                alt={getProductAlt(product)}
                className="main-display-image"
                onError={() => setImgErrorId(currentProductId)}
              />

              {/* Prev / Next controls on main image when multiple exist */}
              {allImages.length > 1 && (
                <>
                  <button
                    type="button"
                    className="gallery-nav-arrow arrow-left"
                    onClick={handlePrevImage}
                    aria-label="Previous image"
                  >
                    <ChevronLeft size={20} />
                  </button>
                  <button
                    type="button"
                    className="gallery-nav-arrow arrow-right"
                    onClick={handleNextImage}
                    aria-label="Next image"
                  >
                    <ChevronRight size={20} />
                  </button>
                </>
              )}

              {/* Authentic Quality Stamp */}
              <div className="gallery-stamp">
                <Sparkles size={13} />
                <span>Sri Rudra</span>
              </div>
            </div>

            {/* Thumbnail Strip (supports up to 4 images) */}
            {allImages.length > 1 && (
              <div className="gallery-thumbnails-strip" role="tablist" aria-label="Product thumbnails">
                {allImages.map((thumbUrl, idx) => (
                  <button
                    key={idx}
                    type="button"
                    role="tab"
                    aria-selected={selectedImgIndex === idx}
                    className={`gallery-thumb-item ${selectedImgIndex === idx ? 'active' : ''}`}
                    onClick={() => {
                      setSelectedImgIndex(idx);
                      setImgErrorId(null);
                    }}
                    aria-label={`View photo ${idx + 1}`}
                  >
                    <img
                      src={thumbUrl}
                      alt={`${product.name} thumbnail ${idx + 1}`}
                      className="thumb-image"
                    />
                  </button>
                ))}
              </div>
            )}

            {/* Packaging Guarantee Note */}
            <div className="gallery-footer-note">
              <ShieldCheck size={16} className="note-icon" />
              <span>Hygienically packaged by Munaga Anilkumar Traders, Rajahmundry</span>
            </div>
          </div>

          {/* Right Column: Product Information & Controls */}
          <div className="product-info-column">
            <div className="product-category-chip">
              {product.categoryName || 'Authentic Grocery'}
            </div>

            <h1 className="product-info-title">{product.name}</h1>

            <p className="product-info-description">
              {product.description || 'Authentic grocery staple sourced with care for daily Indian home cooking.'}
            </p>

            {/* Pricing Section */}
            <div className="product-pricing-box">
              {hasValidPrice ? (
                <>
                  <div className="pricing-primary-row">
                    <span className="pricing-current">₹{price.toFixed(2)}</span>
                    {hasDiscount && (
                      <span className="pricing-mrp">₹{mrp.toFixed(2)}</span>
                    )}
                    {hasDiscount && (
                      <span className="badge badge-discount">{discountPercent}% OFF</span>
                    )}
                  </div>
                  {savings && (
                    <p className="pricing-savings-note">
                      You save: <strong>₹{savings}</strong> (Inclusive of all taxes)
                    </p>
                  )}
                </>
              ) : (
                <div className="pricing-primary-row">
                  <span className="pricing-pending-badge">Price available soon</span>
                </div>
              )}
            </div>

            {/* Variants / Pack Sizes Selector */}
            {hasVariants ? (
              <div className="variants-selector-box">
                <label className="variants-label">Select Pack Size / Weight:</label>
                <div className="variants-btn-group" role="radiogroup">
                  {variants.map((v, index) => {
                    const isSelected = index === selectedVariantIndex;
                    const vHasPrice = typeof v.price === 'number' && v.price > 0;
                    return (
                      <button
                        key={v.variantId || index}
                        type="button"
                        role="radio"
                        aria-checked={isSelected}
                        className={`variant-option-btn ${isSelected ? 'selected' : ''}`}
                        onClick={() => setSelectedVariantIndex(index)}
                      >
                        <span className="variant-weight-text">{v.weight || 'Standard Pack'}</span>
                        {vHasPrice ? (
                          <span className="variant-price-text">₹{v.price.toFixed(2)}</span>
                        ) : (
                          <span className="variant-pending-text">Price pending</span>
                        )}
                        {isSelected && <CheckCircle2 size={15} className="variant-check-icon" />}
                      </button>
                    );
                  })}
                </div>
              </div>
            ) : (
              <div className="unconfigured-pack-notice">
                <Store size={18} className="notice-icon" />
                <div>
                  <strong>Pack Size &amp; Pricing In Preparation</strong>
                  <p>Standard packaging weights and online ordering for {product.name} are currently being configured.</p>
                </div>
              </div>
            )}

            {/* Quantity Selector (when variants exist) */}
            {hasVariants && (
              <div className="quantity-selection-row">
                <label htmlFor="quantity-input" className="quantity-label">Quantity:</label>
                <div className="quantity-stepper-box">
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={handleDecrement}
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    <Minus size={15} />
                  </button>
                  <input
                    id="quantity-input"
                    type="number"
                    min="1"
                    max="99"
                    value={quantity}
                    onChange={handleQuantityChange}
                    className="stepper-input"
                  />
                  <button
                    type="button"
                    className="stepper-btn"
                    onClick={handleIncrement}
                    disabled={quantity >= 99}
                    aria-label="Increase quantity"
                  >
                    <Plus size={15} />
                  </button>
                </div>
              </div>
            )}

            {/* Stock Status */}
            <div className="stock-indicator-row">
              <Package size={17} />
              <span>
                Availability:{' '}
                {hasStockCount ? (
                  inStock ? (
                    <strong className="in-stock-text">In Stock ({rawStock} units available)</strong>
                  ) : (
                    <strong className="out-of-stock-text">Temporarily Out of Stock</strong>
                  )
                ) : (
                  <strong className="in-stock-text">
                    {hasVariants ? 'Available for Packaging' : 'Fresh Stock in Preparation'}
                  </strong>
                )}
              </span>
            </div>

            {/* Action Button: Add to Cart */}
            <div className="details-actions-area">
              {hasVariants && hasValidPrice ? (
                <>
                  <button
                    type="button"
                    className={`btn btn-primary btn-add-cart ${addedSuccess ? 'success-anim' : ''}`}
                    onClick={handleAddToCart}
                  >
                    {addedSuccess ? (
                      <>
                        <Check size={18} />
                        <span>Added to Cart ({quantity})</span>
                      </>
                    ) : (
                      <>
                        <ShoppingCart size={18} />
                        <span>Add to Cart</span>
                      </>
                    )}
                  </button>
                  <p className="cart-reassurance-text">
                    Hygienically sealed and dispatched fresh from Rajahmundry.
                  </p>
                </>
              ) : (
                <>
                  <button
                    type="button"
                    className="btn btn-primary btn-add-cart"
                    disabled
                  >
                    <ShoppingCart size={18} />
                    <span>Price Available Soon</span>
                  </button>
                  <p className="cart-reassurance-text">
                    Online ordering will activate once prices are published for this pack.
                  </p>
                </>
              )}
            </div>

            {/* Trust Assurances */}
            <div className="details-trust-points">
              <div className="trust-point-item">
                <ShieldCheck size={18} className="point-icon" />
                <span>100% Genuine Sri Rudra Quality</span>
              </div>
              <div className="trust-point-item">
                <Truck size={18} className="point-icon" />
                <span>Shop No. B-40, S V G Market, Rajahmundry</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductDetails;
