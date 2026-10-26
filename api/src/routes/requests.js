import { Router } from 'express';
import multer from 'multer';
import { db, logActivity } from '../db.js';
import {
  validate,
  projectRequestSchema,
  wholesaleRequestSchema,
  reviewSchema,
} from '../lib/validate.js';
import { generateTrackingCode, normalizePhone } from '../lib/text.js';
import { formLimiter, writeLimiter } from '../lib/security.js';
import { serializeProjectRequest, serializeWholesaleRequest } from '../lib/serialize.js';
import {
  ATTACHMENT_MIME,
  MAX_ATTACHMENT_BYTES,
  MAX_ATTACHMENTS,
  PRIVATE_UPLOAD_DIR,
  saveBuffer,
} from '../lib/uploads.js';

export const requestsRouter = Router();

const attachmentUpload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_ATTACHMENT_BYTES, files: MAX_ATTACHMENTS },
  fileFilter: (_req, file, cb) => {
    if (!ATTACHMENT_MIME[file.mimetype]) {
      cb(new Error('فرمت فایل مجاز نیست (فقط تصویر JPG/PNG/WEBP یا PDF)'));
      return;
    }
    cb(null, true);
  },
});

/** Multipart checkboxes arrive as strings; normalize before validation. */
function normalizeBooleans(body = {}) {
  const out = { ...body };
  for (const [key, value] of Object.entries(out)) {
    if (value === 'true' || value === 'false') out[key] = value === 'true';
  }
  return out;
}

requestsRouter.post(
  '/project-requests',
  writeLimiter,
  (req, res, next) => {
    attachmentUpload.array('attachments', MAX_ATTACHMENTS)(req, res, (err) => {
      if (err) {
        const message =
          err.code === 'LIMIT_FILE_SIZE'
            ? 'حجم هر فایل باید کمتر از ۵ مگابایت باشد.'
            : err.code === 'LIMIT_FILE_COUNT'
              ? `حداکثر ${MAX_ATTACHMENTS} فایل می‌توانید ارسال کنید.`
              : err.message || 'ارسال فایل ناموفق بود.';
        return res.status(400).json({ error: message });
      }
      return next();
    });
  },
  (req, res) => {
    const parsed = validate(projectRequestSchema, normalizeBooleans(req.body));
    if (!parsed.ok) return res.status(400).json({ error: parsed.message, fields: parsed.fields });
    const data = parsed.data;

    const attachments = [];
    for (const file of req.files ?? []) {
      try {
        const stored = saveBuffer({
          buffer: file.buffer,
          mimetype: file.mimetype,
          dir: PRIVATE_UPLOAD_DIR,
          allowed: ATTACHMENT_MIME,
        });
        attachments.push({ name: file.originalname, stored, size: file.size, type: file.mimetype });
      } catch {
        return res.status(400).json({ error: 'ذخیره فایل پیوست ناموفق بود.' });
      }
    }

    const trackingCode = generateTrackingCode('PR');
    const info = db
      .prepare(
        `INSERT INTO project_requests
           (tracking_code, customer_name, phone, project_type, service_type, estimated_area, location,
            description, attachments, preferred_contact, status)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new')`,
      )
      .run(
        trackingCode,
        data.customer_name,
        data.phone,
        data.project_type,
        data.service_type,
        data.estimated_area,
        data.location,
        data.description,
        JSON.stringify(attachments),
        data.preferred_contact,
      );

    logActivity({
      actor: 'customer',
      action: 'project_request.created',
      entity: 'project_request',
      entityId: trackingCode,
      details: `${data.project_type} — ${data.location}`,
    });

    res.status(201).json({
      request: {
        id: info.lastInsertRowid,
        tracking_code: trackingCode,
        status: 'new',
        attachments: attachments.map((a) => ({ name: a.name, size: a.size })),
      },
      message: 'درخواست شما ثبت شد. کد پیگیری را نگه دارید.',
    });
  },
);

requestsRouter.post('/wholesale-requests', writeLimiter, (req, res) => {
  const parsed = validate(wholesaleRequestSchema, normalizeBooleans(req.body));
  if (!parsed.ok) return res.status(400).json({ error: parsed.message, fields: parsed.fields });
  const data = parsed.data;
  const trackingCode = generateTrackingCode('WH');
  const info = db
    .prepare(
      `INSERT INTO wholesale_requests
         (tracking_code, full_name, phone, company, product_type, estimated_quantity, city, description, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'new')`,
    )
    .run(
      trackingCode,
      data.full_name,
      data.phone,
      data.company,
      data.product_type,
      data.estimated_quantity,
      data.city,
      data.description,
    );
  logActivity({
    actor: 'customer',
    action: 'wholesale_request.created',
    entity: 'wholesale_request',
    entityId: trackingCode,
  });
  res.status(201).json({
    request: { id: info.lastInsertRowid, tracking_code: trackingCode, status: 'new' },
    message: 'درخواست خرید عمده ثبت شد.',
  });
});

/** Reviews are stored unpublished and appear on the site only after admin approval. */
requestsRouter.post('/reviews', formLimiter, (req, res) => {
  const parsed = validate(reviewSchema, normalizeBooleans(req.body));
  if (!parsed.ok) return res.status(400).json({ error: parsed.message, fields: parsed.fields });
  const data = parsed.data;
  db.prepare(
    'INSERT INTO reviews (name, rating, text, product_id, is_published) VALUES (?, ?, ?, ?, 0)',
  ).run(data.name, data.rating, data.text, data.product_id ?? null);
  res.status(201).json({ message: 'نظر شما ثبت شد و پس از بررسی در سایت منتشر می‌شود.' });
});

/** Public status lookup for a project request (code + phone). */
requestsRouter.get('/requests/track', formLimiter, (req, res) => {
  const code = String(req.query.code ?? '').trim().toUpperCase();
  const phone = normalizePhone(req.query.phone ?? '');
  if (!code || !phone) return res.status(400).json({ error: 'کد پیگیری و شماره تماس الزامی است.' });
  const row = db
    .prepare('SELECT * FROM project_requests WHERE UPPER(tracking_code) = ? AND phone = ?')
    .get(code, phone);
  if (!row) return res.status(404).json({ error: 'درخواستی با این کد پیگیری و شماره تماس پیدا نشد.' });
  const serialized = serializeProjectRequest(row);
  delete serialized.admin_note;
  delete serialized.is_test;
  res.json({ request: serialized });
});

/** Public status lookup for a wholesale request (code + phone). */
requestsRouter.get('/wholesale-requests/track', formLimiter, (req, res) => {
  const code = String(req.query.code ?? '').trim().toUpperCase();
  const phone = normalizePhone(req.query.phone ?? '');
  if (!code || !phone) return res.status(400).json({ error: 'کد پیگیری و شماره تماس الزامی است.' });
  const row = db
    .prepare('SELECT * FROM wholesale_requests WHERE UPPER(tracking_code) = ? AND phone = ?')
    .get(code, phone);
  if (!row) return res.status(404).json({ error: 'درخواستی با این کد پیگیری و شماره تماس پیدا نشد.' });
  const serialized = serializeWholesaleRequest(row);
  delete serialized.admin_note;
  delete serialized.is_test;
  res.json({ request: serialized });
});
