import { useState } from 'react';
import { api } from '../../lib/api.js';
import { useAsync } from '../../lib/hooks.js';
import { formatNumber } from '../../lib/format.js';
import { Badge } from '../../components/ui/Display.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { CheckboxInput, Field, FormGrid, Input, Textarea } from '../../components/ui/Form.jsx';
import { EmptyState, FieldErrors, Loading, Notice } from '../../components/ui/Feedback.jsx';
import { Icon } from '../../components/ui/Icons.jsx';

const EMPTY = {
  title: '',
  slug: '',
  category: '',
  description: '',
  image: '',
  image_alt: '',
  area: '',
  specs: '',
  is_sample: true,
  is_published: true,
  sort_order: 0,
};

export default function AdminPortfolio() {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [state, setState] = useState({ saving: false, error: null, fields: {} });
  const [notice, setNotice] = useState(null);

  const { data, loading, error, reload } = useAsync(() => api.get('/admin/portfolio'), []);
  const items = data?.items ?? [];

  const openCreate = () => {
    setEditing('new');
    setForm({ ...EMPTY, sort_order: items.length });
    setState({ saving: false, error: null, fields: {} });
  };

  const openEdit = (item) => {
    setEditing(item.id);
    setForm({
      title: item.title,
      slug: item.slug,
      category: item.category ?? '',
      description: item.description ?? '',
      image: item.image ?? '',
      image_alt: item.image_alt ?? '',
      area: item.area ?? '',
      specs: item.specs ?? '',
      is_sample: item.is_sample,
      is_published: item.is_published,
      sort_order: item.sort_order,
    });
    setState({ saving: false, error: null, fields: {} });
  };

  const save = async (event) => {
    event.preventDefault();
    setState({ saving: true, error: null, fields: {} });
    try {
      if (editing === 'new') await api.post('/admin/portfolio', form);
      else await api.put(`/admin/portfolio/${editing}`, form);
      setNotice({ variant: 'success', text: 'نمونه‌کار ذخیره شد.' });
      setEditing(null);
      reload();
    } catch (requestError) {
      setState({ saving: false, error: requestError.message, fields: requestError.fields ?? {} });
    }
  };

  const remove = async (item) => {
    if (!window.confirm(`نمونه‌کار «${item.title}» حذف شود؟`)) return;
    try {
      await api.del(`/admin/portfolio/${item.id}`);
      setNotice({ variant: 'success', text: 'نمونه‌کار حذف شد.' });
      reload();
    } catch (requestError) {
      setNotice({ variant: 'error', text: requestError.message });
    }
  };

  const upload = async (file) => {
    const payload = new FormData();
    payload.append('image', file);
    try {
      const res = await api.post('/admin/uploads', payload);
      setForm((current) => ({ ...current, image: res.url }));
    } catch (requestError) {
      setNotice({ variant: 'error', text: requestError.message });
    }
  };

  return (
    <>
      <div className="admin__topbar">
        <div>
          <h1 className="admin__title">نمونه‌کارها</h1>
          <p className="admin__subtitle">
            تا زمان ثبت نمونه‌کار واقعی، گزینه «تصویر نمایشی» را فعال بگذارید تا برچسب «نمونه طراحی» روی کارت نمایش
            داده شود.
          </p>
        </div>
        <div className="admin__actions">
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Icon name="plus" size={16} />
            نمونه‌کار جدید
          </Button>
        </div>
      </div>

      {notice ? (
        <div style={{ marginBottom: 'var(--sp-4)' }}>
          <Notice variant={notice.variant}>{notice.text}</Notice>
        </div>
      ) : null}

      {loading ? <Loading label="در حال دریافت نمونه‌کارها…" /> : null}
      {error ? <Notice variant="error">{error}</Notice> : null}

      {!loading && !error ? (
        items.length ? (
          <div className="panel panel--flush">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>عنوان</th>
                    <th>دسته‌بندی</th>
                    <th>ترتیب</th>
                    <th>وضعیت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td className="table__wrap-cell">
                        {item.title}
                        <div className="muted small">{item.slug}</div>
                      </td>
                      <td>{item.category || '—'}</td>
                      <td>{formatNumber(item.sort_order)}</td>
                      <td>
                        <div className="row" style={{ gap: '6px', flexWrap: 'wrap' }}>
                          <Badge tone={item.is_published ? 'success' : 'neutral'}>
                            {item.is_published ? 'منتشرشده' : 'منتشرنشده'}
                          </Badge>
                          {item.is_sample ? <Badge tone="gold">تصویر نمایشی</Badge> : null}
                        </div>
                      </td>
                      <td>
                        <div className="table__actions">
                          <Button variant="secondary" size="sm" onClick={() => openEdit(item)}>
                            <Icon name="edit" size={16} />
                            ویرایش
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => remove(item)}>
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
          <EmptyState title="نمونه‌کاری ثبت نشده است" icon={<Icon name="image" size={26} />} />
        )
      ) : null}

      <Modal open={editing !== null} onClose={() => setEditing(null)} wide title={editing === 'new' ? 'افزودن نمونه‌کار' : 'ویرایش نمونه‌کار'}>
        <form className="form" onSubmit={save}>
          {state.error ? <Notice variant="error">{state.error}</Notice> : null}
          {Object.keys(state.fields).length ? <FieldErrors fields={state.fields} /> : null}
          <FormGrid>
            <Field label="عنوان پروژه" htmlFor="f-title" required error={state.fields.title}>
              <Input id="f-title" value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} required />
            </Field>
            <Field label="دسته‌بندی" htmlFor="f-category" required hint="مثال: مسکونی، تجاری، اداری، بازسازی">
              <Input id="f-category" value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} required />
            </Field>
            <Field label="توضیح پروژه" htmlFor="f-desc" full>
              <Textarea id="f-desc" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </Field>
            <Field label="متراژ / ابعاد" htmlFor="f-area" hint="فقط در صورت وجود اطلاعات واقعی پر کنید">
              <Input id="f-area" value={form.area} onChange={(event) => setForm({ ...form, area: event.target.value })} />
            </Field>
            <Field label="مشخصات فنی" htmlFor="f-specs" hint="فقط در صورت وجود اطلاعات واقعی پر کنید">
              <Input id="f-specs" value={form.specs} onChange={(event) => setForm({ ...form, specs: event.target.value })} />
            </Field>
            <Field label="نشانی تصویر" htmlFor="f-image">
              <Input id="f-image" value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} />
            </Field>
            <Field label="بارگذاری تصویر" htmlFor="f-upload">
              <Input
                id="f-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) upload(file);
                }}
              />
            </Field>
            <Field label="متن جانشین تصویر (alt)" htmlFor="f-alt">
              <Input id="f-alt" value={form.image_alt} onChange={(event) => setForm({ ...form, image_alt: event.target.value })} />
            </Field>
            <Field label="ترتیب نمایش" htmlFor="f-sort">
              <Input
                id="f-sort"
                inputMode="numeric"
                value={form.sort_order}
                onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value.replace(/\D/g, '')) || 0 })}
              />
            </Field>
          </FormGrid>

          <div className="row row--wrap" style={{ gap: 'var(--sp-5)' }}>
            <CheckboxInput
              id="f-sample"
              label="تصویر نمایشی است (نمایش برچسب «نمونه طراحی»)"
              checked={form.is_sample}
              onChange={(event) => setForm({ ...form, is_sample: event.target.checked })}
            />
            <CheckboxInput
              id="f-published"
              label="انتشار در سایت"
              checked={form.is_published}
              onChange={(event) => setForm({ ...form, is_published: event.target.checked })}
            />
          </div>

          {form.image ? (
            <img
              src={form.image}
              alt="پیش‌نمایش نمونه‌کار"
              style={{ width: '220px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-neutral)' }}
            />
          ) : null}

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
