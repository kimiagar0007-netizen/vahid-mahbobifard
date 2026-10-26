import { db, json } from '../db.js';

/**
 * Recomputes a cart on the server. Prices, discounts and shipping are read from the
 * database — never trusted from the browser payload.
 *
 * @param {Array<{product_id: number, quantity: number}>} items
 * @param {object} settings
 * @returns {{lines: Array, problems: Array, subtotal: number, discount: number, shipping_cost: number, total: number, hasUnpriced: boolean, payable: boolean}}
 */
export function quoteCart(items, settings) {
  const lines = [];
  const problems = [];
  let subtotal = 0;
  let discount = 0;
  let hasUnpriced = false;

  const getProduct = db.prepare(
    `SELECT p.*, c.name AS category_name, c.slug AS category_slug
       FROM products p LEFT JOIN categories c ON c.id = p.category_id
      WHERE p.id = ?`,
  );

  for (const item of items) {
    const quantity = Number(item.quantity);
    const product = getProduct.get(Number(item.product_id));
    if (!product || !product.is_published) {
      problems.push({ product_id: item.product_id, reason: 'این محصول در فروشگاه موجود نیست.' });
      continue;
    }
    const price = Number(product.sale_price ?? product.price);
    if (!Number.isFinite(price) || price <= 0) {
      hasUnpriced = true;
      problems.push({ product_id: product.id, name: product.name, reason: 'قیمت این محصول ثبت نشده است.' });
      continue;
    }
    if (product.stock_quantity !== null && product.stock_quantity <= 0) {
      problems.push({ product_id: product.id, name: product.name, reason: 'این محصول در حال حاضر ناموجود است.' });
      continue;
    }
    if (product.stock_quantity !== null && quantity > product.stock_quantity) {
      problems.push({
        product_id: product.id,
        name: product.name,
        reason: `موجودی کافی نیست (حداکثر ${product.stock_quantity}).`,
      });
      continue;
    }
    const listPrice = Number(product.price) || price;
    const lineDiscount = Math.max(0, (listPrice - price) * quantity);
    const lineTotal = price * quantity;
    subtotal += listPrice * quantity;
    discount += lineDiscount;
    lines.push({
      product_id: product.id,
      name: product.name,
      slug: product.slug,
      unit: product.unit,
      unit_price: price,
      list_price: listPrice,
      quantity,
      line_total: lineTotal,
      line_discount: lineDiscount,
      category_name: product.category_name,
      image: json.parse(product.images, [])[0]?.url || null,
    });
  }

  const netSubtotal = subtotal - discount;
  const shipping = resolveShipping(settings, lines.length ? netSubtotal : 0);
  return {
    lines,
    problems,
    subtotal,
    discount,
    shipping_cost: shipping,
    total: netSubtotal + shipping,
    hasUnpriced,
    payable: lines.length > 0 && problems.length === 0,
  };
}

export function resolveShipping(settings, netSubtotal) {
  const flat = Number(settings?.shipping?.flat_fee ?? 0) || 0;
  const threshold = Number(settings?.shipping?.free_threshold ?? 0) || 0;
  if (threshold > 0 && netSubtotal >= threshold) return 0;
  return flat;
}
