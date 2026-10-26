import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAsync } from '../lib/hooks.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { telHref, whatsappHref } from '../lib/format.js';
import { breadcrumbJsonLd, useSeo } from '../lib/seo.js';
import ServiceCard from '../components/catalog/ServiceCard.jsx';
import { Crumbs, SectionHeading } from '../components/ui/Display.jsx';
import { ButtonLink } from '../components/ui/Button.jsx';
import { EmptyState, Loading } from '../components/ui/Feedback.jsx';
import { Icon } from '../components/ui/Icons.jsx';

export default function ServiceDetail() {
  const { slug } = useParams();
  const { seo, phone, whatsapp } = useSettings();

  const { data, loading, error } = useAsync(async () => {
    const [service, all] = await Promise.all([api.get(`/catalog/services/${slug}`), api.get('/catalog/services')]);
    return { service: service.service, all: all.items ?? [] };
  }, [slug]);

  const service = data?.service;
  const base = (seo.site_url || window.location.origin).replace(/\/$/, '');

  useSeo({
    title: service ? `${service.name} | خدمات کناف کرج` : 'خدمات کناف کرج',
    description: service?.description?.split('\n').join(' ').slice(0, 200),
    image: service?.image,
    path: `/services/${slug}`,
    siteUrl: seo.site_url,
    siteName: 'کناف کرج',
    jsonLd: service
      ? breadcrumbJsonLd(base, [
          { name: 'خدمات کناف', path: '/services' },
          { name: service.name, path: `/services/${service.slug}` },
        ])
      : null,
  });

  if (loading) return <div className="container section"><Loading label="در حال دریافت اطلاعات خدمت…" /></div>;

  if (error || !service) {
    return (
      <div className="container section">
        <EmptyState title="خدمت مورد نظر پیدا نشد" icon={<Icon name="alert" size={26} />}
          action={<ButtonLink to="/services" variant="primary">مشاهده همه خدمات</ButtonLink>}>
          این خدمت حذف شده یا منتشر نشده است.
        </EmptyState>
      </div>
    );
  }

  const [tagline, ...rest] = String(service.description ?? '').split('\n');
  const body = rest.join(' ').trim();
  const others = (data?.all ?? []).filter((item) => item.slug !== service.slug).slice(0, 3);

  return (
    <>
      <div className="container" style={{ paddingTop: 'var(--sp-6)' }}>
        <Crumbs items={[{ name: 'خدمات کناف', path: '/services' }, { name: service.name }]} />
      </div>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="service-detail__grid">
            <div>
              <h1>{service.name}</h1>
              {tagline ? <p className="gold">{tagline}</p> : null}
              {body ? <p>{body}</p> : null}

              {service.benefits?.length ? (
                <ul className="advantage-list">
                  {service.benefits.map((benefit) => (
                    <li className="advantage-list__item" key={benefit}>
                      <Icon name="checkCircle" size={20} />
                      <span>{benefit}</span>
                    </li>
                  ))}
                </ul>
              ) : null}

              <div className="notice notice--info" style={{ marginBottom: 'var(--sp-5)' }}>
                <div>
                  هزینه اجرای این خدمت استعلامی است؛ برای دریافت برآورد هزینه، فرم استعلام اجرای پروژه را تکمیل کنید.
                </div>
              </div>

              <div className="form__actions">
                <ButtonLink to={`/project-inquiry?service=${service.slug}`} variant="primary" size="lg">
                  <Icon name="clipboardCheck" size={18} />
                  درخواست مشاوره و استعلام هزینه
                </ButtonLink>
                {phone ? (
                  <a className="btn btn--secondary" href={telHref(phone)}>
                    <Icon name="phone" size={18} />
                    تماس تلفنی
                  </a>
                ) : null}
                {whatsapp ? (
                  <a
                    className="btn btn--secondary"
                    href={whatsappHref(whatsapp, `سلام، درباره خدمت «${service.name}» سؤال داشتم.`)}
                    target="_blank"
                    rel="noreferrer noopener"
                  >
                    <Icon name="whatsapp" size={18} />
                    واتساپ
                  </a>
                ) : null}
              </div>
            </div>

            <div className="service-detail__media">
              <img src={service.image} alt={service.image_alt} />
            </div>
          </div>
        </div>
      </section>

      {others.length ? (
        <section className="section section--inset">
          <div className="container">
            <SectionHeading eyebrow="سایر خدمات" title="خدمات مرتبط" />
            <div className="grid grid--3">
              {others.map((item) => (
                <ServiceCard key={item.id} service={item} />
              ))}
            </div>
            <div className="mt-6">
              <Link className="btn btn--secondary" to="/services">
                <Icon name="list" size={16} />
                مشاهده همه خدمات
              </Link>
            </div>
          </div>
        </section>
      ) : null}
    </>
  );
}
