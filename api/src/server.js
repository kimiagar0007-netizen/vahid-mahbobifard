import express from 'express';
import cookieParser from 'cookie-parser';
import { db, allSettings } from './db.js';
import { attachUser, purgeExpiredSessions } from './lib/security.js';
import { PUBLIC_UPLOAD_DIR } from './lib/uploads.js';
import { catalogRouter } from './routes/catalog.js';
import { ordersRouter } from './routes/orders.js';
import { requestsRouter } from './routes/requests.js';
import { authRouter } from './routes/auth.js';
import { adminRouter } from './routes/admin.js';

const PORT = Number(process.env.PORT || 8000);
const app = express();

app.set('trust proxy', 1);
app.disable('x-powered-by');
// No CSP/X-Frame-Options here: the Base44 preview embeds the app in an iframe.
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: false, limit: '1mb' }));
app.use(cookieParser());
app.use(attachUser);

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'knauf-karaj-api', time: new Date().toISOString() });
});

// Product/site images uploaded from the admin panel.
app.use('/uploads', express.static(PUBLIC_UPLOAD_DIR, { maxAge: '1h', index: false, dotfiles: 'deny' }));

app.use('/api', catalogRouter);
app.use('/api', ordersRouter);
app.use('/api', requestsRouter);
app.use('/api', authRouter);
app.use('/api', adminRouter);

app.get('/robots.txt', (_req, res) => {
  const settings = allSettings();
  const base = (settings.seo.site_url || '').replace(/\/$/, '');
  res.type('text/plain').send(
    ['User-agent: *', 'Disallow: /admin', 'Disallow: /checkout', 'Disallow: /cart', 'Disallow: /order', base ? `Sitemap: ${base}/sitemap.xml` : '']
      .filter(Boolean)
      .join('\n'),
  );
});

app.get('/sitemap.xml', (req, res) => {
  const settings = allSettings();
  const base = (settings.seo.site_url || `${req.protocol}://${req.get('host')}`).replace(/\/$/, '');
  const today = new Date().toISOString().slice(0, 10);
  const paths = [
    '/', '/shop', '/services', '/portfolio', '/project-inquiry', '/wholesale',
    '/about', '/contact', '/faq', '/terms', '/privacy', '/order',
    ...(db_all('SELECT slug FROM categories WHERE is_published = 1').map((r) => `/category/${r.slug}`)),
    ...(db_all('SELECT slug FROM services WHERE is_published = 1').map((r) => `/services/${r.slug}`)),
    ...(db_all('SELECT slug FROM products WHERE is_published = 1').map((r) => `/product/${r.slug}`)),
  ];
  const body = paths
    .map((path) => `  <url><loc>${escapeXml(base + path)}</loc><lastmod>${today}</lastmod></url>`)
    .join('\n');
  res.type('application/xml').send(`<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>`);
});

app.use((req, res) => {
  if (req.path.startsWith('/api/')) return res.status(404).json({ error: 'مسیر مورد نظر یافت نشد.' });
  return res.status(404).json({ error: 'مسیر مورد نظر یافت نشد.' });
});

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, _next) => {
  console.error('[api] unhandled error:', err?.message || err);
  const status = err?.status || err?.statusCode || 500;
  const message =
    status === 400 && err?.expose
      ? err.message
      : err?.code === 'LIMIT_FILE_SIZE'
        ? 'حجم فایل ارسالی زیاد است.'
        : 'خطای غیرمنتظره در سرور رخ داد؛ لطفاً دوباره تلاش کنید.';
  res.status(status === 500 ? 500 : status).json({ error: message });
});

app.listen(PORT, '0.0.0.0', () => {
  purgeExpiredSessions();
  setInterval(purgeExpiredSessions, 60 * 60 * 1000).unref();
  console.log(`[api] Knauf Karaj API listening on http://0.0.0.0:${PORT}`);
});

function db_all(sql) {
  return db.prepare(sql).all();
}

function escapeXml(value) {
  return String(value).replace(/[<>&'"]/g, (c) => ({ '<': '&lt;', '>': '&gt;', '&': '&amp;', "'": '&apos;', '"': '&quot;' })[c]);
}

export { app };
