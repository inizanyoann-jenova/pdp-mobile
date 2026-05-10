import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import { CATEGORIES, RISQUE_COLORS, TYPES_INTERVENTION } from '../utils/risques';
import { exportPdP } from '../utils/exportPdf';
import { getActionsForPlan, addAction, updateAction, deleteAction } from '../utils/actionsService';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { useToast } from '../contexts/ToastContext';
import {
  ArrowLeft, MapPin, Building2, Calendar, FileText,
  CheckCircle2, Clock, Trash2, AlertTriangle, Download,
  ShieldCheck, PenLine, Copy, Share2, Plus, X,
  ClipboardCheck, ChevronDown, ChevronUp, Pencil, Mail,
  Sun, Moon,
} from 'lucide-react';

const STATUT_CONFIG = {
  brouillon: { label: 'Brouillon', color: '#F59E0B', bg: 'rgba(245,158,11,0.12)', border: 'rgba(245,158,11,0.3)' },
  valide:    { label: 'Validé',    color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
  archive:   { label: 'Archivé',   color: '#64748B', bg: 'rgba(100,116,139,0.12)', border: 'rgba(100,116,139,0.3)' },
};

const ACTION_STATUT = {
  todo:  { label: 'À faire',   color: '#EF4444', bg: 'rgba(239,68,68,0.12)',   border: 'rgba(239,68,68,0.3)' },
  doing: { label: 'En cours',  color: '#F59E0B', bg: 'rgba(245,158,11,0.12)',  border: 'rgba(245,158,11,0.3)' },
  done:  { label: 'Terminée',  color: '#10B981', bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)' },
};

export default function DetailPdP({ session }) {
  const { id }   = useParams();
  const navigate = useNavigate();
  const { theme, isDark, toggle } = useTheme();
  const { settings } = useSettings();
  const { addToast } = useToast();
  const [pdp, setPdp]               = useState(null);
  const [loading, setLoading]       = useState(true);
  const [error, setError]           = useState('');
  const [deleting, setDeleting]     = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [updatingStatut, setUpdatingStatut] = useState(false);
  const [exporting, setExporting]   = useState(false);
  const [sharing, setSharing]       = useState(false);
  const [duplicating, setDuplicating] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [actions, setActions]       = useState([]);
  const [newAction, setNewAction]   = useState({ description:'', responsable:'', echeance:'', statut:'todo' });
  const [addingAction, setAddingAction] = useState(false);

  useEffect(() => {
    supabase.from('plans_prevention').select('*').eq('id', id).single()
      .then(({ data, error: err }) => {
        setLoading(false);
        if (err) { setError(err.message); return; }
        setPdp(data);
      });
    getActionsForPlan(id).then(setActions);
  }, [id]);

  const reloadActions = useCallback(() => { getActionsForPlan(id).then(setActions); }, [id]);

  const handleDelete = async () => {
    if (!confirmDel) { setConfirmDel(true); return; }
    setDeleting(true);
    const { error } = await supabase.from('plans_prevention').delete().eq('id', id);
    if (error) {
      addToast({ message: 'Erreur lors de la suppression : ' + error.message, type: 'error' });
      setDeleting(false);
      return;
    }
    navigate('/');
  };

  const changeStatut = async (newStatut) => {
    setUpdatingStatut(true);
    const { data, error: err } = await supabase.from('plans_prevention').update({ statut: newStatut }).eq('id', id).select().single();
    setUpdatingStatut(false);
    if (err) {
      console.error('[DetailPdP] Erreur changement statut:', err);
      addToast({ message: 'Erreur changement statut : ' + err.message, type: 'error' });
      return;
    }
    if (data) setPdp(data);
    addToast({ message: 'Statut mis à jour', type: 'success' });
  };

  const handleExport = async () => {
    setExporting(true);
    try { await exportPdP({ ...pdp, _actions: actions }, {}, settings); }
    catch (e) { alert('Erreur export PDF : ' + e.message); }
    setExporting(false);
  };

  const handleEmail = async () => {
    setExporting(true);
    try {
      await exportPdP({ ...pdp, _actions: actions }, {}, settings);
      const subject = encodeURIComponent(`Plan de Prévention — ${pdp.lieu || ''} — ${pdp.date_travaux ? new Date(pdp.date_travaux+'T12:00').toLocaleDateString('fr-FR') : ''}`);
      const body = encodeURIComponent(
        `Bonjour,\n\nVeuillez trouver ci-joint le Plan de Prévention :\n` +
        `• Lieu : ${pdp.lieu || '—'}\n` +
        `• Entreprise : ${pdp.entreprise_exterieure || '—'}\n` +
        `• Date des travaux : ${pdp.date_travaux ? new Date(pdp.date_travaux+'T12:00').toLocaleDateString('fr-FR') : '—'}\n` +
        `• Niveau de risque : ${pdp.niveau_risque || '—'} (${pdp.score_risque ?? '—'}/25)\n\n` +
        `Le PDF a été téléchargé sur votre appareil. Veuillez l'attacher à cet email.\n\nCordialement`
      );
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
    } catch (e) { alert('Erreur : ' + e.message); }
    setExporting(false);
  };

  const handleShare = async () => {
    setSharing(true);
    try {
      if (navigator.share) {
        // Générer le PDF en blob puis partager
        const blob = await exportPdP({ ...pdp, _actions: actions }, { returnBlob: true }, settings);
        const filename = `PdP_${(pdp.lieu||'chantier').replace(/[^a-z0-9]/gi,'_')}_${pdp.date_travaux||'date'}.pdf`;
        const file = new File([blob], filename, { type: 'application/pdf' });

        if (navigator.canShare && navigator.canShare({ files: [file] })) {
          await navigator.share({
            title: `Plan de Prévention — ${pdp.lieu || ''}`,
            text: `PdP ${pdp.lieu || ''} du ${pdp.date_travaux ? new Date(pdp.date_travaux+'T12:00').toLocaleDateString('fr-FR') : '—'} — Score risque : ${pdp.score_risque ?? '?'}/25`,
            files: [file],
          });
        } else {
          // Partage sans fichier (iOS anciens)
          await navigator.share({
            title: `Plan de Prévention — ${pdp.lieu || ''}`,
            text: `PdP ${pdp.lieu || ''} (${pdp.entreprise_exterieure || ''}) — Score risque : ${pdp.score_risque ?? '?'}/25 — ${pdp.niveau_risque || ''}`,
          });
        }
      } else {
        // Fallback : télécharger
        await exportPdP({ ...pdp, _actions: actions }, {}, settings);
      }
    } catch (e) {
      if (e.name !== 'AbortError') alert('Erreur partage : ' + e.message);
    }
    setSharing(false);
  };

  const handleDuplicate = async () => {
    setDuplicating(true);
    try {
      const copy = {
        ...pdp,
        id: undefined,
        created_at: undefined,
        statut: 'brouillon',
        lieu: `Copie — ${pdp.lieu || ''}`,
        signature_qhse: null,
        signature_responsable: null,
        created_by: session?.user?.id,
      };
      delete copy.id;
      const { data, error: err } = await supabase.from('plans_prevention').insert([copy]).select().single();
      if (err) throw err;
      addToast({ message: 'Plan dupliqué avec succès', type: 'success' });
      navigate(`/pdp/${data.id}`);
    } catch (e) {
      console.error('[DetailPdP] Erreur duplication:', e);
      addToast({ message: 'Erreur lors de la duplication : ' + e.message, type: 'error' });
    }
    setDuplicating(false);
  };

  const handleAddAction = async () => {
    if (!newAction.description.trim()) return;
    await addAction(id, newAction);
    setNewAction({ description:'', responsable:'', echeance:'', statut:'todo' });
    setAddingAction(false);
    reloadActions();
  };

  const cycleActionStatut = async (actionId) => {
    const a = actions.find(x => x.id === actionId);
    if (!a) return;
    const next = { todo:'doing', doing:'done', done:'todo' };
    await updateAction(id, actionId, { statut: next[a.statut] });
    reloadActions();
  };

  const handleDeleteAction = async (actionId) => {
    await deleteAction(id, actionId);
    reloadActions();
  };

  const nbPhotos = Array.isArray(pdp?.photos) ? pdp.photos.length : 0;
  const totalQ   = CATEGORIES.reduce((s,c) => s + c.questions.length, 0);
  const answered = pdp?.reponses ? Object.keys(pdp.reponses).length : 0;

  const risquesListe = () => {
    if (!pdp?.reponses) return [];
    return CATEGORIES.map(cat => ({
      cat, items: cat.questions.filter(q => pdp.reponses[q.id]==='non' || pdp.reponses[q.id]==='nsp'),
    })).filter(x => x.items.length > 0);
  };

  if (loading) return (
    <div style={{ height:'100dvh', display:'flex', alignItems:'center', justifyContent:'center', background:'#0B1120' }}>
      <Spinner />
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );

  if (error || !pdp) return (
    <div style={{ height:'100dvh', display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', background:'#0B1120', padding:24, gap:14 }}>
      <AlertTriangle size={40} style={{ color:'#EF4444' }} />
      <div style={{ color:'#EF4444', fontSize:14 }}>{error || 'Plan introuvable'}</div>
      <button className="btn btn-ghost" onClick={() => navigate('/')}>Retour</button>
    </div>
  );

  const cfg    = STATUT_CONFIG[pdp.statut] || STATUT_CONFIG.brouillon;
  const nInfo  = pdp.niveau_risque ? RISQUE_COLORS[pdp.niveau_risque] : null;
  const liste  = risquesListe();
  const mesuresRetenues = (pdp.mesures_suggerees || []).filter(m => m.selectionnee);
  const actTodo  = actions.filter(a=>a.statut==='todo').length;
  const actDoing = actions.filter(a=>a.statut==='doing').length;
  const actDone  = actions.filter(a=>a.statut==='done').length;

  return (
    <div style={{ height:'100dvh', display:'flex', flexDirection:'column', background:theme.bg }}>

      {/* Header */}
      <div style={{ padding:'calc(env(safe-area-inset-top,0px) + 10px) 14px 10px', background:theme.bgCard, borderBottom:`1px solid ${theme.border}`, flexShrink:0 }}>
        <div style={{ display:'flex', alignItems:'center', gap:8 }}>
          <button onClick={() => navigate('/')} style={{ ...iconBtn, background:theme.iconBg, border:`1px solid ${theme.border}`, color:theme.text3 }}>
            <ArrowLeft size={18} />
          </button>
          <div style={{ flex:1, minWidth:0 }}>
            <div style={{ fontSize:14, fontWeight:800, color:'#F1F5F9', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
              {pdp.lieu || 'Plan de Prévention'}
            </div>
            <div style={{ fontSize:11, color:'#64748B' }}>
              {pdp.date_travaux ? new Date(pdp.date_travaux+'T12:00:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short',year:'numeric'}) : '—'}
            </div>
          </div>
          {nInfo && (
            <div style={{ textAlign:'center', background:nInfo.bg, border:`1px solid ${nInfo.border}`, borderRadius:10, padding:'3px 9px', flexShrink:0 }}>
              <div style={{ fontSize:15, fontWeight:900, color:nInfo.text }}>{pdp.score_risque ?? '—'}</div>
              <div style={{ fontSize:8, color:nInfo.text }}>{nInfo.label}</div>
            </div>
          )}
          <span style={{ fontSize:11, fontWeight:700, color:cfg.color, background:cfg.bg, border:`1px solid ${cfg.border}`, borderRadius:100, padding:'3px 9px', flexShrink:0 }}>{cfg.label}</span>
          <button onClick={toggle} style={{ ...iconBtn, background:theme.iconBg, border:`1px solid ${theme.border}`, color:theme.text3 }}>
            {isDark ? <Sun size={15}/> : <Moon size={15}/>}
          </button>
        </div>
      </div>

      {/* Contenu */}
      <div className="scroll-area" style={{ flex:1, padding:14, display:'flex', flexDirection:'column', gap:10 }}>

        {/* Boutons d'action principaux */}
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
          <button className="btn btn-primary" onClick={handleExport} disabled={exporting} style={{ fontSize:13, minHeight:50, flexDirection:'column', gap:3 }}>
            {exporting ? <><SpinnerSmall /><span style={{fontSize:11}}>PDF…</span></> : <><Download size={18}/><span style={{fontSize:11}}>Exporter PDF</span></>}
          </button>
          <button className="btn" onClick={handleShare} disabled={sharing}
            style={{ fontSize:13, minHeight:50, flexDirection:'column', gap:3, background:'rgba(16,185,129,0.12)', color:'#10B981', border:'1px solid rgba(16,185,129,0.3)' }}>
            {sharing ? <><SpinnerSmall color="#10B981"/><span style={{fontSize:11}}>…</span></> : <><Share2 size={18}/><span style={{fontSize:11}}>Partager</span></>}
          </button>
          <button className="btn" onClick={handleEmail} disabled={exporting}
            style={{ fontSize:13, minHeight:50, flexDirection:'column', gap:3, background:'rgba(6,182,212,0.12)', color:'#06B6D4', border:'1px solid rgba(6,182,212,0.3)' }}>
            <Mail size={18}/><span style={{fontSize:11}}>Envoyer par email</span>
          </button>
          <button className="btn" onClick={handleDuplicate} disabled={duplicating}
            style={{ fontSize:13, minHeight:50, flexDirection:'column', gap:3, background:'rgba(139,92,246,0.12)', color:'#8B5CF6', border:'1px solid rgba(139,92,246,0.3)' }}>
            {duplicating ? <><SpinnerSmall color="#8B5CF6"/><span style={{fontSize:11}}>…</span></> : <><Copy size={18}/><span style={{fontSize:11}}>Dupliquer</span></>}
          </button>
        </div>

        {/* Bouton Modifier */}
        <button
          onClick={() => navigate(`/pdp/${id}/edit`)}
          style={{ width:'100%', display:'flex', alignItems:'center', justifyContent:'center', gap:8, minHeight:46, borderRadius:14, background:'rgba(245,158,11,0.1)', border:'1px solid rgba(245,158,11,0.3)', color:'#F59E0B', fontSize:14, fontWeight:700, cursor:'pointer' }}
        >
          <Pencil size={16}/> Modifier ce plan
        </button>

        {/* Infos principales */}
        <div className="card fade-up">
          <div style={{ display:'flex', flexDirection:'column', gap:9 }}>
            <Row icon={<MapPin size={14} style={{color:'#4F63E7'}} />} label="Lieu" value={pdp.lieu} />
            <Sep />
            <Row icon={<Building2 size={14} style={{color:'#10B981'}} />} label="Entreprise extérieure" value={pdp.entreprise_exterieure} />
            {pdp.responsable     && <><Sep /><Row icon={<FileText size={14} style={{color:'#F59E0B'}} />} label="Responsable QHSE" value={pdp.responsable} /></>}
            {pdp.contact_urgence && <><Sep /><Row icon={<FileText size={14} style={{color:'#EF4444'}} />} label="Contact urgence" value={<a href={`tel:${pdp.contact_urgence}`} style={{color:'#4F63E7',fontWeight:700,textDecoration:'none'}}>📞 {pdp.contact_urgence}</a>} /></>}
            {pdp.type_travaux    && <><Sep /><Row label="Type de travaux" value={pdp.type_travaux} /></>}
            {pdp.type_intervention && <><Sep /><Row label="Type d'intervention" value={TYPES_INTERVENTION.find(t=>t.value===pdp.type_intervention)?.label || pdp.type_intervention} /></>}
            {pdp.intervenants    && <><Sep /><Row label="Intervenants" value={pdp.intervenants} /></>}
            {pdp.meteo           && <><Sep /><Row label="Météo" value={pdp.meteo} /></>}
          </div>
          {pdp.description_travaux && (
            <>
              <div style={{ height:1, background:'rgba(255,255,255,0.06)', margin:'10px 0' }} />
              <div style={{ fontSize:11, color:'#64748B', textTransform:'uppercase', fontWeight:700, letterSpacing:'0.05em', marginBottom:4 }}>Description</div>
              <p style={{ fontSize:13, color:'#94A3B8', lineHeight:1.6 }}>{pdp.description_travaux}</p>
            </>
          )}
        </div>

        {/* Progression questionnaire */}
        {answered > 0 && (
          <div className="card fade-up">
            <div style={{ fontSize:12, fontWeight:700, color:'#64748B', marginBottom:10 }}>
              <ShieldCheck size={13} style={{display:'inline',marginRight:4}} />
              Questionnaire ({answered}/{totalQ} réponses)
            </div>
            <div style={{ display:'flex', gap:8 }}>
              {[
                {label:'Conformes',  val:Object.values(pdp.reponses).filter(r=>r==='oui').length, color:'#10B981'},
                {label:'Non-conf.',  val:Object.values(pdp.reponses).filter(r=>r==='non').length, color:'#EF4444'},
                {label:'À vérifier',val:Object.values(pdp.reponses).filter(r=>r==='nsp').length, color:'#F59E0B'},
              ].map(s => (
                <div key={s.label} style={{ flex:1, textAlign:'center', padding:'8px 4px', borderRadius:10, background:s.color+'10', border:`1px solid ${s.color}30` }}>
                  <div style={{ fontSize:20, fontWeight:800, color:s.color }}>{s.val}</div>
                  <div style={{ fontSize:10, color:s.color, opacity:0.8 }}>{s.label}</div>
                </div>
              ))}
            </div>
            {/* Barre de conformité */}
            {answered > 0 && (
              <div style={{ marginTop:10, height:6, background:'rgba(255,255,255,0.06)', borderRadius:3, overflow:'hidden' }}>
                <div style={{ height:'100%', width:`${Math.round(Object.values(pdp.reponses).filter(r=>r==='oui').length/answered*100)}%`, background:'#10B981', borderRadius:3, transition:'width 0.4s' }} />
              </div>
            )}
          </div>
        )}

        {/* Non-conformités */}
        {liste.length > 0 && (
          <div className="card fade-up">
            <div style={{ fontSize:13, fontWeight:700, color:'#F1F5F9', marginBottom:10 }}>⚠️ Points non-conformes / à vérifier</div>
            {liste.map(({ cat, items }) => (
              <div key={cat.id} style={{ marginBottom:10 }}>
                <div style={{ fontSize:12, fontWeight:700, color:cat.color, marginBottom:6, display:'flex', alignItems:'center', gap:5 }}>
                  <span>{cat.emoji}</span> {cat.label}
                </div>
                {items.map(q => (
                  <div key={q.id} style={{ display:'flex', alignItems:'flex-start', gap:8, padding:'8px 10px', borderRadius:8, background:pdp.reponses[q.id]==='non'?'rgba(239,68,68,0.07)':'rgba(245,158,11,0.07)', border:`1px solid ${pdp.reponses[q.id]==='non'?'rgba(239,68,68,0.2)':'rgba(245,158,11,0.2)'}`, marginBottom:4 }}>
                    <div style={{ width:18, height:18, borderRadius:'50%', flexShrink:0, background:pdp.reponses[q.id]==='non'?'#EF4444':'#F59E0B', display:'flex', alignItems:'center', justifyContent:'center' }}>
                      <span style={{ fontSize:10, color:'#fff', fontWeight:800 }}>{pdp.reponses[q.id]==='non'?'!':'?'}</span>
                    </div>
                    <div style={{ flex:1 }}>
                      <div style={{ fontSize:12, color:'#CBD5E1', lineHeight:1.4 }}>{q.text}</div>
                      {pdp.observations_questions?.[q.id] && <div style={{ fontSize:11, color:'#64748B', fontStyle:'italic', marginTop:3 }}>→ {pdp.observations_questions[q.id]}</div>}
                    </div>
                  </div>
                ))}
              </div>
            ))}
          </div>
        )}

        {/* ── Actions correctives ── */}
        <div className="card fade-up">
          <div
            style={{ display:'flex', alignItems:'center', justifyContent:'space-between', cursor:'pointer', marginBottom: showActions ? 12 : 0 }}
            onClick={() => setShowActions(s => !s)}
          >
            <div style={{ fontSize:13, fontWeight:700, color:'#F1F5F9', display:'flex', alignItems:'center', gap:6 }}>
              <ClipboardCheck size={14} style={{color:'#4F63E7'}} />
              Actions correctives
              {actions.length > 0 && (
                <span style={{ fontSize:11, fontWeight:700, color:'#4F63E7', background:'rgba(79,99,231,0.15)', border:'1px solid rgba(79,99,231,0.3)', borderRadius:100, padding:'1px 7px' }}>
                  {actTodo > 0 && <span style={{color:'#EF4444'}}>{actTodo} à faire</span>}
                  {actDoing > 0 && <>{actTodo > 0 && ' · '}<span style={{color:'#F59E0B'}}>{actDoing} en cours</span></>}
                  {actDone  > 0 && <>{(actTodo||actDoing) > 0 && ' · '}<span style={{color:'#10B981'}}>{actDone} faites</span></>}
                </span>
              )}
            </div>
            {showActions ? <ChevronUp size={16} style={{color:'#64748B'}} /> : <ChevronDown size={16} style={{color:'#64748B'}} />}
          </div>

          {showActions && (
            <>
              {actions.length === 0 && !addingAction && (
                <div style={{ fontSize:13, color:'#64748B', textAlign:'center', padding:'12px 0' }}>Aucune action corrective</div>
              )}

              {/* Liste des actions */}
              <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom: actions.length > 0 ? 10 : 0 }}>
                {actions.map(a => {
                  const sc = ACTION_STATUT[a.statut] || ACTION_STATUT.todo;
                  return (
                    <div key={a.id} style={{ display:'flex', gap:8, padding:'9px 10px', borderRadius:10, background:'#152236', border:'1px solid rgba(255,255,255,0.07)' }}>
                      <button
                        onClick={() => cycleActionStatut(a.id)}
                        style={{ flexShrink:0, padding:'3px 8px', borderRadius:100, fontSize:10, fontWeight:700, background:sc.bg, border:`1px solid ${sc.border}`, color:sc.color, cursor:'pointer', whiteSpace:'nowrap', minWidth:64 }}
                      >
                        {sc.label}
                      </button>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ fontSize:13, color:'#F1F5F9', lineHeight:1.4 }}>{a.description}</div>
                        <div style={{ fontSize:11, color:'#64748B', marginTop:2, display:'flex', gap:8 }}>
                          {a.responsable && <span>👤 {a.responsable}</span>}
                          {a.echeance && <span>📅 {new Date(a.echeance+'T12:00').toLocaleDateString('fr-FR',{day:'2-digit',month:'short'})}</span>}
                        </div>
                      </div>
                      <button onClick={() => handleDeleteAction(a.id)} style={{ flexShrink:0, background:'none', border:'none', cursor:'pointer', color:'#475569', display:'flex', alignItems:'flex-start', padding:2 }}>
                        <X size={14} />
                      </button>
                    </div>
                  );
                })}
              </div>

              {/* Formulaire ajout */}
              {addingAction ? (
                <div style={{ background:'rgba(79,99,231,0.06)', border:'1px solid rgba(79,99,231,0.2)', borderRadius:12, padding:12, display:'flex', flexDirection:'column', gap:8 }}>
                  <textarea
                    placeholder="Description de l'action…"
                    value={newAction.description}
                    onChange={e => setNewAction(n => ({...n, description:e.target.value}))}
                    style={{ width:'100%', padding:'10px 12px', borderRadius:10, background:'#152236', border:'1px solid rgba(255,255,255,0.1)', color:'#F1F5F9', fontSize:14, outline:'none', resize:'none', minHeight:72 }}
                  />
                  <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:8 }}>
                    <input
                      placeholder="Responsable"
                      value={newAction.responsable}
                      onChange={e => setNewAction(n => ({...n, responsable:e.target.value}))}
                      style={{ padding:'9px 12px', borderRadius:10, background:'#152236', border:'1px solid rgba(255,255,255,0.1)', color:'#F1F5F9', fontSize:13, outline:'none' }}
                    />
                    <input
                      type="date"
                      value={newAction.echeance}
                      onChange={e => setNewAction(n => ({...n, echeance:e.target.value}))}
                      style={{ padding:'9px 12px', borderRadius:10, background:'#152236', border:'1px solid rgba(255,255,255,0.1)', color:'#F1F5F9', fontSize:13, outline:'none' }}
                    />
                  </div>
                  <div style={{ display:'flex', gap:6 }}>
                    {Object.entries(ACTION_STATUT).map(([key,val]) => (
                      <button key={key} onClick={() => setNewAction(n=>({...n,statut:key}))}
                        style={{ flex:1, padding:'7px 0', borderRadius:8, fontSize:11, fontWeight:700, cursor:'pointer',
                          background: newAction.statut===key ? val.bg : '#152236',
                          border: `1px solid ${newAction.statut===key ? val.border : 'rgba(255,255,255,0.07)'}`,
                          color: newAction.statut===key ? val.color : '#64748B'
                        }}
                      >{val.label}</button>
                    ))}
                  </div>
                  <div style={{ display:'flex', gap:8 }}>
                    <button onClick={handleAddAction} className="btn btn-primary" style={{ flex:1, minHeight:42, fontSize:13 }}>
                      <Plus size={16} /> Ajouter
                    </button>
                    <button onClick={() => setAddingAction(false)} className="btn btn-ghost" style={{ minHeight:42, fontSize:13 }}>
                      Annuler
                    </button>
                  </div>
                </div>
              ) : (
                <button onClick={() => setAddingAction(true)} style={{ width:'100%', padding:'10px 0', background:'rgba(79,99,231,0.08)', border:'1px dashed rgba(79,99,231,0.3)', borderRadius:10, color:'#4F63E7', fontSize:13, fontWeight:700, cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center', gap:6 }}>
                  <Plus size={15} /> Ajouter une action corrective
                </button>
              )}
            </>
          )}
        </div>

        {/* Mesures de prévention */}
        {mesuresRetenues.length > 0 && (
          <div className="card fade-up">
            <div style={{ fontSize:13, fontWeight:700, color:'#F1F5F9', marginBottom:10 }}>🛡️ Mesures de prévention ({mesuresRetenues.length})</div>
            {mesuresRetenues.map((m, i) => (
              <div key={m.id} style={{ display:'flex', gap:8, padding:'8px 10px', borderRadius:8, background:m.priorite==='haute'?'rgba(239,68,68,0.06)':'rgba(16,185,129,0.05)', border:`1px solid ${m.priorite==='haute'?'rgba(239,68,68,0.2)':'rgba(16,185,129,0.15)'}`, marginBottom:4 }}>
                <div style={{ width:20, height:20, borderRadius:'50%', background:m.priorite==='haute'?'rgba(239,68,68,0.2)':'rgba(16,185,129,0.2)', display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0 }}>
                  <span style={{ fontSize:10, color:m.priorite==='haute'?'#EF4444':'#10B981', fontWeight:800 }}>{i+1}</span>
                </div>
                <span style={{ fontSize:12, color:'#CBD5E1', lineHeight:1.5 }}>{m.mesure}</span>
              </div>
            ))}
          </div>
        )}

        {/* Photos */}
        {nbPhotos > 0 && (
          <div className="card fade-up">
            <div style={{ fontSize:13, fontWeight:700, color:'#64748B', marginBottom:10 }}>📷 Photos ({nbPhotos})</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3, 1fr)', gap:8 }}>
              {pdp.photos.map((photo, idx) => (
                <a key={idx} href={photo.url} target="_blank" rel="noopener noreferrer"
                  style={{ borderRadius:10, overflow:'hidden', aspectRatio:'1', display:'block', background:'#152236' }}>
                  <img src={photo.url} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} onError={e => { e.target.style.display='none'; }} />
                </a>
              ))}
            </div>
          </div>
        )}

        {/* Signatures */}
        {(pdp.signature_qhse || pdp.signature_responsable) && (
          <div className="card fade-up">
            <div style={{ fontSize:13, fontWeight:700, color:'#F1F5F9', marginBottom:12 }}>
              <PenLine size={13} style={{display:'inline',marginRight:4}} />Signatures
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10 }}>
              {[{label:'QHSE', sig:pdp.signature_qhse}, {label:'Resp. Site', sig:pdp.signature_responsable}].map(({label,sig}) => {
                // Parse signature: supports old string format and new {drawing, nom, date} object
                let drawing = '', nom = '', date = '';
                if (sig) {
                  if (typeof sig === 'object') { drawing = sig.drawing||''; nom = sig.nom||''; date = sig.date||''; }
                  else { try { const p=JSON.parse(sig); if(p&&p.drawing){drawing=p.drawing;nom=p.nom||'';date=p.date||'';} else drawing=sig; } catch { drawing=sig; } }
                }
                return (
                  <div key={label} style={{ background:'#152236', borderRadius:10, padding:10, border:'1px solid rgba(255,255,255,0.07)' }}>
                    <div style={{ fontSize:11, fontWeight:700, color:'#64748B', marginBottom:6, textTransform:'uppercase' }}>{label}</div>
                    {drawing ? (
                      <img src={drawing} alt={`Signature ${label}`} style={{ width:'100%', height:60, objectFit:'contain', background:'#f8fafc', borderRadius:6 }} />
                    ) : (
                      <div style={{ height:60, display:'flex', alignItems:'center', justifyContent:'center', color:'#475569', fontSize:12 }}>Non signé</div>
                    )}
                    {nom && <div style={{ fontSize:11, color:'#94A3B8', marginTop:4 }}>{nom}</div>}
                    {date && <div style={{ fontSize:10, color:'#64748B' }}>{date}</div>}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Actions statut */}
        <div className="card fade-up">
          <div style={{ fontSize:11, fontWeight:700, color:'#64748B', marginBottom:10, textTransform:'uppercase', letterSpacing:'0.05em' }}>Changer le statut</div>
          <div style={{ display:'flex', gap:8 }}>
            {pdp.statut!=='valide'    && <button className="btn" style={{flex:1,minHeight:44,background:'rgba(16,185,129,0.12)',color:'#10B981',border:'1px solid rgba(16,185,129,0.3)',fontSize:13}} disabled={updatingStatut} onClick={()=>changeStatut('valide')}><CheckCircle2 size={15}/> Valider</button>}
            {pdp.statut!=='brouillon' && <button className="btn" style={{flex:1,minHeight:44,background:'rgba(245,158,11,0.1)',color:'#F59E0B',border:'1px solid rgba(245,158,11,0.25)',fontSize:13}} disabled={updatingStatut} onClick={()=>changeStatut('brouillon')}><Clock size={15}/> Brouillon</button>}
            {pdp.statut!=='archive'   && <button className="btn" style={{flex:1,minHeight:44,background:'rgba(100,116,139,0.1)',color:'#64748B',border:'1px solid rgba(100,116,139,0.2)',fontSize:13}} disabled={updatingStatut} onClick={()=>changeStatut('archive')}>Archiver</button>}
          </div>
        </div>

        <button className="btn btn-danger" disabled={deleting} onClick={handleDelete} style={{ width:'100%' }}>
          <Trash2 size={16} />
          {confirmDel ? 'Confirmer la suppression ?' : 'Supprimer ce plan'}
        </button>

        <div style={{ height:20 }} />
      </div>
      <style>{`@keyframes spin{to{transform:rotate(360deg)}}`}</style>
    </div>
  );
}

function Row({ icon, label, value }) {
  return (
    <div style={{ display:'flex', gap:8 }}>
      {icon && <div style={{ flexShrink:0, marginTop:2 }}>{icon}</div>}
      <div>
        <div style={{ fontSize:11, color:'#64748B', textTransform:'uppercase', fontWeight:700, letterSpacing:'0.05em' }}>{label}</div>
        <div style={{ fontSize:14, fontWeight:600, color:'#F1F5F9', marginTop:1 }}>{value || '—'}</div>
      </div>
    </div>
  );
}

function Sep() { return <div style={{ height:1, background:'rgba(255,255,255,0.06)' }} />; }

const iconBtn = {
  width:38, height:38, borderRadius:10, border:'1px solid rgba(255,255,255,0.08)',
  background:'#152236', color:'#94A3B8', cursor:'pointer',
  display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
};

function Spinner() {
  return <div style={{ width:36, height:36, border:'3px solid rgba(79,99,231,0.3)', borderTopColor:'#4F63E7', borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />;
}
function SpinnerSmall({ color = '#fff' }) {
  return <div style={{ width:16, height:16, border:`2px solid ${color}30`, borderTopColor:color, borderRadius:'50%', animation:'spin 0.8s linear infinite' }} />;
}
