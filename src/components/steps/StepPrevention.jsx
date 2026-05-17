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
