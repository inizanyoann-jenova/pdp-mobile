# PdP Risk App — v2 Terrain : Design Spec

**Date** : 2026-05-17  
**Branche** : `feat/v2-terrain`  
**Approche** : Sprint unique, commits atomiques, déploiements Vercel continus  
**Stack** : React 18 + Vite + Tailwind + Supabase + Vercel

---

## Contexte & Objectif

Application de gestion de Plans de Prévention (PdP) utilisée sur chantier. La v1 est fonctionnelle (formulaire 5 étapes, offline drafts localStorage, signature pad, export PDF). La v2 vise à la rendre industriellement robuste : vraie PWA offline-first, interface utilisable en plein soleil avec des gants, données QHSE sans risque de perte.

---

## Audit de l'existant — Problèmes à corriger

### Bloquants
| Problème | Fichier | Impact |
|---|---|---|
| `manifest.json` absent (`/public`) | `index.html` | PWA non installable |
| Zéro Service Worker | — | App inutilisable en zone blanche (cold start) |
| Photos offline stockées en base64 localStorage | `PhotoCapture.jsx` | Quota dépassé → perte silencieuse |
| `syncOnReconnect` ne ré-uploade pas les photos base64 | `NouveauPdP.jsx:71` | Photos perdues après reconnexion |

### Dette technique
| Problème | Fichier | Impact |
|---|---|---|
| God Component 663 lignes | `NouveauPdP.jsx` | Impossible à tester, fragile |
| API offlineStorage dupliquée (2 sets de fonctions) | `offlineStorage.js` | Confusion, bugs latents |
| Actions correctives en localStorage uniquement | `offlineStorage.js:63` | Perte données si changement d'appareil |
| Dashboard sans pagination | `Dashboard.jsx:34` | Lent avec 500+ plans |

### UX terrain
| Problème | Fichier | Impact |
|---|---|---|
| Pas de mode haute luminosité | `ThemeContext.jsx` | Illisible en plein soleil |
| SignaturePad résolution fixe 800×200 | `SignaturePad.jsx:161` | Signature floue dans PDF |
| Photos sans légende ni catégorie | `PhotoCapture.jsx` | Pas de contexte QHSE |

---

## Architecture & Décisions Stack

| Décision | Choix | Raison |
|---|---|---|
| Service Worker | `vite-plugin-pwa` + Workbox | Standard Vite, zéro config manuelle |
| Cache SW stratégie | NetworkFirst (API Supabase) + CacheFirst (assets statiques) | API fraîche, UI dispo offline |
| Photo queue offline | `idb` (IndexedDB wrapper) | localStorage trop limité pour blobs binaires |
| Actions correctives | Nouvelle table Supabase `actions_correctives` | Données QHSE = persistence obligatoire |
| offlineStorage | Supprimer alias dupliqués, garder 1 API : `saveDraft`/`getAllDrafts`/`removeDraft` | Clarté |
| NouveauPdP refacto | Hook `useFormPdP` + 5 composants `StepXxx` | Testabilité + lisibilité |
| Inline styles | Migration Tailwind progressive (fichiers touchés seulement) | Ne pas tout casser |

---

## Section 1 — PWA & Offline-First

### 1.1 Service Worker (vite-plugin-pwa)

**Installation** : `npm install -D vite-plugin-pwa`

**Configuration `vite.config.js`** :
```js
VitePWA({
  registerType: 'autoUpdate',
  includeAssets: ['favicon.ico', 'apple-touch-icon.png'],
  manifest: { /* voir 1.2 */ },
  workbox: {
    globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
    runtimeCaching: [
      { urlPattern: /^https:\/\/.*\.supabase\.co\/rest\/.*/, handler: 'NetworkFirst',
        options: { cacheName: 'supabase-api', networkTimeoutSeconds: 5 } },
      { urlPattern: /^https:\/\/.*\.supabase\.co\/storage\/.*/, handler: 'CacheFirst',
        options: { cacheName: 'supabase-storage', expiration: { maxEntries: 100 } } },
    ]
  }
})
```

### 1.2 manifest.json (`/public/manifest.json`)
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
  "icons": [
    { "src": "/icon-192.png", "sizes": "192x192", "type": "image/png" },
    { "src": "/icon-512.png", "sizes": "512x512", "type": "image/png", "purpose": "any maskable" }
  ]
}
```
Icônes à générer depuis le logo existant (Settings).

### 1.3 Queue photo offline (IndexedDB)

**Nouveau fichier** : `src/utils/photoQueue.js`

```
DB: pdp-photo-queue (IndexedDB via idb)
Store: pending_uploads
  { id, planId, fieldType ('photos'|'photos_questions'), questionId?, blob, fileName, mimeType, savedAt }
```

**Flux** :
1. `PhotoCapture` offline → `addToPhotoQueue(blob, planId)` au lieu du base64
2. `syncOnReconnect` (dans `useOfflineSync.js`) → lit la queue → upload Supabase Storage → met à jour le plan avec l'URL → vide la queue
3. Indicateur de badge dans `BottomNav` si queue > 0

### 1.4 Cleanup offlineStorage.js

Supprimer les fonctions alias (`saveDraftLocally`, alias de `saveDraftOffline`). Garder une seule API :
- `saveDraft(draft)` → remplace `saveDraftOffline` + `saveDraftLocally`
- `getAllDrafts()` → inchangé
- `removeDraft(id)` → inchangé
- `countDrafts()` → inchangé

Mettre à jour tous les imports dans les 4 fichiers concernés :
- `src/pages/NouveauPdP.jsx` : `saveDraftOffline` → `saveDraft`, `getAllDrafts` OK, `removeDraft` OK
- `src/hooks/useOfflineSync.js` (nouveau) : utilise `getAllDrafts` + `removeDraft`
- `src/pages/ListePdP.jsx` : vérifier si import `offlineStorage`
- `src/pages/Dashboard.jsx` : `getAllActionsStats` — inchangée (fonction stats locale)

---

## Section 2 — Migration Supabase : actions_correctives

### 2.1 Nouvelle table

```sql
CREATE TABLE IF NOT EXISTS actions_correctives (
  id           uuid    DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at   timestamptz DEFAULT now(),
  updated_at   timestamptz DEFAULT now(),
  plan_id      uuid    NOT NULL REFERENCES plans_prevention(id) ON DELETE CASCADE,
  description  text    NOT NULL,
  responsable  text,
  echeance     date,
  statut       text    DEFAULT 'todo' CHECK (statut IN ('todo', 'doing', 'done')),
  question_id  text,
  created_by   uuid    REFERENCES auth.users(id) ON DELETE SET NULL
);

ALTER TABLE actions_correctives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "CRUD ses propres actions" ON actions_correctives
  FOR ALL USING (auth.uid() = created_by);

CREATE TRIGGER trg_actions_updated_at
  BEFORE UPDATE ON actions_correctives
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

### 2.2 Migration des données localStorage existantes

Au premier lancement après déploiement : si `localStorage['pdp_actions_correctives']` existe → upserter les actions dans Supabase → vider le localStorage. Migration one-shot dans `App.jsx` `useEffect`.

**Attention** : les actions localStorage n'ont pas de `created_by`. Lors de la migration, injecter `created_by: session.user.id` depuis la session active. Si aucune session (improbable ici), ignorer les actions orphelines.

### 2.3 actionsService.js

Réécrire `src/utils/actionsService.js` pour appeler Supabase au lieu de localStorage. Interface identique pour ne pas casser `DetailPdP`.

---

## Section 3 — Mode TERRAIN ☀️

### 3.1 Thème : Contraste Maximal (option C validée)

**3ème thème** dans `ThemeContext.jsx`, activé par un bouton ☀️ dédié (toggle cyclique : dark → light → terrain → dark).

```js
const TERRAIN = {
  name:     'terrain',
  bg:       '#FFFEF5',      // crème très légèrement chaud — moins d'éblouissement que blanc pur
  bgCard:   '#FFFFFF',
  bgCard2:  '#F5F5F0',
  bgCard3:  '#EEEDE8',
  border:   '#000000',      // bordures noires épaisses
  border2:  '#333333',
  text1:    '#000000',      // texte noir pur
  text2:    '#111111',
  text3:    '#222222',
  text4:    '#444444',
  text5:    '#666666',
  inputBg:  '#FFFFFF',
  iconBg:   '#000000',
  accent:   '#FFCC00',      // jaune sécurité pour CTA
  accentText: '#000000',    // texte sur fond jaune
};
```

**Règles UX terrain spécifiques** (appliquées quand `theme.name === 'terrain'`) :
- `min-height` des boutons : **64px** (utilisation avec gants)
- `font-size` des labels : **16px** minimum (vs 11px actuel)
- `border-width` des inputs : **3px** (vs 1.5px)
- Bouton CTA principal : fond `#FFCC00`, texte `#000000`, `font-weight: 900`
- Header : fond `#000000`, texte `#FFFFFF` + accent `#FFCC00`
- Step progress bar : **8px** hauteur, couleur `#FFCC00`

**Persistance** : `localStorage.setItem('pdp_theme', 'terrain')`

---

## Section 4 — SignaturePad Adaptatif

**Problème** : canvas `width=800 height=200` fixes → scaling incohérent → flou dans PDF.

**Fix dans `SignaturePad.jsx`** :

```js
// À l'init et au resize — appelé via useEffect + ResizeObserver
function resizeCanvas(canvas) {
  const rect = canvas.getBoundingClientRect();
  const dpr  = window.devicePixelRatio || 1;
  canvas.width  = rect.width  * dpr;
  canvas.height = rect.height * dpr;
  const ctx = canvas.getContext('2d');
  ctx.scale(dpr, dpr);
  // strokeStyle est configuré à chaque beginPath (pas dans resizeCanvas)
  ctx.lineWidth = 2.5;
  ctx.lineCap   = 'round';
  ctx.lineJoin  = 'round';
}
```

- `strokeStyle` lors du dessin : `theme.name === 'terrain' ? '#000000' : '#1e293b'` (lu depuis `useTheme()` dans le composant)
- Appel à l'init via `useEffect` + `ResizeObserver` sur l'élément canvas
- Recharger la signature existante après resize (re-draw depuis `parsed.drawing`)
- La signature exportée via `toDataURL` sera nette à n'importe quelle densité d'écran

---

## Section 5 — PhotoCapture Pro

### 5.1 Nouveau modèle de données photo

```js
// Ancien
{ url: string, source: 'storage'|'local', name: string }

// Nouveau (rétrocompatible — champs optionnels)
{
  url:      string,
  source:   'storage' | 'local' | 'queued',  // 'queued' = dans IndexedDB, pas encore uploadé
  name:     string,
  legende:  string,   // nouveau — légende libre
  categorie: string,  // nouveau — 'zone_risque'|'epi'|'acces'|'materiel'|'autre'
  queueId:  string,   // si source === 'queued'
}
```

### 5.2 Composant `PhotoCapture.jsx` — nouvelles fonctionnalités

- **Liste verticale** (au lieu de grille 3×N) : chaque photo = une carte avec aperçu 16:9 + légende + chips catégorie
- **Chips catégorie** : Zone risque / EPI / Accès / Matériel / Autre (1 seul actif par photo)
- **Légende** : input texte inline sous la photo
- **Prévisualisation plein écran** : `<dialog>` natif HTML avec l'image en plein écran + fermeture tap
- **Compteur** : bandeau vert si toutes les photos ont une légende et une catégorie
- **Offline** : si `!navigator.onLine`, stocker blob dans IndexedDB + afficher badge "⏳ En attente d'upload"

---

## Section 6 — Décomposition NouveauPdP

### 6.1 Nouveau hook `useFormPdP.js`

```js
// src/hooks/useFormPdP.js
export function useFormPdP({ initialData, editId, session }) {
  // État: form, step, swipeDir, saving, saved, error, hasUnsavedChanges
  // Fonctions: setField, handleNext, handlePrev, handleSave, canNext
  // Calculs: score, scoreResiduel, niveau, nInfo (useMemo)
  return { form, step, swipeDir, saving, saved, error, setField,
           handleNext, handlePrev, handleSave, canNext, score, scoreResiduel, niveau, nInfo }
}
```

### 6.2 Nouveau hook `useOfflineSync.js`

Extrait de `NouveauPdP.jsx:70-92`. Gère :
- `window.addEventListener('online', syncOnReconnect)`
- Sync des drafts texte (Supabase upsert)
- Sync de la queue photo (IndexedDB → Supabase Storage)

### 6.3 Composants steps (`src/components/steps/`)

| Fichier | Contenu actuel dans NouveauPdP | Lignes estimées |
|---|---|---|
| `StepInfos.jsx` | `step === 0` (lignes 301–468) | ~80 |
| `StepPhotos.jsx` | `step === 1` (lignes 470–481) | ~20 |
| `StepAnalyse.jsx` | `step === 2` (lignes 483–515) | ~40 |
| `StepPrevention.jsx` | `step === 3` (lignes 517–601) | ~90 |
| `StepSignatures.jsx` | `step === 4` (lignes 604–632) | ~40 |

### 6.4 NouveauPdP.jsx après refacto

Rôle unique : orchestration. Contenu restant :
- Import des 5 `StepXxx` + hooks
- Header + step dots + footer (Suivant / Sauvegarder)
- `onTouchStart`/`onTouchEnd` swipe
- Rendu conditionnel `{step === N && <StepXxx ... />}`
- ~120 lignes (vs 663 actuelles)

---

## Section 7 — Dashboard pagination

`src/pages/Dashboard.jsx` : ajouter `.range(0, 49)` sur la requête initiale + bouton "Charger plus". Les stats QHSE (scores, niveaux) s'appuient sur les 50 derniers plans — suffisant pour la vue terrain quotidienne. La vue liste (`ListePdP`) garde sa propre pagination.

---

## Ordre d'implémentation (Sprint unique)

| # | Tâche | Fichiers | Durée est. |
|---|---|---|---|
| 1 | `manifest.json` + icônes PWA | `/public/manifest.json`, `/public/icon-*.png` | 30 min |
| 2 | `vite-plugin-pwa` + SW config | `vite.config.js`, `src/main.jsx` | 45 min |
| 3 | `photoQueue.js` (IndexedDB) | `src/utils/photoQueue.js` | 1h |
| 4 | Migration Supabase actions_correctives | `supabase_migration.sql`, `actionsService.js` | 45 min |
| 5 | Cleanup `offlineStorage.js` | `src/utils/offlineStorage.js` + imports | 30 min |
| 6 | `useOfflineSync.js` (extrait + queue photo) | `src/hooks/useOfflineSync.js` | 30 min |
| 7 | Thème TERRAIN dans `ThemeContext.jsx` | `src/contexts/ThemeContext.jsx`, `src/index.css` | 1h |
| 8 | `SignaturePad.jsx` résolution adaptative | `src/components/SignaturePad.jsx` | 30 min |
| 9 | `PhotoCapture.jsx` version Pro | `src/components/PhotoCapture.jsx` | 1h30 |
| 10 | Décomposition `NouveauPdP.jsx` | `src/hooks/useFormPdP.js`, `src/components/steps/*`, `src/pages/NouveauPdP.jsx` | 1h30 |
| 11 | Dashboard pagination | `src/pages/Dashboard.jsx` | 30 min |
| 12 | Tests + vérification build Vercel | — | 30 min |

**Total estimé : ~9h de travail concentré**

---

## Contraintes & Règles

- Ne pas modifier `EditPdP.jsx` — il passe `initialData` + `editId` à `NouveauPdP`, ce contrat est préservé
- `DetailPdP.jsx` continue d'appeler `actionsService` avec la même interface — seul l'implémentation change
- Chaque commit doit builder sans erreur (`npm run build`) avant push
- Pas de breaking change sur le schéma existant de `plans_prevention` — uniquement des ajouts
- Rétrocompatibilité des photos : l'ancien format `{url, source, name}` reste valide (champs nouveaux optionnels)
