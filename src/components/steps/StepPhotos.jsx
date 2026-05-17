import React from 'react';
import PhotoCapture from '../PhotoCapture';

export default function StepPhotos({ form, setField, planId }) {
  return (
    <div className="fade-up">
      <div className="card">
        <div style={{ fontSize: 13, fontWeight: 700, color: '#64748B', marginBottom: 6 }}>📷 Documentation photographique</div>
        <p style={{ fontSize: 12, color: '#64748B', marginBottom: 14, lineHeight: 1.5 }}>
          Photographiez l'environnement, les accès, les équipements et les zones à risque.
        </p>
        <PhotoCapture photos={form.photos} onChange={val => setField('photos', val)} planId={planId} />
      </div>
    </div>
  );
}
