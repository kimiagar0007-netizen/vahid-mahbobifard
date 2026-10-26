export function FormGrid({ columns = 2, children }) {
  return <div className={`form__grid${columns === 3 ? ' form__grid--3' : ''}`}>{children}</div>;
}

export function Field({ label, htmlFor, required, hint, error, full, children }) {
  const className = full ? 'field field--full' : 'field';
  return (
    <div className={className}>
      {label ? (
        <label className="field__label" htmlFor={htmlFor}>
          {label}
          {required ? <span className="field__required"> *</span> : null}
        </label>
      ) : null}
      {children}
      {hint ? <span className="field__hint">{hint}</span> : null}
      {error ? <span className="field__error">{error}</span> : null}
    </div>
  );
}

export function Input({ invalid, className = '', ...rest }) {
  return <input className={`input ${className}`.trim()} aria-invalid={invalid ? 'true' : undefined} {...rest} />;
}

export function Select({ invalid, className = '', children, ...rest }) {
  return (
    <select className={`select ${className}`.trim()} aria-invalid={invalid ? 'true' : undefined} {...rest}>
      {children}
    </select>
  );
}

export function Textarea({ invalid, className = '', ...rest }) {
  return <textarea className={`textarea ${className}`.trim()} aria-invalid={invalid ? 'true' : undefined} {...rest} />;
}

export function CheckboxInput({ label, id, ...rest }) {
  return (
    <label className="checkbox" htmlFor={id}>
      <input id={id} type="checkbox" {...rest} />
      <span>{label}</span>
    </label>
  );
}
