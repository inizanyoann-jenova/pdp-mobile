import React, { useState, useEffect } from 'react';
import { MapPin, Bookmark, BookmarkCheck, ChevronDown, Trash2 } from 'lucide-react';
import { useTheme } from '../../contexts/ThemeContext';
import { getTemplates, saveTemplate, deleteTemplate } from '../../utils/templatesService';
import { SECTEURS_CHANTIER, TYPES_INTERVENTION, ENVIRONNEMENTS_SITE, METEO_OPTIONS } from '../../utils/risques';

export default function StepInfos({ form, setField, swipeDir }) {
  const { theme } = useTheme();
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateName, setTemplateName]   = useState('');
  const [savingTpl, setSavingTpl]         = useState(false);
  const [templates, setTemplates]         = useState([]);

  useEffect(() => { getTemplates().then(setTemplates); }, []);

  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;
    await saveTemplate(templateName, form);
    getTemplates().then(setTemplates);
    setTemplateName(''); setSavingTpl(false);
  };

  const handleLoadTemplate = (tpl) => {
    Object.entries(tpl.data).forEach(([k, v]) => setField(k, v));
    setShowTemplates(false);
  };

  const handleDeleteTemplate = async (id) => {
    await deleteTemplate(id); getTemplates().then(setTemplates);
  };

  return (
    <div className={`${swipeDir === 'left' ? 'slide-in-left' : 'slide-in-right'}`} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Templates */}
      <div style={{ display: 'flex', gap: 8 }}>
        <button type="button" onClick={() => setShowTemplates(s => !s)}
          style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: 12, background: theme.bgCard, border: `1px solid ${showTemplates ? 'rgba(79,99,231,0.4)' : theme.border}`, color: showTemplates ? '#4F63E7' : theme.text3, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Bookmark size={14} /> {templates.length > 0 ? `Modèles (${templates.length})` : 'Modèles'}
          </span>
          <ChevronDown size={14} style={{ transform: showTemplates ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>
        <button type="button" onClick={() => setSavingTpl(s => !s)} title="Sauvegarder comme modèle"
          style={{ width: 44, height: 44, borderRadius: 12, background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.text3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <BookmarkCheck size={16} />
        </button>
      </div>

      {savingTpl && (
        <div style={{ display: 'flex', gap: 8, padding: '10px 14px', background: theme.bgCard, border: `1px solid rgba(79,99,231,0.3)`, borderRadius: 12 }}>
          <input autoFocus placeholder="Nom du modèle…" value={templateName} onChange={e => setTemplateName(e.target.value)} onKeyDown={e => e.key === 'Enter' && handleSaveTemplate()}
            style={{ flex: 1, padding: '9px 12px', borderRadius: 10, background: theme.inputBg, border: `1px solid ${theme.border}`, color: theme.text1, fontSize: 13, outline: 'none' }} />
          <button type="button" onClick={handleSaveTemplate} style={{ padding: '0 14px', borderRadius: 10, background: '#4F63E7', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Sauver</button>
        </div>
      )}

      {showTemplates && (
        <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12, overflow: 'hidden' }}>
          {templates.length === 0 ? (
            <div style={{ padding: 16, textAlign: 'center', color: theme.text4, fontSize: 13 }}>Aucun modèle</div>
          ) : templates.map((tpl, i) => (
            <div key={tpl.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderTop: i > 0 ? `1px solid ${theme.border2}` : 'none' }}>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 13, fontWeight: 700, color: theme.text1 }}>{tpl.name}</div>
                <div style={{ fontSize: 11, color: theme.text4 }}>{tpl.data.type_travaux || tpl.data.lieu || '—'}</div>
              </div>
              <button type="button" onClick={() => handleLoadTemplate(tpl)} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(79,99,231,0.12)', border: '1px solid rgba(79,99,231,0.3)', color: '#4F63E7', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>Charger</button>
              <button type="button" onClick={() => handleDeleteTemplate(tpl.id)} style={{ width: 30, height: 30, borderRadius: 8, background: 'none', border: 'none', color: theme.text5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={13} /></button>
            </div>
          ))}
        </div>
      )}

      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 700, color: '#4F63E7', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}><MapPin size={13} /> Localisation & Parties</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div className="field"><label>Lieu du chantier *</label><input value={form.lieu} onChange={e => setField('lieu', e.target.value)} placeholder="Bâtiment B, Zone Nord…" autoFocus /></div>
          <div className="field"><label>Entreprise extérieure *</label><input value={form.entreprise_exterieure} onChange={e => setField('entreprise_exterieure', e.target.value)} placeholder="Nom de la société" /></div>
          <div className="field"><label>Date des travaux *</label><input type="date" value={form.date_travaux} onChange={e => setField('date_travaux', e.target.value)} /></div>
          <div className="field"><label>Responsable QHSE</label><input value={form.responsable} onChange={e => setField('responsable', e.target.value)} placeholder="Prénom Nom" /></div>
          <div className="field"><label>Contact urgence</label><input type="tel" value={form.contact_urgence} onChange={e => setField('contact_urgence', e.target.value)} placeholder="06 00 00 00 00" /></div>
          <div className="field"><label>Intervenants</label><input value={form.intervenants} onChange={e => setField('intervenants', e.target.value)} placeholder="Noms des intervenants…" /></div>
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 700, color: '#10B981', marginBottom: 4 }}>🏗️ Type de travaux</div>
        {(form.types_travaux || []).length > 0 && (
          <div style={{ marginBottom: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
            {(form.types_travaux || []).map(t => <span key={t} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 12, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981', fontWeight: 600 }}>{t}</span>)}
          </div>
        )}
        {SECTEURS_CHANTIER.map(sec => (
          <div key={sec.secteur} style={{ marginBottom: 10 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', marginBottom: 6 }}>{sec.secteur}</div>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
              {sec.types.map(t => {
                const selected = (form.types_travaux || []).includes(t);
                return (
                  <button key={t} type="button"
                    onClick={() => {
                      const cur  = form.types_travaux || [];
                      const next = selected ? cur.filter(v => v !== t) : [...cur, t];
                      setField('types_travaux', next);
                      setField('type_travaux', next[0] || '');
                    }}
                    style={{ padding: '6px 12px', borderRadius: 20, fontSize: 12, fontWeight: 600, cursor: 'pointer', border: `1.5px solid ${selected ? sec.color : 'rgba(255,255,255,0.1)'}`, background: selected ? sec.color + '20' : 'transparent', color: selected ? sec.color : '#94A3B8', transition: 'all 0.12s' }}>
                    {t}
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 700, color: '#F59E0B', marginBottom: 10 }}>⚙️ Type d'intervention</div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {TYPES_INTERVENTION.map(t => (
            <button key={t.value} type="button" onClick={() => setField('type_intervention', t.value)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, cursor: 'pointer', border: `1.5px solid ${form.type_intervention === t.value ? '#4F63E7' : 'rgba(255,255,255,0.08)'}`, background: form.type_intervention === t.value ? 'rgba(79,99,231,0.12)' : '#152236', textAlign: 'left' }}>
              <span style={{ fontSize: 18 }}>{t.label.split(' ')[0]}</span>
              <div>
                <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>{t.label.substring(t.label.indexOf(' ') + 1)}</div>
                <div style={{ fontSize: 11, color: '#64748B' }}>{t.desc}</div>
              </div>
            </button>
          ))}
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 700, color: '#8B5CF6', marginBottom: 10 }}>🗺️ Environnement du site</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
          {ENVIRONNEMENTS_SITE.map(e => {
            const sel = form.environnement.includes(e.value);
            return (
              <button key={e.value} type="button" onClick={() => setField('environnement', sel ? form.environnement.filter(v => v !== e.value) : [...form.environnement, e.value])}
                style={{ padding: '7px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: `1.5px solid ${sel ? '#8B5CF6' : 'rgba(255,255,255,0.08)'}`, background: sel ? 'rgba(139,92,246,0.15)' : '#152236', color: sel ? '#C4B5FD' : '#94A3B8', fontWeight: sel ? 700 : 400 }}>
                {e.label}
              </button>
            );
          })}
        </div>
      </div>

      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 700, color: '#06B6D4', marginBottom: 10 }}>🌤️ Météo & Conditions</div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 10 }}>
          {METEO_OPTIONS.map(m => (
            <button key={m.value} type="button" onClick={() => setField('meteo', m.value)}
              style={{ padding: '7px 12px', borderRadius: 20, fontSize: 12, cursor: 'pointer', border: `1.5px solid ${form.meteo === m.value ? '#06B6D4' : 'rgba(255,255,255,0.08)'}`, background: form.meteo === m.value ? 'rgba(6,182,212,0.15)' : '#152236', color: form.meteo === m.value ? '#67E8F9' : '#94A3B8', fontWeight: form.meteo === m.value ? 700 : 400 }}>
              {m.label}
            </button>
          ))}
        </div>
        <div className="field"><label>Température (°C)</label><input type="number" value={form.temperature} onChange={e => setField('temperature', e.target.value)} placeholder="Ex: 22" /></div>
      </div>

      <div className="card">
        <div style={{ fontSize: 12, fontWeight: 700, color: '#F97316', marginBottom: 10 }}>📋 Description</div>
        <div className="field"><label>Nature & étendue des travaux</label><textarea value={form.description_travaux} onChange={e => setField('description_travaux', e.target.value)} placeholder="Décrivez les travaux, durée prévue, équipements…" rows={4} /></div>
      </div>
    </div>
  );
}
