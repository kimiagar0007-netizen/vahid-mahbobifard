import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useSettings } from '../context/SettingsContext.jsx';
import {
  formatDateTime,
  PROJECT_TYPES,
  PREFERRED_CONTACT,
  REQUEST_STATUS,
  formatDate,
  formatToman,
  ORDER_STATUS as ORDER_STATUS_MAP,
  PAYMENT_STATUS as PAYMENT_STATUS_MAP,
} from '../lib/format.js';
import { useSeo } from '../lib/seo.js';
import { Crumbs, StatusBadge } from '../components/ui/Display.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Field, Input } from '../components/ui/Form.jsx';
import { Loading, Notice } from '../components/ui/Feedback.jsx';
import { Icon } from '../components/ui/Icons.jsx';

export default function OrderTracking() {
  const { seo, phone } = useSettings();
  const [tab, setTab] = useState('order');

  const [orderForm, setOrderForm] = useState({ code: '', phone: '' });
  const [orderState, setOrderState] = useState({ busy: false, error: null, order: null });

  const [requestForm, setRequestForm] = useState({ code: '', phone: '' });
  const [requestState, setRequestState] = useState({ busy: false, error: null, request: null });

  useSeo({
    title: 'پیگیری سفارش و درخواست پروژه | کناف کرج',
    description: 'با شماره پیگیری و شماره تماس، وضعیت سفارش یا درخواست اجرای پروژه خود را ببینید.',
    path: '/order',
    siteUrl: seo.site_url,
    siteName: 'کناف کرج',
  });

  const track = async (event, kind) => {
    event.preventDefault();
    const isOrder = kind === 'order';
    const form = isOrder ? orderForm : requestForm;
    const setState = isOrder ? setOrderState : setRequestState;
    setState({ busy: true, error: null, order: null, request: null });
    try {
      const res = await api.get(
        `${isOrder ? '/orders/track' : '/requests/track'}?code=${encodeURIComponent(form.code)}&phone=${encodeURIComponent(form.phone)}`,
      );
      setState(isOrder
        ? { busy: false, error: null, order: res.order }
        : { busy: false, error: null, request: res.request });
    } catch (error) {
      setState({ busy: false, error: error.message, order: null, request: null });
    }
  };

  return (
    <div className="container section">
      <Crumbs items={[{ name: 'پیگیری سفارش' }]} />
      <h1>ثبت و پیگیری سفارش</h1>
      <p className="muted" style={{ maxWidth: '70ch' }}>
        برای مشاهده وضعیت، شماره پیگیری و شماره تماسی که ثبت کرده‌اید را وارد کنید. این اطلاعات برای حفظ حریم خصوصی
        سفارش‌ها الزامی است.
      </p>

      <div className="admin__tabs mt-6" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'order'}
          className={`admin__tab${tab === 'order' ? ' admin__tab--active' : ''}`}
          onClick={() => setTab('order')}
        >
          پیگیری سفارش محصولات
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'request'}
          className={`admin__tab${tab === 'request' ? ' admin__tab--active' : ''}`}
          onClick={() => setTab('request')}
        >
          پیگیری درخواست اجرای پروژه
        </button>
      </div>

      {tab === 'order' ? (
        <div className="grid grid--2" style={{ alignItems: 'start', gap: '48px' }}>
          <form className="form" onSubmit={(event) => track(event, 'order')}>
            {orderState.error ? <Notice variant="error">{orderState.error}</Notice> : null}
            <Field label="شماره پیگیری سفارش" htmlFor="track-code" required hint="نمونه: KK-4F9A2C">
              <Input
                id="track-code"
                value={orderForm.code}
                onChange={(event) => setOrderForm({ ...orderForm, code: event.target.value })}
                required
              />
            </Field>
            <Field label="شماره تماس ثبت‌شده در سفارش" htmlFor="track-phone" required>
              <Input
                id="track-phone"
                value={orderForm.phone}
                onChange={(event) => setOrderForm({ ...orderForm, phone: event.target.value })}
                inputMode="tel"
                required
              />
            </Field>
            <Button type="submit" variant="primary" busy={orderState.busy}>
              <Icon name="search" size={18} />
              مشاهده وضعیت سفارش
            </Button>
          </form>

          <div>
            {orderState.busy ? <Loading label="در حال بررسی…" /> : null}
            {orderState.order ? <OrderSummary order={orderState.order} /> : null}
            {!orderState.order && !orderState.busy ? (
              <div className="aside-card">
                <h2 style={{ fontSize: 'var(--fs-md)' }}>راهنمای پیگیری</h2>
                <p className="form__note" style={{ margin: 0 }}>
                  شماره پیگیری پس از ثبت سفارش به شما نمایش داده می‌شود و در ایمیل/پیام تأیید نیز ارسال می‌گردد.
                  در صورت نداشتن شماره پیگیری، از طریق اطلاعات تماس با ما در ارتباط باشید.
                </p>
                {phone ? (
                  <span className="row" style={{ gap: '8px' }}>
                    <Icon name="phone" size={16} />
                    <a href={`tel:${phone}`}>{phone}</a>
                  </span>
                ) : null}
              </div>
            ) : null}
          </div>
        </div>
      ) : (
        <div className="grid grid--2" style={{ alignItems: 'start', gap: '48px' }}>
          <form className="form" onSubmit={(event) => track(event, 'request')}>
            {requestState.error ? <Notice variant="error">{requestState.error}</Notice> : null}
            <Field label="کد پیگیری درخواست" htmlFor="track-req-code" required hint="نمونه: PR-8B2D1E">
              <Input
                id="track-req-code"
                value={requestForm.code}
                onChange={(event) => setRequestForm({ ...requestForm, code: event.target.value })}
                required
              />
            </Field>
            <Field label="شماره تماس ثبت‌شده در درخواست" htmlFor="track-req-phone" required>
              <Input
                id="track-req-phone"
                value={requestForm.phone}
                onChange={(event) => setRequestForm({ ...requestForm, phone: event.target.value })}
                inputMode="tel"
                required
              />
            </Field>
            <Button type="submit" variant="primary" busy={requestState.busy}>
              <Icon name="search" size={18} />
              مشاهده وضعیت درخواست
            </Button>
          </form>

          <div>
            {requestState.busy ? <Loading label="در حال بررسی…" /> : null}
            {requestState.request ? (
              <div className="track-result">
                <div className="row row--between">
                  <span className="card__meta">کد پیگیری</span>
                  <strong>{requestState.request.tracking_code}</strong>
                </div>
                <div className="row row--between">
                  <span className="card__meta">وضعیت</span>
                  <StatusBadge map={REQUEST_STATUS} value={requestState.request.status} />
                </div>
                <div className="row row--between">
                  <span className="card__meta">نوع پروژه</span>
                  <span>{PROJECT_TYPES[requestState.request.project_type] || '—'}</span>
                </div>
                <div className="row row--between">
                  <span className="card__meta">خدمت موردنیاز</span>
                  <span>{requestState.request.service_type}</span>
                </div>
                <div className="row row--between">
                  <span className="card__meta">محل پروژه</span>
                  <span>{requestState.request.location}</span>
                </div>
                <div className="row row--between">
                  <span className="card__meta">روش تماس ترجیحی</span>
                  <span>{PREFERRED_CONTACT[requestState.request.preferred_contact] || '—'}</span>
                </div>
                <div className="row row--between">
                  <span className="card__meta">تاریخ ثبت</span>
                  <span>{formatDateTime(requestState.request.created_at)}</span>
                </div>
                <Link className="btn btn--secondary btn--sm" to="/project-inquiry">
                  ثبت درخواست جدید
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      )}
    </div>
  );
}

function OrderSummary({ order }) {
  return (
    <div className="track-result">
      <div className="row row--between">
        <span className="card__meta">شماره سفارش</span>
        <strong>{order.order_number}</strong>
      </div>
      <div className="row row--between">
        <span className="card__meta">شماره پیگیری</span>
        <strong>{order.tracking_code}</strong>
      </div>
      <div className="row row--between">
        <span className="card__meta">وضعیت سفارش</span>
        <StatusBadge map={ORDER_STATUS_MAP} value={order.order_status} />
      </div>
      <div className="row row--between">
        <span className="card__meta">وضعیت پرداخت</span>
        <StatusBadge map={PAYMENT_STATUS_MAP} value={order.payment_status} />
      </div>
      <div className="row row--between">
        <span className="card__meta">مبلغ کل</span>
        <span>{formatToman(order.total)}</span>
      </div>
      <div className="row row--between">
        <span className="card__meta">تاریخ ثبت</span>
        <span>{formatDate(order.created_at)}</span>
      </div>
      <div>
        <span className="card__meta">اقلام سفارش</span>
        <ul className="stack stack--sm" style={{ marginTop: '8px' }}>
          {order.items.map((item) => (
            <li key={item.product_id}>
              {item.name} × {item.quantity} — {formatToman(item.line_total)}
            </li>
          ))}
        </ul>
      </div>
      <Link className="btn btn--secondary btn--sm" to={`/order/${order.tracking_code}`}>
        مشاهده جزئیات کامل سفارش
      </Link>
    </div>
  );
}

