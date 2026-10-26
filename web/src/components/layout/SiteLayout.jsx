import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header.jsx';
import Footer from './Footer.jsx';
import FloatContact from './FloatContact.jsx';

export default function SiteLayout() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'auto' });
  }, [pathname]);

  return (
    <div className="site">
      <a className="btn btn--primary btn--sm visually-hidden" href="#main">
        پرش به محتوای اصلی
      </a>
      <Header />
      <main className="site__main" id="main">
        <Outlet />
      </main>
      <Footer />
      <FloatContact />
    </div>
  );
}
