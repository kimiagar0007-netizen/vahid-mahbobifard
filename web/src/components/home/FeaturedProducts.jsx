import { useAsync } from '../../lib/hooks.js';
import { api } from '../../lib/api.js';
import ProductCard from '../catalog/ProductCard.jsx';
import { Slider, SlideItem } from '../ui/Slider.jsx';
import { ButtonLink } from '../ui/Button.jsx';
import { SectionHeading } from '../ui/Display.jsx';
import { Loading, Notice } from '../ui/Feedback.jsx';
import { Icon } from '../ui/Icons.jsx';

export default function FeaturedProducts() {
  const { data, loading, error } = useAsync(async () => {
    const featured = await api.get('/catalog/products?featured=1&per_page=8');
    if (featured.items?.length) return featured;
    return api.get('/catalog/products?per_page=8&sort=newest');
  }, []);

  const items = data?.items ?? [];
  const anyUnpriced = items.some((product) => !product.has_price);

  return (
    <section className="section" id="featured-products">
      <div className="container">
        <SectionHeading
          eyebrow="فروشگاه"
          title="محصولات پرفروش و منتخب"
          text="محصولات منتخب کناف کرج با قیمت ثبت‌شده در پنل مدیریت و امکان سفارش آنلاین."
          actions={
            <ButtonLink to="/shop" variant="secondary" size="sm">
              <Icon name="list" size={16} />
              همه محصولات
            </ButtonLink>
          }
        />

        {loading ? <Loading label="در حال دریافت محصولات…" /> : null}
        {error ? <Notice variant="error">دریافت محصولات ناموفق بود: {error}</Notice> : null}

        {!loading && !error && items.length ? (
          <Slider ariaLabel="محصولات منتخب">
            {items.map((product) => (
              <SlideItem key={product.id}>
                <ProductCard product={product} />
              </SlideItem>
            ))}
          </Slider>
        ) : null}

        {!loading && !error && !items.length ? (
          <Notice variant="info">هنوز محصولی برای نمایش در این بخش منتشر نشده است.</Notice>
        ) : null}

        {anyUnpriced ? (
          <p className="form__note mt-5">
            قیمت محصولاتی که مدیر آن‌ها را ثبت نکرده است، «قیمت ثبت نشده» نمایش داده می‌شود و امکان افزودن آن‌ها به
            سبد خرید وجود ندارد. برای استعلام قیمت، درخواست خود را ثبت کنید.
          </p>
        ) : null}
      </div>
    </section>
  );
}
