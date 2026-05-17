# Spec — Correction bugs & refonte PDF
**Date :** 2026-05-10
**Approche retenue :** B — Refonte couche export + stabilisation

---

## Contexte

Application PWA mobile-first de gestion des Plans de Prévention (PdP) QHSE.
Stack : React 18 + Vite + Tailwind CSS + Supabase + jsPDF.

Problèmes constatés par l'utilisateur :
- PDF illisible et incomplet (photos manquantes, signatures absentes, pas de logo)
- Pad de signature buggé sur mobile
- Erreurs silencieuses sans feedback utilisateur
- Instabilité du mode offline

---

## Chantiers (dans l'ordre d'exécution)

### 1. Réécriture du SignaturePad

**Fichier :** `src/components/SignaturePad.jsx`

**Problème :** Les coordonnées tactiles ne sont pas recalculées par rapport à la position du canvas dans la page (`getBoundingClientRect()` absent ou mal placé). Sur mobile, le tracé est décalé.

**Corrections :**
- Utiliser `getBoundingClientRect()` sur chaque event `touchmove` pour calculer les coordonnées relatives au canvas
- Ajouter `touch-action: none` sur le canvas pour éviter le scroll parasite pendant la signature
- Unifier le format de sauvegarde : toujours `{ drawing: <dataURL>, nom: <string>, date: <ISO string> }`
- Gérer le cas legacy (string brute) à la lecture uniquement — pas en écriture
- Ajouter un bouton "Effacer" toujours visible (pas juste au hover)
- Valider que le canvas n'est pas vide avant de permettre la sauvegarde

### 2. Photos de l'analyse de risques dans le PDF

**Fichiers :** `src/utils/exportPdf.js`, `src/components/AnalyseRisques.jsx`

**Problème :** Les photos attachées aux questions (`photos_questions`) sont stockées soit en URL Supabase (qui peut expirer ou être soumise à CORS), soit en base64. Le PDF essaie de les charger via `fetch` sans fallback fiable.

**Corrections :**
- À l'upload dans `AnalyseRisques.jsx` : toujours stocker en base64 dans `photos_questions` (pas d'URL externe)
- Dans `exportPdf.js` : lire directement le base64, ne pas tenter de fetch réseau pour les photos de questions
- Ajouter une section "Photos par question" dans le PDF, avec légende (catégorie + numéro de question)
- Limite : max 2 photos par question affichées dans le PDF pour ne pas surcharger

### 3. Refonte complète du PDF

**Fichier :** `src/utils/exportPdf.js` (réécriture totale)

**Style retenu :** A — Institutionnel (en-tête bleu marine `#1e3a5f`, grille structurée, badges colorés)

**Structure du PDF généré :**

```
Page 1 — Page de garde / Résumé
  ┌─────────────────────────────────────────┐
  │ [LOGO]  Nom entreprise   DATE | Réf.   │  ← en-tête bleu #1e3a5f
  ├─────────────────────────────────────────┤
  │ PLAN DE PRÉVENTION                      │
  │ Chantier : [description travaux]        │
  ├──────────────┬──────────────────────────┤
  │ Entreprise   │ Responsable              │
  │ Lieu         │ Intervenants             │
  │ Date travaux │ Contact urgence          │
  ├──────────────┴──────────────────────────┤
  │ SCORE DE RISQUE : 14/25  [ÉLEVÉ]       │
  │ Résultats par catégorie (badges)        │
  └─────────────────────────────────────────┘

Page 2 — Analyse détaillée par catégorie
  - Tableau : Catégorie | Question | Réponse | Observation
  - Non-conformités surlignées en rouge clair

Page 3 — Mesures de prévention
  - Liste numérotée des mesures suggérées + mesures libres

Page 4+ — Photos
  - Photos générales du chantier (2 par ligne)
  - Photos par question (légende : catégorie + question)

Page finale — Signatures
  - Deux colonnes : QHSE | Responsable de site
  - Image de signature + nom + date
  - Pied de page : généré le [date] par [user]
```

**Intégration logo :**
- Logo chargé depuis les paramètres entreprise (Supabase `settings` ou localStorage)
- Format PNG avec transparence, converti en base64 pour jsPDF
- Fallback : initiales de l'entreprise en blanc si pas de logo

**Couleur principale :** configurable via les paramètres, défaut `#1e3a5f`

### 4. Page Paramètres entreprise

**Fichier nouveau :** `src/pages/Settings.jsx`
**Route :** `/settings`
**Accès :** depuis la bottom nav (icône engrenage) ou le header

**Champs :**
- Logo : upload PNG (stocké en base64 dans Supabase table `app_settings` ou localStorage)
- Nom de l'entreprise (requis)
- Adresse (optionnel)
- Téléphone (optionnel)
- Couleur principale PDF : sélecteur parmi 6 couleurs prédéfinies

**Aperçu live :** l'en-tête PDF se met à jour en temps réel avec logo + nom + couleur sélectionnés

**Persistance :**
- Sauvegarde dans Supabase (`app_settings` table, une ligne par `user_id`)
- Fallback localStorage si offline
- Chargé au démarrage de l'app via un contexte `SettingsContext`

**Table Supabase à créer :**
```sql
CREATE TABLE app_settings (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES auth.users(id),
  company_name text,
  company_address text,
  company_phone text,
  company_logo_base64 text,
  pdf_primary_color text DEFAULT '#1e3a5f',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id)
);
```

### 5. Gestion d'erreurs visible (système de toasts)

**Fichier nouveau :** `src/components/Toast.jsx` + `src/contexts/ToastContext.jsx`

**Comportement :**
- Bandeau discret en bas d'écran (au-dessus de la bottom nav)
- Types : `success` (vert), `error` (rouge), `info` (bleu)
- Auto-disparition après 4 secondes, fermeture manuelle possible
- File d'attente : max 3 toasts simultanés

**Remplacement des `catch(e) {}` silencieux dans :**
- `exportPdf.js` : erreur lors de la génération, image non chargée
- `NouveauPdP.jsx` : échec sauvegarde Supabase
- `ListePdP.jsx` : échec chargement des plans
- `DetailPdP.jsx` : échec changement statut, duplication
- `PhotoCapture.jsx` : échec upload photo

### 6. Stabilisation offline

**Fichiers :** `src/utils/offlineStorage.js`, `src/pages/NouveauPdP.jsx`, `src/pages/ListePdP.jsx`

**Corrections :**
- Bandeau persistant orange en haut de l'app quand `navigator.onLine === false`
- Écoute des events `online`/`offline` pour mise à jour en temps réel
- Confirmation avant de quitter `NouveauPdP` si le plan n'a pas été sauvegardé (dialog natif `beforeunload` + state `hasUnsavedChanges`)
- À la reconnexion : toast "Connexion rétablie — synchronisation en cours..." + tentative automatique de synchro des brouillons offline

---

## Architecture des données

**Pas de changement de schéma majeur** sauf l'ajout de `app_settings`.

`photos_questions` : le format passe de `{url, name}` à `{base64, name, questionId}` pour les nouvelles entrées. Lecture compatible avec l'ancien format.

---

## Ce qui ne change PAS dans cette version

- Stack technique (React, Vite, Tailwind, Supabase, jsPDF)
- Formulaire 5 étapes et logique de score de risque
- Dashboard et export CSV
- Système de templates
- Actions correctives

---

## Critères de succès

- Le PDF généré contient : logo, toutes les infos du plan, toutes les photos (chantier + questions), toutes les signatures, les mesures de prévention
- La signature se trace sans décalage sur mobile iOS et Android
- Toute erreur (réseau, export, upload) affiche un message visible à l'utilisateur
- L'app signale clairement le mode offline et protège les données non sauvegardées
- La page Paramètres persiste logo + couleur et ils apparaissent dans le prochain PDF généré
