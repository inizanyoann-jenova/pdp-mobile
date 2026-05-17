import React from 'react';
import AnalyseRisques from '../AnalyseRisques';

export default function StepAnalyse({ form, setField, setFormState }) {
  return (
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
          const id   = `custom_${catId}_${Date.now()}`;
          const prev = (form.custom_questions || {})[catId] || [];
          setField('custom_questions', { ...(form.custom_questions || {}), [catId]: [...prev, { id, text }] });
        }}
        onRemoveCustomQuestion={(catId, qId) => {
          const prev = (form.custom_questions || {})[catId] || [];
          const updatedCQ = { ...(form.custom_questions || {}), [catId]: prev.filter(q => q.id !== qId) };
          const { [qId]: _r, ...cleanReponses } = form.reponses;
          const { [qId]: _o, ...cleanObs }      = form.observations_questions;
          const { [qId]: _p, ...cleanPhotos }   = form.photos_questions;
          setFormState(f => ({ ...f, custom_questions: updatedCQ, reponses: cleanReponses, observations_questions: cleanObs, photos_questions: cleanPhotos }));
        }}
      />
    </div>
  );
}
