import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { supabase } from './supabaseClient';
import { ToastProvider } from './contexts/ToastContext';
import { SettingsProvider } from './contexts/SettingsContext';
import ToastContainer from './components/Toast';
import LoginPage from './pages/LoginPage';
import ListePdP from './pages/ListePdP';
import NouveauPdP from './pages/NouveauPdP';
import DetailPdP from './pages/DetailPdP';
import Dashboard from './pages/Dashboard';
import EditPdP from './pages/EditPdP';
import Settings from './pages/Settings';

export default function App() {
  const [session, setSession] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setSession(session));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => subscription.unsubscribe();
  }, []);

  if (session === undefined) return (
    <div style={{ height: '100dvh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0B1120' }}>
      <div style={{ width: 40, height: 40, border: '3px solid rgba(79,99,231,0.3)', borderTopColor: '#4F63E7', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );

  if (!session) return <LoginPage onLogin={setSession} />;

  return (
    <ToastProvider>
      <SettingsProvider session={session}>
        <Routes>
          <Route path="/"            element={<ListePdP  session={session} />} />
          <Route path="/dashboard"   element={<Dashboard session={session} />} />
          <Route path="/nouveau"     element={<NouveauPdP session={session} />} />
          <Route path="/pdp/:id"     element={<DetailPdP session={session} />} />
          <Route path="/pdp/:id/edit" element={<EditPdP  session={session} />} />
          <Route path="/settings"    element={<Settings  session={session} />} />
          <Route path="*"            element={<Navigate to="/" replace />} />
        </Routes>
        <ToastContainer />
      </SettingsProvider>
    </ToastProvider>
  );
}
