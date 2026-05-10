import React, { useRef, useEffect, useCallback } from 'react';
import { RotateCcw, CheckCircle2 } from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

function parseValue(value) {
  if (!value) return { drawing: '', nom: '', date: '' };
  if (typeof value === 'string') return { drawing: value, nom: '', date: '' };
  return { drawing: value.drawing || '', nom: value.nom || '', date: value.date || '' };
}

function getCanvasPos(e, canvas) {
  const rect   = canvas.getBoundingClientRect();
  const scaleX = canvas.width  / rect.width;
  const scaleY = canvas.height / rect.height;
  const src    = e.touches ? e.touches[0] : e;
  return {
    x: (src.clientX - rect.left) * scaleX,
    y: (src.clientY - rect.top)  * scaleY,
  };
}

export default function SignaturePad({ label, value, onChange }) {
  const { theme } = useTheme();
  const canvasRef  = useRef(null);
  const drawing    = useRef(false);
  const lastPos    = useRef(null);
  const onChangRef = useRef(onChange);
  const parsedRef  = useRef(parseValue(value));

  // Keep refs in sync with props
  useEffect(() => { onChangRef.current = onChange; }, [onChange]);
  useEffect(() => { parsedRef.current = parseValue(value); }, [value]);

  const parsed = parseValue(value);
  const today  = new Date().toISOString().split('T')[0];

  // Load existing signature image into canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !parsed.drawing) return;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    const img = new window.Image();
    img.onload = () => ctx.drawImage(img, 0, 0);
    img.src = parsed.drawing;
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Attach non-passive touch listeners to prevent page scroll while signing
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    function onTouchStart(e) {
      e.preventDefault();
      drawing.current = true;
      lastPos.current = getCanvasPos(e, canvas);
    }

    function onTouchMove(e) {
      e.preventDefault();
      if (!drawing.current) return;
      const ctx = canvas.getContext('2d');
      const pos = getCanvasPos(e, canvas);
      ctx.beginPath();
      ctx.moveTo(lastPos.current.x, lastPos.current.y);
      ctx.lineTo(pos.x, pos.y);
      ctx.strokeStyle = '#1e293b';
      ctx.lineWidth   = 2.5;
      ctx.lineCap     = 'round';
      ctx.lineJoin    = 'round';
      ctx.stroke();
      lastPos.current = pos;
    }

    function onTouchEnd(e) {
      e.preventDefault();
      if (!drawing.current) return;
      drawing.current = false;
      const d    = canvas.toDataURL('image/png');
      const curr = parsedRef.current;
      const date = curr.date || new Date().toISOString().split('T')[0];
      onChangRef.current({ ...curr, drawing: d, date });
    }

    canvas.addEventListener('touchstart', onTouchStart, { passive: false });
    canvas.addEventListener('touchmove',  onTouchMove,  { passive: false });
    canvas.addEventListener('touchend',   onTouchEnd,   { passive: false });

    return () => {
      canvas.removeEventListener('touchstart', onTouchStart);
      canvas.removeEventListener('touchmove',  onTouchMove);
      canvas.removeEventListener('touchend',   onTouchEnd);
    };
  }, []);

  // Mouse handlers (desktop)
  function startDrawMouse(e) {
    drawing.current = true;
    lastPos.current = getCanvasPos(e, canvasRef.current);
  }

  function drawMouse(e) {
    if (!drawing.current) return;
    const canvas = canvasRef.current;
    const ctx    = canvas.getContext('2d');
    const pos    = getCanvasPos(e, canvas);
    ctx.beginPath();
    ctx.moveTo(lastPos.current.x, lastPos.current.y);
    ctx.lineTo(pos.x, pos.y);
    ctx.strokeStyle = '#1e293b';
    ctx.lineWidth   = 2.5;
    ctx.lineCap     = 'round';
    ctx.lineJoin    = 'round';
    ctx.stroke();
    lastPos.current = pos;
  }

  function endDrawMouse() {
    if (!drawing.current) return;
    drawing.current = false;
    const d    = canvasRef.current.toDataURL('image/png');
    const date = parsed.date || today;
    onChange({ ...parsed, drawing: d, date });
  }

  function clear() {
    const canvas = canvasRef.current;
    canvas.getContext('2d').clearRect(0, 0, canvas.width, canvas.height);
    onChange({ drawing: '', nom: parsed.nom, date: parsed.date });
  }

  const update = (field, val) => onChange({ ...parsed, [field]: val });
  const hasSig = !!parsed.drawing;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
          <span style={{ fontSize: 12, fontWeight: 700, color: theme.text3, textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
          {hasSig && parsed.nom && <CheckCircle2 size={14} style={{ color: '#10B981' }} />}
        </div>
        <button type="button" onClick={clear}
          style={{ fontSize: 12, color: theme.text4, background: theme.bgCard2, border: `1px solid ${theme.border}`, borderRadius: 7, padding: '4px 10px', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 4 }}>
          <RotateCcw size={11} /> Effacer
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: theme.text4, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Nom & Prénom</label>
          <input type="text" value={parsed.nom} onChange={e => update('nom', e.target.value)} placeholder="Jean Dupont"
            style={{ width: '100%', padding: '9px 12px', borderRadius: 10, background: theme.inputBg, border: `1.5px solid ${theme.border}`, color: theme.text1, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>
        <div>
          <label style={{ fontSize: 10, fontWeight: 700, color: theme.text4, textTransform: 'uppercase', letterSpacing: '0.05em', display: 'block', marginBottom: 4 }}>Date</label>
          <input type="date" value={parsed.date || today} onChange={e => update('date', e.target.value)}
            style={{ width: '100%', padding: '9px 12px', borderRadius: 10, background: theme.inputBg, border: `1.5px solid ${theme.border}`, color: theme.text1, fontSize: 13, outline: 'none', boxSizing: 'border-box' }} />
        </div>
      </div>

      <canvas
        ref={canvasRef}
        width={800} height={200}
        onMouseDown={startDrawMouse} onMouseMove={drawMouse} onMouseUp={endDrawMouse} onMouseLeave={endDrawMouse}
        style={{
          width: '100%', height: 120, borderRadius: 12, display: 'block',
          cursor: 'crosshair', touchAction: 'none',
          background: '#ffffff',
          border: `2px ${hasSig ? 'solid #10B981' : 'dashed rgba(255,255,255,0.2)'}`,
        }}
      />
      {!hasSig && (
        <p style={{ textAlign: 'center', fontSize: 12, color: '#475569', marginTop: -4 }}>
          ✍️ Signez ici avec votre doigt
        </p>
      )}
    </div>
  );
}
