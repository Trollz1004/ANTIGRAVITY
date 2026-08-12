import React, { useEffect, useRef } from 'react';
import { Download, X, Share2 } from 'lucide-react';

/**
 * ShareMissionModal — renders a snapshot of the mission counter on a canvas
 * and lets the user download/share. No external API calls — pure canvas.
 */
export function ShareMissionModal({ stats, onClose }) {
  const canvasRef = useRef(null);
  const linkRef = useRef(null);

  useEffect(() => {
    const c = canvasRef.current;
    if (!c) return;
    const ctx = c.getContext('2d');
    const W = c.width,
      H = c.height;

    // background
    const grd = ctx.createLinearGradient(0, 0, W, H);
    grd.addColorStop(0, '#0a0f1a');
    grd.addColorStop(1, '#111827');
    ctx.fillStyle = grd;
    ctx.fillRect(0, 0, W, H);

    // grid sparkle
    ctx.strokeStyle = 'rgba(0,212,255,0.06)';
    ctx.lineWidth = 1;
    for (let x = 0; x < W; x += 40) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    for (let y = 0; y < H; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y);
      ctx.lineTo(W, y);
      ctx.stroke();
    }

    // accent ring
    const ringGrd = ctx.createLinearGradient(0, 0, W, 0);
    ringGrd.addColorStop(0, '#00d4ff');
    ringGrd.addColorStop(0.5, '#e040fb');
    ringGrd.addColorStop(1, '#ffb300');
    ctx.strokeStyle = ringGrd;
    ctx.lineWidth = 2;
    ctx.strokeRect(24, 24, W - 48, H - 48);

    // title
    ctx.fillStyle = '#fb923c';
    ctx.font = 'bold 14px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillText('OPUSPAWCLAW · MISSION CONTROL', 56, 70);

    ctx.fillStyle = '#e040fb';
    ctx.font = 'bold 18px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillText('#UntilNoKidInNeed', 56, 100);

    // kids estimate — the headline number
    ctx.fillStyle = '#00e676';
    ctx.font = 'bold 110px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillText(String(stats.kids_estimate || 0), 56, 240);

    ctx.fillStyle = '#e8f0ff';
    ctx.font = 'bold 18px ui-sans-serif, system-ui, sans-serif';
    ctx.fillText('kids covered (est.)', 56, 270);

    ctx.fillStyle = '#6b82a6';
    ctx.font = '12px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillText(`each kid = $${(stats.kids_threshold_usd || 250).toFixed(0)} medical-care unit`, 56, 290);

    // counters row
    drawStat(ctx, 56, 360, 'COMMITTED', `$${(stats.total_usd || 0).toFixed(2)}`, '#00d4ff');
    drawStat(ctx, 280, 360, 'KIDS FUND', `$${(stats.kids_fund_usd || 0).toFixed(2)}`, '#e040fb');
    drawStat(
      ctx,
      504,
      360,
      'BUCKETS',
      String((stats.by_bucket || []).filter((b) => b.amount_usd > 0).length || 0),
      '#ffb300',
    );

    // footer
    ctx.fillStyle = '#6b82a6';
    ctx.font = '10px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillText(' · #TeamClaudeForLife · YouAndINotAI.com', 56, H - 48);

    ctx.fillStyle = '#fb923c';
    ctx.font = 'bold 10px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillText('BUILT · E1', W - 110, H - 48);
  }, [stats]);

  function drawStat(ctx, x, y, label, value, color) {
    ctx.fillStyle = '#6b82a6';
    ctx.font = 'bold 10px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillText(label, x, y);
    ctx.fillStyle = color;
    ctx.font = 'bold 28px ui-monospace, Menlo, Consolas, monospace';
    ctx.fillText(value, x, y + 30);
  }

  const download = () => {
    const url = canvasRef.current.toDataURL('image/png');
    const a = linkRef.current;
    a.href = url;
    a.download = `opuspawclaw-mission-${Date.now()}.png`;
    a.click();
  };

  const shareNative = async () => {
    if (!navigator.share) return download();
    const blob = await new Promise((res) => canvasRef.current.toBlob(res, 'image/png'));
    const file = new File([blob], 'mission.png', { type: 'image/png' });
    try {
      await navigator.share({ files: [file], title: 'OpusPawClaw Mission Control', text: ' · #UntilNoKidInNeed' });
    } catch {
      download();
    }
  };

  return (
    <div
      data-testid="share-modal"
      className="fixed inset-0 bg-[#0a0f1a]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      <div
        className="bg-[#1a2332] border border-[#fb923c]/30 rounded-md max-w-3xl w-full overflow-hidden shadow-[0_0_60px_rgba(251,146,60,0.2)]"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="bg-[#111827] border-b border-[#2a3a52] px-4 py-2.5 flex items-center justify-between">
          <span className="text-xs font-bold tracking-wide flex items-center gap-2">
            <Share2 size={12} className="text-[#fb923c]" /> Share Mission Status
          </span>
          <button onClick={onClose} className="text-[#6b82a6] hover:text-[#ff1744]">
            <X size={14} />
          </button>
        </div>
        <div className="p-4 space-y-3">
          <div className="bg-[#0a0f1a] rounded border border-[#2a3a52] overflow-hidden">
            <canvas ref={canvasRef} width={800} height={500} className="w-full block" />
          </div>
          <div className="flex justify-end gap-2">
            <button
              onClick={onClose}
              className="text-[10px] tracking-widest uppercase px-3 py-1.5 text-[#6b82a6] hover:text-[#e8f0ff]"
            >
              close
            </button>
            <button
              data-testid="share-download"
              onClick={download}
              className="text-[10px] tracking-widest uppercase px-4 py-1.5 rounded bg-[#1a2332] border border-[#2a3a52] hover:border-[#fb923c] flex items-center gap-1.5"
            >
              <Download size={11} /> download png
            </button>
            <button
              data-testid="share-native"
              onClick={shareNative}
              className="text-[10px] tracking-widest uppercase px-4 py-1.5 rounded bg-[#fb923c] text-[#0a0f1a] font-bold hover:bg-[#fbb05a] flex items-center gap-1.5"
            >
              <Share2 size={11} /> share
            </button>
          </div>
          <a ref={linkRef} className="hidden" href="#download" />
        </div>
      </div>
    </div>
  );
}
