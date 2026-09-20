import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { getProducts } from '../services/productService';
import { mergeProductsWithCatalog } from '../utils/productCatalog';
import HeroCarousel from '../components/HeroCarousel';
import BenefitsStrip from '../components/BenefitsStrip';
import ProductCarousel from '../components/ProductCarousel';
import {
  ArrowRight,
  ShieldCheck,
  PackageCheck,
  MapPin,
  Phone,
  Store,
  Sparkles,
  Heart
} from 'lucide-react';
import './Home.css';

const Home = () => {
  const [products, setProducts] = useState(() => mergeProductsWithCatalog([]));

  useEffect(() => {
    let isMounted = true;

    // Single-shot load on mount without repeated polling or loop
    getProducts()
      .then((remoteList) => {
        if (!isMounted) return;
        if (Array.isArray(remoteList)) {
          setProducts(mergeProductsWithCatalog(remoteList));
        }
      })
      .catch((err) => {
        // Fail gracefully without crashing or repeatedly retrying
        console.warn('Backend products not loaded, rendering canonical catalog:', err);
      });

    return () => {
      isMounted = false;
    };
  }, []);

  return (
    <div className="home-page">
      {/* =========================================================================
          1. HERO SECTION WITH CAROUSEL
         ========================================================================= */}
      <section className="hero-section" aria-label="Sri Rudra Welcome">
        <div className="container hero-container">
          {/* Left Column: Hero Content */}
          <div className="hero-content">
            <div className="hero-eyebrow-pill">
              <Sparkles size={14} className="eyebrow-icon" />
              <span>PURE GRAINS • TRADITIONAL FOODS • DAILY ESSENTIALS</span>
            </div>

            <h1 className="hero-title">
              Authentic Groceries <br />
              <span className="hero-title-accent">for a Healthier</span> <br />
              Happier Home
            </h1>

            <p className="hero-description">
              Quality grains, flours, dals and everyday essentials from <strong>Munaga Anilkumar Traders</strong>, Rajahmundry.
            </p>

            <div className="hero-cta-row">
              <Link to="/products" className="btn btn-primary hero-btn-main">
                <span>Shop Now</span>
                <ArrowRight size={18} />
              </Link>
              <Link to="/products" className="btn btn-outline hero-btn-sub">
                <span>View Products</span>
              </Link>
            </div>

            {/* Quick trust tags */}
            <div className="hero-micro-trust">
              <div className="micro-trust-item">
                <Store size={15} />
                <span>S V G Market, Rajahmundry</span>
              </div>
              <div className="micro-trust-item">
                <ShieldCheck size={15} />
                <span>Good Food, Brighter Days</span>
              </div>
            </div>
          </div>

          {/* Right Column: Hero Image Carousel */}
          <div className="hero-visual-column">
            <HeroCarousel />
          </div>
        </div>
      </section>

      {/* =========================================================================
          2. TRUST / BENEFITS STRIP (5 Items)
         ========================================================================= */}
      <BenefitsStrip />

      {/* =========================================================================
          3. OUR PRODUCTS HORIZONTAL CAROUSEL
         ========================================================================= */}
      <ProductCarousel products={products} />

      {/* =========================================================================
          4. ABOUT / STORE TRUST SECTION
         ========================================================================= */}
      <section className="about-trust-section" aria-label="About Sri Rudra">
        <div className="container">
          <div className="about-trust-card">
            <div className="about-content-left">
              <span className="section-eyebrow">ABOUT SRI RUDRA</span>
              <h2 className="about-title">
                Traditional Foods for Honest Family Cooking
              </h2>
              <p className="about-body-text">
                At <strong>Munaga Anilkumar Traders</strong>, trading under the brand <strong>SRI RUDRA</strong>, we believe that every healthy home begins with trustworthy pantry staples. Based in the heart of Rajahmundry, we supply the daily essentials that form the foundation of authentic South Indian cuisine — from stone-ground rice and gram flours to wholesome dals and granulated ravva.
              </p>
              <p className="about-body-text">
                Every pack is prepared with consistent attention to hygiene, texture, and freshness so your family enjoys wholesome meals every single day.
              </p>

              <div className="about-pillars-grid">
                <div className="pillar-item">
                  <div className="pillar-icon-wrap">
                    <PackageCheck size={20} />
                  </div>
                  <div>
                    <h4 className="pillar-heading">Hygienic Packaging</h4>
                    <p className="pillar-sub">Sealed carefully to preserve aroma and shelf life.</p>
                  </div>
                </div>

                <div className="pillar-item">
                  <div className="pillar-icon-wrap">
                    <Heart size={20} />
                  </div>
                  <div>
                    <h4 className="pillar-heading">Good Food, Brighter Days</h4>
                    <p className="pillar-sub">Bringing dependable daily food to Indian homes.</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="about-accent-badge">
              <div className="accent-inner-box">
                <span className="accent-sub">FOUNDED IN RAJAHMUNDRY</span>
                <h3 className="accent-brand">SRI RUDRA</h3>
                <p className="accent-trader">Munaga Anilkumar Traders</p>
                <div className="accent-tagline">
                  <span>"Good Food, Brighter Days"</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* =========================================================================
          5. LOCAL STORE & CONTACT SECTION
         ========================================================================= */}
      <section className="store-location-section" aria-label="Visit or Contact Our Store">
        <div className="container">
          <div className="store-location-frame">
            <div className="location-info-column">
              <span className="section-eyebrow">PHYSICAL STORE &amp; TRADE LOCATION</span>
              <h2 className="location-heading">Visit Munaga Anilkumar Traders</h2>
              <p className="location-desc">
                We welcome retail customers, families, and wholesale buyers to our established market location in Rajahmundry.
              </p>

              <div className="location-points-list">
                {/* Address Card */}
                <div className="location-point-item">
                  <div className="location-point-icon">
                    <MapPin size={22} />
                  </div>
                  <div className="location-point-content">
                    <span className="point-title">Store &amp; Packaging Location</span>
                    <address className="point-detail">
                      Shop No. B-40, S V G Market,<br />
                      Near RTC Complex,<br />
                      Rajahmundry, E.G. Dist., Andhra Pradesh, India
                    </address>
                  </div>
                </div>

                {/* Direct Phone Numbers */}
                <div className="location-point-item">
                  <div className="location-point-icon">
                    <Phone size={22} />
                  </div>
                  <div className="location-point-content">
                    <span className="point-title">Customer &amp; Trade Contact</span>
                    <div className="phone-links-group">
                      <a href="tel:9949406863" className="phone-number-link">
                        9949406863
                      </a>
                      <span className="phone-separator">•</span>
                      <a href="tel:9246650441" className="phone-number-link">
                        9246650441
                      </a>
                    </div>
                    <span className="phone-hint">Call us directly for product queries or order assistance</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Card: Quick Overview Box */}
            <div className="store-card-right">
              <div className="store-summary-box">
                <span className="summary-badge">SRI RUDRA STOREFRONT</span>
                <h3 className="summary-title">Daily Grocery Essentials</h3>
                <p className="summary-text">
                  Supplying authentic Toor Dal, Moong Dal, Garam Dal, Rice Flour, Gram Flour, Ragi Flour, Ravva varieties, and pantry essentials.
                </p>
                <div className="summary-actions">
                  <Link to="/products" className="btn btn-gold btn-block">
                    <span>Explore Products</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Home;
