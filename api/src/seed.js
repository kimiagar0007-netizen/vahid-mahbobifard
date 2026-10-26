/**
 * Idempotent seed: reference content and the bootstrap admin account.
 * Existing rows are never overwritten, so anything the shop owner edits in the
 * admin panel survives a restart.
 */
import { db, seedDefaultSettings, logActivity } from './db.js';
import { hashPassword } from './lib/security.js';
import { categories, products, services, portfolio, faqs, pages } from './content/catalog.js';

const PLACEHOLDER_PASSWORD = 'change-me-knauf-dev';
const adminUsername = (process.env.ADMIN_USERNAME || 'admin').trim();
const adminPassword = process.env.ADMIN_PASSWORD || PLACEHOLDER_PASSWORD;
const usingPlaceholder = adminPassword === PLACEHOLDER_PASSWORD;

function seedAdmin() {
  const existing = db.prepare('SELECT id, username FROM users WHERE username = ?').get(adminUsername);
  if (existing) return { created: false, username: existing.username };
  db.prepare(
    'INSERT INTO users (username, password_hash, role, must_change_password) VALUES (?, ?, ?, ?)',
  ).run(adminUsername, hashPassword(adminPassword), 'admin', usingPlaceholder ? 1 : 0);
  return { created: true, username: adminUsername };
}

function seedCatalog() {
  const counts = { categories: 0, products: 0, services: 0, portfolio: 0, faqs: 0, pages: 0 };

  const insertCategory = db.prepare(
    `INSERT OR IGNORE INTO categories (name, slug, description, image, image_alt, is_published, sort_order)
     VALUES (?, ?, ?, ?, ?, 1, ?)`,
  );
  categories.forEach((category, index) => {
    const info = insertCategory.run(
      category.name,
      category.slug,
      category.description,
      `/images/categories/${category.slug}.svg`,
      category.name,
      index,
    );
    counts.categories += info.changes;
  });

  const categoryIdBySlug = new Map(
    db.prepare('SELECT id, slug FROM categories').all().map((row) => [row.slug, row.id]),
  );

  const insertProduct = db.prepare(
    `INSERT OR IGNORE INTO products
       (name, slug, description, category_id, images, price, sale_price, unit, stock_quantity, is_published, is_featured, seo_title, seo_description)
     VALUES (?, ?, ?, ?, ?, NULL, NULL, ?, NULL, 1, ?, ?, ?)`,
  );
  products.forEach((product, index) => {
    const images = JSON.stringify([
      { url: `/images/products/${product.slug}.svg`, alt: `${product.name} — تصویر نمایشی` },
    ]);
    const info = insertProduct.run(
      product.name,
      product.slug,
      product.description,
      categoryIdBySlug.get(product.category) ?? null,
      images,
      product.unit ?? null,
      index < 4 ? 1 : 0,
      `${product.name} | کناف کرج`,
      product.description?.slice(0, 160) ?? null,
    );
    counts.products += info.changes;
  });

  const insertService = db.prepare(
    `INSERT OR IGNORE INTO services (name, slug, description, benefits, image, image_alt, is_published, sort_order)
     VALUES (?, ?, ?, ?, ?, ?, 1, ?)`,
  );
  services.forEach((service, index) => {
    const description = `${service.tagline}\n${service.description}`;
    const info = insertService.run(
      service.name,
      service.slug,
      description,
      JSON.stringify(service.benefits ?? []),
      `/images/services/${service.slug}.svg`,
      service.name,
      index,
    );
    counts.services += info.changes;
  });

  const insertPortfolio = db.prepare(
    `INSERT OR IGNORE INTO portfolio_items (title, slug, description, category, images, area, specs, is_sample, is_published, sort_order)
     VALUES (?, ?, ?, ?, ?, NULL, NULL, 1, 1, ?)`,
  );
  portfolio.forEach((item, index) => {
    const images = JSON.stringify([
      { url: `/images/portfolio/${item.slug}.svg`, alt: `${item.title} — تصویر نمایشی` },
    ]);
    const info = insertPortfolio.run(item.title, item.slug, item.description, item.category, images, index);
    counts.portfolio += info.changes;
  });

  const insertFaq = db.prepare(
    `INSERT OR IGNORE INTO faqs (question, answer, is_published, sort_order) VALUES (?, ?, 1, ?)`,
  );
  const hasFaq = db.prepare('SELECT 1 FROM faqs WHERE question = ?');
  faqs.forEach((faq, index) => {
    if (hasFaq.get(faq.question)) return;
    insertFaq.run(faq.question, faq.answer, index);
    counts.faqs += 1;
  });

  const insertPage = db.prepare(
    `INSERT OR IGNORE INTO pages (slug, title, seo_title, seo_description, body, updated_at)
     VALUES (?, ?, ?, ?, ?, datetime('now'))`,
  );
  for (const page of pages) {
    const info = insertPage.run(page.slug, page.title, page.seo_title, page.seo_description, page.body);
    counts.pages += info.changes;
  }

  return counts;
}

seedDefaultSettings();
const admin = seedAdmin();
const counts = seedCatalog();

logActivity({
  actor: 'system',
  action: 'seed',
  entity: 'database',
  details: JSON.stringify(counts),
});

console.log('[seed] settings ready');
console.log(
  `[seed] admin account: ${admin.created ? 'created' : 'already exists'} (username: ${admin.username})`,
);
if (admin.created && usingPlaceholder) {
  console.log('[seed] NOTE: development placeholder password in use — change it in the admin panel.');
}
console.log('[seed] catalog:', JSON.stringify(counts));
