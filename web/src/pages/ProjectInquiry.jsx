import { useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAsync } from '../lib/hooks.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { PROJECT_TYPES, PREFERRED_CONTACT, formatBytes } from '../lib/format.js';
import { useSeo } from '../lib/seo.js';
import { Crumbs } from '../components/ui/Display.jsx';
import { Button } from '../components/ui/Button.jsx';
import { CheckboxInput, Field, FormGrid, Input, Select, Textarea } from '../components/ui/Form.jsx';
import { FieldErrors, Notice } from '../components/ui/Feedback.jsx';
import { Icon } from '../components/ui/Icons.jsx';

const MAX_FILES = 3;
const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];

export default function ProjectInquiry() {
  const [params] = useSearchParams();
  const { seo, phone, whatsapp } = useSettings();
  const { data } = useAsync(async () => {
    const res = await api.get('/catalog/services');
    return res.items ?? [];
  }, []);

  const services = data ?? [];
  const preselected = useMemo(() => {
    const slug = params.get('service');
    return services.find((service) => service.slug === slug)?.name ?? '';
  }, [params, services]);

  const [form, setForm] = useState({
    customer_name: '',
    phone: '',
    project_type: 'residential',
    service_type: preselected,
    estimated_area: '',
    location: '',
    description: '',
    preferred_contact: 'phone',
  });
  const [files, setFiles] = useState([]);
  const [privacy, setPrivacy] = useState(false);
  const [state, setState] = useState({ busy: false, error: null, fields: {}, fileError: null, done: null });

  useSeo({
    title: 'استعلام اجرای پروژه کناف | کناف کرج',
    description:
      'فرم استعلام اجرای پروژه کناف: نوع پروژه، متراژ، محل پروژه و شرح نیاز را ثبت کنید و کد پیگیری دریافت کنید.',
    keywords: seo.keywords,
    path: '/project-inquiry',
    siteUrl: seo.site_url,
    siteName: 'کناف کرج',
  });

  if (!form.service_type && preselected) {
    setForm((current) => ({ ...current, service_type: preselected }));
  }

  const onFiles = (event) => {
    const selected = Array.from(event.target.files ?? []);
    if (selected.length > MAX_FILES) {
      setState((current) => ({ ...current, fileError: `حداکثر ${MAX_FILES} فایل می‌توانید ارسال کنید.` }));
      setFiles([]);
      return;
    }
    const invalid = selected.find((file) => !ALLOWED.includes(file.type) || file.size > MAX_BYTES);
    if (invalid) {
      setState((current) => ({
        ...current,
        fileError: `فایل «${invalid.name}» مجاز نیست؛ فقط تصویر JPG/PNG/WEBP یا PDF تا ۵ مگابایت.`,
      }));
      setFiles([]);
      return;
    }
    setState((current) => ({ ...current, fileError: null }));
    setFiles(selected);
  };

  const submit = async (event) => {
    event.preventDefault();
    setState({ busy: true, error: null, fields: {}, fileError: null, done: null });
    const payload = new FormData();
    payload.append('customer_name', form.customer_name);
    payload.append('phone', form.phone);
    payload.append('project_type', form.project_type);
    payload.append('service_type', form.service_type);
    payload.append('estimated_area', form.estimated_area);
    payload.append('location', form.location);
    payload.append('description', form.description);
    payload.append('preferred_contact', form.preferred_contact);
    payload.append('privacy_accepted', privacy ? 'true' : 'false');
    for (const file of files) payload.append('attachments', file);

    try {
      const res = await api.post('/project-requests', payload);
      setState({ busy: false, error: null, fields: {}, fileError: null, done: res.request });
      setForm({
        customer_name: '',
        phone: '',
        project_type: 'residential',
        service_type: '',
        estimated_area: '',
        location: '',
        description: '',
        preferred_contact: 'phone',
      });
      setFiles([]);
      setPrivacy(false);
    } catch (error) {
      setState({ busy: false, error: error.message, fields: error.fields ?? {}, fileError: null, done: null });
    }
  };

  return (
    <>
      <header className="page-head">
        <div className="container">
          <Crumbs items={[{ name: 'استعلام اجرای پروژه' }]} />
          <h1 className="page-head__title">استعلام اجرای پروژه</h1>
          <p className="page-head__text">
            اطلاعات پروژه خود را ثبت کنید. پس از بررسی، کارشناسان کناف کرج برای اعلام هزینه و هماهنگی با شما تماس
            می‌گیرند. هزینه اجرا استعلامی است و پیش از بررسی، قیمت قطعی اعلام نمی‌شود.
          </p>
        </div>
      </header>

      <section className="section">
        <div className="container">
          <div className="inquiry-layout">
            <form className="form" onSubmit={submit} noValidate>
              {state.done ? (
                <Notice variant="success" title="درخواست شما ثبت شد">
                  کد پیگیری شما: <strong>{state.done.tracking_code}</strong>
                  <div className="mt-2">
                    این کد را نگه دارید؛ با کد پیگیری و شماره تماس می‌توانید وضعیت درخواست را در{' '}
                    <Link to="/order">صفحه پیگیری</Link> ببینید.
                  </div>
                </Notice>
              ) : null}
              {state.error ? <Notice variant="error" title="ثبت درخواست انجام نشد">{state.error}</Notice> : null}
              {Object.keys(state.fields).length ? <FieldErrors fields={state.fields} /> : null}

              <div className="panel" style={{ marginBottom: 0 }}>
                <h2 className="panel__title">اطلاعات تماس</h2>
                <FormGrid>
                  <Field label="نام و نام خانوادگی" htmlFor="pi-name" required error={state.fields.customer_name}>
                    <Input
                      id="pi-name"
                      value={form.customer_name}
                      invalid={Boolean(state.fields.customer_name)}
                      onChange={(event) => setForm({ ...form, customer_name: event.target.value })}
                      required
                    />
                  </Field>
                  <Field label="شماره تماس" htmlFor="pi-phone" required error={state.fields.phone} hint="نمونه: ۰۹۱۲۳۴۵۶۷۸۹">
                    <Input
                      id="pi-phone"
                      value={form.phone}
                      invalid={Boolean(state.fields.phone)}
                      onChange={(event) => setForm({ ...form, phone: event.target.value })}
                      inputMode="tel"
                      required
                    />
                  </Field>
                  <Field label="روش ترجیحی تماس" htmlFor="pi-contact" required full>
                    <div className="row row--wrap" style={{ gap: 'var(--sp-4)' }}>
                      {Object.entries(PREFERRED_CONTACT).map(([value, label]) => (
                        <label className="checkbox" key={value}>
                          <input
                            type="radio"
                            name="preferred_contact"
                            value={value}
                            checked={form.preferred_contact === value}
                            onChange={() => setForm({ ...form, preferred_contact: value })}
                          />
                          <span>{label}</span>
                        </label>
                      ))}
                    </div>
                  </Field>
                </FormGrid>
              </div>

              <div className="panel" style={{ marginBottom: 0 }}>
                <h2 className="panel__title">مشخصات پروژه</h2>
                <FormGrid>
                  <Field label="نوع پروژه" htmlFor="pi-type" required error={state.fields.project_type}>
                    <Select
                      id="pi-type"
                      value={form.project_type}
                      onChange={(event) => setForm({ ...form, project_type: event.target.value })}
                    >
                      {Object.entries(PROJECT_TYPES).map(([value, label]) => (
                        <option key={value} value={value}>
                          {label}
                        </option>
                      ))}
                    </Select>
                  </Field>
                  <Field label="خدمت موردنیاز" htmlFor="pi-service" required error={state.fields.service_type}>
                    <Select
                      id="pi-service"
                      value={form.service_type}
                      invalid={Boolean(state.fields.service_type)}
                      onChange={(event) => setForm({ ...form, service_type: event.target.value })}
                    >
                      <option value="">انتخاب کنید…</option>
                      {services.map((service) => (
                        <option key={service.id} value={service.name}>
                          {service.name}
                        </option>
                      ))}
                      <option value="سایر خدمات / نیاز به مشاوره">سایر خدمات / نیاز به مشاوره</option>
                    </Select>
                  </Field>
                  <Field label="متراژ تقریبی" htmlFor="pi-area" error={state.fields.estimated_area} hint="مثال: ۸۰ متر مربع">
                    <Input
                      id="pi-area"
                      value={form.estimated_area}
                      invalid={Boolean(state.fields.estimated_area)}
                      onChange={(event) => setForm({ ...form, estimated_area: event.target.value })}
                    />
                  </Field>
                  <Field label="شهر و منطقه پروژه" htmlFor="pi-location" required error={state.fields.location}>
                    <Input
                      id="pi-location"
                      value={form.location}
                      invalid={Boolean(state.fields.location)}
                      onChange={(event) => setForm({ ...form, location: event.target.value })}
                      placeholder="مثال: کرج، عظیمیه"
                      required
                    />
                  </Field>
                  <Field label="توضیحات پروژه" htmlFor="pi-desc" required error={state.fields.description} full>
                    <Textarea
                      id="pi-desc"
                      value={form.description}
                      invalid={Boolean(state.fields.description)}
                      onChange={(event) => setForm({ ...form, description: event.target.value })}
                      hint="نوع فضا، تعداد اتاق‌ها، وضعیت فعلی سقف یا دیوار و زمان‌بندی مورد نظر را بنویسید."
                      required
                    />
                  </Field>
                </FormGrid>
              </div>

              <div className="panel" style={{ marginBottom: 0 }}>
                <h2 className="panel__title">تصویر یا فایل پروژه (اختیاری)</h2>
                <Field
                  label="حداکثر ۳ فایل، هر فایل تا ۵ مگابایت"
                  htmlFor="pi-files"
                  hint="فرمت‌های مجاز: JPG، PNG، WEBP و PDF. فایل‌ها فقط برای مدیر سایت قابل مشاهده است."
                  error={state.fileError}
                >
                  <Input id="pi-files" type="file" multiple accept=".jpg,.jpeg,.png,.webp,.pdf" onChange={onFiles} />
                </Field>
                {files.length ? (
                  <ul className="file-list">
                    {files.map((file) => (
                      <li key={file.name}>
                        <Icon name="upload" size={14} /> {file.name} — {formatBytes(file.size)}
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>

              <CheckboxInput
                id="pi-privacy"
                checked={privacy}
                onChange={(event) => setPrivacy(event.target.checked)}
                label="سیاست حفظ حریم خصوصی را مطالعه کرده‌ام و با ثبت و بررسی اطلاعات پروژه موافقم."
              />
              {state.fields.privacy_accepted ? <span className="field__error">{state.fields.privacy_accepted}</span> : null}

              <div className="form__actions">
                <Button type="submit" variant="primary" size="lg" busy={state.busy}>
                  <Icon name="clipboardCheck" size={18} />
                  ارسال درخواست اجرای پروژه
                </Button>
                <span className="form__note">پس از ارسال، کد پیگیری به شما نمایش داده می‌شود.</span>
              </div>
            </form>

            <aside className="aside-card">
              <h2 style={{ fontSize: 'var(--fs-md)', margin: 0 }}>این درخواست چگونه بررسی می‌شود؟</h2>
              <ul className="advantage-list" style={{ margin: 0 }}>
                <li className="advantage-list__item">
                  <Icon name="check" size={16} />
                  <span>درخواست شما در پنل مدیریت ثبت و وضعیت آن پیگیری می‌شود.</span>
                </li>
                <li className="advantage-list__item">
                  <Icon name="check" size={16} />
                  <span>در صورت نیاز به اطلاعات بیشتر، وضعیت درخواست به «نیازمند اطلاعات بیشتر» تغییر می‌کند.</span>
                </li>
                <li className="advantage-list__item">
                  <Icon name="check" size={16} />
                  <span>پس از بررسی، هزینه و شرایط اجرا اعلام می‌شود.</span>
                </li>
              </ul>
              {phone || whatsapp ? (
                <div className="stack stack--sm">
                  <span className="form__note">برای پیگیری سریع‌تر:</span>
                  {phone ? <a href={`tel:${phone}`}>{phone}</a> : null}
                  {whatsapp ? (
                    <a href={`https://wa.me/${whatsapp}`} target="_blank" rel="noreferrer noopener">
                      گفت‌وگو در واتساپ
                    </a>
                  ) : null}
                </div>
              ) : (
                <span className="form__note">
                  شماره تماس و واتساپ این مجموعه هنوز در تنظیمات سایت ثبت نشده است؛ پس از ثبت، دکمه‌های تماس فعال می‌شوند.
                </span>
              )}
            </aside>
          </div>
        </div>
      </section>
    </>
  );
}
