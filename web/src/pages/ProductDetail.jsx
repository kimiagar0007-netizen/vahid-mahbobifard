import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../lib/api.js';
import { useAsync } from '../lib/hooks.js';
import { formatDate, telHref, whatsappHref } from '../lib/format.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { useSeo, breadcrumbJsonLd } from '../lib/seo.js';
import ProductCard from '../components/catalog/ProductCard.jsx';
import AddToCartButton from '../components/catalog/AddToCartButton.jsx';
import QuantityStepper from '../components/catalog/QuantityStepper.jsx';
import { Badge, Crumbs, Fact, Price, SectionHeading, StockBadge } from '../components/ui/Display.jsx';
import { ButtonLink } from '../components/ui/Button.jsx';
import { EmptyState, Loading, Notice } from '../components/ui/Feedback.jsx';
import { Icon } from '../components/ui/Icons.jsx';

export default function ProductDetail() {
  const { slug } = useParams();
  const { seo, phone, whatsapp } = useSettings();
  const [quantity, setQuantity] = useState(1);

  const { data, loading, error } = useAsync(() => api.get(`/catalog/products/${slug}`), [slug]);
  const product = data?.product;
  const related = data?.related ?? [];
  const reviews = data?.reviews ?? [];

  const base = (seo.site_url || '').replace(/\/$/, '');
  const productJsonLd = product
    ? {
        '@context': 'https://schema.org',
        '@type': 'Product',
        name: product.name,
        description: product.description,
        image: product.image,
        category: product.category?.name,
        brand: { '@type': 'Brand', name: 'کناف کرج' },
        ...(product.has_price
          ? {
              offers: {
                '@type': 'Offer',
                price: product.effective_price,
                priceCurrency: 'IRR',
                availability:
                  product.stock_state === 'out_of_stock'
                    ? 'https://schema.org/OutOfStock'
                    : 'https://schema.org/InStock',
              },
            }
          : {}),
      }
    : null;

  useSeo({
    title: product ? product.seo_title || `${product.name} | کناف کرج` : 'محصول | کناف کرج',
    description: product?.seo_description || product?.description || seo.default_description,
    image: product?.image,
    path: `/product/${slug}`,
    siteUrl: seo.site_url,
    siteName: 'کناف کرج',
    jsonLd: product
      ? [productJsonLd, breadcrumbJsonLd(base || window.location.origin, [
          { name: 'فروشگاه', path: '/shop' },
          { name: product.name, path: `/product/${product.slug}` },
        ])]
      : null,
  });

  if (loading) return <div className="container"><Loading label="در حال دریافت اطلاعات محصول…" /></div>;

  if (error || !product) {
    return (
      <div className="container section">
        <EmptyState title="محصول مورد نظر پیدا نشد" icon={<Icon name="alert" size={28} />}
          action={<ButtonLink to="/shop" variant="primary">بازگشت به فروشگاه</ButtonLink>}>
          {error || 'این محصول حذف شده یا منتشر نشده است.'}
        </EmptyState>
      </div>
    );
  }

  const inquiryText = `سلام، درباره محصول «${product.name}» سؤال داشتم.`;

  return (
    <>
      <div className="container" style={{ paddingTop: 'var(--sp-6)' }}>
        <Crumbs
          items={[
            { name: 'فروشگاه', path: '/shop' },
            ...(product.category ? [{ name: product.category.name, path: `/category/${product.category.slug}` }] : []),
            { name: product.name },
          ]}
        />
      </div>

      <section className="section" style={{ paddingTop: 0 }}>
        <div className="container">
          <div className="product-detail">
            <div className="product-detail__media">
              <img src={product.image} alt={product.image_alt} />
            </div>

            <div>
              <div className="row" style={{ gap: '8px', flexWrap: 'wrap' }}>
                {product.category ? (
                  <Link className="badge badge--neutral" to={`/category/${product.category.slug}`}>
                    {product.category.name}
                  </Link>
                ) : null}
                <StockBadge product={product} />
                {product.is_featured ? <Badge tone="gold">محصول منتخب</Badge> : null}
              </div>

              <h1 style={{ marginTop: 'var(--sp-4)' }}>{product.name}</h1>
              {product.description ? <p>{product.description}</p> : null}

              <div className="product-detail__price-box">
                <span className="fact__label">قیمت</span>
                <Price product={product} />
                {!product.has_price ? (
                  <span className="field__hint">
                    قیمت این محصول هنوز در پنل مدیریت ثبت نشده است؛ برای اطلاع از قیمت، درخواست استعلام ثبت کنید.
                  </span>
                ) : null}

                <div className="row" style={{ gap: 'var(--sp-3)', flexWrap: 'wrap', marginTop: 'var(--sp-2)' }}>
                  <QuantityStepper value={quantity} onChange={setQuantity} />
                  <AddToCartButton product={product} quantity={quantity} />
                </div>

                <div className="row" style={{ gap: 'var(--sp-3)', flexWrap: 'wrap', marginTop: 'var(--sp-2)' }}>
                  <ButtonLink to="/project-inquiry" variant="secondary" size="sm">
                    <Icon name="clipboardCheck" size={16} />
                    استعلام قیمت و موجودی
                  </ButtonLink>
                  {whatsapp ? (
                    <a
                      className="btn btn--secondary btn--sm"
                      href={whatsappHref(whatsapp, inquiryText)}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      <Icon name="whatsapp" size={16} />
                      پرسش درباره این محصول در واتساپ
                    </a>
                  ) : null}
                  {phone ? (
                    <a className="btn btn--secondary btn--sm" href={telHref(phone)}>
                      <Icon name="phone" size={16} />
                      تماس برای این محصول
                    </a>
                  ) : null}
                </div>
              </div>

              <ul className="fact-grid">
                <Fact label="واحد فروش" value={product.unit || 'ثبت نشده'} />
                <Fact label="دسته‌بندی" value={product.category?.name || '—'} />
                <Fact
                  label="وضعیت موجودی"
                  value={
                    product.stock_state === 'in_stock'
                      ? 'موجود در انبار'
                      : product.stock_state === 'out_of_stock'
                        ? 'ناموجود'
                        : 'استعلام موجودی'
                  }
                />
                <Fact label="شناسه محصول" value={`KK-${product.id}`} />
              </ul>
            </div>
          </div>
        </div>
      </section>

      {reviews.length ? (
        <section className="section section--inset">
          <div className="container">
            <SectionHeading eyebrow="نظر مشتریان" title="نظرات درباره این محصول" />
            <div className="grid grid--3">
              {reviews.map((review) => (
                <article className="review-card" key={review.id}>
                  <span className="review-card__stars" aria-label={`${review.rating} از ۵`}>
                    {Array.from({ length: 5 }).map((_, index) => (
                      <Icon key={index} name="star" size={16} strokeWidth={1.4} />
                    ))}
                  </span>
                  <p className="review-card__text">{review.text}</p>
                  <span className="review-card__author">
                    {review.name} — {formatDate(review.created_at)}
                  </span>
                </article>
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {related.length ? (
        <section className="section">
          <div className="container">
            <SectionHeading eyebrow="محصولات مشابه" title="سایر محصولات این دسته" />
            <div className="grid grid--4">
              {related.map((item) => (
                <ProductCard key={item.id} product={item} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {!reviews.length ? (
        <div className="container" style={{ paddingBottom: 'var(--sp-8)' }}>
          <Notice variant="info">هنوز نظری برای این محصول ثبت نشده است.</Notice>
        </div>
      ) : null}
    </>
  );
}
