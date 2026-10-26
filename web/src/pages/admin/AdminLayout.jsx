import { NavLink, Outlet, Navigate, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext.jsx';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useAsync } from '../../lib/hooks.js';
import { api } from '../../lib/api.js';
import { formatNumber } from '../../lib/format.js';
import { Button } from '../../components/ui/Button.jsx';
import { Loading, Notice } from '../../components/ui/Feedback.jsx';
import { Icon } from '../../components/ui/Icons.jsx';

const LINKS = [
  { to: '/admin', label: 'داشبورد', icon: 'grid', end: true },
  { to: '/admin/products', label: 'محصولات', icon: 'package' },
  { to: '/admin/categories', label: 'دسته‌بندی‌ها', icon: 'layers' },
  { to: '/admin/orders', label: 'سفارش‌ها', icon: 'cart', badge: 'orders_open' },
  { to: '/admin/requests', label: 'درخواست‌ها', icon: 'clipboardCheck', badge: 'requests' },
  { to: '/admin/portfolio', label: 'نمونه‌کارها', icon: 'image' },
  { to: '/admin/reviews', label: 'نظرات', icon: 'star', badge: 'reviews_pending' },
  { to: '/admin/content', label: 'محتوای صفحات', icon: 'edit' },
  { to: '/admin/settings', label: 'تنظیمات', icon: 'settings' },
  { to: '/admin/reports', label: 'گزارش‌ها و مشتریان', icon: 'chart' },
];

export default function AdminLayout() {
  const { user, loading, logout } = useAuth();
  const { brand } = useSettings();
  const navigate = useNavigate();
  const { data } = useAsync(
    async () => (user?.role === 'admin' ? api.get('/admin/summary') : null),
    [user?.id],
    { immediate: Boolean(user?.role === 'admin') },
  );

  if (loading) return <div className="container section"><Loading label="در حال بررسی دسترسی…" /></div>;
  if (user?.role !== 'admin') return <Navigate to="/admin/login" replace />;

  const badges = {
    orders_open: data?.counts?.orders_open,
    requests: data?.counts?.project_requests_new,
    reviews_pending: data?.counts?.reviews_pending,
  };

  return (
    <div className="admin">
      <aside className="admin__side">
        <div className="admin__brand">
          <img src={brand.logo || '/images/brand/logo.svg'} alt={`لوگوی ${brand.name_fa}`} />
          <div>
            <div style={{ fontWeight: 700 }}>پنل مدیریت</div>
            <span className="muted small">{brand.name_fa}</span>
          </div>
        </div>

        <nav className="admin__nav" aria-label="منوی پنل مدیریت">
          {LINKS.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end}
              className={({ isActive }) => `admin__nav-link${isActive ? ' admin__nav-link--active' : ''}`}
            >
              <span className="row" style={{ gap: '10px' }}>
                <Icon name={link.icon} size={18} />
                {link.label}
              </span>
              {link.badge && badges[link.badge] ? (
                <span className="admin__nav-count">{formatNumber(badges[link.badge])}</span>
              ) : null}
            </NavLink>
          ))}
        </nav>

        <div className="stack stack--sm" style={{ marginTop: 'auto' }}>
          <NavLink className="admin__nav-link" to="/">
            <span className="row" style={{ gap: '10px' }}>
              <Icon name="external" size={18} />
              مشاهده سایت
            </span>
          </NavLink>
          <Button
            variant="ghost"
            onClick={async () => {
              await logout();
              navigate('/admin/login', { replace: true });
            }}
          >
            <Icon name="logout" size={18} />
            خروج از حساب
          </Button>
          <span className="muted small">کاربر: {user.username}</span>
        </div>
      </aside>

      <main className="admin__main">
        {user.must_change_password ? (
          <div style={{ marginBottom: 'var(--sp-5)' }}>
            <Notice variant="warn" title="رمز عبور پیش‌فرض هنوز تغییر نکرده است">
              این حساب با رمز عبور پیش‌فرض توسعه‌دهنده ایجاد شده است. برای امنیت بیشتر، از بخش «تنظیمات» رمز عبور را
              تغییر دهید.
            </Notice>
          </div>
        ) : null}
        <Outlet />
      </main>
    </div>
  );
}
