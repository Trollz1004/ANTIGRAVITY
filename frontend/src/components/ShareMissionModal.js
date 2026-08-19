import React, { useEffect, useRef } from 'react';
import { Download, X, Share2 } from 'lucide-react';

/** Produces a public-safe workspace image without financial, account, or allocation data. */
export function ShareMissionModal({ onClose }) {
  const canvasRef = useRef(null);
  const linkRef = useRef(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const context = canvas.getContext('2d');
    const width = canvas.width;
    const height = canvas.height;
    const gradient = context.createLinearGradient(0, 0, width, height);
    gradient.addColorStop(0, '#0a0f1a');
    gradient.addColorStop(1, '#111827');
    context.fillStyle = gradient;
    context.fillRect(0, 0, width, height);
    context.strokeStyle = 'rgba(0,212,255,0.06)';
    context.lineWidth = 1;
    for (let x = 0; x < width; x += 40) { context.beginPath(); context.moveTo(x, 0); context.lineTo(x, height); context.stroke(); }
    for (let y = 0; y < height; y += 40) { context.beginPath(); context.moveTo(0, y); context.lineTo(width, y); context.stroke(); }
    context.strokeStyle = '#00d4ff'; context.lineWidth = 2; context.strokeRect(24, 24, width - 48, height - 48);
    context.fillStyle = '#fb923c'; context.font = 'bold 14px ui-monospace, Menlo, Consolas, monospace'; context.fillText('OPUSPAWCLAW · WORKSPACE SNAPSHOT', 56, 70);
    context.fillStyle = '#e040fb'; context.font = 'bold 24px ui-monospace, Menlo, Consolas, monospace'; context.fillText('PRODUCT-FIRST OPERATIONS', 56, 120);
    context.fillStyle = '#e8f0ff'; context.font = 'bold 38px ui-sans-serif, system-ui, sans-serif'; context.fillText('Verified workspace status', 56, 210);
    context.fillStyle = '#6b82a6'; context.font = '16px ui-sans-serif, system-ui, sans-serif'; context.fillText('Public snapshots exclude private data and financial details.', 56, 250);
    context.fillStyle = '#6b82a6'; context.font = '10px ui-monospace, Menlo, Consolas, monospace'; context.fillText('#TeamClaudeForLife · YouAndINotAI.com', 56, height - 48);
  }, []);
  const download = () => { const url = canvasRef.current.toDataURL('image/png'); linkRef.current.href = url; linkRef.current.download = `opuspawclaw-workspace-${Date.now()}.png`; linkRef.current.click(); };
  const shareNative = async () => { if (!navigator.share) return download(); const blob = await new Promise((resolve) => canvasRef.current.toBlob(resolve, 'image/png')); const file = new File([blob], 'workspace.png', { type: 'image/png' }); try { await navigator.share({ files: [file], title: 'OpusPawClaw Workspace', text: 'Product-first operations' }); } catch { download(); } };
  return <div data-testid="share-modal" className="fixed inset-0 bg-[#0a0f1a]/90 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}><div className="bg-[#1a2332] border border-[#fb923c]/30 rounded-md max-w-3xl w-full overflow-hidden shadow-[0_0_60px_rgba(251,146,60,0.2)]" onClick={(event) => event.stopPropagation()}><div className="bg-[#111827] border-b border-[#2a3a52] px-4 py-2.5 flex items-center justify-between"><span className="text-xs font-bold tracking-wide flex items-center gap-2"><Share2 size={12} className="text-[#fb923c]" /> Share Workspace Snapshot</span><button onClick={onClose} className="text-[#6b82a6] hover:text-[#ff1744]"><X size={14} /></button></div><div className="p-4 space-y-3"><div className="bg-[#0a0f1a] rounded border border-[#2a3a52] overflow-hidden"><canvas ref={canvasRef} width={800} height={500} className="w-full block" /></div><div className="flex justify-end gap-2"><button onClick={onClose} className="text-[10px] tracking-widest uppercase px-3 py-1.5 text-[#6b82a6] hover:text-[#e8f0ff]">close</button><button data-testid="share-download" onClick={download} className="text-[10px] tracking-widest uppercase px-4 py-1.5 rounded bg-[#1a2332] border border-[#2a3a52] hover:border-[#fb923c] flex items-center gap-1.5"><Download size={11} /> download png</button><button data-testid="share-native" onClick={shareNative} className="text-[10px] tracking-widest uppercase px-4 py-1.5 rounded bg-[#fb923c] text-[#0a0f1a] font-bold hover:bg-[#fbb05a] flex items-center gap-1.5"><Share2 size={11} /> share</button></div><a ref={linkRef} className="hidden" href="#download" /></div></div></div>;
}
