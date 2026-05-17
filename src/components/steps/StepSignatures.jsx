import React from 'react';
import SignaturePad from '../SignaturePad';

export default function StepSignatures({ form, setField, score, nInfo, error }) {
  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ textAlign: 'center', borderColor: nInfo.border, background: nInfo.bg }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: nInfo.text, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Risque final — {nInfo.label}</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: nInfo.text, margin: '4px 0' }}>{score}/25</div>
        <div style={{ fontSize: 11, color: nInfo.text, opacity: 0.7 }}>{form.mesures_suggerees.filter(m => m.selectionnee).length} mesure(s) retenue(s)</div>
      </div>

      <div className="card">
        <p style={{ fontSize: 12, color: '#64748B', marginBottom: 14, lineHeight: 1.6 }}>
          En signant, les deux parties reconnaissent avoir pris connaissance des risques et s'engagent à respecter les mesures de prévention.
        </p>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          <SignaturePad label="Responsable QHSE / Donneur d'ordre" value={form.signature_qhse} onChange={val => setField('signature_qhse', val)} />
          <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
          <SignaturePad label="Responsable de site / Chef de chantier" value={form.signature_responsable} onChange={val => setField('signature_responsable', val)} />
        </div>
      </div>

      {error && (
        <div style={{ padding: '12px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, fontSize: 13, color: '#EF4444' }}>⚠️ {error}</div>
      )}
    </div>
  );
}
