import { useSettings } from '../context/SettingsContext.jsx';
import { useSeo } from '../lib/seo.js';
import { ButtonLink } from '../components/ui/Button.jsx';
import { Icon } from '../components/ui/Icons.jsx';

export default function NotFound() {
  const { seo } = useSettings();

  useSeo({
    title: 'صفحه پیدا نشد | کناف کرج',
    description: 'صفحه مورد نظر در سایت کناف کرج پیدا نشد.',
    siteUrl: seo.site_url,
    siteName: 'کناف کرج',
  });

  return (
    <div className="container">
      <div className="notfound">
        <span className="notfound__code">۴۰۴</span>
        <h1>صفحه مورد نظر پیدا نشد</h1>
        <p style={{ maxWidth: '60ch' }}>
          ممکن است نشانی تغییر کرده باشد یا محصول مورد نظر حذف شده باشد. از مسیرهای زیر می‌توانید ادامه دهید.
        </p>
        <div className="form__actions" style={{ justifyContent: 'center' }}>
          <ButtonLink to="/" variant="primary">
            <Icon name="home" size={18} />
            صفحه اصلی
          </ButtonLink>
          <ButtonLink to="/shop" variant="secondary">
            <Icon name="cart" size={18} />
            فروشگاه
          </ButtonLink>
          <ButtonLink to="/project-inquiry" variant="secondary">
            <Icon name="clipboardCheck" size={18} />
            استعلام اجرای پروژه
          </ButtonLink>
          <ButtonLink to="/contact" variant="ghost">
            تماس با ما
          </ButtonLink>
        </div>
      </div>
    </div>
  );
}
