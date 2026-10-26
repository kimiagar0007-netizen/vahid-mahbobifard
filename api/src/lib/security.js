import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import rateLimit from 'express-rate-limit';
import { db } from '../db.js';

const COOKIE_NAME = 'kk_session';
const SESSION_DAYS = 7;

export function hashPassword(plain) {
  return bcrypt.hashSync(plain, 12);
}

export function verifyPassword(plain, hash) {
  try {
    return bcrypt.compareSync(plain, hash);
  } catch {
    return false;
  }
}

export function createSession(userId) {
  const token = crypto.randomBytes(32).toString('hex');
  const expires = new Date(Date.now() + SESSION_DAYS * 86400_000);
  db.prepare('INSERT INTO sessions (id, user_id, expires_at) VALUES (?, ?, ?)').run(
    token,
    userId,
    expires.toISOString().replace('T', ' ').slice(0, 19),
  );
  return token;
}

export function destroySession(token) {
  if (token) db.prepare('DELETE FROM sessions WHERE id = ?').run(token);
}

export function purgeExpiredSessions() {
  db.prepare("DELETE FROM sessions WHERE expires_at < datetime('now')").run();
}

export function setSessionCookie(res, token) {
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: false, // TLS is terminated by the preview proxy; it adds Secure when serving over HTTPS.
    path: '/',
    maxAge: SESSION_DAYS * 86400_000,
  });
}

export function clearSessionCookie(res) {
  res.clearCookie(COOKIE_NAME, { path: '/' });
}

export function readSessionToken(req) {
  return req.cookies?.[COOKIE_NAME] || null;
}

/** Resolves the logged-in user for a request, or null. */
export function currentUser(req) {
  const token = readSessionToken(req);
  if (!token) return null;
  const row = db
    .prepare(
      `SELECT u.id, u.username, u.role, u.must_change_password, s.expires_at
         FROM sessions s JOIN users u ON u.id = s.user_id
        WHERE s.id = ?`,
    )
    .get(token);
  if (!row) return null;
  if (new Date(`${row.expires_at}Z`.replace(' ', 'T')).getTime() < Date.now()) {
    destroySession(token);
    return null;
  }
  return {
    id: row.id,
    username: row.username,
    role: row.role,
    must_change_password: Boolean(row.must_change_password),
    session_token: token,
  };
}

/** Attaches req.user (or null) to every request. */
export function attachUser(req, _res, next) {
  req.user = currentUser(req);
  next();
}

export function requireAuth(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'برای انجام این عملیات باید وارد حساب مدیر شوید.' });
  next();
}

/** Server-side authorization: hiding admin buttons in the UI is not enough. */
export function requireAdmin(req, res, next) {
  if (!req.user) return res.status(401).json({ error: 'برای انجام این عملیات باید وارد حساب مدیر شوید.' });
  if (req.user.role !== 'admin') return res.status(403).json({ error: 'این بخش فقط برای مدیر مجاز است.' });
  next();
}

const jsonLimitHandler = (_req, res) => res.status(429).json({ error: 'تعداد درخواست‌ها زیاد است؛ لطفاً کمی بعد دوباره تلاش کنید.' });

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 12,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: (_req, res) => res.status(429).json({ error: 'تلاش‌های ورود بیش از حد مجاز؛ چند دقیقه بعد دوباره تلاش کنید.' }),
});

export const formLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 40,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: jsonLimitHandler,
});

export const writeLimiter = rateLimit({
  windowMs: 10 * 60 * 1000,
  limit: 120,
  standardHeaders: 'draft-8',
  legacyHeaders: false,
  handler: jsonLimitHandler,
});
