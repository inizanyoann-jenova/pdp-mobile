// src/pages/Settings.jsx
import React, { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Upload, Save, Building2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';
import { useSettings } from '../contexts/SettingsContext';
import { useToast } from '../contexts/ToastContext';
import BottomNav from '../components/BottomNav';

const COLORS = ['#1e3a5f', '#c0392b', '#16a085', '#8e44ad', '#e67e22', '#2c3e50'];

async function compressLogo(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new window.Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const maxW = 400;
        let w = img.width, h = img.height;
        if (w > maxW) { h = Math.round((h * maxW) / w); w = maxW; }
        canvas.width = w; canvas.height = h;
        canvas.getContext('2d').drawImage(img, 0, 0, w, h);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => reject(new Error('Image invalide'));
      img.src = e.target.result;
    };
    reader.onerror = () => reject(new Error('Lecture fichier échouée'));
    reader.readAsDataURL(file);
  });
}

export default function Settings({ session }) {
  const { theme } = useTheme();
  const { settings, saveSettings, isLoading } = useSettings();
  const { addToast } = useToast();
  const navigate = useNavigate();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    company_name: settings.company_name,
    company_address: settings.company_address,
    company_phone: settings.company_phone,
    company_logo_base64: settings.company_logo_base64,
    pdf_primary_color: settings.pdf_primary_color,
  });
  const [saving, setSaving] = useState(false);

  const set = (field, val) => setForm(f => ({ ...f, [field]: val }));

  async function handleLogoUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      addToast({ message: 'Veuillez choisir un fichier image (PNG recommandé)', type: 'error' });
      e.target.value = '';
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      addToast({ message: 'Image trop lourde (max 2 Mo)', type: 'error' });
      e.target.value = '';
      return;
    }
    try {
      const base64 = await compressLogo(file);
      set('company_logo_base64', base64);
    } catch (err) {
      addToast({ message: 'Impossible de charger cette image : ' + err.message, type: 'error' });
    }
    e.target.value = '';
  }

  async function handleSave() {
    if (!form.company_name.trim()) {
      addToast({ message: "Le nom de l'entreprise est requis", type: 'error' });
      return;
    }
    setSaving(true);
    const { error } = await saveSettings(form);
    setSaving(false);
    if (error) {
      addToast({ message: 'Erreur lors de la sauvegarde : ' + error.message, type: 'error' });
    } else {
      addToast({ message: 'Paramètres enregistrés', type: 'success' });
    }
  }

  const primaryHex = form.pdf_primary_color;

  return (
    <div style={{ minHeight: '100dvh', background: theme.bg, paddingBottom: 80 }}>
      {/* Header */}
      <div style={{ background: theme.bgCard, borderBottom: `1px solid ${theme.border}`, padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate(-1)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.text1, display: 'flex', alignItems: 'center' }}>
          <ArrowLeft size={22} />
        </button>
        <div style={{ fontSize: 17, fontWeight: 700, color: theme.text1 }}>Paramètres entreprise</div>
      </div>

      <div style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: 12 }}>

        {/* Logo */}
        <div style={{ background: theme.bgCard, borderRadius: 14, padding: 16, border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Logo de l'entreprise</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
            <div style={{ width: 72, height: 72, border: `2px dashed ${theme.border}`, borderRadius: 10, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', background: theme.bg, flexShrink: 0 }}>
              {form.company_logo_base64
                ? <img src={form.company_logo_base64} alt="Logo" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                : <Building2 size={28} style={{ color: theme.text4 }} />
              }
            </div>
            <div style={{ flex: 1 }}>
              <button onClick={() => fileRef.current?.click()} style={{ width: '100%', background: primaryHex, color: 'white', border: 'none', borderRadius: 10, padding: '10px 14px', fontWeight: 700, fontSize: 13, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, marginBottom: 6 }}>
                <Upload size={16} /> Choisir un logo
              </button>
              <div style={{ fontSize: 11, color: theme.text4 }}>PNG recommandé, fond transparent<br />Max 2 Mo</div>
              {form.company_logo_base64 && (
                <button onClick={() => set('company_logo_base64', null)} style={{ fontSize: 11, color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', marginTop: 4 }}>
                  Supprimer le logo
                </button>
              )}
            </div>
          </div>
          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleLogoUpload} />
        </div>

        {/* Infos entreprise */}
        <div style={{ background: theme.bgCard, borderRadius: 14, padding: 16, border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Informations entreprise</div>
          {[
            { field: 'company_name',    label: "Nom de l'entreprise *", placeholder: 'BTP Dupont SARL' },
            { field: 'company_address', label: 'Adresse',               placeholder: '12 rue des Lilas, 75001 Paris' },
            { field: 'company_phone',   label: 'Téléphone',             placeholder: '01 23 45 67 89' },
          ].map(({ field, label, placeholder }) => (
            <div key={field} style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 11, fontWeight: 600, color: theme.text3, display: 'block', marginBottom: 4 }}>{label}</label>
              <input
                type="text"
                value={form[field]}
                onChange={e => set(field, e.target.value)}
                placeholder={placeholder}
                style={{ width: '100%', padding: '10px 12px', borderRadius: 10, background: theme.inputBg, border: `1.5px solid ${theme.border}`, color: theme.text1, fontSize: 13, outline: 'none', boxSizing: 'border-box' }}
              />
            </div>
          ))}
        </div>

        {/* Couleur PDF */}
        <div style={{ background: theme.bgCard, borderRadius: 14, padding: 16, border: `1px solid ${theme.border}` }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: theme.text3, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>Couleur principale du PDF</div>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', marginBottom: 14 }}>
            {COLORS.map(c => (
              <button key={c} onClick={() => set('pdf_primary_color', c)} style={{
                width: 38, height: 38, borderRadius: '50%', background: c, border: 'none', cursor: 'pointer',
                boxShadow: form.pdf_primary_color === c ? `0 0 0 3px white, 0 0 0 5px ${c}` : 'none',
                transition: 'box-shadow 0.15s',
              }} />
            ))}
          </div>
          {/* Aperçu en-tête PDF */}
          <div style={{ fontSize: 11, fontWeight: 600, color: theme.text3, marginBottom: 8 }}>Aperçu en-tête PDF</div>
          <div style={{ background: primaryHex, borderRadius: 8, padding: '10px 14px', display: 'flex', alignItems: 'center', gap: 10 }}>
            {form.company_logo_base64
              ? <img src={form.company_logo_base64} alt="Logo" style={{ width: 32, height: 32, objectFit: 'contain', background: 'white', borderRadius: 4, padding: 2 }} />
              : <div style={{ width: 32, height: 32, background: 'rgba(255,255,255,0.2)', borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Building2 size={18} color="white" /></div>
            }
            <div>
              <div style={{ color: 'white', fontWeight: 700, fontSize: 13 }}>{form.company_name || 'Votre entreprise'}</div>
              <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: 10 }}>PLAN DE PRÉVENTION</div>
            </div>
          </div>
        </div>

        {/* Bouton save */}
        <button onClick={handleSave} disabled={saving} style={{
          background: saving ? '#64748b' : primaryHex,
          color: 'white', border: 'none', borderRadius: 14,
          padding: '15px', fontWeight: 700, fontSize: 15,
          cursor: saving ? 'not-allowed' : 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
        }}>
          <Save size={18} />
          {saving ? 'Enregistrement...' : 'Enregistrer les paramètres'}
        </button>

      </div>

      <BottomNav />
    </div>
  );
}
