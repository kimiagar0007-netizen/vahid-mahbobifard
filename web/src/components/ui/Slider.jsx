import { useCallback, useEffect, useRef, useState } from 'react';
import { Icon } from './Icons.jsx';

/**
 * Horizontal card slider: native scroll (touch + wheel), arrow buttons and
 * keyboard support through the focusable scroll container.
 */
export function Slider({ children, ariaLabel = 'اسلایدر', head }) {
  const trackRef = useRef(null);
  const [edges, setEdges] = useState({ atStart: true, atEnd: false });

  const update = useCallback(() => {
    const el = trackRef.current;
    if (!el) return;
    const max = el.scrollWidth - el.clientWidth;
    const position = Math.abs(el.scrollLeft);
    setEdges({ atStart: position <= 4, atEnd: max <= 4 || position >= max - 4 });
  }, []);

  useEffect(() => {
    const el = trackRef.current;
    if (!el) return undefined;
    update();
    el.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', update);
    const observer = new ResizeObserver(update);
    observer.observe(el);
    return () => {
      el.removeEventListener('scroll', update);
      window.removeEventListener('resize', update);
      observer.disconnect();
    };
  }, [update, children]);

  const move = (direction) => {
    const el = trackRef.current;
    if (!el) return;
    const step = Math.max(el.clientWidth * 0.8, 240);
    const rtl = getComputedStyle(el).direction === 'rtl';
    const forward = rtl ? -1 : 1;
    el.scrollBy({ left: (direction === 'next' ? forward : -forward) * step, behavior: 'smooth' });
  };

  return (
    <div className="slider">
      <div className="slider__head">
        {head ?? <span />}
        <div className="slider__nav">
          <button
            type="button"
            className="slider__btn"
            onClick={() => move('prev')}
            disabled={edges.atStart}
            aria-label="موارد قبلی"
          >
            <Icon name="chevronRight" />
          </button>
          <button
            type="button"
            className="slider__btn"
            onClick={() => move('next')}
            disabled={edges.atEnd}
            aria-label="موارد بعدی"
          >
            <Icon name="chevronLeft" />
          </button>
        </div>
      </div>
      <div className="slider__track" ref={trackRef} tabIndex={0} role="group" aria-label={ariaLabel}>
        {children}
      </div>
    </div>
  );
}

export function SlideItem({ children }) {
  return <div className="slider__item">{children}</div>;
}
