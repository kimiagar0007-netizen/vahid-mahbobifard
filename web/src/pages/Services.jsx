import { api } from '../lib/api.js';
import { useAsync } from '../lib/hooks.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { useSeo } from '../lib/seo.js';
import ServiceCard from '../components/catalog/ServiceCard.jsx';
import { Crumbs, SectionHeading } from '../components/ui/Display.jsx';
import { ButtonLink } from '../components/ui/Button.jsx';
import { EmptyState, Loading, Notice } from '../components/ui/Feedback.jsx';
import { Icon } from '../components/ui/Icons.jsx';

export default function Services() {
  const { seo } = useSettings();
  const { data, loading, error } = useAsync(async () => {
    const res = await api.get('/catalog/services');
    return res.items ?? [];
  }, []);

  useSeo({
    title: 'خدمات کناف و اجرای سقف کاذب در کرج | کناف کرج',
    description:
      'اجرای سقف کاذب، دیوار خشک، نور مخفی و بازسازی سقف و دیوار کناف به‌همراه مشاوره انتخاب مصالح و تأمین ملزومات پروژه.',
    keywords: seo.keywords,
    path: '/services',
    siteUrl: seo.site_url,
    siteName: 'کناف کرج',
  });

  const services = data ?? [];

  return (
    <>
      <header className="page-head">
        <div className="container">
          <Crumbs items={[{ name: 'خدمات کناف' }]} />
          <h1 className="page-head__title">خدمات تخصصی کناف و سقف کاذب</h1>
          <p className="page-head__text">
            خدمات اجرایی کناف کرج برای پروژه‌های مسکونی، تجاری و اداری. هزینه اجرا استعلامی است و پس از بررسی نیاز
            پروژه اعلام می‌شود.
          </p>
        </div>
      </header>

      <section className="section">
        <div className="container">
          {loading ? <Loading label="در حال دریافت خدمات…" /> : null}
          {error ? <Notice variant="error">دریافت خدمات ناموفق بود: {error}</Notice> : null}
          {!loading && !error && services.length ? (
            <div className="grid grid--3">
              {services.map((service) => (
                <ServiceCard key={service.id} service={service} />
              ))}
            </div>
          ) : null}
          {!loading && !error && !services.length ? (
            <EmptyState title="هنوز خدمتی منتشر نشده است" icon={<Icon name="tools" size={26} />}>
              خدمات به‌زودی در این بخش نمایش داده می‌شود.
            </EmptyState>
          ) : null}
        </div>
      </section>

      <section className="section section--inset">
        <div className="container">
          <SectionHeading
            eyebrow="استعلام اجرا"
            title="هزینه اجرای پروژه شما چقدر است؟"
            text="فرم استعلام اجرای پروژه را تکمیل کنید. پس از بررسی نوع پروژه، متراژ و مصالح موردنیاز، هزینه و شرایط اجرا اعلام می‌شود."
            center
            actions={
              <ButtonLink to="/project-inquiry" variant="primary" size="lg">
                <Icon name="clipboardCheck" size={18} />
                ثبت درخواست اجرای پروژه
              </ButtonLink>
            }
          />
        </div>
      </section>
    </>
  );
}
