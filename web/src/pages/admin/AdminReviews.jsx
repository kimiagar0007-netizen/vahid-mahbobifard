import { useState } from 'react';
import { api, qs } from '../../lib/api.js';
import { useAsync } from '../../lib/hooks.js';
import { formatDate, formatNumber } from '../../lib/format.js';
import { Badge } from '../../components/ui/Display.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { CheckboxInput, Field, Input, Select, Textarea } from '../../components/ui/Form.jsx';
import { EmptyState, FieldErrors, Loading, Notice } from '../../components/ui/Feedback.jsx';
import { Icon } from '../../components/ui/Icons.jsx';

export default function AdminReviews() {
  const [filter, setFilter] = useState('pending');
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ name: '', rating: '5', text: '', is_published: false });
  const [state, setState] = useState({ saving: false, error: null, fields: {} });
  const [notice, setNotice] = useState(null);

  const { data, loading, error, reload } = useAsync(
    () => api.get(`/admin/reviews${qs({ filter })}`),
    [filter],
  );
  const items = data?.items ?? [];

  const setPublished = async (review, published) => {
    try {
      await api.patch(`/admin/reviews/${review.id}`, { is_published: published });
      setNotice({ variant: 'success', text: published ? 'نظر منتشر شد.' : 'انتشار نظر لغو شد.' });
      reload();
    } catch (requestError) {
      setNotice({ variant: 'error', text: requestError.message });
    }
  };

  const remove = async (review) => {
    if (!window.confirm('این نظر حذف شود؟')) return;
    try {
      await api.del(`/admin/reviews/${review.id}`);
      setNotice({ variant: 'success', text: 'نظر حذف شد.' });
      reload();
    } catch (requestError) {
      setNotice({ variant: 'error', text: requestError.message });
    }
  };

  const create = async (event) => {
    event.preventDefault();
    setState({ saving: true, error: null, fields: {} });
    try {
      await api.post('/admin/reviews', { ...form, rating: Number(form.rating) });
      setNotice({ variant: 'success', text: 'نظر ثبت شد.' });
      setCreating(false);
      setForm({ name: '', rating: '5', text: '', is_published: false });
      reload();
    } catch (requestError) {
      setState({ saving: false, error: requestError.message, fields: requestError.fields ?? {} });
    }
  };

  return (
    <>
      <div className="admin__topbar">
        <div>
          <h1 className="admin__title">نظرات مشتریان</h1>
          <p className="admin__subtitle">
            نظرهای ثبت‌شده در سایت تا زمان تأیید منتشر نمی‌شوند. تا ثبت نظر واقعی، بخش نظرات سایت پیام «به‌زودی» نشان
            می‌دهد.
          </p>
        </div>
        <div className="admin__actions">
          <Button variant="primary" size="sm" onClick={() => setCreating(true)}>
            <Icon name="plus" size={16} />
            ثبت نظر
          </Button>
        </div>
      </div>

      {notice ? (
        <div style={{ marginBottom: 'var(--sp-4)' }}>
          <Notice variant={notice.variant}>{notice.text}</Notice>
        </div>
      ) : null}

      <div className="admin__tabs">
        {[
          ['pending', 'در انتظار تأیید'],
          ['published', 'منتشرشده'],
          ['', 'همه نظرات'],
        ].map(([value, label]) => (
          <button
            key={value || 'all'}
            type="button"
            className={`admin__tab${filter === value ? ' admin__tab--active' : ''}`}
            onClick={() => setFilter(value)}
          >
            {label}
          </button>
        ))}
      </div>

      {loading ? <Loading label="در حال دریافت نظرات…" /> : null}
      {error ? <Notice variant="error">{error}</Notice> : null}

      {!loading && !error ? (
        items.length ? (
          <div className="panel panel--flush">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>نام</th>
                    <th>امتیاز</th>
                    <th>متن نظر</th>
                    <th>وضعیت</th>
                    <th>تاریخ</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((review) => (
                    <tr key={review.id}>
                      <td>{review.name}</td>
                      <td>{formatNumber(review.rating)}</td>
                      <td className="table__wrap-cell">{review.text}</td>
                      <td>
                        <Badge tone={review.is_published ? 'success' : 'warn'}>
                          {review.is_published ? 'منتشرشده' : 'در انتظار تأیید'}
                        </Badge>
                      </td>
                      <td className="muted small">{formatDate(review.created_at)}</td>
                      <td>
                        <div className="table__actions">
                          {review.is_published ? (
                            <Button variant="secondary" size="sm" onClick={() => setPublished(review, false)}>
                              لغو انتشار
                            </Button>
                          ) : (
                            <Button variant="primary" size="sm" onClick={() => setPublished(review, true)}>
                              <Icon name="check" size={16} />
                              تأیید و انتشار
                            </Button>
                          )}
                          <Button variant="danger" size="sm" onClick={() => remove(review)}>
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
          <EmptyState title="نظری در این وضعیت وجود ندارد" icon={<Icon name="star" size={26} />}>
            نظرهای ثبت‌شده در سایت پس از تأیید مدیر در بخش نظرات صفحه اصلی نمایش داده می‌شوند.
          </EmptyState>
        )
      ) : null}

      <Modal open={creating} onClose={() => setCreating(false)} title="ثبت نظر جدید">
        <form className="form" onSubmit={create}>
          {state.error ? <Notice variant="error">{state.error}</Notice> : null}
          {Object.keys(state.fields).length ? <FieldErrors fields={state.fields} /> : null}
          <Field label="نام" htmlFor="rv-name" required>
            <Input id="rv-name" value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} required />
          </Field>
          <Field label="امتیاز" htmlFor="rv-rating" required>
            <Select id="rv-rating" value={form.rating} onChange={(event) => setForm({ ...form, rating: event.target.value })}>
              {[5, 4, 3, 2, 1].map((value) => (
                <option key={value} value={value}>
                  {formatNumber(value)}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="متن نظر" htmlFor="rv-text" required>
            <Textarea id="rv-text" value={form.text} onChange={(event) => setForm({ ...form, text: event.target.value })} required />
          </Field>
          <CheckboxInput
            id="rv-published"
            label="انتشار بلافاصله در سایت"
            checked={form.is_published}
            onChange={(event) => setForm({ ...form, is_published: event.target.checked })}
          />
          <span className="form__note">
            تنها نظرات واقعی را ثبت کنید؛ ساخت نظر جعلی یا امتیاز ساختگی، اعتماد مشتریان را از بین می‌برد.
          </span>
          <div className="form__actions">
            <Button type="submit" variant="primary" busy={state.saving}>
              ثبت نظر
            </Button>
            <Button variant="ghost" onClick={() => setCreating(false)}>
              انصراف
            </Button>
          </div>
        </form>
      </Modal>
    </>
  );
}
