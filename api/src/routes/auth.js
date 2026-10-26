import { Router } from 'express';
import { db, logActivity } from '../db.js';
import {
  createSession,
  destroySession,
  hashPassword,
  loginLimiter,
  readSessionToken,
  requireAuth,
  setSessionCookie,
  clearSessionCookie,
  verifyPassword,
} from '../lib/security.js';
import { validate, loginSchema, changePasswordSchema } from '../lib/validate.js';

export const authRouter = Router();

authRouter.post('/auth/login', loginLimiter, (req, res) => {
  const parsed = validate(loginSchema, req.body ?? {});
  if (!parsed.ok) return res.status(400).json({ error: parsed.message, fields: parsed.fields });

  const user = db.prepare('SELECT * FROM users WHERE username = ?').get(parsed.data.username.trim());
  if (!user || !verifyPassword(parsed.data.password, user.password_hash)) {
    logActivity({ actor: parsed.data.username.slice(0, 40), action: 'auth.login_failed' });
    return res.status(401).json({ error: 'نام کاربری یا رمز عبور نادرست است.' });
  }

  const token = createSession(user.id);
  setSessionCookie(res, token);
  logActivity({ actor: user.username, action: 'auth.login', entity: 'user', entityId: user.id });
  res.json({
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
      must_change_password: Boolean(user.must_change_password),
    },
  });
});

authRouter.post('/auth/logout', (req, res) => {
  destroySession(readSessionToken(req));
  clearSessionCookie(res);
  res.json({ message: 'از حساب خارج شدید.' });
});

authRouter.get('/auth/me', (req, res) => {
  if (!req.user) return res.status(401).json({ error: 'وارد حساب نشده‌اید.' });
  res.json({
    user: {
      id: req.user.id,
      username: req.user.username,
      role: req.user.role,
      must_change_password: req.user.must_change_password,
    },
  });
});

authRouter.post('/auth/password', requireAuth, (req, res) => {
  const parsed = validate(changePasswordSchema, req.body ?? {});
  if (!parsed.ok) return res.status(400).json({ error: parsed.message, fields: parsed.fields });
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.user.id);
  if (!user || !verifyPassword(parsed.data.current_password, user.password_hash)) {
    return res.status(400).json({ error: 'رمز عبور فعلی نادرست است.', fields: { current_password: 'رمز عبور فعلی نادرست است' } });
  }
  db.prepare(
    "UPDATE users SET password_hash = ?, must_change_password = 0, updated_at = datetime('now') WHERE id = ?",
  ).run(hashPassword(parsed.data.new_password), user.id);
  // Any other active session for this account is dropped after a password change.
  db.prepare('DELETE FROM sessions WHERE user_id = ? AND id != ?').run(user.id, req.user.session_token);
  logActivity({ actor: user.username, action: 'auth.password_changed', entity: 'user', entityId: user.id });
  res.json({ message: 'رمز عبور با موفقیت تغییر کرد.' });
});
