import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import Database from 'better-sqlite3';

const here = path.dirname(fileURLToPath(import.meta.url));

export const DATA_DIR = process.env.DATA_DIR || path.join(here, '..', 'data');
export const UPLOAD_DIR = path.join(DATA_DIR, 'uploads');
fs.mkdirSync(UPLOAD_DIR, { recursive: true });

export const db = new Database(path.join(DATA_DIR, 'app.db'));
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');
db.exec(fs.readFileSync(path.join(here, 'schema.sql'), 'utf8'));

/**
 * Central, admin-editable site configuration.
 * Contact details, shipping and payment settings ship EMPTY / DISABLED on purpose:
 * no invented phone number, address, price or gateway credential is ever published.
 */
export const DEFAULT_SETTINGS = {
  brand: {
    name_fa: 'کناف کرج',
    name_en: 'KNAUF KARAJ',
    tagline: 'فروش تخصصی کناف، تجهیزات و اجرای حرفه‌ای پروژه‌ها',
    logo: '/images/brand/logo.svg',
    short_about:
      'کناف کرج در زمینه تأمین محصولات و تجهیزات کناف و ارائه خدمات اجرای سقف کاذب و دیوار خشک فعالیت می‌کند.',
  },
  contact: {
    phone: '',
    whatsapp: '',
    address: '',
    email: '',
    working_hours: '',
  },
  social: {
    instagram: '',
    telegram: '',
    linkedin: '',
  },
  shipping: {
    flat_fee: 0,
    free_threshold: 0,
    note: 'هزینه ارسال پس از بررسی سفارش و هماهنگی با شما اعلام می‌شود.',
  },
  payment: {
    online_enabled: false,
    online_gateway: '',
    methods: [
      { id: 'cod', title: 'پرداخت در محل تحویل', enabled: true },
      { id: 'transfer', title: 'کارت به کارت / انتقال بانکی', enabled: true },
    ],
    note: 'درگاه پرداخت آنلاین هنوز تنظیم نشده است؛ سفارش‌ها به‌صورت «پرداخت‌نشده» ثبت می‌شوند و پس از هماهنگی تسویه می‌گردند.',
  },
  shop: {
    currency: 'تومان',
    orders_enabled: true,
    min_order_note: '',
  },
  home: {
    hero_title: 'کناف کرج؛ کیفیت در اجرا، اطمینان در خرید',
    hero_highlight: 'کیفیت در اجرا',
    hero_subtitle:
      'فروش کناف و تجهیزات تخصصی، اجرای سقف کاذب و دیوارهای خشک با راهکارهای حرفه‌ای برای پروژه‌های مسکونی، تجاری و اداری.',
    hero_image: '/images/sections/hero-ceiling-linear.svg',
    hero_image_alt: 'سقف کاذب مدرن کناف با نورپردازی خطی',
    about_title: 'کناف کرج؛ همراه تخصصی پروژه شما',
    about_text:
      'کناف کرج در زمینه تأمین محصولات و تجهیزات کناف و ارائه خدمات اجرای سقف کاذب و دیوار خشک فعالیت می‌کند. هدف ما، فراهم کردن مسیر ساده‌تر برای تهیه مصالح موردنیاز و ثبت درخواست اجرای پروژه با اطلاعات شفاف و ارتباط مستقیم با مشتریان است.',
    about_advantages: [
      'تأمین محصولات و تجهیزات موردنیاز پروژه',
      'امکان درخواست مشاوره و استعلام هزینه اجرا',
      'ارتباط مستقیم برای هماهنگی سفارش و پروژه',
    ],
    about_image: '/images/sections/about-ceiling-cove.svg',
    about_image_alt: 'اجرای سقف کاذب با نور مخفی',
    about_image_secondary: '/images/sections/about-drywall-detail.svg',
    about_image_secondary_alt: 'جزئیات اجرای دیوار خشک و درزگیری',
    cta_title: 'برای خرید مصالح یا اجرای پروژه آماده‌اید؟',
    cta_text:
      'نیاز پروژه خود را مشخص کنید تا مسیر مناسب برای تهیه محصولات یا بررسی درخواست اجرای شما فراهم شود.',
    cta_image: '/images/sections/cta-professional-installation.svg',
    cta_image_alt: 'نصب صفحات کناف توسط متخصص',
  },
  seo: {
    site_url: '',
    default_title: 'کناف کرج | فروش تخصصی کناف، تجهیزات و اجرای سقف کاذب در کرج',
    default_description:
      'خرید کناف، پروفیل، پانل گچی و تجهیزات سقف کاذب و ثبت درخواست اجرای کناف در کرج؛ تأمین مصالح و اجرای حرفه‌ای سقف کاذب و دیوار خشک.',
    keywords:
      'کناف کرج، فروش کناف در کرج، خرید تجهیزات کناف، قیمت مصالح کناف، اجرای کناف در کرج، اجرای سقف کاذب، اجرای دیوار خشک، فروش پروفیل و پانل کناف، استعلام قیمت اجرای کناف',
    og_image: '/images/sections/hero-ceiling-linear.svg',
  },
};

const upsertSetting = db.prepare(
  `INSERT INTO settings (key, value, updated_at) VALUES (?, ?, datetime('now'))
   ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = datetime('now')`,
);

export function allSettings() {
  const out = structuredClone(DEFAULT_SETTINGS);
  for (const row of db.prepare('SELECT key, value FROM settings').all()) {
    try {
      out[row.key] = JSON.parse(row.value);
    } catch {
      // ignore malformed stored value, keep the default
    }
  }
  return out;
}

/** Shallow-merges each top-level section, ignoring unknown keys. */
export function saveSettings(patch = {}) {
  let changed = 0;
  for (const [key, value] of Object.entries(patch)) {
    if (!(key in DEFAULT_SETTINGS)) continue;
    const current = allSettings()[key];
    const next = value && typeof value === 'object' && !Array.isArray(value) ? { ...current, ...value } : value;
    upsertSetting.run(key, JSON.stringify(next));
    changed += 1;
  }
  return changed;
}

export function seedDefaultSettings() {
  const existing = new Set(db.prepare('SELECT key FROM settings').all().map((r) => r.key));
  for (const [key, value] of Object.entries(DEFAULT_SETTINGS)) {
    if (!existing.has(key)) upsertSetting.run(key, JSON.stringify(value));
  }
}

export function logActivity({ actor = null, action, entity = null, entityId = null, details = null }) {
  db.prepare(
    `INSERT INTO activity_log (actor, action, entity, entity_id, details) VALUES (?, ?, ?, ?, ?)`,
  ).run(actor, action, entity, entityId === null ? null : String(entityId), details);
}

export const json = {
  parse(value, fallback) {
    if (value === null || value === undefined || value === '') return fallback;
    try {
      return JSON.parse(value);
    } catch {
      return fallback;
    }
  },
  stringify(value) {
    return JSON.stringify(value ?? null);
  },
};
