import { Link } from 'react-router-dom';
import { formatNumber, formatToman, statusMeta, stockMeta } from '../../lib/format.js';

export function Badge({ tone = 'neutral', children, className = '' }) {
  return <span className={`badge badge--${tone} ${className}`.trim()}>{children}</span>;
}

export function StatusBadge({ map, value }) {
  const meta = statusMeta(map, value);
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

export function StockBadge({ product }) {
  const meta = stockMeta(product);
  return <Badge tone={meta.tone}>{meta.label}</Badge>;
}

/** Shows the recorded price only; an unset price is shown as such, never invented. */
export function Price({ product, showUnit = true }) {
  if (!product) return null;
  if (!product.has_price) {
    return <span className="price price--unset">قیمت ثبت نشده</span>;
  }
  const hasDiscount = product.sale_price && product.price && product.sale_price < product.price;
  return (
    <span className="price">
      {hasDiscount ? (
        <>
          <span className="price__old">{formatToman(product.price)}</span>
          <span>{formatToman(product.sale_price)}</span>
          <Badge tone="gold">٪{formatNumber(product.discount_percent)} تخفیف</Badge>
        </>
      ) : (
        <span>{formatToman(product.effective_price)}</span>
      )}
      {showUnit && product.unit ? <span className="price__unit">هر {product.unit}</span> : null}
    </span>
  );
}

export function SectionHeading({ eyebrow, title, text, center = false, actions, id }) {
  return (
    <div className={`section-head${center ? ' section-head--center' : ''}`}>
      {eyebrow ? <span className="section-head__eyebrow">{eyebrow}</span> : null}
      {title ? (
        <h2 className="section-head__title" id={id}>
          {title}
        </h2>
      ) : null}
      <span className={`rule-gold${center ? ' rule-gold--center' : ''}`} />
      {text ? <p className="section-head__text">{text}</p> : null}
      {actions}
    </div>
  );
}

export function Crumbs({ items = [] }) {
  return (
    <nav className="crumbs" aria-label="مسیر صفحه">
      <Link to="/">خانه</Link>
      {items.map((item) => (
        <span key={item.name} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span aria-hidden="true">/</span>
          {item.path ? <Link to={item.path}>{item.name}</Link> : <span>{item.name}</span>}
        </span>
      ))}
    </nav>
  );
}

export function Fact({ label, value }) {
  return (
    <li className="fact">
      <span className="fact__label">{label}</span>
      <span className="fact__value">{value}</span>
    </li>
  );
}
