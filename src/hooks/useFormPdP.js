import { useState, useMemo, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { saveDraft } from '../utils/offlineStorage';
import { calcScore, calcScoreResiduel, getNiveauRisque, RISQUE_COLORS } from '../utils/risques';
import { genererMesuresSuggerees } from '../utils/prevention';
import { useToast } from '../contexts/ToastContext';

export const EMPTY_FORM = {
  lieu: '', entreprise_exterieure: '', date_travaux: new Date().toISOString().split('T')[0],
  responsable: '', contact_urgence: '', description_travaux: '', intervenants: '',
  type_travaux: '', types_travaux: [], type_intervention: '', environnement: [], meteo: '', temperature: '',
  photos: [],
  reponses: {}, observations_questions: {}, photos_questions: {}, custom_questions: {},
  mesures_suggerees: [], mesures_prevention: '', score_residuel: null,
  signature_qhse: '', signature_responsable: '',
  statut: 'brouillon',
};

export function useFormPdP({ initialData, editId, session }) {
  const navigate     = useNavigate();
  const { addToast } = useToast();

  const [step, setStep]                       = useState(0);
  const [swipeDir, setSwipeDir]               = useState('right');
  const [form, setFormState]                  = useState(() => initialData ? { ...EMPTY_FORM, ...initialData } : { ...EMPTY_FORM });
  const [saving, setSaving]                   = useState(false);
  const [saved, setSaved]                     = useState(false);
  const [error, setError]                     = useState('');
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  useEffect(() => {
    const handler = (e) => { if (!hasUnsavedChanges) return; e.preventDefault(); e.returnValue = ''; };
    window.addEventListener('beforeunload', handler);
    return () => window.removeEventListener('beforeunload', handler);
  }, [hasUnsavedChanges]);

  const setField = useCallback((key, val) => {
    setFormState(f => ({ ...f, [key]: val }));
    setHasUnsavedChanges(true);
  }, []);

  const score         = useMemo(() => calcScore(form.reponses), [form.reponses]);
  const scoreResiduel = useMemo(() => calcScoreResiduel(score, form.mesures_suggerees), [score, form.mesures_suggerees]);
  const niveau        = useMemo(() => getNiveauRisque(score), [score]);
  const nInfo         = RISQUE_COLORS[niveau];

  const canNext = useCallback(() => {
    if (step === 0) return form.lieu.trim() && form.entreprise_exterieure.trim() && form.date_travaux;
    return true;
  }, [step, form.lieu, form.entreprise_exterieure, form.date_travaux]);

  const handleNext = useCallback(() => {
    if (step === 2) {
      const suggestions = genererMesuresSuggerees(form.reponses);
      const existing    = form.mesures_suggerees;
      const merged = suggestions.map(s => {
        const prev = existing.find(e => e.mesure === s.mesure);
        return prev ? { ...s, selectionnee: prev.selectionnee } : s;
      });
      setField('mesures_suggerees', merged);
    }
    setSwipeDir('right');
    setStep(s => s + 1);
    window.scrollTo(0, 0);
  }, [step, form.reponses, form.mesures_suggerees, setField]);

  const handlePrev = useCallback(() => {
    if (step === 0) { navigate('/'); return; }
    setSwipeDir('left');
    setStep(s => s - 1);
    window.scrollTo(0, 0);
  }, [step, navigate]);

  const handleSave = useCallback(async (finalStatut) => {
    setSaving(true); setError('');
    const serializeSig = (v) => {
      if (!v) return null;
      if (typeof v === 'string') return v;
      try { return JSON.stringify(v); } catch { return null; }
    };
    const payload = {
      ...form,
      signature_qhse:        serializeSig(form.signature_qhse),
      signature_responsable: serializeSig(form.signature_responsable),
      statut:                finalStatut,
      created_by:            session?.user?.id,
      score_risque:          score,
      niveau_risque:         niveau,
      score_residuel:        scoreResiduel,
    };

    if (!navigator.onLine) {
      saveDraft(payload);
      setSaving(false); setSaved(true); setHasUnsavedChanges(false);
      addToast({ message: 'Plan sauvegardé localement (hors-ligne)', type: 'info' });
      setTimeout(() => navigate('/'), 1800);
      return;
    }

    if (editId) {
      const { _savedAt, _offline, ...cleanPayload } = payload;
      const { error: err } = await supabase.from('plans_prevention').update(cleanPayload).eq('id', editId);
      setSaving(false);
      if (err) { addToast({ message: 'Erreur : ' + err.message, type: 'error' }); setError(err.message); return; }
    } else {
      const { error: err } = await supabase.from('plans_prevention').insert([payload]);
      setSaving(false);
      if (err) {
        if (err.message?.includes('network') || err.message?.includes('fetch')) {
          saveDraft(payload); setSaved(true); setHasUnsavedChanges(false);
          addToast({ message: 'Plan sauvegardé localement (hors-ligne)', type: 'info' });
          setTimeout(() => navigate('/'), 1800);
          return;
        }
        addToast({ message: 'Erreur : ' + err.message, type: 'error' }); setError(err.message); return;
      }
    }
    setHasUnsavedChanges(false);
    addToast({ message: 'Plan sauvegardé avec succès', type: 'success' });
    setSaved(true);
    setTimeout(() => navigate(editId ? `/pdp/${editId}` : '/'), 1800);
  }, [form, editId, session, score, niveau, scoreResiduel, addToast, navigate]);

  return {
    form, step, swipeDir, saving, saved, error,
    setField, setFormState,
    handleNext, handlePrev, handleSave,
    canNext, hasUnsavedChanges,
    score, scoreResiduel, niveau, nInfo,
  };
}
