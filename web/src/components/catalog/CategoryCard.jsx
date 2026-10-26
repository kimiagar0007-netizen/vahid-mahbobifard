import { Link } from 'react-router-dom';
import { formatNumber } from '../../lib/format.js';
import { Icon } from '../ui/Icons.jsx';

export default function CategoryCard({ category }) {
  return (
    <article className="card">
      <Link to={`/category/${category.slug}`} className="card__media" aria-label={category.name}>
        <img src={category.image || '/images/placeholder.svg'} alt={category.image_alt || category.name} loading="lazy" />
      </Link>
      <div className="card__body">
        <h3 className="card__title">
          <Link to={`/category/${category.slug}`}>{category.name}</Link>
        </h3>
        {category.description ? <p className="card__text">{category.description}</p> : null}
        <div className="card__footer">
          <span className="card__meta">
            {typeof category.product_count === 'number'
              ? `${formatNumber(category.product_count)} محصول`
              : 'مشاهده محصولات'}
          </span>
          <Link className="btn btn--secondary btn--sm" to={`/category/${category.slug}`}>
            <Icon name="arrowLeft" size={16} />
            مشاهده محصولات
          </Link>
        </div>
      </div>
    </article>
  );
}
