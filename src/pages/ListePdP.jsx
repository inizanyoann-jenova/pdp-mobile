import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { useToast } from '../contexts/ToastContext';
import {
  HardHat, MapPin, Building2, Calendar, ChevronRight,
  LogOut, RefreshCw, AlertTriangle, CheckCircle2, Clock,
  Search, X, WifiOff, Filter, Sun, Moon,
} from 'lucide-react';
import BottomNav from '../components/BottomNav';
import { countDraftsOffline, getDraftsOffline } from '../utils/offlineStorage';
import { RISQUE_COLORS } from '../utils/risques';
import { useTheme } from '../contexts/ThemeContext';

const STATUT_CONFIG = {
  brouillon: { label: 'Brouillon', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)', icon: Clock },
  valide:    { label: 'Validé',    color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)',  icon: CheckCircle2 },
  archive:   { label: 'Archivé',   color: '#64748B', bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.3)', icon: AlertTriangle },
};

const FILTRES_STATUT  = ['tous', 'brouillon', 'valide', 'archive'];
const FILTRES_RISQUE  = ['tous', 'faible', 'modere', 'eleve', 'critique'];
const LABEL_STATUT    = { tous: 'Tous', brouillon: 'Brouillons', valide: 'Validés', archive: 'Archivés' };
const LABEL_RISQUE    = { tous: 'Tout niveau', faible: '🟢 Faible', modere: '🟡 Modéré', eleve: '🔴 Élevé', critique: '🟣 Critique' };

export default function ListePdP({ session }) {
  const navigate = useNavigate();
  const { theme, isDark, toggle } = useTheme();
  const { addToast } = useToast();
  const [pdps, setPdps]             = useState([]);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [search, setSearch]         = useState('');
  const [filtreStatut, setFiltreStatut] = useState('tous');
  const [filtreRisque, setFiltreRisque] = useState('tous');
  const [showFilters, setShowFilters]   = useState(false);
  const [offline, setOffline]           = useState(!navigator.onLine);
  const [nbOffline, setNbOffline]       = useState(countDraftsOffline());

  useEffect(() => {
    const onOnline  = () => { setOffline(false); addToast({ message: 'Connexion rétablie', type: 'success' }); };
    const onOffline = () => { setOffline(true);  addToast({ message: 'Mode hors-ligne activé', type: 'info' }); };
    window.addEventListener('online',  onOnline);
    window.addEventListener('offline', onOffline);
    return () => { window.removeEventListener('online', onOnline); window.removeEventListener('offline', onOffline); };
  }, [addToast]);

  const charger = useCallback(async () => {
    setLoading(true); setError('');
    const { data, error: err } = await supabase
      .from('plans_prevention')
      .select('id, lieu, entreprise_exterieure, date_travaux, description_travaux, statut, created_at, risques_selectionnes, photos, niveau_risque, score_risque')
      .order('created_at', { ascending: false });
    setLoading(false);
    if (err) {
      console.error('[ListePdP] Erreur chargement:', err);
      setError(err.message);
      addToast({ message: 'Impossible de charger les plans : ' + (err.message || 'erreur réseau'), type: 'error' });
      return;
    }
    setPdps(data || []);
  }, [addToast]);

  useEffect(() => { charger(); }, [charger]);

  // Fusion plans en ligne + brouillons hors-ligne
  const allPdps = useMemo(() => {
    const online = pdps;
    const offlineDrafts = Object.values(getDraftsOffline()).map(d => ({
      ...d, _offline: true,
    }));
    return [...offlineDrafts, ...online];
  }, [pdps, nbOffline]);

  const filtered = useMemo(() => {
    return allPdps.filter(p => {
      const q = search.toLowerCase();
      const matchSearch = !q ||
        (p.lieu || '').toLowerCase().includes(q) ||
        (p.entreprise_exterieure || '').toLowerCase().includes(q) ||
        (p.description_travaux || '').toLowerCase().includes(q);
      const matchStatut = filtreStatut === 'tous' || p.statut === filtreStatut;
      const matchRisque = filtreRisque === 'tous' || p.niveau_risque === filtreRisque;
      return matchSearch && matchStatut && matchRisque;
    });
  }, [allPdps, search, filtreStatut, filtreRisque]);

  const hasActiveFilters = filtreStatut !== 'tous' || filtreRisque !== 'tous';

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: theme.bg }}>

      {/* Header */}
      <div style={{
        padding: 'calc(env(safe-area-inset-top, 0px) + 14px) 14px 12px',
        background: theme.bgCard,
        borderBottom: `1px solid ${theme.border}`,
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
          <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg,rgba(79,99,231,0.3),rgba(16,185,129,0.2))', border: '1px solid rgba(79,99,231,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <HardHat size={19} style={{ color: '#4F63E7' }} />
          </div>
          <div style={{ flex: 1 }}>
            <div style={{ fontSize: 15, fontWeight: 800, color: '#F1F5F9' }}>Plans de Prévention</div>
            <div style={{ fontSize: 11, color: '#64748B' }}>{session?.user?.email?.split('@')[0]}</div>
          </div>
          <button onClick={toggle} style={{ ...iconBtn, background:theme.iconBg, border:`1px solid ${theme.border}`, color:theme.text3 }}>
            {isDark ? <Sun size={15}/> : <Moon size={15}/>}
          </button>
          <button onClick={charger} style={{ ...iconBtn, background:theme.iconBg, border:`1px solid ${theme.border}`, color:theme.text3 }}>
            <RefreshCw size={16} />
          </button>
          <button onClick={() => supabase.auth.signOut()} style={{ ...iconBtn, background:theme.iconBg, border:`1px solid ${theme.border}`, color:theme.text3 }}>
            <LogOut size={16} />
          </button>
        </div>

        {/* Barre de recherche */}
        <div style={{ position: 'relative' }}>
          <Search size={15} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: '#64748B', pointerEvents: 'none' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Rechercher un lieu, une entreprise…"
            style={{
              width: '100%', padding: '10px 36px 10px 34px',
              borderRadius: 12, background: '#152236',
              border: `1px solid ${search ? 'rgba(79,99,231,0.5)' : 'rgba(255,255,255,0.07)'}`,
              color: '#F1F5F9', fontSize: 14, outline: 'none',
            }}
          />
          {search && (
            <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: '#64748B', display: 'flex' }}>
              <X size={15} />
            </button>
          )}
        </div>

        {/* Filtres chips */}
        <div style={{ display: 'flex', gap: 6, marginTop: 8, overflowX: 'auto', paddingBottom: 2 }} className="scroll-area">
          <button
            onClick={() => setShowFilters(f => !f)}
            style={{
              flexShrink: 0, height: 28, padding: '0 10px', borderRadius: 100,
              background: hasActiveFilters ? 'rgba(79,99,231,0.15)' : '#152236',
              border: `1px solid ${hasActiveFilters ? 'rgba(79,99,231,0.5)' : 'rgba(255,255,255,0.08)'}`,
              color: hasActiveFilters ? '#4F63E7' : '#94A3B8', fontSize: 12, fontWeight: 700,
              cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4,
            }}
          >
            <Filter size={11} /> Filtres{hasActiveFilters ? ' ●' : ''}
          </button>
          {FILTRES_STATUT.map(s => (
            <button key={s}
              onClick={() => setFiltreStatut(s)}
              style={{
                flexShrink: 0, height: 28, padding: '0 12px', borderRadius: 100, fontSize: 12, fontWeight: 700,
                cursor: 'pointer',
                background: filtreStatut === s ? 'rgba(79,99,231,0.18)' : '#152236',
                border: `1px solid ${filtreStatut === s ? 'rgba(79,99,231,0.5)' : 'rgba(255,255,255,0.07)'}`,
                color: filtreStatut === s ? '#4F63E7' : '#64748B',
              }}
            >
              {LABEL_STATUT[s]}
            </button>
          ))}
        </div>

        {/* Filtre niveau risque (expandable) */}
        {showFilters && (
          <div style={{ display: 'flex', gap: 6, marginTop: 6, overflowX: 'auto', paddingBottom: 2 }} className="scroll-area">
            {FILTRES_RISQUE.map(r => {
              const cfg = RISQUE_COLORS[r];
              return (
                <button key={r}
                  onClick={() => setFiltreRisque(r)}
                  style={{
                    flexShrink: 0, height: 28, padding: '0 12px', borderRadius: 100, fontSize: 12, fontWeight: 700,
                    cursor: 'pointer',
                    background: filtreRisque === r ? (cfg ? cfg.bg : 'rgba(79,99,231,0.18)') : '#152236',
                    border: `1px solid ${filtreRisque === r ? (cfg ? cfg.border : 'rgba(79,99,231,0.5)') : 'rgba(255,255,255,0.07)'}`,
                    color: filtreRisque === r ? (cfg ? cfg.text : '#4F63E7') : '#64748B',
                  }}
                >
                  {LABEL_RISQUE[r]}
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* Banner hors-ligne */}
      {offline && (
        <div style={{ background: 'rgba(245,158,11,0.12)', borderBottom: '1px solid rgba(245,158,11,0.25)', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: 8, flexShrink: 0 }}>
          <WifiOff size={14} style={{ color: '#F59E0B', flexShrink: 0 }} />
          <span style={{ fontSize: 12, color: '#F59E0B', fontWeight: 600 }}>
            Mode hors-ligne — {nbOffline > 0 ? `${nbOffline} brouillon(s) en attente de sync` : 'les données locales sont affichées'}
          </span>
        </div>
      )}

      {/* Compteur résultats */}
      {!loading && (
        <div style={{ padding: '8px 14px 0', flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: '#64748B' }}>
            {filtered.length} plan{filtered.length !== 1 ? 's' : ''}
            {search || hasActiveFilters ? ` sur ${allPdps.length}` : ''}
          </span>
        </div>
      )}

      {/* Liste */}
      <div className="scroll-area" style={{ flex: 1, padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 9 }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B' }}>
            <Spinner />
            Chargement…
          </div>
        )}

        {!loading && error && (
          <div style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.3)', borderRadius: 12, padding: 16, color: '#EF4444', fontSize: 14, textAlign: 'center' }}>
            <AlertTriangle size={20} style={{ margin: '0 auto 8px', display: 'block' }} />
            {error}
          </div>
        )}

        {!loading && !error && filtered.length === 0 && (
          <div style={{ textAlign: 'center', padding: '60px 20px', color: '#64748B' }}>
            <HardHat size={44} style={{ margin: '0 auto 14px', opacity: 0.25 }} />
            <div style={{ fontSize: 15, fontWeight: 700, color: '#94A3B8', marginBottom: 6 }}>
              {search || hasActiveFilters ? 'Aucun résultat' : 'Aucun plan de prévention'}
            </div>
            <div style={{ fontSize: 13 }}>
              {search || hasActiveFilters ? 'Modifiez vos filtres ou votre recherche.' : 'Créez votre premier PdP avec le bouton + ci-dessous.'}
            </div>
          </div>
        )}

        {!loading && filtered.map((pdp) => {
          const cfg = STATUT_CONFIG[pdp.statut] || STATUT_CONFIG.brouillon;
          const StatusIcon = cfg.icon;
          const niv  = pdp.niveau_risque ? RISQUE_COLORS[pdp.niveau_risque] : null;
          const nbP  = Array.isArray(pdp.photos) ? pdp.photos.length : 0;
          return (
            <div key={pdp.id} className="card fade-up"
              onClick={() => !pdp._offline && navigate(`/pdp/${pdp.id}`)}
              style={{ cursor: pdp._offline ? 'default' : 'pointer', display: 'flex', gap: 10, alignItems: 'flex-start', position: 'relative' }}
            >
              {pdp._offline && (
                <div style={{ position: 'absolute', top: 8, right: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 700, color: '#F59E0B', background: 'rgba(245,158,11,0.15)', border: '1px solid rgba(245,158,11,0.3)', borderRadius: 100, padding: '2px 7px' }}>
                    <WifiOff size={9} style={{ display: 'inline', marginRight: 3 }} />Hors-ligne
                  </span>
                </div>
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                {/* Statut + niveau risque */}
                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, background: cfg.bg, border: `1px solid ${cfg.border}`, borderRadius: 100, padding: '2px 8px', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                    <StatusIcon size={10} /> {cfg.label}
                  </span>
                  {niv && (
                    <span style={{ fontSize: 11, fontWeight: 700, color: niv.text, background: niv.bg, border: `1px solid ${niv.border}`, borderRadius: 100, padding: '2px 8px' }}>
                      {pdp.score_risque ?? '—'}/25 {niv.label}
                    </span>
                  )}
                  {nbP > 0 && (
                    <span style={{ fontSize: 11, color: '#64748B' }}>📷 {nbP}</span>
                  )}
                </div>

                <div style={{ display: 'flex', alignItems: 'flex-start', gap: 5, marginBottom: 4 }}>
                  <MapPin size={13} style={{ color: '#4F63E7', flexShrink: 0, marginTop: 2 }} />
                  <span style={{ fontSize: 15, fontWeight: 700, color: '#F1F5F9', lineHeight: 1.3 }}>{pdp.lieu || '—'}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 5, marginBottom: 4 }}>
                  <Building2 size={12} style={{ color: '#64748B', flexShrink: 0 }} />
                  <span style={{ fontSize: 13, color: '#94A3B8' }}>{pdp.entreprise_exterieure || '—'}</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Calendar size={12} style={{ color: '#64748B', flexShrink: 0 }} />
                  <span style={{ fontSize: 12, color: '#64748B' }}>
                    {pdp.date_travaux ? new Date(pdp.date_travaux + 'T12:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'long', year: 'numeric' }) : '—'}
                  </span>
                </div>

                {pdp.description_travaux && (
                  <p style={{ fontSize: 12, color: '#64748B', marginTop: 5, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                    {pdp.description_travaux}
                  </p>
                )}
              </div>
              {!pdp._offline && <ChevronRight size={17} style={{ color: '#475569', flexShrink: 0, marginTop: 2 }} />}
            </div>
          );
        })}

        {/* Espace pour le BottomNav */}
        <div style={{ height: 90 }} />
      </div>

      <BottomNav />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

const iconBtn = {
  width: 38, height: 38, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)',
  background: '#152236', color: '#94A3B8', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

function Spinner() {
  return <div style={{ width: 32, height: 32, border: '3px solid rgba(79,99,231,0.3)', borderTopColor: '#4F63E7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 12px' }} />;
}
