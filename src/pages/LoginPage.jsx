import React, { useState } from 'react';
import { supabase } from '../supabaseClient';
import { HardHat, Mail, Lock } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail]     = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const { error: err } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (err) setError(err.message);
  };

  return (
    <div style={{
      height: '100dvh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#0B1120',
      padding: '24px',
    }}>
      {/* Logo */}
      <div style={{ marginBottom: 32, textAlign: 'center' }}>
        <div style={{
          width: 72, height: 72, borderRadius: 22,
          background: 'linear-gradient(135deg, rgba(79,99,231,0.4), rgba(16,185,129,0.2))',
          border: '1px solid rgba(79,99,231,0.5)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 32, margin: '0 auto 14px',
        }}>
          <HardHat size={36} style={{ color: '#4F63E7' }} />
        </div>
        <div style={{ fontSize: 22, fontWeight: 800, color: '#F1F5F9' }}>PdP & Risques Terrain</div>
        <div style={{ fontSize: 13, color: '#64748B', marginTop: 4 }}>Plans de prévention · Analyses de risques</div>
      </div>

      <form onSubmit={handleLogin} style={{ width: '100%', maxWidth: 380, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <div className="field">
          <label>Adresse e-mail</label>
          <div style={{ position: 'relative' }}>
            <Mail size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input
              type="email" required value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="votre@email.com"
              style={{ paddingLeft: 42 }}
              autoComplete="email"
            />
          </div>
        </div>

        <div className="field">
          <label>Mot de passe</label>
          <div style={{ position: 'relative' }}>
            <Lock size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: '#64748B' }} />
            <input
              type="password" required value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              style={{ paddingLeft: 42 }}
              autoComplete="current-password"
            />
          </div>
        </div>

        {error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 10, padding: '10px 14px', fontSize: 13, color: '#EF4444' }}>
            {error}
          </div>
        )}

        <button type="submit" className="btn btn-primary" disabled={loading} style={{ marginTop: 4 }}>
          {loading ? 'Connexion...' : 'Se connecter'}
        </button>
      </form>

      <p style={{ marginTop: 28, fontSize: 12, color: '#475569', textAlign: 'center' }}>
        Connectez-vous avec votre compte QHSE Dashboard
      </p>
    </div>
  );
}
