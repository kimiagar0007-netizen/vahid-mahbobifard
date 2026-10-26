import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { DATA_DIR } from '../db.js';

/** Public product/site images (served openly). */
export const PUBLIC_UPLOAD_DIR = path.join(DATA_DIR, 'uploads', 'public');
/** Project-request attachments (only reachable through an authenticated admin route). */
export const PRIVATE_UPLOAD_DIR = path.join(DATA_DIR, 'uploads', 'private');

for (const dir of [PUBLIC_UPLOAD_DIR, PRIVATE_UPLOAD_DIR]) {
  fs.mkdirSync(dir, { recursive: true });
}

export const IMAGE_MIME = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/svg+xml': '.svg',
};

export const ATTACHMENT_MIME = {
  ...IMAGE_MIME,
  'application/pdf': '.pdf',
};

export const MAX_IMAGE_BYTES = 5 * 1024 * 1024;
export const MAX_ATTACHMENT_BYTES = 5 * 1024 * 1024;
export const MAX_ATTACHMENTS = 3;

/**
 * Writes an uploaded buffer under a random file name (the original name is never used
 * as a path segment) into the given directory.
 */
export function saveBuffer({ buffer, mimetype, dir, allowed }) {
  const ext = allowed[mimetype];
  if (!ext) throw new Error('نوع فایل مجاز نیست');
  const name = `${Date.now().toString(36)}-${crypto.randomBytes(6).toString('hex')}${ext}`;
  fs.writeFileSync(path.join(dir, name), buffer);
  return name;
}

export function isInside(dir, candidate) {
  const resolved = path.resolve(dir, candidate);
  return resolved.startsWith(path.resolve(dir) + path.sep);
}
