import crypto from 'node:crypto';

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';
const ARABIC_DIGITS = '٠١٢٣٤٥٦٧٨٩';

/** Converts Persian/Arabic-Indic digits to Latin ones so user input is always comparable. */
export function toLatinDigits(input) {
  return String(input ?? '').replace(/[۰-۹٠-٩]/g, (ch) => {
    const p = PERSIAN_DIGITS.indexOf(ch);
    if (p > -1) return String(p);
    return String(ARABIC_DIGITS.indexOf(ch));
  });
}

/** Strips separators and normalizes an Iranian mobile number, or returns null. */
export function normalizePhone(input) {
  let value = toLatinDigits(input).replace(/[\s\-().]/g, '');
  if (value.startsWith('+98')) value = `0${value.slice(3)}`;
  else if (value.startsWith('0098')) value = `0${value.slice(4)}`;
  else if (value.startsWith('98') && value.length === 12) value = `0${value.slice(2)}`;
  else if (value.startsWith('9') && value.length === 10) value = `0${value}`;
  return /^09\d{9}$/.test(value) ? value : null;
}

export function slugify(input) {
  return String(input ?? '')
    .trim()
    .toLowerCase()
    .replace(/[\s_]+/g, '-')
    .replace(/[^\p{L}\p{N}-]+/gu, '')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

const CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function randomCode(length) {
  let out = '';
  const bytes = crypto.randomBytes(length);
  for (let i = 0; i < length; i += 1) out += CODE_ALPHABET[bytes[i] % CODE_ALPHABET.length];
  return out;
}

/** Human-friendly tracking code, e.g. KK-4F9A2C / PR-8B2D1E. */
export function generateTrackingCode(prefix) {
  return `${prefix}-${randomCode(6)}`;
}

/** Order number, e.g. KK-2609-8F3A1C. */
export function generateOrderNumber() {
  const now = new Date();
  const stamp = `${String(now.getFullYear()).slice(2)}${String(now.getMonth() + 1).padStart(2, '0')}`;
  return `KK-${stamp}-${randomCode(6)}`;
}

export function maskPhone(phone) {
  const value = String(phone ?? '');
  if (value.length < 6) return '—';
  return `${value.slice(0, 4)}***${value.slice(-2)}`;
}

/** Formats an integer amount in Toman for server-side messages. */
export function formatToman(amount) {
  if (amount === null || amount === undefined) return 'قیمت ثبت نشده';
  return `${new Intl.NumberFormat('fa-IR').format(amount)} تومان`;
}
