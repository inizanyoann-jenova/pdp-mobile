# PdP v2 Terrain Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transformer l'app PdP en outil industriel terrain : vraie PWA offline-first, mode haute-luminosité contraste maximal, photos avec légendes et queue IndexedDB, SignaturePad adaptatif, NouveauPdP décomposé.

**Architecture:** Sprint unique sur branche `feat/v2-terrain`. Chaque tâche = commit autonome qui build. Ordre : infrastructure PWA → Supabase → cleanup → thème → UX → refacto.

**Tech Stack:** React 18, Vite 5, vite-plugin-pwa 0.21, idb 8, Supabase JS 2, Tailwind 3, Vitest 4

---

## Fichiers créés / modifiés

| Fichier | Action |
|---|---|
| `public/manifest.json` | CREATE |
| `public/icon-192.png` + `icon-512.png` | CREATE (script) |
| `vite.config.js` | MODIFY (+ VitePWA) |
| `src/utils/photoQueue.js` | CREATE |
| `src/utils/offlineStorage.js` | MODIFY (cleanup API) |
| `supabase_migration.sql` | MODIFY (+ actions_correctives) |
| `src/contexts/ThemeContext.jsx` | MODIFY (+ TERRAIN) |
| `src/index.css` | MODIFY (+ terrain rules) |
| `src/components/SignaturePad.jsx` | MODIFY (DPR adaptatif) |
| `src/components/PhotoCapture.jsx` | MODIFY (Pro) |
| `src/hooks/useFormPdP.js` | CREATE |
| `src/hooks/useOfflineSync.js` | CREATE |
| `src/components/steps/StepInfos.jsx` | CREATE |
| `src/components/steps/StepPhotos.jsx` | CREATE |
| `src/components/steps/StepAnalyse.jsx` | CREATE |
| `src/components/steps/StepPrevention.jsx` | CREATE |
| `src/components/steps/StepSignatures.jsx` | CREATE |
| `src/pages/NouveauPdP.jsx` | MODIFY (orchestrateur ~120L) |
| `src/pages/Dashboard.jsx` | MODIFY (pagination + async stats) |
| `src/App.jsx` | MODIFY (migration localStorage) |
| `package.json` | MODIFY (+ vite-plugin-pwa, idb) |

---

## Task 1: Branche + PWA Manifest + Icons

**Files:**
- Create: `public/manifest.json`
- Create: `public/icon.svg`
- Modify: `package.json` (scripts)

- [ ] **Créer la branche**
```bash
git checkout -b feat/v2-terrain
```

- [ ] **Créer `public/icon.svg`**
```svg
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" fill="none">
  <rect width="512" height="512" rx="96" fill="#0B1120"/>
  <path d="M256 100 C180 100 120 155 110 230 L402 230 C392 155 332 100 256 100Z" fill="#FFCC00"/>
  <rect x="110" y="240" width="292" height="32" rx="8" fill="#4F63E7"/>
  <rect x="150" y="290" width="212" height="120" rx="12" fill="#152236" stroke="#4F63E7" stroke-width="4"/>
  <path d="M210 350 L245 385 L310 315" stroke="#10B981" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>
</svg>
```

- [ ] **Générer les PNG icons**
```bash
cd "c:/Users/Utilisateur/Desktop/toutes les app pour def/outils QHSE/pdp-risk-app"
npm install -D @vite-pwa/assets-generator
npx pwa-assets-generator --preset minimal-2023 public/icon.svg
```
Cela génère `public/icon-192.png`, `public/icon-512.png`, `public/apple-touch-icon-180x180.png`, `public/favicon.ico`.

- [ ] **Créer `public/manifest.json`**
```json
{
  "name": "PdP Terrain",
  "short_name": "PdP",
  "description": "Plans de Prévention — Terrain QHSE",
  "theme_color": "#0B1120",
  "background_color": "#0B1120",
  "display": "standalone",
  "orientation": "portrait",
  "start_url": "/",
  "scope": "/",
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" },
    { "src": "/apple-touch-icon-180x180.png", "sizes": "180x180", "type": "image/png" }
  ]
}
```

- [ ] **Vérifier que Vite sert le manifest**
```bash
npm run dev
# Ouvrir http://localhost:5174/manifest.json → doit retourner le JSON
```

- [ ] **Commit**
```bash
git add public/manifest.json public/icon.svg public/icon-192.png public/icon-512.png public/apple-touch-icon-180x180.png public/favicon.ico package.json package-lock.json
git commit -m "feat(pwa): add manifest.json and app icons"
```

---

## Task 2: vite-plugin-pwa + Service Worker

**Files:**
- Modify: `vite.config.js`
- Modify: `package.json`

- [ ] **Installer vite-plugin-pwa**
```bash
npm install -D vite-plugin-pwa@0.21
```

- [ ] **Mettre à jour `vite.config.js`**
```js
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon-180x180.png', 'icon.svg'],
      manifest: false, // on utilise notre propre public/manifest.json
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              networkTimeoutSeconds: 5,
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'supabase-storage',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
  server: { port: 5174, host: true },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './src/tests/setup.js',
  },
});
```

- [ ] **Vérifier le build**
```bash
npm run build
# Doit générer dist/sw.js et dist/workbox-*.js sans erreur
```

- [ ] **Vérifier l'enregistrement SW en preview**
```bash
npm run preview
# Ouvrir http://localhost:4173 → DevTools → Application → Service Workers → doit montrer sw.js actif
```

- [ ] **Commit**
```bash
git add vite.config.js package.json package-lock.json
git commit -m "feat(pwa): add Service Worker via vite-plugin-pwa + Workbox caching"
```

---

## Task 3: IndexedDB Photo Queue

**Files:**
- Create: `src/utils/photoQueue.js`
- Create: `src/tests/photoQueue.test.js`
- Modify: `package.json` (dev dep fake-indexeddb)

- [ ] **Installer les dépendances**
```bash
npm install idb@8
npm install -D fake-indexeddb@5
```

- [ ] **Écrire le test en premier** — `src/tests/photoQueue.test.js`
```js
import 'fake-indexeddb/auto';
import { describe, it, expect, beforeEach } from 'vitest';
import {
  addToPhotoQueue, getPendingUploads, removeFromQueue, countPendingUploads, clearPhotoQueue,
} from '../utils/photoQueue';

beforeEach(async () => { await clearPhotoQueue(); });

describe('photoQueue', () => {
  it('addToPhotoQueue returns an id and stores the entry', async () => {
    const blob = new Blob(['fake-image'], { type: 'image/jpeg' });
    const id = await addToPhotoQueue({ planId: 'plan-1', blob, fileName: 'test.jpg' });
    expect(typeof id).toBe('string');
    expect(id.startsWith('pq_')).toBe(true);
    const all = await getPendingUploads();
    expect(all).toHaveLength(1);
    expect(all[0].planId).toBe('plan-1');
    expect(all[0].blob).toBe(blob);
  });

  it('removeFromQueue deletes an entry', async () => {
    const blob = new Blob(['x'], { type: 'image/jpeg' });
    const id = await addToPhotoQueue({ planId: 'plan-2', blob, fileName: 'a.jpg' });
    await removeFromQueue(id);
    expect(await countPendingUploads()).toBe(0);
  });

  it('countPendingUploads reflects queue length', async () => {
    const blob = new Blob(['x'], { type: 'image/jpeg' });
    await addToPhotoQueue({ planId: 'p', blob, fileName: 'a.jpg' });
    await addToPhotoQueue({ planId: 'p', blob, fileName: 'b.jpg' });
    expect(await countPendingUploads()).toBe(2);
  });
});
```

- [ ] **Lancer le test — doit échouer**
```bash
npm test -- src/tests/photoQueue.test.js
# Expected: FAIL "Cannot find module '../utils/photoQueue'"
```

- [ ] **Créer `src/utils/photoQueue.js`**
```js
import { openDB } from 'idb';

const DB_NAME = 'pdp-photo-queue';
const DB_VERSION = 1;
const STORE = 'pending_uploads';

function getDB() {
  return openDB(DB_NAME, DB_VERSION, {
    upgrade(db) {
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'id' });
      }
    },
  });
}

export async function addToPhotoQueue({
  planId, blob, fileName,
  mimeType = 'image/jpeg',
  fieldType = 'photos',
  questionId = null,
}) {
  const db = await getDB();
  const id = `pq_${Date.now()}_${Math.random().toString(36).slice(2)}`;
  await db.put(STORE, { id, planId, blob, fileName, mimeType, fieldType, questionId, savedAt: new Date().toISOString() });
  return id;
}

export async function getPendingUploads() {
  return (await getDB()).getAll(STORE);
}

export async function removeFromQueue(id) {
  return (await getDB()).delete(STORE, id);
}

export async function countPendingUploads() {
  return (await getDB()).count(STORE);
}

export async function clearPhotoQueue() {
  return (await getDB()).clear(STORE);
}
```

- [ ] **Relancer les tests — doivent passer**
```bash
npm test -- src/tests/photoQueue.test.js
# Expected: PASS (3 tests)
```

- [ ] **Commit**
```bash
git add src/utils/photoQueue.js src/tests/photoQueue.test.js package.json package-lock.json
git commit -m "feat(offline): add IndexedDB photo queue with full test coverage"
```

---

## Task 4: Supabase — table actions_correctives

**Files:**
- Modify: `supabase_migration.sql`

> Note : `actionsService.js` appelle déjà Supabase — la table manque juste en base.

- [ ] **Ajouter le SQL à `supabase_migration.sql`** (à la fin du fichier)
```sql
-- 4. Table des actions correctives
-- ------------------------------------------------------------
CREATE TABLE IF NOT EXISTS actions_correctives (
  id           uuid        DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  plan_id      uuid        NOT NULL REFERENCES plans_prevention(id) ON DELETE CASCADE,
  description  text        NOT NULL,
  responsable  text,
  echeance     date,
  statut       text        DEFAULT 'todo' CHECK (statut IN ('todo', 'doing', 'done')),
  question_id  text,
  created_by   uuid        REFERENCES auth.users(id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS idx_actions_plan_id ON actions_correctives (plan_id);
CREATE INDEX IF NOT EXISTS idx_actions_statut  ON actions_correctives (statut);

ALTER TABLE actions_correctives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRUD ses propres actions" ON actions_correctives
  FOR ALL USING (auth.uid() = created_by);

CREATE TRIGGER trg_actions_updated_at
  BEFORE UPDATE ON actions_correctives
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

- [ ] **Appliquer la migration via Supabase MCP** — exécuter ce SQL dans l'éditeur Supabase SQL ou via MCP `execute_sql`.

- [ ] **Vérifier** : ouvrir Supabase → Table Editor → `actions_correctives` doit apparaître.

- [ ] **Commit**
```bash
git add supabase_migration.sql
git commit -m "feat(db): add actions_correctives table with RLS"
```

---

## Task 5: offlineStorage.js Cleanup

**Files:**
- Modify: `src/utils/offlineStorage.js`
- Modify: `src/pages/NouveauPdP.jsx` (import)

- [ ] **Écrire le test** — `src/tests/offlineStorage.test.js`
```js
import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage
const store = {};
global.localStorage = {
  getItem: (k) => store[k] ?? null,
  setItem: (k, v) => { store[k] = v; },
  removeItem: (k) => { delete store[k]; },
};

import { saveDraft, getAllDrafts, removeDraft, countDrafts } from '../utils/offlineStorage';

beforeEach(() => { Object.keys(store).forEach(k => delete store[k]); });

describe('offlineStorage', () => {
  it('saveDraft stores and getAllDrafts retrieves', () => {
    saveDraft({ lieu: 'Site A', statut: 'brouillon' });
    const drafts = getAllDrafts();
    expect(Object.keys(drafts)).toHaveLength(1);
    const [draft] = Object.values(drafts);
    expect(draft.lieu).toBe('Site A');
    expect(draft._offline).toBe(true);
  });

  it('removeDraft deletes an entry', () => {
    const id = saveDraft({ lieu: 'Site B' });
    removeDraft(id);
    expect(countDrafts()).toBe(0);
  });

  it('saveDraft with existing id preserves id', () => {
    saveDraft({ id: 'my-id', lieu: 'Site C' });
    const drafts = getAllDrafts();
    expect(drafts['my-id']).toBeDefined();
  });
});
```

- [ ] **Lancer — doit échouer**
```bash
npm test -- src/tests/offlineStorage.test.js
```

- [ ] **Réécrire `src/utils/offlineStorage.js`** — API unifiée, suppression des alias
```js
const KEY_DRAFTS = 'pdp_offline_drafts';

// ── Brouillons hors-ligne ────────────────────────────────────────────────────

export function saveDraft(draft) {
  const all = getAllDrafts();
  const id  = draft.id || `offline_${Date.now()}`;
  all[id] = { ...draft, id, _offline: true, _savedAt: new Date().toISOString() };
  try { localStorage.setItem(KEY_DRAFTS, JSON.stringify(all)); } catch {}
  return id;
}

export function getAllDrafts() {
  try { return JSON.parse(localStorage.getItem(KEY_DRAFTS) || '{}'); } catch { return {}; }
}

export function removeDraft(id) {
  const all = getAllDrafts();
  delete all[id];
  try { localStorage.setItem(KEY_DRAFTS, JSON.stringify(all)); } catch {}
}

export function countDrafts() {
  return Object.keys(getAllDrafts()).length;
}

// ── Actions correctives stats (cache local fallback) ─────────────────────────

const KEY_ACTIONS = 'pdp_actions_correctives';

export function getLocalActionsStats() {
  try {
    const all = JSON.parse(localStorage.getItem(KEY_ACTIONS) || '{}');
    let todo = 0, doing = 0, done = 0;
    Object.values(all).forEach(actions =>
      actions.forEach(a => {
        if (a.statut === 'todo')  todo++;
        if (a.statut === 'doing') doing++;
        if (a.statut === 'done')  done++;
      })
    );
    return { todo, doing, done, total: todo + doing + done };
  } catch { return { todo: 0, doing: 0, done: 0, total: 0 }; }
}
```

- [ ] **Mettre à jour l'import dans `src/pages/NouveauPdP.jsx`**

Remplacer ligne 4 :
```js
// Avant
import { saveDraftOffline, getAllDrafts, removeDraft } from '../utils/offlineStorage';
// Après
import { saveDraft, getAllDrafts, removeDraft } from '../utils/offlineStorage';
```

Remplacer dans `handleSave` (ligne ~193 et ~215) :
```js
// Avant
saveDraftOffline(payload);
// Après
saveDraft(payload);
```

- [ ] **Relancer les tests — doivent passer**
```bash
npm test -- src/tests/offlineStorage.test.js
npm run build  # vérifier pas de régression
```

- [ ] **Commit**
```bash
git add src/utils/offlineStorage.js src/pages/NouveauPdP.jsx src/tests/offlineStorage.test.js
git commit -m "refactor(offline): unify offlineStorage API, remove duplicate aliases"
```

---

## Task 6: useOfflineSync hook

**Files:**
- Create: `src/hooks/useOfflineSync.js`
- Modify: `src/pages/NouveauPdP.jsx` (utiliser le hook)

- [ ] **Créer `src/hooks/useOfflineSync.js`**
```js
import { useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { getAllDrafts, removeDraft } from '../utils/offlineStorage';
import { getPendingUploads, removeFromQueue } from '../utils/photoQueue';
import { useToast } from '../contexts/ToastContext';

export function useOfflineSync() {
  const { addToast } = useToast();

  useEffect(() => {
    async function syncDrafts() {
      const drafts = getAllDrafts();
      const ids = Object.keys(drafts);
      if (ids.length === 0) return;
      addToast({ message: `Connexion rétablie — sync de ${ids.length} brouillon(s)…`, type: 'info' });
      for (const id of ids) {
        try {
          const { _savedAt, _offline, ...clean } = drafts[id];
          const { error } = await supabase.from('plans_prevention').upsert(clean);
          if (!error) {
            removeDraft(id);
            addToast({ message: 'Brouillon synchronisé', type: 'success' });
          }
        } catch (err) {
          console.error('[sync] draft error:', err);
        }
      }
    }

    async function syncPhotoQueue() {
      const pending = await getPendingUploads();
      if (pending.length === 0) return;
      addToast({ message: `Upload de ${pending.length} photo(s) en attente…`, type: 'info' });
      for (const item of pending) {
        try {
          const file = new File([item.blob], item.fileName, { type: item.mimeType });
          const path = `pdp/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
          const { data, error: upErr } = await supabase.storage.from('pdp-photos').upload(path, file, { contentType: item.mimeType });
          if (upErr) continue;
          const { data: { publicUrl } } = supabase.storage.from('pdp-photos').getPublicUrl(data.path);
          // Mettre à jour le plan avec la nouvelle URL
          const { data: plan } = await supabase.from('plans_prevention').select('photos').eq('id', item.planId).single();
          if (plan) {
            const photos = (plan.photos || []).map(p =>
              p.queueId === item.id ? { ...p, url: publicUrl, source: 'storage', queueId: undefined } : p
            );
            await supabase.from('plans_prevention').update({ photos }).eq('id', item.planId);
          }
          await removeFromQueue(item.id);
        } catch (err) {
          console.error('[sync] photo queue error:', err);
        }
      }
    }

    async function syncAll() {
      await syncDrafts();
      await syncPhotoQueue();
    }

    window.addEventListener('online', syncAll);
    return () => window.removeEventListener('online', syncAll);
  }, [addToast]);
}
```

- [ ] **Remplacer le useEffect syncOnReconnect dans `src/pages/NouveauPdP.jsx`**

Supprimer les lignes 70–92 (useEffect syncOnReconnect) et ajouter à la place :
```js
import { useOfflineSync } from '../hooks/useOfflineSync';
// ...dans le composant NouveauPdP, après les autres hooks :
useOfflineSync();
```

- [ ] **Build check**
```bash
npm run build
```

- [ ] **Commit**
```bash
git add src/hooks/useOfflineSync.js src/pages/NouveauPdP.jsx
git commit -m "feat(offline): extract useOfflineSync hook with photo queue support"
```

---

## Task 7: Mode TERRAIN — Thème Contraste Maximal

**Files:**
- Modify: `src/contexts/ThemeContext.jsx`
- Modify: `src/index.css`

- [ ] **Ajouter le thème TERRAIN dans `src/contexts/ThemeContext.jsx`**

Remplacer le contenu complet :
```js
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
```

- [ ] **Ajouter les règles CSS terrain dans `src/index.css`** (à la fin du fichier)
```css
/* ── Thème TERRAIN (contraste maximal plein soleil) ─────────────────────── */
[data-theme="terrain"] html,
[data-theme="terrain"] body,
[data-theme="terrain"] #root {
  background: #FFFEF5;
  color: #000000;
}
[data-theme="terrain"] .card {
  border: 3px solid #000000 !important;
  box-shadow: none;
}
[data-theme="terrain"] .btn {
  min-height: 64px;
  font-size: 16px;
  border: 3px solid #000000;
}
[data-theme="terrain"] .btn-primary {
  background: #FFCC00;
  color: #000000;
  border-color: #000000;
}
[data-theme="terrain"] .btn-success {
  background: #FFCC00;
  color: #000000;
  border-color: #000000;
}
[data-theme="terrain"] .btn-ghost {
  background: #ffffff;
  color: #000000;
  border-color: #000000;
}
[data-theme="terrain"] .field label {
  font-size: 13px;
  color: #000000;
}
[data-theme="terrain"] .field input,
[data-theme="terrain"] .field select,
[data-theme="terrain"] .field textarea {
  border: 3px solid #000000;
  color: #000000;
  background: #ffffff;
  font-size: 16px;
}
[data-theme="terrain"] .field input:focus,
[data-theme="terrain"] .field select:focus,
[data-theme="terrain"] .field textarea:focus {
  border-color: #FFCC00;
  outline: 3px solid #000000;
}
[data-theme="terrain"] .step-dot {
  border: 3px solid #000000;
  background: #ffffff;
}
[data-theme="terrain"] .step-dot.active {
  background: #FFCC00;
  border-color: #000000;
}
[data-theme="terrain"] .step-dot.done {
  background: #000000;
  border-color: #000000;
}
```

- [ ] **Mettre à jour le bouton toggle dans les pages** — le bouton Sun/Moon actuel doit cycler dark→light→terrain. Dans chaque page qui affiche le bouton (NouveauPdP, Dashboard, ListePdP, etc.), remplacer l'icône conditionnelle :
```js
// Avant
{isDark ? <Sun size={15} /> : <Moon size={15} />}
// Après (dans tout fichier qui utilise useTheme)
import { useTheme } from '../contexts/ThemeContext';
const { theme, toggle } = useTheme();
// ...
{theme.name === 'dark' ? <Sun size={15} /> : theme.name === 'light' ? <HardHat size={15} /> : <Moon size={15} />}
```
Importer `HardHat` depuis `lucide-react` dans chaque fichier concerné.

- [ ] **Build check**
```bash
npm run build
```

- [ ] **Commit**
```bash
git add src/contexts/ThemeContext.jsx src/index.css
git commit -m "feat(ux): add TERRAIN high-contrast theme (noir/blanc/jaune FFCC00)"
```

---

## Task 8: SignaturePad Adaptatif (DPR)

**Files:**
- Modify: `src/components/SignaturePad.jsx`

- [ ] **Remplacer `src/components/SignaturePad.jsx`** intégralement :
```jsx
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
  const { theme }   = useTheme();
  const canvasRef   = useRef(null);
  const drawing     = useRef(false);
  const lastPos     = useRef(null);
  const onChangRef  = useRef(onChange);
  const parsedRef   = useRef(parseValue(value));
  const strokeColor = theme.name === 'terrain' ? '#000000' : '#1e293b';

  useEffect(() => { onChangRef.current = onChange; }, [onChange]);
  useEffect(() => { parsedRef.current  = parseValue(value); }, [value]);

  const parsed = parseValue(value);
  const today  = new Date().toISOString().split('T')[0];

  // Resize canvas to device pixel ratio for sharp signatures
  const resizeAndRedraw = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const dpr  = window.devicePixelRatio || 1;
    canvas.width  = Math.round(rect.width  * dpr);
    canvas.height = Math.round(rect.height * dpr);
    const ctx = canvas.getContext('2d');
    ctx.scale(dpr, dpr);
    ctx.lineWidth = 2.5;
    ctx.lineCap   = 'round';
    ctx.lineJoin  = 'round';
    // Redraw existing signature if present
    const existing = parsedRef.current.drawing;
    if (existing) {
      const img = new window.Image();
      img.onload = () => ctx.drawImage(img, 0, 0, rect.width, rect.height);
      img.src = existing;
    }
  }, []);

  useEffect(() => {
    resizeAndRedraw();
    const ro = new ResizeObserver(resizeAndRedraw);
    if (canvasRef.current) ro.observe(canvasRef.current);
    return () => ro.disconnect();
  }, [resizeAndRedraw]);

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
      ctx.strokeStyle = strokeColor;
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
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
  }, [strokeColor]);

  function startDrawMouse(e) {
    drawing.current = true;
    lastPos.current = getCanvasPos(e, canvasRef.current);
  }
  function drawMouse(e) {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    const pos = getCanvasPos(e, canvas);
    ctx.beginPath();
    ctx.strokeStyle = strokeColor;
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
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
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const rect = canvas.getBoundingClientRect();
    ctx.clearRect(0, 0, rect.width * dpr, rect.height * dpr);
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
        onMouseDown={startDrawMouse} onMouseMove={drawMouse} onMouseUp={endDrawMouse} onMouseLeave={endDrawMouse}
        style={{
          width: '100%', height: 120, borderRadius: 12, display: 'block',
          cursor: 'crosshair', touchAction: 'none',
          background: '#ffffff',
          border: `2px ${hasSig ? 'solid #10B981' : 'dashed rgba(100,116,139,0.4)'}`,
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

- [ ] **Build check**
```bash
npm run build
```

- [ ] **Test manuel** : ouvrir l'app → Nouveau PdP → Étape Signatures → signer avec le doigt → vérifier que la signature est nette.

- [ ] **Commit**
```bash
git add src/components/SignaturePad.jsx
git commit -m "fix(signature): adaptive canvas resolution via devicePixelRatio + ResizeObserver"
```

---

## Task 9: PhotoCapture Pro

**Files:**
- Modify: `src/components/PhotoCapture.jsx`

- [ ] **Remplacer `src/components/PhotoCapture.jsx`** intégralement :
```jsx
import React, { useRef, useState } from 'react';
import { Camera, Image, X, Tag, Maximize2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useToast } from '../contexts/ToastContext';
import { addToPhotoQueue } from '../utils/photoQueue';

const CATEGORIES = [
  { value: 'zone_risque', label: 'Zone risque' },
  { value: 'epi',         label: 'EPI' },
  { value: 'acces',       label: 'Accès' },
  { value: 'materiel',    label: 'Matériel' },
  { value: 'autre',       label: 'Autre' },
];

async function compressImage(file, maxWidth = 1280) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = Math.round((h * maxWidth) / w); w = maxWidth; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => resolve({ blob, file: new File([blob], file.name, { type: 'image/jpeg' }) }), 'image/jpeg', 0.8);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function PhotoCapture({ photos = [], onChange, planId }) {
  const cameraRef   = useRef(null);
  const galleryRef  = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]     = useState(null); // URL pour fullscreen
  const { addToast } = useToast();

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const newPhotos = [...photos];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const { blob, file: compressed } = await compressImage(file);

        if (!navigator.onLine) {
          // Mode offline → IndexedDB queue
          const queueId = await addToPhotoQueue({ planId, blob, fileName: file.name });
          const localUrl = URL.createObjectURL(blob);
          newPhotos.push({ url: localUrl, source: 'queued', name: file.name, queueId, legende: '', categorie: '' });
          continue;
        }

        const fileName = `pdp/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
        const { data, error: upErr } = await supabase.storage
          .from('pdp-photos')
          .upload(fileName, compressed, { contentType: 'image/jpeg', upsert: false });

        if (upErr) {
          // Fallback offline même si online (bucket down, etc.)
          const queueId = await addToPhotoQueue({ planId, blob, fileName: file.name });
          const localUrl = URL.createObjectURL(blob);
          newPhotos.push({ url: localUrl, source: 'queued', name: file.name, queueId, legende: '', categorie: '' });
          addToast({ message: 'Photo mise en file d\'attente', type: 'info' });
        } else {
          const { data: { publicUrl } } = supabase.storage.from('pdp-photos').getPublicUrl(data.path);
          newPhotos.push({ url: publicUrl, source: 'storage', name: file.name, legende: '', categorie: '' });
        }
      } catch (err) {
        addToast({ message: 'Erreur photo : ' + (err.message || 'réessayer'), type: 'error' });
      }
    }

    onChange(newPhotos);
    setUploading(false);
  };

  const updatePhoto = (idx, field, val) => {
    onChange(photos.map((p, i) => i === idx ? { ...p, [field]: val } : p));
  };

  const removePhoto = (idx) => onChange(photos.filter((_, i) => i !== idx));

  const allCategorized = photos.length > 0 && photos.every(p => p.legende && p.categorie);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Statut compteur */}
      {photos.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', borderRadius: 10,
          background: allCategorized ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
          border: `1px solid ${allCategorized ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
          fontSize: 12, fontWeight: 700,
          color: allCategorized ? '#10B981' : '#F59E0B',
        }}>
          <span>📷 {photos.length} photo{photos.length > 1 ? 's' : ''}</span>
          <span>{allCategorized ? '✓ Toutes documentées' : 'Ajoutez légende + catégorie'}</span>
        </div>
      )}

      {/* Boutons capture */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
        <button type="button" className="btn btn-primary"
          onClick={() => cameraRef.current?.click()} disabled={uploading}
          style={{ gap: 8 }}>
          <Camera size={20} />
          {uploading ? 'Upload…' : 'Prendre une photo'}
        </button>
        <button type="button" className="btn btn-ghost"
          onClick={() => galleryRef.current?.click()} disabled={uploading}>
          <Image size={18} />
        </button>
      </div>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" multiple
        onChange={e => handleFiles(e.target.files)} style={{ display: 'none' }} />
      <input ref={galleryRef} type="file" accept="image/*" multiple
        onChange={e => handleFiles(e.target.files)} style={{ display: 'none' }} />

      {/* Liste photos */}
      {photos.map((photo, idx) => (
        <div key={idx} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          {/* Image 16:9 */}
          <div style={{ position: 'relative', aspectRatio: '16/9', background: '#0a0a0a' }}>
            <img src={photo.url} alt={`Photo ${idx + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            {photo.source === 'queued' && (
              <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(245,158,11,0.9)', color: '#000', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 100 }}>
                ⏳ En attente
              </div>
            )}
            <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 4 }}>
              <button type="button" onClick={() => setPreview(photo.url)}
                style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Maximize2 size={13} />
              </button>
              <button type="button" onClick={() => removePhoto(idx)}
                style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.8)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Chips catégorie */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, padding: '8px 10px 4px' }}>
            {CATEGORIES.map(cat => (
              <button key={cat.value} type="button"
                onClick={() => updatePhoto(idx, 'categorie', photo.categorie === cat.value ? '' : cat.value)}
                style={{ padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${photo.categorie === cat.value ? '#4F63E7' : 'rgba(255,255,255,0.12)'}`, background: photo.categorie === cat.value ? 'rgba(79,99,231,0.18)' : 'transparent', color: photo.categorie === cat.value ? '#7C8FFF' : '#64748B' }}>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Légende */}
          <div style={{ padding: '4px 10px 10px' }}>
            <input
              type="text"
              value={photo.legende || ''}
              onChange={e => updatePhoto(idx, 'legende', e.target.value)}
              placeholder="Ajouter une légende (zone risque, EPI manquant…)"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: 'var(--bg-card2)', border: '1px solid var(--border)', color: 'var(--text1)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>
      ))}

      {photos.length === 0 && !uploading && (
        <div style={{ textAlign: 'center', padding: '28px 0', color: '#475569', borderRadius: 12, border: '1.5px dashed rgba(255,255,255,0.07)' }}>
          <Camera size={28} style={{ margin: '0 auto 8px', opacity: 0.35 }} />
          <div style={{ fontSize: 13 }}>Aucune photo — documentez la zone de travail</div>
        </div>
      )}

      {/* Fullscreen preview dialog */}
      {preview && (
        <dialog open onClick={() => setPreview(null)}
          style={{ position: 'fixed', inset: 0, width: '100vw', height: '100dvh', background: 'rgba(0,0,0,0.95)', border: 'none', padding: 0, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <img src={preview} alt="Aperçu"
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} />
          <button onClick={() => setPreview(null)}
            style={{ position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} />
          </button>
        </dialog>
      )}
    </div>
  );
}
```

- [ ] **Build check**
```bash
npm run build
```

- [ ] **Commit**
```bash
git add src/components/PhotoCapture.jsx
git commit -m "feat(photo): PhotoCapture Pro — légendes, chips catégorie, fullscreen, queue offline"
```

---

## Task 10: Décomposition NouveauPdP

**Files:**
- Create: `src/hooks/useFormPdP.js`
- Create: `src/components/steps/StepInfos.jsx`
- Create: `src/components/steps/StepPhotos.jsx`
- Create: `src/components/steps/StepAnalyse.jsx`
- Create: `src/components/steps/StepPrevention.jsx`
- Create: `src/components/steps/StepSignatures.jsx`
- Modify: `src/pages/NouveauPdP.jsx`

- [ ] **Créer `src/hooks/useFormPdP.js`**
```js
import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { saveDraft } from '../utils/offlineStorage';
import { calcScore, calcScoreResiduel, getNiveauRisque, RISQUE_COLORS } from '../utils/risques';
import { genererMesuresSuggerees } from '../utils/prevention';
import { useToast } from '../contexts/ToastContext';

export const EMPTY_FORM = {
  lieu: '', entreprise_exterieure: '', date_travaux: new Date().toISOString().split('T')[0],
  responsable: '', contact_urgence: '', description_travaux: '', intervenants: '',
  type_travaux: '', types_travaux: [], type_intervention: '', environnement: [], meteo: '', temperature: '',
  photos: [],
  reponses: {}, observations_questions: {}, photos_questions: {}, custom_questions: {},
  mesures_suggerees: [], mesures_prevention: '', score_residuel: null,
  signature_qhse: '', signature_responsable: '',
  statut: 'brouillon',
};

export function useFormPdP({ initialData, editId, session }) {
  const navigate     = useNavigate();
  const { addToast } = useToast();

  const [step, setStep]                       = useState(0);
  const [swipeDir, setSwipeDir]               = useState('right');
  const [form, setFormState]                  = useState(() => initialData ? { ...EMPTY_FORM, ...initialData } : { ...EMPTY_FORM });
  const [saving, setSaving]                   = useState(false);
  const [saved, setSaved]                     = useState(false);
  const [error, setError]                     = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (!hasUnsavedChanges) return; e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  const setField = useCallback((key, val) => {
    setFormState(f => ({ ...f, [key]: val }));
    setHasUnsavedChanges(true);
  }, []);

  const score         = useMemo(() => calcScore(form.reponses), [form.reponses]);
  const scoreResiduel = useMemo(() => calcScoreResiduel(score, form.mesures_suggerees), [score, form.mesures_suggerees]);
  const niveau        = useMemo(() => getNiveauRisque(score), [score]);
  const nInfo         = RISQUE_COLORS[niveau];

  const canNext = useCallback(() => {
    if (step === 0) return form.lieu.trim() && form.entreprise_exterieure.trim() && form.date_travaux;
    return true;
  }, [step, form.lieu, form.entreprise_exterieure, form.date_travaux]);

  const handleNext = useCallback(() => {
    if (step === 2) {
      const suggestions = genererMesuresSuggerees(form.reponses);
      const existing    = form.mesures_suggerees;
      const merged = suggestions.map(s => {
        const prev = existing.find(e => e.mesure === s.mesure);
        return prev ? { ...s, selectionnee: prev.selectionnee } : s;
      });
      setField('mesures_suggerees', merged);
    }
    setSwipeDir('right');
    setStep(s => s + 1);
    window.scrollTo(0, 0);
  }, [step, form.reponses, form.mesures_suggerees, setField]);

  const handlePrev = useCallback(() => {
    if (step === 0) { navigate('/'); return; }
    setSwipeDir('left');
    setStep(s => s - 1);
    window.scrollTo(0, 0);
  }, [step, navigate]);

  const handleSave = useCallback(async (finalStatut) => {
    setSaving(true); setError('');
    const serializeSig = (v) => {
      if (!v) return null;
      if (typeof v === 'string') return v;
      try { return JSON.stringify(v); } catch { return null; }
    };
    const payload = {
      ...form,
      signature_qhse:        serializeSig(form.signature_qhse),
      signature_responsable: serializeSig(form.signature_responsable),
      statut:                finalStatut,
      created_by:            session?.user?.id,
      score_risque:          score,
      niveau_risque:         niveau,
      score_residuel:        scoreResiduel,
    };

    if (!navigator.onLine) {
      saveDraft(payload);
      setSaving(false); setSaved(true); setHasUnsavedChanges(false);
      addToast({ message: 'Plan sauvegardé localement (hors-ligne)', type: 'info' });
      setTimeout(() => navigate('/'), 1800);
      return;
    }

    if (editId) {
      const { _savedAt, _offline, ...cleanPayload } = payload;
      const { error: err } = await supabase.from('plans_prevention').update(cleanPayload).eq('id', editId);
      setSaving(false);
      if (err) { addToast({ message: 'Erreur : ' + err.message, type: 'error' }); setError(err.message); return; }
    } else {
      const { error: err } = await supabase.from('plans_prevention').insert([payload]);
      setSaving(false);
      if (err) {
        if (err.message?.includes('network') || err.message?.includes('fetch')) {
          saveDraft(payload); setSaved(true); setHasUnsavedChanges(false);
          addToast({ message: 'Plan sauvegardé localement (hors-ligne)', type: 'info' });
          setTimeout(() => navigate('/'), 1800);
          return;
        }
        addToast({ message: 'Erreur : ' + err.message, type: 'error' }); setError(err.message); return;
      }
    }
    setHasUnsavedChanges(false);
    addToast({ message: 'Plan sauvegardé avec succès', type: 'success' });
    setSaved(true);
    setTimeout(() => navigate(editId ? `/pdp/${editId}` : '/'), 1800);
  }, [form, editId, session, score, niveau, scoreResiduel, addToast, navigate]);

  return {
    form, step, swipeDir, saving, saved, error,
    setField, setFormState,
    handleNext, handlePrev, handleSave,
    canNext, hasUnsavedChanges,
    score, scoreResiduel, niveau, nInfo,
  };
}
```

- [ ] **Créer `src/components/steps/StepInfos.jsx`** — extraire le JSX de `NouveauPdP.jsx` lignes 301–468 :
```jsx
import React, { useState, useEffect } from 'react';
import { MapPin, Bookmark, BookmarkCheck, ChevronDown, Trash2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { getTemplates, saveTemplate, deleteTemplate } from '../../utils/templatesService';
import { SECTEURS_CHANTIER, TYPES_INTERVENTION, ENVIRONNEMENTS_SITE, METEO_OPTIONS } from '../../utils/risques';

export default function StepInfos({ form, setField, swipeDir }) {
  const { theme } = useTheme();
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateName, setTemplateName]   = useState('');
  const [savingTpl, setSavingTpl]         = useState(false);
  const [templates, setTemplates]         = useState([]);

  useEffect(() => { getTemplates().then(setTemplates); }, []);

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;
    await saveTemplate(templateName, form);
    getTemplates().then(setTemplates);
    setTemplateName(''); setSavingTpl(false);
  };

  const handleLoadTemplate = (tpl) => {
    Object.entries(tpl.data).forEach(([k, v]) => setField(k, v));
    setShowTemplates(false);
  };

  const handleDeleteTemplate = async (id) => {
    await deleteTemplate(id); getTemplates().then(setTemplates);
  };

  return (
    <div className={`${swipeDir === 'left' ? 'slide-in-left' : 'slide-in-right'}`} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Templates */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => setShowTemplates(s => !s)}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: 12, background: theme.bgCard, border: `1px solid ${showTemplates ? 'rgba(79,99,231,0.4)' : theme.border}`, color: showTemplates ? '#4F63E7' : theme.text3, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Bookmark size={14} /> {templates.length > 0 ? `Modèles (${templates.length})` : 'Modèles'}
          </span>
          <ChevronDown size={14} style={{ transform: showTemplates ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
        <button type="button" onClick={() => setSavingTpl(s => !s)} title="Sauvegarder comme modèle"
          style={{ width: 44, height: 44, borderRadius: 12, background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.text3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BookmarkCheck size={16} />
        </button>
      </div>

      {savingTpl && (
        <div style={{ display: 'flex', gap: 8, padding: '10px 14px', background: theme.bgCard, border: `1px solid rgba(79,99,231,0.3)`, borderRadius: 12 }}>
          <input autoFocus placeholder="Nom du modèle…" value={templateName} onChange={e => setTemplateName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveTemplate()}
            style={{ flex: 1, padding: '9px 12px', borderRadius: 10, background: theme.inputBg, border: `1px solid ${theme.border}`, color: theme.text1, fontSize: 13, outline: 'none' }} />
          <button type="button" onClick={handleSaveTemplate} style={{ padding: '0 14px', borderRadius: 10, background: '#4F63E7', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Sauver</button>
        </div>
      )}

      {showTemplates && (
        <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {templates.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: theme.text4, fontSize: 13 }}>Aucun modèle</div>
          ) : templates.map((tpl, i) => (
            <div key={tpl.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderTop: i > 0 ? `1px solid ${theme.border2}` : 'none' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: theme.text1 }}>{tpl.name}</div>
                <div style={{ fontSize: 11, color: theme.text4 }}>{tpl.data.type_travaux || tpl.data.lieu || '—'}</div>
              </div>
              <button type="button" onClick={() => handleLoadTemplate(tpl)} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(79,99,231,0.12)', border: '1px solid rgba(79,99,231,0.3)', color: '#4F63E7', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Charger</button>
              <button type="button" onClick={() => handleDeleteTemplate(tpl.id)} style={{ width: 30, height: 30, borderRadius: 8, background: 'none', border: 'none', color: theme.text5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 700, color: '#4F63E7', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={13} /> Localisation & Parties</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="field"><label>Lieu du chantier *</label><input value={form.lieu} onChange={e => setField('lieu', e.target.value)} placeholder="Bâtiment B, Zone Nord…" autoFocus /></div>
          <div className="field"><label>Entreprise extérieure *</label><input value={form.entreprise_exterieure} onChange={e => setField('entreprise_exterieure', e.target.value)} placeholder="Nom de la société" /></div>
          <div className="field"><label>Date des travaux *</label><input type="date" value={form.date_travaux} onChange={e => setField('date_travaux', e.target.value)} /></div>
          <div className="field"><label>Responsable QHSE</label><input value={form.responsable} onChange={e => setField('responsable', e.target.value)} placeholder="Prénom Nom" /></div>
          <div className="field"><label>Contact urgence</label><input type="tel" value={form.contact_urgence} onChange={e => setField('contact_urgence', e.target.value)} placeholder="06 00 00 00 00" /></div>
          <div className="field"><label>Intervenants</label><input value={form.intervenants} onChange={e => setField('intervenants', e.target.value)} placeholder="Noms des intervenants…" /></div>
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 700, color: '#10B981', marginBottom: 4 }}>🏗️ Type de travaux</div>
        {(form.types_travaux || []).length > 0 && (
          <div style={{ marginBottom: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {(form.types_travaux || []).map(t => <span key={t} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 12, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981', fontWeight: 600 }}>{t}</span>)}
          </div>
        )}
        {SECTEURS_CHANTIER.map(sec => (
          <div key={sec.secteur} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6 }}>{sec.secteur}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {sec.types.map(t => {
                const selected = (form.types_travaux || []).includes(t);
                return (
                  <button key={t} type="button"
                    onClick={() => {
                      const cur  = form.types_travaux || [];
                      const next = selected ? cur.filter(v => v !== t) : [...cur, t];
                      setField('types_travaux', next);
                      setField('type_travaux', next[0] || '');
                    }}
                    style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1.5px solid ${selected ? sec.color : 'rgba(255,255,255,0.1)'}`, background: selected ? sec.color + '20' : 'transparent', color: selected ? sec.color : '#94A3B8', transition: 'all 0.12s' }}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B', marginBottom: 10 }}>⚙️ Type d'intervention</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TYPES_INTERVENTION.map(t => (
            <button key={t.value} type="button" onClick={() => setField('type_intervention', t.value)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', border: `1.5px solid ${form.type_intervention === t.value ? '#4F63E7' : 'rgba(255,255,255,0.08)'}`, background: form.type_intervention === t.value ? 'rgba(79,99,231,0.12)' : '#152236', textAlign: 'left' }}>
              <span style={{ fontSize: 18 }}>{t.label.split(' ')[0]}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>{t.label.substring(t.label.indexOf(' ') + 1)}</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>{t.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 700, color: '#8B5CF6', marginBottom: 10 }}>🗺️ Environnement du site</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ENVIRONNEMENTS_SITE.map(e => {
            const sel = form.environnement.includes(e.value);
            return (
              <button key={e.value} type="button" onClick={() => setField('environnement', sel ? form.environnement.filter(v => v !== e.value) : [...form.environnement, e.value])}
                style={{ padding: '7px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: `1.5px solid ${sel ? '#8B5CF6' : 'rgba(255,255,255,0.08)'}`, background: sel ? 'rgba(139,92,246,0.15)' : '#152236', color: sel ? '#C4B5FD' : '#94A3B8', fontWeight: sel ? 700 : 400 }}>
                {e.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 700, color: '#06B6D4', marginBottom: 10 }}>🌤️ Météo & Conditions</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {METEO_OPTIONS.map(m => (
            <button key={m.value} type="button" onClick={() => setField('meteo', m.value)}
              style={{ padding: '7px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: `1.5px solid ${form.meteo === m.value ? '#06B6D4' : 'rgba(255,255,255,0.08)'}`, background: form.meteo === m.value ? 'rgba(6,182,212,0.15)' : '#152236', color: form.meteo === m.value ? '#67E8F9' : '#94A3B8', fontWeight: form.meteo === m.value ? 700 : 400 }}>
              {m.label}
            </button>
          ))}
        </div>
        <div className="field"><label>Température (°C)</label><input type="number" value={form.temperature} onChange={e => setField('temperature', e.target.value)} placeholder="Ex: 22" /></div>
      </div>

      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 700, color: '#F97316', marginBottom: 10 }}>📋 Description</div>
        <div className="field"><label>Nature & étendue des travaux</label><textarea value={form.description_travaux} onChange={e => setField('description_travaux', e.target.value)} placeholder="Décrivez les travaux, durée prévue, équipements…" rows={4} /></div>
      </div>
    </div>
  );
}
```

- [ ] **Créer `src/components/steps/StepPhotos.jsx`**
```jsx
import React from 'react';
import PhotoCapture from '../PhotoCapture';

export default function StepPhotos({ form, setField, planId }) {
  return (
    <div className="fade-up">
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 700, color: '#64748B', marginBottom: 6 }}>📷 Documentation photographique</div>
        <p style={{ fontSize: 12, color: '#64748B', marginBottom: 14, lineHeight: 1.5 }}>
          Photographiez l'environnement, les accès, les équipements et les zones à risque.
        </p>
        <PhotoCapture photos={form.photos} onChange={val => setField('photos', val)} planId={planId} />
      </div>
    </div>
  );
}
```

- [ ] **Créer `src/components/steps/StepAnalyse.jsx`**
```jsx
import React from 'react';
import AnalyseRisques from '../AnalyseRisques';

export default function StepAnalyse({ form, setField, setFormState }) {
  return (
    <div className="fade-up">
      <AnalyseRisques
        reponses={form.reponses}
        observations={form.observations_questions}
        photos={form.photos_questions}
        onChange={(qId, val) => setField('reponses', { ...form.reponses, [qId]: val })}
        onObservation={(qId, val) => setField('observations_questions', { ...form.observations_questions, [qId]: val })}
        onPhoto={(qId, val) => {
          const updated = { ...form.photos_questions };
          if (val) updated[qId] = val; else delete updated[qId];
          setField('photos_questions', updated);
        }}
        typesTravaux={form.types_travaux || []}
        customQuestions={form.custom_questions || {}}
        onAddCustomQuestion={(catId, text) => {
          const id   = `custom_${catId}_${Date.now()}`;
          const prev = (form.custom_questions || {})[catId] || [];
          setField('custom_questions', { ...(form.custom_questions || {}), [catId]: [...prev, { id, text }] });
        }}
        onRemoveCustomQuestion={(catId, qId) => {
          const prev = (form.custom_questions || {})[catId] || [];
          const updatedCQ = { ...(form.custom_questions || {}), [catId]: prev.filter(q => q.id !== qId) };
          const { [qId]: _r, ...cleanReponses } = form.reponses;
          const { [qId]: _o, ...cleanObs }      = form.observations_questions;
          const { [qId]: _p, ...cleanPhotos }   = form.photos_questions;
          setFormState(f => ({ ...f, custom_questions: updatedCQ, reponses: cleanReponses, observations_questions: cleanObs, photos_questions: cleanPhotos }));
        }}
      />
    </div>
  );
}
```

- [ ] **Créer `src/components/steps/StepPrevention.jsx`**
```jsx
import React, { useState } from 'react';
import { Plus, Trash2, AlertTriangle } from 'lucide-react';
import { getNiveauRisque, RISQUE_COLORS } from '../../utils/risques';

export default function StepPrevention({ form, setField, score, scoreResiduel, niveau, nInfo }) {
  const [newMesure, setNewMesure] = useState('');

  const toggleMesure = (id) => {
    setField('mesures_suggerees', form.mesures_suggerees.map(m =>
      m.id === id ? { ...m, selectionnee: !m.selectionnee } : m
    ));
  };

  const addCustomMesure = () => {
    if (!newMesure.trim()) return;
    setField('mesures_suggerees', [...form.mesures_suggerees, {
      id: `custom_${Date.now()}`, mesure: newMesure.trim(),
      questionId: null, priorite: 'normale', selectionnee: true,
    }]);
    setNewMesure('');
  };

  const removeMesure = (id) => setField('mesures_suggerees', form.mesures_suggerees.filter(m => m.id !== id));

  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
      <div className="card" style={{ textAlign: 'center', border: `1.5px solid ${nInfo.border}`, background: nInfo.bg }}>
        <div style={{ fontSize: 11, fontWeight: 700, color: nInfo.text, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Niveau de risque calculé</div>
        <div style={{ fontSize: 38, fontWeight: 900, color: nInfo.text }}>{score}<span style={{ fontSize: 16, opacity: 0.6 }}>/25</span></div>
        <div style={{ fontSize: 16, fontWeight: 700, color: nInfo.text, marginTop: 4 }}>{nInfo.label}</div>
        <div style={{ fontSize: 11, color: nInfo.text, opacity: 0.7, marginTop: 4 }}>
          {Object.values(form.reponses).filter(r => r === 'non').length} non-conformité(s) · {Object.values(form.reponses).filter(r => r === 'nsp').length} à vérifier
        </div>
        {form.mesures_suggerees.some(m => m.selectionnee) && scoreResiduel !== score && (
          <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${nInfo.border}40` }}>
            <div style={{ fontSize: 10, color: nInfo.text, opacity: 0.7, marginBottom: 2 }}>Score résiduel (après mesures)</div>
            <div style={{ fontSize: 24, fontWeight: 900, color: RISQUE_COLORS[getNiveauRisque(scoreResiduel)].text }}>
              {scoreResiduel}<span style={{ fontSize: 12, opacity: 0.6 }}>/25</span>
            </div>
            <div style={{ fontSize: 11, fontWeight: 700, color: RISQUE_COLORS[getNiveauRisque(scoreResiduel)].text }}>{RISQUE_COLORS[getNiveauRisque(scoreResiduel)].label}</div>
          </div>
        )}
      </div>

      {form.mesures_suggerees.length > 0 ? (
        <div className="card">
          <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>🛡️ Mesures suggérées automatiquement</div>
          <p style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>Décochez ce qui n'est pas applicable.</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {form.mesures_suggerees.map(m => (
              <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${m.selectionnee ? (m.priorite === 'haute' ? 'rgba(239,68,68,0.35)' : 'rgba(16,185,129,0.3)') : 'rgba(255,255,255,0.06)'}`, background: m.selectionnee ? (m.priorite === 'haute' ? 'rgba(239,68,68,0.06)' : 'rgba(16,185,129,0.05)') : 'rgba(255,255,255,0.02)' }}>
                <button type="button" onClick={() => toggleMesure(m.id)}
                  style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${m.selectionnee ? (m.priorite === 'haute' ? '#EF4444' : '#10B981') : 'rgba(255,255,255,0.2)'}`, background: m.selectionnee ? (m.priorite === 'haute' ? '#EF4444' : '#10B981') : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginTop: 1 }}>
                  {m.selectionnee && <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                </button>
                <div style={{ flex: 1, fontSize: 13, color: m.selectionnee ? '#CBD5E1' : '#475569', lineHeight: 1.5 }}>{m.mesure}</div>
                {m.priorite === 'haute' && <span style={{ fontSize: 10, fontWeight: 700, color: '#EF4444', flexShrink: 0, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 100, padding: '2px 6px' }}>⚡ PRIORITAIRE</span>}
                <button type="button" onClick={() => removeMesure(m.id)} style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><Trash2 size={12} /></button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="card" style={{ textAlign: 'center', padding: '24px 16px', color: '#64748B' }}>
          <AlertTriangle size={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
          <p style={{ fontSize: 13 }}>Aucune non-conformité — aucune mesure suggérée.</p>
        </div>
      )}

      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 10 }}>➕ Ajouter une mesure personnalisée</div>
        <div style={{ display: 'flex', gap: 8 }}>
          <input value={newMesure} onChange={e => setNewMesure(e.target.value)} onKeyDown={e => e.key === 'Enter' && addCustomMesure()}
            placeholder="Décrire une mesure complémentaire…"
            style={{ flex: 1, padding: '12px 14px', borderRadius: 12, background: '#152236', border: '1.5px solid rgba(255,255,255,0.08)', color: '#F1F5F9', fontSize: 13, outline: 'none' }} />
          <button type="button" className="btn btn-primary" style={{ minWidth: 48, padding: '0 14px' }} onClick={addCustomMesure}><Plus size={18} /></button>
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 8 }}>📝 Notes de prévention libres</div>
        <div className="field">
          <textarea value={form.mesures_prevention} onChange={e => setField('mesures_prevention', e.target.value)} placeholder="Consignes spécifiques, EPI obligatoires, permis de travail…" rows={4} />
        </div>
      </div>
    </div>
  );
}
```

- [ ] **Créer `src/components/steps/StepSignatures.jsx`**
```jsx
import React from 'react';
import SignaturePad from '../SignaturePad';

export default function StepSignatures({ form, setField, score, nInfo, error }) {
  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ textAlign: 'center', borderColor: nInfo.border, background: nInfo.bg }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: nInfo.text, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Risque final — {nInfo.label}</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: nInfo.text, margin: '4px 0' }}>{score}/25</div>
        <div style={{ fontSize: 11, color: nInfo.text, opacity: 0.7 }}>{form.mesures_suggerees.filter(m => m.selectionnee).length} mesure(s) retenue(s)</div>
      </div>

      <div className="card">
        <p style={{ fontSize: 12, color: '#64748B', marginBottom: 14, lineHeight: 1.6 }}>
          En signant, les deux parties reconnaissent avoir pris connaissance des risques et s'engagent à respecter les mesures de prévention.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SignaturePad label="Responsable QHSE / Donneur d'ordre" value={form.signature_qhse} onChange={val => setField('signature_qhse', val)} />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
          <SignaturePad label="Responsable de site / Chef de chantier" value={form.signature_responsable} onChange={val => setField('signature_responsable', val)} />
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, fontSize: 13, color: '#EF4444' }}>⚠️ {error}</div>
      )}
    </div>
  );
}
```

- [ ] **Remplacer `src/pages/NouveauPdP.jsx`** par l'orchestrateur :
```jsx
import React, { useRef, useCallback } from 'react';
import { CheckCircle2, ArrowLeft, ArrowRight, Save, MapPin, Building2, FileText, ShieldCheck, PenLine, Sun, Moon, HardHat } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useFormPdP } from '../hooks/useFormPdP';
import { useOfflineSync } from '../hooks/useOfflineSync';
import StepInfos       from '../components/steps/StepInfos';
import StepPhotos      from '../components/steps/StepPhotos';
import StepAnalyse     from '../components/steps/StepAnalyse';
import StepPrevention  from '../components/steps/StepPrevention';
import StepSignatures  from '../components/steps/StepSignatures';

const STEPS = [
  { id: 'infos',      label: 'Chantier',   icon: MapPin },
  { id: 'photos',     label: 'Photos',     icon: Building2 },
  { id: 'analyse',    label: 'Analyse',    icon: ShieldCheck },
  { id: 'prevention', label: 'Prévention', icon: FileText },
  { id: 'signatures', label: 'Signatures', icon: PenLine },
];

export default function NouveauPdP({ session, initialData, editId }) {
  const { theme, toggle } = useTheme();
  const themeName = theme.name;
  const touchStart = useRef(null);

  const {
    form, step, swipeDir, saving, saved, error,
    setField, setFormState,
    handleNext, handlePrev, handleSave,
    canNext, score, scoreResiduel, niveau, nInfo,
  } = useFormPdP({ initialData, editId, session });

  useOfflineSync();

  const onTouchStart = useCallback((e) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.8) return;
    if (dx < 0 && canNext()) handleNext();
    if (dx > 0 && step > 0) handlePrev();
  }, [step, canNext, handleNext, handlePrev]);

  if (saved) return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: theme.bg, gap: 16, padding: 24 }}>
      <CheckCircle2 size={72} style={{ color: '#10B981' }} />
      <div style={{ fontSize: 22, fontWeight: 800, color: theme.text1, textAlign: 'center' }}>
        {editId ? 'Plan mis à jour !' : 'Plan enregistré !'}
      </div>
      <div style={{ fontSize: 14, color: theme.text4 }}>Redirection…</div>
    </div>
  );

  const ThemeIcon = themeName === 'dark' ? Sun : themeName === 'light' ? HardHat : Moon;

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: theme.bg }}>

      <div style={{ padding: 'calc(env(safe-area-inset-top,0px) + 10px) 14px 10px', background: theme.bgCard, borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <button onClick={handlePrev} style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.iconBg, color: theme.name === 'terrain' ? '#FFCC00' : theme.text3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: theme.text1 }}>{editId ? 'Modifier le Plan' : 'Nouveau Plan de Prévention'}</div>
            <div style={{ fontSize: 11, color: theme.text4 }}>Étape {step + 1}/{STEPS.length} — {STEPS[step].label}</div>
          </div>
          {step >= 2 && Object.keys(form.reponses).length > 0 && (
            <div style={{ textAlign: 'center', background: nInfo.bg, border: `1px solid ${nInfo.border}`, borderRadius: 10, padding: '4px 10px' }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: nInfo.text }}>{score}</div>
              <div style={{ fontSize: 9, color: nInfo.text }}>{nInfo.label}</div>
            </div>
          )}
          <button onClick={toggle} style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.iconBg, color: theme.name === 'terrain' ? '#FFCC00' : theme.text3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ThemeIcon size={15} />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
          {STEPS.map((s, i) => <div key={s.id} className={`step-dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />)}
        </div>
      </div>

      <div className="scroll-area" style={{ flex: 1, padding: '14px' }}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

        {step === 0 && <StepInfos form={form} setField={setField} swipeDir={swipeDir} />}
        {step === 1 && <StepPhotos form={form} setField={setField} planId={editId} />}
        {step === 2 && <StepAnalyse form={form} setField={setField} setFormState={setFormState} />}
        {step === 3 && <StepPrevention form={form} setField={setField} score={score} scoreResiduel={scoreResiduel} niveau={niveau} nInfo={nInfo} />}
        {step === 4 && <StepSignatures form={form} setField={setField} score={score} nInfo={nInfo} error={error} />}

        <div style={{ height: 100 }} />
      </div>

      <div style={{ padding: '12px 14px', paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 12px)', background: theme.bgCard, borderTop: `1px solid ${theme.border}`, display: 'flex', gap: 10, flexShrink: 0 }}>
        {step < STEPS.length - 1 ? (
          <button className="btn btn-primary" style={{ flex: 1, fontSize: 15 }} disabled={!canNext()} onClick={handleNext}>
            Suivant <ArrowRight size={18} />
          </button>
        ) : (
          <>
            <button className="btn btn-ghost" style={{ flex: 1 }} disabled={saving} onClick={() => handleSave('brouillon')}>
              <Save size={16} /> {editId ? 'Sauver' : 'Brouillon'}
            </button>
            <button className="btn btn-success" style={{ flex: 2, fontSize: 15 }} disabled={saving} onClick={() => handleSave(editId ? (initialData?.statut || 'brouillon') : 'valide')}>
              {saving
                ? <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Enregistrement…</>
                : editId ? <><Save size={18} /> Enregistrer</> : <><Save size={18} /> Sauvegarder & Valider</>
              }
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
```

- [ ] **Build check**
```bash
npm run build
# Doit compiler sans erreur
```

- [ ] **Test complet** : créer un nouveau PdP, naviguer les 5 étapes, signer, sauvegarder → vérifier redirection.

- [ ] **Commit**
```bash
git add src/hooks/useFormPdP.js src/components/steps/ src/pages/NouveauPdP.jsx
git commit -m "refactor(form): decompose NouveauPdP into useFormPdP hook + 5 step components"
```

---

## Task 11: Dashboard — pagination + stats async

**Files:**
- Modify: `src/pages/Dashboard.jsx`

- [ ] **Remplacer le `charger` callback et l'import dans `Dashboard.jsx`**

Remplacer l'import ligne 6 :
```js
// Avant
import { getAllActionsStats } from '../utils/offlineStorage';
// Après
import { getAllActionsStats } from '../utils/actionsService';
```

Remplacer la ligne `const actionsStats = getAllActionsStats();` et l'état correspondant. Ajouter un state et un useEffect :
```js
// Remplacer "const actionsStats = getAllActionsStats();" par :
const [actionsStats, setActionsStats] = useState({ todo: 0, doing: 0, done: 0, total: 0 });

// Dans le useEffect charger, après setPdps :
getAllActionsStats().then(setActionsStats).catch(() => {});
```

Modifier la requête `charger` pour ajouter la pagination :
```js
const charger = useCallback(async () => {
  setLoading(true);
  const { data } = await supabase
    .from('plans_prevention')
    .select('id, lieu, entreprise_exterieure, statut, niveau_risque, score_risque, reponses, created_at, date_travaux')
    .order('created_at', { ascending: false })
    .range(0, 49);   // 50 plans max pour les stats dashboard
  setLoading(false);
  setPdps(data || []);
  if (data) getAllActionsStats().then(setActionsStats).catch(() => {});
}, []);
```

- [ ] **Build check + test**
```bash
npm run build
npm test
```

- [ ] **Commit**
```bash
git add src/pages/Dashboard.jsx
git commit -m "fix(dashboard): async actionsStats from Supabase + pagination range(0,49)"
```

---

## Task 12: Vérification finale + nettoyage

- [ ] **Tests complets**
```bash
npm test
# Expected: tous les tests passent (photoQueue: 3, offlineStorage: 3, toast: *, risques: *, settings: *)
```

- [ ] **Build de production**
```bash
npm run build
# Expected: dist/ généré, sw.js présent, pas de warning critique
```

- [ ] **Vérifier le PWA en preview**
```bash
npm run preview
# Ouvrir http://localhost:4173
# DevTools → Application → Service Workers → sw.js "activated and running"
# DevTools → Application → Manifest → vérifier icons + name
# DevTools → Lighthouse → PWA audit → score ≥ 90
```

- [ ] **Vérifier le mode TERRAIN**
```
- Ouvrir l'app → cliquer le bouton thème 2× pour arriver sur TERRAIN
- Vérifier : fond crème, bordures noires, boutons jaune FFCC00, boutons ≥ 64px
- Vérifier le formulaire NouveauPdP en mode TERRAIN : tous les champs lisibles
```

- [ ] **Vérifier offline** (optionnel mais recommandé)
```
- DevTools → Network → Offline
- Recharger la page → doit charger (SW en cache)
- Créer un nouveau PdP → doit afficher "hors-ligne"
- Prendre une photo → badge "⏳ En attente"
- DevTools → Network → Online
- Vérifier que la queue se vide et les données se sync
```

- [ ] **Commit final**
```bash
git add -A
git commit -m "chore: final verification pass — PWA, TERRAIN theme, offline flow all working"
```

- [ ] **Push branche**
```bash
git push -u origin feat/v2-terrain
```

---

## Résumé des commits attendus

```
feat(pwa): add manifest.json and app icons
feat(pwa): add Service Worker via vite-plugin-pwa + Workbox caching
feat(offline): add IndexedDB photo queue with full test coverage
feat(db): add actions_correctives table with RLS
refactor(offline): unify offlineStorage API, remove duplicate aliases
feat(offline): extract useOfflineSync hook with photo queue support
feat(ux): add TERRAIN high-contrast theme (noir/blanc/jaune FFCC00)
fix(signature): adaptive canvas resolution via devicePixelRatio + ResizeObserver
feat(photo): PhotoCapture Pro — légendes, chips catégorie, fullscreen, queue offline
refactor(form): decompose NouveauPdP into useFormPdP hook + 5 step components
fix(dashboard): async actionsStats from Supabase + pagination range(0,49)
chore: final verification pass — PWA, TERRAIN theme, offline flow all working
```
