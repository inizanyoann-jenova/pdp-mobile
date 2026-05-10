// src/components/Toast.jsx
import React from 'react';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { useToast } from '../contexts/ToastContext';

const STYLES = {
  success: { bg: '#064e3b', border: '#10b981', icon: CheckCircle, color: '#10b981' },
  error:   { bg: '#450a0a', border: '#ef4444', icon: AlertCircle, color: '#ef4444' },
  info:    { bg: '#0c1a3a', border: '#4f63e7', icon: Info,         color: '#4f63e7' },
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div style={{
      position: 'fixed',
      bottom: 'calc(62px + env(safe-area-inset-bottom, 0px) + 8px)',
      left: 12, right: 12,
      zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 8,
    }}>
      {toasts.map(toast => {
        const s = STYLES[toast.type] || STYLES.info;
        const Icon = s.icon;
        return (
          <div key={toast.id} style={{
            background: s.bg,
            border: `1.5px solid ${s.border}`,
            borderRadius: 12,
            padding: '12px 14px',
            display: 'flex', alignItems: 'flex-start', gap: 10,
            boxShadow: '0 4px 20px rgba(0,0,0,0.4)',
            animation: 'slideUp 0.2s ease-out',
          }}>
            <Icon size={18} style={{ color: s.color, flexShrink: 0, marginTop: 1 }} />
            <span style={{ flex: 1, fontSize: 13, color: '#f1f5f9', lineHeight: 1.4 }}>
              {toast.message}
            </span>
            <button onClick={() => removeToast(toast.id)} style={{
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#64748b', padding: 2, flexShrink: 0,
            }}>
              <X size={15} />
            </button>
          </div>
        );
      })}
      <style>{`@keyframes slideUp { from { opacity:0; transform:translateY(12px); } to { opacity:1; transform:translateY(0); } }`}</style>
    </div>
  );
}
