import { useState, useRef, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ChevronLeft, ChevronRight, ArrowRight } from 'lucide-react';
import ProductCard from './ProductCard';
import './ProductCarousel.css';

const ProductCarousel = ({ products = [] }) => {
  const scrollRef = useRef(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        setCanScrollLeft(scrollLeft > 10);
        setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);

        const cardWidth = 300;
        const index = Math.round(scrollLeft / cardWidth);
        setCurrentIndex(Math.min(index, products.length - 1));
      }
    };

    handleScroll();
    const el = scrollRef.current;
    if (el) {
      el.addEventListener('scroll', handleScroll);
      window.addEventListener('resize', handleScroll);
    }
    return () => {
      if (el) el.removeEventListener('scroll', handleScroll);
      window.removeEventListener('resize', handleScroll);
    };
  }, [products.length]);

  const scroll = (direction) => {
    if (scrollRef.current) {
      const { clientWidth } = scrollRef.current;
      const scrollAmount = direction === 'left' ? -clientWidth * 0.75 : clientWidth * 0.75;
      scrollRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  const scrollToIndex = (idx) => {
    if (scrollRef.current) {
      const cardWidth = 300; // estimated step
      scrollRef.current.scrollTo({ left: idx * cardWidth, behavior: 'smooth' });
      setCurrentIndex(idx);
    }
  };

  if (!products || products.length === 0) return null;

  // We show up to 10 curated products in the carousel
  const curatedProducts = products.slice(0, 10);
  const totalDots = Math.min(curatedProducts.length, 6);

  return (
    <section className="product-carousel-section" aria-label="Curated Kitchen Essentials">
      <div className="container">
        {/* Section Top Header with Controls */}
        <div className="carousel-header-row">
          <div className="carousel-heading-wrap">
            <span className="section-eyebrow">DAILY ESSENTIALS FOR YOUR KITCHEN</span>
            <h2 className="section-heading">Our Products</h2>
            <p className="section-subtext">
              Wholesome grains, pure flours, and roasted dals carefully sourced from Munaga Anilkumar Traders.
            </p>
          </div>

          <div className="carousel-nav-arrows">
            <button
              type="button"
              className="carousel-arrow-btn"
              onClick={() => scroll('left')}
              disabled={!canScrollLeft}
              aria-label="Previous products"
            >
              <ChevronLeft size={22} />
            </button>
            <button
              type="button"
              className="carousel-arrow-btn"
              onClick={() => scroll('right')}
              disabled={!canScrollRight}
              aria-label="Next products"
            >
              <ChevronRight size={22} />
            </button>
          </div>
        </div>

        {/* Horizontal Sliding Track */}
        <div className="product-carousel-track" ref={scrollRef}>
          {curatedProducts.map((product) => (
            <div key={product.id} className="carousel-card-item">
              <ProductCard product={product} />
            </div>
          ))}
        </div>

        {/* Bottom Pagination & Explore Link */}
        <div className="carousel-bottom-row">
          <div className="carousel-dots-list" role="tablist" aria-label="Product navigation">
            {Array.from({ length: totalDots }).map((_, idx) => (
              <button
                key={idx}
                type="button"
                role="tab"
                aria-selected={idx === Math.min(currentIndex, totalDots - 1)}
                className={`carousel-dot ${idx === Math.min(currentIndex, totalDots - 1) ? 'active' : ''}`}
                onClick={() => scrollToIndex(idx)}
                aria-label={`Go to product group ${idx + 1}`}
              />
            ))}
          </div>

          <Link to="/products" className="btn btn-outline carousel-view-all-btn">
            <span>View All Products</span>
            <ArrowRight size={16} />
          </Link>
        </div>
      </div>
    </section>
  );
};

export default ProductCarousel;
