# Spec — Export PDF Optimal (Fiche de Visite Préalable)
**Date :** 2026-05-17
**Approche retenue :** A — Refonte ciblée de `exportPdf.js` (jsPDF, sans dépendance supplémentaire)

---

## Contexte

Application PWA mobile-first de gestion des Plans de Prévention (PdP) QHSE.
Stack : React 18 + Vite + Tailwind CSS + Supabase + jsPDF.

**Usage réel :** L'utilisateur est QHSE/sous-traitant. Il se rend sur les chantiers en visite préalable pour identifier les dangers auxquels ses salariés seront exposés. Il fait signer le responsable de site pour acte de prise en compte. Ce n'est pas un PDP complet d'entreprise — c'est une **fiche de visite préalable + identification des risques**, officielle mais rapide à produire.

**Problème actuel :** Le PDF généré s'étale sur 6–8 pages, affiche toutes les questions (même les conformes), sépare les photos en pages dédiées, et ne donne pas de vision synthétique claire. Il est trop verbeux pour une utilisation terrain.

**Objectif :** PDF 2–3 pages max, institutionnel, signable par le responsable de site, lisible d'un coup d'œil.

---

## Structure du document PDF

### Page 1 — Identification & Résumé

**En-tête (38mm, couleur primaire configurable) :**
- Logo entreprise à gauche (28×28mm) ou initiales en blanc si absent
- Titre `FICHE DE VISITE PRÉALABLE — IDENTIFICATION DES RISQUES`
- Nom de l'entreprise + date de génération
- Référence auto `PDP-YYYYMMDD-[ID tronqué]` en haut à droite

**Bloc chantier (grille 2 colonnes) :**
- Chantier / Lieu
- Date de visite
- Type d'intervention
- Responsable de site
- Intervenants prévus
- Contact urgence
- Description des travaux prévus (texte libre, max 3 lignes)

**Bloc résumé risques :**
- Badge niveau de risque global coloré (FAIBLE / MODÉRÉ / ÉLEVÉ / CRITIQUE)
- Score chiffré (ex: 14/25)
- Compteurs : ✓ conformes / ✗ non-conformes / ? à vérifier
- Mini-barres de progression par catégorie (2 colonnes, hauteur 4mm)
  → Afficher seulement les catégories avec au moins 1 réponse

---

### Page 2 — Risques Identifiés & Mesures de Prévention

**Tableau synthétique des points d'attention :**

Colonnes :
| Colonne | Largeur | Contenu |
|---|---|---|
| Catégorie | 30mm | Pastille couleur + libellé catégorie tronqué |
| Risque identifié | 70mm | Texte question, max 2 lignes |
| Niveau | 18mm | Badge ●NON (rouge) ou ?NSP (amber), centré |
| Mesure de prévention | 64mm | Mesure suggérée ou mesure libre associée |

Règles de construction :
- 1 ligne par question répondue NON ou NSP
- Jointure automatique : chaque question NON/NSP est associée à la mesure de prévention sélectionnée du même thème (via `mesures_suggerees` filtrées par catégorie)
- Si aucune mesure associée : cellule "À définir" en italique amber
- Si 0 points d'attention : bloc vert pleine largeur "✓ Aucun point critique identifié lors de cette visite"
- Observation de question (`observations_questions[id]`) affichée en italique sous la ligne si renseignée
- Hauteur ligne : 10mm standard, 16mm si observation présente

**Mesures complémentaires libres :**
- Si `pdp.mesures_prevention` est renseigné : bloc gris clair avec titre "Mesures complémentaires" + texte libre (max 300 caractères)

**Photos inline (si présentes, max 4) :**
- Grille 2 colonnes, 55×40mm par photo
- Légende sous chaque photo (nom ou "Photo N")
- Si plus de 4 photos : afficher les 4 premières + mention "(+N autres non affichées)"
- Si les photos + le tableau dépassent la page : les photos passent en début de page 3 avant les signatures

---

### Page 3 (ou 4 si débordement photos) — Engagements & Signatures

**Texte d'engagement standardisé (italique, 8pt, centré) :**
> "Les soussignés reconnaissent avoir procédé à une visite préalable du chantier, identifié les risques listés ci-dessus et s'engagent à faire respecter les mesures de prévention définies avant et pendant l'exécution des travaux."

**Deux blocs signature côte à côte :**

| Bloc gauche | Bloc droit |
|---|---|
| DONNEUR D'ORDRE / QHSE | RESPONSABLE DE SITE |
| (nom entreprise depuis settings) | (entreprise extérieure du plan) |
| Nom : `pdp.responsable` | Nom : (saisi dans la signature) |
| Fonction : Responsable QHSE | Fonction : Responsable de site |
| Zone signature (image ou `[ Non signé ]`) | Zone signature (image ou `[ Non signé ]`) |
| Date | Date |

Dimensions bloc signature : `sigW = (inner - 8) / 2`, hauteur 80mm

**Pied de page récap (fond couleur primaire) :**
- Score · Nb points d'attention · Nb mesures retenues · Généré le [date]

---

### En-tête et pied de page communs (toutes pages)

**En-tête :** identique à la page 1 (hauteur 38mm)
**Pied de page :**
- Ligne de séparation
- Gauche : `[Nom entreprise] — Document confidentiel`
- Droite : `Page N / Total`

---

## Architecture technique

### Fichier modifié : `src/utils/exportPdf.js`

Réécriture complète. La fonction `exportPdP(pdp, options, settings)` est découpée en sous-fonctions pures :

```
exportPdP(pdp, { returnBlob }, settings)
  ├── buildAttentionPoints(pdp)     → calcule les lignes du tableau
  ├── renderPage1(doc, pdp, ...)    → page de garde + résumé
  ├── renderPage2(doc, pdp, ...)    → tableau risques + photos
  ├── renderPage3(doc, pdp, ...)    → signatures + récap
  ├── addPageHeader(doc, ...)       → en-tête commun
  └── addPageFooter(doc, ...)       → pied de page commun
```

**`buildAttentionPoints(pdp)` :**
```js
// Retourne un tableau de :
{
  categoryLabel: string,
  categoryColor: string,
  questionText: string,
  reponse: 'non' | 'nsp',
  observation: string | null,
  mesureText: string | null,   // issue de mesures_suggerees ou mesures_prevention
}
```

### Fichier non modifié
- `DetailPdP.jsx` — le bouton export appelle `exportPdP(pdp, {}, settings)` sans changement
- Aucun autre fichier modifié

---

## Palette couleurs

| Élément | Couleur RGB |
|---|---|
| Fond page | `[245, 247, 250]` |
| Texte principal | `[15, 23, 42]` |
| Texte secondaire | `[100, 116, 139]` |
| Bordure carte | `[226, 232, 240]` |
| NON-conforme (bg) | `[254, 226, 226]` |
| NON-conforme (texte) | `[239, 68, 68]` |
| À vérifier (bg) | `[254, 243, 199]` |
| À vérifier (texte) | `[245, 158, 11]` |
| Conforme / mesure (bg) | `[220, 252, 231]` |
| Conforme / mesure (texte) | `[16, 185, 129]` |
| Critique (texte) | `[124, 58, 237]` |

---

## Comportements aux limites

| Situation | Comportement |
|---|---|
| 0 risques non-conformes | Page 2 = bloc vert "Aucun point critique" |
| Beaucoup de risques (> 15 lignes) | Pagination automatique, en-tête répété |
| 0 photos | Page 2 sans section photos |
| > 4 photos | Afficher 4 premières + "(+N autres)" |
| Photos overflow | Photos repoussées en page 3, signatures en page 4 |
| Pas de signature | Bloc `[ Non signé ]` gris clair |
| Pas de logo | Initiales entreprise en blanc dans l'en-tête |
| Pas de settings | Défauts : couleur `#1e3a5f`, pas de logo, pas de nom |

---

## Ce qui ne change PAS

- Stack technique (React, Vite, Tailwind, Supabase, jsPDF)
- Interface utilisateur (formulaire 5 étapes, bouton export dans DetailPdP)
- Logique de score et de calcul des risques (`risques.js`)
- Données stockées en base (schéma Supabase inchangé)
- Export CSV
- Actions correctives (non incluses dans le PDF — trop détaillées pour ce format)

---

## Critères de succès

- Le PDF généré fait 2–3 pages (4 au maximum si beaucoup de photos)
- Page 1 lisible d'un coup d'œil : chantier + niveau de risque global
- Page 2 : tableau synthétique — 1 ligne = 1 risque + sa mesure
- Page 3 : signatures propres des deux parties
- Aucune régression sur le comportement existant (returnBlob, logo, couleur primaire)
- Fonctionne offline (pas de fetch réseau dans le chemin critique)
