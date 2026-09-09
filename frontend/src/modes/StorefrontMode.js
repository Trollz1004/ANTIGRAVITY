import React from 'react';
import { ExternalLink, ShoppingBag, ShieldCheck } from 'lucide-react';

const PRODUCT_LINKS = [
  { label: 'YouAndINotAI', href: 'https://youandinotai.com', detail: 'Dating and community product.' },
  { label: 'OnlineRecycle', href: 'https://onlinerecycle.net', detail: 'Electronics recycling, intake, pickup, and resale.' },
  { label: 'AI-Solutions Store', href: 'https://ai-solutions.store', detail: 'Digital products and automation offers.' },
];

/** Provider-neutral product directory. Checkout, account, and financial details remain on their approved product surfaces. */
export function StorefrontMode() {
  return (
    <div data-testid="storefront-mode" className="h-full overflow-y-auto bg-[#0a0f1a] text-[#e8f0ff]">
      <div className="max-w-6xl mx-auto px-8 py-10">
        <header className="flex items-start gap-4 flex-wrap mb-8"><ShoppingBag size={22} className="text-[#00e676]" /><div><div className="text-[10px] tracking-[0.3em] uppercase text-[#00e676] font-bold">Product Directory</div><h1 className="text-3xl font-bold tracking-tight">Product Surfaces</h1><p className="text-sm text-[#6b82a6] mt-1">Availability is confirmed by each product site. Checkout and account configuration are not displayed here.</p></div></header>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">{PRODUCT_LINKS.map((product) => <a key={product.label} href={product.href} target="_blank" rel="noopener noreferrer" className="bg-[#111827] border border-[#2a3a52] rounded-lg p-5 hover:border-[#00d4ff]/40 transition-colors"><div className="flex items-center justify-between gap-2"><h2 className="text-sm font-bold">{product.label}</h2><ExternalLink size={14} className="text-[#00d4ff]" /></div><p className="text-xs text-[#6b82a6] mt-3 leading-relaxed">{product.detail}</p></a>)}</div>
        <div className="mt-8 bg-[#1a2332] border border-[#2a3a52] rounded-md p-4 flex items-start gap-3 text-sm text-[#6b82a6]"><ShieldCheck size={16} className="text-[#00d4ff] shrink-0 mt-0.5" />Product payment configuration and private business records are managed through approved private controls, not this public directory.</div>
      </div>
    </div>
  );
}
