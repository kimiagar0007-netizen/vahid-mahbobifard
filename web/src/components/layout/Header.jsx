import { useEffect, useState } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { useSettings } from '../../context/SettingsContext.jsx';
import { useCart } from '../../context/CartContext.jsx';
import { useCategories } from '../../lib/hooks.js';
import { formatNumber, telHref, toPersianDigits } from '../../lib/format.js';
import { ButtonLink } from '../ui/Button.jsx';
import { Icon } from '../ui/Icons.jsx';

const NAV = [
  { label: 'خانه', to: '/' },
  { label: 'فروشگاه', to: '/shop' },
  { label: 'محصولات', to: '/shop', categories: true },
  { label: 'خدمات کناف', to: '/services' },
  { label: 'پروژه‌ها', to: '/portfolio' },
  { label: 'درباره ما', to: '/about' },
  { label: 'تماس با ما', to: '/contact' },
];

export default function Header() {
  const { brand, phone } = useSettings();
  const { count } = useCart();
  const { categories } = useCategories();
  const { pathname } = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  const linkClass = ({ isActive }) => `nav__link${isActive ? ' nav__link--active' : ''}`;

  return (
    <header className={`header${scrolled ? ' header--scrolled' : ''}`}>
      <div className="container header__inner">
        <Link to="/" className="header__brand" aria-label={`${brand.name_fa} — صفحه اصلی`}>
          <img className="header__logo" src={brand.logo || '/images/brand/logo.svg'} alt={`لوگوی ${brand.name_fa}`} />
          <span className="header__brand-text">
            <span className="header__brand-name">{brand.name_fa || 'کناف کرج'}</span>
            <span className="header__brand-sub">{brand.name_en || 'KNAUF KARAJ'}</span>
          </span>
        </Link>

        <nav className="nav" aria-label="منوی اصلی">
          {NAV.map((item) => (
            <div className="nav__item" key={item.label}>
              <NavLink to={item.to} className={linkClass} end={item.to === '/'}>
                {item.label}
              </NavLink>
              {item.categories && categories.length > 0 ? (
                <div className="nav__menu">
                  {categories.map((category) => (
                    <Link key={category.id} className="nav__menu-link" to={`/category/${category.slug}`}>
                      {category.name}
                    </Link>
                  ))}
                  <Link className="nav__menu-link nav__menu-link--all" to="/shop">
                    مشاهده همه محصولات
                  </Link>
                </div>
              ) : null}
            </div>
          ))}
        </nav>

        <div className="header__actions">
          {phone ? (
            <a className="header__phone" href={telHref(phone)}>
              <Icon name="phone" size={18} />
              <span>{toPersianDigits(phone)}</span>
            </a>
          ) : null}
          <Link to="/cart" className="header__icon-btn" aria-label={`سبد خرید، ${formatNumber(count)} قلم`}>
            <Icon name="cart" size={20} />
            {count > 0 ? <span className="header__cart-count">{formatNumber(count)}</span> : null}
          </Link>
          <ButtonLink to="/project-inquiry" variant="primary" size="sm">
            استعلام قیمت پروژه
          </ButtonLink>
          <button
            type="button"
            className="burger"
            aria-expanded={menuOpen}
            aria-controls="mobile-nav"
            aria-label={menuOpen ? 'بستن منو' : 'باز کردن منو'}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <Icon name={menuOpen ? 'close' : 'menu'} />
          </button>
        </div>
      </div>

      <div id="mobile-nav" className={`mobile-nav${menuOpen ? ' mobile-nav--open' : ''}`}>
        <div className="container">
          <ul className="mobile-nav__list">
            {NAV.map((item) => (
              <li key={item.label}>
                <NavLink
                  to={item.to}
                  end={item.to === '/'}
                  className={({ isActive }) => `mobile-nav__link${isActive ? ' mobile-nav__link--active' : ''}`}
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
          <div className="mobile-nav__actions">
            {phone ? (
              <a className="btn btn--secondary" href={telHref(phone)}>
                <Icon name="phone" size={18} />
                تماس با {toPersianDigits(phone)}
              </a>
            ) : null}
            <ButtonLink to="/project-inquiry" variant="primary" block>
              استعلام قیمت پروژه
            </ButtonLink>
          </div>
        </div>
      </div>
    </header>
  );
}
