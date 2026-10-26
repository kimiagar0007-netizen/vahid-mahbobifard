import { useAsync } from '../../lib/hooks.js';
import { api } from '../../lib/api.js';
import { formatDateTime, formatNumber, formatToman, toPersianDigits } from '../../lib/format.js';
import { Loading, Notice } from '../../components/ui/Feedback.jsx';

export default function AdminReports() {
  const { data, loading, error } = useAsync(() => api.get('/admin/summary'), []);
  const customers = useAsync(() => api.get('/admin/customers'), []);
  const unpriced = useAsync(() => api.get('/admin/products?only_unpriced=1'), []);

  if (loading) return <Loading label="در حال تهیه گزارش‌ها…" />;
  if (error) return <Notice variant="error">{error}</Notice>;

  return (
    <>
      <div className="admin__topbar">
        <div>
          <h1 className="admin__title">گزارش‌ها و مشتریان</h1>
          <p className="admin__subtitle">آمار پایه فروش، مشتریان و محصولات نیازمند قیمت‌گذاری</p>
        </div>
      </div>

      <div className="stat-grid">
        <div className="stat-card">
          <span className="stat-card__label">کل سفارش‌ها</span>
          <span className="stat-card__value">{formatNumber(data.counts.orders)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">سفارش‌های پرداخت‌شده</span>
          <span className="stat-card__value">{formatNumber(data.counts.orders_paid)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">درخواست‌های اجرا</span>
          <span className="stat-card__value">{formatNumber(data.counts.project_requests)}</span>
        </div>
        <div className="stat-card">
          <span className="stat-card__label">درخواست‌های عمده</span>
          <span className="stat-card__value">{formatNumber(data.counts.wholesale_requests)}</span>
        </div>
      </div>

      <div className="panel">
        <h2 className="panel__title">خلاصه مالی</h2>
        <div className="stack stack--sm">
          <div className="summary-row">
            <span>مجموع مبلغ سفارش‌ها (بدون سفارش آزمایشی)</span>
            <span>{formatToman(data.revenue.orders_total)}</span>
          </div>
          <div className="summary-row">
            <span>سفارش‌های تکمیل‌شده</span>
            <span>{formatToman(data.revenue.completed_total)}</span>
          </div>
          <div className="summary-row">
            <span>در انتظار پرداخت</span>
            <span>{formatToman(data.revenue.awaiting_payment)}</span>
          </div>
        </div>
      </div>

      <div className="panel panel--flush">
        <div className="panel__head" style={{ padding: 'var(--sp-5) var(--sp-5) 0' }}>
          <h2 className="panel__title">مشتریان</h2>
          <span className="form__note">شماره تماس مشتریان تنها برای مدیران مجاز قابل مشاهده است.</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>نام</th>
                <th>تلفن</th>
                <th>تعداد سفارش</th>
                <th>مجموع خرید</th>
                <th>درخواست اجرا</th>
                <th>آخرین سفارش</th>
              </tr>
            </thead>
            <tbody>
              {customers.data?.items?.length ? (
                customers.data.items.map((customer) => (
                  <tr key={customer.phone}>
                    <td>{customer.name}</td>
                    <td>{toPersianDigits(customer.phone)}</td>
                    <td>{formatNumber(customer.orders_count)}</td>
                    <td>{formatToman(customer.orders_total)}</td>
                    <td>{formatNumber(customer.requests_count)}</td>
                    <td className="muted small">{formatDateTime(customer.last_order_at)}</td>
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

      <div className="panel panel--flush">
        <div className="panel__head" style={{ padding: 'var(--sp-5) var(--sp-5) 0' }}>
          <h2 className="panel__title">محصولات نیازمند قیمت‌گذاری</h2>
          <span className="form__note">تا ثبت قیمت، خرید این محصولات غیرفعال می‌ماند.</span>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>محصول</th>
                <th>دسته‌بندی</th>
                <th>وضعیت انتشار</th>
              </tr>
            </thead>
            <tbody>
              {unpriced.data?.items?.length ? (
                unpriced.data.items.map((product) => (
                  <tr key={product.id}>
                    <td className="table__wrap-cell">{product.name}</td>
                    <td>{product.category?.name || '—'}</td>
                    <td>{product.is_published ? 'منتشرشده' : 'منتشرنشده'}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={3} className="muted">همه محصولات قیمت ثبت‌شده دارند.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="panel panel--flush">
        <div className="panel__head" style={{ padding: 'var(--sp-5) var(--sp-5) 0' }}>
          <h2 className="panel__title">سوابق تغییرات</h2>
        </div>
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>کاربر</th>
                <th>عملیات</th>
                <th>موضوع</th>
                <th>جزئیات</th>
                <th>زمان</th>
              </tr>
            </thead>
            <tbody>
              {data.activity.map((entry) => (
                <tr key={entry.id}>
                  <td>{entry.actor || 'سیستم'}</td>
                  <td>{entry.action}</td>
                  <td>{entry.entity || '—'}</td>
                  <td className="table__wrap-cell">{entry.details || '—'}</td>
                  <td className="muted small">{formatDateTime(entry.created_at)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
