import { Link } from 'react-router-dom';
import { Icon } from '../ui/Icons.jsx';

export default function ServiceCard({ service, showAll = false }) {
  const [tagline, ...rest] = String(service.description ?? '').split('\n');
  const body = rest.join(' ').trim();

  return (
    <article className="card">
      <Link to={`/services/${service.slug}`} className="card__media" aria-label={service.name}>
        <img src={service.image || '/images/placeholder.svg'} alt={service.image_alt || service.name} loading="lazy" />
      </Link>
      <div className="card__body">
        <h3 className="card__title">
          <Link to={`/services/${service.slug}`}>{service.name}</Link>
        </h3>
        {tagline ? <p className="card__text gold">{tagline}</p> : null}
        {body ? <p className="card__text">{body}</p> : null}
        {service.benefits?.length ? (
          <ul className="advantage-list" style={{ margin: 0 }}>
            {service.benefits.slice(0, showAll ? 8 : 2).map((benefit) => (
              <li className="advantage-list__item" key={benefit}>
                <Icon name="check" size={16} />
                <span>{benefit}</span>
              </li>
            ))}
          </ul>
        ) : null}
        <div className="card__footer">
          <Link className="btn btn--secondary btn--sm" to={`/services/${service.slug}`}>
            <Icon name="list" size={16} />
            جزئیات خدمت
          </Link>
          <Link className="btn btn--primary btn--sm" to={`/project-inquiry?service=${service.slug}`}>
            <Icon name="clipboardCheck" size={16} />
            درخواست مشاوره
          </Link>
        </div>
      </div>
    </article>
  );
}
