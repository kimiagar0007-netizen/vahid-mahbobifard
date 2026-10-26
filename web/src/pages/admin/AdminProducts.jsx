import { useState } from 'react';
import { api, qs } from '../../lib/api.js';
import { useAsync, useCategories } from '../../lib/hooks.js';
import { formatNumber, formatToman } from '../../lib/format.js';
import { Badge } from '../../components/ui/Display.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { CheckboxInput, Field, FormGrid, Input, Select, Textarea } from '../../components/ui/Form.jsx';
import { EmptyState, FieldErrors, Loading, Notice } from '../../components/ui/Feedback.jsx';
import { Icon } from '../../components/ui/Icons.jsx';

const EMPTY = {
  name: '',
  slug: '',
  category_id: '',
  description: '',
  image: '',
  image_alt: '',
  price: '',
  sale_price: '',
  unit: '',
  stock_quantity: '',
  is_published: false,
  is_featured: false,
  seo_title: '',
  seo_description: '',
};

export default function AdminProducts() {
  const { categories } = useCategories();
  const [filters, setFilters] = useState({ q: '', category_id: '', only_unpriced: false });
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState(EMPTY);
  const [state, setState] = useState({ saving: false, error: null, fields: {}, uploading: false });
  const [notice, setNotice] = useState(null);

  const { data, loading, error, reload } = useAsync(
    () =>
      api.get(
        `/admin/products${qs({
          q: filters.q,
          category_id: filters.category_id,
          only_unpriced: filters.only_unpriced ? 1 : '',
        })}`,
      ),
    [filters.q, filters.category_id, filters.only_unpriced],
  );

  const items = data?.items ?? [];

  const openCreate = () => {
    setEditing('new');
    setForm(EMPTY);
    setState({ saving: false, error: null, fields: {}, uploading: false });
  };

  const openEdit = (product) => {
    setEditing(product.id);
    setForm({
      name: product.name ?? '',
      slug: product.slug ?? '',
      category_id: product.category?.id ?? '',
      description: product.description ?? '',
      image: product.image ?? '',
      image_alt: product.image_alt ?? '',
      price: product.price ?? '',
      sale_price: product.sale_price ?? '',
      unit: product.unit ?? '',
      stock_quantity: product.stock_quantity ?? '',
      is_published: product.is_published,
      is_featured: product.is_featured,
      seo_title: product.seo_title ?? '',
      seo_description: product.seo_description ?? '',
    });
    setState({ saving: false, error: null, fields: {}, uploading: false });
  };

  const save = async (event) => {
    event.preventDefault();
    setState((current) => ({ ...current, saving: true, error: null, fields: {} }));
    const payload = {
      ...form,
      category_id: form.category_id === '' ? null : Number(form.category_id),
      price: form.price === '' ? null : String(form.price),
      sale_price: form.sale_price === '' ? null : String(form.sale_price),
      stock_quantity: form.stock_quantity === '' ? null : String(form.stock_quantity),
    };
    try {
      if (editing === 'new') await api.post('/admin/products', payload);
      else await api.put(`/admin/products/${editing}`, payload);
      setNotice({ variant: 'success', text: editing === 'new' ? 'محصول جدید ثبت شد.' : 'تغییرات محصول ذخیره شد.' });
      setEditing(null);
      reload();
    } catch (requestError) {
      setState((current) => ({
        ...current,
        saving: false,
        error: requestError.message,
        fields: requestError.fields ?? {},
      }));
    }
  };

  const upload = async (file) => {
    const payload = new FormData();
    payload.append('image', file);
    setState((current) => ({ ...current, uploading: true, error: null }));
    try {
      const res = await api.post('/admin/uploads', payload);
      setForm((current) => ({ ...current, image: res.url }));
      setState((current) => ({ ...current, uploading: false }));
    } catch (requestError) {
      setState((current) => ({ ...current, uploading: false, error: requestError.message }));
    }
  };

  const remove = async (product) => {
    if (!window.confirm(`محصول «${product.name}» حذف شود؟ این عملیات قابل بازگشت نیست.`)) return;
    try {
      await api.del(`/admin/products/${product.id}`);
      setNotice({ variant: 'success', text: 'محصول حذف شد.' });
      reload();
    } catch (requestError) {
      setNotice({ variant: 'error', text: requestError.message });
    }
  };

  return (
    <>
      <div className="admin__topbar">
        <div>
          <h1 className="admin__title">محصولات</h1>
          <p className="admin__subtitle">مدیریت قیمت، تخفیف، موجودی، تصویر و وضعیت انتشار محصولات</p>
        </div>
        <div className="admin__actions">
          <Button variant="primary" size="sm" onClick={openCreate}>
            <Icon name="plus" size={16} />
            محصول جدید
          </Button>
        </div>
      </div>

      {notice ? (
        <div style={{ marginBottom: 'var(--sp-4)' }}>
          <Notice variant={notice.variant}>{notice.text}</Notice>
        </div>
      ) : null}

      <div className="toolbar">
        <Input
          aria-label="جست‌وجوی محصول"
          placeholder="جست‌وجو در نام محصول…"
          value={filters.q}
          onChange={(event) => setFilters({ ...filters, q: event.target.value })}
        />
        <Select
          aria-label="فیلتر دسته‌بندی"
          value={filters.category_id}
          onChange={(event) => setFilters({ ...filters, category_id: event.target.value })}
        >
          <option value="">همه دسته‌بندی‌ها</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </Select>
        <CheckboxInput
          id="only-unpriced"
          label="فقط محصولات بدون قیمت"
          checked={filters.only_unpriced}
          onChange={(event) => setFilters({ ...filters, only_unpriced: event.target.checked })}
        />
      </div>

      {loading ? <Loading label="در حال دریافت محصولات…" /> : null}
      {error ? <Notice variant="error">{error}</Notice> : null}

      {!loading && !error ? (
        items.length ? (
          <div className="panel panel--flush">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>محصول</th>
                    <th>دسته‌بندی</th>
                    <th>قیمت</th>
                    <th>فروش ویژه</th>
                    <th>موجودی</th>
                    <th>وضعیت</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((product) => (
                    <tr key={product.id}>
                      <td className="table__wrap-cell">
                        {product.name}
                        <div className="muted small">{product.slug}</div>
                      </td>
                      <td>{product.category?.name || '—'}</td>
                      <td>{product.price ? formatToman(product.price) : <span className="muted">ثبت نشده</span>}</td>
                      <td>{product.sale_price ? formatToman(product.sale_price) : '—'}</td>
                      <td>
                        {product.stock_quantity === null ? (
                          <span className="muted">ثبت نشده</span>
                        ) : (
                          formatNumber(product.stock_quantity)
                        )}
                      </td>
                      <td>
                        <div className="row" style={{ gap: '6px', flexWrap: 'wrap' }}>
                          <Badge tone={product.is_published ? 'success' : 'neutral'}>
                            {product.is_published ? 'منتشرشده' : 'منتشرنشده'}
                          </Badge>
                          {product.is_featured ? <Badge tone="gold">منتخب</Badge> : null}
                        </div>
                      </td>
                      <td>
                        <div className="table__actions">
                          <Button variant="secondary" size="sm" onClick={() => openEdit(product)}>
                            <Icon name="edit" size={16} />
                            ویرایش
                          </Button>
                          <Button variant="danger" size="sm" onClick={() => remove(product)}>
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
          <EmptyState title="محصولی با این فیلترها پیدا نشد" icon={<Icon name="package" size={26} />}>
            فیلترها را تغییر دهید یا محصول جدید اضافه کنید.
          </EmptyState>
        )
      ) : null}

      <Modal
        open={editing !== null}
        onClose={() => setEditing(null)}
        wide
        title={editing === 'new' ? 'افزودن محصول جدید' : 'ویرایش محصول'}
      >
        <form className="form" onSubmit={save}>
          {state.error ? <Notice variant="error">{state.error}</Notice> : null}
          {Object.keys(state.fields).length ? <FieldErrors fields={state.fields} /> : null}

          <FormGrid>
            <Field label="نام محصول" htmlFor="p-name" required error={state.fields.name}>
              <Input id="p-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
            </Field>
            <Field label="نشانی (slug)" htmlFor="p-slug" hint="خالی بماند، از نام ساخته می‌شود">
              <Input id="p-slug" value={form.slug} onChange={(event) => setForm({ ...form, slug: event.target.value })} />
            </Field>
            <Field label="دسته‌بندی" htmlFor="p-category">
              <Select id="p-category" value={form.category_id} onChange={(event) => setForm({ ...form, category_id: event.target.value })}>
                <option value="">بدون دسته‌بندی</option>
                {categories.map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label="واحد فروش" htmlFor="p-unit" hint="مثال: برگ، شاخه، بسته">
              <Input id="p-unit" value={form.unit} onChange={(event) => setForm({ ...form, unit: event.target.value })} />
            </Field>
            <Field label="توضیح محصول" htmlFor="p-desc" full>
              <Textarea id="p-desc" value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} />
            </Field>
          </FormGrid>

          <div className="panel" style={{ marginBottom: 0 }}>
            <h3 className="panel__title">قیمت و موجودی</h3>
            <p className="form__note">
              اگر قیمت را خالی بگذارید، محصول با وضعیت «قیمت ثبت نشده» نمایش داده می‌شود و خرید آن غیرفعال می‌ماند.
            </p>
            <FormGrid columns={3}>
              <Field label="قیمت (تومان)" htmlFor="p-price" error={state.fields.price}>
                <Input
                  id="p-price"
                  inputMode="numeric"
                  value={form.price}
                  onChange={(event) => setForm({ ...form, price: event.target.value })}
                />
              </Field>
              <Field label="قیمت فروش ویژه" htmlFor="p-sale" error={state.fields.sale_price} hint="باید کمتر از قیمت اصلی باشد">
                <Input
                  id="p-sale"
                  inputMode="numeric"
                  value={form.sale_price}
                  onChange={(event) => setForm({ ...form, sale_price: event.target.value })}
                />
              </Field>
              <Field label="موجودی انبار" htmlFor="p-stock" error={state.fields.stock_quantity} hint="خالی = استعلام موجودی">
                <Input
                  id="p-stock"
                  inputMode="numeric"
                  value={form.stock_quantity}
                  onChange={(event) => setForm({ ...form, stock_quantity: event.target.value })}
                />
              </Field>
            </FormGrid>
          </div>

          <div className="panel" style={{ marginBottom: 0 }}>
            <h3 className="panel__title">تصویر محصول</h3>
            <FormGrid>
              <Field label="نشانی تصویر" htmlFor="p-image" hint="می‌توانید نشانی تصویر را وارد کنید یا فایل بارگذاری کنید">
                <Input id="p-image" value={form.image} onChange={(event) => setForm({ ...form, image: event.target.value })} />
              </Field>
              <Field label="بارگذاری تصویر" htmlFor="p-upload" error={state.uploading ? 'در حال بارگذاری…' : null}>
                <Input
                  id="p-upload"
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/svg+xml"
                  onChange={(event) => {
                    const file = event.target.files?.[0];
                    if (file) upload(file);
                  }}
                />
              </Field>
              <Field label="متن جانشین تصویر (alt)" htmlFor="p-alt">
                <Input id="p-alt" value={form.image_alt} onChange={(event) => setForm({ ...form, image_alt: event.target.value })} />
              </Field>
            </FormGrid>
            {form.image ? (
              <img
                src={form.image}
                alt="پیش‌نمایش تصویر محصول"
                style={{ width: '160px', borderRadius: 'var(--radius-sm)', border: '1px solid var(--border-neutral)' }}
              />
            ) : null}
          </div>

          <FormGrid>
            <Field label="عنوان سئو" htmlFor="p-seo-title">
              <Input id="p-seo-title" value={form.seo_title} onChange={(event) => setForm({ ...form, seo_title: event.target.value })} />
            </Field>
            <Field label="توضیح متای سئو" htmlFor="p-seo-desc">
              <Input
                id="p-seo-desc"
                value={form.seo_description}
                onChange={(event) => setForm({ ...form, seo_description: event.target.value })}
              />
            </Field>
          </FormGrid>

          <div className="row row--wrap" style={{ gap: 'var(--sp-5)' }}>
            <CheckboxInput
              id="p-published"
              label="انتشار در فروشگاه"
              checked={form.is_published}
              onChange={(event) => setForm({ ...form, is_published: event.target.checked })}
            />
            <CheckboxInput
              id="p-featured"
              label="نمایش در بخش منتخب صفحه اصلی"
              checked={form.is_featured}
              onChange={(event) => setForm({ ...form, is_featured: event.target.checked })}
            />
          </div>

          <div className="form__actions">
            <Button type="submit" variant="primary" busy={state.saving}>
              ذخیره محصول
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
