import { Link } from 'react-router-dom';

export function Button({
  variant = 'secondary',
  size = 'md',
  block = false,
  busy = false,
  className = '',
  children,
  disabled,
  type = 'button',
  ...rest
}) {
  const classes = ['btn', `btn--${variant}`, size !== 'md' ? `btn--${size}` : '', block ? 'btn--block' : '', className]
    .filter(Boolean)
    .join(' ');
  return (
    <button type={type} className={classes} disabled={disabled || busy} {...rest}>
      {busy ? (
        <span className="btn__busy">
          <span className="spinner" aria-hidden="true" />
          {children}
        </span>
      ) : (
        children
      )}
    </button>
  );
}

export function ButtonLink({
  to,
  variant = 'secondary',
  size = 'md',
  block = false,
  className = '',
  children,
  external = false,
  ...rest
}) {
  const classes = ['btn', `btn--${variant}`, size !== 'md' ? `btn--${size}` : '', block ? 'btn--block' : '', className]
    .filter(Boolean)
    .join(' ');
  if (external) {
    return (
      <a className={classes} href={to} target="_blank" rel="noreferrer noopener" {...rest}>
        {children}
      </a>
    );
  }
  return (
    <Link className={classes} to={to} {...rest}>
      {children}
    </Link>
  );
}
