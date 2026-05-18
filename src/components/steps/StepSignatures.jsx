import React from 'react';

export default function StepSignatures({ form, score, nInfo, error }) {
  return (
    <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div className="card" style={{ textAlign: 'center', borderColor: nInfo.border, background: nInfo.bg }}>
        <div style={{ fontSize: 12, fontWeight: 700, color: nInfo.text, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Risque final — {nInfo.label}</div>
        <div style={{ fontSize: 28, fontWeight: 900, color: nInfo.text, margin: '4px 0' }}>{score}/25</div>
        <div style={{ fontSize: 11, color: nInfo.text, opacity: 0.7 }}>{form.mesures_suggerees.filter(m => m.selectionnee).length} mesure(s) retenue(s)</div>
      </div>

      <div className="card">
        <p style={{ fontSize: 13, color: '#64748B', lineHeight: 1.6, marginBottom: 16 }}>
          Les soussignés reconnaissent avoir procédé à une visite préalable du chantier, identifié les risques listés et s'engagent à faire respecter les mesures de prévention définies avant et pendant l'exécution des travaux.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          {[
            "Responsable QHSE / Donneur d'ordre",
            'Responsable de site / Chef de chantier',
          ].map(label => (
            <div key={label} style={{ border: '1px solid rgba(255,255,255,0.08)', borderRadius: 10, padding: '14px 16px' }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 10 }}>{label}</div>
              <div style={{ height: 56, borderRadius: 6, background: 'rgba(255,255,255,0.03)', border: '1px dashed rgba(255,255,255,0.1)', marginBottom: 10, display: 'flex', alignItems: 'flex-end', justifyContent: 'center', paddingBottom: 6 }}>
                <span style={{ fontSize: 10, color: '#475569' }}>Signature manuscrite</span>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: '#64748B', marginBottom: 3 }}>Nom :</div>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.1)' }} />
                </div>
                <div style={{ width: 100 }}>
                  <div style={{ fontSize: 10, color: '#64748B', marginBottom: 3 }}>Date :</div>
                  <div style={{ height: 1, background: 'rgba(255,255,255,0.1)' }} />
                </div>
              </div>
            </div>
          ))}
        </div>

        <p style={{ fontSize: 11, color: '#475569', marginTop: 14, textAlign: 'center', lineHeight: 1.5 }}>
          Les signatures seront apposées manuellement sur le document imprimé.
        </p>
      </div>

      {error && (
        <div style={{ padding: '12px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, fontSize: 13, color: '#EF4444' }}>⚠️ {error}</div>
      )}
    </div>
  );
}
