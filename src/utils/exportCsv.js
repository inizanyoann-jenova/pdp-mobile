import { CATEGORIES, TYPES_INTERVENTION } from './risques';

function escCsv(val) {
  if (val == null) return '';
  const s = String(val).replace(/"/g, '""');
  return /[,"\n\r;]/.test(s) ? `"${s}"` : s;
}

export function exportPdPsCsv(pdps) {
  const totalQ = CATEGORIES.reduce((s, c) => s + c.questions.length, 0);

  const headers = [
    'ID', 'Statut', 'Lieu', 'Entreprise extérieure', 'Date des travaux',
    'Responsable QHSE', 'Contact urgence', 'Type de travaux',
    "Type d'intervention", 'Intervenants', 'Météo', 'Température (°C)',
    'Description', 'Score risque (/25)', 'Niveau de risque',
    'Nb questions répondues', 'Nb conformes', 'Nb non-conformes', 'Nb à vérifier',
    'Nb mesures préventives', 'Nb photos',
    'Date de création',
  ];

  const rows = pdps.map(p => {
    const rep = p.reponses || {};
    const answered = Object.keys(rep).length;
    const nbOui    = Object.values(rep).filter(r => r === 'oui').length;
    const nbNon    = Object.values(rep).filter(r => r === 'non').length;
    const nbNsp    = Object.values(rep).filter(r => r === 'nsp').length;
    const mesures  = (p.mesures_suggerees || []).filter(m => m.selectionnee).length;
    const nbPhotos = Array.isArray(p.photos) ? p.photos.length : 0;
    const typeInter = TYPES_INTERVENTION.find(t => t.value === p.type_intervention)?.label || p.type_intervention || '';

    return [
      escCsv(p.id),
      escCsv(p.statut),
      escCsv(p.lieu),
      escCsv(p.entreprise_exterieure),
      escCsv(p.date_travaux),
      escCsv(p.responsable),
      escCsv(p.contact_urgence),
      escCsv(p.type_travaux),
      escCsv(typeInter),
      escCsv(p.intervenants),
      escCsv(p.meteo),
      escCsv(p.temperature),
      escCsv(p.description_travaux),
      escCsv(p.score_risque),
      escCsv(p.niveau_risque),
      escCsv(answered),
      escCsv(nbOui),
      escCsv(nbNon),
      escCsv(nbNsp),
      escCsv(mesures),
      escCsv(nbPhotos),
      escCsv(p.created_at ? new Date(p.created_at).toLocaleDateString('fr-FR') : ''),
    ].join(';');
  });

  const bom = '\uFEFF'; // BOM UTF-8 pour Excel français
  const csv = bom + [headers.join(';'), ...rows].join('\r\n');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  a.href     = url;
  a.download = `PdP_export_${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
