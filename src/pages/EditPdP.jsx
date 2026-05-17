import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import NouveauPdP from './NouveauPdP';

export default function EditPdP({ session }) {
  const { id }    = useParams();
  const navigate  = useNavigate();
  const [data, setData]       = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    supabase.from('plans_prevention').select('*').eq('id', id).single()
      .then(({ data: d, error: err }) => {
        setLoading(false);
        if (err || !d) { setError(err?.message || 'Plan introuvable'); return; }
        setData(d);
      });
  }, [id]);

  if (loading) return (
    <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B1120' }}>
      <div style={{ width: 36, height: 36, border: '3px solid rgba(79,99,231,0.3)', borderTopColor: '#4F63E7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error) return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: '#0B1120', gap: 14, padding: 24 }}>
      <div style={{ color: '#EF4444', fontSize: 14 }}>{error}</div>
      <button onClick={() => navigate(-1)} style={{ padding: '10px 20px', background: '#152236', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, color: '#94A3B8', cursor: 'pointer' }}>Retour</button>
    </div>
  );

  return <NouveauPdP session={session} initialData={data} editId={id} />;
}
