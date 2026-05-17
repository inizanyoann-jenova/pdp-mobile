import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

export default function PWAInstallBanner() {
  const { theme } = useTheme();
  const [prompt, setPrompt]       = useState(null);
  const [visible, setVisible]     = useState(false);
  const [isIOS, setIsIOS]         = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    // Vérifie si déjà installé
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstalled(true);
      return;
    }

    // iOS / Safari
    const ios = /iphone|ipad|ipod/i.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(ios);

    // Mémorise si déjà fermé
    if (sessionStorage.getItem('pwa_banner_closed')) return;

    if (ios) {
      // Sur iOS, on montre le guide manuel
      setTimeout(() => setVisible(true), 3000);
    } else {
      // Sur Android/Chrome, on attend l'event beforeinstallprompt
      const handler = (e) => {
        e.preventDefault();
        setPrompt(e);
        setVisible(true);
      };
      window.addEventListener('beforeinstallprompt', handler);
      return () => window.removeEventListener('beforeinstallprompt', handler);
    }
  }, []);

  const handleInstall = async () => {
    if (!prompt) return;
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') setInstalled(true);
    close();
  };

  const close = () => {
    setVisible(false);
    sessionStorage.setItem('pwa_banner_closed', '1');
  };

  if (!visible || installed) return null;

  return (
    <div style={{
      position: 'fixed', bottom: 'calc(70px + env(safe-area-inset-bottom, 0px))',
      left: 12, right: 12, zIndex: 300,
      background: theme.bgCard,
      border: `1px solid rgba(79,99,231,0.35)`,
      borderRadius: 16,
      padding: '14px 16px',
      boxShadow: '0 8px 32px rgba(0,0,0,0.35)',
      display: 'flex', gap: 12, alignItems: 'flex-start',
    }}>
      <div style={{ width: 40, height: 40, borderRadius: 12, background: 'rgba(79,99,231,0.15)', border: '1px solid rgba(79,99,231,0.3)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
        <Smartphone size={20} style={{ color: '#4F63E7' }} />
      </div>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 14, fontWeight: 800, color: theme.text1, marginBottom: 3 }}>
          Installer l'application
        </div>
        {isIOS ? (
          <div style={{ fontSize: 12, color: theme.text3, lineHeight: 1.5 }}>
            Appuyez sur <strong style={{ color: '#4F63E7' }}>Partager</strong> puis <strong style={{ color: '#4F63E7' }}>Sur l'écran d'accueil</strong> pour accéder rapidement à l'app.
          </div>
        ) : (
          <>
            <div style={{ fontSize: 12, color: theme.text3, lineHeight: 1.5, marginBottom: 10 }}>
              Ajoutez l'app à votre écran d'accueil pour une utilisation hors-ligne et plus rapide.
            </div>
            <button onClick={handleInstall} style={{
              padding: '8px 16px', borderRadius: 10, background: '#4F63E7', border: 'none',
              color: '#fff', fontSize: 13, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 6,
            }}>
              <Download size={14} /> Installer
            </button>
          </>
        )}
      </div>
      <button onClick={close} style={{ background: 'none', border: 'none', cursor: 'pointer', color: theme.text4, padding: 2, flexShrink: 0 }}>
        <X size={18} />
      </button>
    </div>
  );
}
