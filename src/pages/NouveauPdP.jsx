import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { saveDraft, getAllDrafts, removeDraft } from '../utils/offlineStorage';
import { getTemplates, saveTemplate, deleteTemplate } from '../utils/templatesService';
import { useTheme } from '../contexts/ThemeContext';
import { useToast } from '../contexts/ToastContext';
import { useOfflineSync } from '../hooks/useOfflineSync';
import {
  ArrowLeft, ArrowRight, Save, CheckCircle2,
  MapPin, Building2, FileText, ShieldCheck, PenLine,
  Plus, Trash2, AlertTriangle, Bookmark, BookmarkCheck,
  ChevronDown, Sun, Moon,
} from 'lucide-react';
import PhotoCapture from '../components/PhotoCapture';
import AnalyseRisques from '../components/AnalyseRisques';
import SignaturePad from '../components/SignaturePad';
import { SECTEURS_CHANTIER, TYPES_INTERVENTION, ENVIRONNEMENTS_SITE, METEO_OPTIONS, calcScore, calcScoreResiduel, getNiveauRisque, RISQUE_COLORS } from '../utils/risques';
import { genererMesuresSuggerees } from '../utils/prevention';

const STEPS = [
  { id: 'infos',      label: 'Chantier',    icon: MapPin },
  { id: 'photos',     label: 'Photos',      icon: Building2 },
  { id: 'analyse',    label: 'Analyse',     icon: ShieldCheck },
  { id: 'prevention', label: 'Prévention',  icon: FileText },
  { id: 'signatures', label: 'Signatures',  icon: PenLine },
];

const EMPTY = {
  lieu: '', entreprise_exterieure: '', date_travaux: new Date().toISOString().split('T')[0],
  responsable: '', contact_urgence: '', description_travaux: '', intervenants: '',
  type_travaux: '', types_travaux: [], type_intervention: '', environnement: [], meteo: '', temperature: '',
  photos: [],
  reponses: {}, observations_questions: {}, photos_questions: {}, custom_questions: {},
  mesures_suggerees: [], mesures_prevention: '', score_residuel: null,
  signature_qhse: '', signature_responsable: '',
  statut: 'brouillon',
};

export default function NouveauPdP({ session, initialData, editId }) {
  const navigate      = useNavigate();
  const { theme, isDark, toggle } = useTheme();
  const { addToast } = useToast();
  const [step, setStep]           = useState(0);
  const [swipeDir, setSwipeDir]   = useState('right');
  const [form, setForm]           = useState(() => initialData ? { ...EMPTY, ...initialData } : { ...EMPTY });
  const [saving, setSaving]       = useState(false);
  const [error, setError]         = useState('');
  const [saved, setSaved]         = useState(false);
  const [newMesure, setNewMesure] = useState('');
  const [showTemplates, setShowTemplates] = useState(false);
  const [templateName, setTemplateName]   = useState('');
  const [savingTpl, setSavingTpl]         = useState(false);
  const [templates, setTemplates]         = useState([]);
  const touchStart = useRef(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Charge les templates depuis Supabase au montage
  useEffect(() => { getTemplates().then(setTemplates); }, []);

  useEffect(() => {
    const handler = (e) => {
      if (!hasUnsavedChanges) return;
      e.preventDefault();
      e.returnValue = '';
    };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  // Sync offline drafts and photos when reconnected
  useOfflineSync();

  const setField = (key, val) => { setForm(f => ({ ...f, [key]: val })); setHasUnsavedChanges(true); };

  const score         = useMemo(() => calcScore(form.reponses), [form.reponses]);
  const scoreResiduel = useMemo(() => calcScoreResiduel(score, form.mesures_suggerees), [score, form.mesures_suggerees]);
  const niveau = useMemo(() => getNiveauRisque(score), [score]);
  const nInfo  = RISQUE_COLORS[niveau];

  // Génère les suggestions quand on arrive à l'étape prévention
  const onEnterPrevention = () => {
    const suggestions = genererMesuresSuggerees(form.reponses);
    // Fusionner avec les suggestions déjà existantes (garder les sélections de l'utilisateur)
    const existing = form.mesures_suggerees;
    const merged = suggestions.map(s => {
      const prev = existing.find(e => e.mesure === s.mesure);
      return prev ? { ...s, selectionnee: prev.selectionnee } : s;
    });
    setField('mesures_suggerees', merged);
  };

  const handleNext = () => {
    if (step === 2) onEnterPrevention();
    setSwipeDir('right');
    setStep(s => s + 1);
    window.scrollTo(0, 0);
  };

  const handlePrev = () => {
    if (step === 0) { navigate('/'); return; }
    setSwipeDir('left');
    setStep(s => s - 1);
    window.scrollTo(0, 0);
  };

  const canNext = () => {
    if (step === 0) return form.lieu.trim() && form.entreprise_exterieure.trim() && form.date_travaux;
    return true;
  };

  // ── Swipe handlers ──────────────���───────────────────────────────────────────
  const onTouchStart = useCallback((e) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    // Swipe horizontal net (> 60px, pas vertical)
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.8) return;
    if (dx < 0 && canNext()) handleNext();
    if (dx > 0 && step > 0) handlePrev();
  }, [step, canNext]); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Templates ───────────────────────────────��────────────────────────────
  const handleSaveTemplate = async () => {
    if (!templateName.trim()) return;
    await saveTemplate(templateName, form);
    getTemplates().then(setTemplates);
    setTemplateName('');
    setSavingTpl(false);
  };

  const handleLoadTemplate = (tpl) => {
    setForm(f => ({ ...f, ...tpl.data }));
    setShowTemplates(false);
  };

  const handleDeleteTemplate = async (id) => {
    await deleteTemplate(id);
    getTemplates().then(setTemplates);
  };

  const handleSave = async (finalStatut) => {
    setSaving(true); setError('');
    // Serialize signature objects to JSON strings for Supabase TEXT columns
    const serializeSig = (v) => {
      if (!v) return null;
      if (typeof v === 'string') return v; // already serialized or old plain data URL
      try { return JSON.stringify(v); } catch { return null; }
    };
    const payload = {
      ...form,
      signature_qhse:          serializeSig(form.signature_qhse),
      signature_responsable:   serializeSig(form.signature_responsable),
      statut: finalStatut,
      created_by: session?.user?.id,
      score_risque: score, niveau_risque: niveau,
      score_residuel: scoreResiduel,
    };

    // Mode hors-ligne
    if (!navigator.onLine) {
      saveDraft(payload);
      setSaving(false);
      setSaved(true);
      setHasUnsavedChanges(false);
      addToast({ message: 'Plan sauvegardé localement (hors-ligne)', type: 'info' });
      setTimeout(() => navigate('/'), 1800);
      return;
    }

    if (editId) {
      // Mode édition : UPDATE
      const { error: err } = await supabase.from('plans_prevention').update(payload).eq('id', editId);
      setSaving(false);
      if (err) {
        console.error('[NouveauPdP] Erreur sauvegarde:', err);
        addToast({ message: 'Erreur lors de la sauvegarde : ' + (err.message || 'connexion perdue'), type: 'error' });
        setError(err.message);
        return;
      }
    } else {
      // Mode création : INSERT
      const { error: err } = await supabase.from('plans_prevention').insert([payload]);
      setSaving(false);
      if (err) {
        if (err.message?.includes('network') || err.message?.includes('fetch')) {
          saveDraft(payload);
          setSaved(true);
          setHasUnsavedChanges(false);
          addToast({ message: 'Plan sauvegardé localement (hors-ligne)', type: 'info' });
          setTimeout(() => navigate('/'), 1800);
          return;
        }
        console.error('[NouveauPdP] Erreur sauvegarde:', err);
        addToast({ message: 'Erreur lors de la sauvegarde : ' + (err.message || 'connexion perdue'), type: 'error' });
        setError(err.message);
        return;
      }
    }
    setHasUnsavedChanges(false);
    addToast({ message: 'Plan sauvegardé avec succès', type: 'success' });
    setSaved(true);
    setTimeout(() => navigate(editId ? `/pdp/${editId}` : '/'), 1800);
  };

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

  // ── Confirmation ────────────────────────────────────────────────────────────
  if (saved) return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: theme.bg, gap: 16, padding: 24 }}>
      <CheckCircle2 size={72} style={{ color: '#10B981' }} />
      <div style={{ fontSize: 22, fontWeight: 800, color: theme.text1, textAlign: 'center' }}>
        {editId ? 'Plan de Prévention mis à jour !' : 'Plan de Prévention enregistré !'}
      </div>
      <div style={{ fontSize: 14, color: theme.text4 }}>Redirection…</div>
    </div>
  );

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: theme.bg }}>

      {/* Header */}
      <div style={{ padding: 'calc(env(safe-area-inset-top,0px) + 10px) 14px 10px', background: theme.bgCard, borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <button onClick={handlePrev} style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.iconBg, color: theme.text3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: theme.text1 }}>
              {editId ? 'Modifier le Plan' : 'Nouveau Plan de Prévention'}
            </div>
            <div style={{ fontSize: 11, color: theme.text4 }}>Étape {step + 1}/{STEPS.length} — {STEPS[step].label}</div>
          </div>
          {step >= 2 && Object.keys(form.reponses).length > 0 && (
            <div style={{ textAlign: 'center', background: nInfo.bg, border: `1px solid ${nInfo.border}`, borderRadius: 10, padding: '4px 10px' }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: nInfo.text }}>{score}</div>
              <div style={{ fontSize: 9, color: nInfo.text }}>{nInfo.label}</div>
            </div>
          )}
          <button onClick={toggle} style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.iconBg, color: theme.text3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            {isDark ? <Sun size={15} /> : <Moon size={15} />}
          </button>
        </div>
        {/* Step dots */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
          {STEPS.map((s, i) => (
            <div key={s.id} className={`step-dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />
          ))}
        </div>
      </div>

      {/* Contenu — swipe activé */}
      <div
        className="scroll-area"
        style={{ flex: 1, padding: '14px' }}
        onTouchStart={onTouchStart}
        onTouchEnd={onTouchEnd}
      >

        {/* ── ÉTAPE 1 : Informations chantier ─────────────────────────────── */}
        {step === 0 && (
          <div className={`${swipeDir === 'left' ? 'slide-in-left' : 'slide-in-right'}`} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            {/* ── Templates ── */}
            <div style={{ display: 'flex', gap: 8 }}>
              <button
                type="button"
                onClick={() => setShowTemplates(s => !s)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderRadius: 12, background: theme.bgCard, border: `1px solid ${showTemplates ? 'rgba(79,99,231,0.4)' : theme.border}`, color: showTemplates ? '#4F63E7' : theme.text3, cursor: 'pointer', fontSize: 13, fontWeight: 700 }}
              >
                <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <Bookmark size={14} /> {templates.length > 0 ? `Modèles (${templates.length})` : 'Modèles'}
                </span>
                <ChevronDown size={14} style={{ transform: showTemplates ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />
              </button>
              <button
                type="button"
                onClick={() => setSavingTpl(s => !s)}
                title="Sauvegarder comme modèle"
                style={{ width: 44, height: 44, borderRadius: 12, background: theme.bgCard, border: `1px solid ${theme.border}`, color: theme.text3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <BookmarkCheck size={16} />
              </button>
            </div>

            {/* Sauvegarder modèle */}
            {savingTpl && (
              <div style={{ display: 'flex', gap: 8, padding: '10px 14px', background: theme.bgCard, border: `1px solid rgba(79,99,231,0.3)`, borderRadius: 12 }}>
                <input
                  autoFocus
                  placeholder="Nom du modèle (ex: Toiture standard…)"
                  value={templateName}
                  onChange={e => setTemplateName(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleSaveTemplate()}
                  style={{ flex: 1, padding: '9px 12px', borderRadius: 10, background: theme.inputBg, border: `1px solid ${theme.border}`, color: theme.text1, fontSize: 13, outline: 'none' }}
                />
                <button type="button" onClick={handleSaveTemplate} style={{ padding: '0 14px', borderRadius: 10, background: '#4F63E7', border: 'none', color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                  Sauver
                </button>
              </div>
            )}

            {/* Liste des modèles */}
            {showTemplates && (
              <div style={{ background: theme.bgCard, border: `1px solid ${theme.border}`, borderRadius: 12, overflow: 'hidden' }}>
                {templates.length === 0 ? (
                  <div style={{ padding: '16px', textAlign: 'center', color: theme.text4, fontSize: 13 }}>Aucun modèle sauvegardé</div>
                ) : (
                  templates.map((tpl, i) => (
                    <div key={tpl.id} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '11px 14px', borderTop: i > 0 ? `1px solid ${theme.border2}` : 'none' }}>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: theme.text1 }}>{tpl.name}</div>
                        <div style={{ fontSize: 11, color: theme.text4 }}>{tpl.data.type_travaux || tpl.data.lieu || '—'}</div>
                      </div>
                      <button type="button" onClick={() => handleLoadTemplate(tpl)} style={{ padding: '6px 12px', borderRadius: 8, background: 'rgba(79,99,231,0.12)', border: '1px solid rgba(79,99,231,0.3)', color: '#4F63E7', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                        Charger
                      </button>
                      <button type="button" onClick={() => handleDeleteTemplate(tpl.id)} style={{ width: 30, height: 30, borderRadius: 8, background: 'none', border: 'none', color: theme.text5, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Trash2 size={13} />
                      </button>
                    </div>
                  ))
                )}
              </div>
            )}

            <div className="card">
              <div style={{ fontSize: 12, fontWeight: 700, color: '#4F63E7', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
                <MapPin size={13} /> Localisation & Parties
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div className="field"><label>Lieu du chantier *</label><input value={form.lieu} onChange={e=>setField('lieu',e.target.value)} placeholder="Bâtiment B, Zone Nord, Toit-terrasse…" autoFocus /></div>
                <div className="field"><label>Entreprise extérieure *</label><input value={form.entreprise_exterieure} onChange={e=>setField('entreprise_exterieure',e.target.value)} placeholder="Nom de la société intervenante" /></div>
                <div className="field"><label>Date des travaux *</label><input type="date" value={form.date_travaux} onChange={e=>setField('date_travaux',e.target.value)} /></div>
                <div className="field"><label>Responsable QHSE / Donneur d'ordre</label><input value={form.responsable} onChange={e=>setField('responsable',e.target.value)} placeholder="Prénom Nom" /></div>
                <div className="field"><label>Contact urgence (tél.)</label><input type="tel" value={form.contact_urgence} onChange={e=>setField('contact_urgence',e.target.value)} placeholder="06 00 00 00 00" /></div>
                <div className="field"><label>Intervenants</label><input value={form.intervenants} onChange={e=>setField('intervenants',e.target.value)} placeholder="Noms des intervenants…" /></div>
              </div>
            </div>

            <div className="card">
              <div style={{ fontSize: 12, fontWeight: 700, color: '#10B981', marginBottom: 4 }}>🏗️ Type de travaux</div>
              <p style={{ fontSize: 11, color: '#64748B', marginBottom: 10 }}>Sélectionnez un ou plusieurs types — les catégories de risque seront priorisées en conséquence.</p>
              {(form.types_travaux || []).length > 0 && (
                <div style={{ marginBottom: 10, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {(form.types_travaux || []).map(t => (
                    <span key={t} style={{ fontSize: 11, padding: '3px 8px', borderRadius: 12, background: 'rgba(16,185,129,0.12)', border: '1px solid rgba(16,185,129,0.3)', color: '#10B981', fontWeight: 600 }}>{t}</span>
                  ))}
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
                            const cur = form.types_travaux || [];
                            const next = selected ? cur.filter(v => v !== t) : [...cur, t];
                            setField('types_travaux', next);
                            // Keep legacy single field in sync with first selected
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
                      <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9' }}>{t.label.substring(t.label.indexOf(' ')+1)}</div>
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
                    <button key={e.value} type="button" onClick={() => {
                      const cur = form.environnement;
                      setField('environnement', sel ? cur.filter(v => v !== e.value) : [...cur, e.value]);
                    }}
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
              <div className="field"><label>Température (°C)</label><input type="number" value={form.temperature} onChange={e=>setField('temperature',e.target.value)} placeholder="Ex: 22" /></div>
            </div>

            <div className="card">
              <div style={{ fontSize: 12, fontWeight: 700, color: '#F97316', marginBottom: 10 }}>📋 Description</div>
              <div className="field"><label>Nature & étendue des travaux</label><textarea value={form.description_travaux} onChange={e=>setField('description_travaux',e.target.value)} placeholder="Décrivez les travaux, durée prévue, équipements utilisés…" rows={4} /></div>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 2 : Photos ─────────────────────────────────────────────── */}
        {step === 1 && (
          <div className="fade-up">
            <div className="card">
              <div style={{ fontSize: 13, fontWeight: 700, color: '#64748B', marginBottom: 6 }}>📷 Documentation photographique</div>
              <p style={{ fontSize: 12, color: '#64748B', marginBottom: 14, lineHeight: 1.5 }}>
                Photographiez l'environnement, les accès, les équipements et les zones à risque.
              </p>
              <PhotoCapture photos={form.photos} onChange={val => setField('photos', val)} />
            </div>
          </div>
        )}

        {/* ── ÉTAPE 3 : Analyse de risques ─────────────────────────────────── */}
        {step === 2 && (
          <div className="fade-up">
            <AnalyseRisques
              reponses={form.reponses}
              observations={form.observations_questions}
              photos={form.photos_questions}
              onChange={(qId, val) => setField('reponses', { ...form.reponses, [qId]: val })}
              onObservation={(qId, val) => setField('observations_questions', { ...form.observations_questions, [qId]: val })}
              onPhoto={(qId, val) => {
                const updated = { ...form.photos_questions };
                if (val) updated[qId] = val; else delete updated[qId];
                setField('photos_questions', updated);
              }}
              typesTravaux={form.types_travaux || []}
              customQuestions={form.custom_questions || {}}
              onAddCustomQuestion={(catId, text) => {
                const id = `custom_${catId}_${Date.now()}`;
                const prev = (form.custom_questions || {})[catId] || [];
                setField('custom_questions', { ...(form.custom_questions || {}), [catId]: [...prev, { id, text }] });
              }}
              onRemoveCustomQuestion={(catId, qId) => {
                const prev = (form.custom_questions || {})[catId] || [];
                const updatedCQ = { ...(form.custom_questions || {}), [catId]: prev.filter(q => q.id !== qId) };
                const { [qId]: _r, ...cleanReponses } = form.reponses;
                const { [qId]: _o, ...cleanObs } = form.observations_questions;
                const { [qId]: _p, ...cleanPhotos } = form.photos_questions;
                setForm(f => ({ ...f, custom_questions: updatedCQ, reponses: cleanReponses, observations_questions: cleanObs, photos_questions: cleanPhotos }));
                setHasUnsavedChanges(true);
              }}
            />
          </div>
        )}

        {/* ── ÉTAPE 4 : Mesures de prévention ─────────────────────────────── */}
        {step === 3 && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Score récap */}
            <div className="card" style={{ textAlign: 'center', border: `1.5px solid ${nInfo.border}`, background: nInfo.bg }}>
              <div style={{ fontSize: 11, fontWeight: 700, color: nInfo.text, textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 6 }}>Niveau de risque calculé</div>
              <div style={{ fontSize: 38, fontWeight: 900, color: nInfo.text }}>{score}<span style={{ fontSize: 16, opacity: 0.6 }}>/25</span></div>
              <div style={{ fontSize: 16, fontWeight: 700, color: nInfo.text, marginTop: 4 }}>{nInfo.label}</div>
              <div style={{ fontSize: 11, color: nInfo.text, opacity: 0.7, marginTop: 4 }}>
                {Object.values(form.reponses).filter(r=>r==='non').length} non-conformité(s) • {Object.values(form.reponses).filter(r=>r==='nsp').length} à vérifier
              </div>
              {form.mesures_suggerees.some(m => m.selectionnee) && scoreResiduel !== score && (
                <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${nInfo.border}40` }}>
                  <div style={{ fontSize: 10, color: nInfo.text, opacity: 0.7, marginBottom: 2 }}>Score résiduel (après mesures)</div>
                  <div style={{ fontSize: 24, fontWeight: 900, color: RISQUE_COLORS[getNiveauRisque(scoreResiduel)].text }}>
                    {scoreResiduel}<span style={{ fontSize: 12, opacity: 0.6 }}>/25</span>
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 700, color: RISQUE_COLORS[getNiveauRisque(scoreResiduel)].text }}>
                    {RISQUE_COLORS[getNiveauRisque(scoreResiduel)].label}
                  </div>
                </div>
              )}
            </div>

            {/* Suggestions auto */}
            {form.mesures_suggerees.length > 0 ? (
              <div className="card">
                <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', marginBottom: 4 }}>
                  🛡️ Mesures suggérées automatiquement
                </div>
                <p style={{ fontSize: 12, color: '#64748B', marginBottom: 12 }}>
                  Basées sur vos réponses. Décochez ce qui n'est pas applicable.
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {form.mesures_suggerees.map(m => (
                    <div key={m.id} style={{ display: 'flex', alignItems: 'flex-start', gap: 10, padding: '10px 12px', borderRadius: 10, border: `1.5px solid ${m.selectionnee ? (m.priorite==='haute'?'rgba(239,68,68,0.35)':'rgba(16,185,129,0.3)') : 'rgba(255,255,255,0.06)'}`, background: m.selectionnee ? (m.priorite==='haute'?'rgba(239,68,68,0.06)':'rgba(16,185,129,0.05)') : 'rgba(255,255,255,0.02)' }}>
                      <button type="button" onClick={() => toggleMesure(m.id)}
                        style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${m.selectionnee?(m.priorite==='haute'?'#EF4444':'#10B981'):'rgba(255,255,255,0.2)'}`, background: m.selectionnee?(m.priorite==='haute'?'#EF4444':'#10B981'):'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0, marginTop: 1 }}>
                        {m.selectionnee && <svg width="12" height="12" viewBox="0 0 12 12"><path d="M2 6l3 3 5-5" stroke="#fff" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                      </button>
                      <div style={{ flex: 1, fontSize: 13, color: m.selectionnee?'#CBD5E1':'#475569', lineHeight: 1.5 }}>
                        {m.mesure}
                      </div>
                      {m.priorite === 'haute' && (
                        <span style={{ fontSize: 10, fontWeight: 700, color: '#EF4444', flexShrink: 0, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 100, padding: '2px 6px' }}>⚡ PRIORITAIRE</span>
                      )}
                      <button type="button" onClick={() => removeMesure(m.id)}
                        style={{ width: 24, height: 24, borderRadius: 6, border: 'none', background: 'transparent', color: '#475569', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                        <Trash2 size={12} />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="card" style={{ textAlign: 'center', padding: '24px 16px', color: '#64748B' }}>
                <AlertTriangle size={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                <p style={{ fontSize: 13 }}>Aucune non-conformité détectée — aucune mesure suggérée automatiquement.</p>
              </div>
            )}

            {/* Ajouter une mesure custom */}
            <div className="card">
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 10 }}>➕ Ajouter une mesure personnalisée</div>
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  value={newMesure} onChange={e => setNewMesure(e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && addCustomMesure()}
                  placeholder="Décrire une mesure complémentaire…"
                  style={{ flex: 1, padding: '12px 14px', borderRadius: 12, background: '#152236', border: '1.5px solid rgba(255,255,255,0.08)', color: '#F1F5F9', fontSize: 13, outline: 'none' }}
                />
                <button type="button" className="btn btn-primary" style={{ minWidth: 48, padding: '0 14px' }} onClick={addCustomMesure}>
                  <Plus size={18} />
                </button>
              </div>
            </div>

            {/* Mesures libres complémentaires */}
            <div className="card">
              <div style={{ fontSize: 12, fontWeight: 700, color: '#64748B', marginBottom: 8 }}>📝 Notes de prévention libres</div>
              <div className="field">
                <textarea value={form.mesures_prevention} onChange={e=>setField('mesures_prevention',e.target.value)} placeholder="Consignes spécifiques, EPI obligatoires, permis de travail, consignations…" rows={4} />
              </div>
            </div>
          </div>
        )}

        {/* ── ÉTAPE 5 : Signatures ─────────────────────────────────────────── */}
        {step === 4 && (
          <div className="fade-up" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div className="card" style={{ textAlign: 'center', borderColor: nInfo.border, background: nInfo.bg }}>
              <div style={{ fontSize: 12, fontWeight: 700, color: nInfo.text, letterSpacing: '0.08em', textTransform: 'uppercase' }}>Risque final — {nInfo.label}</div>
              <div style={{ fontSize: 28, fontWeight: 900, color: nInfo.text, margin: '4px 0' }}>{score}/25</div>
              <div style={{ fontSize: 11, color: nInfo.text, opacity: 0.7 }}>
                {form.mesures_suggerees.filter(m=>m.selectionnee).length} mesure(s) de prévention retenue(s)
              </div>
            </div>

            <div className="card">
              <p style={{ fontSize: 12, color: '#64748B', marginBottom: 14, lineHeight: 1.6 }}>
                En signant ce document, les deux parties reconnaissent avoir pris connaissance des risques identifiés et s'engagent à respecter les mesures de prévention définies.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                <SignaturePad label="Responsable QHSE / Donneur d'ordre" value={form.signature_qhse} onChange={val => setField('signature_qhse', val)} />
                <div style={{ height: 1, background: 'rgba(255,255,255,0.06)' }} />
                <SignaturePad label="Responsable de site / Chef de chantier" value={form.signature_responsable} onChange={val => setField('signature_responsable', val)} />
              </div>
            </div>

            {error && (
              <div style={{ padding: '12px 14px', background: 'rgba(239,68,68,0.08)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 10, fontSize: 13, color: '#EF4444' }}>
                ⚠️ {error}
              </div>
            )}
          </div>
        )}

        <div style={{ height: 100 }} />
      </div>

      {/* Footer */}
      <div style={{ padding: '12px 14px', paddingBottom: 'calc(env(safe-area-inset-bottom,0px) + 12px)', background: theme.bgCard, borderTop: `1px solid ${theme.border}`, display: 'flex', gap: 10, flexShrink: 0 }}>
        {step < STEPS.length - 1 ? (
          <button className="btn btn-primary" style={{ flex: 1, fontSize: 15 }} disabled={!canNext()} onClick={handleNext}>
            Suivant <ArrowRight size={18} />
          </button>
        ) : (
          <>
            <button className="btn btn-ghost" style={{ flex: 1 }} disabled={saving} onClick={() => handleSave('brouillon')}>
              <Save size={16} /> {editId ? 'Sauver' : 'Brouillon'}
            </button>
            <button className="btn btn-success" style={{ flex: 2, fontSize: 15 }} disabled={saving} onClick={() => handleSave(editId ? (initialData?.statut || 'brouillon') : 'valide')}>
              {saving ? (
                <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Enregistrement…</>
              ) : editId ? (
                <><Save size={18} /> Enregistrer les modifications</>
              ) : (
                <><Save size={18} /> Sauvegarder & Valider</>
              )}
            </button>
          </>
        )}
      </div>
    </div>
  );
}
