import { Link } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useCategories } from '../../lib/hooks.js';
import { telHref, toPersianDigits, whatsappHref } from '../../lib/format.js';
import { Icon } from '../ui/Icons.jsx';

export default function Footer() {
  const { brand, contact, social, whatsapp, phone, address, email, workingHours } = useSettings();
  const { categories } = useCategories();
  const year = new Intl.DateTimeFormat('fa-IR', { year: 'numeric' }).format(new Date());

  return (
    <footer className="footer">
      <div className="container">
        <div className="footer__grid">
          <div>
            <div className="footer__brand">
              <img className="footer__logo" src={brand.logo || '/images/brand/logo.svg'} alt={`لوگوی ${brand.name_fa}`} />
              <div>
                <div style={{ fontWeight: 700 }}>{brand.name_fa || 'کناف کرج'}</div>
                <div className="gold" style={{ fontSize: '0.72rem', letterSpacing: '0.14em' }}>
                  {brand.name_en || 'KNAUF KARAJ'}
                </div>
              </div>
            </div>
            <p className="small">{brand.short_about}</p>
            {social && Object.values(social).some(Boolean) ? (
              <div className="row mt-4">
                {social.instagram ? (
                  <a className="header__icon-btn" href={social.instagram} target="_blank" rel="noreferrer noopener" aria-label="اینستاگرام">
                    <Icon name="instagram" size={18} />
                  </a>
                ) : null}
                {social.telegram ? (
                  <a className="header__icon-btn" href={social.telegram} target="_blank" rel="noreferrer noopener" aria-label="تلگرام">
                    <Icon name="telegram" size={18} />
                  </a>
                ) : null}
                {social.linkedin ? (
                  <a className="header__icon-btn" href={social.linkedin} target="_blank" rel="noreferrer noopener" aria-label="لینکدین">
                    <Icon name="linkedin" size={18} />
                  </a>
                ) : null}
              </div>
            ) : null}
          </div>

          <div>
            <h3 className="footer__title">صفحات اصلی</h3>
            <ul className="footer__list">
              <li><Link to="/">خانه</Link></li>
              <li><Link to="/shop">فروشگاه</Link></li>
              <li><Link to="/services">خدمات کناف</Link></li>
              <li><Link to="/portfolio">پروژه‌ها و نمونه‌کارها</Link></li>
              <li><Link to="/project-inquiry">استعلام اجرای پروژه</Link></li>
              <li><Link to="/wholesale">خرید عمده</Link></li>
            </ul>
          </div>

          <div>
            <h3 className="footer__title">دسته‌بندی محصولات</h3>
            <ul className="footer__list">
              {categories.slice(0, 6).map((category) => (
                <li key={category.id}>
                  <Link to={`/category/${category.slug}`}>{category.name}</Link>
                </li>
              ))}
              {categories.length > 6 ? (
                <li><Link className="gold" to="/shop">همه دسته‌بندی‌ها</Link></li>
              ) : null}
            </ul>
          </div>

          <div>
            <h3 className="footer__title">اطلاعات تماس</h3>
            <ul className="footer__list">
              {phone ? (
                <li>
                  <a href={telHref(phone)} className="row" style={{ gap: '8px' }}>
                    <Icon name="phone" size={16} />
                    {toPersianDigits(phone)}
                  </a>
                </li>
              ) : null}
              {whatsapp ? (
                <li>
                  <a href={whatsappHref(whatsapp)} target="_blank" rel="noreferrer noopener" className="row" style={{ gap: '8px' }}>
                    <Icon name="whatsapp" size={16} />
                    واتساپ
                  </a>
                </li>
              ) : null}
              {address ? (
                <li className="row" style={{ gap: '8px', alignItems: 'flex-start' }}>
                  <Icon name="mapPin" size={16} />
                  <span>{address}</span>
                </li>
              ) : null}
              {email ? (
                <li>
                  <a href={`mailto:${email}`} className="row" style={{ gap: '8px' }}>
                    <Icon name="mail" size={16} />
                    {email}
                  </a>
                </li>
              ) : null}
              {workingHours ? (
                <li className="row" style={{ gap: '8px' }}>
                  <Icon name="clock" size={16} />
                  {workingHours}
                </li>
              ) : null}
              {!phone && !whatsapp && !address && !email ? (
                <li className="muted">اطلاعات تماس این مجموعه هنوز در تنظیمات سایت ثبت نشده است.</li>
              ) : null}
            </ul>
          </div>
        </div>

        <div className="footer__bottom">
          <span>© {year} {brand.name_fa} — تمامی حقوق محفوظ است.</span>
          <span className="row" style={{ gap: '16px', flexWrap: 'wrap' }}>
            <Link to="/terms">قوانین و شرایط خرید</Link>
            <Link to="/privacy">سیاست حفظ حریم خصوصی</Link>
            <Link to="/faq">پرسش‌های متداول</Link>
            <Link to="/admin/login">ورود مدیر</Link>
          </span>
        </div>
      </div>
    </footer>
  );
}
