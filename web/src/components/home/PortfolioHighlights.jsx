import { Link } from 'react-router-dom';
import { useAsync } from '../../lib/hooks.js';
import { api } from '../../lib/api.js';
import { Slider, SlideItem } from '../ui/Slider.jsx';
import { Badge, SectionHeading } from '../ui/Display.jsx';
import { ButtonLink } from '../ui/Button.jsx';
import { Loading, Notice } from '../ui/Feedback.jsx';
import { Icon } from '../ui/Icons.jsx';

export default function PortfolioHighlights() {
  const { data, loading, error } = useAsync(async () => {
    const res = await api.get('/catalog/portfolio');
    return res.items ?? [];
  }, []);

  const items = (data ?? []).slice(0, 6);
  const hasSamples = items.some((item) => item.is_sample);

  return (
    <section className="section" id="portfolio">
      <div className="container">
        <SectionHeading
          eyebrow="نمونه‌کارها"
          title="پروژه‌های اجراشده و نمونه‌کارها"
          text="تصاویر و توضیحات پروژه‌های اجرایی. جزئیات فنی، متراژ و مشخصات تنها در صورت ثبت اطلاعات واقعی نمایش داده می‌شود."
          actions={
            <ButtonLink to="/portfolio" variant="secondary" size="sm">
              <Icon name="image" size={16} />
              گالری کامل
            </ButtonLink>
          }
        />

        {loading ? <Loading label="در حال دریافت نمونه‌کارها…" /> : null}
        {error ? <Notice variant="error">دریافت نمونه‌کارها ناموفق بود: {error}</Notice> : null}

        {!loading && !error && items.length ? (
          <>
            <Slider ariaLabel="نمونه‌کارها">
              {items.map((item) => (
                <SlideItem key={item.id}>
                  <article className="card">
                    <div className="card__media">
                      <img src={item.image} alt={item.image_alt} loading="lazy" />
                      {item.is_sample ? <span className="card__tag"><Badge tone="sample">نمونه طراحی</Badge></span> : null}
                    </div>
                    <div className="card__body">
                      {item.category ? <span className="card__meta gold">{item.category}</span> : null}
                      <h3 className="card__title">{item.title}</h3>
                      <p className="card__text">{item.description}</p>
                      <div className="card__footer">
                        <Link className="btn btn--secondary btn--sm" to="/portfolio">
                          <Icon name="image" size={16} />
                          مشاهده گالری
                        </Link>
                      </div>
                    </div>
                  </article>
                </SlideItem>
              ))}
            </Slider>
            {hasSamples ? (
              <p className="form__note mt-5">
                تصاویر با برچسب «نمونه طراحی» تصاویر نمایشی این بخش هستند و تا ثبت نمونه‌کار واقعی، تنها برای نمایش
                ساختار گالری استفاده می‌شوند.
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </section>
  );
}
