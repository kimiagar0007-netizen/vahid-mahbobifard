import { useAsync } from '../../lib/hooks.js';
import { api } from '../../lib/api.js';
import ServiceCard from '../catalog/ServiceCard.jsx';
import { ButtonLink } from '../ui/Button.jsx';
import { SectionHeading } from '../ui/Display.jsx';
import { Loading, Notice } from '../ui/Feedback.jsx';
import { Icon } from '../ui/Icons.jsx';

export default function ServicesGrid() {
  const { data, loading, error } = useAsync(async () => {
    const res = await api.get('/catalog/services');
    return res.items ?? [];
  }, []);

  const services = (data ?? []).slice(0, 8);

  return (
    <section className="section section--inset" id="services">
      <div className="container">
        <SectionHeading
          eyebrow="خدمات"
          title="خدمات تخصصی کناف و سقف کاذب"
          text="اجرای سقف کاذب، دیوار خشک و سقف‌های دکوراتیو به‌همراه مشاوره انتخاب مصالح و تأمین ملزومات پروژه. هزینه اجرا استعلامی است."
          actions={
            <ButtonLink to="/services" variant="secondary" size="sm">
              <Icon name="tools" size={16} />
              همه خدمات
            </ButtonLink>
          }
        />

        {loading ? <Loading label="در حال دریافت خدمات…" /> : null}
        {error ? <Notice variant="error">دریافت خدمات ناموفق بود: {error}</Notice> : null}
        {!loading && !error && services.length ? (
          <div className="grid grid--4">
            {services.map((service) => (
              <ServiceCard key={service.id} service={service} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
