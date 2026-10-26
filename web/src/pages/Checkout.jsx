import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useCart } from '../context/CartContext.jsx';
import { useSettings } from '../context/SettingsContext.jsx';
import { formatToman } from '../lib/format.js';
import { useSeo } from '../lib/seo.js';
import { Crumbs } from '../components/ui/Display.jsx';
import { Button, ButtonLink } from '../components/ui/Button.jsx';
import { CheckboxInput, Field, FormGrid, Input, Textarea } from '../components/ui/Form.jsx';
import { EmptyState, FieldErrors, Loading, Notice } from '../components/ui/Feedback.jsx';
import { Icon } from '../components/ui/Icons.jsx';

export default function Checkout() {
  const navigate = useNavigate();
  const { paymentMethods, payment } = useSettings();
  const { items, lines, totals, quoting, quoteError, clear } = useCart();
  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    email: '',
    city: '',
    address: '',
    postal_code: '',
    note: '',
  });
  const [paymentMethod, setPaymentMethod] = useState(paymentMethods[0]?.id ?? 'cod');
  const [privacy, setPrivacy] = useState(false);
  const [state, setState] = useState({ busy: false, error: null, fields: {}, problems: [] });

  useSeo({ title: 'تسویه‌حساب و ثبت سفارش | کناف کرج', description: 'تکمیل اطلاعات و ثبت سفارش محصولات کناف.' });

  if (!items.length) {
    return (
      <div className="container section">
        <EmptyState title="سبد خرید شما خالی است" icon={<Icon name="cart" size={28} />}
          action={<ButtonLink to="/shop" variant="primary">مشاهده محصولات</ButtonLink>}>
          برای ثبت سفارش، ابتدا محصولی را به سبد خرید اضافه کنید.
        </EmptyState>
      </div>
    );
  }

  const submit = async (event) => {
    event.preventDefault();
    setState({ busy: true, error: null, fields: {}, problems: [] });
    try {
      const res = await api.post('/orders', {
        ...form,
        payment_method: paymentMethod,
        privacy_accepted: privacy,
        items: items.map(({ product_id, quantity }) => ({ product_id, quantity })),
      });
      clear();
      navigate(`/order/${res.order.tracking_code}`, { state: { order: res.order, message: res.message }, replace: true });
    } catch (error) {
      setState({
        busy: false,
        error: error.message,
        fields: error.fields ?? {},
        problems: error.payload?.problems ?? [],
      });
    }
  };

  return (
    <div className="container section">
      <Crumbs items={[{ name: 'سبد خرید', path: '/cart' }, { name: 'تسویه‌حساب' }]} />
      <h1>تسویه‌حساب و ثبت سفارش</h1>

      <div className="checkout-layout mt-6">
        <form className="form" onSubmit={submit} noValidate>
          {state.error ? (
            <Notice variant="error" title="ثبت سفارش انجام نشد">
              {state.error}
              {state.problems.length ? (
                <ul style={{ marginBottom: 0 }}>
                  {state.problems.map((problem, index) => (
                    <li key={`${problem.product_id}-${index}`}>
                      {problem.name ? `${problem.name}: ` : ''}
                      {problem.reason}
                    </li>
                  ))}
                </ul>
              ) : null}
            </Notice>
          ) : null}
          {Object.keys(state.fields).length ? <FieldErrors fields={state.fields} /> : null}

          <div className="panel" style={{ marginBottom: 0 }}>
            <h2 className="panel__title">اطلاعات خریدار</h2>
            <FormGrid>
              <Field label="نام و نام خانوادگی" htmlFor="co-name" required error={state.fields.customer_name}>
                <Input
                  id="co-name"
                  value={form.customer_name}
                  invalid={Boolean(state.fields.customer_name)}
                  onChange={(event) => setForm({ ...form, customer_name: event.target.value })}
                  autoComplete="name"
                  required
                />
              </Field>
              <Field label="شماره تماس" htmlFor="co-phone" required error={state.fields.phone} hint="نمونه: ۰۹۱۲۳۴۵۶۷۸۹">
                <Input
                  id="co-phone"
                  value={form.phone}
                  invalid={Boolean(state.fields.phone)}
                  onChange={(event) => setForm({ ...form, phone: event.target.value })}
                  inputMode="tel"
                  autoComplete="tel"
                  required
                />
              </Field>
              <Field label="ایمیل (اختیاری)" htmlFor="co-email" error={state.fields.email}>
                <Input
                  id="co-email"
                  value={form.email}
                  invalid={Boolean(state.fields.email)}
                  onChange={(event) => setForm({ ...form, email: event.target.value })}
                  inputMode="email"
                  autoComplete="email"
                />
              </Field>
              <Field label="شهر" htmlFor="co-city" required error={state.fields.city}>
                <Input
                  id="co-city"
                  value={form.city}
                  invalid={Boolean(state.fields.city)}
                  onChange={(event) => setForm({ ...form, city: event.target.value })}
                  autoComplete="address-level2"
                  required
                />
              </Field>
              <Field label="نشانی کامل" htmlFor="co-address" required error={state.fields.address} full>
                <Textarea
                  id="co-address"
                  value={form.address}
                  invalid={Boolean(state.fields.address)}
                  onChange={(event) => setForm({ ...form, address: event.target.value })}
                  autoComplete="street-address"
                  required
                />
              </Field>
              <Field label="کد پستی (اختیاری)" htmlFor="co-postal" error={state.fields.postal_code}>
                <Input
                  id="co-postal"
                  value={form.postal_code}
                  invalid={Boolean(state.fields.postal_code)}
                  onChange={(event) => setForm({ ...form, postal_code: event.target.value })}
                  inputMode="numeric"
                />
              </Field>
              <Field label="توضیحات سفارش (اختیاری)" htmlFor="co-note" error={state.fields.note} full>
                <Textarea id="co-note" value={form.note} onChange={(event) => setForm({ ...form, note: event.target.value })} />
              </Field>
            </FormGrid>
          </div>

          <div className="panel" style={{ marginBottom: 0 }}>
            <h2 className="panel__title">روش پرداخت</h2>
            <div className="payment-options">
              {paymentMethods.map((method) => (
                <label
                  key={method.id}
                  className={`payment-option${paymentMethod === method.id ? ' payment-option--active' : ''}`}
                >
                  <input
                    type="radio"
                    name="payment_method"
                    value={method.id}
                    checked={paymentMethod === method.id}
                    onChange={() => setPaymentMethod(method.id)}
                  />
                  <span>
                    <strong>{method.title}</strong>
                    <span className="form__note" style={{ display: 'block' }}>
                      {method.id === 'online'
                        ? payment.online_enabled
                          ? 'پرداخت از طریق درگاه آنلاین انجام می‌شود.'
                          : 'درگاه پرداخت آنلاین فعال نشده است.'
                        : 'پس از ثبت سفارش، همکاران ما برای هماهنگی پرداخت با شما تماس می‌گیرند.'}
                    </span>
                  </span>
                </label>
              ))}
              {!payment.online_enabled ? (
                <Notice variant="info">
                  درگاه پرداخت آنلاین هنوز تنظیم نشده است؛ سفارش شما با وضعیت «پرداخت‌نشده» ثبت می‌شود و تسویه پس از
                  هماهنگی انجام می‌گیرد. هیچ پرداخت موفقی پیش از اتصال درگاه ثبت نمی‌شود.
                </Notice>
              ) : null}
            </div>

            <div className="mt-4">
              <CheckboxInput
                id="co-privacy"
                checked={privacy}
                onChange={(event) => setPrivacy(event.target.checked)}
                label="سیاست حفظ حریم خصوصی و قوانین خرید را مطالعه کرده و می‌پذیرم."
              />
              {state.fields.privacy_accepted ? <span className="field__error">{state.fields.privacy_accepted}</span> : null}
            </div>
          </div>

          <div className="form__actions">
            <Button type="submit" variant="primary" size="lg" busy={state.busy}>
              <Icon name="checkCircle" size={18} />
              ثبت سفارش
            </Button>
            <ButtonLink to="/cart" variant="ghost">
              بازگشت به سبد خرید
            </ButtonLink>
          </div>
        </form>

        <aside className="cart-summary" aria-label="خلاصه سفارش">
          <h2 style={{ fontSize: 'var(--fs-md)' }}>خلاصه سفارش</h2>
          {quoting && !lines.length ? <Loading label="در حال محاسبه…" /> : null}
          {quoteError ? <Notice variant="error">{quoteError}</Notice> : null}
          <ul className="stack stack--sm" style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {lines.map((line) => (
              <li className="summary-row" key={line.product_id}>
                <span>
                  {line.name} × {line.quantity}
                </span>
                <span>{formatToman(line.line_total)}</span>
              </li>
            ))}
          </ul>
          <div className="summary-row">
            <span>جمع کالاها</span>
            <span>{formatToman(totals.subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>تخفیف</span>
            <span>{totals.discount > 0 ? formatToman(totals.discount) : '—'}</span>
          </div>
          <div className="summary-row">
            <span>هزینه ارسال</span>
            <span>{totals.shipping > 0 ? formatToman(totals.shipping) : 'پس از هماهنگی'}</span>
          </div>
          <div className="summary-row summary-row--total">
            <span>مبلغ نهایی</span>
            <span>{formatToman(totals.total)}</span>
          </div>
        </aside>
      </div>
    </div>
  );
}
