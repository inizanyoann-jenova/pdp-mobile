import React, { useRef, useState } from 'react';
import { Camera, Upload, X, Image } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { useToast } from '../contexts/ToastContext';

async function compressImage(file, maxWidth = 1280) {
  return new Promise((resolve) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let w = img.width, h = img.height;
        if (w > maxWidth) { h = (h * maxWidth) / w; w = maxWidth; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        canvas.toBlob((blob) => resolve(new File([blob], file.name, { type: 'image/jpeg' })), 'image/jpeg', 0.8);
      };
      img.src = e.target.result;
    };
    reader.readAsDataURL(file);
  });
}

export default function PhotoCapture({ photos = [], onChange }) {
  const cameraRef  = useRef(null);
  const galleryRef = useRef(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError]         = useState('');
  const { addToast } = useToast();

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setError('');
    const newPhotos = [...photos];

    for (const file of Array.from(files)) {
      if (!file.type.startsWith('image/')) continue;
      try {
        const compressed = await compressImage(file);
        const fileName   = `pdp/${Date.now()}_${Math.random().toString(36).slice(2)}.jpg`;
        const { data, error: upErr } = await supabase.storage
          .from('pdp-photos')
          .upload(fileName, compressed, { contentType: 'image/jpeg', upsert: false });
        if (upErr) {
          // Fallback : stocker en base64 si le bucket n'est pas configuré
          const reader = new FileReader();
          await new Promise((res) => {
            reader.onload = (e) => {
              newPhotos.push({ url: e.target.result, source: 'local', name: file.name });
              res();
            };
            reader.readAsDataURL(compressed);
          });
        } else {
          const { data: { publicUrl } } = supabase.storage.from('pdp-photos').getPublicUrl(data.path);
          newPhotos.push({ url: publicUrl, source: 'storage', name: file.name });
        }
      } catch (err) {
        console.error('[PhotoCapture] Upload failed:', err);
        setError("Erreur lors de l'upload photo : " + (err.message || 'réessayer'));
        addToast({ message: "Erreur lors de l'upload photo : " + (err.message || 'réessayer'), type: 'error' });
      }
    }

    onChange(newPhotos);
    setUploading(false);
  };

  const removePhoto = (idx) => {
    const updated = photos.filter((_, i) => i !== idx);
    onChange(updated);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Boutons de capture */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => cameraRef.current?.click()}
          disabled={uploading}
          style={{ flexDirection: 'column', gap: 6, minHeight: 72 }}
        >
          <Camera size={24} style={{ color: '#4F63E7' }} />
          <span style={{ fontSize: 13 }}>Prendre une photo</span>
        </button>

        <button
          type="button"
          className="btn btn-ghost"
          onClick={() => galleryRef.current?.click()}
          disabled={uploading}
          style={{ flexDirection: 'column', gap: 6, minHeight: 72 }}
        >
          <Image size={24} style={{ color: '#10B981' }} />
          <span style={{ fontSize: 13 }}>Galerie</span>
        </button>
      </div>

      {/* Inputs cachés */}
      <input ref={cameraRef} type="file" accept="image/*" capture="environment" multiple
        onChange={e => handleFiles(e.target.files)} style={{ display: 'none' }} />
      <input ref={galleryRef} type="file" accept="image/*" multiple
        onChange={e => handleFiles(e.target.files)} style={{ display: 'none' }} />

      {uploading && (
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', background: 'rgba(79,99,231,0.08)', borderRadius: 10, border: '1px solid rgba(79,99,231,0.2)' }}>
          <div style={{ width: 18, height: 18, border: '2px solid rgba(79,99,231,0.3)', borderTopColor: '#4F63E7', borderRadius: '50%', animation: 'spin 0.8s linear infinite', flexShrink: 0 }} />
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
          <span style={{ fontSize: 13, color: '#94A3B8' }}>Upload en cours…</span>
        </div>
      )}

      {error && (
        <div style={{ padding: '10px 14px', background: 'rgba(239,68,68,0.08)', borderRadius: 10, border: '1px solid rgba(239,68,68,0.2)', fontSize: 13, color: '#EF4444' }}>
          {error}
        </div>
      )}

      {/* Grille photos */}
      {photos.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {photos.map((photo, idx) => (
            <div key={idx} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '1', background: '#152236', border: '1px solid rgba(255,255,255,0.07)' }}>
              <img
                src={photo.url}
                alt={`Photo ${idx + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
              <button
                type="button"
                onClick={() => removePhoto(idx)}
                style={{
                  position: 'absolute', top: 4, right: 4,
                  width: 22, height: 22, borderRadius: '50%',
                  background: 'rgba(0,0,0,0.7)', border: 'none',
                  color: '#fff', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}
              >
                <X size={12} />
              </button>
            </div>
          ))}
        </div>
      )}

      {photos.length === 0 && !uploading && (
        <div style={{ textAlign: 'center', padding: '24px 0', color: '#475569', borderRadius: 12, border: '1.5px dashed rgba(255,255,255,0.07)' }}>
          <Upload size={28} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
          <div style={{ fontSize: 13 }}>Aucune photo pour l'instant</div>
        </div>
      )}
    </div>
  );
}
