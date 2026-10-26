import { useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { useSeo } from '../lib/seo.js';
import { Crumbs } from '../components/ui/Display.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Field, FormGrid, Input, Textarea } from '../components/ui/Form.jsx';
import { FieldErrors, Notice } from '../components/ui/Feedback.jsx';
import { Icon } from '../components/ui/Icons.jsx';

export default function Wholesale() {
  const { seo, phone, whatsapp } = useSettings();
  const [form, setForm] = useState({
    full_name: '',
    phone: '',
    company: '',
    product_type: '',
    estimated_quantity: '',
    city: '',
    description: '',
  });
  const [state, setState] = useState({ busy: false, error: null, fields: {}, done: null });

  useSeo({
    title: 'درخواست خرید عمده کناف | کناف کرج',
    description:
      'ثبت درخواست خرید عمده مصالح کناف برای پیمانکاران، فروشگاه‌ها و پروژه‌ها؛ ثبت درخواست و پیگیری توسط کارشناسان کناف کرج.',
    keywords: seo.keywords,
    path: '/wholesale',
    siteUrl: seo.site_url,
    siteName: 'کناف کرج',
  });

  const submit = async (event) => {
    event.preventDefault();
    setState({ busy: true, error: null, fields: {}, done: null });
    try {
      const res = await api.post('/wholesale-requests', form);
      setState({ busy: false, error: null, fields: {}, done: res.request });
      setForm({ full_name: '', phone: '', company: '', product_type: '', estimated_quantity: '', city: '', description: '' });
    } catch (error) {
      setState({ busy: false, error: error.message, fields: error.fields ?? {}, done: null });
    }
  };

  return (
    <>
      <header className="page-head">
        <div className="container">
          <Crumbs items={[{ name: 'خرید عمده' }]} />
          <h1 className="page-head__title">درخواست خرید عمده</h1>
          <p className="page-head__text">
            برای سفارش‌های حجمی مصالح کناف، فرم زیر را تکمیل کنید. پس از بررسی مقدار، شهر تحویل و نوع محصول، شرایط
            قیمت و ارسال اعلام می‌شود.
          </p>
        </div>
      </header>

      <section className="section">
        <div className="container">
          <div className="inquiry-layout">
            <form className="form" onSubmit={submit} noValidate>
              {state.done ? (
                <Notice variant="success" title="درخواست خرید عمده ثبت شد">
                  کد پیگیری: <strong>{state.done.tracking_code}</strong>
                  <div className="mt-2">
                    با این کد و شماره تماس، می‌توانید وضعیت درخواست را در <Link to="/order">صفحه پیگیری</Link> بررسی کنید.
                  </div>
                </Notice>
              ) : null}
              {state.error ? <Notice variant="error" title="ثبت درخواست انجام نشد">{state.error}</Notice> : null}
              {Object.keys(state.fields).length ? <FieldErrors fields={state.fields} /> : null}

              <FormGrid>
                <Field label="نام و نام خانوادگی" htmlFor="wh-name" required error={state.fields.full_name}>
                  <Input
                    id="wh-name"
                    value={form.full_name}
                    invalid={Boolean(state.fields.full_name)}
                    onChange={(event) => setForm({ ...form, full_name: event.target.value })}
                    required
                  />
                </Field>
                <Field label="شماره تماس" htmlFor="wh-phone" required error={state.fields.phone}>
                  <Input
                    id="wh-phone"
                    value={form.phone}
                    invalid={Boolean(state.fields.phone)}
                    onChange={(event) => setForm({ ...form, phone: event.target.value })}
                    inputMode="tel"
                    required
                  />
                </Field>
                <Field label="نام شرکت یا مجموعه (اختیاری)" htmlFor="wh-company" error={state.fields.company}>
                  <Input
                    id="wh-company"
                    value={form.company}
                    onChange={(event) => setForm({ ...form, company: event.target.value })}
                  />
                </Field>
                <Field label="شهر محل تحویل" htmlFor="wh-city" required error={state.fields.city}>
                  <Input
                    id="wh-city"
                    value={form.city}
                    invalid={Boolean(state.fields.city)}
                    onChange={(event) => setForm({ ...form, city: event.target.value })}
                    required
                  />
                </Field>
                <Field label="نوع محصول موردنیاز" htmlFor="wh-product" required error={state.fields.product_type}>
                  <Input
                    id="wh-product"
                    value={form.product_type}
                    invalid={Boolean(state.fields.product_type)}
                    onChange={(event) => setForm({ ...form, product_type: event.target.value })}
                    placeholder="مثال: پروفیل CD 60 و کناف‌پلیت ۱۲.۵"
                    required
                  />
                </Field>
                <Field label="مقدار تقریبی سفارش" htmlFor="wh-qty" required error={state.fields.estimated_quantity}>
                  <Input
                    id="wh-qty"
                    value={form.estimated_quantity}
                    invalid={Boolean(state.fields.estimated_quantity)}
                    onChange={(event) => setForm({ ...form, estimated_quantity: event.target.value })}
                    placeholder="مثال: ۵۰۰ شاخه / ۲۰۰ برگ"
                    required
                  />
                </Field>
                <Field label="توضیحات تکمیلی" htmlFor="wh-desc" error={state.fields.description} full>
                  <Textarea
                    id="wh-desc"
                    value={form.description}
                    onChange={(event) => setForm({ ...form, description: event.target.value })}
                  />
                </Field>
              </FormGrid>

              <div className="form__actions">
                <Button type="submit" variant="primary" size="lg" busy={state.busy}>
                  <Icon name="package" size={18} />
                  ارسال درخواست خرید عمده
                </Button>
              </div>
            </form>

            <aside className="aside-card">
              <h2 style={{ fontSize: 'var(--fs-md)', margin: 0 }}>خرید عمده چه مزیتی دارد؟</h2>
              <ul className="advantage-list" style={{ margin: 0 }}>
                <li className="advantage-list-item advantage-list__item">
                  <Icon name="check" size={16} />
                  <span>امکان تهیه فهرست کامل مصالح پروژه در یک درخواست.</span>
                </li>
                <li className="advantage-list__item">
                  <Icon name="check" size={16} />
                  <span>هماهنگی ارسال با زمان‌بندی کارگاه پس از تأیید موجودی.</span>
                </li>
                <li className="advantage-list__item">
                  <Icon name="check" size={16} />
                  <span>پیگیری درخواست با کد پیگیری اختصاصی.</span>
                </li>
              </ul>
              {phone ? (
                <span className="row" style={{ gap: '8px' }}>
                  <Icon name="phone" size={16} />
                  <a href={`tel:${phone}`}>{phone}</a>
                </span>
              ) : null}
              {whatsapp ? (
                <span className="row" style={{ gap: '8px' }}>
                  <Icon name="whatsapp" size={16} />
                  <span className="muted small">واتساپ مجموعه فعال است؛ از دکمه شناور صفحه استفاده کنید.</span>
                </span>
              ) : null}
              {!phone && !whatsapp ? (
                <span className="form__note">شماره تماس مجموعه هنوز ثبت نشده است؛ درخواست شما در پنل مدیریت ثبت می‌شود.</span>
              ) : null}
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
