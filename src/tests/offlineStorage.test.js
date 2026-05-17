import { describe, it, expect, beforeEach } from 'vitest';

// Mock localStorage
const store = {};
global.localStorage = {
  getItem: (k) => store[k] ?? null,
  setItem: (k, v) => { store[k] = v; },
  removeItem: (k) => { delete store[k]; },
};

import { saveDraft, getAllDrafts, removeDraft, countDrafts } from '../utils/offlineStorage';

beforeEach(() => { Object.keys(store).forEach(k => delete store[k]); });

describe('offlineStorage', () => {
  it('saveDraft stores and getAllDrafts retrieves', () => {
    saveDraft({ lieu: 'Site A', statut: 'brouillon' });
    const drafts = getAllDrafts();
    expect(Object.keys(drafts)).toHaveLength(1);
    const [draft] = Object.values(drafts);
    expect(draft.lieu).toBe('Site A');
    expect(draft._offline).toBe(true);
  });

  it('removeDraft deletes an entry', () => {
    const id = saveDraft({ lieu: 'Site B' });
    removeDraft(id);
    expect(countDrafts()).toBe(0);
  });

  it('saveDraft with existing id preserves id', () => {
    saveDraft({ id: 'my-id', lieu: 'Site C' });
    const drafts = getAllDrafts();
    expect(drafts['my-id']).toBeDefined();
  });
});
