import { useCategories } from '../../lib/hooks.js';
import CategoryCard from '../catalog/CategoryCard.jsx';
import { ButtonLink } from '../ui/Button.jsx';
import { SectionHeading } from '../ui/Display.jsx';
import { Loading, Notice } from '../ui/Feedback.jsx';
import { Icon } from '../ui/Icons.jsx';

export default function CategoryGrid() {
  const { categories, loading, error } = useCategories();

  return (
    <section className="section section--inset" id="categories">
      <div className="container">
        <SectionHeading
          eyebrow="دسته‌بندی‌ها"
          title="محصولات و تجهیزات کناف"
          text="دسته‌بندی‌های اصلی محصولات کناف کرج؛ برای مشاهده محصولات هر دسته، روی آن کلیک کنید."
          actions={
            <ButtonLink to="/shop" variant="secondary" size="sm">
              <Icon name="grid" size={16} />
              مشاهده کل فروشگاه
            </ButtonLink>
          }
        />

        {loading ? <Loading label="در حال دریافت دسته‌بندی‌ها…" /> : null}
        {error ? <Notice variant="error">دریافت دسته‌بندی‌ها ناموفق بود: {error}</Notice> : null}
        {!loading && !error ? (
          <div className="grid grid--4">
            {categories.map((category) => (
              <CategoryCard key={category.id} category={category} />
            ))}
          </div>
        ) : null}
      </div>
    </section>
  );
}
