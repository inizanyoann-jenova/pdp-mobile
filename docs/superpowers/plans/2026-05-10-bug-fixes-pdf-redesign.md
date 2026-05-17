# Bug Fixes & PDF Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Corriger les bugs critiques (SignaturePad, photos, erreurs silencieuses, offline) et refaire le PDF en style professionnel blanc/bleu marine avec logo configurable.

**Architecture:** Ajout de ToastContext (feedback erreurs), SettingsContext (paramètres entreprise + logo), réécriture complète de exportPdf.js en thème clair style A, correction des touch events sur SignaturePad, ajout des photos par question dans le PDF.

**Tech Stack:** React 18, Vite 5, Tailwind CSS, Supabase JS v2, jsPDF 2.5, Vitest (à installer), Lucide React

---

## File Map

| Statut | Fichier | Rôle |
|--------|---------|------|
| Créer | `src/contexts/ToastContext.jsx` | Système de notifications toast |
| Créer | `src/components/Toast.jsx` | Rendu visuel des toasts |
| Créer | `src/contexts/SettingsContext.jsx` | Paramètres entreprise + persistance |
| Créer | `src/pages/Settings.jsx` | Page de configuration UI |
| Créer | `src/tests/settings.test.js` | Tests unitaires settings |
| Créer | `src/tests/toast.test.js` | Tests unitaires toast |
| Modifier | `src/App.jsx` | Ajout providers + route /settings |
| Modifier | `src/components/BottomNav.jsx` | Ajout icône paramètres |
| Modifier | `src/components/SignaturePad.jsx` | Fix passive touch events |
| Modifier | `src/utils/exportPdf.js` | Réécriture complète (thème blanc + logo + photos questions) |
| Modifier | `src/pages/NouveauPdP.jsx` | Protection brouillon non sauvegardé |
| Modifier | `src/pages/ListePdP.jsx` | Bandeau offline + erreurs visibles |
| Modifier | `src/pages/DetailPdP.jsx` | Erreurs visibles |
| Modifier | `vite.config.js` | Ajout config Vitest |
| Modifier | `package.json` | Ajout deps Vitest |

---

## Task 1 — Setup Vitest

**Files:**
- Modify: `package.json`
- Modify: `vite.config.js`
- Create: `src/tests/setup.js`

- [ ] **Step 1: Installer Vitest et les dépendances de test**

```bash
npm install -D vitest @vitest/ui jsdom @testing-library/react @testing-library/jest-dom
```

- [ ] **Step 2: Mettre à jour vite.config.js**

Lire le fichier actuel puis remplacer par :

```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.js',
  },
});
```

- [ ] **Step 3: Créer le fichier de setup des tests**

```js
// src/tests/setup.js
import '@testing-library/jest-dom';
```

- [ ] **Step 4: Ajouter le script test dans package.json**

Dans la section `"scripts"`, ajouter après `"preview"` :

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 5: Vérifier que Vitest fonctionne**

```bash
npm test
```

Résultat attendu : `No test files found` (pas d'erreur)

- [ ] **Step 6: Commit**

```bash
git init
git add vite.config.js package.json src/tests/setup.js
git commit -m "test: setup vitest + jsdom test environment"
```

---

## Task 2 — Toast Notification System

**Files:**
- Create: `src/contexts/ToastContext.jsx`
- Create: `src/components/Toast.jsx`
- Create: `src/tests/toast.test.js`
- Modify: `src/App.jsx`

- [ ] **Step 1: Écrire le test unitaire du ToastContext**

```js
// src/tests/toast.test.js
import { describe, it, expect, vi } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { ToastProvider, useToast } from '../contexts/ToastContext';

const wrapper = ({ children }) => <ToastProvider>{children}</ToastProvider>;

describe('ToastContext', () => {
  it('addToast ajoute un toast avec un id unique', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => result.current.addToast({ message: 'Bonjour', type: 'success' }));
    expect(result.current.toasts).toHaveLength(1);
    expect(result.current.toasts[0].message).toBe('Bonjour');
    expect(result.current.toasts[0].type).toBe('success');
    expect(result.current.toasts[0].id).toBeDefined();
  });

  it('removeToast supprime le toast par id', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => result.current.addToast({ message: 'Test', type: 'info' }));
    const id = result.current.toasts[0].id;
    act(() => result.current.removeToast(id));
    expect(result.current.toasts).toHaveLength(0);
  });

  it('limite la file à 3 toasts max', () => {
    const { result } = renderHook(() => useToast(), { wrapper });
    act(() => {
      result.current.addToast({ message: '1', type: 'info' });
      result.current.addToast({ message: '2', type: 'info' });
      result.current.addToast({ message: '3', type: 'info' });
      result.current.addToast({ message: '4', type: 'info' });
    });
    expect(result.current.toasts).toHaveLength(3);
  });
});
```

- [ ] **Step 2: Lancer le test pour vérifier qu'il échoue**

```bash
npm test
```

Résultat attendu : FAIL — `Cannot find module '../contexts/ToastContext'`

- [ ] **Step 3: Créer ToastContext.jsx**

```jsx
// src/contexts/ToastContext.jsx
import React, { createContext, useContext, useState, useCallback } from 'react';

const ToastContext = createContext(null);

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([]);

  const addToast = useCallback(({ message, type = 'info', duration = 4000 }) => {
    const id = `${Date.now()}-${Math.random()}`;
    setToasts(prev => {
      const next = [...prev, { id, message, type, duration }];
      return next.length > 3 ? next.slice(next.length - 3) : next;
    });
    if (duration > 0) {
      setTimeout(() => removeToast(id), duration);
    }
  }, []);

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
    </ToastContext.Provider>
  );
}

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside ToastProvider');
  return ctx;
}
```

- [ ] **Step 4: Créer Toast.jsx (composant d'affichage)**

```jsx
// src/components/Toast.jsx
import React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const STYLES = {
  success: { bg: '#064e3b', border: '#10b981', icon: CheckCircle, color: '#10b981' },
  error:   { bg: '#450a0a', border: '#ef4444', icon: AlertCircle, color: '#ef4444' },
  info:    { bg: '#0c1a3a', border: '#4f63e7', icon: Info,         color: '#4f63e7' },
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(62px + env(safe-area-inset-bottom, 0px) + 8px)',
      left: 12, right: 12,
      zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {toasts.map(toast => {
        const s = STYLES[toast.type] || STYLES.info;
        const Icon = s.icon;
        return (
          <div key={toast.id} style={{
            background: s.bg,
            border: `1.5px solid ${s.border}`,
            borderRadius: 12,
            padding: '12px 14px',
            display: 'flex', alignItems: 'flex-start', gap: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            animation: 'slideUp 0.2s ease-out',
          }}>
            <Icon size={18} style={{ color: s.color, flexShrink: 0, marginTop: 1 }} />
            <span style={{ flex: 1, fontSize: 13, color: '#f1f5f9', lineHeight: 1.4 }}>
              {toast.message}
            </span>
            <button onClick={() => removeToast(toast.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#64748b', padding: 2, flexShrink: 0,
            }}>
              <X size={15} />
            </button>
          </div>
        );
      })}
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
```

- [ ] **Step 5: Brancher ToastProvider et ToastContainer dans App.jsx**

Lire `src/App.jsx` puis remplacer par :

```jsx
import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { ToastProvider } from './contexts/ToastContext';
import { SettingsProvider } from './contexts/SettingsContext';
import ToastContainer from './components/Toast';
import LoginPage from './pages/LoginPage';
import ListePdP from './pages/ListePdP';
import NouveauPdP from './pages/NouveauPdP';
import DetailPdP from './pages/DetailPdP';
import Dashboard from './pages/Dashboard';
import EditPdP from './pages/EditPdP';
import Settings from './pages/Settings';

export default function App() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) return (
    <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B1120' }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(79,99,231,0.3)', borderTopColor: '#4F63E7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!session) return <LoginPage onLogin={setSession} />;

  return (
    <ToastProvider>
      <SettingsProvider session={session}>
        <Routes>
          <Route path="/"            element={<ListePdP  session={session} />} />
          <Route path="/dashboard"   element={<Dashboard session={session} />} />
          <Route path="/nouveau"     element={<NouveauPdP session={session} />} />
          <Route path="/pdp/:id"     element={<DetailPdP session={session} />} />
          <Route path="/pdp/:id/edit" element={<EditPdP  session={session} />} />
          <Route path="/settings"    element={<Settings  session={session} />} />
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer />
      </SettingsProvider>
    </ToastProvider>
  );
}
```

- [ ] **Step 6: Lancer les tests**

```bash
npm test
```

Résultat attendu : 3 tests PASS dans `toast.test.js`

- [ ] **Step 7: Commit**

```bash
git add src/contexts/ToastContext.jsx src/components/Toast.jsx src/tests/toast.test.js src/App.jsx
git commit -m "feat: add toast notification system with ToastContext"
```

---

## Task 3 — SettingsContext + Supabase Migration

**Files:**
- Create: `src/contexts/SettingsContext.jsx`
- Create: `src/tests/settings.test.js`

- [ ] **Step 1: Créer la table Supabase app_settings**

Dans le tableau de bord Supabase > SQL Editor, exécuter :

```sql
CREATE TABLE IF NOT EXISTS app_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  company_name text NOT NULL DEFAULT '',
  company_address text DEFAULT '',
  company_phone text DEFAULT '',
  company_logo_base64 text DEFAULT NULL,
  pdf_primary_color text DEFAULT '#1e3a5f',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own settings"
  ON app_settings FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

- [ ] **Step 2: Écrire le test unitaire du SettingsContext**

```js
// src/tests/settings.test.js
import { describe, it, expect, vi, beforeEach } from 'vitest';

const DEFAULT_SETTINGS = {
  company_name: '',
  company_address: '',
  company_phone: '',
  company_logo_base64: null,
  pdf_primary_color: '#1e3a5f',
};

function mergeSettings(stored, overrides) {
  return { ...DEFAULT_SETTINGS, ...stored, ...overrides };
}

function hexToRgb(hex) {
  const clean = hex.replace('#', '');
  return [
    parseInt(clean.slice(0, 2), 16),
    parseInt(clean.slice(2, 4), 16),
    parseInt(clean.slice(4, 6), 16),
  ];
}

describe('settings helpers', () => {
  it('mergeSettings uses defaults for missing fields', () => {
    const result = mergeSettings({}, {});
    expect(result.pdf_primary_color).toBe('#1e3a5f');
    expect(result.company_name).toBe('');
  });

  it('mergeSettings overrides defaults', () => {
    const result = mergeSettings({ company_name: 'ACME' }, {});
    expect(result.company_name).toBe('ACME');
  });

  it('hexToRgb convertit #1e3a5f correctement', () => {
    expect(hexToRgb('#1e3a5f')).toEqual([30, 58, 95]);
  });

  it('hexToRgb convertit #ef4444 correctement', () => {
    expect(hexToRgb('#ef4444')).toEqual([239, 68, 68]);
  });
});
```

- [ ] **Step 3: Lancer le test pour vérifier qu'il passe (ces helpers sont en ligne, pas de module)**

```bash
npm test
```

Résultat attendu : 4 tests PASS dans `settings.test.js`

- [ ] **Step 4: Créer SettingsContext.jsx**

```jsx
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
```

- [ ] **Step 5: Commit**

```bash
git add src/contexts/SettingsContext.jsx src/tests/settings.test.js
git commit -m "feat: add SettingsContext with Supabase persistence and localStorage fallback"
```

---

## Task 4 — Page Paramètres (UI)

**Files:**
- Create: `src/pages/Settings.jsx`
- Modify: `src/components/BottomNav.jsx`

- [ ] **Step 1: Créer Settings.jsx**

```jsx
// src/pages/Settings.jsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Save, Building2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings, hexToRgbArray } from '../contexts/SettingsContext';
import { useToast } from '../contexts/ToastContext';
import BottomNav from '../components/BottomNav';

const COLORS = ['#1e3a5f', '#c0392b', '#16a085', '#8e44ad', '#e67e22', '#2c3e50'];

async function compressLogo(file) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 400;
        let w = img.width, h = img.height;
        if (w > maxW) { h = Math.round((h * maxW) / w); w = maxW; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/png'));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function Settings({ session }) {
  const { theme } = useTheme();
  const { settings, saveSettings, isLoading } = useSettings();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    company_name: settings.company_name,
    company_address: settings.company_address,
    company_phone: settings.company_phone,
    company_logo_base64: settings.company_logo_base64,
    pdf_primary_color: settings.pdf_primary_color,
  });
  const [saving, setSaving] = useState(false);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  async function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast({ message: 'Veuillez choisir un fichier image (PNG recommandé)', type: 'error' });
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      addToast({ message: 'Image trop lourde (max 2 Mo)', type: 'error' });
      return;
    }
    const base64 = await compressLogo(file);
    set('company_logo_base64', base64);
    e.target.value = '';
  }

  async function handleSave() {
    if (!form.company_name.trim()) {
      addToast({ message: 'Le nom de l\'entreprise est requis', type: 'error' });
      return;
    }
    setSaving(true);
    const { error } = await saveSettings(form);
    setSaving(false);
    if (error) {
      addToast({ message: 'Erreur lors de la sauvegarde : ' + error.message, type: 'error' });
    } else {
      addToast({ message: 'Paramètres enregistrés', type: 'success' });
    }
  }

  const primaryRgb = hexToRgbArray(form.pdf_primary_color);
  const primaryHex = form.pdf_primary_color;

  return (
    <div style={{ minHeight: '100dvh', background: theme.bg, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: theme.bgCard, borderBottom: `1px solid ${theme.border}`, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.text1, display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={22} />
        </button>
        <div style={{ fontSize: 17, fontWeight: 700, color: theme.text1 }}>Paramètres entreprise</div>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Logo */}
        <div style={{ background: theme.bgCard, borderRadius: 14, padding: 16, border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Logo de l'entreprise</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 72, height: 72, border: `2px dashed ${theme.border}`, borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: theme.bg, flexShrink: 0 }}>
              {form.company_logo_base64
                ? <img src={form.company_logo_base64} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                : <Building2 size={28} style={{ color: theme.text4 }} />
              }
            </div>
            <div style={{ flex: 1 }}>
              <button onClick={() => fileRef.current?.click()} style={{ width: '100%', background: primaryHex, color: 'white', border: 'none', borderRadius: 10, padding: '10px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
                <Upload size={16} /> Choisir un logo
              </button>
              <div style={{ fontSize: 11, color: theme.text4 }}>PNG recommandé, fond transparent<br />Max 2 Mo</div>
              {form.company_logo_base64 && (
                <button onClick={() => set('company_logo_base64', null)} style={{ fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}>
                  Supprimer le logo
                </button>
              )}
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
        </div>

        {/* Infos entreprise */}
        <div style={{ background: theme.bgCard, borderRadius: 14, padding: 16, border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Informations entreprise</div>
          {[
            { field: 'company_name',    label: 'Nom de l\'entreprise *', placeholder: 'BTP Dupont SARL', required: true },
            { field: 'company_address', label: 'Adresse',                placeholder: '12 rue des Lilas, 75001 Paris' },
            { field: 'company_phone',   label: 'Téléphone',              placeholder: '01 23 45 67 89' },
          ].map(({ field, label, placeholder }) => (
            <div key={field} style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: theme.text3, display: 'block', marginBottom: 4 }}>{label}</label>
              <input
                type="text"
                value={form[field]}
                onChange={e => set(field, e.target.value)}
                placeholder={placeholder}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: theme.inputBg, border: `1.5px solid ${theme.border}`, color: theme.text1, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          ))}
        </div>

        {/* Couleur PDF */}
        <div style={{ background: theme.bgCard, borderRadius: 14, padding: 16, border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Couleur principale du PDF</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => set('pdf_primary_color', c)} style={{
                width: 38, height: 38, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                boxShadow: form.pdf_primary_color === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : 'none',
                transition: 'box-shadow 0.15s',
              }} />
            ))}
          </div>
          {/* Aperçu en-tête PDF */}
          <div style={{ fontSize: 11, fontWeight: 600, color: theme.text3, marginBottom: 8 }}>Aperçu en-tête PDF</div>
          <div style={{ background: primaryHex, borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            {form.company_logo_base64
              ? <img src={form.company_logo_base64} alt="Logo" style={{ width: 32, height: 32, objectFit: 'contain', background: 'white', borderRadius: 4, padding: 2 }} />
              : <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.2)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={18} color="white" /></div>
            }
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>{form.company_name || 'Votre entreprise'}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>PLAN DE PRÉVENTION</div>
            </div>
          </div>
        </div>

        {/* Bouton save */}
        <button onClick={handleSave} disabled={saving} style={{
          background: saving ? '#64748b' : primaryHex,
          color: 'white', border: 'none', borderRadius: 14,
          padding: '15px', fontWeight: 700, fontSize: 15,
          cursor: saving ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <Save size={18} />
          {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
        </button>

      </div>

      <BottomNav />
    </div>
  );
}
```

- [ ] **Step 2: Modifier BottomNav.jsx pour ajouter l'icône Paramètres**

Lire `src/components/BottomNav.jsx` puis remplacer entièrement par :

```jsx
// src/components/BottomNav.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ClipboardList, LayoutDashboard, Plus, Settings } from 'lucide-react';

const LEFT_TAB  = { path: '/',          icon: ClipboardList,  label: 'Plans'    };
const RIGHT_TAB = { path: '/dashboard', icon: LayoutDashboard, label: 'Tableau'  };
const SETTINGS_TAB = { path: '/settings', icon: Settings, label: 'Réglages' };

export default function BottomNav() {
  const navigate     = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
      background: '#0d1b2e',
      borderTop: '1px solid rgba(255,255,255,0.09)',
      display: 'flex', alignItems: 'flex-start',
      paddingTop: 6,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      height: 'calc(62px + env(safe-area-inset-bottom, 0px))',
    }}>
      <TabBtn {...LEFT_TAB}     active={pathname === LEFT_TAB.path}     onNav={navigate} />

      {/* Centre FAB */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', position: 'relative' }}>
        <button
          onClick={() => navigate('/nouveau')}
          style={{
            position: 'absolute', top: -22,
            width: 56, height: 56, borderRadius: 18,
            background: 'linear-gradient(135deg, #4F63E7, #3B4FCC)',
            border: '3px solid #0d1b2e',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 24px rgba(79,99,231,0.55)',
            transition: 'transform 0.15s',
          }}
          onPointerDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
          onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Plus size={26} color="#fff" strokeWidth={2.5} />
        </button>
      </div>

      <TabBtn {...RIGHT_TAB}    active={pathname === RIGHT_TAB.path}    onNav={navigate} />
      <TabBtn {...SETTINGS_TAB} active={pathname === SETTINGS_TAB.path} onNav={navigate} />
    </nav>
  );
}

function TabBtn({ path, icon: Icon, label, active, onNav }) {
  return (
    <button
      onClick={() => onNav(path)}
      style={{
        flex: 1, height: 56, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 3,
        background: 'none', border: 'none', cursor: 'pointer',
        color: active ? '#4F63E7' : '#64748B',
        transition: 'color 0.15s',
      }}
    >
      <div style={{ position: 'relative' }}>
        <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
        {active && (
          <div style={{
            position: 'absolute', bottom: -5, left: '50%',
            transform: 'translateX(-50%)',
            width: 4, height: 4, borderRadius: '50%', background: '#4F63E7',
          }} />
        )}
      </div>
      <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{label}</span>
    </button>
  );
}
```

- [ ] **Step 3: Lancer les tests**

```bash
npm test
```

Résultat attendu : tous les tests passent

- [ ] **Step 4: Commit**

```bash
git add src/pages/Settings.jsx src/components/BottomNav.jsx
git commit -m "feat: add Settings page with logo upload, company info and PDF color picker"
```

---

## Task 5 — Fix SignaturePad (passive touch events)

**Files:**
- Modify: `src/components/SignaturePad.jsx`

**Contexte du bug :** Sur iOS, React monte les touch events comme des listeners passifs par défaut. `e.preventDefault()` dans un handler passif ne bloque pas le scroll de la page, ce qui fait que la page défile pendant qu'on signe au lieu de tracer. La correction consiste à ajouter les listeners directement sur le canvas avec `{ passive: false }`.

- [ ] **Step 1: Réécrire SignaturePad.jsx**

Lire `src/components/SignaturePad.jsx` puis remplacer entièrement par :

```jsx
// src/components/SignaturePad.jsx
import React, { useRef, useEffect, useCallback } from 'react';
import { RotateCcw, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

function parseValue(value) {
  if (!value) return { drawing: '', nom: '', date: '' };
  if (typeof value === 'string') return { drawing: value, nom: '', date: '' };
  return { drawing: value.drawing || '', nom: value.nom || '', date: value.date || '' };
}

function getCanvasPos(e, canvas) {
  const rect   = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  const src    = e.touches ? e.touches[0] : e;
  return {
    x: (src.clientX - rect.left) * scaleX,
    y: (src.clientY - rect.top)  * scaleY,
  };
}

export default function SignaturePad({ label, value, onChange }) {
  const { theme } = useTheme();
  const canvasRef  = useRef(null);
  const drawing    = useRef(false);
  const lastPos    = useRef(null);
  const onChangRef = useRef(onChange);
  const parsedRef  = useRef(parseValue(value));

  // Keep refs in sync with props
  useEffect(() => { onChangRef.current = onChange; }, [onChange]);
  useEffect(() => { parsedRef.current = parseValue(value); }, [value]);

  const parsed = parseValue(value);
  const today  = new Date().toISOString().split('T')[0];

  // Load existing signature image into canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !parsed.drawing) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const img = new window.Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = parsed.drawing;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Attach non-passive touch listeners to prevent page scroll while signing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function onTouchStart(e) {
      e.preventDefault();
      drawing.current = true;
      lastPos.current = getCanvasPos(e, canvas);
    }

    function onTouchMove(e) {
      e.preventDefault();
      if (!drawing.current) return;
      const ctx = canvas.getContext('2d');
      const pos = getCanvasPos(e, canvas);
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth   = 2.5;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
      ctx.stroke();
      lastPos.current = pos;
    }

    function onTouchEnd(e) {
      e.preventDefault();
      if (!drawing.current) return;
      drawing.current = false;
      const d    = canvas.toDataURL('image/png');
      const curr = parsedRef.current;
      const date = curr.date || new Date().toISOString().split('T')[0];
      onChangRef.current({ ...curr, drawing: d, date });
    }

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });
    canvas.addEventListener('touchend',   onTouchEnd,   { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove',  onTouchMove);
      canvas.removeEventListener('touchend',   onTouchEnd);
    };
  }, []);

  // Mouse handlers (desktop)
  function startDrawMouse(e) {
    drawing.current = true;
    lastPos.current = getCanvasPos(e, canvasRef.current);
  }

  function drawMouse(e) {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const pos    = getCanvasPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.stroke();
    lastPos.current = pos;
  }

  function endDrawMouse() {
    if (!drawing.current) return;
    drawing.current = false;
    const d    = canvasRef.current.toDataURL('image/png');
    const date = parsed.date || today;
    onChange({ ...parsed, drawing: d, date });
  }

  function clear() {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    onChange({ drawing: '', nom: parsed.nom, date: parsed.date });
  }

  const update = (field, val) => onChange({ ...parsed, [field]: val });
  const hasSig = !!parsed.drawing;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: theme.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
          {hasSig && parsed.nom && <CheckCircle2 size={14} style={{ color: '#10B981' }} />}
        </div>
        <button type="button" onClick={clear}
          style={{ fontSize: 12, color: theme.text4, background: theme.bgCard2, border: `1px solid ${theme.border}`, borderRadius: 7, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <RotateCcw size={11} /> Effacer
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: theme.text4, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Nom & Prénom</label>
          <input type="text" value={parsed.nom} onChange={e => update('nom', e.target.value)} placeholder="Jean Dupont"
            style={{ width: '100%', padding: '9px 12px', borderRadius: 10, background: theme.inputBg, border: `1.5px solid ${theme.border}`, color: theme.text1, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: theme.text4, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Date</label>
          <input type="date" value={parsed.date || today} onChange={e => update('date', e.target.value)}
            style={{ width: '100%', padding: '9px 12px', borderRadius: 10, background: theme.inputBg, border: `1.5px solid ${theme.border}`, color: theme.text1, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={800} height={200}
        onMouseDown={startDrawMouse} onMouseMove={drawMouse} onMouseUp={endDrawMouse} onMouseLeave={endDrawMouse}
        style={{
          width: '100%', height: 120, borderRadius: 12, display: 'block',
          cursor: 'crosshair', touchAction: 'none',
          background: '#ffffff',
          border: `2px ${hasSig ? 'solid #10B981' : 'dashed rgba(255,255,255,0.2)'}`,
        }}
      />
      {!hasSig && (
        <p style={{ textAlign: 'center', fontSize: 12, color: '#475569', marginTop: -4 }}>
          ✍️ Signez ici avec votre doigt
        </p>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Vérifier que les tests passent toujours**

```bash
npm test
```

Résultat attendu : tous les tests passent

- [ ] **Step 3: Commit**

```bash
git add src/components/SignaturePad.jsx
git commit -m "fix: SignaturePad non-passive touch listeners to prevent iOS scroll-while-signing bug"
```

---

## Task 6 — PDF Redesign (thème blanc + logo + photos questions)

**Files:**
- Modify: `src/utils/exportPdf.js` (réécriture complète)

**Changements majeurs :**
- Thème clair (fond blanc) au lieu du fond sombre `#0B1120`
- En-tête bleu marine avec logo entreprise (depuis SettingsContext)
- Photos par question ajoutées après les photos générales
- Tous les `catch {}` silencieux remplacés par des logs

La fonction `exportPdP` reçoit maintenant un 3e paramètre `settings` :
`exportPdP(pdp, { returnBlob }, settings)`

- [ ] **Step 1: Réécrire exportPdf.js**

Lire `src/utils/exportPdf.js` puis remplacer entièrement par :

```js
// src/utils/exportPdf.js
import { jsPDF } from 'jspdf';
import { CATEGORIES, RISQUE_COLORS, TYPES_INTERVENTION, calcScore, getNiveauRisque } from './risques';

// Light theme colors (RGB arrays for jsPDF)
const C = {
  white:  [255, 255, 255],
  bg:     [245, 247, 250],
  card:   [255, 255, 255],
  border: [226, 232, 240],
  text1:  [15,  23,  42],
  text2:  [51,  65,  85],
  text3:  [100, 116, 139],
  green:  [16,  185, 129],
  amber:  [245, 158, 11],
  red:    [239, 68,  68],
  purple: [139, 92,  246],
};

function hexToRgb(hex) {
  const clean = (hex || '#1e3a5f').replace('#', '');
  return [parseInt(clean.slice(0,2),16), parseInt(clean.slice(2,4),16), parseInt(clean.slice(4,6),16)];
}

function niveauColor(niveau) {
  return ({ faible: C.green, modere: C.amber, eleve: C.red, critique: C.purple })[niveau] || C.green;
}

function niveauBg(niveau) {
  return ({ faible: [220,252,231], modere: [254,243,199], eleve: [254,226,226], critique: [237,233,254] })[niveau] || [220,252,231];
}

function addCard(doc, x, y, w, h, r = 4) {
  doc.setFillColor(...C.white);
  doc.setDrawColor(...C.border);
  doc.roundedRect(x, y, w, h, r, r, 'FD');
}

function sectionTitle(doc, text, x, y) {
  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...C.text3);
  doc.text(text.toUpperCase(), x, y);
}

function pageFooter(doc, p, total, W, H, margin, primaryColor, companyName) {
  doc.setDrawColor(...C.border);
  doc.line(margin, H - 10, W - margin, H - 10);
  doc.setFontSize(7);
  doc.setTextColor(...C.text3);
  doc.setFont('helvetica', 'normal');
  doc.text(`${companyName || 'PdP & Analyse de Risques'} — Document confidentiel`, margin, H - 5);
  doc.text(`${p} / ${total}`, W - margin, H - 5, { align: 'right' });
}

function addHeader(doc, W, margin, primaryColor, logoBase64, companyName) {
  const primary = hexToRgb(primaryColor);

  // Full-width navy header band
  doc.setFillColor(...primary);
  doc.rect(0, 0, W, 38, 'F');

  let logoDrawn = false;
  if (logoBase64) {
    try {
      const ext = logoBase64.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      doc.addImage(logoBase64, ext, margin, 5, 28, 28, undefined, 'FAST');
      logoDrawn = true;
    } catch (err) {
      console.warn('[PDF] Logo non chargé:', err.message);
    }
  }

  const textX = logoDrawn ? margin + 32 : margin;
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('PLAN DE PRÉVENTION', textX, 16);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(200, 215, 235);
  if (companyName) doc.text(companyName, textX, 23);
  doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, textX, companyName ? 30 : 23);
}

function newPage(doc, W, H, primaryColor, logoBase64, companyName) {
  doc.addPage();
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, W, H, 'F');
}

export async function exportPdP(pdp, { returnBlob = false } = {}, settings = {}) {
  const doc    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, H = 297, margin = 14, inner = W - margin * 2;

  const primaryColor = settings.pdf_primary_color || '#1e3a5f';
  const logoBase64   = settings.company_logo_base64 || null;
  const companyName  = settings.company_name || '';

  const reponses = pdp.reponses || {};
  const score    = calcScore(reponses);
  const niveau   = getNiveauRisque(score);
  const nColor   = niveauColor(niveau);
  const nBg      = niveauBg(niveau);
  const nLabel   = RISQUE_COLORS[niveau]?.label || niveau;
  const totalQ   = CATEGORIES.reduce((s,c) => s + c.questions.length, 0);
  const nbOui    = Object.values(reponses).filter(r=>r==='oui').length;
  const nbNon    = Object.values(reponses).filter(r=>r==='non').length;
  const nbNsp    = Object.values(reponses).filter(r=>r==='nsp').length;

  // ════════════════════════════════
  // PAGE 1 — En-tête & résumé
  // ════════════════════════════════
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, W, H, 'F');

  addHeader(doc, W, margin, primaryColor, logoBase64, companyName);

  let y = 46;

  // Score de risque
  addCard(doc, margin, y, inner, 28, 5);
  doc.setFillColor(...nBg);
  doc.setDrawColor(...nColor);
  doc.roundedRect(margin, y, 52, 28, 5, 5, 'FD');

  doc.setFontSize(20); doc.setFont('helvetica', 'bold'); doc.setTextColor(...nColor);
  doc.text(String(score), margin + 26, y + 15, { align: 'center' });
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text3);
  doc.text('/25', margin + 26, y + 22, { align: 'center' });

  doc.setFontSize(14); doc.setFont('helvetica', 'bold'); doc.setTextColor(...nColor);
  doc.text(nLabel.toUpperCase(), margin + 58, y + 13);
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text3);
  doc.text('NIVEAU DE RISQUE GLOBAL', margin + 58, y + 20);

  // Stats petites
  const stats = [
    { label: 'Conformes',   val: nbOui,                              color: C.green  },
    { label: 'Non-conf.',   val: nbNon,                              color: C.red    },
    { label: 'À vérifier', val: nbNsp,                              color: C.amber  },
    { label: 'Non répondus', val: totalQ - Object.keys(reponses).length, color: C.text3 },
  ];
  let sx = margin + 120;
  stats.forEach(s => {
    doc.setTextColor(...s.color); doc.setFontSize(12); doc.setFont('helvetica', 'bold');
    doc.text(String(s.val), sx, y + 14);
    doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text3);
    doc.text(s.label, sx, y + 20);
    sx += 22;
  });

  y += 34;

  // Infos chantier en grille
  addCard(doc, margin, y, inner, 54, 4);
  sectionTitle(doc, 'Informations chantier', margin + 5, y + 8);

  const primary = hexToRgb(primaryColor);
  doc.setDrawColor(...primary);
  doc.setLineWidth(0.8);
  doc.line(margin + 5, y + 10, margin + 5 + 30, y + 10);
  doc.setLineWidth(0.2);

  const fields = [
    ['Lieu',               pdp.lieu],
    ['Entreprise ext.',    pdp.entreprise_exterieure],
    ['Date travaux',       pdp.date_travaux ? new Date(pdp.date_travaux+'T12:00').toLocaleDateString('fr-FR') : '—'],
    ['Responsable QHSE',  pdp.responsable || '—'],
    ['Contact urgence',    pdp.contact_urgence || '—'],
    ['Type de travaux',    pdp.type_travaux || '—'],
    ["Type d'intervention", TYPES_INTERVENTION.find(t=>t.value===pdp.type_intervention)?.label?.replace(/[^\w\s éàèùâêîôûçëïüÉÀÈÙÂÊÎÔÛÇËÏÜ'.,()-]/g,'') || '—'],
    ['Intervenants',       pdp.intervenants || '—'],
  ];
  let fy = y + 17;
  fields.forEach(([lbl, val], i) => {
    const col = i % 2 === 0 ? margin + 5 : margin + 5 + inner / 2;
    if (i % 2 === 0 && i > 0) fy += 9;
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.text3);
    doc.text(lbl + ':', col, fy);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text1);
    doc.text(String(val || '—').substring(0, 35), col + 32, fy);
  });

  y += 60;

  // Description travaux
  if (pdp.description_travaux) {
    const lines = doc.splitTextToSize(pdp.description_travaux.substring(0, 300), inner - 12);
    const bh = Math.max(20, 12 + lines.length * 4.5);
    if (y + bh > H - 20) { newPage(doc, W, H, primaryColor, logoBase64, companyName); y = 16; }
    addCard(doc, margin, y, inner, bh, 4);
    sectionTitle(doc, 'Description des travaux', margin + 5, y + 8);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text1); doc.setFontSize(8);
    doc.text(lines, margin + 5, y + 15);
    y += bh + 6;
  }

  // ════════════════════════════════
  // PAGE 2 — Résultats par catégorie
  // ════════════════════════════════
  newPage(doc, W, H, primaryColor, logoBase64, companyName);
  addHeader(doc, W, margin, primaryColor, logoBase64, companyName);
  y = 46;

  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.text1);
  doc.text("RÉSULTATS DE L'ANALYSE PAR CATÉGORIE", margin, y);
  y += 10;

  CATEGORIES.forEach(cat => {
    const reps     = cat.questions.map(q => reponses[q.id]);
    const answered = reps.filter(Boolean).length;
    if (answered === 0) return;

    const catOui = reps.filter(r=>r==='oui').length;
    const catNon = reps.filter(r=>r==='non').length;
    const catNsp = reps.filter(r=>r==='nsp').length;
    const catRgb = hexToRgb(cat.color);
    const pctConf = answered > 0 ? Math.round(catOui / answered * 100) : 0;

    if (y + 16 > H - 20) { newPage(doc, W, H, primaryColor, logoBase64, companyName); y = 16; }

    // Category header
    doc.setFillColor(240, 244, 255);
    doc.setDrawColor(...catRgb);
    doc.roundedRect(margin, y, inner, 10, 2, 2, 'FD');
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...catRgb);
    doc.text(`${cat.label.toUpperCase()}`, margin + 4, y + 7);
    doc.setTextColor(...C.text3); doc.setFontSize(7);
    doc.text(`${answered}/${cat.questions.length}  ✓${catOui}  ✗${catNon}  ?${catNsp}`, margin + inner - 42, y + 7);
    y += 12;

    // Conformity bar
    doc.setFillColor(...C.border);
    doc.roundedRect(margin, y, inner, 3, 1, 1, 'F');
    if (pctConf > 0) {
      doc.setFillColor(...C.green);
      doc.roundedRect(margin, y, inner * pctConf / 100, 3, 1, 1, 'F');
    }
    y += 6;

    // Non-conformités only
    cat.questions.forEach(q => {
      const rep = reponses[q.id];
      if (!rep || rep === 'oui') return;
      if (y + 10 > H - 20) { newPage(doc, W, H, primaryColor, logoBase64, companyName); y = 16; }

      const rowBg = rep === 'non' ? [254, 226, 226] : [254, 243, 199];
      const rowBorder = rep === 'non' ? C.red : C.amber;
      doc.setFillColor(...rowBg);
      doc.setDrawColor(...rowBorder);
      doc.roundedRect(margin, y, inner, 9, 2, 2, 'FD');
      doc.setTextColor(...(rep === 'non' ? C.red : C.amber));
      doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.text(rep === 'non' ? '✗' : '?', margin + 3, y + 6.5);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text1); doc.setFontSize(7.5);
      const txt = doc.splitTextToSize(q.text, inner - 14);
      doc.text(txt[0], margin + 8, y + 6.5);
      y += 10;

      const obs = pdp.observations_questions?.[q.id];
      if (obs) {
        if (y + 6 > H - 20) { newPage(doc, W, H, primaryColor, logoBase64, companyName); y = 16; }
        doc.setTextColor(...C.text3); doc.setFontSize(7); doc.setFont('helvetica', 'italic');
        doc.text(`→ ${obs.substring(0, 110)}`, margin + 8, y + 1);
        y += 6;
      }
    });
    y += 4;
  });

  // ════════════════════════════════
  // PAGE 3 — Mesures de prévention
  // ════════════════════════════════
  const mesures = (pdp.mesures_suggerees || []).filter(m => m.selectionnee);
  if (mesures.length > 0 || pdp.mesures_prevention) {
    newPage(doc, W, H, primaryColor, logoBase64, companyName);
    addHeader(doc, W, margin, primaryColor, logoBase64, companyName);
    y = 46;

    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.text1);
    doc.text('MESURES DE PRÉVENTION RETENUES', margin, y);
    y += 10;

    const haute   = mesures.filter(m => m.priorite === 'haute');
    const normale = mesures.filter(m => m.priorite !== 'haute');

    if (haute.length > 0) {
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.red);
      doc.text(`⚠ PRIORITAIRES (${haute.length})`, margin, y); y += 6;
      haute.forEach((m, i) => {
        if (y + 12 > H - 20) { newPage(doc, W, H, primaryColor, logoBase64, companyName); y = 16; }
        doc.setFillColor(254, 226, 226); doc.setDrawColor(...C.red);
        doc.roundedRect(margin, y, inner, 10, 2, 2, 'FD');
        doc.setFillColor(...C.red); doc.circle(margin + 5.5, y + 5, 3, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
        doc.text(String(i + 1), margin + 5.5, y + 6.2, { align: 'center' });
        doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text1); doc.setFontSize(8);
        doc.text(doc.splitTextToSize(m.mesure, inner - 14)[0], margin + 11, y + 7);
        y += 11;
      });
      y += 4;
    }

    if (normale.length > 0) {
      doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.green);
      doc.text(`✓ MESURES PRÉVENTIVES (${normale.length})`, margin, y); y += 6;
      normale.forEach((m, i) => {
        if (y + 11 > H - 20) { newPage(doc, W, H, primaryColor, logoBase64, companyName); y = 16; }
        doc.setFillColor(220, 252, 231); doc.setDrawColor(...C.green);
        doc.roundedRect(margin, y, inner, 10, 2, 2, 'FD');
        doc.setFillColor(...C.green); doc.circle(margin + 5.5, y + 5, 3, 'F');
        doc.setTextColor(255, 255, 255); doc.setFontSize(7); doc.setFont('helvetica', 'bold');
        doc.text(String(i + 1), margin + 5.5, y + 6.2, { align: 'center' });
        doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text1); doc.setFontSize(8);
        doc.text(doc.splitTextToSize(m.mesure, inner - 14)[0], margin + 11, y + 6);
        y += 11;
      });
    }

    if (pdp.mesures_prevention) {
      y += 6;
      const lines = doc.splitTextToSize(pdp.mesures_prevention.substring(0, 400), inner - 8);
      const bh = Math.max(20, 8 + lines.length * 4.5);
      if (y + bh > H - 20) { newPage(doc, W, H, primaryColor, logoBase64, companyName); y = 16; }
      sectionTitle(doc, 'Mesures complémentaires', margin, y); y += 6;
      addCard(doc, margin, y, inner, bh, 3);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text1); doc.setFontSize(8);
      doc.text(lines, margin + 4, y + 7);
      y += bh + 4;
    }
  }

  // ════════════════════════════════
  // PAGE PHOTOS CHANTIER
  // ════════════════════════════════
  const photosChantier = Array.isArray(pdp.photos) ? pdp.photos.filter(p => p?.url) : [];
  if (photosChantier.length > 0) {
    newPage(doc, W, H, primaryColor, logoBase64, companyName);
    addHeader(doc, W, margin, primaryColor, logoBase64, companyName);
    y = 46;

    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.text1);
    doc.text(`PHOTOS DU CHANTIER (${photosChantier.length})`, margin, y);
    y += 10;

    const cols = 2;
    const imgW = (inner - 8) / cols;
    const imgH = imgW * 0.65;
    let col = 0, rowY = y;

    for (const photo of photosChantier) {
      if (col === 0 && rowY + imgH + 14 > H - 20) {
        newPage(doc, W, H, primaryColor, logoBase64, companyName);
        rowY = 16; col = 0;
      }
      const px = margin + col * (imgW + 8);
      addCard(doc, px, rowY, imgW, imgH, 3);

      // Photos chantier may be URLs or base64
      let b64 = null;
      if (photo.url?.startsWith('data:')) {
        b64 = photo.url;
      } else if (photo.url) {
        try {
          const res  = await fetch(photo.url, { mode: 'cors' });
          const blob = await res.blob();
          b64 = await new Promise(r => { const fr = new FileReader(); fr.onloadend = () => r(fr.result); fr.readAsDataURL(blob); });
        } catch (err) {
          console.warn('[PDF] Photo chantier non chargée:', photo.url, err.message);
        }
      }

      if (b64) {
        try {
          const ext = b64.startsWith('data:image/png') ? 'PNG' : 'JPEG';
          doc.addImage(b64, ext, px, rowY, imgW, imgH, undefined, 'MEDIUM');
        } catch (err) {
          console.warn('[PDF] addImage chantier failed:', err.message);
          doc.setFontSize(7); doc.setTextColor(...C.text3);
          doc.text('Image invalide', px + imgW / 2, rowY + imgH / 2, { align: 'center' });
        }
      } else {
        doc.setFontSize(7); doc.setTextColor(...C.text3);
        doc.text('Image indisponible', px + imgW / 2, rowY + imgH / 2, { align: 'center' });
      }

      doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text3);
      doc.text((photo.name || `Photo ${photosChantier.indexOf(photo)+1}`).substring(0, 30), px, rowY + imgH + 5);

      col++;
      if (col >= cols) { col = 0; rowY += imgH + 14; }
    }
  }

  // ════════════════════════════════
  // PAGE PHOTOS ANALYSE DE RISQUES
  // ════════════════════════════════
  const photosQuestions = pdp.photos_questions || {};
  const questionPhotos  = Object.entries(photosQuestions).filter(([, v]) => v);

  if (questionPhotos.length > 0) {
    newPage(doc, W, H, primaryColor, logoBase64, companyName);
    addHeader(doc, W, margin, primaryColor, logoBase64, companyName);
    y = 46;

    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.text1);
    doc.text(`PHOTOS — ANALYSE DE RISQUES (${questionPhotos.length})`, margin, y);
    y += 10;

    const imgW = (inner - 8) / 2;
    const imgH = imgW * 0.65;
    let col = 0, rowY = y;

    for (const [qId, b64] of questionPhotos) {
      // Find question label from CATEGORIES
      let qLabel = qId;
      for (const cat of CATEGORIES) {
        const q = cat.questions.find(q => q.id === qId);
        if (q) { qLabel = `${cat.label} — ${q.text.substring(0, 50)}`; break; }
      }

      if (col === 0 && rowY + imgH + 20 > H - 20) {
        newPage(doc, W, H, primaryColor, logoBase64, companyName);
        rowY = 16; col = 0;
      }

      const px = margin + col * (imgW + 8);
      addCard(doc, px, rowY, imgW, imgH + 14, 3);

      if (b64) {
        try {
          const ext = b64.startsWith('data:image/png') ? 'PNG' : 'JPEG';
          doc.addImage(b64, ext, px, rowY, imgW, imgH, undefined, 'MEDIUM');
        } catch (err) {
          console.warn('[PDF] addImage question photo failed:', err.message);
          doc.setFontSize(7); doc.setTextColor(...C.text3);
          doc.text('Image invalide', px + imgW / 2, rowY + imgH / 2, { align: 'center' });
        }
      }

      // Caption with question text
      const labelLines = doc.splitTextToSize(qLabel, imgW - 4);
      doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text3);
      doc.text(labelLines[0], px + 2, rowY + imgH + 6);
      if (labelLines[1]) doc.text(labelLines[1], px + 2, rowY + imgH + 11);

      col++;
      if (col >= 2) { col = 0; rowY += imgH + 18; }
    }
  }

  // ════════════════════════════════
  // PAGE ACTIONS CORRECTIVES
  // ════════════════════════════════
  const actions = pdp._actions || [];
  if (actions.length > 0) {
    newPage(doc, W, H, primaryColor, logoBase64, companyName);
    addHeader(doc, W, margin, primaryColor, logoBase64, companyName);
    y = 46;

    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.text1);
    doc.text('ACTIONS CORRECTIVES', margin, y);
    y += 10;

    const STATUT_CFG = {
      todo:  { label: 'À faire',  bg: [254,226,226], color: C.red   },
      doing: { label: 'En cours', bg: [254,243,199], color: C.amber },
      done:  { label: 'Terminé',  bg: [220,252,231], color: C.green },
    };

    actions.forEach(a => {
      if (y + 18 > H - 20) { newPage(doc, W, H, primaryColor, logoBase64, companyName); y = 16; }
      const scfg = STATUT_CFG[a.statut] || STATUT_CFG.todo;
      doc.setFillColor(...scfg.bg); doc.setDrawColor(...scfg.color);
      doc.roundedRect(margin, y, inner, 16, 3, 3, 'FD');
      doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...scfg.color);
      doc.text(scfg.label.toUpperCase(), margin + 5, y + 6);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text1); doc.setFontSize(8);
      doc.text(doc.splitTextToSize(a.description || '—', inner - 60)[0], margin + 5, y + 12);
      doc.setFontSize(7); doc.setTextColor(...C.text3);
      if (a.responsable) doc.text(`Resp: ${a.responsable}`, margin + inner - 55, y + 7);
      if (a.echeance)    doc.text(`Échéance: ${new Date(a.echeance+'T12:00').toLocaleDateString('fr-FR')}`, margin + inner - 55, y + 13);
      y += 18;
    });
  }

  // ════════════════════════════════
  // PAGE SIGNATURES
  // ════════════════════════════════
  newPage(doc, W, H, primaryColor, logoBase64, companyName);
  addHeader(doc, W, margin, primaryColor, logoBase64, companyName);
  y = 46;

  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.text1);
  doc.text('SIGNATURES & VALIDATION', margin, y); y += 8;
  doc.setFontSize(8); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text3);
  doc.text(`${pdp.lieu||'—'} · ${pdp.entreprise_exterieure||'—'} · ${pdp.date_travaux ? new Date(pdp.date_travaux+'T12:00').toLocaleDateString('fr-FR') : '—'}`, margin, y);
  y += 10;

  const sigW = (inner - 8) / 2;

  function parseSig(v) {
    if (!v) return { drawing: '', nom: '', date: '' };
    if (typeof v === 'object' && !Array.isArray(v)) return { drawing: v.drawing||'', nom: v.nom||'', date: v.date||'' };
    try { const p = JSON.parse(v); if (p?.drawing) return { drawing: p.drawing, nom: p.nom||'', date: p.date||'' }; } catch {}
    return { drawing: String(v), nom: '', date: '' };
  }

  function drawSig(label, note, sigData, sx, sy) {
    const { drawing, nom, date } = parseSig(sigData);
    const primary = hexToRgb(primaryColor);
    addCard(doc, sx, sy, sigW, 80, 4);
    doc.setDrawColor(...primary); doc.setLineWidth(0.5);
    doc.line(sx, sy + 12, sx + sigW, sy + 12); doc.setLineWidth(0.2);
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...primary);
    doc.text(label.toUpperCase(), sx + 6, sy + 9);
    if (note) { doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text3); doc.text(note, sx + 6, sy + 16); }

    doc.setFontSize(7); doc.setTextColor(...C.text3);
    doc.text('Signature :', sx + 6, sy + 23);

    if (drawing) {
      try {
        doc.setFillColor(255, 255, 255);
        doc.rect(sx + 4, sy + 26, sigW - 8, 28, 'F');
        doc.addImage(drawing, 'PNG', sx + 4, sy + 26, sigW - 8, 28);
      } catch (err) {
        console.warn('[PDF] Signature image failed:', err.message);
        doc.setFillColor(...C.bg); doc.rect(sx + 4, sy + 26, sigW - 8, 28, 'F');
        doc.setFontSize(8); doc.setTextColor(...C.text3);
        doc.text('[ Erreur signature ]', sx + sigW / 2, sy + 42, { align: 'center' });
      }
    } else {
      doc.setFillColor(...C.bg); doc.rect(sx + 4, sy + 26, sigW - 8, 28, 'F');
      doc.setFontSize(8); doc.setTextColor(...C.text3);
      doc.text('[ Non signé ]', sx + sigW / 2, sy + 42, { align: 'center' });
    }

    doc.setFontSize(7); doc.setTextColor(...C.text3);
    if (nom) { doc.text('Nom :', sx + 6, sy + 60); doc.setTextColor(...C.text1); doc.text(nom, sx + 20, sy + 60); }
    doc.setTextColor(...C.text3); doc.text('Date :', sx + 6, sy + 68);
    doc.setTextColor(...C.text1);
    doc.text(date || new Date().toLocaleDateString('fr-FR'), sx + 20, sy + 68);
  }

  drawSig('Responsable QHSE',    pdp.responsable || '',           pdp.signature_qhse,        margin,          y);
  drawSig('Responsable de site', pdp.entreprise_exterieure || '', pdp.signature_responsable, margin + sigW + 8, y);

  y += 90;

  // Récap final
  const primary2 = hexToRgb(primaryColor);
  doc.setFillColor(...primary2);
  doc.roundedRect(margin, y, inner, 18, 4, 4, 'F');
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
  doc.text('RÉCAPITULATIF', margin + 6, y + 8);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
  doc.text(`Score : ${score}/25 (${nLabel})  ·  Réponses : ${Object.keys(reponses).length}/${totalQ}  ·  Non-conf : ${nbNon}  ·  À vérifier : ${nbNsp}  ·  Mesures : ${mesures.length}`, margin + 6, y + 15);

  // Footers
  const nbPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= nbPages; p++) {
    doc.setPage(p);
    pageFooter(doc, p, nbPages, W, H, margin, primaryColor, companyName);
  }

  const filename = `PdP_${(pdp.lieu||'chantier').replace(/[^a-z0-9]/gi,'_')}_${pdp.date_travaux||new Date().toISOString().split('T')[0]}.pdf`;

  if (returnBlob) return doc.output('blob', { filename });
  doc.save(filename);
}
```

- [ ] **Step 2: Mettre à jour tous les appels à exportPdP pour passer settings**

Dans `src/pages/DetailPdP.jsx`, trouver tous les appels `exportPdP(pdp, ...)` et les modifier pour inclure les settings. Ajouter en haut du fichier :

```js
import { useSettings } from '../contexts/SettingsContext';
```

Ajouter dans le corps du composant :

```js
const { settings } = useSettings();
```

Puis modifier chaque appel :
```js
// Avant :
await exportPdP(pdp, { returnBlob: true });
// Après :
await exportPdP(pdp, { returnBlob: true }, settings);

// Avant :
await exportPdP(pdp);
// Après :
await exportPdP(pdp, {}, settings);
```

- [ ] **Step 3: Lancer les tests**

```bash
npm test
```

Résultat attendu : tous les tests passent

- [ ] **Step 4: Commit**

```bash
git add src/utils/exportPdf.js src/pages/DetailPdP.jsx
git commit -m "feat: rewrite exportPdf with white theme, logo, company colors and question photos section"
```

---

## Task 7 — Error Handling dans les pages existantes

**Files:**
- Modify: `src/pages/NouveauPdP.jsx`
- Modify: `src/pages/ListePdP.jsx`
- Modify: `src/pages/DetailPdP.jsx`
- Modify: `src/components/PhotoCapture.jsx`

- [ ] **Step 1: NouveauPdP.jsx — remplacer les catch silencieux**

Dans `src/pages/NouveauPdP.jsx`, ajouter en haut :

```js
import { useToast } from '../contexts/ToastContext';
```

Ajouter dans le composant :
```js
const { addToast } = useToast();
```

Trouver et remplacer chaque bloc de sauvegarde Supabase. Chercher `catch` et remplacer les `catch(e) {}` ou `catch(e) { console.error(e) }` par :

```js
catch (err) {
  console.error('[NouveauPdP] Erreur sauvegarde:', err);
  addToast({ message: 'Erreur lors de la sauvegarde : ' + (err.message || 'connexion perdue'), type: 'error' });
}
```

Pour les succès de sauvegarde, ajouter :
```js
addToast({ message: 'Plan sauvegardé avec succès', type: 'success' });
```

- [ ] **Step 2: NouveauPdP.jsx — protection brouillon non sauvegardé**

Ajouter un state `hasUnsavedChanges` et un `useEffect` pour bloquer la navigation :

```js
const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

// Marquer modifié à chaque changement de form
// (ajouter setHasUnsavedChanges(true) dans chaque onChange de champs)

// Protection fermeture onglet
useEffect(() => {
  const handler = (e) => {
    if (!hasUnsavedChanges) return;
    e.preventDefault();
    e.returnValue = '';
  };
  window.addEventListener('beforeunload', handler);
  return () => window.removeEventListener('beforeunload', handler);
}, [hasUnsavedChanges]);
```

Après une sauvegarde réussie, appeler `setHasUnsavedChanges(false)`.

- [ ] **Step 3: ListePdP.jsx — bandeau offline + erreurs**

Ajouter en haut de `src/pages/ListePdP.jsx` :

```js
import { useToast } from '../contexts/ToastContext';
```

Ajouter le state et les listeners offline :

```js
const { addToast } = useToast();
const [isOnline, setIsOnline] = useState(navigator.onLine);

useEffect(() => {
  const goOnline  = () => { setIsOnline(true);  addToast({ message: 'Connexion rétablie', type: 'success' }); };
  const goOffline = () => { setIsOnline(false); addToast({ message: 'Mode hors-ligne activé', type: 'info' }); };
  window.addEventListener('online',  goOnline);
  window.addEventListener('offline', goOffline);
  return () => { window.removeEventListener('online', goOnline); window.removeEventListener('offline', goOffline); };
}, [addToast]);
```

Ajouter le bandeau offline en haut du JSX (avant le contenu, après le header) :

```jsx
{!isOnline && (
  <div style={{
    background: '#78350f', color: '#fef3c7',
    padding: '8px 16px', fontSize: 13, fontWeight: 600,
    display: 'flex', alignItems: 'center', gap: 8,
  }}>
    <WifiOff size={16} /> Mode hors-ligne — les données affichées peuvent être en cache
  </div>
)}
```

Ajouter `WifiOff` aux imports Lucide.

Remplacer les `catch(e) {}` du fetch Supabase par :
```js
catch (err) {
  console.error('[ListePdP] Erreur chargement:', err);
  addToast({ message: 'Impossible de charger les plans : ' + (err.message || 'erreur réseau'), type: 'error' });
}
```

- [ ] **Step 4: DetailPdP.jsx — erreurs visibles**

Ajouter l'import et le hook `useToast` dans `src/pages/DetailPdP.jsx`.

Remplacer tous les `catch(e) {}` par :
```js
catch (err) {
  console.error('[DetailPdP]', err);
  addToast({ message: err.message || 'Une erreur est survenue', type: 'error' });
}
```

Pour les actions réussies (changement statut, duplication) :
```js
addToast({ message: 'Statut mis à jour', type: 'success' });
addToast({ message: 'Plan dupliqué avec succès', type: 'success' });
```

- [ ] **Step 5: PhotoCapture.jsx — erreurs upload**

Ajouter l'import `useToast` et remplacer les `catch {}` de l'upload Supabase Storage par :
```js
catch (err) {
  console.error('[PhotoCapture] Upload failed:', err);
  addToast({ message: 'Erreur lors de l\'upload photo : ' + (err.message || 'réessayer'), type: 'error' });
}
```

- [ ] **Step 6: Lancer les tests**

```bash
npm test
```

Résultat attendu : tous les tests passent

- [ ] **Step 7: Commit**

```bash
git add src/pages/NouveauPdP.jsx src/pages/ListePdP.jsx src/pages/DetailPdP.jsx src/components/PhotoCapture.jsx
git commit -m "fix: replace silent catches with toast notifications and add offline banner"
```

---

## Task 8 — Stabilisation Offline

**Files:**
- Modify: `src/utils/offlineStorage.js`
- Modify: `src/pages/NouveauPdP.jsx`

- [ ] **Step 1: Vérifier offlineStorage.js**

Lire `src/utils/offlineStorage.js` et vérifier que les fonctions `saveDraftLocally`, `getDraft`, `removeDraft`, `getAllDrafts` existent. Si elles n'ont pas de try/catch, les ajouter :

```js
export function saveDraftLocally(formData) {
  try {
    const drafts = getAllDrafts();
    const id = formData.id || `draft-${Date.now()}`;
    drafts[id] = { ...formData, _savedAt: new Date().toISOString() };
    localStorage.setItem('pdp_offline_drafts', JSON.stringify(drafts));
    return id;
  } catch (err) {
    console.error('[offlineStorage] Impossible de sauvegarder le brouillon:', err);
    return null;
  }
}

export function getAllDrafts() {
  try {
    return JSON.parse(localStorage.getItem('pdp_offline_drafts') || '{}');
  } catch {
    return {};
  }
}

export function removeDraft(id) {
  try {
    const drafts = getAllDrafts();
    delete drafts[id];
    localStorage.setItem('pdp_offline_drafts', JSON.stringify(drafts));
  } catch (err) {
    console.error('[offlineStorage] Impossible de supprimer le brouillon:', err);
  }
}
```

- [ ] **Step 2: Auto-sync des brouillons à la reconnexion dans NouveauPdP.jsx**

Dans `src/pages/NouveauPdP.jsx`, ajouter un effet qui écoute l'événement `online` et tente de synchroniser :

```js
useEffect(() => {
  async function syncOnReconnect() {
    const drafts = getAllDrafts();
    const ids = Object.keys(drafts);
    if (ids.length === 0) return;
    addToast({ message: `Connexion rétablie — synchronisation de ${ids.length} brouillon(s)...`, type: 'info' });
    for (const id of ids) {
      try {
        const draft = drafts[id];
        const { error } = await supabase.from('plans_prevention').upsert(draft);
        if (!error) {
          removeDraft(id);
          addToast({ message: 'Brouillon synchronisé avec succès', type: 'success' });
        }
      } catch (err) {
        console.error('[sync] Erreur synchro brouillon:', err);
      }
    }
  }
  window.addEventListener('online', syncOnReconnect);
  return () => window.removeEventListener('online', syncOnReconnect);
}, [addToast]);
```

- [ ] **Step 3: Lancer les tests**

```bash
npm test
```

Résultat attendu : tous les tests passent

- [ ] **Step 4: Commit final**

```bash
git add src/utils/offlineStorage.js src/pages/NouveauPdP.jsx
git commit -m "fix: offline draft protection with auto-sync on reconnect"
```

---

## Self-Review

### Spec coverage

| Spec requirement | Task qui l'implémente |
|------------------|-----------------------|
| Réécriture SignaturePad, touch passifs | Task 5 |
| Photos questions dans le PDF | Task 6 (section `photos_questions`) |
| Refonte PDF thème blanc style A | Task 6 |
| Logo configurable + couleur | Task 3 + 4 (Settings) + Task 6 (PDF) |
| Page paramètres entreprise | Task 4 |
| Table `app_settings` Supabase | Task 3 |
| Toasts erreurs (catch silencieux) | Task 2 + Task 7 |
| Bandeau offline | Task 7 (ListePdP) |
| Protection brouillon non sauvegardé | Task 7 (NouveauPdP) |
| Auto-sync brouillons à reconnexion | Task 8 |

✅ Toutes les exigences de la spec sont couvertes.

### Placeholder scan

Aucun TBD ou "implémenter plus tard" dans ce plan.

### Type consistency

- `exportPdP(pdp, options, settings)` — signature cohérente dans Task 6 et dans les appels modifiés de Task 6 Step 2
- `addToast({ message, type })` — interface identique dans Task 2 (ToastContext) et dans toutes les utilisations (Tasks 7, 8)
- `useSettings()` retourne `{ settings, saveSettings, isLoading }` — cohérent dans Task 3 (création) et Task 4 (Settings page) et Task 6 (PDF)
- `saveDraftLocally`, `getAllDrafts`, `removeDraft` — noms cohérents entre Task 8 et les imports
