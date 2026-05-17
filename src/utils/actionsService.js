import { supabase } from '../supabaseClient';

// ── Fallback localStorage (si pas de réseau) ────────────────────────────────
const LS_KEY = 'pdp_actions_correctives';

function lsGet(planId) {
  try { return (JSON.parse(localStorage.getItem(LS_KEY) || '{}'))[planId] || []; }
  catch { return []; }
}
function lsSet(planId, actions) {
  try {
    const all = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
    all[planId] = actions;
    localStorage.setItem(LS_KEY, JSON.stringify(all));
  } catch {}
}

// ── API Supabase ─────────────────────────────────────────────────────────────

export async function getActionsForPlan(planId) {
  const { data, error } = await supabase
    .from('actions_correctives')
    .select('*')
    .eq('plan_id', planId)
    .order('created_at', { ascending: true });
  if (error) return lsGet(planId);
  // Sync cache local
  lsSet(planId, data);
  return data;
}

export async function addAction(planId, action) {
  const { data: { user } } = await supabase.auth.getUser();
  const payload = {
    plan_id:     planId,
    created_by:  user?.id,
    description: action.description || '',
    responsable: action.responsable || '',
    echeance:    action.echeance    || null,
    statut:      action.statut      || 'todo',
    question_id: action.questionId  || null,
  };
  const { data, error } = await supabase
    .from('actions_correctives')
    .insert([payload])
    .select()
    .single();
  if (error) {
    // Fallback local
    const local = { ...payload, id: `local_${Date.now()}`, created_at: new Date().toISOString() };
    lsSet(planId, [...lsGet(planId), local]);
    return local;
  }
  return data;
}

export async function updateAction(planId, actionId, updates) {
  const mapped = { ...updates };
  if ('questionId' in mapped) { mapped.question_id = mapped.questionId; delete mapped.questionId; }

  if (actionId.startsWith('local_')) {
    // Action locale uniquement
    lsSet(planId, lsGet(planId).map(a => a.id === actionId ? { ...a, ...mapped } : a));
    return;
  }
  await supabase.from('actions_correctives').update(mapped).eq('id', actionId);
}

export async function deleteAction(planId, actionId) {
  if (actionId.startsWith('local_')) {
    lsSet(planId, lsGet(planId).filter(a => a.id !== actionId));
    return;
  }
  await supabase.from('actions_correctives').delete().eq('id', actionId);
}

export async function getAllActionsStats() {
  const { data, error } = await supabase
    .from('actions_correctives')
    .select('statut');
  if (error) {
    // Fallback local
    try {
      const all = JSON.parse(localStorage.getItem(LS_KEY) || '{}');
      let todo = 0, doing = 0, done = 0;
      Object.values(all).forEach(actions =>
        actions.forEach(a => { if (a.statut==='todo') todo++; else if (a.statut==='doing') doing++; else if (a.statut==='done') done++; })
      );
      return { todo, doing, done, total: todo+doing+done };
    } catch { return { todo:0, doing:0, done:0, total:0 }; }
  }
  const todo  = data.filter(a => a.statut === 'todo').length;
  const doing = data.filter(a => a.statut === 'doing').length;
  const done  = data.filter(a => a.statut === 'done').length;
  return { todo, doing, done, total: data.length };
}
