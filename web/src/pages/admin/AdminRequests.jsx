import { useState } from 'react';
import { api, qs } from '../../lib/api.js';
import { useAsync } from '../../lib/hooks.js';
import {
  formatBytes,
  formatDateTime,
  PROJECT_TYPES,
  PREFERRED_CONTACT,
  REQUEST_STATUS,
  toPersianDigits,
} from '../../lib/format.js';
import { Badge, StatusBadge } from '../../components/ui/Display.jsx';
import Modal from '../../components/ui/Modal.jsx';
import { Button } from '../../components/ui/Button.jsx';
import { Field, Select, Textarea } from '../../components/ui/Form.jsx';
import { EmptyState, Loading, Notice } from '../../components/ui/Feedback.jsx';
import { Icon } from '../../components/ui/Icons.jsx';

export default function AdminRequests() {
  const [tab, setTab] = useState('project');
  const [statusFilter, setStatusFilter] = useState('');
  const [detail, setDetail] = useState(null);
  const [statusForm, setStatusForm] = useState({ status: 'new', note: '' });
  const [state, setState] = useState({ busy: false, error: null });
  const [notice, setNotice] = useState(null);

  const projectQuery = useAsync(
    () => api.get(`/admin/project-requests${qs({ status: statusFilter })}`),
    [statusFilter, tab],
    { immediate: tab === 'project' },
  );
  const wholesaleQuery = useAsync(
    () => api.get(`/admin/wholesale-requests${qs({ status: statusFilter })}`),
    [statusFilter, tab],
    { immediate: tab === 'wholesale' },
  );

  const query = tab === 'project' ? projectQuery : wholesaleQuery;
  const items = query.data?.items ?? [];

  const patch = async (payload) => {
    setState({ busy: true, error: null });
    const path = tab === 'project' ? '/admin/project-requests' : '/admin/wholesale-requests';
    try {
      const res = await api.patch(`${path}/${detail.id}`, payload);
      setDetail(res.item);
      setStatusForm({ status: res.item.status, note: '' });
      setNotice({ variant: 'success', text: 'درخواست به‌روزرسانی شد.' });
      query.reload();
    } catch (requestError) {
      setState({ busy: false, error: requestError.message });
      return;
    }
    setState({ busy: false, error: null });
  };

  const remove = async () => {
    if (!window.confirm(`درخواست ${detail.tracking_code} حذف شود؟`)) return;
    const path = tab === 'project' ? '/admin/project-requests' : '/admin/wholesale-requests';
    try {
      await api.del(`${path}/${detail.id}`);
      setDetail(null);
      setNotice({ variant: 'success', text: 'درخواست حذف شد.' });
      query.reload();
    } catch (requestError) {
      setNotice({ variant: 'error', text: requestError.message });
    }
  };

  const openDetail = async (item) => {
    setState({ busy: false, error: null });
    setDetail(item);
    setStatusForm({ status: item.status, note: '' });
    try {
      const path = tab === 'project' ? '/admin/project-requests' : '/admin/wholesale-requests';
      const res = await api.get(`${path}${qs({ status: '' })}`);
      const fresh = res.items.find((row) => row.id === item.id);
      if (fresh) setDetail(fresh);
    } catch {
      /* keep the row we already have */
    }
  };

  return (
    <>
      <div className="admin__topbar">
        <div>
          <h1 className="admin__title">درخواست‌ها</h1>
          <p className="admin__subtitle">درخواست‌های استعلام اجرای پروژه و خرید عمده</p>
        </div>
      </div>

      {notice ? (
        <div style={{ marginBottom: 'var(--sp-4)' }}>
          <Notice variant={notice.variant}>{notice.text}</Notice>
        </div>
      ) : null}

      <div className="admin__tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'project'}
          className={`admin__tab${tab === 'project' ? ' admin__tab--active' : ''}`}
          onClick={() => {
            setTab('project');
            setDetail(null);
          }}
        >
          استعلام اجرای پروژه
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'wholesale'}
          className={`admin__tab${tab === 'wholesale' ? ' admin__tab--active' : ''}`}
          onClick={() => {
            setTab('wholesale');
            setDetail(null);
          }}
        >
          درخواست خرید عمده
        </button>
      </div>

      <div className="toolbar">
        <Select aria-label="فیلتر وضعیت" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
          <option value="">همه وضعیت‌ها</option>
          {Object.entries(REQUEST_STATUS).map(([value, meta]) => (
            <option key={value} value={value}>
              {meta.label}
            </option>
          ))}
        </Select>
      </div>

      {query.loading ? <Loading label="در حال دریافت درخواست‌ها…" /> : null}
      {query.error ? <Notice variant="error">{query.error}</Notice> : null}

      {!query.loading && !query.error ? (
        items.length ? (
          <div className="panel panel--flush">
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>کد پیگیری</th>
                    <th>نام</th>
                    <th>تلفن</th>
                    <th>{tab === 'project' ? 'خدمت' : 'محصول'}</th>
                    <th>وضعیت</th>
                    <th>تاریخ</th>
                    <th>عملیات</th>
                  </tr>
                </thead>
                <tbody>
                  {items.map((item) => (
                    <tr key={item.id}>
                      <td>
                        {item.tracking_code}
                        {item.is_test ? <Badge tone="warn">آزمایشی</Badge> : null}
                      </td>
                      <td>{tab === 'project' ? item.customer_name : item.full_name}</td>
                      <td>{toPersianDigits(item.phone)}</td>
                      <td className="table__wrap-cell">{tab === 'project' ? item.service_type : item.product_type}</td>
                      <td><StatusBadge map={REQUEST_STATUS} value={item.status} /></td>
                      <td className="muted small">{formatDateTime(item.created_at)}</td>
                      <td>
                        <Button variant="secondary" size="sm" onClick={() => openDetail(item)}>
                          <Icon name="search" size={16} />
                          بررسی
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <EmptyState title="درخواستی با این فیلتر پیدا نشد" icon={<Icon name="clipboardCheck" size={26} />} />
        )
      ) : null}

      <Modal open={Boolean(detail)} onClose={() => setDetail(null)} title={detail ? `درخواست ${detail.tracking_code}` : ''}>
        {detail ? (
          <div className="drawer">
            {state.error ? <Notice variant="error">{state.error}</Notice> : null}

            <div className="row row--wrap" style={{ gap: 'var(--sp-4)' }}>
              <StatusBadge map={REQUEST_STATUS} value={detail.status} />
              <span className="muted small">ثبت: {formatDateTime(detail.created_at)}</span>
            </div>

            <ul className="fact-grid" style={{ margin: 0 }}>
              <li className="fact">
                <span className="fact__label">نام</span>
                <span className="fact__value">{tab === 'project' ? detail.customer_name : detail.full_name}</span>
              </li>
              <li className="fact">
                <span className="fact__label">تلفن</span>
                <span className="fact__value">{toPersianDigits(detail.phone)}</span>
              </li>
              {tab === 'project' ? (
                <>
                  <li className="fact">
                    <span className="fact__label">نوع پروژه</span>
                    <span className="fact__value">{PROJECT_TYPES[detail.project_type] || '—'}</span>
                  </li>
                  <li className="fact">
                    <span className="fact__label">خدمت</span>
                    <span className="fact__value">{detail.service_type}</span>
                  </li>
                  <li className="fact">
                    <span className="fact__label">متراژ تقریبی</span>
                    <span className="fact__value">{detail.estimated_area || 'ثبت نشده'}</span>
                  </li>
                  <li className="fact">
                    <span className="fact__label">محل پروژه</span>
                    <span className="fact__value">{detail.location}</span>
                  </li>
                  <li className="fact">
                    <span className="fact__label">روش تماس ترجیحی</span>
                    <span className="fact__value">{PREFERRED_CONTACT[detail.preferred_contact] || '—'}</span>
                  </li>
                </>
              ) : (
                <>
                  <li className="fact">
                    <span className="fact__label">شرکت</span>
                    <span className="fact__value">{detail.company || '—'}</span>
                  </li>
                  <li className="fact">
                    <span className="fact__label">نوع محصول</span>
                    <span className="fact__value">{detail.product_type}</span>
                  </li>
                  <li className="fact">
                    <span className="fact__label">مقدار تقریبی</span>
                    <span className="fact__value">{detail.estimated_quantity}</span>
                  </li>
                  <li className="fact">
                    <span className="fact__label">شهر تحویل</span>
                    <span className="fact__value">{detail.city}</span>
                  </li>
                </>
              )}
              <li className="fact" style={{ gridColumn: '1 / -1' }}>
                <span className="fact__label">توضیحات</span>
                <span className="fact__value">{detail.description || '—'}</span>
              </li>
            </ul>

            {tab === 'project' && detail.attachments?.length ? (
              <div>
                <h3 className="panel__title">فایل‌های پیوست</h3>
                <ul className="file-list">
                  {detail.attachments.map((file) => (
                    <li key={file.stored}>
                      <a href={`/api/admin/attachments/${file.stored}`} target="_blank" rel="noreferrer noopener">
                        <Icon name="download" size={14} /> {file.name} — {formatBytes(file.size)}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="grid grid--2">
              <Field label="تغییر وضعیت" htmlFor="r-status">
                <Select id="r-status" value={statusForm.status} onChange={(event) => setStatusForm({ ...statusForm, status: event.target.value })}>
                  {Object.entries(REQUEST_STATUS).map(([value, meta]) => (
                    <option key={value} value={value}>{meta.label}</option>
                  ))}
                </Select>
              </Field>
              <Field label="یادداشت مدیر" htmlFor="r-note">
                <Textarea
                  id="r-note"
                  value={statusForm.note}
                  onChange={(event) => setStatusForm({ ...statusForm, note: event.target.value })}
                  placeholder="توضیح داخلی برای پیگیری این درخواست"
                />
              </Field>
            </div>

            <div className="form__actions">
              <Button variant="primary" busy={state.busy} onClick={() => patch({ status: statusForm.status, note: statusForm.note || undefined })}>
                ذخیره وضعیت
              </Button>
              <Button variant="secondary" busy={state.busy} onClick={() => patch({ is_test: detail.is_test ? 0 : 1, status: detail.status })}>
                {detail.is_test ? 'حذف برچسب آزمایشی' : 'علامت‌گذاری آزمایشی'}
              </Button>
              <Button variant="danger" onClick={remove}>
                <Icon name="trash" size={16} />
                حذف درخواست
              </Button>
            </div>

            {detail.admin_note ? <Notice variant="info" title="یادداشت ثبت‌شده">{detail.admin_note}</Notice> : null}
          </div>
        ) : null}
      </Modal>
    </>
  );
}
