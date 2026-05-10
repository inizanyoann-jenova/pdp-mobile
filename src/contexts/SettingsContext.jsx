// src/contexts/SettingsContext.jsx
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { supabase } from '../supabaseClient';

const LS_KEY = 'pdp_app_settings';

export const DEFAULT_SETTINGS = {
  company_name: '',
  company_address: '',
  company_phone: '',
  company_logo_base64: null,
  pdf_primary_color: '#1e3a5f',
};

const SettingsContext = createContext(null);

export function SettingsProvider({ session, children }) {
  const [settings, setSettings] = useState(() => {
    try {
      const stored = localStorage.getItem(LS_KEY);
      return stored ? { ...DEFAULT_SETTINGS, ...JSON.parse(stored) } : { ...DEFAULT_SETTINGS };
    } catch {
      return { ...DEFAULT_SETTINGS };
    }
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session?.user?.id) { setIsLoading(false); return; }
    supabase
      .from('app_settings')
      .select('*')
      .eq('user_id', session.user.id)
      .maybeSingle()
      .then(({ data, error }) => {
        if (!error && data) {
          const merged = { ...DEFAULT_SETTINGS, ...data };
          setSettings(merged);
          try { localStorage.setItem(LS_KEY, JSON.stringify(merged)); } catch {}
        }
        setIsLoading(false);
      });
  }, [session?.user?.id]);

  const saveSettings = useCallback(async (updates) => {
    const next = { ...settings, ...updates };
    setSettings(next);
    try { localStorage.setItem(LS_KEY, JSON.stringify(next)); } catch {}

    if (!session?.user?.id) return { error: new Error('Non connecté') };

    const { error } = await supabase
      .from('app_settings')
      .upsert({ ...next, user_id: session.user.id, updated_at: new Date().toISOString() }, { onConflict: 'user_id' });

    return { error };
  }, [settings, session?.user?.id]);

  return (
    <SettingsContext.Provider value={{ settings, saveSettings, isLoading }}>
      {children}
    </SettingsContext.Provider>
  );
}

export function useSettings() {
  const ctx = useContext(SettingsContext);
  if (!ctx) throw new Error('useSettings must be used inside SettingsProvider');
  return ctx;
}

export function hexToRgbArray(hex) {
  const clean = (hex || '#1e3a5f').replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}
