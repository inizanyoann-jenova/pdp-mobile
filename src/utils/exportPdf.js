// src/utils/exportPdf.js
import { jsPDF } from 'jspdf';
import { CATEGORIES, RISQUE_COLORS, TYPES_INTERVENTION, calcScore, getNiveauRisque } from './risques';

// ─── Palette ────────────────────────────────────────────────────────────────
const C = {
  white:    [255, 255, 255],
  bg:       [245, 247, 250],
  border:   [226, 232, 240],
  text1:    [15,  23,  42],
  text3:    [100, 116, 139],
  green:    [16,  185, 129],
  greenBg:  [220, 252, 231],
  amber:    [245, 158,  11],
  amberBg:  [254, 243, 199],
  red:      [239,  68,  68],
  redBg:    [254, 226, 226],
  purple:   [124,  58, 237],
  purpleBg: [237, 233, 254],
};

function hexToRgb(hex) {
  const h = (hex || '#1e3a5f').replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

function niveauColor(niveau) {
  return ({ faible: C.green, modere: C.amber, eleve: C.red, critique: C.purple })[niveau] || C.green;
}

function niveauBg(niveau) {
  return ({ faible: C.greenBg, modere: C.amberBg, eleve: C.redBg, critique: C.purpleBg })[niveau] || C.greenBg;
}

// ─── buildAttentionPoints ────────────────────────────────────────────────────
export function buildAttentionPoints(pdp) {
  const reponses = pdp.reponses || {};
  const mesures  = (pdp.mesures_suggerees || []).filter(m => m.selectionnee);
  const points   = [];

  CATEGORIES.forEach(cat => {
    const customQs = pdp.custom_questions?.[cat.id] || [];
    const allQs    = [...cat.questions, ...customQs];

    allQs.forEach(q => {
      const rep = reponses[q.id];
      if (rep !== 'non' && rep !== 'nsp') return;
      const mesureObj = mesures.find(m => m.questionId === q.id);
      points.push({
        categoryLabel: cat.label,
        categoryColor: cat.color,
        questionText:  q.text,
        reponse:       rep,
        observation:   pdp.observations_questions?.[q.id] || null,
        mesureText:    mesureObj?.mesure || null,
      });
    });
  });

  return points;
}

// ─── Shared helpers ──────────────────────────────────────────────────────────
function addCard(doc, x, y, w, h, r = 3) {
  doc.setFillColor(...C.white);
  doc.setDrawColor(...C.border);
  doc.setLineWidth(0.2);
  doc.roundedRect(x, y, w, h, r, r, 'FD');
}

function addPageHeader(doc, { W, margin, primaryRgb, logoBase64, companyName, refPdp }) {
  doc.setFillColor(...primaryRgb);
  doc.rect(0, 0, W, 38, 'F');

  let textX = margin;
  if (logoBase64) {
    try {
      const ext = logoBase64.startsWith('data:image/png') ? 'PNG' : 'JPEG';
      doc.addImage(logoBase64, ext, margin, 5, 28, 28, undefined, 'FAST');
      textX = margin + 32;
    } catch (e) { console.warn('[PDF] Logo:', e.message); }
  } else if (companyName) {
    const initials = companyName.split(/\s+/).slice(0, 2).map(w => w[0] || '').join('').toUpperCase();
    const dimmed = primaryRgb.map(c => Math.max(0, c - 50));
    doc.setFillColor(...dimmed);
    doc.roundedRect(margin, 7, 24, 24, 3, 3, 'F');
    doc.setFontSize(12); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
    doc.text(initials, margin + 12, 22, { align: 'center' });
    textX = margin + 28;
  }

  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
  doc.text('FICHE DE VISITE PRÉALABLE', textX, 14);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(200, 215, 235);
  doc.text('IDENTIFICATION DES RISQUES', textX, 20);
  if (companyName) {
    doc.text(companyName, textX, 27);
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, textX, 33);
  } else {
    doc.text(`Généré le ${new Date().toLocaleDateString('fr-FR')}`, textX, 27);
  }
  if (refPdp) {
    doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(200, 215, 235);
    doc.text(refPdp, W - margin, 14, { align: 'right' });
  }
}

function addPageFooter(doc, { page, total, W, H, margin, companyName }) {
  doc.setDrawColor(...C.border); doc.setLineWidth(0.2);
  doc.line(margin, H - 10, W - margin, H - 10);
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text3);
  doc.text(`${companyName || 'PdP & Analyse de Risques'} — Document confidentiel`, margin, H - 5);
  doc.text(`${page} / ${total}`, W - margin, H - 5, { align: 'right' });
}

function startNewPage(doc, ctx) {
  doc.addPage();
  doc.setFillColor(...C.bg); doc.rect(0, 0, ctx.W, ctx.H, 'F');
  addPageHeader(doc, ctx);
  return 46;
}

// ─── Page 1 — Identification & Résumé ───────────────────────────────────────
function renderPage1(doc, pdp, ctx) {
  const { margin, inner, primaryRgb } = ctx;
  let y = 46;

  // Bloc chantier
  addCard(doc, margin, y, inner, 56, 4);
  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.text3);
  doc.text('INFORMATIONS CHANTIER', margin + 5, y + 8);
  doc.setDrawColor(...primaryRgb); doc.setLineWidth(0.8);
  doc.line(margin + 5, y + 10, margin + 50, y + 10); doc.setLineWidth(0.2);

  const interventionLabel = TYPES_INTERVENTION.find(t => t.value === pdp.type_intervention)?.label || '—';
  const chantierFields = [
    ['Chantier / Lieu',     (pdp.lieu || '—').substring(0, 32)],
    ['Date de visite',      pdp.date_travaux ? new Date(pdp.date_travaux + 'T12:00').toLocaleDateString('fr-FR') : '—'],
    ["Type d'intervention", interventionLabel.replace(/[^\w\s éàèùâêîôûçëïüÉÀÈÙÂÊÎÔÛÇËÏÜ'.,()-]/g, '').substring(0, 32)],
    ['Responsable de site', (pdp.responsable || '—').substring(0, 32)],
    ['Intervenants',        (pdp.intervenants || '—').substring(0, 32)],
    ['Contact urgence',     (pdp.contact_urgence || '—').substring(0, 32)],
  ];

  let fy = y + 17;
  chantierFields.forEach(([lbl, val], i) => {
    const col = i % 2 === 0 ? margin + 5 : margin + inner / 2 + 5;
    if (i > 0 && i % 2 === 0) fy += 9;
    doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.text3);
    doc.text(lbl + ' :', col, fy);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text1);
    doc.text(String(val), col + 35, fy);
  });
  y += 62;

  // Description travaux
  if (pdp.description_travaux) {
    const lines = doc.splitTextToSize(pdp.description_travaux.substring(0, 250), inner - 12);
    const bh = Math.max(16, 10 + lines.length * 4.5);
    addCard(doc, margin, y, inner, bh, 3);
    doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.text3);
    doc.text('DESCRIPTION DES TRAVAUX', margin + 5, y + 7);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text1); doc.setFontSize(8);
    doc.text(lines, margin + 5, y + 13);
    y += bh + 5;
  }

  // Score global
  const { reponses, score, niveau, nLabel, totalQ, nbOui, nbNon, nbNsp } = ctx;
  const nColor   = niveauColor(niveau);
  const nBg      = niveauBg(niveau);

  doc.setFillColor(...nBg); doc.setDrawColor(...nColor); doc.setLineWidth(0.5);
  doc.roundedRect(margin, y, inner, 32, 4, 4, 'FD'); doc.setLineWidth(0.2);

  doc.setFontSize(22); doc.setFont('helvetica', 'bold'); doc.setTextColor(...nColor);
  doc.text(String(score), margin + 20, y + 19, { align: 'center' });
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text3);
  doc.text('/25', margin + 20, y + 26, { align: 'center' });

  doc.setFontSize(13); doc.setFont('helvetica', 'bold'); doc.setTextColor(...nColor);
  doc.text(nLabel.toUpperCase(), margin + 34, y + 16);
  doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text3);
  doc.text('NIVEAU DE RISQUE GLOBAL', margin + 34, y + 23);

  const stats = [
    { label: 'Conformes',     val: nbOui, color: C.green },
    { label: 'Non-conformes', val: nbNon, color: C.red   },
    { label: 'À vérifier',   val: nbNsp, color: C.amber  },
    { label: 'Non répondus',  val: totalQ - Object.keys(reponses).length, color: C.text3 },
  ];
  let sx = margin + 112;
  stats.forEach(s => {
    doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...s.color);
    doc.text(String(s.val), sx, y + 17);
    doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text3);
    doc.text(s.label, sx, y + 23);
    sx += 24;
  });
  y += 38;

  // Mini-barres catégories (2 colonnes)
  const catRows = CATEGORIES.map(cat => {
    const customQs = pdp.custom_questions?.[cat.id] || [];
    const allQs    = [...cat.questions, ...customQs];
    const reps     = allQs.map(q => reponses[q.id]);
    const answered = reps.filter(Boolean).length;
    if (answered === 0) return null;
    return { label: cat.label, color: cat.color, pct: Math.round(reps.filter(r => r === 'oui').length / answered * 100) };
  }).filter(Boolean);

  if (catRows.length > 0) {
    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.text3);
    doc.text('RÉSULTATS PAR CATÉGORIE', margin, y + 6); y += 10;

    const halfW = inner / 2 - 6;
    catRows.forEach((row, i) => {
      const cx   = i % 2 === 0 ? margin : margin + inner / 2 + 4;
      if (i > 0 && i % 2 === 0) {
        y += 8;
        if (y + 6 > ctx.H - 14) return;
      }
      const barW = halfW - 48;
      doc.setFontSize(6); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text1);
      doc.text(row.label.substring(0, 17), cx, y + 4);
      doc.setFillColor(...C.border);
      doc.roundedRect(cx + 40, y + 0.5, barW, 3.5, 1, 1, 'F');
      if (row.pct > 0) {
        doc.setFillColor(...hexToRgb(row.color));
        doc.roundedRect(cx + 40, y + 0.5, barW * row.pct / 100, 3.5, 1, 1, 'F');
      }
      doc.setFontSize(6); doc.setTextColor(...C.text3);
      doc.text(`${row.pct}%`, cx + 40 + barW + 2, y + 4);
    });
  }
}

// ─── Page 2 — Risques identifiés & Mesures ──────────────────────────────────
async function renderPage2(doc, pdp, points, ctx) {
  const { H, margin, inner } = ctx;
  let y = 46;

  doc.setFontSize(11); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.text1);
  doc.text('RISQUES IDENTIFIÉS & MESURES DE PRÉVENTION', margin, y); y += 9;

  if (points.length === 0) {
    doc.setFillColor(...C.greenBg); doc.setDrawColor(...C.green); doc.setLineWidth(0.5);
    doc.roundedRect(margin, y, inner, 14, 3, 3, 'FD'); doc.setLineWidth(0.2);
    doc.setFontSize(9); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.green);
    doc.text('✓ Aucun point critique identifié lors de cette visite', margin + inner / 2, y + 9, { align: 'center' });
    y += 20;
  } else {
    const COL = { cat: 30, risk: 68, level: 18, measure: inner - 30 - 68 - 18 - 6 };

    const drawTableHeader = (yh) => {
      doc.setFillColor(...ctx.primaryRgb);
      doc.roundedRect(margin, yh, inner, 8, 2, 2, 'F');
      doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
      doc.text('CATÉGORIE',            margin + 2,                                    yh + 5.5);
      doc.text('RISQUE IDENTIFIÉ',     margin + COL.cat + 2,                          yh + 5.5);
      doc.text('NIV.',                 margin + COL.cat + COL.risk + 2,               yh + 5.5);
      doc.text('MESURE DE PRÉVENTION', margin + COL.cat + COL.risk + COL.level + 2,  yh + 5.5);
    };

    drawTableHeader(y); y += 9;

    points.forEach(pt => {
      const isNon    = pt.reponse === 'non';
      const rowBg    = isNon ? C.redBg   : C.amberBg;
      const rowColor = isNon ? C.red     : C.amber;
      const rowH     = pt.observation ? 17 : 10;

      if (y + rowH + 2 > H - 14) {
        y = startNewPage(doc, ctx);
        drawTableHeader(y); y += 9;
      }

      doc.setFillColor(...rowBg); doc.setDrawColor(...rowColor); doc.setLineWidth(0.3);
      doc.roundedRect(margin, y, inner, rowH, 1.5, 1.5, 'FD'); doc.setLineWidth(0.2);

      doc.setFillColor(...hexToRgb(pt.categoryColor));
      doc.roundedRect(margin + 1, y + 2, COL.cat - 3, rowH - 4, 1, 1, 'F');
      const catLines = doc.splitTextToSize(pt.categoryLabel, COL.cat - 5);
      doc.setFontSize(5.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
      doc.text(catLines[0], margin + 2.5, y + 5.5);
      if (catLines[1]) doc.text(catLines[1], margin + 2.5, y + 10);

      const riskLines = doc.splitTextToSize(pt.questionText, COL.risk - 4);
      doc.setFontSize(7); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text1);
      doc.text(riskLines[0], margin + COL.cat + 2, y + 6.5);
      if (riskLines[1]) doc.text(riskLines[1], margin + COL.cat + 2, y + 11);

      if (pt.observation) {
        const obsLine = doc.splitTextToSize('→ ' + pt.observation.substring(0, 90), COL.risk - 4)[0];
        doc.setFontSize(6); doc.setFont('helvetica', 'italic'); doc.setTextColor(...C.text3);
        doc.text(obsLine, margin + COL.cat + 2, y + 15);
      }

      const lx = margin + COL.cat + COL.risk + 1;
      doc.setFillColor(...rowColor);
      doc.roundedRect(lx, y + 2.5, COL.level - 2, 6, 1, 1, 'F');
      doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
      doc.text(isNon ? 'NON' : 'NSP', lx + (COL.level - 2) / 2, y + 6.8, { align: 'center' });

      const mx = margin + COL.cat + COL.risk + COL.level + 2;
      if (pt.mesureText) {
        const mLines = doc.splitTextToSize(pt.mesureText, COL.measure - 2);
        doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text1);
        doc.text(mLines[0], mx, y + 6.5);
        if (mLines[1]) doc.text(mLines[1], mx, y + 11);
      } else {
        doc.setFontSize(6.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(...C.amber);
        doc.text('À définir', mx, y + 6.5);
      }

      y += rowH + 1;
    });
    y += 4;
  }

  if (pdp.mesures_prevention) {
    const lines = doc.splitTextToSize(pdp.mesures_prevention.substring(0, 300), inner - 12);
    const bh    = Math.max(16, 10 + lines.length * 4.5);
    if (y + bh > H - 14) { y = startNewPage(doc, ctx); }
    addCard(doc, margin, y, inner, bh, 3);
    doc.setFontSize(6.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.text3);
    doc.text('MESURES COMPLÉMENTAIRES', margin + 5, y + 7);
    doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text1); doc.setFontSize(7.5);
    doc.text(lines, margin + 5, y + 13);
    y += bh + 5;
  }

  const allPhotos = Array.isArray(pdp.photos) ? pdp.photos.filter(p => p?.url) : [];
  const photos    = allPhotos.slice(0, 4);
  const hasMore   = allPhotos.length > 4;

  if (photos.length > 0) {
    const imgW   = (inner - 8) / 2;
    const imgH   = imgW * 0.6;
    const needed = Math.ceil(photos.length / 2) * (imgH + 12) + 14;
    if (y + needed > H - 14) { y = startNewPage(doc, ctx); }

    doc.setFontSize(7); doc.setFont('helvetica', 'bold'); doc.setTextColor(...C.text3);
    doc.text(`PHOTOS DU CHANTIER${hasMore ? ` (+${allPhotos.length - 4} autres non affichées)` : ''}`, margin, y + 5);
    y += 9;

    let col = 0, rowY = y;
    for (const [idx, photo] of photos.entries()) {
      const px = margin + col * (imgW + 8);
      addCard(doc, px, rowY, imgW, imgH, 2);

      let b64 = null;
      if (photo.url?.startsWith('data:')) {
        b64 = photo.url;
      } else if (photo.url) {
        try {
          const res  = await fetch(photo.url, { mode: 'cors' });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const blob = await res.blob();
          b64 = await new Promise(r => { const fr = new FileReader(); fr.onloadend = () => r(fr.result); fr.readAsDataURL(blob); });
        } catch (e) { console.warn('[PDF] Photo:', e.message); }
      }

      if (b64) {
        try {
          const ext = b64.startsWith('data:image/png') ? 'PNG' : 'JPEG';
          doc.addImage(b64, ext, px, rowY, imgW, imgH, undefined, 'MEDIUM');
        } catch (e) {
          doc.setFontSize(7); doc.setTextColor(...C.text3);
          doc.text('Image invalide', px + imgW / 2, rowY + imgH / 2, { align: 'center' });
        }
      } else {
        doc.setFontSize(7); doc.setTextColor(...C.text3);
        doc.text('Image indisponible', px + imgW / 2, rowY + imgH / 2, { align: 'center' });
      }

      doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text3);
      doc.text((photo.name || `Photo ${idx + 1}`).substring(0, 28), px + 1, rowY + imgH + 5);
      col++;
      if (col >= 2) { col = 0; rowY += imgH + 11; }
    }
  }
}

// ─── Page 3 — Signatures ─────────────────────────────────────────────────────
function parseSig(v) {
  if (!v) return { drawing: '', nom: '', date: '' };
  if (typeof v === 'object' && !Array.isArray(v)) return { drawing: v.drawing || '', nom: v.nom || '', date: v.date || '' };
  try { const p = JSON.parse(v); if (p?.drawing) return { drawing: p.drawing, nom: p.nom || '', date: p.date || '' }; } catch {}
  return { drawing: String(v), nom: '', date: '' };
}

function renderPage3(doc, pdp, ctx) {
  const { margin, inner, primaryRgb } = ctx;
  let y = 46;

  const engagement = "Les soussignés reconnaissent avoir procédé à une visite préalable du chantier, identifié les risques listés ci-dessus et s'engagent à faire respecter les mesures de prévention définies avant et pendant l'exécution des travaux.";
  const engLines   = doc.splitTextToSize(engagement, inner - 20);
  const engH       = Math.max(18, 8 + engLines.length * 5);
  doc.setFillColor(248, 250, 252); doc.setDrawColor(...C.border); doc.setLineWidth(0.2);
  doc.roundedRect(margin, y, inner, engH, 3, 3, 'FD');
  doc.setFontSize(7.5); doc.setFont('helvetica', 'italic'); doc.setTextColor(...C.text1);
  doc.text(engLines, margin + inner / 2, y + 7, { align: 'center', maxWidth: inner - 20 });
  y += engH + 8;

  const sigW = (inner - 8) / 2;
  const sigH = 80;

  function drawSigBlock(sx, sy, label, entityName, sigData) {
    const { drawing, nom, date } = parseSig(sigData);
    addCard(doc, sx, sy, sigW, sigH, 4);

    doc.setFillColor(...primaryRgb);
    doc.roundedRect(sx, sy, sigW, 12, 4, 4, 'F');
    doc.rect(sx, sy + 6, sigW, 6, 'F');
    doc.setFontSize(8); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
    doc.text(label.toUpperCase(), sx + 5, sy + 8.5);

    if (entityName) {
      doc.setFontSize(6.5); doc.setFont('helvetica', 'normal'); doc.setTextColor(...C.text3);
      doc.text(entityName.substring(0, 30), sx + 5, sy + 18);
    }

    doc.setFontSize(7); doc.setTextColor(...C.text3);
    doc.text('Signature :', sx + 5, sy + 25);

    if (drawing) {
      try {
        doc.setFillColor(255, 255, 255); doc.rect(sx + 3, sy + 27, sigW - 6, 28, 'F');
        doc.addImage(drawing, 'PNG', sx + 3, sy + 27, sigW - 6, 28);
      } catch {
        doc.setFillColor(...C.bg); doc.rect(sx + 3, sy + 27, sigW - 6, 28, 'F');
        doc.setFontSize(8); doc.setTextColor(...C.text3);
        doc.text('[ Erreur signature ]', sx + sigW / 2, sy + 43, { align: 'center' });
      }
    } else {
      doc.setFillColor(...C.bg); doc.rect(sx + 3, sy + 27, sigW - 6, 28, 'F');
      doc.setFontSize(8); doc.setTextColor(...C.text3);
      doc.text('[ Non signé ]', sx + sigW / 2, sy + 43, { align: 'center' });
    }

    doc.setFontSize(7); doc.setTextColor(...C.text3);
    if (nom) {
      doc.text('Nom :', sx + 5, sy + 62);
      doc.setTextColor(...C.text1); doc.text(nom.substring(0, 22), sx + 18, sy + 62);
    }
    doc.setTextColor(...C.text3); doc.text('Date :', sx + 5, sy + 70);
    const sigDate = date || new Date().toLocaleDateString('fr-FR');
    doc.setTextColor(...C.text1); doc.text(sigDate, sx + 18, sy + 70);
  }

  drawSigBlock(margin,            y, "Donneur d'ordre / QHSE", ctx.companyName,           pdp.signature_qhse);
  drawSigBlock(margin + sigW + 8, y, 'Responsable de site',    pdp.entreprise_exterieure, pdp.signature_responsable);
  y += sigH + 10;

  const { reponses, score, niveau, nLabel, nbNon, nbNsp, mesures } = ctx;

  doc.setFillColor(...primaryRgb);
  doc.roundedRect(margin, y, inner, 16, 3, 3, 'F');
  doc.setFontSize(7.5); doc.setFont('helvetica', 'bold'); doc.setTextColor(255, 255, 255);
  doc.text('RÉCAPITULATIF', margin + 5, y + 7);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
  doc.text(
    `Score : ${score}/25 (${nLabel})  ·  Points critiques : ${nbNon}  ·  À vérifier : ${nbNsp}  ·  Mesures retenues : ${mesures.length}`,
    margin + 5, y + 13
  );
}

// ─── Export principal ────────────────────────────────────────────────────────
export async function exportPdP(pdp, { returnBlob = false } = {}, settings = {}) {
  const doc    = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
  const W = 210, H = 297, margin = 14, inner = W - margin * 2;

  const primaryColor = settings.pdf_primary_color || '#1e3a5f';
  const primaryRgb   = hexToRgb(primaryColor);
  const logoBase64   = settings.company_logo_base64 || null;
  const companyName  = settings.company_name || '';
  const refPdp       = pdp.id
    ? `PDP-${new Date().toISOString().slice(0, 10).replace(/-/g, '')}-${String(pdp.id).slice(-4).toUpperCase()}`
    : '';

  const points = buildAttentionPoints(pdp);

  const reponses  = pdp.reponses || {};
  const score     = calcScore(reponses);
  const niveau    = getNiveauRisque(score);
  const nLabel    = RISQUE_COLORS[niveau]?.label || niveau;
  const nbOui     = Object.values(reponses).filter(r => r === 'oui').length;
  const nbNon     = Object.values(reponses).filter(r => r === 'non').length;
  const nbNsp     = Object.values(reponses).filter(r => r === 'nsp').length;
  const mesures   = (pdp.mesures_suggerees || []).filter(m => m.selectionnee);
  const totalQ    = CATEGORIES.reduce((s, c) => s + c.questions.length, 0);

  const ctx = { W, H, margin, inner, primaryRgb, logoBase64, companyName, refPdp, score, niveau, nLabel, nbOui, nbNon, nbNsp, mesures, totalQ, reponses };

  // Page 1
  doc.setFillColor(...C.bg); doc.rect(0, 0, W, H, 'F');
  addPageHeader(doc, ctx);
  renderPage1(doc, pdp, ctx);

  // Page 2
  doc.addPage();
  doc.setFillColor(...C.bg); doc.rect(0, 0, W, H, 'F');
  addPageHeader(doc, ctx);
  await renderPage2(doc, pdp, points, ctx);

  // Page 3
  doc.addPage();
  doc.setFillColor(...C.bg); doc.rect(0, 0, W, H, 'F');
  addPageHeader(doc, ctx);
  renderPage3(doc, pdp, ctx);

  // Footers
  const nbPages = doc.internal.getNumberOfPages();
  for (let p = 1; p <= nbPages; p++) {
    doc.setPage(p);
    addPageFooter(doc, { page: p, total: nbPages, W, H, margin, companyName });
  }

  const filename = `PdP_${(pdp.lieu || 'chantier').replace(/[^a-z0-9]/gi, '_')}_${pdp.date_travaux || new Date().toISOString().split('T')[0]}.pdf`;
  if (returnBlob) return doc.output('blob', { filename });
  doc.save(filename);
}
