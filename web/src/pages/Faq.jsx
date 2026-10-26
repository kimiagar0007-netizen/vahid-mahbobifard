import { api } from '../lib/api.js';
import { useAsync } from '../lib/hooks.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { useSeo } from '../lib/seo.js';
import { Crumbs } from '../components/ui/Display.jsx';
import { ButtonLink } from '../components/ui/Button.jsx';
import { EmptyState, Loading, Notice } from '../components/ui/Feedback.jsx';
import { Icon } from '../components/ui/Icons.jsx';
import { parseContent } from '../lib/content.js';

export default function Faq() {
  const { seo } = useSettings();
  const { data, loading, error } = useAsync(async () => {
    const [faqs, page] = await Promise.all([api.get('/catalog/faqs'), api.get('/pages/faq')]);
    return { faqs: faqs.items ?? [], page: page.page };
  }, []);

  useSeo({
    title: data?.page?.seo_title || 'پرسش‌های متداول | کناف کرج',
    description: data?.page?.seo_description || 'پاسخ پرسش‌های پرتکرار درباره خرید، ارسال، پرداخت و استعلام اجرای پروژه کناف.',
    path: '/faq',
    siteUrl: seo.site_url,
    siteName: 'کناف کرج',
    jsonLd:
      data?.faqs?.length
        ? {
            '@context': 'https://schema.org',
            '@type': 'FAQPage',
            mainEntity: data.faqs.map((faq) => ({
              '@type': 'Question',
              name: faq.question,
              acceptedAnswer: { '@type': 'Answer', text: faq.answer },
            })),
          }
        : null,
  });

  const faqs = data?.faqs ?? [];
  const intro = parseContent(data?.page?.body ?? '');

  return (
    <>
      <header className="page-head">
        <div className="container">
          <Crumbs items={[{ name: 'پرسش‌های متداول' }]} />
          <h1 className="page-head__title">پرسش‌های متداول</h1>
          {intro.map((block, index) =>
            block.type === 'p' ? <p className="page-head__text" key={index}>{block.text}</p> : null,
          )}
        </div>
      </header>

      <section className="section">
        <div className="container container--narrow">
          {loading ? <Loading label="در حال دریافت پرسش‌ها…" /> : null}
          {error ? <Notice variant="error">دریافت پرسش‌ها ناموفق بود: {error}</Notice> : null}

          {!loading && !error && faqs.length ? (
            <div className="faq-list">
              {faqs.map((faq) => (
                <details className="faq-item" key={faq.id}>
                  <summary className="faq-item__summary">
                    <span>{faq.question}</span>
                    <Icon name="chevronLeft" size={18} />
                  </summary>
                  <div className="faq-item__answer">{faq.answer}</div>
                </details>
              ))}
            </div>
          ) : null}

          {!loading && !error && !faqs.length ? (
            <EmptyState title="پرسشی ثبت نشده است" icon={<Icon name="info" size={26} />}>
              پرسش‌های متداول به‌زودی در این بخش منتشر می‌شود.
            </EmptyState>
          ) : null}

          <div className="form__actions mt-6">
            <ButtonLink to="/project-inquiry" variant="primary">
              <Icon name="clipboardCheck" size={18} />
              پاسخ پرسش خود را نگرفتم؛ استعلام می‌کنم
            </ButtonLink>
            <ButtonLink to="/contact" variant="secondary">
              تماس با ما
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
