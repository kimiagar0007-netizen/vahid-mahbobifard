import { useState } from 'react';
import { api, qs } from '../../lib/api.js';
import { useAsync } from '../../lib/hooks.js';
import {
  formatDateTime,
  formatNumber,
  formatToman,
  ORDER_STATUS,
  PAYMENT_STATUS,
  toPersianDigits,
} from '../../lib/format.js';
import { Badge, StatusBadge } from '../../components/ui/Display.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { CheckboxInput, Field, Input, Select, Textarea } from '../../components/ui/Form.jsx';
import { EmptyState, Loading, Notice } from '../../components/ui/Feedback.jsx';
import { Icon } from '../../components/ui/Icons.jsx';

export default function AdminOrders() {
  const [filters, setFilters] = useState({ q: '', order_status: '', payment_status: '' });
  const [detail, setDetail] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: '', note: '', payment_status: '' });
  const [state, setState] = useState({ busy: false, error: null });
  const [notice, setNotice] = useState(null);

  const { data, loading, error, reload } = useAsync(
    () =>
      api.get(
        `/admin/orders${qs({
          q: filters.q,
          order_status: filters.order_status,
          payment_status: filters.payment_status,
        })}`,
      ),
    [filters.q, filters.order_status, filters.payment_status],
  );

  const items = data?.items ?? [];

  const openDetail = async (order) => {
    setState({ busy: false, error: null });
    setDetail(order);
    setStatusForm({ status: order.order_status, note: '', payment_status: order.payment_status });
    try {
      const res = await api.get(`/admin/orders/${order.id}`);
      setDetail(res.item);
    } catch (requestError) {
      setState({ busy: false, error: requestError.message });
    }
  };

  const patch = async (payload) => {
    setState({ busy: true, error: null });
    try {
      const res = await api.patch(`/admin/orders/${detail.id}`, payload);
      setDetail(res.item);
      setStatusForm((current) => ({ ...current, status: res.item.order_status, payment_status: res.item.payment_status, note: '' }));
      setNotice({ variant: 'success', text: 'سفارش به‌روزرسانی شد.' });
      reload();
    } catch (requestError) {
      setState({ busy: false, error: requestError.message });
      return;
    }
    setState({ busy: false, error: null });
  };

  const remove = async (order) => {
    if (!window.confirm(`سفارش ${order.order_number} حذف شود؟`)) return;
    try {
      await api.del(`/admin/orders/${order.id}`);
      setDetail(null);
      setNotice({ variant: 'success', text: 'سفارش حذف شد.' });
      reload();
    } catch (requestError) {
      setNotice({ variant: 'error', text: requestError.message });
    }
  };

  return (
    <>
      <div className="admin__topbar">
        <div>
          <h1 className="admin__title">سفارش‌ها</h1>
          <p className="admin__subtitle">پیگیری سفارش‌ها، تغییر وضعیت و بررسی وضعیت پرداخت</p>
        </div>
      </div>

      {notice ? (
        <div style={{ marginBottom: 'var(--sp-4)' }}>
          <Notice variant={notice.variant}>{notice.text}</Notice>
        </div>
      ) : null}

      <div className="toolbar">
        <Input
          aria-label="جست‌وجوی سفارش"
          placeholder="شماره سفارش، پیگیری، نام یا تلفن…"
          value={filters.q}
          onChange={(event) => setFilters({ ...filters, q: event.target.value })}
        />
        <Select
          aria-label="وضعیت سفارش"
          value={filters.order_status}
          onChange={(event) => setFilters({ ...filters, order_status: event.target.value })}
        >
          <option value="">همه وضعیت‌ها</option>
          {Object.entries(ORDER_STATUS).map(([value, meta]) => (
            <option key={value} value={value}>
              {meta.label}
            </option>
          ))}
        </Select>
        <Select
          aria-label="وضعیت پرداخت"
          value={filters.payment_status}
          onChange={(event) => setFilters({ ...filters, payment_status: event.target.value })}
        >
          <option value="">همه پرداخت‌ها</option>
          {Object.entries(PAYMENT_STATUS).map(([value, meta]) => (
            <option key={value} value={value}>
              {meta.label}
            </option>
          ))}
        </Select>
      </div>

      {loading ? <Loading label="در حال دریافت سفارش‌ها…" /> : null}
      {error ? <Notice variant="error">{error}</Notice> : null}

      {!loading && !error ? (
        items.length ? (
          <div className="panel panel--flush">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>شماره سفارش</th>
                    <th>مشتری</th>
                    <th>تلفن</th>
                    <th>مبلغ</th>
                    <th>پرداخت</th>
                    <th>وضعیت</th>
                    <th>تاریخ</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((order) => (
                    <tr key={order.id}>
                      <td>
                        {order.order_number}
                        <div className="muted small">{order.tracking_code}</div>
                        {order.is_test ? <Badge tone="warn">آزمایشی</Badge> : null}
                      </td>
                      <td>{order.customer_name}</td>
                      <td>{toPersianDigits(order.phone)}</td>
                      <td>{formatToman(order.total)}</td>
                      <td><StatusBadge map={PAYMENT_STATUS} value={order.payment_status} /></td>
                      <td><StatusBadge map={ORDER_STATUS} value={order.order_status} /></td>
                      <td className="muted small">{formatDateTime(order.created_at)}</td>
                      <td>
                        <Button variant="secondary" size="sm" onClick={() => openDetail(order)}>
                          <Icon name="search" size={16} />
                          جزئیات
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState title="سفارشی با این فیلترها پیدا نشد" icon={<Icon name="cart" size={26} />} />
        )
      ) : null}

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} wide title={detail ? `سفارش ${detail.order_number}` : ''}>
        {detail ? (
          <div className="drawer">
            {state.error ? <Notice variant="error">{state.error}</Notice> : null}

            <div className="row row--wrap" style={{ gap: 'var(--sp-4)' }}>
              <StatusBadge map={ORDER_STATUS} value={detail.order_status} />
              <StatusBadge map={PAYMENT_STATUS} value={detail.payment_status} />
              {detail.is_test ? <Badge tone="warn">سفارش آزمایشی</Badge> : null}
              <span className="muted small">ثبت: {formatDateTime(detail.created_at)}</span>
            </div>

            <div className="panel panel--flush" style={{ marginBottom: 0 }}>
              <div className="table-wrap">
                <table className="table table--compact">
                  <thead>
                    <tr>
                      <th>محصول</th>
                      <th>تعداد</th>
                      <th>قیمت واحد</th>
                      <th>جمع</th>
                    </tr>
                  </thead>
                  <tbody>
                    {detail.items.map((item) => (
                      <tr key={item.product_id}>
                        <td className="table__wrap-cell">{item.name}</td>
                        <td>{formatNumber(item.quantity)}</td>
                        <td>{formatToman(item.unit_price)}</td>
                        <td>{formatToman(item.line_total)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="stack stack--sm">
              <div className="summary-row"><span>جمع کالاها</span><span>{formatToman(detail.subtotal)}</span></div>
              <div className="summary-row"><span>تخفیف</span><span>{formatToman(detail.discount)}</span></div>
              <div className="summary-row"><span>هزینه ارسال</span><span>{formatToman(detail.shipping_cost)}</span></div>
              <div className="summary-row summary-row--total"><span>مبلغ کل</span><span>{formatToman(detail.total)}</span></div>
            </div>

            <ul className="fact-grid" style={{ margin: 0 }}>
              <li className="fact"><span className="fact__label">نام خریدار</span><span className="fact__value">{detail.customer_name}</span></li>
              <li className="fact"><span className="fact__label">تلفن</span><span className="fact__value">{toPersianDigits(detail.phone)}</span></li>
              <li className="fact"><span className="fact__label">شهر</span><span className="fact__value">{detail.city || '—'}</span></li>
              <li className="fact"><span className="fact__label">کد پستی</span><span className="fact__value">{detail.postal_code ? toPersianDigits(detail.postal_code) : '—'}</span></li>
              <li className="fact" style={{ gridColumn: '1 / -1' }}><span className="fact__label">نشانی</span><span className="fact__value">{detail.address || '—'}</span></li>
              {detail.note ? (
                <li className="fact" style={{ gridColumn: '1 / -1' }}><span className="fact__label">توضیحات مشتری</span><span className="fact__value">{detail.note}</span></li>
              ) : null}
            </ul>

            <div className="grid grid--2">
              <Field label="تغییر وضعیت سفارش" htmlFor="o-status">
                <Select id="o-status" value={statusForm.status} onChange={(event) => setStatusForm({ ...statusForm, status: event.target.value })}>
                  {Object.entries(ORDER_STATUS).map(([value, meta]) => (
                    <option key={value} value={value}>{meta.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="تغییر وضعیت پرداخت" htmlFor="o-payment">
                <Select
                  id="o-payment"
                  value={statusForm.payment_status}
                  onChange={(event) => setStatusForm({ ...statusForm, payment_status: event.target.value })}
                >
                  {Object.entries(PAYMENT_STATUS).map(([value, meta]) => (
                    <option key={value} value={value}>{meta.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="یادداشت تغییر وضعیت" htmlFor="o-note" full>
                <Textarea
                  id="o-note"
                  value={statusForm.note}
                  onChange={(event) => setStatusForm({ ...statusForm, note: event.target.value })}
                  placeholder="این متن در تاریخچه سفارش ثبت می‌شود."
                />
              </Field>
            </div>

            <div className="form__actions">
              <Button
                variant="primary"
                busy={state.busy}
                onClick={() =>
                  patch({
                    status: statusForm.status,
                    payment_status: statusForm.payment_status,
                    note: statusForm.note || undefined,
                  })
                }
              >
                ذخیره تغییرات
              </Button>
              <Button variant="secondary" busy={state.busy} onClick={() => patch({ is_test: detail.is_test ? 0 : 1 })}>
                {detail.is_test ? 'حذف برچسب آزمایشی' : 'علامت‌گذاری به‌عنوان آزمایشی'}
              </Button>
              {detail.is_test ? (
                <Button variant="danger" onClick={() => remove(detail)}>
                  <Icon name="trash" size={16} />
                  حذف سفارش آزمایشی
                </Button>
              ) : null}
            </div>

            {detail.history?.length ? (
              <div>
                <h3 className="panel__title">تاریخچه وضعیت</h3>
                <ul className="status-timeline">
                  {detail.history.map((entry, index) => (
                    <li className="status-timeline__item" key={`${entry.status}-${index}`}>
                      <span className="status-timeline__dot" aria-hidden="true" />
                      <div>
                        <StatusBadge map={ORDER_STATUS} value={entry.status} />
                        {entry.note ? <div className="small">{entry.note}</div> : null}
                        <div className="status-timeline__time">
                          {entry.created_by || 'سیستم'} — {formatDateTime(entry.created_at)}
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <CheckboxInput id="o-privacy" label="اطلاعات این سفارش تنها برای مدیران مجاز قابل مشاهده است." checked readOnly />
          </div>
        ) : null}
      </Modal>
    </>
  );
}
