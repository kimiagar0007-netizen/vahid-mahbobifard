import { useSettings } from '../../context/SettingsContext.jsx';
import { telHref, whatsappHref } from '../../lib/format.js';
import { Icon } from '../ui/Icons.jsx';

/**
 * Floating call / WhatsApp shortcuts — rendered only when a real number has been
 * configured in the admin panel, so no invented contact link is ever shown.
 */
export default function FloatContact() {
  const { phone, whatsapp } = useSettings();
  if (!phone && !whatsapp) return null;

  return (
    <div className="float-contact">
      {whatsapp ? (
        <a
          className="float-contact__btn"
          href={whatsappHref(whatsapp, 'سلام، برای استعلام قیمت کناف تماس می‌گیرم.')}
          target="_blank"
          rel="noreferrer noopener"
          aria-label="گفت‌وگو در واتساپ"
          title="گفت‌وگو در واتساپ"
        >
          <Icon name="whatsapp" size={22} />
        </a>
      ) : null}
      {phone ? (
        <a className="float-contact__btn" href={telHref(phone)} aria-label="تماس تلفنی" title="تماس تلفنی">
          <Icon name="phone" size={22} />
        </a>
      ) : null}
    </div>
  );
}
