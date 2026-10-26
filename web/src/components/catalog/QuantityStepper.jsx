import { Icon } from '../ui/Icons.jsx';

export default function QuantityStepper({ value, onChange, min = 1, max = 999, id = 'qty' }) {
  return (
    <div className="qty">
      <button
        type="button"
        className="qty__btn"
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="کاهش تعداد"
      >
        <Icon name="minus" size={16} />
      </button>
      <input
        id={id}
        className="qty__value"
        style={{ background: 'transparent', border: 0, textAlign: 'center', width: '48px' }}
        value={value}
        inputMode="numeric"
        aria-label="تعداد"
        onChange={(event) => {
          const next = Number(event.target.value.replace(/[^0-9]/g, ''));
          if (!Number.isFinite(next)) return;
          onChange(Math.min(Math.max(next, min), max));
        }}
      />
      <button
        type="button"
        className="qty__btn"
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="افزایش تعداد"
      >
        <Icon name="plus" size={16} />
      </button>
    </div>
  );
}
