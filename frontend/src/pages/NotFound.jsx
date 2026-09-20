import { Link } from 'react-router-dom';
import { Compass, Home } from 'lucide-react';
import './PlaceholderPage.css';

const NotFound = () => {
  return (
    <div className="placeholder-page">
      <div className="container">
        <div className="placeholder-card">
          <div className="placeholder-icon-wrap">
            <Compass size={48} className="placeholder-icon" />
          </div>
          <span className="placeholder-badge">404 ERROR</span>
          <h1 className="placeholder-title">Page Not Found</h1>
          <p className="placeholder-desc">
            The page or pantry item you are looking for might have been moved or is currently unavailable.
          </p>
          <div className="placeholder-action">
            <Link to="/" className="btn btn-primary">
              <Home size={16} />
              <span>Return to Home</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
