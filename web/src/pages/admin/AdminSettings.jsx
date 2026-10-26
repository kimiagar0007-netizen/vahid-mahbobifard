import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/hooks.js';
import { useAuth } from '../../context/AuthContext.jsx';
import { formatNumber } from '../../lib/format.js';
import { Button } from '../../components/ui/Button.jsx';
import { CheckboxInput, Field, FormGrid, Input, Textarea } from '../../components/ui/Form.jsx';
import { FieldErrors, Loading, Notice } from '../../components/ui/Feedback.jsx';
import { Icon } from '../../components/ui/Icons.jsx';

const EMPTY = {
  brand: { name_fa: '', name_en: '', tagline: '', logo: '', short_about: '' },
  contact: { phone: '', whatsapp: '', address: '', email: '', working_hours: '' },
  social: { instagram: '', telegram: '', linkedin: '' },
  shipping: { flat_fee: 0, free_threshold: 0, note: '' },
  payment: { online_enabled: false, online_gateway: '', note: '', methods: [] },
  shop: { currency: 'تومان', orders_enabled: true, min_order_note: '' },
  seo: { site_url: '', default_title: '', default_description: '', keywords: '', og_image: '' },
};

export default function AdminSettings() {
  const { user, refresh } = useAuth();
  const { data, loading, error, reload } = useAsync(() => api.get('/admin/settings'), []);
  const [form, setForm] = useState(null);
  const [state, setState] = useState({ saving: false, error: null, fields: {} });
  const [notice, setNotice] = useState(null);
  const [password, setPassword] = useState({ current_password: '', new_password: '' });
  const [passwordState, setPasswordState] = useState({ saving: false, error: null, fields: {} });

  useEffect(() => {
    if (data?.settings && !form) {
      const s = data.settings;
      setForm({
        brand: { ...EMPTY.brand, ...s.brand },
        contact: { ...EMPTY.contact, ...s.contact },
        social: { ...EMPTY.social, ...s.social },
        shipping: { ...EMPTY.shipping, ...s.shipping },
        payment: { ...EMPTY.payment, ...s.payment },
        shop: { ...EMPTY.shop, ...s.shop },
        seo: { ...EMPTY.seo, ...s.seo },
      });
    }
  }, [data, form]);

  if (loading || !form) return <Loading label="در حال دریافت تنظیمات…" />;
  if (error) return <Notice variant="error">{error}</Notice>;

  const setSection = (section, patch) => setForm((current) => ({ ...current, [section]: { ...current[section], ...patch } }));

  const save = async (event) => {
    event.preventDefault();
    setState({ saving: true, error: null, fields: {} });
    try {
      await api.put('/admin/settings', {
        patch: {
          ...form,
          shipping: {
            ...form.shipping,
            flat_fee: Number(String(form.shipping.flat_fee).replace(/[^\d]/g, '')) || 0,
            free_threshold: Number(String(form.shipping.free_threshold).replace(/[^\d]/g, '')) || 0,
          },
          payment: { ...form.payment, methods: form.payment.methods.filter((method) => method.id) },
        },
      });
      setNotice({ variant: 'success', text: 'تنظیمات ذخیره شد.' });
      reload();
    } catch (requestError) {
      setState({ saving: false, error: requestError.message, fields: requestError.fields ?? {} });
      return;
    }
    setState({ saving: false, error: null, fields: {} });
  };

  const changePassword = async (event) => {
    event.preventDefault();
    setPasswordState({ saving: true, error: null, fields: {} });
    try {
      await api.post('/auth/password', password);
      setNotice({ variant: 'success', text: 'رمز عبور تغییر کرد.' });
      setPassword({ current_password: '', new_password: '' });
      await refresh();
    } catch (requestError) {
      setPasswordState({ saving: false, error: requestError.message, fields: requestError.fields ?? {} });
      return;
    }
    setPasswordState({ saving: false, error: null, fields: {} });
  };

  const methods = form.payment.methods ?? [];

  return (
    <>
      <div className="admin__topbar">
        <div>
          <h1 className="admin__title">تنظیمات</h1>
          <p className="admin__subtitle">
            اطلاعات تماس، فروشگاه، ارسال، پرداخت و سئو. این مقادیر در سایت نمایش داده می‌شوند؛ تا زمانی که تکمیل نشوند،
            دکمه‌های مربوطه در سایت غیرفعال می‌مانند.
          </p>
        </div>
      </div>

      {notice ? (
        <div style={{ marginBottom: 'var(--sp-4)' }}>
          <Notice variant={notice.variant}>{notice.text}</Notice>
        </div>
      ) : null}

      <form className="form" onSubmit={save}>
        {state.error ? <Notice variant="error">{state.error}</Notice> : null}
        {Object.keys(state.fields).length ? <FieldErrors fields={state.fields} /> : null}

        <div className="panel">
          <h2 className="panel__title">هویت برند</h2>
          <FormGrid>
            <Field label="نام فارسی برند" htmlFor="s-name-fa">
              <Input id="s-name-fa" value={form.brand.name_fa} onChange={(event) => setSection('brand', { name_fa: event.target.value })} />
            </Field>
            <Field label="نام انگلیسی" htmlFor="s-name-en">
              <Input id="s-name-en" value={form.brand.name_en} onChange={(event) => setSection('brand', { name_en: event.target.value })} />
            </Field>
            <Field label="شعار" htmlFor="s-tagline">
              <Input id="s-tagline" value={form.brand.tagline} onChange={(event) => setSection('brand', { tagline: event.target.value })} />
            </Field>
            <Field label="نشانی لوگو" htmlFor="s-logo">
              <Input id="s-logo" value={form.brand.logo} onChange={(event) => setSection('brand', { logo: event.target.value })} />
            </Field>
            <Field label="معرفی کوتاه (فوتر)" htmlFor="s-about" full>
              <Textarea id="s-about" value={form.brand.short_about} onChange={(event) => setSection('brand', { short_about: event.target.value })} />
            </Field>
          </FormGrid>
        </div>

        <div className="panel">
          <h2 className="panel__title">اطلاعات تماس</h2>
          <p className="form__note">
            تا زمانی که شماره تماس و واتساپ ثبت نشود، دکمه‌های تماس و لینک واتساپ در سایت نمایش داده نمی‌شوند.
          </p>
          <FormGrid>
            <Field label="شماره تماس" htmlFor="s-phone" hint="نمونه: ۰۹۱۲۳۴۵۶۷۸۹">
              <Input id="s-phone" value={form.contact.phone} onChange={(event) => setSection('contact', { phone: event.target.value })} inputMode="tel" />
            </Field>
            <Field label="شماره واتساپ" htmlFor="s-whatsapp" hint="با کد کشور وارد شود، مثال: 989123456789">
              <Input
                id="s-whatsapp"
                value={form.contact.whatsapp}
                onChange={(event) => setSection('contact', { whatsapp: event.target.value })}
                inputMode="tel"
              />
            </Field>
            <Field label="ایمیل" htmlFor="s-email">
              <Input id="s-email" value={form.contact.email} onChange={(event) => setSection('contact', { email: event.target.value })} inputMode="email" />
            </Field>
            <Field label="ساعات کاری" htmlFor="s-hours">
              <Input id="s-hours" value={form.contact.working_hours} onChange={(event) => setSection('contact', { working_hours: event.target.value })} />
            </Field>
            <Field label="نشانی" htmlFor="s-address" full>
              <Textarea id="s-address" value={form.contact.address} onChange={(event) => setSection('contact', { address: event.target.value })} />
            </Field>
          </FormGrid>
        </div>

        <div className="panel">
          <h2 className="panel__title">شبکه‌های اجتماعی</h2>
          <FormGrid columns={3}>
            <Field label="اینستاگرام" htmlFor="s-ig">
              <Input id="s-ig" value={form.social.instagram} onChange={(event) => setSection('social', { instagram: event.target.value })} />
            </Field>
            <Field label="تلگرام" htmlFor="s-tg">
              <Input id="s-tg" value={form.social.telegram} onChange={(event) => setSection('social', { telegram: event.target.value })} />
            </Field>
            <Field label="لینکدین" htmlFor="s-li">
              <Input id="s-li" value={form.social.linkedin} onChange={(event) => setSection('social', { linkedin: event.target.value })} />
            </Field>
          </FormGrid>
        </div>

        <div className="panel">
          <h2 className="panel__title">فروشگاه و ارسال</h2>
          <FormGrid>
            <Field label="هزینه ثابت ارسال (تومان)" htmlFor="s-ship-fee">
              <Input
                id="s-ship-fee"
                inputMode="numeric"
                value={form.shipping.flat_fee}
                onChange={(event) => setSection('shipping', { flat_fee: event.target.value })}
              />
            </Field>
            <Field label="ارسال رایگان از مبلغ (تومان)" htmlFor="s-ship-free" hint="صفر = بدون ارسال رایگان">
              <Input
                id="s-ship-free"
                inputMode="numeric"
                value={form.shipping.free_threshold}
                onChange={(event) => setSection('shipping', { free_threshold: event.target.value })}
              />
            </Field>
            <Field label="توضیح ارسال" htmlFor="s-ship-note" full>
              <Input id="s-ship-note" value={form.shipping.note} onChange={(event) => setSection('shipping', { note: event.target.value })} />
            </Field>
            <Field label="واحد پول" htmlFor="s-currency">
              <Input id="s-currency" value={form.shop.currency} onChange={(event) => setSection('shop', { currency: event.target.value })} />
            </Field>
            <Field label="توضیح حداقل سفارش" htmlFor="s-min-order">
              <Input id="s-min-order" value={form.shop.min_order_note} onChange={(event) => setSection('shop', { min_order_note: event.target.value })} />
            </Field>
          </FormGrid>
          <div className="mt-4">
            <CheckboxInput
              id="s-orders-enabled"
              label="ثبت سفارش آنلاین فعال باشد"
              checked={form.shop.orders_enabled}
              onChange={(event) => setSection('shop', { orders_enabled: event.target.checked })}
            />
          </div>
        </div>

        <div className="panel">
          <h2 className="panel__title">پرداخت</h2>
          <p className="form__note">
            تا زمانی که درگاه پرداخت آنلاین فعال نشود، سفارش‌ها با وضعیت «پرداخت‌نشده» ثبت می‌شوند و هیچ پرداخت موفقی در
            سایت ثبت نمی‌شود.
          </p>
          <CheckboxInput
            id="s-online"
            label="پرداخت آنلاین فعال است (پس از اتصال درگاه معتبر)"
            checked={form.payment.online_enabled}
            onChange={(event) => setSection('payment', { online_enabled: event.target.checked })}
          />
          <FormGrid>
            <Field label="نام درگاه پرداخت" htmlFor="s-gateway" hint="مثال: زرین‌پال، آیدی‌پی">
              <Input
                id="s-gateway"
                value={form.payment.online_gateway}
                onChange={(event) => setSection('payment', { online_gateway: event.target.value })}
              />
            </Field>
            <Field label="توضیح پرداخت" htmlFor="s-pay-note">
              <Input id="s-pay-note" value={form.payment.note} onChange={(event) => setSection('payment', { note: event.target.value })} />
            </Field>
          </FormGrid>
          <div className="mt-4">
            <span className="field__label">روش‌های پرداخت فعال</span>
            <div className="stack stack--sm mt-2">
              {methods.map((method, index) => (
                <div className="row row--wrap" key={method.id} style={{ gap: 'var(--sp-3)' }}>
                  <CheckboxInput
                    id={`method-${method.id}`}
                    label={method.title}
                    checked={method.enabled}
                    onChange={(event) =>
                      setSection('payment', {
                        methods: methods.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, enabled: event.target.checked } : item,
                        ),
                      })
                    }
                  />
                  <Input
                    aria-label={`عنوان روش ${method.title}`}
                    value={method.title}
                    onChange={(event) =>
                      setSection('payment', {
                        methods: methods.map((item, itemIndex) =>
                          itemIndex === index ? { ...item, title: event.target.value } : item,
                        ),
                      })
                    }
                  />
                </div>
              ))}
              <Button
                variant="secondary"
                size="sm"
                onClick={() =>
                  setSection('payment', {
                    methods: [...methods, { id: `custom-${methods.length + 1}`, title: 'روش پرداخت جدید', enabled: true }],
                  })
                }
              >
                <Icon name="plus" size={16} />
                افزودن روش پرداخت
              </Button>
            </div>
          </div>
        </div>

        <div className="panel">
          <h2 className="panel__title">سئو</h2>
          <FormGrid>
            <Field label="نشانی دامنه" htmlFor="s-site-url" hint="برای ساخت نقشه سایت و لینک کانونیکال، مثال: https://example.com">
              <Input id="s-site-url" value={form.seo.site_url} onChange={(event) => setSection('seo', { site_url: event.target.value })} />
            </Field>
            <Field label="عنوان پیش‌فرض" htmlFor="s-seo-title">
              <Input id="s-seo-title" value={form.seo.default_title} onChange={(event) => setSection('seo', { default_title: event.target.value })} />
            </Field>
            <Field label="توضیح متای پیش‌فرض" htmlFor="s-seo-desc" full>
              <Textarea
                id="s-seo-desc"
                value={form.seo.default_description}
                onChange={(event) => setSection('seo', { default_description: event.target.value })}
              />
            </Field>
            <Field label="کلمات کلیدی" htmlFor="s-keywords" full>
              <Input id="s-keywords" value={form.seo.keywords} onChange={(event) => setSection('seo', { keywords: event.target.value })} />
            </Field>
            <Field label="تصویر اشتراک‌گذاری (OG)" htmlFor="s-og">
              <Input id="s-og" value={form.seo.og_image} onChange={(event) => setSection('seo', { og_image: event.target.value })} />
            </Field>
          </FormGrid>
        </div>

        <div className="form__actions">
          <Button type="submit" variant="primary" size="lg" busy={state.saving}>
            ذخیره همه تنظیمات
          </Button>
        </div>
      </form>

      <div className="panel mt-6">
        <h2 className="panel__title">تغییر رمز عبور مدیر</h2>
        <form className="form" onSubmit={changePassword}>
          {passwordState.error ? <Notice variant="error">{passwordState.error}</Notice> : null}
          <FormGrid>
            <Field label="رمز عبور فعلی" htmlFor="pw-current" required error={passwordState.fields.current_password}>
              <Input
                id="pw-current"
                type="password"
                value={password.current_password}
                onChange={(event) => setPassword({ ...password, current_password: event.target.value })}
                autoComplete="current-password"
                required
              />
            </Field>
            <Field label="رمز عبور جدید" htmlFor="pw-new" required error={passwordState.fields.new_password} hint="حداقل ۸ کاراکتر">
              <Input
                id="pw-new"
                type="password"
                value={password.new_password}
                onChange={(event) => setPassword({ ...password, new_password: event.target.value })}
                autoComplete="new-password"
                required
              />
            </Field>
          </FormGrid>
          <div className="form__actions">
            <Button type="submit" variant="secondary" busy={passwordState.saving}>
              <Icon name="shield" size={18} />
              تغییر رمز عبور
            </Button>
            <span className="form__note">
              کاربر فعلی: {user.username} — پس از تغییر رمز، سایر نشست‌های فعال بسته می‌شوند.
            </span>
          </div>
        </form>
      </div>
    </>
  );
}
