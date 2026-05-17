const KEY_DRAFTS = 'pdp_offline_drafts';

// ── Brouillons hors-ligne ────────────────────────────────────────────────────

export function saveDraft(draft) {
  const all = getAllDrafts();
  const id  = draft.id || `offline_${Date.now()}`;
  all[id] = { ...draft, id, _offline: true, _savedAt: new Date().toISOString() };
  try { localStorage.setItem(KEY_DRAFTS, JSON.stringify(all)); } catch {}
  return id;
}

export function getAllDrafts() {
  try { return JSON.parse(localStorage.getItem(KEY_DRAFTS) || '{}'); } catch { return {}; }
}

export function removeDraft(id) {
  const all = getAllDrafts();
  delete all[id];
  try { localStorage.setItem(KEY_DRAFTS, JSON.stringify(all)); } catch {}
}

export function countDrafts() {
  return Object.keys(getAllDrafts()).length;
}

// ── Actions correctives stats (cache local fallback) ─────────────────────────

const KEY_ACTIONS = 'pdp_actions_correctives';

export function getLocalActionsStats() {
  try {
    const all = JSON.parse(localStorage.getItem(KEY_ACTIONS) || '{}');
    let todo = 0, doing = 0, done = 0;
    Object.values(all).forEach(actions =>
      actions.forEach(a => {
        if (a.statut === 'todo')  todo++;
        if (a.statut === 'doing') doing++;
        if (a.statut === 'done')  done++;
      })
    );
    return { todo, doing, done, total: todo + doing + done };
  } catch { return { todo: 0, doing: 0, done: 0, total: 0 }; }
}
