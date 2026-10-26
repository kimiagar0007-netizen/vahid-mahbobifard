import { api } from '../lib/api.js';
import { useAsync } from '../lib/hooks.js';
import { useSettings } from '../context/SettingsContext.jsx';
import { telHref, toPersianDigits, whatsappHref } from '../lib/format.js';
import { useSeo } from '../lib/seo.js';
import { Crumbs } from '../components/ui/Display.jsx';
import { ButtonLink } from '../components/ui/Button.jsx';
import { Loading, Notice } from '../components/ui/Feedback.jsx';
import { Icon } from '../components/ui/Icons.jsx';
import { parseContent } from '../lib/content.js';

export default function Contact() {
  const { seo, contact, phone, whatsapp, address, email, workingHours } = useSettings();
  const { data, loading } = useAsync(async () => {
    const res = await api.get('/pages/contact');
    return res.page;
  }, []);

  useSeo({
    title: data?.seo_title || 'تماس با کناف کرج | استعلام قیمت و اجرای پروژه',
    description: data?.seo_description || seo.default_description,
    path: '/contact',
    siteUrl: seo.site_url,
    siteName: 'کناف کرج',
  });

  const hasContact = Boolean(contact.phone || contact.whatsapp || contact.address || contact.email);
  const blocks = parseContent(data?.body ?? '');

  const rows = [
    phone ? { icon: 'phone', label: 'تلفن', value: toPersianDigits(phone), href: telHref(phone) } : null,
    whatsapp ? { icon: 'whatsapp', label: 'واتساپ', value: toPersianDigits(whatsapp), href: whatsappHref(whatsapp) } : null,
    email ? { icon: 'mail', label: 'ایمیل', value: email, href: `mailto:${email}` } : null,
    address ? { icon: 'mapPin', label: 'نشانی', value: address } : null,
    workingHours ? { icon: 'clock', label: 'ساعات کاری', value: workingHours } : null,
  ].filter(Boolean);

  return (
    <>
      <header className="page-head">
        <div className="container">
          <Crumbs items={[{ name: 'تماس با ما' }]} />
          <h1 className="page-head__title">تماس با ما</h1>
          <p className="page-head__text">
            برای خرید مصالح، استعلام قیمت یا درخواست اجرای پروژه با کناف کرج در ارتباط باشید.
          </p>
        </div>
      </header>

      <section className="section">
        <div className="container">
          <div className="grid grid--2" style={{ alignItems: 'start', gap: '48px' }}>
            <div>
              {loading ? <Loading label="در حال دریافت اطلاعات…" /> : null}
              {!hasContact && !loading ? (
                <Notice variant="warn" title="اطلاعات تماس هنوز تکمیل نشده است">
                  شماره تماس، نشانی و ساعات کاری این مجموعه باید توسط مدیر در بخش «تنظیمات» پنل مدیریت وارد شود. تا آن
                  زمان، دکمه‌های تماس و واتساپ در سایت غیرفعال هستند و هیچ شماره‌ای به‌صورت پیش‌فرض نمایش داده نمی‌شود.
                </Notice>
              ) : null}

              {hasContact ? (
                <ul className="fact-grid" style={{ marginTop: 0 }}>
                  {rows.map((row) => (
                    <li className="fact" key={row.label}>
                      <span className="fact__label">
                        <Icon name={row.icon} size={14} /> {row.label}
                      </span>
                      <span className="fact__value">
                        {row.href ? (
                          <a href={row.href} target={row.icon === 'whatsapp' ? '_blank' : undefined} rel="noreferrer noopener">
                            {row.value}
                          </a>
                        ) : (
                          row.value
                        )}
                      </span>
                    </li>
                  ))}
                </ul>
              ) : null}

              {blocks.length ? (
                <div className="content-blocks mt-6">
                  {blocks.map((block, index) => {
                    if (block.type === 'h2') return <h2 key={index}>{block.text}</h2>;
                    if (block.type === 'ul') {
                      return (
                        <ul key={index}>
                          {block.items.map((item) => (
                            <li key={item}>{item}</li>
                          ))}
                        </ul>
                      );
                    }
                    return <p key={index}>{block.text}</p>;
                  })}
                </div>
              ) : null}
            </div>

            <div className="stack">
              <div className="aside-card">
                <h2 style={{ fontSize: 'var(--fs-md)', margin: 0 }}>ثبت درخواست</h2>
                <p className="form__note" style={{ margin: 0 }}>
                  سریع‌ترین راه دریافت پاسخ، ارسال فرم است؛ درخواست شما با کد پیگیری در پنل مدیریت ثبت می‌شود.
                </p>
                <ButtonLink to="/project-inquiry" variant="primary" block>
                  <Icon name="clipboardCheck" size={18} />
                  استعلام اجرای پروژه
                </ButtonLink>
                <ButtonLink to="/wholesale" variant="secondary" block>
                  <Icon name="package" size={18} />
                  درخواست خرید عمده
                </ButtonLink>
                <ButtonLink to="/faq" variant="ghost" block>
                  <Icon name="info" size={18} />
                  پرسش‌های متداول
                </ButtonLink>
              </div>

              <div className="aside-card">
                <h2 style={{ fontSize: 'var(--fs-md)', margin: 0 }}>خرید و اجرا</h2>
                <p className="form__note" style={{ margin: 0 }}>
                  خرید محصولات قیمت‌دار از فروشگاه و ثبت درخواست اجرا، هر دو با پیگیری اختصاصی انجام می‌شود.
                </p>
                <ButtonLink to="/shop" variant="secondary" block>
                  <Icon name="cart" size={18} />
                  مشاهده فروشگاه
                </ButtonLink>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
