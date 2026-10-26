import { z } from 'zod';
import { normalizePhone, toLatinDigits } from './text.js';

/** Optional URL-ish string (accepts empty). */
const optionalText = (max = 500) =>
  z
    .string()
    .trim()
    .max(max, `حداکثر ${max} کاراکتر مجاز است`)
    .optional()
    .transform((v) => (v === undefined || v === '' ? null : v));

const phoneField = z
  .string()
  .trim()
  .min(1, 'شماره تماس الزامی است')
  .transform((v, ctx) => {
    const normalized = normalizePhone(v);
    if (!normalized) {
      ctx.addIssue({ code: 'custom', message: 'شماره تماس معتبر نیست (نمونه: ۰۹۱۲۳۴۵۶۷۸۹)' });
      return z.NEVER;
    }
    return normalized;
  });

const nameField = z.string().trim().min(3, 'نام و نام خانوادگی را کامل وارد کنید').max(120, 'نام وارد شده طولانی است');

const quantityField = z
  .union([z.number(), z.string()])
  .transform((v) => Number(toLatinDigits(v)))
  .refine((v) => Number.isInteger(v) && v > 0 && v <= 999, 'تعداد نامعتبر است');

export const loginSchema = z.object({
  username: z.string().trim().min(1, 'نام کاربری را وارد کنید').max(60),
  password: z.string().min(1, 'رمز عبور را وارد کنید').max(200),
});

export const changePasswordSchema = z.object({
  current_password: z.string().min(1, 'رمز عبور فعلی را وارد کنید'),
  new_password: z.string().min(8, 'رمز عبور جدید باید حداقل ۸ کاراکتر باشد').max(200),
});

export const cartItemsSchema = z.object({
  items: z
    .array(
      z.object({
        product_id: z.coerce.number().int().positive('شناسه محصول نامعتبر است'),
        quantity: quantityField,
      }),
    )
    .min(1, 'سبد خرید خالی است')
    .max(50, 'تعداد اقلام سبد خرید زیاد است'),
});

export const orderSchema = z.object({
  customer_name: nameField,
  phone: phoneField,
  email: z
    .string()
    .trim()
    .max(120)
    .optional()
    .transform((v) => (v ? v : null))
    .refine((v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'ایمیل معتبر نیست'),
  city: z.string().trim().min(2, 'شهر را وارد کنید').max(60, 'نام شهر طولانی است'),
  address: z.string().trim().min(10, 'نشانی را کامل‌تر وارد کنید').max(500, 'نشانی طولانی است'),
  postal_code: z
    .string()
    .trim()
    .max(20)
    .optional()
    .transform((v) => toLatinDigits(v ?? '').replace(/\s/g, ''))
    .refine((v) => !v || /^\d{10}$/.test(v), 'کد پستی باید ۱۰ رقم باشد'),
  note: optionalText(500),
  payment_method: z.string().trim().min(1, 'روش پرداخت را انتخاب کنید').max(40),
  privacy_accepted: z.coerce.boolean().refine((v) => v === true, 'برای ثبت سفارش باید سیاست حریم خصوصی را بپذیرید'),
  items: cartItemsSchema.shape.items,
});

export const projectRequestSchema = z.object({
  customer_name: nameField,
  phone: phoneField,
  project_type: z.enum(['residential', 'commercial', 'office', 'renovation', 'other'], {
    message: 'نوع پروژه را انتخاب کنید',
  }),
  service_type: z.string().trim().min(2, 'نوع خدمت موردنیاز را انتخاب کنید').max(120),
  estimated_area: optionalText(60),
  location: z.string().trim().min(2, 'شهر و منطقه پروژه را وارد کنید').max(120),
  description: z.string().trim().min(10, 'توضیحات پروژه را کامل‌تر وارد کنید').max(2000, 'توضیحات طولانی است'),
  preferred_contact: z.enum(['phone', 'whatsapp', 'sms'], { message: 'روش تماس ترجیحی را انتخاب کنید' }),
  privacy_accepted: z.coerce.boolean().refine((v) => v === true, 'برای ارسال درخواست باید سیاست حریم خصوصی را بپذیرید'),
});

export const wholesaleRequestSchema = z.object({
  full_name: nameField,
  phone: phoneField,
  company: optionalText(120),
  product_type: z.string().trim().min(2, 'نوع محصول موردنیاز را وارد کنید').max(160),
  estimated_quantity: z.string().trim().min(1, 'مقدار تقریبی سفارش را وارد کنید').max(120),
  city: z.string().trim().min(2, 'شهر محل تحویل را وارد کنید').max(60),
  description: optionalText(1000),
});

export const reviewSchema = z.object({
  name: z.string().trim().min(3, 'نام خود را وارد کنید').max(80),
  rating: z.coerce.number().int().min(1, 'امتیاز را انتخاب کنید').max(5, 'امتیاز نامعتبر است'),
  text: z.string().trim().min(10, 'متن نظر را کامل‌تر بنویسید').max(1000, 'متن نظر طولانی است'),
  product_id: z.coerce.number().int().positive().optional().nullable(),
});

export const categorySchema = z.object({
  name: z.string().trim().min(2, 'نام دسته‌بندی را وارد کنید').max(120),
  slug: z.string().trim().max(120).optional(),
  description: optionalText(500),
  image: optionalText(300),
  image_alt: optionalText(200),
  is_published: z.coerce.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
});

export const productSchema = z.object({
  name: z.string().trim().min(2, 'نام محصول را وارد کنید').max(160),
  slug: z.string().trim().max(160).optional(),
  description: optionalText(2000),
  category_id: z.coerce.number().int().positive('دسته‌بندی را انتخاب کنید').nullable().optional(),
  image: optionalText(300),
  image_alt: optionalText(200),
  price: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform((v) => {
      const digits = toLatinDigits(v ?? '').replace(/[,\s]/g, '');
      if (digits === '') return null;
      const n = Number(digits);
      return Number.isFinite(n) && n >= 0 ? Math.round(n) : Number.NaN;
    })
    .refine((v) => v === null || Number.isFinite(v), 'قیمت باید یک عدد صحیح باشد'),
  sale_price: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform((v) => {
      const digits = toLatinDigits(v ?? '').replace(/[,\s]/g, '');
      if (digits === '') return null;
      const n = Number(digits);
      return Number.isFinite(n) && n >= 0 ? Math.round(n) : Number.NaN;
    })
    .refine((v) => v === null || Number.isFinite(v), 'قیمت فروش ویژه باید یک عدد صحیح باشد'),
  unit: optionalText(40),
  stock_quantity: z
    .union([z.number(), z.string()])
    .optional()
    .nullable()
    .transform((v) => {
      const digits = toLatinDigits(v ?? '').replace(/[,\s]/g, '');
      if (digits === '') return null;
      const n = Number(digits);
      return Number.isFinite(n) && n >= 0 ? Math.round(n) : Number.NaN;
    })
    .refine((v) => v === null || Number.isFinite(v), 'موجودی باید یک عدد صحیح باشد'),
  is_published: z.coerce.boolean().default(false),
  is_featured: z.coerce.boolean().default(false),
  seo_title: optionalText(200),
  seo_description: optionalText(300),
});

export const serviceSchema = z.object({
  name: z.string().trim().min(2, 'نام خدمت را وارد کنید').max(160),
  slug: z.string().trim().max(160).optional(),
  description: optionalText(2000),
  benefits: z.array(z.string().trim().min(2).max(200)).max(8, 'حداکثر ۸ مزیت').default([]),
  image: optionalText(300),
  image_alt: optionalText(200),
  is_published: z.coerce.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
});

export const portfolioSchema = z.object({
  title: z.string().trim().min(2, 'عنوان پروژه را وارد کنید').max(160),
  slug: z.string().trim().max(160).optional(),
  description: optionalText(1500),
  category: z.string().trim().min(2, 'دسته‌بندی پروژه را وارد کنید').max(80),
  image: optionalText(300),
  image_alt: optionalText(200),
  area: optionalText(60),
  specs: optionalText(500),
  is_sample: z.coerce.boolean().default(false),
  is_published: z.coerce.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
});

export const statusUpdateSchema = z.object({
  status: z.string().trim().min(1, 'وضعیت را انتخاب کنید').max(40),
  note: optionalText(500),
});

export const settingsSchema = z.object({
  patch: z.record(z.string(), z.any()),
});

export const pageSchema = z.object({
  title: z.string().trim().min(2, 'عنوان صفحه را وارد کنید').max(160),
  seo_title: optionalText(200),
  seo_description: optionalText(300),
  body: z.string().max(20000, 'متن صفحه طولانی است').default(''),
});

export const faqSchema = z.object({
  question: z.string().trim().min(5, 'پرسش را کامل وارد کنید').max(300),
  answer: z.string().trim().min(5, 'پاسخ را کامل وارد کنید').max(2000),
  is_published: z.coerce.boolean().default(true),
  sort_order: z.coerce.number().int().default(0),
});

export const ORDER_STATUSES = ['new', 'confirmed', 'processing', 'shipped', 'completed', 'cancelled'];
export const PAYMENT_STATUSES = ['unpaid', 'awaiting_gateway', 'paid'];
export const REQUEST_STATUSES = ['new', 'reviewing', 'need_info', 'quoted', 'completed', 'cancelled'];

/**
 * Validates data against a schema.
 * @returns {{ok: true, data: any} | {ok: false, message: string, fields: object}}
 */
const HAS_PERSIAN = /[\u0600-\u06FF]/;

/** All user-facing validation messages must be Persian, never framework English. */
function persian(message, fallback) {
  return message && HAS_PERSIAN.test(message) ? message : fallback;
}

export function validate(schema, data) {
  const result = schema.safeParse(data);
  if (result.success) return { ok: true, data: result.data };
  const fields = {};
  for (const issue of result.error.issues) {
    const key = issue.path.join('.') || '_';
    if (!fields[key]) fields[key] = persian(issue.message, 'این مقدار معتبر نیست');
  }
  const first = result.error.issues[0];
  return {
    ok: false,
    message: persian(first?.message, 'اطلاعات ارسالی معتبر نیست؛ لطفاً فیلدها را بررسی کنید.'),
    fields,
  };
}
