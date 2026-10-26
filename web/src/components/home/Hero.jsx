import { useSettings } from '../../context/SettingsContext.jsx';
import { ButtonLink } from '../ui/Button.jsx';
import { Icon } from '../ui/Icons.jsx';

function withHighlight(title = '', phrase = '') {
  if (!phrase || !title.includes(phrase)) return title;
  const index = title.indexOf(phrase);
  return (
    <>
      {title.slice(0, index)}
      <em>{phrase}</em>
      {title.slice(index + phrase.length)}
    </>
  );
}

const FACTS = [
  { icon: 'box', text: 'تأمین پانل، پروفیل و تجهیزات کناف' },
  { icon: 'tools', text: 'اجرای سقف کاذب و دیوار خشک' },
  { icon: 'clipboardCheck', text: 'استعلام آنلاین اجرای پروژه' },
];

export default function Hero() {
  const { home, brand } = useSettings();

  return (
    <section className="hero">
      <div className="hero__media">
        <img src={home.hero_image || '/images/sections/hero-ceiling-linear.svg'} alt={home.hero_image_alt || 'سقف کاذب کناف'} />
      </div>
      <div className="hero__scrim" aria-hidden="true" />
      <div className="hero__inner">
        <div className="container">
          <div className="hero__content reveal">
            <span className="hero__eyebrow">
              <Icon name="sparkle" size={16} />
              {brand.tagline}
            </span>
            <h1 className="hero__title">{withHighlight(home.hero_title, home.hero_highlight)}</h1>
            <p className="hero__subtitle">{home.hero_subtitle}</p>
            <div className="hero__actions">
              <ButtonLink to="/shop" variant="primary" size="lg">
                <Icon name="cart" size={18} />
                مشاهده محصولات
              </ButtonLink>
              <ButtonLink to="/project-inquiry" variant="secondary" size="lg">
                <Icon name="clipboardCheck" size={18} />
                ثبت درخواست اجرای پروژه
              </ButtonLink>
            </div>
            <div className="hero__facts">
              {FACTS.map((fact) => (
                <span className="hero__fact" key={fact.text}>
                  <Icon name={fact.icon} size={20} />
                  {fact.text}
                </span>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
