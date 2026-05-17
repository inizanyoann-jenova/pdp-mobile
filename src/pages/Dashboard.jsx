import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { CATEGORIES } from '../utils/risques';
import { getLocalActionsStats } from '../utils/offlineStorage';
import { exportPdPsCsv } from '../utils/exportCsv';
import { useTheme } from '../contexts/ThemeContext';
import BottomNav from '../components/BottomNav';
import PWAInstallBanner from '../components/PWAInstallBanner';
import {
  RefreshCw, TrendingUp, AlertTriangle, CheckCircle2, Clock,
  Archive, Shield, Target, HardHat, LogOut, MapPin,
  ClipboardCheck, Wrench, ChevronRight, FileSpreadsheet, Sun, Moon, Hammer,
} from 'lucide-react';

const NIVEAU_CFG = {
  faible:   { color: '#10B981', bg: 'rgba(16,185,129,0.15)',  border: 'rgba(16,185,129,0.3)',  label: 'Faible',   emoji: '🟢' },
  modere:   { color: '#F59E0B', bg: 'rgba(245,158,11,0.15)',  border: 'rgba(245,158,11,0.3)',  label: 'Modéré',   emoji: '🟡' },
  eleve:    { color: '#EF4444', bg: 'rgba(239,68,68,0.15)',   border: 'rgba(239,68,68,0.3)',   label: 'Élevé',    emoji: '🔴' },
  critique: { color: '#8B5CF6', bg: 'rgba(139,92,246,0.15)',  border: 'rgba(139,92,246,0.3)',  label: 'Critique', emoji: '🟣' },
};

export default function Dashboard({ session }) {
  const navigate = useNavigate();
  const { theme, toggle } = useTheme();
  const [pdps, setPdps]       = useState([]);
  const [loading, setLoading] = useState(true);
  const actionsStats          = getLocalActionsStats();

  const charger = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase
      .from('plans_prevention')
      .select('id, lieu, entreprise_exterieure, statut, niveau_risque, score_risque, reponses, created_at, date_travaux')
      .order('created_at', { ascending: false });
    setLoading(false);
    setPdps(data || []);
  }, []);

  useEffect(() => { charger(); }, [charger]);

  // ── Calculs stats ────────────────────────────────────────────────────────
  const total      = pdps.length;
  const valides    = pdps.filter(p => p.statut === 'valide').length;
  const brouillons = pdps.filter(p => p.statut === 'brouillon').length;
  const archives   = pdps.filter(p => p.statut === 'archive').length;

  const scoresMoy  = total > 0
    ? Math.round(pdps.filter(p => p.score_risque != null).reduce((s, p) => s + (p.score_risque || 0), 0) / Math.max(pdps.filter(p => p.score_risque != null).length, 1))
    : null;

  const niveauxCount = { faible: 0, modere: 0, eleve: 0, critique: 0 };
  pdps.forEach(p => { if (p.niveau_risque && niveauxCount[p.niveau_risque] !== undefined) niveauxCount[p.niveau_risque]++; });

  // Non-conformités les plus fréquentes
  const nonConformCount = {};
  pdps.forEach(p => {
    if (!p.reponses) return;
    Object.entries(p.reponses).forEach(([qid, rep]) => {
      if (rep === 'non' || rep === 'nsp') {
        nonConformCount[qid] = (nonConformCount[qid] || 0) + 1;
      }
    });
  });

  const topNonConform = Object.entries(nonConformCount)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([qid, count]) => {
      let qText = qid;
      for (const cat of CATEGORIES) {
        const q = cat.questions.find(q => q.id === qid);
        if (q) { qText = q.text; break; }
      }
      return { qid, qText, count };
    });

  const maxTopCount = topNonConform[0]?.count || 1;

  // Plans récents
  const recents = pdps.slice(0, 5);

  // Plans ce mois-ci
  const now = new Date();
  const ceMois = pdps.filter(p => {
    const d = new Date(p.created_at);
    return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
  }).length;

  return (
    <div style={{ height: '100dvh', display: 'flex', flexDirection: 'column', background: theme.bg }}>

      {/* Header */}
      <div style={{
        padding: 'calc(env(safe-area-inset-top,0px) + 14px) 14px 14px',
        background: theme.bgCard,
        borderBottom: `1px solid ${theme.border}`,
        display: 'flex', alignItems: 'center', gap: 10,
        flexShrink: 0,
      }}>
        <div style={{ width: 38, height: 38, borderRadius: 12, background: 'linear-gradient(135deg,rgba(79,99,231,0.3),rgba(139,92,246,0.2))', border: '1px solid rgba(79,99,231,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <TrendingUp size={18} style={{ color: '#4F63E7' }} />
        </div>
        <div style={{ flex: 1 }}>
          <div style={{ fontSize: 15, fontWeight: 800, color: theme.text1 }}>Tableau de bord</div>
          <div style={{ fontSize: 11, color: theme.text4 }}>Vue d'ensemble QHSE</div>
        </div>
        <button onClick={() => exportPdPsCsv(pdps)} title="Exporter CSV" style={{ ...iconBtn, background:theme.iconBg, border:`1px solid ${theme.border}`, color:theme.text3 }}><FileSpreadsheet size={15} /></button>
        <button onClick={toggle} style={{ ...iconBtn, background:theme.iconBg, border:`1px solid ${theme.border}`, color:theme.text3 }}>{theme.name === 'dark' ? <Sun size={15}/> : theme.name === 'light' ? <Hammer size={15}/> : <Moon size={15}/>}</button>
        <button onClick={charger} style={{ ...iconBtn, background:theme.iconBg, border:`1px solid ${theme.border}`, color:theme.text3 }}><RefreshCw size={15} /></button>
        <button onClick={() => supabase.auth.signOut()} style={{ ...iconBtn, background:theme.iconBg, border:`1px solid ${theme.border}`, color:theme.text3 }}><LogOut size={15} /></button>
      </div>

      <div className="scroll-area" style={{ flex: 1, padding: '12px 12px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {loading && (
          <div style={{ textAlign: 'center', padding: '60px 0', color: '#64748B' }}>
            <Spinner />Chargement…
          </div>
        )}

        {!loading && (
          <>
            {/* ── KPIs principaux ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <KpiCard icon={<HardHat size={18} />} label="Total plans" value={total} color="#4F63E7" sub={`+${ceMois} ce mois`} onClick={() => navigate('/')} />
              <KpiCard icon={<CheckCircle2 size={18} />} label="Validés" value={valides} color="#10B981" sub={total ? `${Math.round(valides/total*100)}%` : '—'} onClick={() => navigate('/')} />
              <KpiCard icon={<Clock size={18} />} label="Brouillons" value={brouillons} color="#F59E0B" sub="en attente" onClick={() => navigate('/')} />
              <KpiCard icon={<Archive size={18} />} label="Archivés" value={archives} color="#64748B" sub="" onClick={() => navigate('/')} />
            </div>

            {/* ── Score moyen + actions ── */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <div className="card" style={{ textAlign: 'center' }}>
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  <Shield size={11} style={{ display: 'inline', marginRight: 4 }} />Score moyen
                </div>
                {scoresMoy !== null ? (
                  <>
                    <div style={{ fontSize: 36, fontWeight: 900, color: scoreColor(scoresMoy), lineHeight: 1 }}>{scoresMoy}</div>
                    <div style={{ fontSize: 11, color: '#64748B', marginTop: 3 }}>/25</div>
                    <div style={{ fontSize: 12, fontWeight: 700, color: scoreColor(scoresMoy), marginTop: 4 }}>{scoreLabel(scoresMoy)}</div>
                  </>
                ) : (
                  <div style={{ fontSize: 24, color: '#475569', marginTop: 8 }}>—</div>
                )}
              </div>

              <div className="card">
                <div style={{ fontSize: 11, fontWeight: 700, color: '#64748B', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>
                  <ClipboardCheck size={11} style={{ display: 'inline', marginRight: 4 }} />Actions correctives
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <ActionRow label="À faire" val={actionsStats.todo} color="#EF4444" />
                  <ActionRow label="En cours" val={actionsStats.doing} color="#F59E0B" />
                  <ActionRow label="Terminées" val={actionsStats.done} color="#10B981" />
                </div>
                {actionsStats.total === 0 && (
                  <div style={{ fontSize: 11, color: '#475569', textAlign: 'center', marginTop: 4 }}>Aucune action</div>
                )}
              </div>
            </div>

            {/* ── Répartition niveaux de risque ── */}
            {total > 0 && (
              <div className="card">
                <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Target size={13} /> Répartition des niveaux de risque
                </div>
                <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                  {Object.entries(niveauxCount).map(([niv, cnt]) => {
                    const cfg = NIVEAU_CFG[niv];
                    const pct = total > 0 ? Math.round(cnt / total * 100) : 0;
                    return (
                      <div key={niv} style={{ flex: 1, textAlign: 'center' }}>
                        <div style={{ fontSize: 11, marginBottom: 3 }}>{cfg.emoji}</div>
                        <div style={{ height: 60, background: 'rgba(255,255,255,0.05)', borderRadius: 6, display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', overflow: 'hidden' }}>
                          <div style={{ background: cfg.color, borderRadius: '4px 4px 0 0', height: `${Math.max(pct, cnt > 0 ? 8 : 0)}%`, minHeight: cnt > 0 ? 6 : 0, transition: 'height 0.4s' }} />
                        </div>
                        <div style={{ fontSize: 14, fontWeight: 800, color: cfg.color, marginTop: 3 }}>{cnt}</div>
                        <div style={{ fontSize: 9, color: '#64748B' }}>{cfg.label}</div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Top non-conformités ── */}
            {topNonConform.length > 0 && (
              <div className="card">
                <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <AlertTriangle size={13} style={{ color: '#EF4444' }} /> Top non-conformités
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  {topNonConform.map(({ qid, qText, count }) => {
                    const pct = Math.round(count / maxTopCount * 100);
                    return (
                      <div key={qid}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: 11, color: '#CBD5E1', lineHeight: 1.4, flex: 1, paddingRight: 8 }} title={qText}>
                            {qText.length > 60 ? qText.slice(0, 60) + '…' : qText}
                          </span>
                          <span style={{ fontSize: 11, fontWeight: 800, color: '#EF4444', flexShrink: 0 }}>{count}×</span>
                        </div>
                        <div style={{ height: 4, background: 'rgba(239,68,68,0.12)', borderRadius: 2, overflow: 'hidden' }}>
                          <div style={{ height: '100%', background: '#EF4444', borderRadius: 2, width: `${pct}%`, transition: 'width 0.4s' }} />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* ── Plans récents ── */}
            {recents.length > 0 && (
              <div className="card">
                <div style={{ fontSize: 12, fontWeight: 700, color: '#94A3B8', marginBottom: 10, display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Wrench size={13} /> Plans récents
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                  {recents.map((p, i) => {
                    const niv = p.niveau_risque ? NIVEAU_CFG[p.niveau_risque] : null;
                    return (
                      <div key={p.id}
                        onClick={() => navigate(`/pdp/${p.id}`)}
                        style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 0', cursor: 'pointer', borderTop: i > 0 ? '1px solid rgba(255,255,255,0.05)' : 'none' }}
                      >
                        <MapPin size={13} style={{ color: '#4F63E7', flexShrink: 0 }} />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: 700, color: '#F1F5F9', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.lieu || '—'}</div>
                          <div style={{ fontSize: 11, color: '#64748B' }}>
                            {p.date_travaux ? new Date(p.date_travaux + 'T12:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) : '—'}
                            {' · '}{p.entreprise_exterieure || '—'}
                          </div>
                        </div>
                        {niv && (
                          <span style={{ fontSize: 10, fontWeight: 700, color: niv.color, background: niv.bg, border: `1px solid ${niv.border}`, borderRadius: 100, padding: '2px 6px', flexShrink: 0 }}>
                            {p.score_risque ?? '?'}/25
                          </span>
                        )}
                        <ChevronRight size={14} style={{ color: '#475569', flexShrink: 0 }} />
                      </div>
                    );
                  })}
                </div>
                {pdps.length > 5 && (
                  <button onClick={() => navigate('/')} style={{ width: '100%', marginTop: 10, padding: '8px 0', background: 'rgba(79,99,231,0.08)', border: '1px solid rgba(79,99,231,0.2)', borderRadius: 10, color: '#4F63E7', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}>
                    Voir tous les {pdps.length} plans →
                  </button>
                )}
              </div>
            )}

            {total === 0 && (
              <div style={{ textAlign: 'center', padding: '40px 20px', color: '#64748B' }}>
                <HardHat size={44} style={{ margin: '0 auto 14px', opacity: 0.2 }} />
                <div style={{ fontSize: 15, fontWeight: 700, color: '#94A3B8', marginBottom: 6 }}>Aucune donnée</div>
                <div style={{ fontSize: 13 }}>Créez votre premier plan pour voir les statistiques.</div>
              </div>
            )}
          </>
        )}

        <div style={{ height: 90 }} />
      </div>

      <BottomNav />
      <PWAInstallBanner />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function KpiCard({ icon, label, value, color, sub, onClick }) {
  return (
    <div className="card" onClick={onClick} style={{ cursor: onClick ? 'pointer' : 'default', display: 'flex', alignItems: 'center', gap: 12 }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: color + '18', border: `1px solid ${color}30`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, color }}>
        {icon}
      </div>
      <div>
        <div style={{ fontSize: 24, fontWeight: 900, color, lineHeight: 1 }}>{value}</div>
        <div style={{ fontSize: 11, fontWeight: 700, color: '#94A3B8', marginTop: 2 }}>{label}</div>
        {sub && <div style={{ fontSize: 10, color: '#64748B', marginTop: 1 }}>{sub}</div>}
      </div>
    </div>
  );
}

function ActionRow({ label, val, color }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
      <span style={{ fontSize: 12, color: '#94A3B8' }}>{label}</span>
      <span style={{ fontSize: 13, fontWeight: 800, color }}>{val}</span>
    </div>
  );
}

function scoreColor(s) {
  if (s <= 4)  return '#10B981';
  if (s <= 9)  return '#F59E0B';
  if (s <= 16) return '#EF4444';
  return '#8B5CF6';
}
function scoreLabel(s) {
  if (s <= 4)  return 'Faible';
  if (s <= 9)  return 'Modéré';
  if (s <= 16) return 'Élevé';
  return 'Critique';
}

const iconBtn = {
  width: 36, height: 36, borderRadius: 10, border: '1px solid rgba(255,255,255,0.08)',
  background: '#152236', color: '#94A3B8', cursor: 'pointer',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
};

function Spinner() {
  return <div style={{ width: 30, height: 30, border: '3px solid rgba(79,99,231,0.3)', borderTopColor: '#4F63E7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', margin: '0 auto 10px' }} />;
}
