import { useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { getAllDrafts, removeDraft } from '../utils/offlineStorage';
import { getPendingUploads, removeFromQueue } from '../utils/photoQueue';
import { useToast } from '../contexts/ToastContext';

export function useOfflineSync() {
  const { addToast } = useToast();

  useEffect(() => {
    async function syncDrafts() {
      const drafts = getAllDrafts();
      const ids = Object.keys(drafts);
      if (ids.length === 0) return;
      addToast({ message: `Connexion rétablie — sync de ${ids.length} brouillon(s)…`, type: 'info' });
      for (const id of ids) {
        try {
          const { _savedAt, _offline, ...clean } = drafts[id];
          const { error } = await supabase.from('plans_prevention').upsert(clean);
          if (!error) {
            removeDraft(id);
            addToast({ message: 'Brouillon synchronisé', type: 'success' });
          }
        } catch (err) {
          console.error('[sync] draft error:', err);
        }
      }
    }

    async function syncPhotoQueue() {
      const pending = await getPendingUploads();
      if (pending.length === 0) return;
      addToast({ message: `Upload de ${pending.length} photo(s) en attente…`, type: 'info' });
      for (const item of pending) {
        try {
          const file = new File([item.blob], item.fileName, { type: item.mimeType });
          const path = `pdp/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
          const { data, error: upErr } = await supabase.storage.from('pdp-photos').upload(path, file, { contentType: item.mimeType });
          if (upErr) continue;
          const { data: { publicUrl } } = supabase.storage.from('pdp-photos').getPublicUrl(data.path);
          // Mettre à jour le plan avec la nouvelle URL
          const { data: plan } = await supabase.from('plans_prevention').select('photos').eq('id', item.planId).single();
          if (plan) {
            const photos = (plan.photos || []).map(p =>
              p.queueId === item.id ? { ...p, url: publicUrl, source: 'storage', queueId: undefined } : p
            );
            await supabase.from('plans_prevention').update({ photos }).eq('id', item.planId);
          }
          await removeFromQueue(item.id);
        } catch (err) {
          console.error('[sync] photo queue error:', err);
        }
      }
    }

    async function syncAll() {
      await syncDrafts();
      await syncPhotoQueue();
    }

    window.addEventListener('online', syncAll);
    return () => window.removeEventListener('online', syncAll);
  }, [addToast]);
}
