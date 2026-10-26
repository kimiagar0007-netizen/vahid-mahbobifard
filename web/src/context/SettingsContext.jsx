import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '../lib/api.js';

const SettingsContext = createContext(null);

export function SettingsProvider({ children }) {
  const [settings, setSettings] = useState(null);
  const [capabilities, setCapabilities] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    try {
      const [settingsRes, metaRes] = await Promise.all([api.get('/settings'), api.get('/meta')]);
      setSettings(settingsRes.settings);
      setCapabilities(metaRes.capabilities);
      setError(null);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const value = useMemo(() => {
    const enabledMethods = (settings?.payment?.methods ?? []).filter((m) => m.enabled);
    return {
      settings,
      capabilities,
      loading,
      error,
      reload: load,
      brand: settings?.brand ?? {},
      contact: settings?.contact ?? {},
      social: settings?.social ?? {},
      home: settings?.home ?? {},
      shipping: settings?.shipping ?? {},
      payment: settings?.payment ?? {},
      shop: settings?.shop ?? { currency: 'تومان' },
      seo: settings?.seo ?? {},
      paymentMethods: enabledMethods,
      siteUrl: settings?.seo?.site_url || '',
      phone: settings?.contact?.phone || '',
      whatsapp: settings?.contact?.whatsapp || '',
      address: settings?.contact?.address || '',
      email: settings?.contact?.email || '',
      workingHours: settings?.contact?.working_hours || '',
    };
  }, [settings, capabilities, loading, error, load]);

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}
