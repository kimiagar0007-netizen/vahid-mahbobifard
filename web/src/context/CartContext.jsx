import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

const CartContext = createContext(null);
const STORAGE_KEY = 'knauf-karaj-cart-v1';

function readStored() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .filter((item) => item && Number.isInteger(item.product_id) && item.quantity > 0)
      .map((item) => ({ product_id: item.product_id, quantity: Math.min(item.quantity, 999) }));
  } catch {
    return [];
  }
}

export function CartProvider({ children }) {
  const [items, setItems] = useState(readStored);
  const [quote, setQuote] = useState(null);
  const [quoting, setQuoting] = useState(false);
  const [quoteError, setQuoteError] = useState(null);

  useEffect(() => {
    try {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch {
      /* storage unavailable — cart simply will not survive a reload */
    }
  }, [items]);

  // The server is the only source of prices; every cart change is re-priced there.
  useEffect(() => {
    if (!items.length) {
      setQuote(null);
      setQuoteError(null);
      return undefined;
    }
    let alive = true;
    setQuoting(true);
    api
      .post('/orders/quote', { items: items.map(({ product_id, quantity }) => ({ product_id, quantity })) })
      .then((data) => {
        if (!alive) return;
        setQuote(data);
        setQuoteError(null);
      })
      .catch((err) => {
        if (!alive) return;
        setQuote(null);
        setQuoteError(err.message);
      })
      .finally(() => {
        if (alive) setQuoting(false);
      });
    return () => {
      alive = false;
    };
  }, [items]);

  const add = useCallback((product, quantity = 1) => {
    setItems((current) => {
      const existing = current.find((item) => item.product_id === product.id);
      if (existing) {
        return current.map((item) =>
          item.product_id === product.id
            ? { ...item, quantity: Math.min(item.quantity + quantity, 999) }
            : item,
        );
      }
      return [...current, { product_id: product.id, quantity: Math.min(quantity, 999) }];
    });
  }, []);

  const setQuantity = useCallback((productId, quantity) => {
    setItems((current) =>
      quantity <= 0
        ? current.filter((item) => item.product_id !== productId)
        : current.map((item) =>
            item.product_id === productId ? { ...item, quantity: Math.min(quantity, 999) } : item,
          ),
    );
  }, []);

  const remove = useCallback((productId) => {
    setItems((current) => current.filter((item) => item.product_id !== productId));
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const lines = quote?.lines ?? [];
  const problems = quote?.problems ?? [];
  const count = items.reduce((sum, item) => sum + item.quantity, 0);
  const inCart = useCallback(
    (productId) => items.find((item) => item.product_id === productId)?.quantity ?? 0,
    [items],
  );

  const value = useMemo(
    () => ({
      items,
      lines,
      problems,
      quote,
      quoting,
      quoteError,
      count,
      add,
      setQuantity,
      remove,
      clear,
      inCart,
      totals: {
        subtotal: quote?.subtotal ?? 0,
        discount: quote?.discount ?? 0,
        shipping: quote?.shipping_cost ?? 0,
        total: quote?.total ?? 0,
        payable: Boolean(quote?.payable),
      },
    }),
    [items, lines, problems, quote, quoting, quoteError, count, add, setQuantity, remove, clear, inCart],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used inside CartProvider');
  return ctx;
}
