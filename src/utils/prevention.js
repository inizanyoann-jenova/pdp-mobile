// ── Mesures de prévention déduites par question ───────────────────────────────
// Pour chaque question ayant réponse "non" ou "nsp", on suggère des mesures adaptées.

export const MESURES_PAR_QUESTION = {
  // ── Accès & Balisage ──────────────────────────────────────────────────────
  a1: [
    'Installer une signalisation de chantier conforme (panneaux A14, cônes, ruban de balisage)',
    'Délimiter le périmètre de chantier avec des clôtures ou palissades',
    'Désigner un responsable de balisage et vérifier la signalisation chaque matin',
  ],
  a2: [
    'Créer des voies piétons séparées avec barrières Nadar ou cloisons de chantier',
    'Matérialiser les passages piétons par un marquage au sol bicolore',
    'Installer des miroirs de sécurité aux croisements voies/piétons',
    'Limiter la vitesse des engins à 10 km/h dans la zone de co-présence',
  ],
  a3: [
    'Afficher le plan d\'évacuation à l\'entrée du chantier et à chaque niveau',
    'Organiser un exercice d\'évacuation avec les intervenants en début de chantier',
    'Désigner un responsable de rassemblement identifié par un gilet spécifique',
    'Matérialiser les issues de secours par un fléchage lumineux ou photoluminescent',
  ],
  a4: [
    'Remplacer ou corriger immédiatement la signalisation non conforme ou illisible',
    'Réaliser une inspection quotidienne de la signalisation temporaire',
    'Utiliser des panneaux homologués (norme NF P98-xxx) adaptés aux conditions météo',
  ],
  a5: [
    'Installer des clôtures H≥2m avec portillon à fermeture automatique',
    'Apposer des panneaux "Accès interdit au public" et "Chantier en cours"',
    'Prévoir un contrôle d\'accès (badge, vigile ou cadenas) pour les zones dangereuses',
  ],

  // ── Chutes de hauteur & Plain-pied ───────────────────────────────────────
  c1: [
    'Installer des garde-corps réglementaires (H≥1m, lisse haute + lisse basse + plinthe) sur tous les bords libres',
    'Mettre en place des filets de sécurité sous les zones de travaux en hauteur',
    'Utiliser des plateformes de travail collectif (échafaudages) plutôt que des échelles',
  ],
  c2: [
    'Faire réceptionner l\'échafaudage par une personne compétente avant utilisation (fiche de réception)',
    'Vérifier quotidiennement l\'état des échafaudages (ancrage, planchers, garde-corps)',
    'Mettre en place un système de condamnation visible "Accès interdit - Échafaudage non réceptionné"',
    'Faire vérifier les échafaudages par un organisme agréé si hauteur > 24m',
  ],
  c3: [
    'Condamner toutes les ouvertures au sol par des plaques rigides solidarisées ou des garde-corps adaptés',
    'Marquer les trémies à l\'aide de bandes rouge/blanc et panneaux d\'avertissement',
    'Ne jamais retirer une protection sans en mettre immédiatement une autre',
  ],
  c4: [
    'Nettoyer et dégager les voies de circulation en début et fin de journée',
    'Poser des tapis anti-dérapants dans les zones humides ou boueuses',
    'Assurer un éclairage minimal de 40 lux sur les voies de circulation',
    'Interdire le stockage de matériaux sur les voies de passage',
  ],
  c5: [
    'Distribuer et vérifier les EPI anti-chute (harnais, longe, antichute à rappel) avant chaque accès en hauteur',
    'Former les intervenants à l\'utilisation correcte des EPI anti-chute (port du harnais, points d\'ancrage)',
    'Inspecter visuellement les harnais et longes avant chaque utilisation',
    'Remplacer tout EPI endommagé ou ayant subi une chute arrêtée',
  ],
  c6: [
    'Installer un éclairage temporaire de chantier (projecteurs LED) dans les zones sombres',
    'Assurer un niveau d\'éclairement ≥ 40 lux sur les voies, 120 lux sur les postes de travail',
    'Vérifier quotidiennement le fonctionnement de l\'éclairage de sécurité',
  ],

  // ── Risques Électriques ───────────────────────────────────────────────────
  e1: [
    'Cadenasser et condamner toutes les armoires électriques non utilisées par les intervenants',
    'Apposer des étiquettes "DANGER - Haute tension" sur les coffrets accessibles',
    'Remettre les clés des armoires uniquement aux habilités électriques désignés',
  ],
  e2: [
    'Remplacer immédiatement tout câble dont la gaine est endommagée',
    'Protéger les câbles au sol par des protège-câbles ou gaines PVC dans les zones de passage',
    'Ne pas dépasser la longueur ou la puissance nominale des rallonges électriques',
    'Vérifier visuellement les câbles et prises en début de chantier',
  ],
  e3: [
    'Effectuer une Déclaration d\'Intention de Commencement de Travaux (DICT) et obtenir les plans de réseaux',
    'Procéder à un repérage des réseaux enterrés par géoradar ou marquage terrain avant tout terrassement',
    'Conserver les relevés de réseaux sur le chantier et former les conducteurs d\'engins',
    'Baliser les zones de présence de réseaux enterrés',
  ],
  e4: [
    'Vérifier et archiver les titres d\'habilitation électrique de chaque intervenant (B0, B1, B2, BR, BC...)',
    'Interdire formellement les travaux électriques aux non-habilités',
    'Organiser une mise à niveau habilitation si expirée avant le début des travaux',
  ],
  e5: [
    'Vérifier la continuité des liaisons équipotentielles et de mise à la terre',
    'Utiliser un vérificateur de prise de terre avant chaque utilisation d\'outil électrique',
    'Connecter systématiquement les masses métalliques à la prise de terre du tableau de chantier',
  ],

  // ── Incendie & Explosion ──────────────────────────────────────────────────
  i1: [
    'Positionner des extincteurs appropriés (6L poudre ABC ou CO2) à moins de 15m de chaque poste de travail',
    'Vérifier la date de vérification annuelle de chaque extincteur',
    'Former les intervenants à l\'utilisation des extincteurs (exercice pratique)',
    'Ne pas obstruer l\'accès aux extincteurs',
  ],
  i2: [
    'Stocker les produits inflammables dans une armoire de sécurité ventilée ou un local dédié',
    'Éloigner les stocks d\'au moins 5m des sources de chaleur, flammes et étincelles',
    'Limiter les quantités de produits sur le chantier au strict nécessaire de la journée',
    'Interdire de fumer dans les zones de stockage et à proximité (signalisation)',
  ],
  i3: [
    'Rédiger et délivrer un permis de feu avant tout travail par points chauds (soudure, meulage, chalumeau)',
    'Désigner un guetteur incendie pendant et 1h après la fin des travaux par point chaud',
    'Préparer le poste (retrait des matières combustibles sur 5m, arrosage si nécessaire)',
    'Disposer d\'un extincteur opérationnel à portée de main sur le poste',
  ],
  i4: [
    'Faire identifier et cartographier les réseaux gaz par le gestionnaire avant travaux',
    'Couper et consigner les alimentations gaz dans la zone de travaux',
    'Utiliser un détecteur de gaz portable en zone confinée ou à proximité de canalisations',
    'Ne reprendre les travaux qu\'après vérification d\'absence de fuite',
  ],
  i5: [
    'Afficher les consignes incendie à chaque entrée de zone de travail',
    'Communiquer les numéros d\'urgence (18, 112) et le point de rassemblement à chaque intervenant',
    'Réaliser une présentation des consignes incendie en réunion de démarrage',
  ],

  // ── Risques Chimiques & CMR ───────────────────────────────────────────────
  ch1: [
    'Rassembler et tenir à jour sur site les FDS de tous les produits chimiques utilisés',
    'Former les intervenants à la lecture et à l\'utilisation des FDS',
    'Créer un classeur "FDS" accessible à tous sur le chantier',
  ],
  ch2: [
    'Étiqueter tous les récipients avec le nom du produit et les pictogrammes de danger GHS',
    'Stocker les produits chimiques dans des armoires dédiées, séparées par famille (comburant / inflammable / corrosif)',
    'Ne jamais transvaser dans des contenants alimentaires',
    'Réaliser un inventaire des produits chimiques présents sur chantier',
  ],
  ch3: [
    'Assurer une ventilation naturelle ou forcée (≥6 vol/h) dans les espaces confinés',
    'Mesurer la qualité de l\'air avant et pendant les travaux en espace confiné (O2, CO, H2S, LEL)',
    'Arrêter les travaux si les valeurs dépassent les VME/VLE',
    'Utiliser des appareils respiratoires isolants (ARI) si ventilation insuffisante',
  ],
  ch4: [
    'Sélectionner les EPI chimiques en fonction des FDS de chaque produit (type de gants, masque FFP3 ou A2/P3, lunettes)',
    'Vérifier l\'adéquation et l\'état des EPI chimiques avant chaque utilisation',
    'Former les intervenants au bon port et à l\'entretien des EPI chimiques',
    'Disposer d\'un point de lavage oculaire et de douche de sécurité à proximité',
  ],
  ch5: [
    'Trier et stocker les déchets chimiques dans des contenants étanches et étiquetés',
    'Faire évacuer les déchets par un prestataire agréé (bordereau de suivi des déchets dangereux)',
    'Ne jamais mélanger des déchets chimiques incompatibles',
    'Tenir un registre des déchets dangereux produits',
  ],

  // ── Engins & Machines ─────────────────────────────────────────────────────
  m1: [
    'Vérifier et archiver les CACES et VGP (Vérification Générale Périodique) de chaque engin avant emploi',
    'Interdire la conduite des engins aux personnes non certifiées',
    'Afficher les dates de validité des CACES et VGP sur chaque engin',
  ],
  m2: [
    'Délimiter les zones d\'évolution des engins par des barrières physiques ou du marquage au sol',
    'Définir et afficher un plan de circulation des engins sur le chantier',
    'Séparer physiquement les zones piétons et les zones engins',
  ],
  m3: [
    'Désigner un signaleur formé (gilet haute visibilité spécifique) pour chaque manœuvre',
    'Former les signaleurs au code gestuel normalisé (NF EN ISO 11228-3)',
    'Interdire toute manœuvre en marche arrière sans signaleur',
    'Équiper les engins de klaxon de recul sonore et d\'une caméra de recul',
  ],
  m4: [
    'Vérifier la présence et l\'état des protections des parties mobiles avant la mise en route',
    'Consigner l\'engin avant toute intervention de maintenance (LOTO - Lockout/Tagout)',
    'Interdire de retirer les protections machines pendant le fonctionnement',
  ],
  m5: [
    'Réaliser et documenter la vérification journalière avant mise en service (tour de l\'engin)',
    'Utiliser une check-list de vérification journalière pour chaque engin',
    'Signaler et immobiliser tout engin présentant une défaillance',
  ],

  // ── Co-activité & Interférences ───────────────────────────────────────────
  co1: [
    'Établir et faire signer un Plan de Prévention (PP) avant démarrage si > 400h ou travaux dangereux',
    'Rédiger un PPSPS pour les chantiers de BTP relevant du Code du Travail',
    'Organiser une réunion de démarrage de chantier avec toutes les entreprises intervenantes',
  ],
  co2: [
    'Matérialiser les zones d\'intervention de chaque entreprise sur un plan de masse',
    'Instaurer un système de permis de pénétration pour les zones à risque',
    'Définir des horaires d\'intervention décalés pour éviter les co-activités dangereuses',
  ],
  co3: [
    'Planifier une réunion de coordination hebdomadaire (ou à chaque changement de phasage)',
    'Rédiger un compte-rendu de coordination distribué à tous les chefs d\'équipe',
    'Désigner un coordonnateur SPS (Sécurité Protection Santé) si requis',
  ],
  co4: [
    'Réaliser une analyse des interférences entre entreprises avec matrice des risques croisés',
    'Définir des zones tampon entre les activités incompatibles',
    'Mettre en place des procédures de communication inter-entreprises (radio, application)',
  ],
  co5: [
    'Désigner un responsable de chantier avec délégation de pouvoir formalisée',
    'Afficher les coordonnées du responsable de chantier à l\'entrée',
    'Organiser un point quotidien de 10 min avec les chefs d\'équipe',
  ],

  // ── Conditions Météo & Environnement ──────────────────────────────────────
  me1: [
    'Consulter les bulletins météo locaux (météo.fr) avant chaque journée de travail',
    'Définir les seuils d\'alerte météo entraînant l\'arrêt des travaux (vent >60km/h, orage, verglas)',
    'Adapter le planning d\'exécution en fonction des prévisions météo',
  ],
  me2: [
    'Afficher la procédure d\'évacuation en cas d\'orage dans chaque zone de travail en hauteur',
    'Former les chefs d\'équipe au déclenchement de l\'alerte et à l\'évacuation',
    'Désigner un local refuge accessible en moins de 5 minutes',
    'Équiper le chantier d\'un dispositif d\'alerte orage (alarme sonore ou visuelle)',
  ],
  me3: [
    'Mettre à disposition des fontaines à eau fraîche (en période de chaleur) ou des abris chauffés (grand froid)',
    'Prévoir des pauses régulières à l\'ombre/au chaud : 15min toutes les 2h minimum en période extrême',
    'Former les encadrants à la reconnaissance des signes de coup de chaleur ou d\'hypothermie',
    'Adapter les horaires de travail (travail tôt le matin en période de canicule)',
  ],
  me4: [
    'Arrêter les travaux en hauteur si le vent dépasse 60 km/h (Beaufort 7)',
    'Sécuriser les matériaux légers et les bâches contre le vent',
    'Amarrer ou rentrer tout équipement ou matériau susceptible d\'être déplacé par le vent',
  ],
  me5: [
    'Élaguer ou écarter les branches susceptibles de tomber sur la zone de travail',
    'Contacter le gestionnaire de réseaux électriques aériens pour obtenir une distance de sécurité',
    'Informer les riverains des travaux et des risques associés',
    'Baliser la zone de chute potentielle d\'objets en bordure de chantier',
  ],

  // ── EPI & Premiers Secours ────────────────────────────────────────────────
  ep1: [
    'Distribuer les EPI obligatoires (casque, chaussures de sécurité S3, gilet HV) avant accès au chantier',
    'Refuser l\'accès à la zone à tout intervenant sans EPI réglementaires',
    'Afficher la liste des EPI obligatoires à l\'entrée du chantier',
    'Remplacer immédiatement tout EPI endommagé',
  ],
  ep2: [
    'Réaliser une analyse des risques spécifiques et définir les EPI adaptés (harnais, masque, gants anti-coupure...)',
    'Vérifier que les EPI sont certifiés CE et adaptés aux risques identifiés',
    'Former les intervenants au bon port des EPI spécifiques',
  ],
  ep3: [
    'Positionner une trousse de premiers secours complète à moins de 100m de chaque zone de travail',
    'Vérifier et renouveler le contenu de la trousse mensuellement',
    'Afficher l\'inventaire de la trousse et les procédures d\'utilisation',
  ],
  ep4: [
    'S\'assurer qu\'au moins un Sauveteur Secouriste du Travail (SST) est présent sur le chantier',
    'Afficher la liste des SST avec leurs coordonnées',
    'Organiser une session de formation SST pour le chantier si aucun n\'est présent',
  ],
  ep5: [
    'Afficher à chaque entrée de chantier et sur les panneaux d\'information les numéros : 15 (SAMU), 18 (Pompiers), 112 (Urgences européen), 17 (Police)',
    'Communiquer l\'adresse précise du chantier et le numéro de rue à tous les intervenants pour guider les secours',
    'Indiquer le chemin d\'accès aux secours sur le plan de chantier',
  ],
};

// ── Génère la liste des mesures suggérées à partir des réponses ───────────────
export function genererMesuresSuggerees(reponses) {
  const suggestions = [];
  Object.entries(reponses).forEach(([qId, reponse]) => {
    if ((reponse === 'non' || reponse === 'nsp') && MESURES_PAR_QUESTION[qId]) {
      const mesures = MESURES_PAR_QUESTION[qId];
      mesures.forEach(mesure => {
        if (!suggestions.find(s => s.mesure === mesure)) {
          suggestions.push({
            id: `${qId}_${suggestions.length}`,
            mesure,
            questionId: qId,
            priorite: reponse === 'non' ? 'haute' : 'normale',
            selectionnee: true,
          });
        }
      });
    }
  });
  // Trier : non-conformes d'abord, puis nsp
  return suggestions.sort((a, b) => {
    if (a.priorite === 'haute' && b.priorite !== 'haute') return -1;
    if (b.priorite === 'haute' && a.priorite !== 'haute') return 1;
    return 0;
  });
}
