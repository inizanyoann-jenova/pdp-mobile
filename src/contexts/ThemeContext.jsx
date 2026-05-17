import React, { createContext, useContext, useState, useEffect } from 'react';

const DARK = {
  name: 'dark',
  bg: '#0B1120', bgCard: '#0f1929', bgCard2: '#152236', bgCard3: '#1a2a40',
  border: 'rgba(255,255,255,0.08)', border2: 'rgba(255,255,255,0.06)',
  text1: '#F1F5F9', text2: '#CBD5E1', text3: '#94A3B8', text4: '#64748B', text5: '#475569',
  inputBg: '#152236', iconBg: '#152236',
  accent: '#4F63E7', accentText: '#ffffff',
};

const LIGHT = {
  name: 'light',
  bg: '#F0F4F8', bgCard: '#FFFFFF', bgCard2: '#F8FAFC', bgCard3: '#EFF6FF',
  border: 'rgba(15,23,42,0.09)', border2: 'rgba(15,23,42,0.06)',
  text1: '#0F172A', text2: '#1E293B', text3: '#475569', text4: '#64748B', text5: '#94A3B8',
  inputBg: '#F8FAFC', iconBg: '#E2E8F0',
  accent: '#4F63E7', accentText: '#ffffff',
};

const TERRAIN = {
  name: 'terrain',
  bg: '#FFFEF5', bgCard: '#FFFFFF', bgCard2: '#F5F5F0', bgCard3: '#EEEDE8',
  border: '#000000', border2: '#333333',
  text1: '#000000', text2: '#111111', text3: '#222222', text4: '#444444', text5: '#666666',
  inputBg: '#FFFFFF', iconBg: '#000000',
  accent: '#FFCC00', accentText: '#000000',
};

const THEMES = [DARK, LIGHT, TERRAIN];
const THEME_NAMES = ['dark', 'light', 'terrain'];

const ThemeContext = createContext({ theme: DARK, isDark: true, toggle: () => {} });

export function ThemeProvider({ children }) {
  const [themeName, setThemeName] = useState(() => {
    try { return localStorage.getItem('pdp_theme') || 'dark'; } catch { return 'dark'; }
  });

  const theme = THEMES.find(t => t.name === themeName) || DARK;
  const isDark = themeName === 'dark';

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', themeName);
    const r = document.documentElement.style;
    r.setProperty('--bg',       theme.bg);
    r.setProperty('--bg-card',  theme.bgCard);
    r.setProperty('--bg-card2', theme.bgCard2);
    r.setProperty('--border',   theme.border);
    r.setProperty('--text1',    theme.text1);
    r.setProperty('--text2',    theme.text2);
    r.setProperty('--text3',    theme.text3);
    r.setProperty('--text4',    theme.text4);
    try { localStorage.setItem('pdp_theme', themeName); } catch {}
  }, [themeName, theme]);

  const toggle = () => {
    setThemeName(n => {
      const idx = THEME_NAMES.indexOf(n);
      return THEME_NAMES[(idx + 1) % THEME_NAMES.length];
    });
  };

  return (
    <ThemeContext.Provider value={{ theme, isDark, toggle }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
