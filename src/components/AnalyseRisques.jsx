import React, { useState, useRef } from 'react';
import { ChevronDown, ChevronUp, Camera, FileText, X, Plus, AlertTriangle } from 'lucide-react';
import { CATEGORIES, getPrioritizedCategories } from '../utils/risques';

async function compressImage(file, maxWidth = 800) {
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
        resolve(canvas.toDataURL('image/jpeg', 0.75));
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

// ── Question individuelle ────────────────────────────────────────────────────
function QuestionItem({ question, value, onChange, observation, onObservation, photo, onPhoto, isCustom, onRemove }) {
  const [showObs, setShowObs] = useState(false);
  const fileRef = useRef(null);

  const colors = { oui: '#10B981', non: '#EF4444', nsp: '#F59E0B' };
  const bgMap  = { oui: 'rgba(16,185,129,0.06)', non: 'rgba(239,68,68,0.06)', nsp: 'rgba(245,158,11,0.06)' };
  const isDanger = value === 'non' || value === 'nsp';

  async function handlePhoto(e) {
    const file = e.target.files[0];
    if (!file) return;
    const data = await compressImage(file);
    onPhoto(data);
    e.target.value = '';
  }

  return (
    <div style={{
      background: value ? bgMap[value] : '#152236',
      border: `1.5px solid ${value ? colors[value] + '40' : 'rgba(255,255,255,0.06)'}`,
      borderRadius: 10, padding: '10px 12px', marginBottom: 8,
      transition: 'all 0.15s',
    }}>
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}>
        {/* Texte question */}
        <div style={{ flex: 1, fontSize: 13, color: '#CBD5E1', lineHeight: 1.5, paddingTop: 2 }}>
          {question.text}
          {isCustom && (
            <span style={{ marginLeft: 6, fontSize: 10, color: '#4F63E7', background: 'rgba(79,99,231,0.12)', border: '1px solid rgba(79,99,231,0.25)', borderRadius: 4, padding: '1px 5px' }}>
              Personnalisée
            </span>
          )}
        </div>

        {/* Boutons OUI / NON / ? */}
        <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
          {['oui', 'non', 'nsp'].map(opt => (
            <button key={opt} type="button"
              onClick={() => onChange(opt === value ? '' : opt)}
              style={{
                padding: '5px 9px', borderRadius: 7,
                border: `1.5px solid ${value === opt ? colors[opt] : 'rgba(255,255,255,0.1)'}`,
                background: value === opt ? colors[opt] + '25' : 'transparent',
                color: value === opt ? colors[opt] : '#64748B',
                fontSize: 11, fontWeight: 800, cursor: 'pointer',
                textTransform: 'uppercase', transition: 'all 0.12s',
                minWidth: 34, minHeight: 34, display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              {opt === 'nsp' ? '?' : opt}
            </button>
          ))}

          {/* Observation */}
          <button type="button" onClick={() => setShowObs(v => !v)}
            style={{
              width: 34, height: 34, borderRadius: 7, cursor: 'pointer',
              border: `1.5px solid ${observation ? '#4F63E7' : 'rgba(255,255,255,0.1)'}`,
              background: observation ? 'rgba(79,99,231,0.15)' : 'transparent',
              color: observation ? '#4F63E7' : '#475569',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
            <FileText size={13} />
          </button>

          {/* Photo */}
          <button type="button" onClick={() => fileRef.current?.click()}
            style={{
              width: 34, height: 34, borderRadius: 7, cursor: 'pointer',
              border: `1.5px solid ${photo ? '#10B981' : isDanger ? '#F59E0B' : 'rgba(255,255,255,0.1)'}`,
              background: photo ? 'rgba(16,185,129,0.15)' : isDanger ? 'rgba(245,158,11,0.08)' : 'transparent',
              color: photo ? '#10B981' : isDanger ? '#F59E0B' : '#475569',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              position: 'relative',
            }}>
            <Camera size={13} />
            {photo && <span style={{ position: 'absolute', top: -3, right: -3, width: 8, height: 8, background: '#10B981', borderRadius: '50%', border: '2px solid #0f1929' }} />}
          </button>
          <input ref={fileRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handlePhoto} />

          {/* Supprimer question custom */}
          {isCustom && onRemove && (
            <button type="button" onClick={onRemove}
              style={{
                width: 34, height: 34, borderRadius: 7, cursor: 'pointer',
                border: '1.5px solid rgba(239,68,68,0.3)',
                background: 'transparent', color: '#EF4444',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
              <X size={13} />
            </button>
          )}
        </div>
      </div>

      {/* Nudge photo si danger sans photo */}
      {isDanger && !photo && (
        <div style={{ marginTop: 6, display: 'flex', alignItems: 'center', gap: 6, cursor: 'pointer' }}
          onClick={() => fileRef.current?.click()}>
          <AlertTriangle size={11} style={{ color: '#F59E0B', flexShrink: 0 }} />
          <span style={{ fontSize: 11, color: '#F59E0B' }}>
            Danger signalé — pensez à documenter avec une photo
          </span>
        </div>
      )}

      {/* Miniature photo */}
      {photo && (
        <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
          <img src={photo} alt="" style={{ width: 64, height: 44, objectFit: 'cover', borderRadius: 7, border: '1px solid rgba(255,255,255,0.1)' }} />
          <button type="button" onClick={() => onPhoto(null)} style={{ fontSize: 11, color: '#EF4444', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
            <X size={12} /> Supprimer
          </button>
        </div>
      )}

      {/* Zone observation */}
      {showObs && (
        <textarea
          value={observation || ''}
          onChange={e => onObservation(e.target.value)}
          placeholder="Observation, remarque ou précision…"
          rows={2}
          style={{
            marginTop: 8, width: '100%', background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8,
            padding: '8px 10px', fontSize: 12, color: '#CBD5E1',
            resize: 'none', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box',
          }}
        />
      )}
    </div>
  );
}

// ── Section catégorie ────────────────────────────────────────────────────────
function CategorieSection({ cat, reponses, observations, photos, onChange, onObservation, onPhoto, isPriority, customQuestionsForCat, onAddCustomQuestion, onRemoveCustomQuestion }) {
  const [expanded, setExpanded] = useState(false);
  const [newQText, setNewQText] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);

  const allQuestions = [
    ...cat.questions,
    ...(customQuestionsForCat || []),
  ];

  const answered     = allQuestions.filter(q => reponses[q.id]).length;
  const nonConformes = allQuestions.filter(q => reponses[q.id] === 'non').length;
  const progress     = allQuestions.length > 0 ? answered / allQuestions.length : 0;

  function handleAddQuestion() {
    const text = newQText.trim();
    if (!text) return;
    onAddCustomQuestion(cat.id, text);
    setNewQText('');
    setShowAddForm(false);
  }

  return (
    <div style={{
      borderRadius: 14, overflow: 'hidden',
      border: `1.5px solid ${nonConformes > 0 ? cat.color + '60' : isPriority ? cat.color + '50' : answered > 0 ? cat.color + '30' : 'rgba(255,255,255,0.07)'}`,
      background: nonConformes > 0 ? cat.color + '06' : '#0f1929',
      marginBottom: 8,
    }}>
      {/* Header accordéon */}
      <button type="button" onClick={() => setExpanded(v => !v)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '12px 14px', background: 'transparent', border: 'none', cursor: 'pointer', textAlign: 'left' }}>
        <div style={{ width: 36, height: 36, borderRadius: 10, background: cat.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: 18 }}>
          {cat.emoji}
        </div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' }}>
            <span style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>{cat.label}</span>
            {isPriority && (
              <span style={{ fontSize: 9, fontWeight: 800, color: cat.color, background: cat.bg, border: `1px solid ${cat.color}50`, borderRadius: 100, padding: '1px 6px', flexShrink: 0, letterSpacing: 0.5 }}>
                PRIORITAIRE
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            {/* Barre progression */}
            <div style={{ flex: 1, height: 4, background: 'rgba(255,255,255,0.08)', borderRadius: 2 }}>
              <div style={{ height: '100%', width: `${progress * 100}%`, background: nonConformes > 0 ? '#EF4444' : cat.color, borderRadius: 2, transition: 'width 0.3s' }} />
            </div>
            <span style={{ fontSize: 11, color: '#64748B', flexShrink: 0 }}>{answered}/{allQuestions.length}</span>
            {nonConformes > 0 && (
              <span style={{ fontSize: 10, fontWeight: 800, color: '#EF4444', background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 100, padding: '1px 6px', flexShrink: 0 }}>
                {nonConformes} ✗
              </span>
            )}
          </div>
        </div>
        {expanded ? <ChevronUp size={16} style={{ color: '#64748B', flexShrink: 0 }} /> : <ChevronDown size={16} style={{ color: '#64748B', flexShrink: 0 }} />}
      </button>

      {/* Questions */}
      {expanded && (
        <div style={{ padding: '0 12px 12px' }}>
          {allQuestions.map(q => {
            const isCustom = !cat.questions.find(cq => cq.id === q.id);
            return (
              <QuestionItem
                key={q.id}
                question={q}
                value={reponses[q.id] || ''}
                onChange={v => onChange(q.id, v)}
                observation={observations?.[q.id] || ''}
                onObservation={v => onObservation(q.id, v)}
                photo={(photos || {})[q.id] || null}
                onPhoto={v => onPhoto(q.id, v)}
                isCustom={isCustom}
                onRemove={isCustom ? () => onRemoveCustomQuestion(cat.id, q.id) : undefined}
              />
            );
          })}

          {/* Bouton ajouter une question */}
          {!showAddForm ? (
            <button type="button" onClick={() => setShowAddForm(true)}
              style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: '#4F63E7', background: 'rgba(79,99,231,0.08)', border: '1px dashed rgba(79,99,231,0.3)', borderRadius: 8, padding: '7px 12px', cursor: 'pointer', width: '100%', marginTop: 4 }}>
              <Plus size={13} />
              Ajouter une question personnalisée
            </button>
          ) : (
            <div style={{ marginTop: 4, display: 'flex', gap: 6 }}>
              <input
                type="text"
                value={newQText}
                onChange={e => setNewQText(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') { e.preventDefault(); handleAddQuestion(); } if (e.key === 'Escape') setShowAddForm(false); }}
                placeholder="Libellé de la question…"
                autoFocus
                style={{ flex: 1, background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(79,99,231,0.4)', borderRadius: 8, padding: '8px 10px', fontSize: 12, color: '#CBD5E1', outline: 'none', fontFamily: 'inherit' }}
              />
              <button type="button" onClick={handleAddQuestion}
                style={{ padding: '8px 12px', borderRadius: 8, background: '#4F63E7', border: 'none', color: '#fff', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                OK
              </button>
              <button type="button" onClick={() => { setShowAddForm(false); setNewQText(''); }}
                style={{ padding: '8px 10px', borderRadius: 8, background: 'transparent', border: '1px solid rgba(255,255,255,0.1)', color: '#64748B', fontSize: 12, cursor: 'pointer' }}>
                <X size={13} />
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Composant principal questionnaire ────────────────────────────────────────
export default function AnalyseRisques({ reponses, observations, photos, onChange, onObservation, onPhoto, typesTravaux = [], customQuestions = {}, onAddCustomQuestion, onRemoveCustomQuestion }) {
  const priorityIds = getPrioritizedCategories(typesTravaux);

  const sortedCategories = [...CATEGORIES].sort((a, b) => {
    const aPriority = priorityIds.includes(a.id) ? 0 : 1;
    const bPriority = priorityIds.includes(b.id) ? 0 : 1;
    return aPriority - bPriority;
  });

  const allCustomQuestions = Object.values(customQuestions).flat();
  const totalQ   = CATEGORIES.reduce((s, c) => s + c.questions.length, 0) + allCustomQuestions.length;
  const answered  = Object.keys(reponses).length;
  const nbNon     = Object.values(reponses).filter(r => r === 'non').length;
  const nbNsp     = Object.values(reponses).filter(r => r === 'nsp').length;

  return (
    <div>
      {/* Récap global */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 12, flexWrap: 'wrap' }}>
        <div style={{ flex: 1, minWidth: 80, background: '#0f1929', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#F1F5F9' }}>{answered}<span style={{ fontSize: 11, color: '#64748B' }}>/{totalQ}</span></div>
          <div style={{ fontSize: 10, color: '#64748B' }}>Répondues</div>
        </div>
        <div style={{ flex: 1, minWidth: 80, background: 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)', borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#10B981' }}>{answered - nbNon - nbNsp}</div>
          <div style={{ fontSize: 10, color: '#10B981' }}>Conformes</div>
        </div>
        <div style={{ flex: 1, minWidth: 80, background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#EF4444' }}>{nbNon}</div>
          <div style={{ fontSize: 10, color: '#EF4444' }}>Non-conf.</div>
        </div>
        <div style={{ flex: 1, minWidth: 80, background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.2)', borderRadius: 10, padding: '8px 12px', textAlign: 'center' }}>
          <div style={{ fontSize: 18, fontWeight: 800, color: '#F59E0B' }}>{nbNsp}</div>
          <div style={{ fontSize: 10, color: '#F59E0B' }}>À vérifier</div>
        </div>
      </div>

      {priorityIds.length > 0 && (
        <div style={{ marginBottom: 12, padding: '8px 12px', background: 'rgba(79,99,231,0.08)', border: '1px solid rgba(79,99,231,0.2)', borderRadius: 10, fontSize: 12, color: '#818CF8' }}>
          Les catégories <strong>PRIORITAIRES</strong> sont mises en avant selon vos types de travaux sélectionnés.
        </div>
      )}

      <p style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>
        Développez chaque catégorie et répondez OUI / NON / ? pour chaque point. Ajoutez une observation 📄 ou une photo 📷 si nécessaire.
      </p>

      {sortedCategories.map(cat => (
        <CategorieSection
          key={cat.id} cat={cat}
          reponses={reponses}
          observations={observations}
          photos={photos}
          onChange={onChange}
          onObservation={onObservation}
          onPhoto={onPhoto}
          isPriority={priorityIds.includes(cat.id)}
          customQuestionsForCat={customQuestions[cat.id] || []}
          onAddCustomQuestion={onAddCustomQuestion || (() => {})}
          onRemoveCustomQuestion={onRemoveCustomQuestion || (() => {})}
        />
      ))}
    </div>
  );
}
