import { useCallback, useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Download, Pause, Play, Sparkles, Upload } from 'lucide-react';

/**
 * Photo → subtle animated avatar (client-side).
 * Uses canvas parallax + breathing motion — no deepfake identity swap.
 * Optional future hook: POST /api/v1/avatar/animate for server-side model.
 */
export function AnimatedAvatar() {
  const [src, setSrc] = useState<string | null>(null);
  const [playing, setPlaying] = useState(true);
  const [intensity, setIntensity] = useState(0.55);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const imgRef = useRef<HTMLImageElement | null>(null);
  const rafRef = useRef<number>(0);
  const t0 = useRef(performance.now());

  const onFile = (file: File | null) => {
    if (!file || !file.type.startsWith('image/')) return;
    const url = URL.createObjectURL(file);
    setSrc(prev => {
      if (prev) URL.revokeObjectURL(prev);
      return url;
    });
  };

  const draw = useCallback(
    (now: number) => {
      const canvas = canvasRef.current;
      const img = imgRef.current;
      if (!canvas || !img || !img.complete) {
        rafRef.current = requestAnimationFrame(draw);
        return;
      }
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const w = canvas.width;
      const h = canvas.height;
      const t = (now - t0.current) / 1000;
      const amp = intensity * 8;

      // Breathing scale + soft pan (portrait-friendly)
      const breath = 1 + Math.sin(t * 1.15) * 0.018 * intensity;
      const panX = Math.sin(t * 0.7) * amp;
      const panY = Math.cos(t * 0.55) * amp * 0.6;

      ctx.clearRect(0, 0, w, h);

      // Soft vignette background
      const g = ctx.createRadialGradient(w / 2, h / 2, w * 0.1, w / 2, h / 2, w * 0.7);
      g.addColorStop(0, '#1a1428');
      g.addColorStop(1, '#0a0a0f');
      ctx.fillStyle = g;
      ctx.fillRect(0, 0, w, h);

      const iw = img.naturalWidth || img.width;
      const ih = img.naturalHeight || img.height;
      const scale = Math.max(w / iw, h / ih) * breath * 1.08;
      const dw = iw * scale;
      const dh = ih * scale;
      const dx = (w - dw) / 2 + panX;
      const dy = (h - dh) / 2 + panY - 4;

      ctx.save();
      ctx.beginPath();
      // rounded portrait clip
      const r = Math.min(w, h) * 0.42;
      ctx.arc(w / 2, h / 2, r, 0, Math.PI * 2);
      ctx.closePath();
      ctx.clip();
      ctx.drawImage(img, dx, dy, dw, dh);

      // subtle color wash
      ctx.globalCompositeOperation = 'soft-light';
      ctx.fillStyle = `rgba(167, 139, 250, ${0.08 + intensity * 0.06})`;
      ctx.fillRect(0, 0, w, h);
      ctx.restore();

      // ring
      ctx.beginPath();
      ctx.arc(w / 2, h / 2, r + 3, 0, Math.PI * 2);
      ctx.strokeStyle = 'rgba(240, 171, 252, 0.55)';
      ctx.lineWidth = 3;
      ctx.stroke();

      if (playing) rafRef.current = requestAnimationFrame(draw);
    },
    [intensity, playing]
  );

  useEffect(() => {
    if (!src) return;
    const img = new Image();
    img.onload = () => {
      imgRef.current = img;
      t0.current = performance.now();
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(draw);
    };
    img.src = src;
    return () => cancelAnimationFrame(rafRef.current);
  }, [src, draw]);

  useEffect(() => {
    cancelAnimationFrame(rafRef.current);
    if (playing && src) rafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(rafRef.current);
  }, [playing, draw, src]);

  const downloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const a = document.createElement('a');
    a.download = 'youandinotai-avatar.png';
    a.href = canvas.toDataURL('image/png');
    a.click();
  };

  return (
    <div className="km-page mx-auto max-w-lg px-4 py-5">
      <div className="mb-2 text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[var(--km-accent)]">
        Animate
      </div>
      <h1 className="text-2xl font-semibold tracking-tight">Photo → living avatar</h1>
      <p className="mt-2 text-sm text-[var(--km-muted)]">
        Soft motion only — no face-swap identity games. Your verification badge stays on the real
        you.
      </p>

      <div className="km-card mt-6 flex flex-col items-center p-5">
        <canvas
          ref={canvasRef}
          width={360}
          height={360}
          className="h-[280px] w-[280px] rounded-full bg-[var(--km-surface-2)]"
        />

        {!src && (
          <label className="km-btn-gradient mt-6 cursor-pointer">
            <Upload size={18} /> Upload photo
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={e => onFile(e.target.files?.[0] || null)}
            />
          </label>
        )}

        {src && (
          <div className="mt-6 flex w-full flex-col gap-3">
            <label className="text-xs text-[var(--km-muted)]">
              Motion intensity: {Math.round(intensity * 100)}%
              <input
                type="range"
                min={0.15}
                max={1}
                step={0.05}
                value={intensity}
                onChange={e => setIntensity(Number(e.target.value))}
                className="mt-2 w-full accent-[#a78bfa]"
              />
            </label>
            <div className="flex flex-wrap gap-2">
              <button type="button" className="km-btn-ghost" onClick={() => setPlaying(p => !p)}>
                {playing ? <Pause size={16} /> : <Play size={16} />}
                {playing ? 'Pause' : 'Play'}
              </button>
              <button type="button" className="km-btn-ghost" onClick={downloadPng}>
                <Download size={16} /> Snapshot
              </button>
              <label className="km-btn-ghost cursor-pointer">
                <Upload size={16} /> Replace
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={e => onFile(e.target.files?.[0] || null)}
                />
              </label>
            </div>
          </div>
        )}
      </div>

      <div className="km-card mt-4 p-4 text-sm text-[var(--km-muted)]">
        <div className="mb-1 flex items-center gap-2 font-semibold text-[var(--km-text)]">
          <Sparkles size={16} className="text-[var(--km-accent)]" /> How it works
        </div>
        Client-side canvas breath + parallax. Server deep-animation endpoint can plug in later at{' '}
        <code className="text-xs">POST /api/v1/avatar/animate</code> without changing this UI.
      </div>

      <Link to="/app/create" className="km-btn-ghost mt-4 inline-flex no-underline">
        Back to Create
      </Link>
    </div>
  );
}

export default AnimatedAvatar;
