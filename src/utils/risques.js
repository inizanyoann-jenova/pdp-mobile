// ── Données complètes des catégories de risques ──────────────────────────────

export const CATEGORIES = [
  {
    id: 'acces',
    label: 'Accès & Balisage',
    emoji: '🚧',
    color: '#3B82F6',
    bg: 'rgba(59,130,246,0.12)',
    questions: [
      { id: 'a1', text: 'Les accès au chantier sont-ils clairement identifiés et balisés ?' },
      { id: 'a2', text: 'Les voies de circulation piétons/véhicules sont-elles séparées ?' },
      { id: 'a3', text: 'Les issues de secours et points de rassemblement sont-ils connus ?' },
      { id: 'a4', text: 'La signalisation temporaire est-elle conforme et visible ?' },
      { id: 'a5', text: 'Les zones interdites au public sont-elles sécurisées ?' },
    ]
  },
  {
    id: 'chute',
    label: 'Chutes de hauteur & Plain-pied',
    emoji: '⬇️',
    color: '#EF4444',
    bg: 'rgba(239,68,68,0.12)',
    questions: [
      { id: 'c1', text: 'Les zones de travail en hauteur sont-elles protégées (garde-corps, filets) ?' },
      { id: 'c2', text: 'Les échafaudages sont-ils conformes et réceptionnés ?' },
      { id: 'c3', text: 'Les trémies et ouvertures au sol sont-elles protégées ?' },
      { id: 'c4', text: 'Le sol est-il dégagé, non glissant et sans obstacles ?' },
      { id: 'c5', text: 'Les EPI anti-chute sont-ils disponibles et en bon état ?' },
      { id: 'c6', text: 'Les voies de circulation sont-elles éclairées correctement ?' },
    ]
  },
  {
    id: 'electrique',
    label: 'Risques Électriques',
    emoji: '⚡',
    color: '#F59E0B',
    bg: 'rgba(245,158,11,0.12)',
    questions: [
      { id: 'e1', text: 'Les armoires et coffrets électriques sont-ils fermés à clé ?' },
      { id: 'e2', text: 'Les câbles et rallonges sont-ils en bon état et correctement posés ?' },
      { id: 'e3', text: 'Les zones de présence de réseaux enterrés ont-elles été identifiées (DICT) ?' },
      { id: 'e4', text: 'Les habilitations électriques des intervenants sont-elles valides ?' },
      { id: 'e5', text: 'Les équipements sont-ils reliés à la terre ?' },
    ]
  },
  {
    id: 'incendie',
    label: 'Incendie & Explosion',
    emoji: '🔥',
    color: '#F97316',
    bg: 'rgba(249,115,22,0.12)',
    questions: [
      { id: 'i1', text: 'Les extincteurs sont-ils présents, accessibles et vérifiés ?' },
      { id: 'i2', text: 'Les produits inflammables sont-ils stockés correctement et éloignés des sources de chaleur ?' },
      { id: 'i3', text: 'Un permis de feu est-il requis et délivré pour les travaux par point chaud ?' },
      { id: 'i4', text: 'Les réseaux gaz ont-ils été identifiés et coupés si nécessaire ?' },
      { id: 'i5', text: 'Les consignes incendie sont-elles affichées et connues ?' },
    ]
  },
  {
    id: 'chimique',
    label: 'Risques Chimiques & CMR',
    emoji: '☣️',
    color: '#8B5CF6',
    bg: 'rgba(139,92,246,0.12)',
    questions: [
      { id: 'ch1', text: 'Les FDS (Fiches de Données de Sécurité) sont-elles disponibles sur site ?' },
      { id: 'ch2', text: 'Les produits chimiques sont-ils étiquetés et stockés séparément ?' },
      { id: 'ch3', text: 'La ventilation est-elle suffisante dans les zones de travail confinées ?' },
      { id: 'ch4', text: 'Les EPI chimiques (masques, gants, lunettes) sont-ils adaptés aux produits utilisés ?' },
      { id: 'ch5', text: 'Les déchets chimiques sont-ils gérés selon la réglementation ?' },
    ]
  },
  {
    id: 'mecanique',
    label: 'Engins & Machines',
    emoji: '🏗️',
    color: '#06B6D4',
    bg: 'rgba(6,182,212,0.12)',
    questions: [
      { id: 'm1', text: 'Les engins et machines disposent-ils de leurs documents (CACES, VGP) à jour ?' },
      { id: 'm2', text: "Les zones d'évolution des engins sont-elles balisées ?" },
      { id: 'm3', text: "La présence d'un signaleur est-elle assurée lors des manœuvres ?" },
      { id: 'm4', text: 'Les protections des parties mobiles sont-elles en place ?' },
      { id: 'm5', text: 'La vérification journalière des engins a-t-elle été effectuée ?' },
    ]
  },
  {
    id: 'coactivite',
    label: 'Co-activité & Interférences',
    emoji: '👥',
    color: '#10B981',
    bg: 'rgba(16,185,129,0.12)',
    questions: [
      { id: 'co1', text: 'Le plan de prévention ou PPSPS est-il établi et signé par toutes les entreprises ?' },
      { id: 'co2', text: "Les zones d'intervention de chaque entreprise sont-elles définies ?" },
      { id: 'co3', text: 'Une réunion de coordination a-t-elle été tenue ?' },
      { id: 'co4', text: "Les risques d'interférence entre entreprises ont-ils été identifiés ?" },
      { id: 'co5', text: 'Le responsable de chantier est-il identifié et présent ?' },
    ]
  },
  {
    id: 'meteo',
    label: 'Conditions Météo & Environnement',
    emoji: '🌦️',
    color: '#64748B',
    bg: 'rgba(100,116,139,0.12)',
    questions: [
      { id: 'me1', text: 'Les conditions météo sont-elles compatibles avec les travaux prévus ?' },
      { id: 'me2', text: "En cas d'orage, la procédure de mise à l'abri est-elle connue ?" },
      { id: 'me3', text: 'La chaleur ou le froid extrême nécessite-t-il des mesures spécifiques (hydratation, pauses) ?' },
      { id: 'me4', text: "Le vent ne risque-t-il pas d'affecter la stabilité des équipements ou matériaux ?" },
      { id: 'me5', text: "L'environnement proche est-il dégagé (arbres, fils électriques, riverains) ?" },
    ]
  },
  {
    id: 'epi',
    label: 'EPI & Premiers Secours',
    emoji: '⛑️',
    color: '#EC4899',
    bg: 'rgba(236,72,153,0.12)',
    questions: [
      { id: 'ep1', text: 'Tous les intervenants portent-ils les EPI obligatoires (casque, chaussures, gilet) ?' },
      { id: 'ep2', text: 'Les EPI spécifiques aux travaux sont-ils disponibles et adaptés ?' },
      { id: 'ep3', text: 'Une trousse de premiers secours est-elle accessible et complète ?' },
      { id: 'ep4', text: 'Au moins une personne est-elle formée aux premiers secours (SST) ?' },
      { id: 'ep5', text: 'Les numéros d\'urgence sont-ils affichés (15, 18, 112) ?' },
    ]
  },
];

export const SECTEURS_CHANTIER = [
  { secteur: '🏗️ BTP / Construction', color: '#3B82F6', types: ['Gros œuvre / Maçonnerie', 'Second œuvre / Finitions', 'Charpente / Ossature bois', 'Béton armé / Coffrage', 'Fondations / Micropieux', 'Carrelage / Revêtements'] },
  { secteur: '🔧 Travaux spécialisés', color: '#F97316', types: ['Toiture / Couverture', 'Travaux en hauteur / Échafaudages', 'Étanchéité / Imperméabilisation', 'Façade / Ravalement', 'Isolation thermique / ITE', 'Menuiserie / Serrurerie', 'Peinture / Enduits'] },
  { secteur: '⚡ Réseaux & Fluides',   color: '#F59E0B', types: ['Électricité HT / BT', 'Plomberie / Sanitaire', 'CVC (Chauffage / Ventilation / Clim)', 'Gaz / Réseaux combustibles', 'Fibre optique / Télécom', 'Sprinklage / Protection incendie'] },
  { secteur: '🛣️ Travaux publics',      color: '#10B981', types: ['VRD (Voirie / Réseaux Divers)', 'Terrassement / Déblais', 'Génie civil / Ouvrages d\'art', 'Voirie / Signalisation', 'Assainissement / Collecteur', 'Réseaux souterrains / DICT'] },
  { secteur: '🏭 Industrie & Maintenance', color: '#8B5CF6', types: ['Installation industrielle', 'Maintenance / Entretien industriel', 'Tuyauterie / Process', 'Soudure / Chaudronnerie', 'Levage / Manutention lourde', 'Nettoyage industriel'] },
  { secteur: '💥 Démolition & Désamiantage', color: '#EF4444', types: ['Démolition partielle', 'Démolition totale / Déconstruction', 'Désamiantage / Amiante', 'Déplombage / Plomb', 'Dépollution pyrotechnique', 'Curage / Vidange'] },
  { secteur: '🌿 Environnement & Espaces', color: '#06B6D4', types: ['Espaces verts / Paysage', 'Abattage d\'arbres / Élagage', 'Dépollution de sols', 'Curage de cours d\'eau', 'Travaux en milieu aquatique', 'Géothermie'] },
  { secteur: '🔍 Inspection & Contrôle', color: '#EC4899', types: ['Inspection / Diagnostic', 'Contrôle réglementaire', 'Audit de chantier', 'Travaux de nuit', 'Travaux en espace confiné', 'Autre (préciser)'] },
];

export const TYPES_INTERVENTION = [
  { value: 'neuf',        label: '🆕 Travaux neufs',            desc: 'Construction ou installation nouvelle' },
  { value: 'renovation',  label: '🔨 Rénovation',               desc: 'Réhabilitation d\'existant' },
  { value: 'maintenance', label: '⚙️ Maintenance / Entretien',  desc: 'Opération planifiée de maintenance' },
  { value: 'urgence',     label: '🚨 Urgence / Dépannage',      desc: 'Intervention non planifiée' },
  { value: 'inspection',  label: '🔍 Inspection / Contrôle',    desc: 'Visite de contrôle ou audit' },
  { value: 'demolition',  label: '💥 Démolition',               desc: 'Déconstruction ou dépose' },
];

export const ENVIRONNEMENTS_SITE = [
  { value: 'urbain',      label: '🏙️ Zone urbaine' },
  { value: 'residentiel', label: '🏡 Zone résidentielle' },
  { value: 'industriel',  label: '🏭 Site industriel' },
  { value: 'erp',         label: '🏥 ERP (hôpital, école…)' },
  { value: 'occupe',      label: '👥 Site occupé / en activité' },
  { value: 'seveso',      label: '⚠️ Site SEVESO' },
  { value: 'inondable',   label: '🌊 Zone inondable' },
  { value: 'naturel',     label: '🌿 Zone naturelle / protégée' },
  { value: 'routier',     label: '🚗 Voie de circulation' },
  { value: 'hauteur',     label: '🏔️ Altitude / Zone ventée' },
];

export const METEO_OPTIONS = [
  { value: 'soleil',     label: '☀️ Ensoleillé' },
  { value: 'nuageux',    label: '⛅ Nuageux' },
  { value: 'pluie',      label: '🌧️ Pluvieux' },
  { value: 'vent',       label: '💨 Venteux' },
  { value: 'orage',      label: '⛈️ Orageux' },
  { value: 'brouillard', label: '🌫️ Brouillard' },
  { value: 'chaleur',    label: '🥵 Forte chaleur' },
  { value: 'froid',      label: '🥶 Grand froid' },
];

export const RISQUE_COLORS = {
  faible:   { bg: 'rgba(16,185,129,0.15)',  border: '#10B981', text: '#10B981', label: 'Faible' },
  modere:   { bg: 'rgba(245,158,11,0.15)',  border: '#F59E0B', text: '#F59E0B', label: 'Modéré' },
  eleve:    { bg: 'rgba(239,68,68,0.15)',   border: '#EF4444', text: '#EF4444', label: 'Élevé' },
  critique: { bg: 'rgba(139,92,246,0.15)',  border: '#8B5CF6', text: '#8B5CF6', label: 'Critique' },
};

// Maps keyword substrings (case-insensitive) to risk category IDs
const PRIORITES_PAR_TYPE = {
  'hauteur':      ['chute'],
  'chafaudage':   ['chute'],
  'toiture':      ['chute', 'meteo'],
  'couverture':   ['chute', 'meteo'],
  'lectricit':    ['electrique'],
  'gaz':          ['incendie'],
  'combustible':  ['incendie'],
  'soudure':      ['incendie', 'mecanique'],
  'chaudronnerie':['incendie', 'mecanique'],
  'cvc':          ['incendie', 'chimique'],
  'chauffage':    ['incendie'],
  'ventilation':  ['chimique'],
  'amiante':      ['chimique'],
  'plomb':        ['chimique'],
  'pyrotechnique':['chimique'],
  'chimique':     ['chimique'],
  'dépollution': ['chimique'],
  'levage':       ['mecanique'],
  'manutention':  ['mecanique'],
  'tuyauterie':   ['mecanique', 'incendie'],
  'process':      ['mecanique', 'chimique'],
  'démolition': ['chute', 'mecanique'],
  'déconstruction': ['chute', 'mecanique'],
  'confinement':  ['chimique', 'epi'],
  'confiné': ['chimique', 'epi'],
  'nuit':         ['acces', 'epi'],
  'industri':     ['mecanique', 'chimique'],
  'souterrain':   ['electrique', 'chimique'],
  'dict':         ['electrique'],
};

export function getPrioritizedCategories(typesTravaux = []) {
  const prioritized = new Set();
  for (const type of typesTravaux) {
    const lower = type.toLowerCase();
    for (const [keyword, cats] of Object.entries(PRIORITES_PAR_TYPE)) {
      if (lower.includes(keyword.toLowerCase())) {
        cats.forEach(c => prioritized.add(c));
      }
    }
  }
  return [...prioritized];
}

export function calcScoreResiduel(score, mesuresSuggerees = []) {
  const selected = mesuresSuggerees.filter(m => m.selectionnee);
  const haute = selected.filter(m => m.priorite === 'haute').length;
  const normale = selected.filter(m => m.priorite !== 'haute').length;
  return Math.max(0, score - (haute * 2 + normale));
}

export function calcScore(reponses) {
  const total = Object.values(reponses).length;
  if (total === 0) return 0;
  const nonConformes = Object.values(reponses).filter(r => r === 'non').length;
  const nsps = Object.values(reponses).filter(r => r === 'nsp').length;
  return Math.round(((nonConformes + nsps * 0.5) / total) * 25);
}

export function getNiveauRisque(score) {
  if (score <= 4)  return 'faible';
  if (score <= 9)  return 'modere';
  if (score <= 16) return 'eleve';
  return 'critique';
}
