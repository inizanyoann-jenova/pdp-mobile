import React, { useRef, useCallback } from 'react';
import { CheckCircle2, ArrowLeft, ArrowRight, Save, MapPin, Building2, FileText, ShieldCheck, PenLine, Sun, Moon, HardHat } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useFormPdP } from '../hooks/useFormPdP';
import { useOfflineSync } from '../hooks/useOfflineSync';
import StepInfos       from '../components/steps/StepInfos';
import StepPhotos      from '../components/steps/StepPhotos';
import StepAnalyse     from '../components/steps/StepAnalyse';
import StepPrevention  from '../components/steps/StepPrevention';
import StepSignatures  from '../components/steps/StepSignatures';

const STEPS = [
  { id: 'infos',      label: 'Chantier',   icon: MapPin },
  { id: 'photos',     label: 'Photos',     icon: Building2 },
  { id: 'analyse',    label: 'Analyse',    icon: ShieldCheck },
  { id: 'prevention', label: 'Prévention', icon: FileText },
  { id: 'signatures', label: 'Signatures', icon: PenLine },
];

export default function NouveauPdP({ session, initialData, editId }) {
  const { theme, toggle } = useTheme();
  const themeName = theme.name;
  const touchStart = useRef(null);

  const {
    form, step, swipeDir, saving, saved, error,
    setField, setFormState,
    handleNext, handlePrev, handleSave,
    canNext, score, scoreResiduel, niveau, nInfo,
  } = useFormPdP({ initialData, editId, session });

  useOfflineSync();

  const onTouchStart = useCallback((e) => {
    touchStart.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  }, []);

  const onTouchEnd = useCallback((e) => {
    if (!touchStart.current) return;
    const dx = e.changedTouches[0].clientX - touchStart.current.x;
    const dy = e.changedTouches[0].clientY - touchStart.current.y;
    touchStart.current = null;
    if (Math.abs(dx) < 60 || Math.abs(dy) > Math.abs(dx) * 0.8) return;
    if (dx < 0 && canNext() && step < STEPS.length - 1) handleNext();
    if (dx > 0 && step > 0) handlePrev();
  }, [step, canNext, handleNext, handlePrev]);

  if (saved) return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: theme.bg, gap: 16, padding: 24 }}>
      <CheckCircle2 size={72} style={{ color: '#10B981' }} />
      <div style={{ fontSize: 22, fontWeight: 800, color: theme.text1, textAlign: 'center' }}>
        {editId ? 'Plan mis à jour !' : 'Plan enregistré !'}
      </div>
      <div style={{ fontSize: 14, color: theme.text4 }}>Redirection…</div>
    </div>
  );

  const ThemeIcon = themeName === 'dark' ? Sun : themeName === 'light' ? HardHat : Moon;

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: theme.bg }}>

      <div style={{ padding: 'calc(env(safe-area-inset-top,0px) + 10px) 14px 10px', background: theme.bgCard, borderBottom: `1px solid ${theme.border}`, flexShrink: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
          <button onClick={handlePrev} style={{ width: 38, height: 38, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.iconBg, color: theme.name === 'terrain' ? '#FFCC00' : theme.text3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 14, fontWeight: 800, color: theme.text1 }}>{editId ? 'Modifier le Plan' : 'Nouveau Plan de Prévention'}</div>
            <div style={{ fontSize: 11, color: theme.text4 }}>Étape {step + 1}/{STEPS.length} — {STEPS[step].label}</div>
          </div>
          {step >= 2 && Object.keys(form.reponses).length > 0 && (
            <div style={{ textAlign: 'center', background: nInfo.bg, border: `1px solid ${nInfo.border}`, borderRadius: 10, padding: '4px 10px' }}>
              <div style={{ fontSize: 16, fontWeight: 900, color: nInfo.text }}>{score}</div>
              <div style={{ fontSize: 9, color: nInfo.text }}>{nInfo.label}</div>
            </div>
          )}
          <button onClick={toggle} style={{ width: 34, height: 34, borderRadius: 10, border: `1px solid ${theme.border}`, background: theme.iconBg, color: theme.name === 'terrain' ? '#FFCC00' : theme.text3, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <ThemeIcon size={15} />
          </button>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, justifyContent: 'center' }}>
          {STEPS.map((s, i) => <div key={s.id} className={`step-dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />)}
        </div>
      </div>

      <div className="scroll-area" style={{ flex: 1, padding: '14px' }}
        onTouchStart={onTouchStart} onTouchEnd={onTouchEnd}>

        {step === 0 && <StepInfos form={form} setField={setField} swipeDir={swipeDir} />}
        {step === 1 && <StepPhotos form={form} setField={setField} planId={editId} />}
        {step === 2 && <StepAnalyse form={form} setField={setField} setFormState={setFormState} />}
        {step === 3 && <StepPrevention form={form} setField={setField} score={score} scoreResiduel={scoreResiduel} niveau={niveau} nInfo={nInfo} />}
        {step === 4 && <StepSignatures form={form} setField={setField} score={score} nInfo={nInfo} error={error} />}

        <div style={{ height: 100 }} />
      </div>

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
              {saving
                ? <><div style={{ width: 18, height: 18, border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#fff', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} /> Enregistrement…</>
                : editId ? <><Save size={18} /> Enregistrer</> : <><Save size={18} /> Sauvegarder & Valider</>
              }
            </button>
          </>
        )}
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}
