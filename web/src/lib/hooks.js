import { useCallback, useEffect, useState } from 'react';
import { api } from './api.js';

export function useAsync(fn, deps = [], { immediate = true } = {}) {
  const [state, setState] = useState({ loading: immediate, data: null, error: null });

  const run = useCallback(async () => {
    setState((current) => ({ ...current, loading: true, error: null }));
    try {
      const data = await fn();
      setState({ loading: false, data, error: null });
      return data;
    } catch (error) {
      setState({ loading: false, data: null, error: error.message });
      return null;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);

  useEffect(() => {
    if (immediate) run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [run, immediate]);

  return {
    ...state,
    reload: run,
    setData: (data) => setState({ loading: false, data, error: null }),
  };
}

/** Published product categories (header menu, home grid, shop filters). */
export function useCategories() {
  const state = useAsync(async () => {
    const res = await api.get('/catalog/categories');
    return res.items ?? [];
  }, []);
  return { ...state, categories: state.data ?? [] };
}
