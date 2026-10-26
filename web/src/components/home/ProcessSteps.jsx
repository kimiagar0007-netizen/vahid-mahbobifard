import { SectionHeading } from '../ui/Display.jsx';

const STEPS = [
  { title: 'انتخاب محصول یا خدمت', text: 'از فروشگاه، محصولات قیمت‌دار را انتخاب کنید یا از بخش خدمات، خدمت موردنیاز پروژه را مشخص کنید.' },
  { title: 'ثبت سفارش یا ارسال درخواست پروژه', text: 'سفارش را در سبد خرید تکمیل کنید یا فرم استعلام اجرای پروژه را با جزئیات پروژه ارسال کنید.' },
  { title: 'بررسی نیاز و هماهنگی با مشتری', text: 'کارشناسان ما سفارش یا درخواست شما را بررسی می‌کنند و برای هماهنگی با شما تماس می‌گیرند.' },
  { title: 'نهایی‌سازی سفارش یا توافق اجرا', text: 'پس از تأیید موجودی، هزینه و زمان‌بندی، سفارش نهایی یا برنامه اجرای پروژه مشخص می‌شود.' },
];

export default function ProcessSteps() {
  return (
    <section className="section section--inset" id="process">
      <div className="container">
        <SectionHeading
          eyebrow="فرآیند همکاری"
          title="مسیر سفارش و اجرای پروژه"
          text="چهار مرحله ساده از انتخاب محصول تا نهایی‌سازی سفارش یا توافق اجرای پروژه."
          center
        />
        <ol className="process__steps" style={{ listStyle: 'none', padding: 0 }}>
          {STEPS.map((step, index) => (
            <li className="process__step" key={step.title}>
              <span className="process__num">{new Intl.NumberFormat('fa-IR').format(index + 1)}</span>
              <h3>{step.title}</h3>
              <p>{step.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
