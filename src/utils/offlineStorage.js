const KEY_DRAFTS  = 'pdp_offline_drafts';
const KEY_ACTIONS = 'pdp_actions_correctives';

// ── Brouillons hors-ligne ────────────────────────────────────────────────────

export function saveDraftOffline(draft) {
  const all = getDraftsOffline();
  const id  = draft.id || `offline_${Date.now()}`;
  all[id] = { ...draft, id, _offline: true, _savedAt: new Date().toISOString() };
  try { localStorage.setItem(KEY_DRAFTS, JSON.stringify(all)); } catch {}
  return id;
}

export function getDraftsOffline() {
  try { return JSON.parse(localStorage.getItem(KEY_DRAFTS) || '{}'); } catch { return {}; }
}

export function removeDraftOffline(id) {
  const all = getDraftsOffline();
  delete all[id];
  try { localStorage.setItem(KEY_DRAFTS, JSON.stringify(all)); } catch {}
}

export function countDraftsOffline() {
  return Object.keys(getDraftsOffline()).length;
}

// ── Aliases requis par NouveauPdP (Task 8) ──────────────────────────────────

export function saveDraftLocally(formData) {
  try {
    const drafts = getAllDrafts();
    const id = formData.id || `draft-${Date.now()}`;
    drafts[id] = { ...formData, _savedAt: new Date().toISOString() };
    localStorage.setItem('pdp_offline_drafts', JSON.stringify(drafts));
    return id;
  } catch (err) {
    console.error('[offlineStorage] Impossible de sauvegarder le brouillon:', err);
    return null;
  }
}

export function getAllDrafts() {
  try {
    return JSON.parse(localStorage.getItem('pdp_offline_drafts') || '{}');
  } catch {
    return {};
  }
}

export function removeDraft(id) {
  try {
    const drafts = getAllDrafts();
    delete drafts[id];
    localStorage.setItem('pdp_offline_drafts', JSON.stringify(drafts));
  } catch (err) {
    console.error('[offlineStorage] Impossible de supprimer le brouillon:', err);
  }
}

// ── Actions correctives (par plan) ──────────────────────────────────────────

export function getActionsForPlan(planId) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY_ACTIONS) || '{}');
    return all[planId] || [];
  } catch { return []; }
}

export function saveActionsForPlan(planId, actions) {
  try {
    const all = JSON.parse(localStorage.getItem(KEY_ACTIONS) || '{}');
    all[planId] = actions;
    localStorage.setItem(KEY_ACTIONS, JSON.stringify(all));
  } catch {}
}

export function addAction(planId, action) {
  const actions = getActionsForPlan(planId);
  const newAction = {
    id: `act_${Date.now()}`,
    description: action.description || '',
    responsable: action.responsable || '',
    echeance:    action.echeance    || '',
    statut:      action.statut      || 'todo',
    questionId:  action.questionId  || null,
    createdAt:   new Date().toISOString(),
  };
  saveActionsForPlan(planId, [...actions, newAction]);
  return newAction;
}

export function updateAction(planId, actionId, updates) {
  const actions = getActionsForPlan(planId).map(a =>
    a.id === actionId ? { ...a, ...updates } : a
  );
  saveActionsForPlan(planId, actions);
}

export function deleteAction(planId, actionId) {
  saveActionsForPlan(planId, getActionsForPlan(planId).filter(a => a.id !== actionId));
}

export function getAllActionsStats() {
  try {
    const all = JSON.parse(localStorage.getItem(KEY_ACTIONS) || '{}');
    let todo = 0, doing = 0, done = 0;
    Object.values(all).forEach(actions => {
      actions.forEach(a => {
        if (a.statut === 'todo')  todo++;
        if (a.statut === 'doing') doing++;
        if (a.statut === 'done')  done++;
      });
    });
    return { todo, doing, done, total: todo + doing + done };
  } catch { return { todo: 0, doing: 0, done: 0, total: 0 }; }
}
