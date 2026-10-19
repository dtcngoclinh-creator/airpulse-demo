import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import Navbar from './Navbar.jsx';
import Footer from './Footer.jsx';
import MobileTabBar from './MobileTabBar.jsx';
import CompareTray from '../flights/CompareTray.jsx';

function ScrollManager() {
  const { pathname, hash } = useLocation();
  useEffect(() => {
    if (hash) {
      const el = document.getElementById(decodeURIComponent(hash.slice(1)));
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'start' });
        return;
      }
    }
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' });
  }, [pathname, hash]);
  return null;
}

export default function Layout({ children }) {
  const { pathname } = useLocation();
  return (
    <div className="app">
      <a href="#main" className="skip-link">
        Bỏ qua tới nội dung chính
      </a>
      <ScrollManager />
      <Navbar />
      <main id="main" className="page" key={pathname}>
        {children}
      </main>
      <Footer />
      <CompareTray />
      <MobileTabBar />
    </div>
  );
}
