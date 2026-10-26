import { Router } from 'express';
import { db, allSettings, logActivity } from '../db.js';
import { validate, orderSchema, cartItemsSchema } from '../lib/validate.js';
import { quoteCart } from '../lib/pricing.js';
import { generateOrderNumber, generateTrackingCode, normalizePhone, formatToman } from '../lib/text.js';
import { formLimiter, writeLimiter } from '../lib/security.js';
import { serializeOrder } from '../lib/serialize.js';

export const ordersRouter = Router();

/** Re-prices a cart server-side; the browser's own totals are never trusted. */
ordersRouter.post('/orders/quote', formLimiter, (req, res) => {
  const parsed = validate(cartItemsSchema, req.body ?? {});
  if (!parsed.ok) return res.status(400).json({ error: parsed.message, fields: parsed.fields });
  res.json(quoteCart(parsed.data.items, allSettings()));
});

ordersRouter.post('/orders', writeLimiter, (req, res) => {
  const settings = allSettings();
  if (!settings.shop.orders_enabled) {
    return res.status(403).json({ error: 'ثبت سفارش آنلاین در حال حاضر غیرفعال است.' });
  }

  const parsed = validate(orderSchema, req.body ?? {});
  if (!parsed.ok) return res.status(400).json({ error: parsed.message, fields: parsed.fields });
  const data = parsed.data;

  const enabledMethods = settings.payment.methods.filter((m) => m.enabled);
  const method = enabledMethods.find((m) => m.id === data.payment_method);
  if (!method) {
    return res.status(400).json({ error: 'روش پرداخت انتخاب‌شده فعال نیست.', fields: { payment_method: 'روش پرداخت را دوباره انتخاب کنید' } });
  }
  if (method.id === 'online' && !settings.payment.online_enabled) {
    return res.status(400).json({ error: 'درگاه پرداخت آنلاین هنوز فعال نشده است.' });
  }

  const quote = quoteCart(data.items, settings);
  if (!quote.payable) {
    return res.status(400).json({
      error: quote.hasUnpriced
        ? 'برخی اقلام سبد خرید قیمت ثبت‌شده ندارند و امکان ثبت سفارش برای آن‌ها وجود ندارد.'
        : 'برخی اقلام سبد خرید قابل سفارش نیستند؛ سبد خرید را بررسی کنید.',
      problems: quote.problems,
    });
  }

  const orderNumber = generateOrderNumber();
  const trackingCode = generateTrackingCode('KK');
  const paymentStatus = method.id === 'online' ? 'awaiting_gateway' : 'unpaid';

  const info = db
    .prepare(
      `INSERT INTO orders
         (order_number, tracking_code, customer_name, phone, email, city, address, postal_code, note,
          items, subtotal, discount, shipping_cost, total, payment_method, payment_status, order_status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')`,
    )
    .run(
      orderNumber,
      trackingCode,
      data.customer_name,
      data.phone,
      data.email,
      data.city,
      data.address,
      data.postal_code || null,
      data.note,
      JSON.stringify(quote.lines),
      quote.subtotal,
      quote.discount,
      quote.shipping_cost,
      quote.total,
      method.id,
      paymentStatus,
    );

  db.prepare(
    'INSERT INTO order_status_history (order_id, status, note, created_by) VALUES (?, ?, ?, ?)',
  ).run(info.lastInsertRowid, 'new', 'سفارش در سایت ثبت شد.', 'customer');

  logActivity({
    actor: 'customer',
    action: 'order.created',
    entity: 'order',
    entityId: orderNumber,
    details: `مبلغ ${formatToman(quote.total)}`,
  });

  // The confirmation screen needs the stored order (timestamp + first history step),
  // not just the values that were submitted.
  const created = db.prepare('SELECT * FROM orders WHERE id = ?').get(info.lastInsertRowid);
  created.history = db
    .prepare('SELECT status, note, created_by, created_at FROM order_status_history WHERE order_id = ? ORDER BY id ASC')
    .all(created.id);

  res.status(201).json({
    order: serializeOrder(created, { privateView: true }),
    message: 'سفارش شما ثبت شد.',
  });
});

/** Order tracking requires the tracking code AND the phone used at checkout. */
ordersRouter.get('/orders/track', formLimiter, (req, res) => {
  const code = String(req.query.code ?? '').trim().toUpperCase();
  const phone = normalizePhone(req.query.phone ?? '');
  if (!code || !phone) {
    return res.status(400).json({ error: 'شماره پیگیری و شماره تماس الزامی است.' });
  }
  const row = db
    .prepare('SELECT * FROM orders WHERE UPPER(tracking_code) = ? AND phone = ?')
    .get(code, phone);
  if (!row) {
    return res.status(404).json({ error: 'سفارشی با این شماره پیگیری و شماره تماس پیدا نشد.' });
  }
  const history = db
    .prepare('SELECT status, note, created_at FROM order_status_history WHERE order_id = ? ORDER BY id ASC')
    .all(row.id);
  res.json({ order: serializeOrder({ ...row, history }, { privateView: true }) });
});
