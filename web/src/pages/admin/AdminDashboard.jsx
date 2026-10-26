import { Link } from 'react-router-dom';
import { useAsync } from '../../lib/hooks.js';
import { api } from '../../lib/api.js';
import { formatDateTime, formatNumber, formatToman, ORDER_STATUS, PAYMENT_STATUS } from '../../lib/format.js';
import { StatusBadge } from '../../components/ui/Display.jsx';
import { ButtonLink } from '../../components/ui/Button.jsx';
import { Loading, Notice } from '../../components/ui/Feedback.jsx';
import { Icon } from '../../components/ui/Icons.jsx';

export default function AdminDashboard() {
  const { data, loading, error } = useAsync(() => api.get('/admin/summary'), []);

  if (loading) return <Loading label="در حال دریافت گزارش‌ها…" />;
  if (error) return <Notice variant="error">دریافت اطلاعات داشبورد ناموفق بود: {error}</Notice>;

  const counts = data.counts;
  const revenue = data.revenue;

  const stats = [
    { label: 'سفارش‌های باز', value: counts.orders_open, to: '/admin/orders', alert: counts.orders_open > 0 },
    { label: 'کل سفارش‌ها', value: counts.orders },
    { label: 'درخواست اجرای جدید', value: counts.project_requests_new, to: '/admin/requests', alert: counts.project_requests_new > 0 },
    { label: 'درخواست عمده جدید', value: counts.wholesale_requests_new, to: '/admin/requests', alert: counts.wholesale_requests_new > 0 },
    { label: 'محصولات', value: counts.products },
    { label: 'محصولات بدون قیمت', value: counts.products_without_price, to: '/admin/products', alert: counts.products_without_price > 0 },
    { label: 'نظرات در انتظار تأیید', value: counts.reviews_pending, to: '/admin/reviews', alert: counts.reviews_pending > 0 },
    { label: 'نمونه‌کارها', value: counts.portfolio, to: '/admin/portfolio' },
  ];

  return (
    <>
      <div className="admin__topbar">
        <div>
          <h1 className="admin__title">داشبورد</h1>
          <p className="admin__subtitle">وضعیت فروشگاه، درخواست‌ها و موارد نیازمند تنظیم</p>
        </div>
        <div className="admin__actions">
          <ButtonLink to="/admin/products" variant="primary" size="sm">
            <Icon name="plus" size={16} />
            افزودن محصول
          </ButtonLink>
        </div>
      </div>

      <div className="stat-grid">
        {stats.map((stat) => (
          <div className={`stat-card${stat.alert ? ' stat-card--alert' : ''}`} key={stat.label}>
            <span className="stat-card__label">{stat.label}</span>
            <span className="stat-card__value">{formatNumber(stat.value)}</span>
            {stat.to ? (
              <Link className="small gold" to={stat.to}>
                مشاهده
              </Link>
            ) : null}
          </div>
        ))}
      </div>

      <div className="panel">
        <h2 className="panel__title">موارد نیازمند تنظیم</h2>
        {data.warnings.length ? (
          <ul className="warning-list">
            {data.warnings.map((warning) => (
              <li className="warning-list__item" key={warning.key}>
                <Icon name="alert" size={18} />
                <div>
                  {warning.label}
                  <span>{warning.hint}</span>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted small">همه تنظیمات ضروری تکمیل شده است.</p>
        )}
      </div>

      <div className="stat-grid" style={{ gridTemplateColumns: 'repeat(3, minmax(0,1fr))' }}>
        <div className="stat-card">
          <span className="stat-card__label">مجموع سفارش‌ها (بدون سفارش آزمایشی)</span>
          <span className="stat-card__value">{formatToman(revenue.orders_total)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">سفارش‌های تکمیل‌شده</span>
          <span className="stat-card__value">{formatToman(revenue.completed_total)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">در انتظار پرداخت</span>
          <span className="stat-card__value">{formatToman(revenue.awaiting_payment)}</span>
        </div>
      </div>

      <div className="panel panel--flush">
        <div className="panel__head" style={{ padding: 'var(--sp-5) var(--sp-5) 0' }}>
          <h2 className="panel__title">آخرین سفارش‌ها</h2>
          <ButtonLink to="/admin/orders" variant="ghost" size="sm">
            همه سفارش‌ها
          </ButtonLink>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>شماره سفارش</th>
                <th>مشتری</th>
                <th>مبلغ</th>
                <th>پرداخت</th>
                <th>وضعیت</th>
                <th>تاریخ</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.length ? (
                data.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td>
                      <Link to="/admin/orders">{order.order_number}</Link>
                      {order.is_test ? <span className="badge badge--warn" style={{ marginInlineStart: '8px' }}>آزمایشی</span> : null}
                    </td>
                    <td>{order.customer_name}</td>
                    <td>{formatToman(order.total)}</td>
                    <td><StatusBadge map={PAYMENT_STATUS} value={order.payment_status} /></td>
                    <td><StatusBadge map={ORDER_STATUS} value={order.order_status} /></td>
                    <td>{formatDateTime(order.created_at)}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={6} className="muted">هنوز سفارشی ثبت نشده است.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid--2">
        <div className="panel">
          <div className="panel__head">
            <h2 className="panel__title">آخرین درخواست‌های اجرای پروژه</h2>
            <ButtonLink to="/admin/requests" variant="ghost" size="sm">همه درخواست‌ها</ButtonLink>
          </div>
          {data.recentRequests.length ? (
            <ul className="activity-list">
              {data.recentRequests.map((request) => (
                <li className="activity-list__item" key={request.id}>
                  <span>
                    {request.customer_name} — {request.service_type}
                  </span>
                  <span className="activity-list__time">
                    {request.tracking_code} · {formatDateTime(request.created_at)}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted small">هنوز درخواستی ثبت نشده است.</p>
          )}
        </div>

        <div className="panel">
          <div className="panel__head">
            <h2 className="panel__title">آخرین تغییرات پنل</h2>
            <ButtonLink to="/admin/reports" variant="ghost" size="sm">گزارش کامل</ButtonLink>
          </div>
          {data.activity.length ? (
            <ul className="activity-list">
              {data.activity.map((entry) => (
                <li className="activity-list__item" key={entry.id}>
                  <span>
                    {entry.actor || 'سیستم'} — {entry.action}
                    {entry.details ? ` (${entry.details})` : ''}
                  </span>
                  <span className="activity-list__time">{formatDateTime(entry.created_at)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="muted small">فعالیتی ثبت نشده است.</p>
          )}
        </div>
      </div>
    </>
  );
}
