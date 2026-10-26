import { useEffect, useState } from 'react';
import { Link, useLocation, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useSettings } from '../context/SettingsContext.jsx';
import {
  formatDate,
  formatDateTime,
  formatToman,
  ORDER_STATUS,
  PAYMENT_STATUS,
  telHref,
  toPersianDigits,
  whatsappHref,
} from '../lib/format.js';
import { useSeo } from '../lib/seo.js';
import { Crumbs, StatusBadge } from '../components/ui/Display.jsx';
import { Button, ButtonLink } from '../components/ui/Button.jsx';
import { Field, Input } from '../components/ui/Form.jsx';
import { Loading, Notice } from '../components/ui/Feedback.jsx';
import { Icon } from '../components/ui/Icons.jsx';

export default function OrderStatus() {
  const { code } = useParams();
  const location = useLocation();
  const { seo, phone, whatsapp, payment } = useSettings();
  const [order, setOrder] = useState(location.state?.order ?? null);
  const [phoneInput, setPhoneInput] = useState('');
  const [state, setState] = useState({ loading: !location.state?.order, busy: false, error: null });

  useSeo({
    title: `وضعیت سفارش ${code} | کناف کرج`,
    description: 'مشاهده وضعیت سفارش، اقلام و وضعیت پرداخت.',
    path: `/order/${code}`,
    siteUrl: seo.site_url,
    siteName: 'کناف کرج',
  });

  useEffect(() => {
    if (order) return;
    setState({ loading: false, busy: false, error: null });
  }, [order]);

  const fetchOrder = async (event) => {
    event.preventDefault();
    setState({ loading: false, busy: true, error: null });
    try {
      const res = await api.get(`/orders/track?code=${encodeURIComponent(code)}&phone=${encodeURIComponent(phoneInput)}`);
      setOrder(res.order);
      setState({ loading: false, busy: false, error: null });
    } catch (error) {
      setState({ loading: false, busy: false, error: error.message });
    }
  };

  if (state.loading) return <div className="container section"><Loading label="در حال دریافت سفارش…" /></div>;

  if (!order) {
    return (
      <div className="container section">
        <Crumbs items={[{ name: 'پیگیری سفارش', path: '/order' }, { name: code }]} />
        <h1>مشاهده وضعیت سفارش</h1>
        <p className="muted" style={{ maxWidth: '70ch' }}>
          برای مشاهده جزئیات این سفارش، شماره تماسی که در سفارش ثبت شده است را وارد کنید.
        </p>
        <form className="form" style={{ maxWidth: '420px' }} onSubmit={fetchOrder}>
          {state.error ? <Notice variant="error">{state.error}</Notice> : null}
          <Field label="شماره تماس" htmlFor="status-phone" required>
            <Input
              id="status-phone"
              value={phoneInput}
              onChange={(event) => setPhoneInput(event.target.value)}
              inputMode="tel"
              required
            />
          </Field>
          <Button type="submit" variant="primary" busy={state.busy}>
            مشاهده سفارش
          </Button>
        </form>
      </div>
    );
  }

  const paid = order.payment_status === 'paid';

  return (
    <div className="container section">
      <Crumbs items={[{ name: 'پیگیری سفارش', path: '/order' }, { name: order.order_number }]} />

      {location.state?.message ? <Notice variant="success" title={location.state.message}>{null}</Notice> : null}

      <div className="row row--between row--wrap" style={{ alignItems: 'flex-end' }}>
        <div>
          <h1 style={{ marginBottom: '8px' }}>سفارش {order.order_number}</h1>
          <span className="muted small">شماره پیگیری: {order.tracking_code} — ثبت در {formatDateTime(order.created_at)}</span>
        </div>
        <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
          <StatusBadge map={ORDER_STATUS} value={order.order_status} />
          <StatusBadge map={PAYMENT_STATUS} value={order.payment_status} />
        </div>
      </div>

      <div className="mt-6" style={{ maxWidth: '860px' }}>
        <Notice variant={paid ? 'success' : 'info'} title={paid ? 'پرداخت این سفارش ثبت شده است.' : 'این سفارش هنوز پرداخت‌نشده است.'}>
          {paid
            ? 'وضعیت پرداخت توسط مدیر تأیید شده است.'
            : payment.online_enabled
              ? 'در صورت پرداخت آنلاین، وضعیت پس از تأیید درگاه به‌روزرسانی می‌شود.'
              : 'درگاه پرداخت آنلاین در این سایت فعال نیست؛ تسویه پس از هماهنگی با مجموعه انجام می‌گیرد. بازگشت شما به این صفحه به معنای پرداخت موفق نیست.'}
        </Notice>

        <div className="panel mt-4">
          <h2 className="panel__title">اقلام سفارش</h2>
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>محصول</th>
                  <th>تعداد</th>
                  <th>قیمت واحد</th>
                  <th>جمع</th>
                </tr>
              </thead>
              <tbody>
                {order.items.map((item) => (
                  <tr key={item.product_id}>
                    <td className="table__wrap-cell">
                      <Link to={`/product/${item.slug}`}>{item.name}</Link>
                    </td>
                    <td>{toPersianDigits(item.quantity)}</td>
                    <td>{formatToman(item.unit_price)}</td>
                    <td>{formatToman(item.line_total)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="stack stack--sm mt-4">
            <div className="summary-row">
              <span>جمع کالاها</span>
              <span>{formatToman(order.subtotal)}</span>
            </div>
            <div className="summary-row">
              <span>تخفیف</span>
              <span>{order.discount > 0 ? formatToman(order.discount) : '—'}</span>
            </div>
            <div className="summary-row">
              <span>هزینه ارسال</span>
              <span>{order.shipping_cost > 0 ? formatToman(order.shipping_cost) : 'پس از هماهنگی'}</span>
            </div>
            <div className="summary-row summary-row--total">
              <span>مبلغ کل</span>
              <span>{formatToman(order.total)}</span>
            </div>
          </div>
        </div>

        <div className="panel">
          <h2 className="panel__title">مراحل سفارش</h2>
          <ul className="status-timeline">
            {order.history?.length ? (
              order.history.map((entry, index) => (
                <li className="status-timeline__item" key={`${entry.status}-${index}`}>
                  <span className="status-timeline__dot" aria-hidden="true" />
                  <div>
                    <StatusBadge map={ORDER_STATUS} value={entry.status} />
                    {entry.note ? <div className="small">{entry.note}</div> : null}
                    <div className="status-timeline__time">{formatDateTime(entry.created_at)}</div>
                  </div>
                </li>
              ))
            ) : (
              <li className="muted small">مرحله‌ای برای این سفارش ثبت نشده است.</li>
            )}
          </ul>
        </div>

        <div className="panel">
          <h2 className="panel__title">اطلاعات ارسال</h2>
          <ul className="fact-grid" style={{ marginTop: 0 }}>
            <li className="fact">
              <span className="fact__label">نام خریدار</span>
              <span className="fact__value">{order.customer_name}</span>
            </li>
            <li className="fact">
              <span className="fact__label">شماره تماس</span>
              <span className="fact__value">{toPersianDigits(order.phone)}</span>
            </li>
            <li className="fact">
              <span className="fact__label">شهر</span>
              <span className="fact__value">{order.city || '—'}</span>
            </li>
            <li className="fact">
              <span className="fact__label">کد پستی</span>
              <span className="fact__value">{order.postal_code ? toPersianDigits(order.postal_code) : '—'}</span>
            </li>
            <li className="fact" style={{ gridColumn: '1 / -1' }}>
              <span className="fact__label">نشانی</span>
              <span className="fact__value">{order.address || '—'}</span>
            </li>
            {order.note ? (
              <li className="fact" style={{ gridColumn: '1 / -1' }}>
                <span className="fact__label">توضیحات سفارش</span>
                <span className="fact__value">{order.note}</span>
              </li>
            ) : null}
          </ul>
          <span className="form__note">تاریخ ثبت: {formatDate(order.created_at)}</span>
        </div>

        <div className="form__actions">
          <ButtonLink to="/shop" variant="secondary">
            <Icon name="arrowLeft" size={16} />
            ادامه خرید
          </ButtonLink>
          {phone ? (
            <a className="btn btn--secondary" href={telHref(phone)}>
              <Icon name="phone" size={16} />
              تماس با پشتیبانی
            </a>
          ) : null}
          {whatsapp ? (
            <a
              className="btn btn--secondary"
              href={whatsappHref(whatsapp, `سلام، درباره سفارش ${order.order_number} سؤال داشتم.`)}
              target="_blank"
              rel="noreferrer noopener"
            >
              <Icon name="whatsapp" size={16} />
              واتساپ
            </a>
          ) : null}
        </div>
      </div>
    </div>
  );
}
