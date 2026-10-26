import path from 'node:path';
import fs from 'node:fs';
import { Router } from 'express';
import multer from 'multer';
import { db, allSettings, saveSettings, logActivity, json } from '../db.js';
import {
  validate,
  productSchema,
  categorySchema,
  serviceSchema,
  portfolioSchema,
  faqSchema,
  pageSchema,
  statusUpdateSchema,
  settingsSchema,
  ORDER_STATUSES,
  PAYMENT_STATUSES,
  REQUEST_STATUSES,
  reviewSchema,
} from '../lib/validate.js';
import { requireAdmin, writeLimiter } from '../lib/security.js';
import { slugify } from '../lib/text.js';
import {
  serializeCategory,
  serializeProduct,
  serializeService,
  serializePortfolioItem,
  serializeOrder,
  serializeProjectRequest,
  serializeWholesaleRequest,
  serializeReview,
  serializePage,
  serializeFaq,
} from '../lib/serialize.js';
import {
  IMAGE_MIME,
  MAX_IMAGE_BYTES,
  PRIVATE_UPLOAD_DIR,
  PUBLIC_UPLOAD_DIR,
  isInside,
  saveBuffer,
} from '../lib/uploads.js';

/** Every route in this file is admin-only; authorization is enforced here, not in the UI. */
export const adminRouter = Router();
adminRouter.use('/admin', requireAdmin);

const toInt = (v) => (v ? 1 : 0);
const nullable = (v) => (v === undefined || v === null || v === '' ? null : v);

const imageUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_IMAGE_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => cb(null, Boolean(IMAGE_MIME[file.mimetype])),
});

function uniqueSlug(table, base, excludeId = null) {
  const clean = slugify(base) || 'item';
  let candidate = clean;
  let i = 1;
  const stmt = db.prepare(
    `SELECT id FROM ${table} WHERE slug = ? ${excludeId ? 'AND id != ?' : ''}`,
  );
  while (excludeId ? stmt.get(candidate, excludeId) : stmt.get(candidate)) {
    i += 1;
    candidate = `${clean}-${i}`;
  }
  return candidate;
}

function imageList(image, alt, fallback = []) {
  if (!image) return fallback;
  return [{ url: image, alt: alt || 'تصویر محصول' }];
}

/* ------------------------------------------------------------------ dashboard */

adminRouter.get('/admin/summary', (_req, res) => {
  const one = (sql, ...params) => db.prepare(sql).get(...params).c;
  const settings = allSettings();

  const counts = {
    orders: one('SELECT COUNT(*) c FROM orders'),
    orders_open: one("SELECT COUNT(*) c FROM orders WHERE order_status IN ('new','confirmed','processing')"),
    orders_paid: one("SELECT COUNT(*) c FROM orders WHERE payment_status = 'paid'"),
    products: one('SELECT COUNT(*) c FROM products'),
    products_published: one('SELECT COUNT(*) c FROM products WHERE is_published = 1'),
    products_without_price: one('SELECT COUNT(*) c FROM products WHERE COALESCE(sale_price, price) IS NULL'),
    products_out_of_stock: one('SELECT COUNT(*) c FROM products WHERE stock_quantity = 0'),
    categories: one('SELECT COUNT(*) c FROM categories'),
    services: one('SELECT COUNT(*) c FROM services'),
    portfolio: one('SELECT COUNT(*) c FROM portfolio_items'),
    project_requests: one('SELECT COUNT(*) c FROM project_requests'),
    project_requests_new: one("SELECT COUNT(*) c FROM project_requests WHERE status = 'new'"),
    wholesale_requests: one('SELECT COUNT(*) c FROM wholesale_requests'),
    wholesale_requests_new: one("SELECT COUNT(*) c FROM wholesale_requests WHERE status = 'new'"),
    reviews_pending: one('SELECT COUNT(*) c FROM reviews WHERE is_published = 0'),
    reviews_published: one('SELECT COUNT(*) c FROM reviews WHERE is_published = 1'),
  };

  const revenue = {
    orders_total: db.prepare('SELECT COALESCE(SUM(total), 0) s FROM orders WHERE is_test = 0').get().s,
    completed_total: db
      .prepare("SELECT COALESCE(SUM(total), 0) s FROM orders WHERE is_test = 0 AND order_status = 'completed'")
      .get().s,
    awaiting_payment: db
      .prepare("SELECT COALESCE(SUM(total), 0) s FROM orders WHERE is_test = 0 AND payment_status != 'paid'")
      .get().s,
  };

  const recentOrders = db
    .prepare('SELECT * FROM orders ORDER BY id DESC LIMIT 6')
    .all()
    .map((row) => serializeOrder(row));
  const recentRequests = db
    .prepare('SELECT * FROM project_requests ORDER BY id DESC LIMIT 6')
    .all()
    .map(serializeProjectRequest);
  const activity = db.prepare('SELECT * FROM activity_log ORDER BY id DESC LIMIT 12').all();

  // Things the owner still has to configure before the site is complete.
  const warnings = [];
  if (!settings.contact.phone) warnings.push({ key: 'phone', label: 'شماره تماس ثبت نشده است', hint: 'تا ثبت شماره، دکمه تماس در سایت غیرفعال است.' });
  if (!settings.contact.whatsapp) warnings.push({ key: 'whatsapp', label: 'شماره واتساپ ثبت نشده است', hint: 'لینک واتساپ تا ثبت شماره نمایش داده نمی‌شود.' });
  if (!settings.contact.address) warnings.push({ key: 'address', label: 'نشانی ثبت نشده است', hint: 'نشانی در فوتر و صفحه تماس نمایش داده نمی‌شود.' });
  if (!settings.payment.online_enabled) warnings.push({ key: 'payment', label: 'درگاه پرداخت آنلاین فعال نیست', hint: 'سفارش‌ها با وضعیت «پرداخت‌نشده» ثبت می‌شوند.' });
  if (counts.products_without_price) warnings.push({ key: 'price', label: `${counts.products_without_price} محصول بدون قیمت است`, hint: 'خرید این محصولات تا ثبت قیمت غیرفعال می‌ماند.' });
  if (!settings.seo.site_url) warnings.push({ key: 'site_url', label: 'نشانی دامنه ثبت نشده است', hint: 'برای ساخت نقشه سایت و لینک‌های کانونیکال، دامنه را در تنظیمات سئو وارد کنید.' });

  res.json({ counts, revenue, recentOrders, recentRequests, activity, warnings });
});

/* ------------------------------------------------------------------ settings */

adminRouter.get('/admin/settings', (_req, res) => res.json({ settings: allSettings() }));

adminRouter.put('/admin/settings', writeLimiter, (req, res) => {
  const parsed = validate(settingsSchema, req.body ?? {});
  if (!parsed.ok) return res.status(400).json({ error: parsed.message, fields: parsed.fields });
  const changed = saveSettings(parsed.data.patch);
  logActivity({
    actor: req.user.username,
    action: 'settings.updated',
    entity: 'settings',
    details: Object.keys(parsed.data.patch).join(', '),
  });
  res.json({ message: 'تنظیمات ذخیره شد.', changed, settings: allSettings() });
});

/* ------------------------------------------------------------------ categories */

adminRouter.get('/admin/categories', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id) AS product_count
         FROM categories c ORDER BY c.sort_order ASC, c.id ASC`,
    )
    .all();
  res.json({ items: rows.map(serializeCategory) });
});

adminRouter.post('/admin/categories', writeLimiter, (req, res) => {
  const parsed = validate(categorySchema, req.body ?? {});
  if (!parsed.ok) return res.status(400).json({ error: parsed.message, fields: parsed.fields });
  const d = parsed.data;
  const slug = uniqueSlug('categories', d.slug || d.name);
  const info = db
    .prepare(
      `INSERT INTO categories (name, slug, description, image, image_alt, is_published, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(d.name, slug, d.description, d.image, d.image_alt || d.name, toInt(d.is_published), d.sort_order);
  logActivity({ actor: req.user.username, action: 'category.created', entity: 'category', entityId: info.lastInsertRowid, details: d.name });
  res.status(201).json({ item: serializeCategory(db.prepare('SELECT * FROM categories WHERE id = ?').get(info.lastInsertRowid)) });
});

adminRouter.put('/admin/categories/:id', writeLimiter, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'دسته‌بندی یافت نشد.' });
  const parsed = validate(categorySchema, req.body ?? {});
  if (!parsed.ok) return res.status(400).json({ error: parsed.message, fields: parsed.fields });
  const d = parsed.data;
  db.prepare(
    `UPDATE categories SET name = ?, slug = ?, description = ?, image = ?, image_alt = ?, is_published = ?, sort_order = ?, updated_at = datetime('now')
      WHERE id = ?`,
  ).run(
    d.name,
    d.slug ? uniqueSlug('categories', d.slug, id) : existing.slug,
    d.description,
    d.image,
    d.image_alt || d.name,
    toInt(d.is_published),
    d.sort_order,
    id,
  );
  logActivity({ actor: req.user.username, action: 'category.updated', entity: 'category', entityId: id, details: d.name });
  res.json({ item: serializeCategory(db.prepare('SELECT * FROM categories WHERE id = ?').get(id)) });
});

adminRouter.delete('/admin/categories/:id', writeLimiter, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM categories WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'دسته‌بندی یافت نشد.' });
  const used = db.prepare('SELECT COUNT(*) c FROM products WHERE category_id = ?').get(id).c;
  if (used > 0) {
    return res.status(409).json({ error: `این دسته‌بندی به ${used} محصول متصل است؛ ابتدا محصولات را جابه‌جا یا حذف کنید.` });
  }
  db.prepare('DELETE FROM categories WHERE id = ?').run(id);
  logActivity({ actor: req.user.username, action: 'category.deleted', entity: 'category', entityId: id, details: existing.name });
  res.json({ message: 'دسته‌بندی حذف شد.' });
});

/* -------------------------------------------------------------------- products */

adminRouter.get('/admin/products', (req, res) => {
  const where = [];
  const params = [];
  const q = String(req.query.q ?? '').trim();
  if (q) {
    where.push('(p.name LIKE ? OR p.slug LIKE ?)');
    params.push(`%${q}%`, `%${q}%`);
  }
  const categoryId = Number(req.query.category_id);
  if (Number.isFinite(categoryId) && categoryId > 0) {
    where.push('p.category_id = ?');
    params.push(categoryId);
  }
  if (req.query.only_unpriced === '1') where.push('COALESCE(p.sale_price, p.price) IS NULL');
  if (req.query.only_published === '1') where.push('p.is_published = 1');
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = db
    .prepare(
      `SELECT p.*, c.name AS category_name, c.slug AS category_slug
         FROM products p LEFT JOIN categories c ON c.id = p.category_id
         ${whereSql} ORDER BY p.id DESC`,
    )
    .all(...params);
  res.json({ items: rows.map(serializeProduct), total: rows.length });
});

adminRouter.post('/admin/products', writeLimiter, (req, res) => {
  const parsed = validate(productSchema, req.body ?? {});
  if (!parsed.ok) return res.status(400).json({ error: parsed.message, fields: parsed.fields });
  const d = parsed.data;
  if (d.sale_price !== null && d.price !== null && d.sale_price >= d.price) {
    return res.status(400).json({ error: 'قیمت فروش ویژه باید کمتر از قیمت اصلی باشد.', fields: { sale_price: 'قیمت فروش ویژه باید کمتر از قیمت اصلی باشد' } });
  }
  const slug = uniqueSlug('products', d.slug || d.name);
  const info = db
    .prepare(
      `INSERT INTO products (name, slug, description, category_id, images, price, sale_price, unit, stock_quantity,
                             is_published, is_featured, seo_title, seo_description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      d.name,
      slug,
      d.description,
      d.category_id ?? null,
      JSON.stringify(imageList(d.image, d.image_alt)),
      d.price,
      d.sale_price,
      d.unit,
      d.stock_quantity,
      toInt(d.is_published),
      toInt(d.is_featured),
      d.seo_title,
      d.seo_description,
    );
  logActivity({ actor: req.user.username, action: 'product.created', entity: 'product', entityId: info.lastInsertRowid, details: d.name });
  res.status(201).json({ item: serializeProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(info.lastInsertRowid)) });
});

adminRouter.get('/admin/products/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM products WHERE id = ?').get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'محصول یافت نشد.' });
  res.json({ item: serializeProduct(row) });
});

adminRouter.put('/admin/products/:id', writeLimiter, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'محصول یافت نشد.' });
  const parsed = validate(productSchema, req.body ?? {});
  if (!parsed.ok) return res.status(400).json({ error: parsed.message, fields: parsed.fields });
  const d = parsed.data;
  if (d.sale_price !== null && d.price !== null && d.sale_price >= d.price) {
    return res.status(400).json({ error: 'قیمت فروش ویژه باید کمتر از قیمت اصلی باشد.', fields: { sale_price: 'قیمت فروش ویژه باید کمتر از قیمت اصلی باشد' } });
  }
  const currentImages = json.parse(existing.images, []);
  const images = d.image === undefined
    ? currentImages
    : imageList(d.image, d.image_alt, currentImages);

  const priceChanged = d.price !== existing.price || d.sale_price !== existing.sale_price;
  db.prepare(
    `UPDATE products SET name = ?, slug = ?, description = ?, category_id = ?, images = ?, price = ?, sale_price = ?,
            unit = ?, stock_quantity = ?, is_published = ?, is_featured = ?, seo_title = ?, seo_description = ?,
            updated_at = datetime('now')
      WHERE id = ?`,
  ).run(
    d.name,
    d.slug ? uniqueSlug('products', d.slug, id) : existing.slug,
    d.description,
    d.category_id ?? null,
    JSON.stringify(images),
    d.price,
    d.sale_price,
    d.unit,
    d.stock_quantity,
    toInt(d.is_published),
    toInt(d.is_featured),
    d.seo_title,
    d.seo_description,
    id,
  );
  logActivity({
    actor: req.user.username,
    action: priceChanged ? 'product.price_updated' : 'product.updated',
    entity: 'product',
    entityId: id,
    details: priceChanged
      ? `${existing.name}: ${existing.price ?? 'بدون قیمت'} → ${d.price ?? 'بدون قیمت'}`
      : d.name,
  });
  res.json({ item: serializeProduct(db.prepare('SELECT * FROM products WHERE id = ?').get(id)) });
});

adminRouter.delete('/admin/products/:id', writeLimiter, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM products WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'محصول یافت نشد.' });
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  logActivity({ actor: req.user.username, action: 'product.deleted', entity: 'product', entityId: id, details: existing.name });
  res.json({ message: 'محصول حذف شد.' });
});

/* -------------------------------------------------------------------- services */

adminRouter.get('/admin/services', (_req, res) => {
  res.json({ items: db.prepare('SELECT * FROM services ORDER BY sort_order ASC, id ASC').all().map(serializeService) });
});

adminRouter.post('/admin/services', writeLimiter, (req, res) => {
  const parsed = validate(serviceSchema, req.body ?? {});
  if (!parsed.ok) return res.status(400).json({ error: parsed.message, fields: parsed.fields });
  const d = parsed.data;
  const info = db
    .prepare(
      `INSERT INTO services (name, slug, description, benefits, image, image_alt, is_published, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      d.name,
      uniqueSlug('services', d.slug || d.name),
      d.description,
      JSON.stringify(d.benefits),
      d.image,
      d.image_alt || d.name,
      toInt(d.is_published),
      d.sort_order,
    );
  logActivity({ actor: req.user.username, action: 'service.created', entity: 'service', entityId: info.lastInsertRowid, details: d.name });
  res.status(201).json({ item: serializeService(db.prepare('SELECT * FROM services WHERE id = ?').get(info.lastInsertRowid)) });
});

adminRouter.put('/admin/services/:id', writeLimiter, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'خدمت یافت نشد.' });
  const parsed = validate(serviceSchema, req.body ?? {});
  if (!parsed.ok) return res.status(400).json({ error: parsed.message, fields: parsed.fields });
  const d = parsed.data;
  db.prepare(
    `UPDATE services SET name = ?, slug = ?, description = ?, benefits = ?, image = ?, image_alt = ?,
            is_published = ?, sort_order = ?, updated_at = datetime('now') WHERE id = ?`,
  ).run(
    d.name,
    d.slug ? uniqueSlug('services', d.slug, id) : existing.slug,
    d.description,
    JSON.stringify(d.benefits),
    d.image,
    d.image_alt || d.name,
    toInt(d.is_published),
    d.sort_order,
    id,
  );
  logActivity({ actor: req.user.username, action: 'service.updated', entity: 'service', entityId: id, details: d.name });
  res.json({ item: serializeService(db.prepare('SELECT * FROM services WHERE id = ?').get(id)) });
});

adminRouter.delete('/admin/services/:id', writeLimiter, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM services WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'خدمت یافت نشد.' });
  db.prepare('DELETE FROM services WHERE id = ?').run(id);
  logActivity({ actor: req.user.username, action: 'service.deleted', entity: 'service', entityId: id, details: existing.name });
  res.json({ message: 'خدمت حذف شد.' });
});

/* ------------------------------------------------------------------- portfolio */

adminRouter.get('/admin/portfolio', (_req, res) => {
  res.json({ items: db.prepare('SELECT * FROM portfolio_items ORDER BY sort_order ASC, id DESC').all().map(serializePortfolioItem) });
});

adminRouter.post('/admin/portfolio', writeLimiter, (req, res) => {
  const parsed = validate(portfolioSchema, req.body ?? {});
  if (!parsed.ok) return res.status(400).json({ error: parsed.message, fields: parsed.fields });
  const d = parsed.data;
  const info = db
    .prepare(
      `INSERT INTO portfolio_items (title, slug, description, category, images, area, specs, is_sample, is_published, sort_order)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    )
    .run(
      d.title,
      uniqueSlug('portfolio_items', d.slug || d.title),
      d.description,
      d.category,
      JSON.stringify(imageList(d.image, d.image_alt)),
      d.area,
      d.specs,
      toInt(d.is_sample),
      toInt(d.is_published),
      d.sort_order,
    );
  logActivity({ actor: req.user.username, action: 'portfolio.created', entity: 'portfolio', entityId: info.lastInsertRowid, details: d.title });
  res.status(201).json({ item: serializePortfolioItem(db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(info.lastInsertRowid)) });
});

adminRouter.put('/admin/portfolio/:id', writeLimiter, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'نمونه‌کار یافت نشد.' });
  const parsed = validate(portfolioSchema, req.body ?? {});
  if (!parsed.ok) return res.status(400).json({ error: parsed.message, fields: parsed.fields });
  const d = parsed.data;
  const currentImages = json.parse(existing.images, []);
  db.prepare(
    `UPDATE portfolio_items SET title = ?, slug = ?, description = ?, category = ?, images = ?, area = ?, specs = ?,
            is_sample = ?, is_published = ?, sort_order = ?, updated_at = datetime('now') WHERE id = ?`,
  ).run(
    d.title,
    d.slug ? uniqueSlug('portfolio_items', d.slug, id) : existing.slug,
    d.description,
    d.category,
    JSON.stringify(d.image === undefined ? currentImages : imageList(d.image, d.image_alt, currentImages)),
    d.area,
    d.specs,
    toInt(d.is_sample),
    toInt(d.is_published),
    d.sort_order,
    id,
  );
  logActivity({ actor: req.user.username, action: 'portfolio.updated', entity: 'portfolio', entityId: id, details: d.title });
  res.json({ item: serializePortfolioItem(db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(id)) });
});

adminRouter.delete('/admin/portfolio/:id', writeLimiter, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM portfolio_items WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'نمونه‌کار یافت نشد.' });
  db.prepare('DELETE FROM portfolio_items WHERE id = ?').run(id);
  logActivity({ actor: req.user.username, action: 'portfolio.deleted', entity: 'portfolio', entityId: id, details: existing.title });
  res.json({ message: 'نمونه‌کار حذف شد.' });
});

/* ---------------------------------------------------------------------- faqs */

adminRouter.get('/admin/faqs', (_req, res) => {
  res.json({ items: db.prepare('SELECT * FROM faqs ORDER BY sort_order ASC, id ASC').all().map(serializeFaq) });
});

adminRouter.post('/admin/faqs', writeLimiter, (req, res) => {
  const parsed = validate(faqSchema, req.body ?? {});
  if (!parsed.ok) return res.status(400).json({ error: parsed.message, fields: parsed.fields });
  const d = parsed.data;
  const info = db
    .prepare('INSERT INTO faqs (question, answer, is_published, sort_order) VALUES (?, ?, ?, ?)')
    .run(d.question, d.answer, toInt(d.is_published), d.sort_order);
  logActivity({ actor: req.user.username, action: 'faq.created', entity: 'faq', entityId: info.lastInsertRowid, details: d.question });
  res.status(201).json({ item: serializeFaq(db.prepare('SELECT * FROM faqs WHERE id = ?').get(info.lastInsertRowid)) });
});

adminRouter.put('/admin/faqs/:id', writeLimiter, (req, res) => {
  const id = Number(req.params.id);
  if (!db.prepare('SELECT id FROM faqs WHERE id = ?').get(id)) return res.status(404).json({ error: 'پرسش یافت نشد.' });
  const parsed = validate(faqSchema, req.body ?? {});
  if (!parsed.ok) return res.status(400).json({ error: parsed.message, fields: parsed.fields });
  const d = parsed.data;
  db.prepare('UPDATE faqs SET question = ?, answer = ?, is_published = ?, sort_order = ? WHERE id = ?').run(
    d.question,
    d.answer,
    toInt(d.is_published),
    d.sort_order,
    id,
  );
  logActivity({ actor: req.user.username, action: 'faq.updated', entity: 'faq', entityId: id });
  res.json({ item: serializeFaq(db.prepare('SELECT * FROM faqs WHERE id = ?').get(id)) });
});

adminRouter.delete('/admin/faqs/:id', writeLimiter, (req, res) => {
  const id = Number(req.params.id);
  if (!db.prepare('SELECT id FROM faqs WHERE id = ?').get(id)) return res.status(404).json({ error: 'پرسش یافت نشد.' });
  db.prepare('DELETE FROM faqs WHERE id = ?').run(id);
  logActivity({ actor: req.user.username, action: 'faq.deleted', entity: 'faq', entityId: id });
  res.json({ message: 'پرسش حذف شد.' });
});

/* --------------------------------------------------------------------- pages */

adminRouter.get('/admin/pages', (_req, res) => {
  res.json({ items: db.prepare('SELECT * FROM pages ORDER BY slug ASC').all().map(serializePage) });
});

adminRouter.put('/admin/pages/:slug', writeLimiter, (req, res) => {
  const slug = String(req.params.slug);
  const existing = db.prepare('SELECT * FROM pages WHERE slug = ?').get(slug);
  if (!existing) return res.status(404).json({ error: 'صفحه یافت نشد.' });
  const parsed = validate(pageSchema, req.body ?? {});
  if (!parsed.ok) return res.status(400).json({ error: parsed.message, fields: parsed.fields });
  const d = parsed.data;
  db.prepare(
    `UPDATE pages SET title = ?, seo_title = ?, seo_description = ?, body = ?, updated_at = datetime('now') WHERE slug = ?`,
  ).run(d.title, d.seo_title, d.seo_description, d.body, slug);
  logActivity({ actor: req.user.username, action: 'page.updated', entity: 'page', entityId: slug, details: d.title });
  res.json({ item: serializePage(db.prepare('SELECT * FROM pages WHERE slug = ?').get(slug)) });
});

/* -------------------------------------------------------------------- orders */

const ORDER_STATUS_LABELS = {
  new: 'جدید',
  confirmed: 'تأیید‌شده',
  processing: 'در حال آماده‌سازی',
  shipped: 'ارسال‌شده',
  completed: 'تکمیل‌شده',
  cancelled: 'لغو‌شده',
};

adminRouter.get('/admin/orders', (req, res) => {
  const where = [];
  const params = [];
  const q = String(req.query.q ?? '').trim();
  if (q) {
    where.push('(order_number LIKE ? OR tracking_code LIKE ? OR customer_name LIKE ? OR phone LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like, like);
  }
  const status = String(req.query.order_status ?? '').trim();
  if (ORDER_STATUSES.includes(status)) {
    where.push('order_status = ?');
    params.push(status);
  }
  const paymentStatus = String(req.query.payment_status ?? '').trim();
  if (PAYMENT_STATUSES.includes(paymentStatus)) {
    where.push('payment_status = ?');
    params.push(paymentStatus);
  }
  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const rows = db.prepare(`SELECT * FROM orders ${whereSql} ORDER BY id DESC LIMIT 300`).all(...params);
  res.json({ items: rows.map((row) => serializeOrder(row)), total: rows.length });
});

adminRouter.get('/admin/orders/:id', (req, res) => {
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(Number(req.params.id));
  if (!row) return res.status(404).json({ error: 'سفارش یافت نشد.' });
  row.history = db
    .prepare('SELECT status, note, created_by, created_at FROM order_status_history WHERE order_id = ? ORDER BY id ASC')
    .all(row.id);
  res.json({ item: serializeOrder(row, { privateView: true }) });
});

adminRouter.patch('/admin/orders/:id', writeLimiter, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'سفارش یافت نشد.' });

  const { status, note, payment_status: paymentStatus, is_test: isTest } = req.body ?? {};
  let nextStatus = existing.order_status;
  if (status !== undefined) {
    if (!ORDER_STATUSES.includes(status)) return res.status(400).json({ error: 'وضعیت سفارش نامعتبر است.' });
    nextStatus = status;
  }
  let nextPayment = existing.payment_status;
  if (paymentStatus !== undefined) {
    if (!PAYMENT_STATUSES.includes(paymentStatus)) return res.status(400).json({ error: 'وضعیت پرداخت نامعتبر است.' });
    nextPayment = paymentStatus;
  }
  const nextIsTest = isTest === undefined ? existing.is_test : toInt(isTest);

  db.prepare(
    `UPDATE orders SET order_status = ?, payment_status = ?, is_test = ?, updated_at = datetime('now') WHERE id = ?`,
  ).run(nextStatus, nextPayment, nextIsTest, id);

  if (status !== undefined && status !== existing.order_status) {
    db.prepare('INSERT INTO order_status_history (order_id, status, note, created_by) VALUES (?, ?, ?, ?)').run(
      id,
      nextStatus,
      nullable(note) || `تغییر وضعیت به ${ORDER_STATUS_LABELS[nextStatus] ?? nextStatus}`,
      req.user.username,
    );
  }
  logActivity({
    actor: req.user.username,
    action: 'order.updated',
    entity: 'order',
    entityId: existing.order_number,
    details: `وضعیت: ${ORDER_STATUS_LABELS[nextStatus] ?? nextStatus} / پرداخت: ${nextPayment}`,
  });
  const row = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  row.history = db
    .prepare('SELECT status, note, created_by, created_at FROM order_status_history WHERE order_id = ? ORDER BY id ASC')
    .all(id);
  res.json({ item: serializeOrder(row, { privateView: true }) });
});

adminRouter.delete('/admin/orders/:id', writeLimiter, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM orders WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'سفارش یافت نشد.' });
  db.prepare('DELETE FROM orders WHERE id = ?').run(id);
  logActivity({ actor: req.user.username, action: 'order.deleted', entity: 'order', entityId: existing.order_number });
  res.json({ message: 'سفارش حذف شد.' });
});

/* ---------------------------------------------------------- customers / reports */

adminRouter.get('/admin/customers', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT o.phone,
              MAX(o.customer_name) AS name,
              COUNT(*) AS orders_count,
              COALESCE(SUM(CASE WHEN o.is_test = 0 THEN o.total ELSE 0 END), 0) AS orders_total,
              MAX(o.created_at) AS last_order_at,
              (SELECT COUNT(*) FROM project_requests r WHERE r.phone = o.phone) AS requests_count
         FROM orders o
        GROUP BY o.phone
        ORDER BY last_order_at DESC
        LIMIT 200`,
    )
    .all();
  res.json({ items: rows });
});

/* -------------------------------------------------------------------- requests */

adminRouter.get('/admin/project-requests', (req, res) => {
  const status = String(req.query.status ?? '').trim();
  const rows = REQUEST_STATUSES.includes(status)
    ? db.prepare('SELECT * FROM project_requests WHERE status = ? ORDER BY id DESC LIMIT 300').all(status)
    : db.prepare('SELECT * FROM project_requests ORDER BY id DESC LIMIT 300').all();
  res.json({ items: rows.map(serializeProjectRequest), total: rows.length });
});

adminRouter.patch('/admin/project-requests/:id', writeLimiter, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM project_requests WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'درخواست یافت نشد.' });
  const parsed = validate(statusUpdateSchema, req.body ?? {});
  if (!parsed.ok) return res.status(400).json({ error: parsed.message, fields: parsed.fields });
  if (!REQUEST_STATUSES.includes(parsed.data.status)) return res.status(400).json({ error: 'وضعیت درخواست نامعتبر است.' });
  db.prepare(
    `UPDATE project_requests SET status = ?, admin_note = ?, is_test = ?, updated_at = datetime('now') WHERE id = ?`,
  ).run(parsed.data.status, nullable(parsed.data.note) ?? existing.admin_note, toInt(req.body?.is_test ?? existing.is_test), id);
  logActivity({ actor: req.user.username, action: 'project_request.updated', entity: 'project_request', entityId: existing.tracking_code, details: parsed.data.status });
  res.json({ item: serializeProjectRequest(db.prepare('SELECT * FROM project_requests WHERE id = ?').get(id)) });
});

adminRouter.delete('/admin/project-requests/:id', writeLimiter, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM project_requests WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'درخواست یافت نشد.' });
  for (const file of json.parse(existing.attachments, [])) {
    if (file.stored && isInside(PRIVATE_UPLOAD_DIR, file.stored)) {
      fs.rmSync(path.join(PRIVATE_UPLOAD_DIR, file.stored), { force: true });
    }
  }
  db.prepare('DELETE FROM project_requests WHERE id = ?').run(id);
  logActivity({ actor: req.user.username, action: 'project_request.deleted', entity: 'project_request', entityId: existing.tracking_code });
  res.json({ message: 'درخواست حذف شد.' });
});

/** Private attachments: reachable only through this authorized route. */
adminRouter.get('/admin/attachments/:stored', (req, res) => {
  const stored = String(req.params.stored);
  if (!isInside(PRIVATE_UPLOAD_DIR, stored)) return res.status(400).json({ error: 'مسیر فایل نامعتبر است.' });
  const full = path.join(PRIVATE_UPLOAD_DIR, stored);
  if (!fs.existsSync(full)) return res.status(404).json({ error: 'فایل یافت نشد.' });
  res.sendFile(full);
});

adminRouter.get('/admin/wholesale-requests', (req, res) => {
  const status = String(req.query.status ?? '').trim();
  const rows = REQUEST_STATUSES.includes(status)
    ? db.prepare('SELECT * FROM wholesale_requests WHERE status = ? ORDER BY id DESC LIMIT 300').all(status)
    : db.prepare('SELECT * FROM wholesale_requests ORDER BY id DESC LIMIT 300').all();
  res.json({ items: rows.map(serializeWholesaleRequest), total: rows.length });
});

adminRouter.patch('/admin/wholesale-requests/:id', writeLimiter, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM wholesale_requests WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'درخواست یافت نشد.' });
  const parsed = validate(statusUpdateSchema, req.body ?? {});
  if (!parsed.ok) return res.status(400).json({ error: parsed.message, fields: parsed.fields });
  if (!REQUEST_STATUSES.includes(parsed.data.status)) return res.status(400).json({ error: 'وضعیت درخواست نامعتبر است.' });
  db.prepare(
    `UPDATE wholesale_requests SET status = ?, admin_note = ?, is_test = ?, updated_at = datetime('now') WHERE id = ?`,
  ).run(parsed.data.status, nullable(parsed.data.note) ?? existing.admin_note, toInt(req.body?.is_test ?? existing.is_test), id);
  logActivity({ actor: req.user.username, action: 'wholesale_request.updated', entity: 'wholesale_request', entityId: existing.tracking_code, details: parsed.data.status });
  res.json({ item: serializeWholesaleRequest(db.prepare('SELECT * FROM wholesale_requests WHERE id = ?').get(id)) });
});

adminRouter.delete('/admin/wholesale-requests/:id', writeLimiter, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM wholesale_requests WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'درخواست یافت نشد.' });
  db.prepare('DELETE FROM wholesale_requests WHERE id = ?').run(id);
  logActivity({ actor: req.user.username, action: 'wholesale_request.deleted', entity: 'wholesale_request', entityId: existing.tracking_code });
  res.json({ message: 'درخواست حذف شد.' });
});

/* -------------------------------------------------------------------- reviews */

adminRouter.get('/admin/reviews', (req, res) => {
  const only = String(req.query.filter ?? '').trim();
  const sql =
    only === 'pending'
      ? 'SELECT * FROM reviews WHERE is_published = 0 ORDER BY id DESC'
      : only === 'published'
        ? 'SELECT * FROM reviews WHERE is_published = 1 ORDER BY id DESC'
        : 'SELECT * FROM reviews ORDER BY id DESC';
  res.json({ items: db.prepare(sql).all().map(serializeReview) });
});

adminRouter.post('/admin/reviews', writeLimiter, (req, res) => {
  const parsed = validate(reviewSchema, req.body ?? {});
  if (!parsed.ok) return res.status(400).json({ error: parsed.message, fields: parsed.fields });
  const d = parsed.data;
  const info = db
    .prepare('INSERT INTO reviews (name, rating, text, product_id, is_published) VALUES (?, ?, ?, ?, ?)')
    .run(d.name, d.rating, d.text, d.product_id ?? null, req.body?.is_published ? 1 : 0);
  logActivity({ actor: req.user.username, action: 'review.created', entity: 'review', entityId: info.lastInsertRowid });
  res.status(201).json({ item: serializeReview(db.prepare('SELECT * FROM reviews WHERE id = ?').get(info.lastInsertRowid)) });
});

adminRouter.patch('/admin/reviews/:id', writeLimiter, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'نظر یافت نشد.' });
  const published = req.body?.is_published === undefined ? existing.is_published : toInt(req.body.is_published);
  db.prepare('UPDATE reviews SET is_published = ? WHERE id = ?').run(published, id);
  logActivity({ actor: req.user.username, action: published ? 'review.published' : 'review.unpublished', entity: 'review', entityId: id });
  res.json({ item: serializeReview(db.prepare('SELECT * FROM reviews WHERE id = ?').get(id)) });
});

adminRouter.delete('/admin/reviews/:id', writeLimiter, (req, res) => {
  const id = Number(req.params.id);
  const existing = db.prepare('SELECT * FROM reviews WHERE id = ?').get(id);
  if (!existing) return res.status(404).json({ error: 'نظر یافت نشد.' });
  db.prepare('DELETE FROM reviews WHERE id = ?').run(id);
  logActivity({ actor: req.user.username, action: 'review.deleted', entity: 'review', entityId: id });
  res.json({ message: 'نظر حذف شد.' });
});

/* ----------------------------------------------------------- image uploads */

adminRouter.post('/admin/uploads', writeLimiter, (req, res, next) => {
  imageUpload.single('image')(req, res, (err) => {
    if (err) {
      const message =
        err.code === 'LIMIT_FILE_SIZE'
          ? 'حجم تصویر باید کمتر از ۵ مگابایت باشد.'
          : 'فقط تصویر JPG، PNG، WEBP یا SVG مجاز است.';
      return res.status(400).json({ error: message });
    }
    return next();
  });
}, (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'فایلی ارسال نشده است.' });
  const stored = saveBuffer({
    buffer: req.file.buffer,
    mimetype: req.file.mimetype,
    dir: PUBLIC_UPLOAD_DIR,
    allowed: IMAGE_MIME,
  });
  logActivity({ actor: req.user.username, action: 'upload.created', entity: 'file', entityId: stored });
  res.status(201).json({ url: `/uploads/${stored}` });
});

adminRouter.get('/admin/activity', (_req, res) => {
  res.json({ items: db.prepare('SELECT * FROM activity_log ORDER BY id DESC LIMIT 200').all() });
});
