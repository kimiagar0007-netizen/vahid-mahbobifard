import { useState } from 'react';
import { useAsync } from '../../lib/hooks.js';
import { api } from '../../lib/api.js';
import { useSettings } from '../../context/SettingsContext.jsx';
import { formatDate, telHref, whatsappHref } from '../../lib/format.js';
import { ButtonLink } from '../ui/Button.jsx';
import { SectionHeading } from '../ui/Display.jsx';
import { CheckboxInput, Field, Input, Select, Textarea } from '../ui/Form.jsx';
import { Loading, Notice } from '../ui/Feedback.jsx';
import { Icon } from '../ui/Icons.jsx';

function Stars({ value = 5 }) {
  return (
    <span className="review-card__stars" aria-label={`${value} از ۵`}>
      {Array.from({ length: 5 }).map((_, index) => (
        <Icon key={index} name="star" size={16} style={{ opacity: index < value ? 1 : 0.25 }} strokeWidth={1.4} />
      ))}
    </span>
  );
}

export default function ReviewsCta() {
  const { home, phone, whatsapp } = useSettings();
  const { data, loading, reload } = useAsync(async () => {
    const res = await api.get('/catalog/reviews');
    return res.items ?? [];
  }, []);
  const [form, setForm] = useState({ name: '', rating: '5', text: '' });
  const [state, setState] = useState({ busy: false, error: null, fields: {}, done: false });

  const submit = async (event) => {
    event.preventDefault();
    setState({ busy: true, error: null, fields: {}, done: false });
    try {
      await api.post('/reviews', { ...form, rating: Number(form.rating), privacy_note: true });
      setState({ busy: false, error: null, fields: {}, done: true });
      setForm({ name: '', rating: '5', text: '' });
      reload();
    } catch (error) {
      setState({ busy: false, error: error.message, fields: error.fields ?? {}, done: false });
    }
  };

  const reviews = data ?? [];

  return (
    <section className="section" id="reviews">
      <div className="container">
        <div className="grid grid--2" style={{ alignItems: 'start', gap: '48px' }}>
          <div>
            <SectionHeading
              eyebrow="نظر مشتریان"
              title="نظرات مشتریان کناف کرج"
              text="نظرها پس از بررسی و تأیید مدیر در این بخش منتشر می‌شوند."
            />
            {loading ? <Loading label="در حال دریافت نظرات…" /> : null}
            {!loading && !reviews.length ? (
              <Notice variant="info">نظرات مشتریان به‌زودی اضافه می‌شود. تا ثبت نظر واقعی، هیچ نظر یا امتیازی در سایت نمایش داده نمی‌شود.</Notice>
            ) : null}
            {reviews.length ? (
              <div className="stack">
                {reviews.slice(0, 4).map((review) => (
                  <article className="review-card" key={review.id}>
                    <Stars value={review.rating} />
                    <p className="review-card__text">{review.text}</p>
                    <span className="review-card__author">
                      {review.name} — {formatDate(review.created_at)}
                    </span>
                  </article>
                ))}
              </div>
            ) : null}
          </div>

          <div className="aside-card">
            <h3 style={{ margin: 0 }}>ثبت نظر</h3>
            <p className="form__note" style={{ margin: 0 }}>
              اگر از کناف کرج خرید کرده‌اید، می‌توانید تجربه خود را ثبت کنید. نظر شما پس از تأیید مدیر منتشر می‌شود.
            </p>
            <form className="form" onSubmit={submit} noValidate>
              {state.error ? <Notice variant="error">{state.error}</Notice> : null}
              {state.done ? <Notice variant="success">نظر شما ثبت شد و پس از تأیید مدیر منتشر می‌شود.</Notice> : null}
              <Field label="نام شما" htmlFor="review-name" required error={state.fields.name}>
                <Input
                  id="review-name"
                  value={form.name}
                  invalid={Boolean(state.fields.name)}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  required
                />
              </Field>
              <Field label="امتیاز" htmlFor="review-rating" required>
                <Select id="review-rating" value={form.rating} onChange={(event) => setForm({ ...form, rating: event.target.value })}>
                  <option value="5">۵ — عالی</option>
                  <option value="4">۴ — خوب</option>
                  <option value="3">۳ — متوسط</option>
                  <option value="2">۲ — ضعیف</option>
                  <option value="1">۱ — بسیار ضعیف</option>
                </Select>
              </Field>
              <Field label="متن نظر" htmlFor="review-text" required error={state.fields.text}>
                <Textarea
                  id="review-text"
                  value={form.text}
                  invalid={Boolean(state.fields.text)}
                  onChange={(event) => setForm({ ...form, text: event.target.value })}
                  required
                />
              </Field>
              <CheckboxInput id="review-privacy" label="با انتشار نام و متن نظر خود در سایت موافقم." required />
              <button className="btn btn--secondary" type="submit" disabled={state.busy}>
                {state.busy ? 'در حال ارسال…' : 'ارسال نظر'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}

export function CtaBand() {
  const { home, phone, whatsapp } = useSettings();
  return (
    <section className="cta-band">
      <div className="cta-band__media">
        <img src={home.cta_image || '/images/sections/cta-professional-installation.svg'} alt={home.cta_image_alt || 'اجرای کناف'} loading="lazy" />
      </div>
      <div className="cta-band__scrim" aria-hidden="true" />
      <div className="container cta-band__inner">
        <div className="cta-band__text">
          <h2>{home.cta_title}</h2>
          <p style={{ marginBottom: 0 }}>{home.cta_text}</p>
        </div>
        <div className="cta-band__actions">
          <ButtonLink to="/shop" variant="primary">
            <Icon name="cart" size={18} />
            مشاهده فروشگاه
          </ButtonLink>
          <ButtonLink to="/project-inquiry" variant="secondary">
            <Icon name="clipboardCheck" size={18} />
            استعلام اجرای پروژه
          </ButtonLink>
          {phone ? (
            <a className="btn btn--secondary" href={telHref(phone)}>
              <Icon name="phone" size={18} />
              تماس با ما
            </a>
          ) : whatsapp ? (
            <a className="btn btn--secondary" href={whatsappHref(whatsapp)} target="_blank" rel="noreferrer noopener">
              <Icon name="whatsapp" size={18} />
              واتساپ
            </a>
          ) : (
            <ButtonLink to="/contact" variant="secondary">
              <Icon name="phone" size={18} />
              تماس با ما
            </ButtonLink>
          )}
        </div>
      </div>
    </section>
  );
}
