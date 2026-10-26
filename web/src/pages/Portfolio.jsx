import { useEffect, useState } from 'react';
import { api, qs } from '../lib/api.js';
import { useAsync } from '../lib/hooks.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { useSeo } from '../lib/seo.js';
import { Badge, Crumbs } from '../components/ui/Display.jsx';
import { Button, ButtonLink } from '../components/ui/Button.jsx';
import { EmptyState, Loading, Notice } from '../components/ui/Feedback.jsx';
import { Icon } from '../components/ui/Icons.jsx';

export default function Portfolio() {
  const { seo } = useSettings();
  const [filter, setFilter] = useState('');
  const [active, setActive] = useState(null);

  const { data, loading, error } = useAsync(
    () => api.get(`/catalog/portfolio${qs({ category: filter })}`),
    [filter],
  );

  useSeo({
    title: 'پروژه‌ها و نمونه‌کارهای کناف | کناف کرج',
    description: 'گالری نمونه‌کارهای اجرای سقف کاذب، دیوار خشک و سقف‌های دکوراتیو کناف با امکان فیلتر بر اساس نوع پروژه.',
    keywords: seo.keywords,
    path: '/portfolio',
    siteUrl: seo.site_url,
    siteName: 'کناف کرج',
  });

  useEffect(() => {
    if (!active) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') setActive(null);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [active]);

  const items = data?.items ?? [];
  const categories = data?.categories ?? [];
  const hasSamples = items.some((item) => item.is_sample);

  return (
    <>
      <header className="page-head">
        <div className="container">
          <Crumbs items={[{ name: 'پروژه‌ها و نمونه‌کارها' }]} />
          <h1 className="page-head__title">پروژه‌ها و نمونه‌کارها</h1>
          <p className="page-head__text">
            نمونه‌کارهای اجرای کناف در پروژه‌های مسکونی، تجاری، اداری و بازسازی. مشخصات فنی و متراژ تنها در صورت ثبت
            اطلاعات واقعی نمایش داده می‌شود.
          </p>
        </div>
      </header>

      <section className="section">
        <div className="container">
          {categories.length > 1 ? (
            <div className="filter-chips" role="group" aria-label="فیلتر نوع پروژه">
              <button type="button" className={`chip${!filter ? ' chip--active' : ''}`} onClick={() => setFilter('')}>
                همه پروژه‌ها
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  className={`chip${filter === category ? ' chip--active' : ''}`}
                  onClick={() => setFilter(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          ) : null}

          {loading ? <Loading label="در حال دریافت نمونه‌کارها…" /> : null}
          {error ? <Notice variant="error">دریافت نمونه‌کارها ناموفق بود: {error}</Notice> : null}

          {!loading && !error && items.length ? (
            <div className="portfolio-grid">
              {items.map((item) => (
                <article className="card portfolio-card" key={item.id}>
                  <button
                    type="button"
                    className="card__media"
                    onClick={() => setActive(item)}
                    aria-label={`مشاهده تصویر بزرگ ${item.title}`}
                    style={{ display: 'block', width: '100%', border: 0, padding: 0, cursor: 'zoom-in' }}
                  >
                    <img src={item.image} alt={item.image_alt} loading="lazy" />
                    {item.is_sample ? <span className="card__tag"><Badge tone="sample">نمونه طراحی</Badge></span> : null}
                  </button>
                  <div className="card__body">
                    {item.category ? <span className="card__meta gold">{item.category}</span> : null}
                    <h2 className="card__title">{item.title}</h2>
                    <p className="card__text">{item.description}</p>
                    {item.area ? (
                      <span className="card__meta">
                        <Icon name="ruler" size={16} />
                        {item.area}
                      </span>
                    ) : null}
                    <div className="card__footer">
                      <Button variant="secondary" size="sm" onClick={() => setActive(item)}>
                        <Icon name="image" size={16} />
                        مشاهده بزرگ
                      </Button>
                    </div>
                  </div>
                </article>
              ))}
            </div>
          ) : null}

          {!loading && !error && !items.length ? (
            <EmptyState title="نمونه‌کاری در این دسته ثبت نشده است" icon={<Icon name="image" size={26} />}>
              با حذف فیلتر، سایر نمونه‌کارها را ببینید.
            </EmptyState>
          ) : null}

          {hasSamples ? (
            <p className="form__note mt-6">
              تصاویر دارای برچسب «نمونه طراحی» تصاویر نمایشی هستند و تا زمان ثبت نمونه‌کار واقعی توسط مدیر، تنها ساختار
              گالری را نمایش می‌دهند. هیچ نام کارفرما، آمار یا رضایت‌نامه‌ای در این بخش ساخته نشده است.
            </p>
          ) : null}

          <div className="mt-6">
            <ButtonLink to="/project-inquiry" variant="primary">
              <Icon name="clipboardCheck" size={18} />
              درخواست اجرای پروژه مشابه
            </ButtonLink>
          </div>
        </div>
      </section>

      {active ? (
        <div className="modal" role="dialog" aria-modal="true" aria-label={active.title}>
          <button type="button" className="modal__backdrop" aria-label="بستن" onClick={() => setActive(null)} />
          <div className="modal__panel">
            <div className="modal__header">
              <div>
                <h2 className="modal__title">{active.title}</h2>
                <span className="card__meta">
                  {active.category}
                  {active.is_sample ? ' — نمونه طراحی (تصویر نمایشی)' : ''}
                </span>
              </div>
              <button type="button" className="modal__close" onClick={() => setActive(null)} aria-label="بستن">
                <Icon name="close" size={18} />
              </button>
            </div>
            <div className="modal__body">
              <img
                src={active.image}
                alt={active.image_alt}
                style={{ width: '100%', borderRadius: 'var(--radius-md)', border: '1px solid var(--border-neutral)' }}
              />
              {active.description ? <p className="mt-4">{active.description}</p> : null}
              {active.area || active.specs ? (
                <ul className="fact-grid">
                  {active.area ? (
                    <li className="fact">
                      <span className="fact__label">متراژ / ابعاد</span>
                      <span className="fact__value">{active.area}</span>
                    </li>
                  ) : null}
                  {active.specs ? (
                    <li className="fact">
                      <span className="fact__label">مشخصات فنی</span>
                      <span className="fact__value">{active.specs}</span>
                    </li>
                  ) : null}
                </ul>
              ) : null}
              <ButtonLink to="/project-inquiry" variant="primary" size="sm">
                درخواست پروژه مشابه
              </ButtonLink>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
