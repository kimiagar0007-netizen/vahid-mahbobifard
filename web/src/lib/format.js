const faNumber = new Intl.NumberFormat('fa-IR');

const faDate = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'medium' });
const faDateTime = new Intl.DateTimeFormat('fa-IR-u-ca-persian', { dateStyle: 'medium', timeStyle: 'short' });

export function formatNumber(value) {
  if (value === null || value === undefined || Number.isNaN(Number(value))) return '—';
  return faNumber.format(Number(value));
}

/** Prices are shown exactly as recorded; nothing is displayed for an unset price. */
export function formatToman(value) {
  if (value === null || value === undefined || value === '' || Number.isNaN(Number(value))) return null;
  return `${formatNumber(value)} تومان`;
}

export function formatPrice(value) {
  return formatToman(value) ?? 'قیمت ثبت نشده';
}

export function formatDate(iso) {
  if (!iso) return '—';
  const date = new Date(iso.replace(' ', 'T') + (iso.includes('Z') ? '' : 'Z'));
  if (Number.isNaN(date.getTime())) return '—';
  return faDate.format(date);
}

export function formatDateTime(iso) {
  if (!iso) return '—';
  const date = new Date(iso.replace(' ', 'T') + (iso.includes('Z') ? '' : 'Z'));
  if (Number.isNaN(date.getTime())) return '—';
  return faDateTime.format(date);
}

const PERSIAN_DIGITS = '۰۱۲۳۴۵۶۷۸۹';

export function toPersianDigits(input) {
  return String(input ?? '').replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

export function fromPersianDigits(input) {
  return String(input ?? '').replace(/[۰-۹]/g, (d) => String(PERSIAN_DIGITS.indexOf(d)));
}

export function formatBytes(bytes) {
  if (!bytes) return '۰';
  if (bytes < 1024) return `${formatNumber(bytes)} بایت`;
  if (bytes < 1024 * 1024) return `${formatNumber(Math.round(bytes / 1024))} کیلوبایت`;
  return `${formatNumber((bytes / (1024 * 1024)).toFixed(1))} مگابایت`;
}

export const ORDER_STATUS = {
  new: { label: 'جدید', tone: 'info' },
  confirmed: { label: 'تأیید‌شده', tone: 'gold' },
  processing: { label: 'در حال آماده‌سازی', tone: 'gold' },
  shipped: { label: 'ارسال‌شده', tone: 'info' },
  completed: { label: 'تکمیل‌شده', tone: 'success' },
  cancelled: { label: 'لغو‌شده', tone: 'danger' },
};

export const PAYMENT_STATUS = {
  unpaid: { label: 'پرداخت‌نشده', tone: 'warn' },
  awaiting_gateway: { label: 'در انتظار درگاه پرداخت', tone: 'warn' },
  paid: { label: 'پرداخت‌شده', tone: 'success' },
};

export const REQUEST_STATUS = {
  new: { label: 'جدید', tone: 'info' },
  reviewing: { label: 'در حال بررسی', tone: 'gold' },
  need_info: { label: 'نیازمند اطلاعات بیشتر', tone: 'warn' },
  quoted: { label: 'اعلام قیمت', tone: 'gold' },
  completed: { label: 'تکمیل‌شده', tone: 'success' },
  cancelled: { label: 'لغو‌شده', tone: 'danger' },
};

export const PROJECT_TYPES = {
  residential: 'مسکونی',
  commercial: 'تجاری',
  office: 'اداری',
  renovation: 'بازسازی',
  other: 'سایر موارد',
};

export const PREFERRED_CONTACT = {
  phone: 'تماس تلفنی',
  whatsapp: 'واتساپ',
  sms: 'پیامک',
};

export function statusMeta(map, key) {
  return map[key] ?? { label: key ?? '—', tone: 'neutral' };
}

export function stockMeta(product) {
  if (!product) return { label: '—', tone: 'neutral' };
  if (product.stock_state === 'in_stock') {
    return { label: `موجود (${formatNumber(product.stock_quantity)})`, tone: 'success' };
  }
  if (product.stock_state === 'out_of_stock') return { label: 'ناموجود', tone: 'danger' };
  return { label: 'موجودی ثبت نشده — استعلام موجودی', tone: 'neutral' };
}

/** Digits in a phone number must stay Latin-friendly for dialling links. */
export function telHref(phone) {
  return `tel:${fromPersianDigits(phone).replace(/\s/g, '')}`;
}

export function whatsappHref(rawNumber, text = '') {
  const digits = fromPersianDigits(rawNumber).replace(/[^\d+]/g, '').replace(/^\+?0?98/, '').replace(/^0?/, '');
  const normalized = `98${digits.replace(/^0/, '')}`;
  const query = text ? `?text=${encodeURIComponent(text)}` : '';
  return `https://wa.me/${normalized}${query}`;
}
