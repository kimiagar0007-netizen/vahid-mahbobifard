# AGENTS.md — راهنمای محیط توسعه کناف کرج

نکات غیرشفاف برای اجرای این پروژه در سندباکس Base44 و بررسی درستی کار. آنچه از خود فایل‌های
`package.json` و کد پیداست تکرار نشده است.

## اجرا و وضعیت سرویس‌ها

```bash
docker compose --project-name app --project-directory "$BASE44_PROJECT_ROOT" \
  -f "$BASE44_PROJECT_ROOT/docker-compose.base44.yml" up -d --build
docker compose --project-name app --project-directory "$BASE44_PROJECT_ROOT" \
  -f "$BASE44_PROJECT_ROOT/docker-compose.base44.yml" ps -a
```

- سه سرویس: `seed` (یک‌بار، سپس Exited 0)، `api` (پورت ۸۰۰۰)، `web` (پورت ۳۰۰۰ → داخلی ۵۱۷۳).
- **وابستگی نصب‌شده در والیوم**: `api_node_modules` و `web_node_modules` والیوم نام‌دار هستند و
  `npm ci` تنها زمانی اجرا می‌شود که `package-lock.json` جدیدتر از نشانه `node_modules/.deps-ok`
  باشد. بعد از تغییر `package.json` نیازی به کار دستی نیست؛ سرویس را دوباره `up -d` کنید.
- پایگاه داده در والیوم `app_data` قرار دارد (`/app/data/app.db`). هرگز آن والیوم را برای تازه‌سازی
  وابستگی‌ها حذف نکنید.
- فایل `.env.base44-defaults` فقط شامل مقادیر پیش‌فرض توسعه است و **پیش از**
  `/run/base44/app.env` خوانده می‌شود تا مقادیر Secrets داشبورد همیشه اولویت داشته باشند.

## نکات غیرشفاف

- **کلید ترتیب/سورت**: پارامتر `sort` در `/api/catalog/products` فقط از فهرست `SORTS` پذیرفته
  می‌شود؛ هر مقدار ناشناخته به `newest` برمی‌گردد (در غیر این صورت `ORDER BY undefined` خطای
  SQLite می‌دهد).
- **اعتبارسنجی فارسی**: همه پیام‌های خطا باید فارسی باشند؛ `validate()` در `api/src/lib/validate.js`
  هر پیام غیرفارسی (پیام‌های داخلی zod) را با پیام فارسی جایگزین می‌کند. اعداد فارسی و لاتین هر دو
  پذیرفته می‌شوند (`toLatinDigits`) و شماره موبایل نرمال‌سازی می‌شود.
- **قیمت خالی ≠ صفر**: `price = NULL` یعنی «قیمت ثبت نشده». چنین محصولی در سرور هم قابل سفارش نیست
  (`POST /api/orders` با کد ۴۰۰ و پیام «قیمت ثبت نشده» پاسخ می‌دهد)، حتی اگر دکمه مرورگر دستکاری شود.
- **مجوز مدیریت**: همه مسیرهای `/api/admin/*` در سرور با میدل‌ور `requireAdmin` محافظت می‌شوند.
  پنهان کردن دکمه‌ها در رابط کاربری کافی نیست؛ یک درخواست بدون نشست معتبر ۴۰۱ می‌گیرد.
- **نشست‌ها**: شناسه نشست در جدول `sessions` نگهداری می‌شود (کوکی `kk_session`, httpOnly,
  SameSite=Lax). کوکی روی HTTP بدون `Secure` تنظیم می‌شود چون TLS توسط پروکسی پیش‌نمایش
  پایان می‌یابد؛ پروکسی خودش آن را برای HTTPS اضافه می‌کند.
- **پیوست درخواست‌ها** زیر `data/uploads/private` ذخیره و فقط از مسیر مدیر
  (`/api/admin/attachments/:stored`) قابل دریافت است؛ تصاویر محصول در `data/uploads/public`
  و از `/uploads/...` عمومی سرو می‌شوند. مسیر فایل با `isInside` بررسی می‌شود.
- **پروکسی هم‌مبدأ**: درخواست‌های `/api`, `/uploads`, `/sitemap.xml` و `/robots.txt` در
  `web/vite.config.js` به سرویس `api` پروکسی می‌شوند. تغییر مقصد با متغیر `API_PROXY_TARGET`.
- **بازنویسی پیش‌نمایش (فقط سندباکس)**: در `web/vite.config.js` فهرست میزبان‌های مجاز Vite تنها
  وقتی `BASE44_PREVIEW_MODE === "1"` است با `.${BASE44_SANDBOX_HOST_DOMAIN}` گسترش می‌یابد. بدون
  این متغیر یا با مقدار دیگر، رفتار پیش‌فرض پروژه دست‌نخورده است. هیچ مقدار هاست به‌صورت ثابت در
  فایل‌ها نوشته نشده است.
- **فونت**: Vazirmatn از بسته `@fontsource/vazirmatn` بارگذاری می‌شود (بدون CDN بیرونی).

## بررسی درستی (بدون مجموعه تست خودکار)

پروژه تست خودکار ندارد؛ بررسی‌ها با API و رابط کاربری انجام می‌شود.

```bash
# سلامت سرویس‌ها
curl -s http://localhost:3000/api/health
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:3000/          # 200
curl -s -o /dev/null -w '%{http_code}\n' http://localhost:8000/api/admin/summary   # 401 (بدون نشست)

# ورود مدیر و بررسی مسیرهای محافظت‌شده
curl -s -c /tmp/c.txt -X POST http://localhost:8000/api/auth/login \
  -H 'Content-Type: application/json' \
  -d '{"username":"admin","password":"<ADMIN_PASSWORD>"}'
curl -s -b /tmp/c.txt http://localhost:8000/api/admin/summary

# اطمینان از اینکه محصول بدون قیمت قابل سفارش نیست (باید ۴۰۰ برگرداند)
curl -s -X POST http://localhost:8000/api/orders -H 'Content-Type: application/json' \
  -d '{"customer_name":"آزمون","phone":"09120000000","city":"کرج","address":"کرج، خیابان آزمون ۱","payment_method":"cod","privacy_accepted":true,"items":[{"product_id":1,"quantity":1}]}'
```

بررسی‌های رابط کاربری که ارزش تکرار دارند: جست‌وجو و فیلتر فروشگاه، صفحه محصول (دکمه خرید برای
محصول بدون قیمت غیرفعال است)، افزودن به سبد و بازمحاسبه مبلغ پس از تغییر تعداد، ثبت سفارش و
نمایش شماره پیگیری، فرم استعلام پروژه و کد پیگیری، و ورود/خروج پنل مدیر.

## اجرای اسکریپت‌ها

ابزارهای زبان روی میزبان سندباکس نصب نیستند؛ همه دستورها داخل کانتینر اجرا می‌شوند:

```bash
# بازتولید تصاویر نمایشی
docker run --rm -v "$BASE44_PROJECT_ROOT":/app -w /app node:22 node scripts/generate-placeholders.mjs

# ساخت/به‌روزرسانی lockfile پس از تغییر وابستگی‌ها
docker run --rm -v "$BASE44_PROJECT_ROOT":/app -w /app/api node:22 npm install --package-lock-only
```

## اسکریپت‌های یک‌بارمصرف

اسکریپت‌های بررسی و پاک‌سازی موقت را در `/tmp` بنویسید (`docker cp` به کانتینر و اجرا با `node`)؛
فایل موقت را در مخزن قرار ندهید.
