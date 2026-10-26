import { useEffect } from 'react';
import { Icon } from './Icons.jsx';

export default function Modal({ open, title, onClose, children, footer, wide = false }) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (event) => {
      if (event.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="modal" role="dialog" aria-modal="true" aria-label={title}>
      <button type="button" className="modal__backdrop" aria-label="بستن" onClick={onClose} />
      <div className="modal__panel" style={wide ? { width: 'min(1080px, 100%)' } : undefined}>
        <div className="modal__header">
          <h2 className="modal__title">{title}</h2>
          <button type="button" className="modal__close" onClick={onClose} aria-label="بستن">
            <Icon name="close" size={18} />
          </button>
        </div>
        <div className="modal__body">{children}</div>
        {footer ? (
          <div className="modal__body" style={{ borderTop: '1px solid var(--border-neutral)' }}>
            {footer}
          </div>
        ) : null}
      </div>
    </div>
  );
}
