import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext.jsx';
import { formatNumber, formatToman } from '../lib/format.js';
import { useSeo } from '../lib/seo.js';
import QuantityStepper from '../components/catalog/QuantityStepper.jsx';
import { Crumbs } from '../components/ui/Display.jsx';
import { Button, ButtonLink } from '../components/ui/Button.jsx';
import { EmptyState, Loading, Notice } from '../components/ui/Feedback.jsx';
import { Icon } from '../components/ui/Icons.jsx';

export default function Cart() {
  const { items, lines, problems, totals, quoting, quoteError, setQuantity, remove, clear } = useCart();

  useSeo({ title: 'سبد خرید | کناف کرج', description: 'مشاهده و ویرایش سبد خرید محصولات کناف کرج.' });

  if (!items.length) {
    return (
      <div className="container section">
        <Crumbs items={[{ name: 'سبد خرید' }]} />
        <EmptyState
          title="سبد خرید شما خالی است"
          icon={<Icon name="cart" size={28} />}
          action={<ButtonLink to="/shop" variant="primary">مشاهده محصولات فروشگاه</ButtonLink>}
        >
          برای شروع، از فروشگاه محصولات قیمت‌دار را انتخاب کنید یا برای استعلام قیمت، درخواست خود را ثبت کنید.
        </EmptyState>
      </div>
    );
  }

  return (
    <div className="container section">
      <Crumbs items={[{ name: 'سبد خرید' }]} />
      <h1>سبد خرید</h1>

      {quoteError ? <Notice variant="error">محاسبه سبد خرید ناموفق بود: {quoteError}</Notice> : null}
      {problems.length ? (
        <Notice variant="warn" title="برخی اقلام سبد خرید قابل سفارش نیستند:">
          <ul style={{ marginBottom: 0 }}>
            {problems.map((problem, index) => (
              <li key={`${problem.product_id}-${index}`}>
                {problem.name ? `${problem.name}: ` : ''}
                {problem.reason}
              </li>
            ))}
          </ul>
        </Notice>
      ) : null}

      <div className="cart-layout mt-6">
        <div className="stack">
          {quoting && !lines.length ? <Loading label="در حال محاسبه سبد خرید…" /> : null}
          {lines.map((line) => (
            <article className="cart-line" key={line.product_id}>
              <img className="cart-line__media" src={line.image || '/images/placeholder.svg'} alt={line.name} />
              <div>
                <h2 style={{ fontSize: 'var(--fs-md)', marginBottom: '4px' }}>
                  <Link to={`/product/${line.slug}`}>{line.name}</Link>
                </h2>
                <div className="card__meta">
                  <span>{line.category_name}</span>
                  {line.unit ? <span>واحد: {line.unit}</span> : null}
                </div>
                <div className="mt-2">
                  <span className="price">{formatToman(line.unit_price)}</span>
                  {line.line_discount > 0 ? (
                    <span className="price__old" style={{ marginInlineStart: '8px' }}>
                      {formatToman(line.list_price)}
                    </span>
                  ) : null}
                </div>
              </div>
              <div className="cart-line__actions">
                <QuantityStepper
                  value={line.quantity}
                  onChange={(value) => setQuantity(line.product_id, value)}
                  id={`qty-${line.product_id}`}
                />
                <div className="stack stack--sm" style={{ alignItems: 'flex-end' }}>
                  <span className="price">{formatToman(line.line_total)}</span>
                  <Button variant="ghost" size="sm" onClick={() => remove(line.product_id)}>
                    <Icon name="trash" size={16} />
                    حذف
                  </Button>
                </div>
              </div>
            </article>
          ))}

          <div className="row" style={{ gap: 'var(--sp-3)' }}>
            <ButtonLink to="/shop" variant="secondary" size="sm">
              <Icon name="arrowLeft" size={16} />
              ادامه خرید
            </ButtonLink>
            <Button variant="ghost" size="sm" onClick={clear}>
              <Icon name="trash" size={16} />
              خالی کردن سبد
            </Button>
          </div>
        </div>

        <aside className="cart-summary" aria-label="خلاصه سفارش">
          <h2 style={{ fontSize: 'var(--fs-md)', marginBottom: 'var(--sp-2)' }}>خلاصه سفارش</h2>
          <div className="summary-row">
            <span>جمع کالاها</span>
            <span>{formatToman(totals.subtotal)}</span>
          </div>
          <div className="summary-row">
            <span>تخفیف</span>
            <span>{totals.discount > 0 ? formatToman(totals.discount) : '—'}</span>
          </div>
          <div className="summary-row">
            <span>هزینه ارسال</span>
            <span>{totals.shipping > 0 ? formatToman(totals.shipping) : 'پس از هماهنگی'}</span>
          </div>
          <div className="summary-row summary-row--total">
            <span>مبلغ قابل پرداخت</span>
            <span>{formatToman(totals.total)}</span>
          </div>
          <span className="form__note">
            تعداد اقلام: {formatNumber(items.reduce((sum, item) => sum + item.quantity, 0))}
          </span>
          <ButtonLink to="/checkout" variant="primary" block>
            <Icon name="wallet" size={18} />
            ادامه و ثبت سفارش
          </ButtonLink>
          <span className="form__note">
            مبلغ نهایی سفارش در سرور و بر اساس قیمت‌های ثبت‌شده محاسبه می‌شود.
          </span>
        </aside>
      </div>
    </div>
  );
}
