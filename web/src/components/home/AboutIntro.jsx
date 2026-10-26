import { useSettings } from '../../context/SettingsContext.jsx';
import { ButtonLink } from '../ui/Button.jsx';
import { Icon } from '../ui/Icons.jsx';
import { SectionHeading } from '../ui/Display.jsx';

export default function AboutIntro() {
  const { home } = useSettings();
  const advantages = home.about_advantages ?? [];

  return (
    <section className="section" id="about-intro">
      <div className="container">
        <div className="about-intro__grid">
          <div>
            <SectionHeading eyebrow="معرفی مجموعه" title={home.about_title} text={home.about_text} />
            {advantages.length ? (
              <ul className="advantage-list">
                {advantages.map((item) => (
                  <li className="advantage-list__item" key={item}>
                    <Icon name="checkCircle" size={20} />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            ) : null}
            <ButtonLink to="/about" variant="secondary">
              <Icon name="arrowLeft" size={18} />
              آشنایی بیشتر با کناف کرج
            </ButtonLink>
          </div>

          <div className="about-intro__media">
            <img
              src={home.about_image || '/images/sections/about-ceiling-cove.svg'}
              alt={home.about_image_alt || 'اجرای سقف کاذب کناف'}
              loading="lazy"
            />
            {home.about_image_secondary ? (
              <img
                className="about-intro__secondary"
                src={home.about_image_secondary}
                alt={home.about_image_secondary_alt || 'جزئیات اجرای کناف'}
                loading="lazy"
              />
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
