export function Loading({ label = 'در حال دریافت اطلاعات…' }) {
  return (
    <div className="loading" role="status">
      <span className="spinner" aria-hidden="true" />
      <span>{label}</span>
    </div>
  );
}

export function Notice({ variant = 'info', title, children, className = '' }) {
  return (
    <div className={`notice notice--${variant} ${className}`.trim()} role={variant === 'error' ? 'alert' : 'status'}>
      <div>
        {title ? <div className="notice__title">{title}</div> : null}
        {children}
      </div>
    </div>
  );
}

export function FieldErrors({ fields }) {
  const entries = Object.entries(fields ?? {});
  if (!entries.length) return null;
  return (
    <Notice variant="error" title="لطفاً موارد زیر را اصلاح کنید:">
      <ul style={{ marginBottom: 0 }}>
        {entries.map(([key, message]) => (
          <li key={key}>{message}</li>
        ))}
      </ul>
    </Notice>
  );
}

export function EmptyState({ icon, title, children, action }) {
  return (
    <div className="empty-state">
      {icon ? <div className="empty-state__icon">{icon}</div> : null}
      {title ? <p className="empty-state__title">{title}</p> : null}
      {children ? <p className="empty-state__text">{children}</p> : null}
      {action}
    </div>
  );
}

export function SkeletonRows({ rows = 3, height = 88 }) {
  return (
    <div className="stack">
      {Array.from({ length: rows }).map((_, index) => (
        <div key={index} className="skeleton" style={{ height }} />
      ))}
    </div>
  );
}
