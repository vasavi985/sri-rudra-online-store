import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';

const CustomerLayout = () => {
  return (
    <div className="customer-shell">
      <Navbar />
      <main className="main-content">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
};

export default CustomerLayout;
