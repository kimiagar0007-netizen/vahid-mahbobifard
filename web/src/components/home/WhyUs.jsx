import { SectionHeading } from '../ui/Display.jsx';
import { Icon } from '../ui/Icons.jsx';

/** Only capabilities that are actually implemented on the site are listed here. */
const ITEMS = [
  {
    icon: 'box',
    title: 'دسترسی به محصولات متنوع کناف',
    text: 'پانل گچی، پروفیل، اتصالات، عایق، ابزار و تجهیزات جانبی سقف کاذب در دسته‌بندی‌های جداگانه.',
  },
  {
    icon: 'cart',
    title: 'خرید آنلاین محصولات قیمت‌دار',
    text: 'محصولاتی که قیمت آن‌ها در پنل مدیریت ثبت شده باشد، با محاسبه مبلغ در سرور قابل سفارش هستند.',
  },
  {
    icon: 'clipboardCheck',
    title: 'امکان استعلام اجرای پروژه',
    text: 'ثبت درخواست اجرا با دریافت کد پیگیری و امکان بررسی وضعیت درخواست توسط کارشناسان.',
  },
  {
    icon: 'chat',
    title: 'ارتباط مستقیم با مجموعه',
    text: 'دکمه تماس و واتساپ در سایت فعال می‌شود؛ به‌محض ثبت شماره تماس در تنظیمات سایت.',
  },
  {
    icon: 'image',
    title: 'مشاهده نمونه‌کارها و اطلاعات محصولات',
    text: 'جزئیات هر محصول، شرح خدمات و گالری نمونه‌کارها با فیلتر دسته‌بندی در دسترس است.',
  },
];

export default function WhyUs() {
  return (
    <section className="section" id="why-us">
      <div className="container">
        <SectionHeading
          eyebrow="چرا کناف کرج؟"
          title="امکاناتی که در این سایت فعال است"
          text="فهرست زیر تنها قابلیت‌هایی است که در سایت پیاده‌سازی شده و قابل استفاده است."
          center
        />
        <div className="grid grid--3">
          {ITEMS.map((item) => (
            <article className="why-card" key={item.title}>
              <span className="why-card__icon">
                <Icon name={item.icon} size={22} />
              </span>
              <h3>{item.title}</h3>
              <p>{item.text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
