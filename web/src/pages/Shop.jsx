import { useEffect, useMemo, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { api, qs } from '../lib/api.js';
import { useAsync, useCategories } from '../lib/hooks.js';
import { fromPersianDigits, formatNumber } from '../lib/format.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { useSeo } from '../lib/seo.js';
import ProductCard from '../components/catalog/ProductCard.jsx';
import { Crumbs, SectionHeading } from '../components/ui/Display.jsx';
import { Button } from '../components/ui/Button.jsx';
import { Field, Input, Select } from '../components/ui/Form.jsx';
import { EmptyState, Loading, Notice } from '../components/ui/Feedback.jsx';
import { Icon } from '../components/ui/Icons.jsx';

const SORTS = [
  { value: 'newest', label: 'جدیدترین' },
  { value: 'price_asc', label: 'ارزان‌ترین' },
  { value: 'price_desc', label: 'گران‌ترین' },
  { value: 'name', label: 'بر اساس نام' },
];

const PER_PAGE = 12;

export default function Shop() {
  const { slug } = useParams();
  const [params, setParams] = useSearchParams();
  const { categories } = useCategories();
  const { seo } = useSettings();

  const category = slug || params.get('category') || '';
  const page = Math.max(Number(params.get('page')) || 1, 1);
  const sort = params.get('sort') || 'newest';
  const availability = params.get('availability') || '';
  const q = params.get('q') || '';
  const minPrice = params.get('min_price') || '';
  const maxPrice = params.get('max_price') || '';

  const [searchText, setSearchText] = useState(q);
  useEffect(() => setSearchText(q), [q]);

  const activeCategory = useMemo(() => categories.find((item) => item.slug === category), [categories, category]);

  const { data, loading, error } = useAsync(
    () =>
      api.get(
        `/catalog/products${qs({
          q,
          category,
          sort,
          availability,
          min_price: minPrice,
          max_price: maxPrice,
          page,
          per_page: PER_PAGE,
        })}`,
      ),
    [q, category, sort, availability, minPrice, maxPrice, page],
  );

  const update = (patch, { resetPage = true } = {}) => {
    const next = new URLSearchParams(params);
    for (const [key, value] of Object.entries(patch)) {
      if (value === '' || value === null || value === undefined) next.delete(key);
      else next.set(key, String(value));
    }
    if (resetPage) next.delete('page');
    setParams(next, { replace: true });
  };

  const items = data?.items ?? [];
  const total = data?.total ?? 0;
  const pages = data?.pages ?? 1;

  const title = activeCategory
    ? `${activeCategory.name} | خرید و قیمت کناف کرج`
    : 'فروشگاه کناف کرج | خرید پانل، پروفیل و تجهیزات سقف کاذب';

  useSeo({
    title,
    description: activeCategory?.description || seo.default_description,
    keywords: seo.keywords,
    path: activeCategory ? `/category/${activeCategory.slug}` : '/shop',
    siteUrl: seo.site_url,
    siteName: 'کناف کرج',
  });

  return (
    <>
      <header className="page-head">
        <div className="container">
          <Crumbs items={activeCategory ? [{ name: 'فروشگاه', path: '/shop' }, { name: activeCategory.name }] : [{ name: 'فروشگاه' }]} />
          <h1 className="page-head__title">{activeCategory ? activeCategory.name : 'فروشگاه کناف کرج'}</h1>
          <p className="page-head__text">
            {activeCategory?.description ||
              'مشاهده محصولات کناف، تجهیزات و ملزومات اجرا. قیمت محصولات تنها در صورت ثبت در پنل مدیریت نمایش داده می‌شود.'}
          </p>
        </div>
      </header>

      <section className="section">
        <div className="container">
          <div className="shop-layout">
            <aside className="shop-filters" aria-label="فیلتر محصولات">
              <div className="filter-group">
                <span className="filter-group__title">جست‌وجو</span>
                <form
                  onSubmit={(event) => {
                    event.preventDefault();
                    update({ q: searchText.trim() });
                  }}
                >
                  <Field label="نام محصول" htmlFor="shop-search" hint="برای جست‌وجو Enter بزنید">
                    <div className="shop-toolbar__search">
                      <Input
                        id="shop-search"
                        value={searchText}
                        onChange={(event) => setSearchText(event.target.value)}
                        placeholder="مثال: پروفیل CD"
                      />
                      <Icon name="search" size={18} />
                    </div>
                  </Field>
                </form>
              </div>

              <div className="filter-group">
                <span className="filter-group__title">دسته‌بندی</span>
                <div className="filter-list">
                  <Link className={`filter-list__item${!category ? ' filter-list__item--active' : ''}`} to="/shop">
                    همه دسته‌بندی‌ها
                  </Link>
                  {categories.map((item) => (
                    <Link
                      key={item.id}
                      className={`filter-list__item${category === item.slug ? ' filter-list__item--active' : ''}`}
                      to={`/category/${item.slug}`}
                    >
                      {item.name}
                    </Link>
                  ))}
                </div>
              </div>

              <div className="filter-group">
                <span className="filter-group__title">محدوده قیمت (تومان)</span>
                <div className="row" style={{ gap: '8px', flexWrap: 'nowrap' }}>
                  <Input
                    aria-label="حداقل قیمت"
                    inputMode="numeric"
                    value={minPrice}
                    placeholder="از"
                    onChange={(event) => update({ min_price: fromPersianDigits(event.target.value).replace(/\D/g, '') })}
                  />
                  <Input
                    aria-label="حداکثر قیمت"
                    inputMode="numeric"
                    value={maxPrice}
                    placeholder="تا"
                    onChange={(event) => update({ max_price: fromPersianDigits(event.target.value).replace(/\D/g, '') })}
                  />
                </div>
                <span className="field__hint">فقط محصولات دارای قیمت ثبت‌شده در این محدوده نمایش داده می‌شوند.</span>
              </div>

              <div className="filter-group">
                <span className="filter-group__title">وضعیت</span>
                <Select value={availability} onChange={(event) => update({ availability: event.target.value })} aria-label="وضعیت محصول">
                  <option value="">همه محصولات</option>
                  <option value="priced">دارای قیمت ثبت‌شده</option>
                  <option value="in_stock">موجود در انبار</option>
                </Select>
              </div>

              <Button
                variant="ghost"
                onClick={() => setParams(new URLSearchParams(), { replace: true })}
                disabled={!params.toString() && !slug}
              >
                <Icon name="close" size={16} />
                حذف فیلترها
              </Button>
            </aside>

            <div>
              <div className="shop-toolbar">
                <span className="results-count">
                  {loading ? 'در حال دریافت…' : `${formatNumber(total)} محصول`}
                </span>
                <Field label="ترتیب نمایش" htmlFor="shop-sort">
                  <Select id="shop-sort" value={sort} onChange={(event) => update({ sort: event.target.value })}>
                    {SORTS.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </Select>
                </Field>
              </div>

              {loading ? <Loading label="در حال دریافت محصولات…" /> : null}
              {error ? <Notice variant="error">دریافت محصولات ناموفق بود: {error}</Notice> : null}

              {!loading && !error && items.length ? (
                <div className="grid grid--3">
                  {items.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              ) : null}

              {!loading && !error && !items.length ? (
                <EmptyState
                  title="محصولی با این مشخصات پیدا نشد"
                  icon={<Icon name="search" size={28} />}
                  action={
                    <Button variant="secondary" onClick={() => setParams(new URLSearchParams(), { replace: true })}>
                      حذف فیلترها
                    </Button>
                  }
                >
                  می‌توانید فیلترها را تغییر دهید یا درخواست استعلام ثبت کنید تا ما محصولات موردنیاز را بررسی کنیم.
                </EmptyState>
              ) : null}

              {pages > 1 ? (
                <nav className="pagination" aria-label="صفحه‌بندی">
                  <button
                    type="button"
                    className="pagination__btn"
                    onClick={() => update({ page: page - 1 }, { resetPage: false })}
                    disabled={page <= 1}
                  >
                    قبلی
                  </button>
                  {Array.from({ length: pages }).map((_, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`pagination__btn${page === index + 1 ? ' pagination__btn--active' : ''}`}
                      onClick={() => update({ page: index + 1 }, { resetPage: false })}
                      aria-current={page === index + 1 ? 'page' : undefined}
                    >
                      {formatNumber(index + 1)}
                    </button>
                  ))}
                  <button
                    type="button"
                    className="pagination__btn"
                    onClick={() => update({ page: page + 1 }, { resetPage: false })}
                    disabled={page >= pages}
                  >
                    بعدی
                  </button>
                </nav>
              ) : null}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
