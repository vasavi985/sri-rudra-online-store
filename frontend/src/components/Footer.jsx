import { Link } from 'react-router-dom';
import {
  ShieldCheck,
  PackageCheck,
  Truck,
  Phone,
  MapPin,
  Clock,
  Mail
} from 'lucide-react';
import sriRudraLogo from '../assets/sri-rudra-logo.png';
import godavariBridge from '../assets/godavari-bridge.png';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer-wrapper">
      {/* 1. Value / Trust Assurance Bar */}
      <div className="footer-trust-strip">
        <div className="container trust-strip-content">
          <div className="trust-strip-item">
            <ShieldCheck size={22} className="trust-strip-icon" />
            <div>
              <h4 className="trust-strip-title">Authentic Quality</h4>
              <p className="trust-strip-sub">Carefully selected everyday traditional grocery staples</p>
            </div>
          </div>
          <div className="trust-strip-item">
            <PackageCheck size={22} className="trust-strip-icon" />
            <div>
              <h4 className="trust-strip-title">Traditional Purity</h4>
              <p className="trust-strip-sub">Freshly packed flours and dals for honest home cooking</p>
            </div>
          </div>
          <div className="trust-strip-item">
            <Truck size={22} className="trust-strip-icon" />
            <div>
              <h4 className="trust-strip-title">Doorstep Convenience</h4>
              <p className="trust-strip-sub">Easily browse and order pantry items online</p>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Main Footer Grid */}
      <div className="footer-main-area">
        {/* Subtle Faded Bridge Background Layer */}
        <div className="footer-bridge-bg" aria-hidden="true">
          <img
            src={godavariBridge}
            alt=""
            className="footer-bridge-img"
          />
          <div className="footer-bridge-overlay" />
        </div>

        <div className="container footer-columns-grid">
          {/* Col 1: Brand & Firm Identity */}
          <div className="footer-col brand-col">
            <div className="footer-brand-header">
              <div className="footer-logo-box">
                <img
                  src={sriRudraLogo}
                  alt="Sri Rudra Logo"
                  className="footer-logo-img"
                />
              </div>
              <div className="footer-brand-text">
                <span className="footer-brand-title">SRI RUDRA</span>
                <span className="footer-brand-subtitle">Munaga Anilkumar Traders</span>
              </div>
            </div>

            <p className="footer-brand-description">
              Your trusted partner for quality groceries and traditional food products. Sourced with care and packaged cleanly for everyday Indian homes.
            </p>

            <div className="footer-tagline-chip">
              <span>Good Food, Brighter Days</span>
            </div>
          </div>

          {/* Col 2: Quick Links */}
          <div className="footer-col links-col">
            <h4 className="footer-heading">Quick Links</h4>
            <ul className="footer-link-list">
              <li><Link to="/">Home</Link></li>
              <li><Link to="/products">Products</Link></li>
              <li><Link to="/orders">Orders</Link></li>
              <li><Link to="/cart">Shopping Cart</Link></li>
            </ul>
          </div>

          {/* Col 3: Store Location & Contact Information */}
          <div className="footer-col contact-col">
            <h4 className="footer-heading">Store &amp; Contact</h4>
            <div className="footer-store-details">
              <strong className="firm-name">Munaga Anilkumar Traders</strong>
              <div className="footer-detail-line">
                <MapPin size={16} className="detail-icon" />
                <address className="store-address">
                  Shop No. B-40, S V G Market,<br />
                  Near RTC Complex,<br />
                  Rajahmundry, E.G. Dist.,<br />
                  Andhra Pradesh, India
                </address>
              </div>

              <div className="footer-detail-line phones-line">
                <Phone size={16} className="detail-icon" />
                <div className="phone-links-wrap">
                  <a href="tel:9949406863" className="phone-link">9949406863</a>
                  <span className="phone-sep">|</span>
                  <a href="tel:9246650441" className="phone-link">9246650441</a>
                </div>
              </div>

              <div className="footer-detail-line hours-line">
                <Clock size={16} className="detail-icon" />
                <span>Market Hours: Mon – Sat (9 AM – 9 PM)</span>
              </div>

              <div className="footer-detail-line email-line">
                <Mail size={16} className="detail-icon" />
                <a href="mailto:srirudra28@gmail.com" className="footer-contact-link">
                  srirudra28@gmail.com
                </a>
              </div>

              <div className="footer-detail-line location-line">
                <MapPin size={16} className="detail-icon" />
                <a
                  href="https://maps.app.goo.gl/SFsmc24ub2LFNBM99"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="footer-contact-link location-link"
                >
                  View Location
                </a>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 3. Footer Bottom Bar */}
      <div className="footer-bottom-bar">
        <div className="container bottom-bar-container">
          <p className="copyright-text">
            &copy; {new Date().getFullYear()} SRI RUDRA • Munaga Anilkumar Traders. All rights reserved.
          </p>
          <p className="regional-badge">
            S V G Market, Rajahmundry, Andhra Pradesh
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
