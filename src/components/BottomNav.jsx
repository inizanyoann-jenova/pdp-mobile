// src/components/BottomNav.jsx
import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ClipboardList, LayoutDashboard, Plus, Settings } from 'lucide-react';

const LEFT_TAB  = { path: '/',          icon: ClipboardList,  label: 'Plans'    };
const RIGHT_TAB = { path: '/dashboard', icon: LayoutDashboard, label: 'Tableau'  };
const SETTINGS_TAB = { path: '/settings', icon: Settings, label: 'Réglages' };

export default function BottomNav() {
  const navigate     = useNavigate();
  const { pathname } = useLocation();

  return (
    <nav style={{
      position: 'fixed', bottom: 0, left: 0, right: 0, zIndex: 200,
      background: '#0d1b2e',
      borderTop: '1px solid rgba(255,255,255,0.09)',
      display: 'flex', alignItems: 'flex-start',
      paddingTop: 6,
      paddingBottom: 'env(safe-area-inset-bottom, 0px)',
      height: 'calc(62px + env(safe-area-inset-bottom, 0px))',
    }}>
      <TabBtn {...LEFT_TAB}     active={pathname === LEFT_TAB.path}     onNav={navigate} />

      {/* Centre FAB */}
      <div style={{ flex: 1, display: 'flex', justifyContent: 'center', alignItems: 'flex-start', position: 'relative' }}>
        <button
          onClick={() => navigate('/nouveau')}
          style={{
            position: 'absolute', top: -22,
            width: 56, height: 56, borderRadius: 18,
            background: 'linear-gradient(135deg, #4F63E7, #3B4FCC)',
            border: '3px solid #0d1b2e',
            cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 24px rgba(79,99,231,0.55)',
            transition: 'transform 0.15s',
          }}
          onPointerDown={e => e.currentTarget.style.transform = 'scale(0.92)'}
          onPointerUp={e => e.currentTarget.style.transform = 'scale(1)'}
        >
          <Plus size={26} color="#fff" strokeWidth={2.5} />
        </button>
      </div>

      <TabBtn {...RIGHT_TAB}    active={pathname === RIGHT_TAB.path}    onNav={navigate} />
      <TabBtn {...SETTINGS_TAB} active={pathname === SETTINGS_TAB.path} onNav={navigate} />
    </nav>
  );
}

function TabBtn({ path, icon: Icon, label, active, onNav }) {
  return (
    <button
      onClick={() => onNav(path)}
      style={{
        flex: 1, height: 56, display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center', gap: 3,
        background: 'none', border: 'none', cursor: 'pointer',
        color: active ? '#4F63E7' : '#64748B',
        transition: 'color 0.15s',
      }}
    >
      <div style={{ position: 'relative' }}>
        <Icon size={22} strokeWidth={active ? 2.2 : 1.8} />
        {active && (
          <div style={{
            position: 'absolute', bottom: -5, left: '50%',
            transform: 'translateX(-50%)',
            width: 4, height: 4, borderRadius: '50%', background: '#4F63E7',
          }} />
        )}
      </div>
      <span style={{ fontSize: 10, fontWeight: active ? 700 : 500 }}>{label}</span>
    </button>
  );
}
