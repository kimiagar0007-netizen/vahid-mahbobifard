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

const EMPTY = { name: '', slug: '', description: '', image: '', image_alt: '', is_published: true, sort_order: 0 };

export default function AdminCategories() {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [state, setState] = useState({ saving: false, error: null, fields: {}, uploading: false });
  const [notice, setNotice] = useState(null);

  const { data, loading, error, reload } = useAsync(() => api.get('/admin/categories'), []);
  const items = data?.items ?? [];

  const openCreate = () => {
    setEditing('new');
    setForm({ ...EMPTY, sort_order: items.length });
    setState({ saving: false, error: null, fields: {}, uploading: false });
  };

  const openEdit = (category) => {
    setEditing(category.id);
    setForm({
      name: category.name,
      slug: category.slug,
      description: category.description ?? '',
      image: category.image ?? '',
      image_alt: category.image_alt ?? '',
      is_published: category.is_published,
      sort_order: category.sort_order,
    });
    setState({ saving: false, error: null, fields: {}, uploading: false });
  };

  const save = async (event) => {
    event.preventDefault();
    setState((current) => ({ ...current, saving: true, error: null, fields: {} }));
    try {
      if (editing === 'new') await api.post('/admin/categories', form);
      else await api.put(`/admin/categories/${editing}`, form);
      setNotice({ variant: 'success', text: 'دسته‌بندی ذخیره شد.' });
      setEditing(null);
      reload();
    } catch (requestError) {
      setState((current) => ({ ...current, saving: false, error: requestError.message, fields: requestError.fields ?? {} }));
    }
  };

  const remove = async (category) => {
    if (!window.confirm(`دسته‌بندی «${category.name}» حذف شود؟`)) return;
    try {
      await api.del(`/admin/categories/${category.id}`);
      setNotice({ variant: 'success', text: 'دسته‌بندی حذف شد.' });
      reload();
    } catch (requestError) {
      setNotice({ variant: 'error', text: requestError.message });
    }
  };

  const upload = async (file) => {
    const payload = new FormData();
    payload.append('image', file);
    setState((current) => ({ ...current, uploading: true }));
    try {
      const res = await api.post('/admin/uploads', payload);
      setForm((current) => ({ ...current, image: res.url }));
    } catch (requestError) {
      setNotice({ variant: 'error', text: requestError.message });
    } finally {
      setState((current) => ({ ...current, uploading: false }));
    }
  };

  return (
    <>
      <div className="admin__topbar">
        <div>
          <h1 className="admin__title">دسته‌بندی‌ها</h1>
          <p className="admin__subtitle">دسته‌بندی‌های فروشگاه و تصویر اختصاصی هر دسته</p>
        </div>
        <div className="admin__actions">
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Icon name="plus" size={16} />
            دسته‌بندی جدید
          </Button>
        </div>
      </div>

      {notice ? (
        <div style={{ marginBottom: 'var(--sp-4)' }}>
          <Notice variant={notice.variant}>{notice.text}</Notice>
        </div>
      ) : null}

      {loading ? <Loading label="در حال دریافت دسته‌بندی‌ها…" /> : null}
      {error ? <Notice variant="error">{error}</Notice> : null}

      {!loading && !error ? (
        items.length ? (
          <div className="panel panel--flush">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>دسته‌بندی</th>
                    <th>تعداد محصول</th>
                    <th>ترتیب</th>
                    <th>وضعیت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((category) => (
                    <tr key={category.id}>
                      <td className="table__wrap-cell">
                        {category.name}
                        <div className="muted small">{category.slug}</div>
                      </td>
                      <td>{formatNumber(category.product_count ?? 0)}</td>
                      <td>{formatNumber(category.sort_order)}</td>
                      <td>
                        <Badge tone={category.is_published ? 'success' : 'neutral'}>
                          {category.is_published ? 'منتشرشده' : 'منتشرنشده'}
                        </Badge>
                      </td>
                      <td>
                        <div className="table__actions">
                          <Button variant="secondary" size="sm" onClick={() => openEdit(category)}>
                            <Icon name="edit" size={16} />
                            ویرایش
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => remove(category)}>
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
          <EmptyState title="دسته‌بندی‌ای ثبت نشده است" icon={<Icon name="layers" size={26} />} />
        )
      ) : null}

      <Modal open={editing !== null} onClose={() => setEditing(null)} title={editing === 'new' ? 'افزودن دسته‌بندی' : 'ویرایش دسته‌بندی'}>
        <form className="form" onSubmit={save}>
          {state.error ? <Notice variant="error">{state.error}</Notice> : null}
          {Object.keys(state.fields).length ? <FieldErrors fields={state.fields} /> : null}
          <FormGrid>
            <Field label="نام دسته‌بندی" htmlFor="c-name" required error={state.fields.name}>
              <Input id="c-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </Field>
            <Field label="نشانی (slug)" htmlFor="c-slug" hint="خالی بماند، از نام ساخته می‌شود">
              <Input id="c-slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
            </Field>
            <Field label="توضیح کوتاه" htmlFor="c-desc" full>
              <Textarea id="c-desc" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </Field>
            <Field label="نشانی تصویر" htmlFor="c-image">
              <Input id="c-image" value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} />
            </Field>
            <Field label="بارگذاری تصویر" htmlFor="c-upload">
              <Input
                id="c-upload"
                type="file"
                accept="image/jpeg,image/png,image/webp,image/svg+xml"
                onChange={(event) => {
                  const file = event.target.files?.[0];
                  if (file) upload(file);
                }}
              />
            </Field>
            <Field label="متن جانشین تصویر (alt)" htmlFor="c-alt">
              <Input id="c-alt" value={form.image_alt} onChange={(event) => setForm({ ...form, image_alt: event.target.value })} />
            </Field>
            <Field label="ترتیب نمایش" htmlFor="c-sort">
              <Input
                id="c-sort"
                inputMode="numeric"
                value={form.sort_order}
                onChange={(event) => setForm({ ...form, sort_order: Number(event.target.value.replace(/\D/g, '')) || 0 })}
              />
            </Field>
          </FormGrid>
          <CheckboxInput
            id="c-published"
            label="انتشار در فروشگاه"
            checked={form.is_published}
            onChange={(event) => setForm({ ...form, is_published: event.target.checked })}
          />
          {form.image ? (
            <img
              src={form.image}
              alt="پیش‌نمایش دسته‌بندی"
              style={{ width: '160px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-neutral)' }}
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
