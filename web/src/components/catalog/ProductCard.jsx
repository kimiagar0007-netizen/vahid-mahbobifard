import { Link } from 'react-router-dom';
import { Badge, Price, StockBadge } from '../ui/Display.jsx';
import { Icon } from '../ui/Icons.jsx';
import AddToCartButton from './AddToCartButton.jsx';

export default function ProductCard({ product }) {
  return (
    <article className="card">
      <Link to={`/product/${product.slug}`} className="card__media" aria-label={product.name}>
        <img src={product.image || '/images/placeholder.svg'} alt={product.image_alt || product.name} loading="lazy" />
        {product.is_featured ? <span className="card__tag"><Badge tone="gold">منتخب</Badge></span> : null}
      </Link>
      <div className="card__body">
        {product.category ? (
          <Link to={`/category/${product.category.slug}`} className="card__meta gold">
            {product.category.name}
          </Link>
        ) : null}
        <h3 className="card__title">
          <Link to={`/product/${product.slug}`}>{product.name}</Link>
        </h3>
        {product.description ? <p className="card__text">{product.description}</p> : null}
        <div className="card__meta">
          <StockBadge product={product} />
          {product.unit ? <span>واحد: {product.unit}</span> : null}
        </div>
        <div className="card__footer">
          <Price product={product} />
          <div className="row" style={{ gap: '8px' }}>
            <Link className="btn btn--secondary btn--sm" to={`/product/${product.slug}`}>
              <Icon name="search" size={16} />
              مشاهده
            </Link>
            <AddToCartButton product={product} size="sm" label="افزودن" />
          </div>
        </div>
      </div>
    </article>
  );
}
