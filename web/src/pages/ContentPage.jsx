import { api } from '../lib/api.js';
import { useAsync } from '../lib/hooks.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { useSeo } from '../lib/seo.js';
import { Crumbs } from '../components/ui/Display.jsx';
import { ButtonLink } from '../components/ui/Button.jsx';
import { EmptyState, Loading, Notice } from '../components/ui/Feedback.jsx';
import { Icon } from '../components/ui/Icons.jsx';
import { parseContent } from '../lib/content.js';

/** Renders an admin-editable content page (درباره ما، قوانین، حریم خصوصی). */
export default function ContentPage({ slug, eyebrow }) {
  const { seo } = useSettings();
  const { data, loading, error } = useAsync(async () => {
    const res = await api.get(`/pages/${slug}`);
    return res.page;
  }, [slug]);

  useSeo({
    title: data?.seo_title || (data ? `${data.title} | کناف کرج` : 'کناف کرج'),
    description: data?.seo_description || seo.default_description,
    path: `/${slug}`,
    siteUrl: seo.site_url,
    siteName: 'کناف کرج',
  });

  const blocks = parseContent(data?.body ?? '');

  return (
    <>
      <header className="page-head">
        <div className="container">
          <Crumbs items={[{ name: data?.title || eyebrow || 'صفحه' }]} />
          <h1 className="page-head__title">{data?.title || eyebrow}</h1>
        </div>
      </header>

      <section className="section">
        <div className="container container--narrow">
          {loading ? <Loading label="در حال دریافت محتوا…" /> : null}
          {error ? <Notice variant="error">دریافت محتوای صفحه ناموفق بود: {error}</Notice> : null}
          {!loading && !error && !blocks.length ? (
            <EmptyState title="محتوای این صفحه هنوز ثبت نشده است" icon={<Icon name="edit" size={26} />}>
              متن این صفحه از پنل مدیریت قابل ویرایش است.
            </EmptyState>
          ) : null}

          {blocks.length ? (
            <div className="content-blocks">
              {blocks.map((block, index) => {
                if (block.type === 'h2') return <h2 key={index}>{block.text}</h2>;
                if (block.type === 'ul') {
                  return (
                    <ul key={index}>
                      {block.items.map((item) => (
                        <li key={item}>{item}</li>
                      ))}
                    </ul>
                  );
                }
                return <p key={index}>{block.text}</p>;
              })}
            </div>
          ) : null}

          <div className="form__actions mt-6">
            <ButtonLink to="/shop" variant="secondary">
              <Icon name="cart" size={18} />
              مشاهده فروشگاه
            </ButtonLink>
            <ButtonLink to="/project-inquiry" variant="primary">
              <Icon name="clipboardCheck" size={18} />
              استعلام اجرای پروژه
            </ButtonLink>
          </div>
        </div>
      </section>
    </>
  );
}
