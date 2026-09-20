import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { getProductImage, getProductAlt, placeholderImg } from '../utils/productImages';
import './ProductCard.css';

const ProductCard = ({ product }) => {
  const [imgError, setImgError] = useState(false);

  if (!product) return null;

  const resolvedImage = getProductImage(product);
  const imgSrc = imgError ? placeholderImg : resolvedImage;

  const activeVariants = product.variants?.filter((v) => v.active !== false) || [];

  // Collect verified pack sizes / weights
  const verifiedWeights = activeVariants.map((v) => v.weight).filter(Boolean);
  const packSummary = verifiedWeights.length > 0
    ? (verifiedWeights.length === 1 ? `Pack: ${verifiedWeights[0]}` : `Packs: ${verifiedWeights.join(', ')}`)
    : product.categoryName || 'Authentic Grocery';

  // Only consider numeric prices > 0
  const pricedVariants = activeVariants.filter(
    (v) => typeof v.price === 'number' && v.price > 0
  );
  const hasValidPrice = pricedVariants.length > 0;

  let minPrice = 0;
  let matchingMrp = 0;

  if (hasValidPrice) {
    const sorted = [...pricedVariants].sort((a, b) => a.price - b.price);
    const lowest = sorted[0];
    minPrice = lowest.price;
    matchingMrp = typeof lowest.mrp === 'number' && lowest.mrp > 0 ? lowest.mrp : 0;
  }

  const hasDiscount = hasValidPrice && matchingMrp > minPrice && minPrice > 0;
  const discountPercent = hasDiscount
    ? Math.round(((matchingMrp - minPrice) / matchingMrp) * 100)
    : 0;

  return (
    <div className="product-card">
      {/* Quality or Discount Badge */}
      {hasDiscount ? (
        <span className="product-badge badge-discount">{discountPercent}% OFF</span>
      ) : (
        <span className="product-badge badge-quality">
          <Sparkles size={11} className="badge-sparkle-icon" /> Sri Rudra
        </span>
      )}

      {/* Product Image Container */}
      <Link to={`/products/${product.id}`} className="product-card-img-link" aria-label={`View ${product.name}`}>
        <div className="product-card-img-wrap">
          <img
            src={imgSrc}
            alt={getProductAlt(product)}
            className="product-card-img"
            loading="lazy"
            onError={() => setImgError(true)}
          />
        </div>
      </Link>

      {/* Card Content Body */}
      <div className="product-card-body">
        <span className="product-card-pack-info">{packSummary}</span>

        <h3 className="product-card-title">
          <Link to={`/products/${product.id}`} title={product.name}>
            {product.name}
          </Link>
        </h3>

        <p className="product-card-desc">
          {product.description || 'Authentic traditional grocery essential.'}
        </p>

        {/* Pricing Block */}
        <div className="product-card-pricing">
          {hasValidPrice ? (
            <div className="price-stack">
              <span className="price-label">Starting from</span>
              <div className="price-row">
                <span className="current-price">₹{minPrice.toFixed(2)}</span>
                {hasDiscount && (
                  <span className="original-mrp">₹{matchingMrp.toFixed(2)}</span>
                )}
              </div>
            </div>
          ) : (
            <div className="price-stack">
              <span className="price-label">Availability</span>
              <div className="price-row">
                <span className="price-pending">Price available soon</span>
              </div>
            </div>
          )}
        </div>

        {/* CTA Action */}
        <Link to={`/products/${product.id}`} className="btn btn-outline btn-view-product">
          <span>View Details</span>
          <ArrowRight size={15} />
        </Link>
      </div>
    </div>
  );
};

export default ProductCard;
