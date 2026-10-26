import { Router } from 'express';
import { db, allSettings, json } from '../db.js';
import {
  serializeCategory,
  serializeProduct,
  serializeService,
  serializePortfolioItem,
  serializeReview,
  serializePage,
  serializeFaq,
} from '../lib/serialize.js';

export const catalogRouter = Router();

const PRODUCT_SELECT = `
  SELECT p.*, c.name AS category_name, c.slug AS category_slug
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id`;

const SORTS = {
  newest: 'p.created_at DESC, p.id DESC',
  oldest: 'p.created_at ASC, p.id ASC',
  name: 'p.name ASC',
  price_asc: 'CASE WHEN COALESCE(p.sale_price, p.price) IS NULL THEN 1 ELSE 0 END, COALESCE(p.sale_price, p.price) ASC',
  price_desc: 'CASE WHEN COALESCE(p.sale_price, p.price) IS NULL THEN 1 ELSE 0 END, COALESCE(p.sale_price, p.price) DESC',
};

catalogRouter.get('/catalog/categories', (_req, res) => {
  const rows = db
    .prepare(
      `SELECT c.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = c.id AND p.is_published = 1) AS product_count
         FROM categories c
        WHERE c.is_published = 1
        ORDER BY c.sort_order ASC, c.name ASC`,
    )
    .all();
  res.json({ items: rows.map(serializeCategory) });
});

catalogRouter.get('/catalog/products', (req, res) => {
  const where = ['p.is_published = 1'];
  const params = [];

  const q = String(req.query.q ?? '').trim();
  if (q) {
    where.push('(p.name LIKE ? OR p.description LIKE ? OR c.name LIKE ?)');
    const like = `%${q}%`;
    params.push(like, like, like);
  }
  const categorySlug = String(req.query.category ?? '').trim();
  if (categorySlug) {
    where.push('c.slug = ?');
    params.push(categorySlug);
  }
  if (req.query.featured === '1') where.push('p.is_featured = 1');

  const minPrice = Number(req.query.min_price);
  if (Number.isFinite(minPrice) && minPrice > 0) {
    where.push('COALESCE(p.sale_price, p.price) >= ?');
    params.push(Math.round(minPrice));
  }
  const maxPrice = Number(req.query.max_price);
  if (Number.isFinite(maxPrice) && maxPrice > 0) {
    where.push('COALESCE(p.sale_price, p.price) IS NOT NULL AND COALESCE(p.sale_price, p.price) <= ?');
    params.push(Math.round(maxPrice));
  }
  const availability = String(req.query.availability ?? '').trim();
  if (availability === 'priced') where.push('COALESCE(p.sale_price, p.price) > 0');
  if (availability === 'in_stock') where.push('p.stock_quantity > 0');

  const whereSql = where.length ? `WHERE ${where.join(' AND ')}` : '';
  const requestedSort = String(req.query.sort ?? 'newest');
  const sortKey = SORTS[requestedSort] ? requestedSort : 'newest';

  const perPage = Math.min(Math.max(Number(req.query.per_page) || 12, 1), 48);
  const page = Math.max(Number(req.query.page) || 1, 1);
  const total = db
    .prepare(`SELECT COUNT(*) AS c FROM products p LEFT JOIN categories c ON c.id = p.category_id ${whereSql}`)
    .get(...params).c;
  const rows = db
    .prepare(`${PRODUCT_SELECT} ${whereSql} ORDER BY ${SORTS[sortKey]} LIMIT ? OFFSET ?`)
    .all(...params, perPage, (page - 1) * perPage);

  res.json({
    items: rows.map(serializeProduct),
    total,
    page,
    per_page: perPage,
    pages: Math.max(Math.ceil(total / perPage), 1),
    sort: sortKey,
  });
});

catalogRouter.get('/catalog/products/:slug', (req, res) => {
  const row = db.prepare(`${PRODUCT_SELECT} WHERE p.slug = ?`).get(req.params.slug);
  if (!row || !row.is_published) return res.status(404).json({ error: 'محصول مورد نظر یافت نشد.' });
  const related = db
    .prepare(
      `${PRODUCT_SELECT}
        WHERE p.is_published = 1 AND p.id != ?
          AND (p.category_id = ? OR ? IS NULL)
        ORDER BY p.is_featured DESC, p.id DESC LIMIT 4`,
    )
    .all(row.id, row.category_id, row.category_id);
  res.json({
    product: serializeProduct(row),
    related: related.filter((r) => r.id !== row.id).slice(0, 4).map(serializeProduct),
    reviews: db
      .prepare('SELECT * FROM reviews WHERE is_published = 1 AND product_id = ? ORDER BY created_at DESC LIMIT 10')
      .all(row.id)
      .map(serializeReview),
  });
});

catalogRouter.get('/catalog/services', (_req, res) => {
  const rows = db
    .prepare('SELECT * FROM services WHERE is_published = 1 ORDER BY sort_order ASC, name ASC')
    .all();
  res.json({ items: rows.map(serializeService) });
});

catalogRouter.get('/catalog/services/:slug', (req, res) => {
  const row = db.prepare('SELECT * FROM services WHERE slug = ?').get(req.params.slug);
  if (!row || !row.is_published) return res.status(404).json({ error: 'خدمت مورد نظر یافت نشد.' });
  res.json({ service: serializeService(row) });
});

catalogRouter.get('/catalog/portfolio', (req, res) => {
  const where = ['is_published = 1'];
  const params = [];
  const category = String(req.query.category ?? '').trim();
  if (category) {
    where.push('category = ?');
    params.push(category);
  }
  const rows = db
    .prepare(`SELECT * FROM portfolio_items WHERE ${where.join(' AND ')} ORDER BY sort_order ASC, id DESC`)
    .all(...params);
  const categories = db
    .prepare("SELECT DISTINCT category FROM portfolio_items WHERE is_published = 1 AND category IS NOT NULL")
    .all()
    .map((r) => r.category);
  res.json({ items: rows.map(serializePortfolioItem), categories });
});

catalogRouter.get('/catalog/reviews', (req, res) => {
  const productId = Number(req.query.product_id);
  const rows = Number.isFinite(productId) && productId > 0
    ? db.prepare('SELECT * FROM reviews WHERE is_published = 1 AND product_id = ? ORDER BY created_at DESC').all(productId)
    : db.prepare('SELECT * FROM reviews WHERE is_published = 1 ORDER BY created_at DESC').all();
  res.json({ items: rows.map(serializeReview), total: rows.length });
});

catalogRouter.get('/catalog/faqs', (_req, res) => {
  const rows = db.prepare('SELECT * FROM faqs WHERE is_published = 1 ORDER BY sort_order ASC, id ASC').all();
  res.json({ items: rows.map(serializeFaq) });
});

catalogRouter.get('/pages/:slug', (req, res) => {
  const row = db.prepare('SELECT * FROM pages WHERE slug = ?').get(req.params.slug);
  if (!row) return res.status(404).json({ error: 'صفحه مورد نظر یافت نشد.' });
  res.json({ page: serializePage(row) });
});

/** Public settings — never exposes gateway credentials or other operator-only values. */
catalogRouter.get('/settings', (_req, res) => {
  const settings = allSettings();
  res.json({
    settings: {
      brand: settings.brand,
      contact: settings.contact,
      social: settings.social,
      shipping: { note: settings.shipping.note, flat_fee: settings.shipping.flat_fee, free_threshold: settings.shipping.free_threshold },
      payment: { online_enabled: settings.payment.online_enabled, methods: settings.payment.methods, note: settings.payment.note },
      shop: settings.shop,
      home: settings.home,
      seo: {
        site_url: settings.seo.site_url,
        default_title: settings.seo.default_title,
        default_description: settings.seo.default_description,
        keywords: settings.seo.keywords,
        og_image: settings.seo.og_image,
      },
    },
  });
});

catalogRouter.get('/meta', (_req, res) => {
  const counts = {
    products: db.prepare('SELECT COUNT(*) c FROM products WHERE is_published = 1').get().c,
    priced_products: db.prepare('SELECT COUNT(*) c FROM products WHERE is_published = 1 AND COALESCE(sale_price, price) > 0').get().c,
    categories: db.prepare('SELECT COUNT(*) c FROM categories WHERE is_published = 1').get().c,
    services: db.prepare('SELECT COUNT(*) c FROM services WHERE is_published = 1').get().c,
    portfolio: db.prepare('SELECT COUNT(*) c FROM portfolio_items WHERE is_published = 1').get().c,
    published_reviews: db.prepare('SELECT COUNT(*) c FROM reviews WHERE is_published = 1').get().c,
  };
  res.json({
    counts,
    // honest capability flags used by the UI (buttons stay disabled until configured)
    capabilities: {
      contact_configured: Boolean(allSettings().contact.phone),
      whatsapp_configured: Boolean(allSettings().contact.whatsapp),
      online_payment_enabled: Boolean(allSettings().payment.online_enabled),
    },
  });
});


