import { useEffect, useState } from 'react';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/hooks.js';
import { formatNumber } from '../../lib/format.js';
import Modal from '../../components/ui/Modal.jsx';
import { Badge } from '../../components/ui/Display.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { CheckboxInput, Field, FormGrid, Input, Select, Textarea } from '../../components/ui/Form.jsx';
import { EmptyState, FieldErrors, Loading, Notice } from '../../components/ui/Feedback.jsx';
import { Icon } from '../../components/ui/Icons.jsx';

const EMPTY_FAQ = { question: '', answer: '', is_published: true, sort_order: 0 };

export default function AdminContent() {
  const [tab, setTab] = useState('pages');
  const [notice, setNotice] = useState(null);

  return (
    <>
      <div className="admin__topbar">
        <div>
          <h1 className="admin__title">محتوای صفحات</h1>
          <p className="admin__subtitle">ویرایش متن صفحات، پرسش‌های متداول و متن‌های صفحه اصلی</p>
        </div>
      </div>

      {notice ? (
        <div style={{ marginBottom: 'var(--sp-4)' }}>
          <Notice variant={notice.variant}>{notice.text}</Notice>
        </div>
      ) : null}

      <div className="admin__tabs" role="tablist">
        {[
          ['pages', 'صفحات سایت'],
          ['faq', 'پرسش‌های متداول'],
          ['home', 'متن صفحه اصلی'],
        ].map(([value, label]) => (
          <button
            key={value}
            type="button"
            role="tab"
            aria-selected={tab === value}
            className={`admin__tab${tab === value ? ' admin__tab--active' : ''}`}
            onClick={() => setTab(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'pages' ? <PagesPanel onNotice={setNotice} /> : null}
      {tab === 'faq' ? <FaqPanel onNotice={setNotice} /> : null}
      {tab === 'home' ? <HomeCopyPanel onNotice={setNotice} /> : null}
    </>
  );
}

function PagesPanel({ onNotice }) {
  const { data, loading, error, reload } = useAsync(() => api.get('/admin/pages'), []);
  const [slug, setSlug] = useState('');
  const [form, setForm] = useState({ title: '', seo_title: '', seo_description: '', body: '' });
  const [state, setState] = useState({ saving: false, error: null, fields: {} });

  const pages = data?.items ?? [];

  useEffect(() => {
    if (!slug && pages.length) setSlug(pages[0].slug);
  }, [pages, slug]);

  useEffect(() => {
    const page = pages.find((item) => item.slug === slug);
    if (page) {
      setForm({
        title: page.title,
        seo_title: page.seo_title ?? '',
        seo_description: page.seo_description ?? '',
        body: page.body ?? '',
      });
    }
  }, [slug, pages]);

  const save = async (event) => {
    event.preventDefault();
    setState({ saving: true, error: null, fields: {} });
    try {
      await api.put(`/admin/pages/${slug}`, form);
      onNotice({ variant: 'success', text: 'محتوای صفحه ذخیره شد.' });
      reload();
    } catch (requestError) {
      setState({ saving: false, error: requestError.message, fields: requestError.fields ?? {} });
      return;
    }
    setState({ saving: false, error: null, fields: {} });
  };

  if (loading) return <Loading label="در حال دریافت صفحات…" />;
  if (error) return <Notice variant="error">{error}</Notice>;
  if (!pages.length) return <EmptyState title="صفحه‌ای برای ویرایش وجود ندارد" />;

  return (
    <form className="form" onSubmit={save}>
      {state.error ? <Notice variant="error">{state.error}</Notice> : null}
      {Object.keys(state.fields).length ? <FieldErrors fields={state.fields} /> : null}

      <Field label="صفحه مورد ویرایش" htmlFor="pg-select">
        <Select id="pg-select" value={slug} onChange={(event) => setSlug(event.target.value)}>
          {pages.map((page) => (
            <option key={page.slug} value={page.slug}>
              {page.title} ({page.slug})
            </option>
          ))}
        </Select>
      </Field>

      <FormGrid>
        <Field label="عنوان صفحه" htmlFor="pg-title" required error={state.fields.title}>
          <Input id="pg-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
        </Field>
        <Field label="عنوان سئو" htmlFor="pg-seo-title">
          <Input id="pg-seo-title" value={form.seo_title} onChange={(event) => setForm({ ...form, seo_title: event.target.value })} />
        </Field>
        <Field label="توضیح متای سئو" htmlFor="pg-seo-desc" full>
          <Input
            id="pg-seo-desc"
            value={form.seo_description}
            onChange={(event) => setForm({ ...form, seo_description: event.target.value })}
          />
        </Field>
        <Field
          label="متن صفحه"
          htmlFor="pg-body"
          full
          hint="برای تیتر از «## »، برای فهرست از «- » در ابتدای خط استفاده کنید."
        >
          <Textarea
            id="pg-body"
            style={{ minHeight: '320px' }}
            value={form.body}
            onChange={(event) => setForm({ ...form, body: event.target.value })}
          />
        </Field>
      </FormGrid>

      <div className="form__actions">
        <Button type="submit" variant="primary" busy={state.saving}>
          ذخیره محتوا
        </Button>
      </div>
    </form>
  );
}

function FaqPanel({ onNotice }) {
  const { data, loading, error, reload } = useAsync(() => api.get('/admin/faqs'), []);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY_FAQ);
  const [state, setState] = useState({ saving: false, error: null, fields: {} });

  const items = data?.items ?? [];

  const save = async (event) => {
    event.preventDefault();
    setState({ saving: true, error: null, fields: {} });
    try {
      if (editing === 'new') await api.post('/admin/faqs', form);
      else await api.put(`/admin/faqs/${editing}`, form);
      onNotice({ variant: 'success', text: 'پرسش ذخیره شد.' });
      setEditing(null);
      reload();
    } catch (requestError) {
      setState({ saving: false, error: requestError.message, fields: requestError.fields ?? {} });
      return;
    }
    setState({ saving: false, error: null, fields: {} });
  };

  const remove = async (faq) => {
    if (!window.confirm('این پرسش حذف شود؟')) return;
    try {
      await api.del(`/admin/faqs/${faq.id}`);
      onNotice({ variant: 'success', text: 'پرسش حذف شد.' });
      reload();
    } catch (requestError) {
      onNotice({ variant: 'error', text: requestError.message });
    }
  };

  if (loading) return <Loading label="در حال دریافت پرسش‌ها…" />;
  if (error) return <Notice variant="error">{error}</Notice>;

  return (
    <>
      <div className="toolbar">
        <Button
          variant="primary"
          size="sm"
          onClick={() => {
            setEditing('new');
            setForm({ ...EMPTY_FAQ, sort_order: items.length });
          }}
        >
          <Icon name="plus" size={16} />
          پرسش جدید
        </Button>
      </div>

      {items.length ? (
        <div className="panel panel--flush">
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>پرسش</th>
                  <th>ترتیب</th>
                  <th>وضعیت</th>
                  <th>عملیات</th>
                </tr>
              </thead>
              <tbody>
                {items.map((faq) => (
                  <tr key={faq.id}>
                    <td className="table__wrap-cell">{faq.question}</td>
                    <td>{formatNumber(faq.sort_order)}</td>
                    <td>
                      <Badge tone={faq.is_published ? 'success' : 'neutral'}>
                        {faq.is_published ? 'منتشرشده' : 'منتشرنشده'}
                      </Badge>
                    </td>
                    <td>
                      <div className="table__actions">
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => {
                            setEditing(faq.id);
                            setForm({
                              question: faq.question,
                              answer: faq.answer,
                              is_published: faq.is_published,
                              sort_order: faq.sort_order,
                            });
                          }}
                        >
                          <Icon name="edit" size={16} />
                          ویرایش
                        </Button>
                        <Button variant="danger" size="sm" onClick={() => remove(faq)}>
                          <Icon name="trash" size={16} />
                          حذف
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <EmptyState title="پرسشی ثبت نشده است" icon={<Icon name="info" size={26} />} />
      )}

      <Modal open={editing !== null} onClose={() => setEditing(null)} wide title={editing === 'new' ? 'پرسش جدید' : 'ویرایش پرسش'}>
        <form className="form" onSubmit={save}>
          {state.error ? <Notice variant="error">{state.error}</Notice> : null}
          {Object.keys(state.fields).length ? <FieldErrors fields={state.fields} /> : null}
          <Field label="پرسش" htmlFor="faq-q" required>
            <Input id="faq-q" value={form.question} onChange={(event) => setForm({ ...form, question: event.target.value })} required />
          </Field>
          <Field label="پاسخ" htmlFor="faq-a" required>
            <Textarea id="faq-a" style={{ minHeight: '160px' }} value={form.answer} onChange={(event) => setForm({ ...form, answer: event.target.value })} required />
          </Field>
          <Field label="ترتیب نمایش" htmlFor="faq-sort">
            <Input
              id="faq-sort"
              inputMode="numeric"
              value={form.sort_order}
              onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value.replace(/\D/g, '')) || 0 })}
            />
          </Field>
          <CheckboxInput
            id="faq-published"
            label="انتشار در سایت"
            checked={form.is_published}
            onChange={(event) => setForm({ ...form, is_published: event.target.checked })}
          />
          <div className="form__actions">
            <Button type="submit" variant="primary" busy={state.saving}>
              ذخیره
            </Button>
            <Button variant="ghost" onClick={() => setEditing(null)}>
              انصراف
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}

function HomeCopyPanel({ onNotice }) {
  const { data, loading, error, reload } = useAsync(() => api.get('/admin/settings'), []);
  const [form, setForm] = useState(null);
  const [state, setState] = useState({ saving: false, error: null });

  useEffect(() => {
    if (data?.settings?.home && !form) {
      const home = data.settings.home;
      setForm({
        hero_title: home.hero_title ?? '',
        hero_highlight: home.hero_highlight ?? '',
        hero_subtitle: home.hero_subtitle ?? '',
        about_title: home.about_title ?? '',
        about_text: home.about_text ?? '',
        advantage_1: home.about_advantages?.[0] ?? '',
        advantage_2: home.about_advantages?.[1] ?? '',
        advantage_3: home.about_advantages?.[2] ?? '',
        cta_title: home.cta_title ?? '',
        cta_text: home.cta_text ?? '',
      });
    }
  }, [data, form]);

  if (loading || !form) return <Loading label="در حال دریافت متن‌ها…" />;
  if (error) return <Notice variant="error">{error}</Notice>;

  const save = async (event) => {
    event.preventDefault();
    setState({ saving: true, error: null });
    const payload = {
      home: {
        hero_title: form.hero_title,
        hero_highlight: form.hero_highlight,
        hero_subtitle: form.hero_subtitle,
        about_title: form.about_title,
        about_text: form.about_text,
        about_advantages: [form.advantage_1, form.advantage_2, form.advantage_3].filter(Boolean),
        cta_title: form.cta_title,
        cta_text: form.cta_text,
      },
    };
    try {
      await api.put('/admin/settings', { patch: payload });
      onNotice({ variant: 'success', text: 'متن صفحه اصلی ذخیره شد.' });
      reload();
    } catch (requestError) {
      setState({ saving: false, error: requestError.message });
      return;
    }
    setState({ saving: false, error: null });
  };

  return (
    <form className="form" onSubmit={save}>
      {state.error ? <Notice variant="error">{state.error}</Notice> : null}
      <FormGrid>
        <Field label="تیتر اصلی Hero" htmlFor="h-title" full>
          <Input id="h-title" value={form.hero_title} onChange={(event) => setForm({ ...form, hero_title: event.target.value })} />
        </Field>
        <Field label="عبارت پررنگ (طلایی) تیتر" htmlFor="h-highlight" hint="این عبارت باید دقیقاً بخشی از تیتر اصلی باشد.">
          <Input id="h-highlight" value={form.hero_highlight} onChange={(event) => setForm({ ...form, hero_highlight: event.target.value })} />
        </Field>
        <Field label="زیرعنوان Hero" htmlFor="h-sub">
          <Input id="h-sub" value={form.hero_subtitle} onChange={(event) => setForm({ ...form, hero_subtitle: event.target.value })} />
        </Field>
        <Field label="عنوان بخش معرفی" htmlFor="h-about-title">
          <Input id="h-about-title" value={form.about_title} onChange={(event) => setForm({ ...form, about_title: event.target.value })} />
        </Field>
        <Field label="متن بخش معرفی" htmlFor="h-about-text">
          <Textarea id="h-about-text" value={form.about_text} onChange={(event) => setForm({ ...form, about_text: event.target.value })} />
        </Field>
        <Field label="مزیت اول" htmlFor="h-a1">
          <Input id="h-a1" value={form.advantage_1} onChange={(event) => setForm({ ...form, advantage_1: event.target.value })} />
        </Field>
        <Field label="مزیت دوم" htmlFor="h-a2">
          <Input id="h-a2" value={form.advantage_2} onChange={(event) => setForm({ ...form, advantage_2: event.target.value })} />
        </Field>
        <Field label="مزیت سوم" htmlFor="h-a3">
          <Input id="h-a3" value={form.advantage_3} onChange={(event) => setForm({ ...form, advantage_3: event.target.value })} />
        </Field>
        <Field label="عنوان بخش دعوت به اقدام" htmlFor="h-cta-title">
          <Input id="h-cta-title" value={form.cta_title} onChange={(event) => setForm({ ...form, cta_title: event.target.value })} />
        </Field>
        <Field label="متن بخش دعوت به اقدام" htmlFor="h-cta-text">
          <Textarea id="h-cta-text" value={form.cta_text} onChange={(event) => setForm({ ...form, cta_text: event.target.value })} />
        </Field>
      </FormGrid>
      <div className="form__actions">
        <Button type="submit" variant="primary" busy={state.saving}>
          ذخیره متن‌ها
        </Button>
      </div>
    </form>
  );
}
