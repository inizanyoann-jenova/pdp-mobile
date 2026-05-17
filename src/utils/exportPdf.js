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

function pageFooter(doc, p, total, W, H, margin, companyName) {
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

function newPage(doc, W, H) {
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

  // PAGE 1 — En-tête & résumé
  doc.setFillColor(...C.bg);
  doc.rect(0, 0, W, H, 'F');
  addHeader(doc, W, margin, primaryColor, logoBase64, companyName);
  let y = 46;

  // Score bloc
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
  const stats = [
    { label: 'Conformes',    val: nbOui,                                color: C.green  },
    { label: 'Non-conf.',    val: nbNon,                                color: C.red    },
    { label: 'À vérifier',  val: nbNsp,                                color: C.amber  },
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

  // Infos chantier
  addCard(doc, margin, y, inner, 54, 4);
  sectionTitle(doc, 'Informations chantier', margin + 5, y + 8);
  const primary = hexToRgb(primaryColor);
  doc.setDrawColor(...primary); doc.setLineWidth(0.8);
  doc.line(margin + 5, y + 10, margin + 35, y + 10); doc.setLineWidth(0.2);
  const fields = [
    ['Lieu',               pdp.lieu],
    ['Entreprise ext.',    pdp.entreprise_exterieure],
    ['Date travaux',       pdp.date_travaux ? new Date(pdp.date_travaux+'T12:00').toLocaleDateString('fr-FR') : '—'],
    ['Responsable QHSE',  pdp.responsable || '—'],
    ['Contact urgence',    pdp.contact_urgence || '—'],
    ['Type de travaux',    (pdp.types_travaux?.length ? pdp.types_travaux.join(' + ') : null) || pdp.type_travaux || '—'],
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

  // Description
  if (pdp.description_travaux) {
    const lines = doc.splitTextToSize(pdp.description_travaux.substring(0, 300), inner - 12);
    const bh = Math.max(20, 12 + lines.length * 4.5);
    if (y + bh > H - 20) { newPage(doc, W, H); y = 16; }
    addCard(doc, margin, y, inner, bh, 4);
    sectionTitle(doc, 'Description des travaux', margin + 5, y + 8);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text1); doc.setFontSize(8);
    doc.text(lines, margin + 5, y + 15);
    y += bh + 6;
  }

  // PAGE 2 — Résultats par catégorie
  newPage(doc, W, H);
  addHeader(doc, W, margin, primaryColor, logoBase64, companyName);
  y = 46;
  doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.text1);
  doc.text("RÉSULTATS DE L'ANALYSE PAR CATÉGORIE", margin, y);
  y += 10;

  CATEGORIES.forEach(cat => {
    const customQs  = (pdp.custom_questions?.[cat.id] || []);
    const allQs     = [...cat.questions, ...customQs];
    const reps      = allQs.map(q => reponses[q.id]);
    const answered  = reps.filter(Boolean).length;
    if (answered === 0) return;
    const catOui = reps.filter(r=>r==='oui').length;
    const catNon = reps.filter(r=>r==='non').length;
    const catNsp = reps.filter(r=>r==='nsp').length;
    const catRgb = hexToRgb(cat.color);
    const pctConf = answered > 0 ? Math.round(catOui / answered * 100) : 0;

    if (y + 16 > H - 20) { newPage(doc, W, H); y = 16; }
    doc.setFillColor(240, 244, 255); doc.setDrawColor(...catRgb);
    doc.roundedRect(margin, y, inner, 10, 2, 2, 'FD');
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(...catRgb);
    doc.text(cat.label.toUpperCase(), margin + 4, y + 7);
    doc.setTextColor(...C.text3); doc.setFontSize(7);
    doc.text(`${answered}/${allQs.length}  ✓${catOui}  ✗${catNon}  ?${catNsp}`, margin + inner - 42, y + 7);
    y += 12;

    doc.setFillColor(...C.border);
    doc.roundedRect(margin, y, inner, 3, 1, 1, 'F');
    if (pctConf > 0) {
      doc.setFillColor(...C.green);
      doc.roundedRect(margin, y, inner * pctConf / 100, 3, 1, 1, 'F');
    }
    y += 6;

    allQs.forEach(q => {
      const rep = reponses[q.id];
      if (rep !== 'non' && rep !== 'nsp') return;
      if (y + 10 > H - 20) { newPage(doc, W, H); y = 16; }
      const rowBg     = rep === 'non' ? [254, 226, 226] : [254, 243, 199];
      const rowBorder = rep === 'non' ? C.red : C.amber;
      doc.setFillColor(...rowBg); doc.setDrawColor(...rowBorder);
      doc.roundedRect(margin, y, inner, 9, 2, 2, 'FD');
      doc.setTextColor(...(rep === 'non' ? C.red : C.amber));
      doc.setFontSize(9); doc.setFont('helvetica', 'bold');
      doc.text(rep === 'non' ? '✗' : '?', margin + 3, y + 6.5);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text1); doc.setFontSize(7.5);
      doc.text(doc.splitTextToSize(q.text, inner - 14)[0], margin + 8, y + 6.5);
      y += 10;
      const obs = pdp.observations_questions?.[q.id];
      if (obs) {
        if (y + 6 > H - 20) { newPage(doc, W, H); y = 16; }
        doc.setTextColor(...C.text3); doc.setFontSize(7); doc.setFont('helvetica', 'italic');
        doc.text(`→ ${obs.substring(0, 110)}`, margin + 8, y + 1);
        y += 6;
      }
    });
    y += 4;
  });

  // PAGE 3 — Mesures de prévention
  const mesures = (pdp.mesures_suggerees || []).filter(m => m.selectionnee);
  if (mesures.length > 0 || pdp.mesures_prevention) {
    newPage(doc, W, H);
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
        if (y + 12 > H - 20) { newPage(doc, W, H); y = 16; }
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
        if (y + 11 > H - 20) { newPage(doc, W, H); y = 16; }
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
      if (y + bh > H - 20) { newPage(doc, W, H); y = 16; }
      sectionTitle(doc, 'Mesures complémentaires', margin, y); y += 6;
      addCard(doc, margin, y, inner, bh, 3);
      doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text1); doc.setFontSize(8);
      doc.text(lines, margin + 4, y + 7);
      y += bh + 4;
    }
  }

  // PAGE PHOTOS CHANTIER
  const photosChantier = Array.isArray(pdp.photos) ? pdp.photos.filter(p => p?.url) : [];
  if (photosChantier.length > 0) {
    newPage(doc, W, H);
    addHeader(doc, W, margin, primaryColor, logoBase64, companyName);
    y = 46;
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.text1);
    doc.text(`PHOTOS DU CHANTIER (${photosChantier.length})`, margin, y);
    y += 10;

    const imgW = (inner - 8) / 2;
    const imgH = imgW * 0.65;
    let col = 0, rowY = y;

    for (const [photoIndex, photo] of photosChantier.entries()) {
      if (col === 0 && rowY + imgH + 14 > H - 20) {
        newPage(doc, W, H); rowY = 16; col = 0;
      }
      const px = margin + col * (imgW + 8);
      addCard(doc, px, rowY, imgW, imgH, 3);

      let b64 = null;
      if (photo.url?.startsWith('data:')) {
        b64 = photo.url;
      } else if (photo.url) {
        try {
          const res  = await fetch(photo.url, { mode: 'cors' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
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
      doc.text((photo.name || `Photo ${photoIndex + 1}`).substring(0, 30), px, rowY + imgH + 5);
      col++;
      if (col >= 2) { col = 0; rowY += imgH + 14; }
    }
  }

  // PAGE PHOTOS ANALYSE DE RISQUES
  const photosQuestions = pdp.photos_questions || {};
  const questionPhotos  = Object.entries(photosQuestions).filter(([, v]) => v);

  if (questionPhotos.length > 0) {
    newPage(doc, W, H);
    addHeader(doc, W, margin, primaryColor, logoBase64, companyName);
    y = 46;
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.text1);
    doc.text(`PHOTOS — ANALYSE DE RISQUES (${questionPhotos.length})`, margin, y);
    y += 10;

    const imgW = (inner - 8) / 2;
    const imgH = imgW * 0.65;
    let col = 0, rowY = y;

    for (const [qId, b64] of questionPhotos) {
      let qLabel = qId;
      for (const cat of CATEGORIES) {
        const q = cat.questions.find(q => q.id === qId) || (pdp.custom_questions?.[cat.id] || []).find(q => q.id === qId);
        if (q) { qLabel = `${cat.label} — ${q.text.substring(0, 50)}`; break; }
      }

      if (col === 0 && rowY + imgH + 20 > H - 20) {
        newPage(doc, W, H); rowY = 16; col = 0;
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

      const labelLines = doc.splitTextToSize(qLabel, imgW - 4);
      doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text3);
      doc.text(labelLines[0], px + 2, rowY + imgH + 6);
      if (labelLines[1]) doc.text(labelLines[1], px + 2, rowY + imgH + 11);
      col++;
      if (col >= 2) { col = 0; rowY += imgH + 18; }
    }
  }

  // PAGE ACTIONS CORRECTIVES
  const actions = pdp._actions || [];
  if (actions.length > 0) {
    newPage(doc, W, H);
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
      if (y + 18 > H - 20) { newPage(doc, W, H); y = 16; }
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

  // PAGE SIGNATURES
  newPage(doc, W, H);
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
    const pRgb = hexToRgb(primaryColor);
    addCard(doc, sx, sy, sigW, 80, 4);
    doc.setDrawColor(...pRgb); doc.setLineWidth(0.5);
    doc.line(sx, sy + 12, sx + sigW, sy + 12); doc.setLineWidth(0.2);
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...pRgb);
    doc.text(label.toUpperCase(), sx + 6, sy + 9);
    if (note) { doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text3); doc.text(note, sx + 6, sy + 16); }
    doc.setFontSize(7); doc.setTextColor(...C.text3); doc.text('Signature :', sx + 6, sy + 23);
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

  drawSig('Responsable QHSE',    pdp.responsable || '',           pdp.signature_qhse,        margin,            y);
  drawSig('Responsable de site', pdp.entreprise_exterieure || '', pdp.signature_responsable, margin + sigW + 8, y);
  y += 90;

  // Récap final
  doc.setFillColor(...hexToRgb(primaryColor));
  doc.roundedRect(margin, y, inner, 18, 4, 4, 'F');
  doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
  doc.text('RÉCAPITULATIF', margin + 6, y + 8);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
  doc.text(`Score : ${score}/25 (${nLabel})  ·  Réponses : ${Object.keys(reponses).length}/${totalQ}  ·  Non-conf : ${nbNon}  ·  À vérifier : ${nbNsp}  ·  Mesures : ${mesures.length}`, margin + 6, y + 15);

  // Page footers
  const nbPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= nbPages; p++) {
    doc.setPage(p);
    pageFooter(doc, p, nbPages, W, H, margin, companyName);
  }

  const filename = `PdP_${(pdp.lieu||'chantier').replace(/[^a-z0-9]/gi,'_')}_${pdp.date_travaux||new Date().toISOString().split('T')[0]}.pdf`;
  if (returnBlob) return doc.output('blob', { filename });
  doc.save(filename);
}
