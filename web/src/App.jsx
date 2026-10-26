import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { SettingsProvider } from './context/SettingsContext.jsx';
import { AuthProvider } from './context/AuthContext.jsx';
import { CartProvider } from './context/CartContext.jsx';
import SiteLayout from './components/layout/SiteLayout.jsx';
import Home from './pages/Home.jsx';
import Shop from './pages/Shop.jsx';
import ProductDetail from './pages/ProductDetail.jsx';
import Cart from './pages/Cart.jsx';
import Checkout from './pages/Checkout.jsx';
import OrderTracking from './pages/OrderTracking.jsx';
import OrderStatus from './pages/OrderStatus.jsx';
import Services from './pages/Services.jsx';
import ServiceDetail from './pages/ServiceDetail.jsx';
import ProjectInquiry from './pages/ProjectInquiry.jsx';
import Portfolio from './pages/Portfolio.jsx';
import Wholesale from './pages/Wholesale.jsx';
import Contact from './pages/Contact.jsx';
import Faq from './pages/Faq.jsx';
import ContentPage from './pages/ContentPage.jsx';
import NotFound from './pages/NotFound.jsx';
import AdminLogin from './pages/admin/AdminLogin.jsx';
import AdminLayout from './pages/admin/AdminLayout.jsx';
import AdminDashboard from './pages/admin/AdminDashboard.jsx';
import AdminProducts from './pages/admin/AdminProducts.jsx';
import AdminCategories from './pages/admin/AdminCategories.jsx';
import AdminOrders from './pages/admin/AdminOrders.jsx';
import AdminRequests from './pages/admin/AdminRequests.jsx';
import AdminPortfolio from './pages/admin/AdminPortfolio.jsx';
import AdminReviews from './pages/admin/AdminReviews.jsx';
import AdminContent from './pages/admin/AdminContent.jsx';
import AdminSettings from './pages/admin/AdminSettings.jsx';
import AdminReports from './pages/admin/AdminReports.jsx';

export default function App() {
  return (
    <BrowserRouter>
      <SettingsProvider>
        <AuthProvider>
          <CartProvider>
            <Routes>
              <Route element={<SiteLayout />}>
                <Route path="/" element={<Home />} />
                <Route path="/shop" element={<Shop />} />
                <Route path="/category/:slug" element={<Shop />} />
                <Route path="/product/:slug" element={<ProductDetail />} />
                <Route path="/cart" element={<Cart />} />
                <Route path="/checkout" element={<Checkout />} />
                <Route path="/order" element={<OrderTracking />} />
                <Route path="/order/:code" element={<OrderStatus />} />
                <Route path="/services" element={<Services />} />
                <Route path="/services/:slug" element={<ServiceDetail />} />
                <Route path="/portfolio" element={<Portfolio />} />
                <Route path="/project-inquiry" element={<ProjectInquiry />} />
                <Route path="/wholesale" element={<Wholesale />} />
                <Route path="/about" element={<ContentPage slug="about" eyebrow="درباره ما" />} />
                <Route path="/terms" element={<ContentPage slug="terms" eyebrow="قوانین و شرایط خرید" />} />
                <Route path="/privacy" element={<ContentPage slug="privacy" eyebrow="حریم خصوصی" />} />
                <Route path="/contact" element={<Contact />} />
                <Route path="/faq" element={<Faq />} />
                <Route path="*" element={<NotFound />} />
              </Route>

              <Route path="/admin/login" element={<AdminLogin />} />
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<AdminDashboard />} />
                <Route path="products" element={<AdminProducts />} />
                <Route path="categories" element={<AdminCategories />} />
                <Route path="orders" element={<AdminOrders />} />
                <Route path="requests" element={<AdminRequests />} />
                <Route path="portfolio" element={<AdminPortfolio />} />
                <Route path="reviews" element={<AdminReviews />} />
                <Route path="content" element={<AdminContent />} />
                <Route path="settings" element={<AdminSettings />} />
                <Route path="reports" element={<AdminReports />} />
                <Route path="*" element={<Navigate to="/admin" replace />} />
              </Route>
            </Routes>
          </CartProvider>
        </AuthProvider>
      </SettingsProvider>
    </BrowserRouter>
  );
}
