import React, { useRef, useState } from 'react';
import { Camera, Image, X, Maximize2 } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useToast } from '../contexts/ToastContext';
import { addToPhotoQueue } from '../utils/photoQueue';

const CATEGORIES = [
  { value: 'zone_risque', label: 'Zone risque' },
  { value: 'epi',         label: 'EPI' },
  { value: 'acces',       label: 'Accès' },
  { value: 'materiel',    label: 'Matériel' },
  { value: 'autre',       label: 'Autre' },
];

async function compressImage(file, maxWidth = 1280) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = Math.round((h * maxWidth) / w); w = maxWidth; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => resolve({ blob, file: new File([blob], file.name, { type: 'image/jpeg' }) }), 'image/jpeg', 0.8);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function PhotoCapture({ photos = [], onChange, planId }) {
  const cameraRef   = useRef(null);
  const galleryRef  = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview]     = useState(null); // URL pour fullscreen
  const { addToast } = useToast();

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    const newPhotos = [...photos];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const { blob, file: compressed } = await compressImage(file);

        if (!navigator.onLine) {
          // Mode offline → IndexedDB queue
          const queueId = await addToPhotoQueue({ planId, blob, fileName: file.name });
          const localUrl = URL.createObjectURL(blob);
          newPhotos.push({ url: localUrl, source: 'queued', name: file.name, queueId, legende: '', categorie: '' });
          continue;
        }

        const fileName = `pdp/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
        const { data, error: upErr } = await supabase.storage
          .from('pdp-photos')
          .upload(fileName, compressed, { contentType: 'image/jpeg', upsert: false });

        if (upErr) {
          // Fallback offline même si online (bucket down, etc.)
          const queueId = await addToPhotoQueue({ planId, blob, fileName: file.name });
          const localUrl = URL.createObjectURL(blob);
          newPhotos.push({ url: localUrl, source: 'queued', name: file.name, queueId, legende: '', categorie: '' });
          addToast({ message: "Photo mise en file d'attente", type: 'info' });
        } else {
          const { data: { publicUrl } } = supabase.storage.from('pdp-photos').getPublicUrl(data.path);
          newPhotos.push({ url: publicUrl, source: 'storage', name: file.name, legende: '', categorie: '' });
        }
      } catch (err) {
        addToast({ message: 'Erreur photo : ' + (err.message || 'réessayer'), type: 'error' });
      }
    }

    onChange(newPhotos);
    setUploading(false);
  };

  const updatePhoto = (idx, field, val) => {
    onChange(photos.map((p, i) => i === idx ? { ...p, [field]: val } : p));
  };

  const removePhoto = (idx) => onChange(photos.filter((_, i) => i !== idx));

  const allCategorized = photos.length > 0 && photos.every(p => p.legende && p.categorie);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Statut compteur */}
      {photos.length > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '8px 12px', borderRadius: 10,
          background: allCategorized ? 'rgba(16,185,129,0.08)' : 'rgba(245,158,11,0.08)',
          border: `1px solid ${allCategorized ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
          fontSize: 12, fontWeight: 700,
          color: allCategorized ? '#10B981' : '#F59E0B',
        }}>
          <span>📷 {photos.length} photo{photos.length > 1 ? 's' : ''}</span>
          <span>{allCategorized ? '✓ Toutes documentées' : 'Ajoutez légende + catégorie'}</span>
        </div>
      )}

      {/* Boutons capture */}
      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 10 }}>
        <button type="button" className="btn btn-primary"
          onClick={() => cameraRef.current?.click()} disabled={uploading}
          style={{ gap: 8 }}>
          <Camera size={20} />
          {uploading ? 'Upload…' : 'Prendre une photo'}
        </button>
        <button type="button" className="btn btn-ghost"
          onClick={() => galleryRef.current?.click()} disabled={uploading}>
          <Image size={18} />
        </button>
      </div>

      <input ref={cameraRef} type="file" accept="image/*" capture="environment" multiple
        onChange={e => handleFiles(e.target.files)} style={{ display: 'none' }} />
      <input ref={galleryRef} type="file" accept="image/*" multiple
        onChange={e => handleFiles(e.target.files)} style={{ display: 'none' }} />

      {/* Liste photos */}
      {photos.map((photo, idx) => (
        <div key={idx} style={{ borderRadius: 12, overflow: 'hidden', border: '1px solid var(--border)', background: 'var(--bg-card)' }}>
          {/* Image 16:9 */}
          <div style={{ position: 'relative', aspectRatio: '16/9', background: '#0a0a0a' }}>
            <img src={photo.url} alt={`Photo ${idx + 1}`}
              style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
            {photo.source === 'queued' && (
              <div style={{ position: 'absolute', top: 6, left: 6, background: 'rgba(245,158,11,0.9)', color: '#000', fontSize: 10, fontWeight: 800, padding: '3px 8px', borderRadius: 100 }}>
                ⏳ En attente
              </div>
            )}
            <div style={{ position: 'absolute', top: 6, right: 6, display: 'flex', gap: 4 }}>
              <button type="button" onClick={() => setPreview(photo.url)}
                style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(0,0,0,0.6)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Maximize2 size={13} />
              </button>
              <button type="button" onClick={() => removePhoto(idx)}
                style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(239,68,68,0.8)', border: 'none', color: '#fff', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <X size={13} />
              </button>
            </div>
          </div>

          {/* Chips catégorie */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 5, padding: '8px 10px 4px' }}>
            {CATEGORIES.map(cat => (
              <button key={cat.value} type="button"
                onClick={() => updatePhoto(idx, 'categorie', photo.categorie === cat.value ? '' : cat.value)}
                style={{ padding: '4px 10px', borderRadius: 100, fontSize: 11, fontWeight: 700, cursor: 'pointer', border: `1.5px solid ${photo.categorie === cat.value ? '#4F63E7' : 'rgba(255,255,255,0.12)'}`, background: photo.categorie === cat.value ? 'rgba(79,99,231,0.18)' : 'transparent', color: photo.categorie === cat.value ? '#7C8FFF' : '#64748B' }}>
                {cat.label}
              </button>
            ))}
          </div>

          {/* Légende */}
          <div style={{ padding: '4px 10px 10px' }}>
            <input
              type="text"
              value={photo.legende || ''}
              onChange={e => updatePhoto(idx, 'legende', e.target.value)}
              placeholder="Ajouter une légende (zone risque, EPI manquant…)"
              style={{ width: '100%', padding: '8px 12px', borderRadius: 8, background: 'var(--bg-card2)', border: '1px solid var(--border)', color: 'var(--text1)', fontSize: 12, outline: 'none', boxSizing: 'border-box' }}
            />
          </div>
        </div>
      ))}

      {photos.length === 0 && !uploading && (
        <div style={{ textAlign: 'center', padding: '28px 0', color: '#475569', borderRadius: 12, border: '1.5px dashed rgba(255,255,255,0.07)' }}>
          <Camera size={28} style={{ margin: '0 auto 8px', opacity: 0.35 }} />
          <div style={{ fontSize: 13 }}>Aucune photo — documentez la zone de travail</div>
        </div>
      )}

      {/* Fullscreen preview dialog */}
      {preview && (
        <dialog open onClick={() => setPreview(null)}
          style={{ position: 'fixed', inset: 0, width: '100vw', height: '100dvh', background: 'rgba(0,0,0,0.95)', border: 'none', padding: 0, margin: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 9999 }}>
          <img src={preview} alt="Aperçu"
            style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', borderRadius: 8 }} />
          <button onClick={() => setPreview(null)}
            style={{ position: 'absolute', top: 16, right: 16, width: 40, height: 40, borderRadius: '50%', background: 'rgba(255,255,255,0.2)', border: 'none', color: '#fff', fontSize: 20, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <X size={20} />
          </button>
        </dialog>
      )}
    </div>
  );
}
