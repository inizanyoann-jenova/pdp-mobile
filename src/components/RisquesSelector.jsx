import React, { useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';

export const CATEGORIES_RISQUES = [
  {
    id: 'hauteur',
    label: 'Travaux en hauteur',
    emoji: '🪜',
    color: '#F97316',
    risques: [
      { id: 'chute_personnes',    label: 'Chute de personnes' },
      { id: 'chute_objets',       label: 'Chute d\'objets' },
      { id: 'echafaudages',       label: 'Utilisation d\'échafaudages / PIRL' },
    ],
  },
  {
    id: 'manutention',
    label: 'Manutention & Ergonomie',
    emoji: '💪',
    color: '#F59E0B',
    risques: [
      { id: 'manut_manuelle',     label: 'Manutention manuelle de charges' },
      { id: 'postures',           label: 'Postures contraignantes' },
      { id: 'mouvements_rep',     label: 'Mouvements répétitifs' },
    ],
  },
  {
    id: 'manut_meca',
    label: 'Manutention mécanique',
    emoji: '🏗️',
    color: '#EAB308',
    risques: [
      { id: 'engins_levage',      label: 'Utilisation d\'engins de levage' },
      { id: 'chariots',           label: 'Chariots automoteurs' },
      { id: 'grues',              label: 'Grues' },
    ],
  },
  {
    id: 'electrique',
    label: 'Risques électriques',
    emoji: '⚡',
    color: '#EF4444',
    risques: [
      { id: 'travaux_tension',    label: 'Travaux sous tension' },
      { id: 'voisinage_elec',     label: 'Voisinage électrique' },
      { id: 'electroportatif',    label: 'Utilisation de matériel électroportatif' },
    ],
  },
  {
    id: 'circulation',
    label: 'Circulation & Co-activité',
    emoji: '🚧',
    color: '#8B5CF6',
    risques: [
      { id: 'pietons_vehicules',  label: 'Interférence entre piétons et véhicules' },
      { id: 'voies_circulation',  label: 'Encombrement des voies de circulation' },
      { id: 'travail_superpose',  label: 'Travail superposé' },
    ],
  },
  {
    id: 'chimique',
    label: 'Risques Chimiques & Biologiques',
    emoji: '☣️',
    color: '#10B981',
    risques: [
      { id: 'produits_dangereux', label: 'Exposition à des produits dangereux' },
      { id: 'amiante_plomb',      label: 'Poussières / Amiante / Plomb' },
      { id: 'gaz_vapeurs',        label: 'Gaz et vapeurs' },
    ],
  },
  {
    id: 'environnement',
    label: 'Environnement de travail',
    emoji: '🌡️',
    color: '#06B6D4',
    risques: [
      { id: 'bruit',              label: 'Bruit élevé' },
      { id: 'espace_confine',     label: 'Espace confiné' },
      { id: 'travail_isole',      label: 'Travail isolé' },
      { id: 'intemperies',        label: 'Intempéries / Fortes chaleurs' },
    ],
  },
  {
    id: 'incendie',
    label: 'Incendie & Explosion',
    emoji: '🔥',
    color: '#DC2626',
    risques: [
      { id: 'points_chauds',      label: 'Travaux par points chauds / Soudure' },
      { id: 'inflammables',       label: 'Présence de produits inflammables' },
      { id: 'atex',               label: 'Zone ATEX' },
    ],
  },
];

export default function RisquesSelector({ value = {}, onChange }) {
  const [expanded, setExpanded] = useState({});

  const toggle = (catId) => setExpanded(prev => ({ ...prev, [catId]: !prev[catId] }));

  const isChecked = (catId, risqueId) => {
    return !!(value[catId] && value[catId].includes(risqueId));
  };

  const toggleRisque = (catId, risqueId) => {
    const current = value[catId] || [];
    const next = current.includes(risqueId)
      ? current.filter(r => r !== risqueId)
      : [...current, risqueId];
    const updated = { ...value };
    if (next.length === 0) {
      delete updated[catId];
    } else {
      updated[catId] = next;
    }
    onChange(updated);
  };

  const countSelected = (catId) => (value[catId] || []).length;
  const totalSelected = Object.values(value).flat().length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {totalSelected > 0 && (
        <div style={{
          background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)',
          borderRadius: 10, padding: '8px 14px',
          fontSize: 13, fontWeight: 700, color: '#EF4444',
          display: 'flex', alignItems: 'center', gap: 6,
        }}>
          ⚠️ {totalSelected} situation{totalSelected > 1 ? 's' : ''} à risque sélectionnée{totalSelected > 1 ? 's' : ''}
        </div>
      )}

      {CATEGORIES_RISQUES.map((cat) => {
        const isOpen = expanded[cat.id];
        const nb = countSelected(cat.id);
        return (
          <div key={cat.id} style={{ borderRadius: 14, overflow: 'hidden', border: `1.5px solid ${nb > 0 ? cat.color + '50' : 'rgba(255,255,255,0.07)'}`, background: nb > 0 ? cat.color + '08' : '#0f1929' }}>
            {/* Catégorie header */}
            <button
              onClick={() => toggle(cat.id)}
              style={{
                width: '100%', display: 'flex', alignItems: 'center', gap: 10,
                padding: '14px 14px', background: 'transparent', border: 'none',
                cursor: 'pointer', textAlign: 'left',
              }}
            >
              <span style={{ fontSize: 20, flexShrink: 0 }}>{cat.emoji}</span>
              <span style={{ flex: 1, fontSize: 14, fontWeight: 700, color: '#F1F5F9' }}>{cat.label}</span>
              {nb > 0 && (
                <span style={{
                  fontSize: 11, fontWeight: 800, minWidth: 20, height: 20,
                  borderRadius: 100, background: cat.color + '25',
                  color: cat.color, border: `1px solid ${cat.color}50`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 6px',
                }}>
                  {nb}
                </span>
              )}
              {isOpen ? <ChevronDown size={16} style={{ color: '#64748B', flexShrink: 0 }} /> : <ChevronRight size={16} style={{ color: '#64748B', flexShrink: 0 }} />}
            </button>

            {/* Risques list */}
            {isOpen && (
              <div style={{ padding: '0 12px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                {cat.risques.map(risque => {
                  const checked = isChecked(cat.id, risque.id);
                  return (
                    <label key={risque.id} className={`risk-checkbox${checked ? ' checked' : ''}`}
                      onClick={() => toggleRisque(cat.id, risque.id)}
                    >
                      <div className="check-box">
                        {checked && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>
                      <span style={{ fontSize: 14, color: checked ? '#F1F5F9' : '#94A3B8', fontWeight: checked ? 600 : 400 }}>
                        {risque.label}
                      </span>
                    </label>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
