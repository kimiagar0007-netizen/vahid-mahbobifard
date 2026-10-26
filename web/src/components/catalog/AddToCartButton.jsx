import { useState } from 'react';
import { useCart } from '../../context/CartContext.jsx';
import { Button } from '../ui/Button.jsx';
import { Icon } from '../ui/Icons.jsx';

/**
 * Add-to-cart gesture. Disabled whenever the product has no recorded price,
 * because the server refuses to order an unpriced item.
 */
export default function AddToCartButton({ product, quantity = 1, size = 'md', block = false, label = 'افزودن به سبد خرید' }) {
  const { add } = useCart();
  const [added, setAdded] = useState(false);

  if (!product?.has_price) {
    return (
      <Button variant="secondary" size={size} block={block} disabled title="تا زمانی که قیمت این محصول ثبت نشده باشد، امکان خرید وجود ندارد.">
        <Icon name="cart" size={16} />
        قیمت ثبت نشده
      </Button>
    );
  }

  const outOfStock = product.stock_state === 'out_of_stock';
  if (outOfStock) {
    return (
      <Button variant="secondary" size={size} block={block} disabled>
        <Icon name="alert" size={16} />
        ناموجود
      </Button>
    );
  }

  return (
    <Button
      variant="primary"
      size={size}
      block={block}
      onClick={() => {
        add(product, quantity);
        setAdded(true);
        window.setTimeout(() => setAdded(false), 1800);
      }}
    >
      <Icon name={added ? 'check' : 'cart'} size={16} />
      {added ? 'به سبد خرید افزوده شد' : label}
    </Button>
  );
}
