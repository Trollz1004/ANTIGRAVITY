import React, { useState } from 'react';
import {
  Layers,
  Sparkles,
  CreditCard,
  Shield,
  GraduationCap,
  CheckCircle2,
  ExternalLink,
  Laptop,
} from 'lucide-react';
import { PRODUCTS_CATALOG } from '../data/products';
import { ProductItem } from '../types';

interface ProductCatalogProps {
  onOpenCheckout: (tier: 'pro' | 'enterprise') => void;
  onLaunchWorkstation: () => void;
}

export const ProductCatalog: React.FC<ProductCatalogProps> = ({
  onOpenCheckout,
  onLaunchWorkstation,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const filteredProducts =
    selectedCategory === 'all'
      ? PRODUCTS_CATALOG
      : PRODUCTS_CATALOG.filter((p) => p.category === selectedCategory);

  return (
    <section className="py-16 bg-[#0a0f1a] min-h-[calc(100vh-4rem)]">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 rounded-full border border-[#00d4ff]/30 bg-[#00d4ff]/10 px-3 py-1 text-xs font-semibold text-[#00d4ff] mb-3">
            <Layers className="h-3.5 w-3.5" />
            AI Solutions Store Catalog
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Flagship Tools & AI Engines
          </h1>
          <p className="mt-3 text-base sm:text-lg text-[#94a3b8]">
            Explore our line of desktop AI workstations, enterprise proxies, security
            analyzers, and safe educational platforms.
          </p>
        </div>

        {/* Category Filter Pills */}
        <div className="mt-8 flex flex-wrap gap-2 border-b border-[#1e293b] pb-4">
          {[
            { id: 'all', label: 'All Products' },
            { id: 'workstation', label: 'Opus Desktop Workstation' },
            { id: 'security', label: 'Security & Jules Sentinel' },
            { id: 'education', label: 'PawClaw (Kids / Education)' },
          ].map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-4 py-1.5 rounded-lg text-xs sm:text-sm font-medium transition-all ${
                selectedCategory === cat.id
                  ? 'bg-[#00d4ff] text-slate-950 font-bold shadow-md shadow-[#00d4ff]/20'
                  : 'bg-[#111827] text-[#8ba3c7] hover:bg-[#1a2332] hover:text-white border border-[#2a3a52]'
              }`}
            >
              {cat.label}
            </button>
          ))}
        </div>

        {/* Products Grid */}
        <div className="mt-10 grid grid-cols-1 md:grid-cols-2 gap-8">
          {filteredProducts.map((product) => {
            const isFeatured = product.id === 'opus-pro';
            return (
              <div
                key={product.id}
                className={`relative flex flex-col justify-between rounded-2xl border p-7 sm:p-8 transition-all ${
                  isFeatured
                    ? 'border-[#00d4ff] bg-gradient-to-b from-[#101b30] to-[#0c1424] shadow-xl shadow-[#00d4ff]/10'
                    : 'border-[#2a3a52] bg-[#111827]/70 hover:border-[#38bdf8]/40'
                }`}
              >
                {product.badge && (
                  <div
                    className={`inline-block self-start rounded-full px-3 py-0.5 text-xs font-semibold mb-4 ${
                      isFeatured
                        ? 'bg-[#00d4ff]/20 text-[#00d4ff] border border-[#00d4ff]/40'
                        : product.category === 'education'
                        ? 'bg-[#00e676]/20 text-[#00e676] border border-[#00e676]/40'
                        : 'bg-[#e040fb]/20 text-[#e040fb] border border-[#e040fb]/40'
                    }`}
                  >
                    {product.badge}
                  </div>
                )}

                <div>
                  <div className="flex items-baseline justify-between">
                    <h2 className="text-2xl font-bold text-white tracking-tight">
                      {product.name}
                    </h2>
                    <div className="text-right">
                      <span className="text-2xl font-extrabold text-white">
                        {product.price}
                      </span>
                      {product.period && (
                        <span className="text-xs text-[#64748b] ml-1">
                          {product.period}
                        </span>
                      )}
                    </div>
                  </div>

                  <p className="mt-1 text-xs font-mono text-[#38bdf8]">
                    {product.tagline}
                  </p>

                  <div className="mt-3 text-xs text-[#ffb300] font-medium">
                    Target: {product.audience}
                  </div>

                  <p className="mt-4 text-sm text-[#cbd5e1] leading-relaxed">
                    {product.description}
                  </p>

                  {/* Features */}
                  <div className="mt-6 space-y-2.5">
                    <div className="text-xs font-semibold uppercase tracking-wider text-[#64748b]">
                      Core Capabilities
                    </div>
                    {product.features.map((feat) => (
                      <div key={feat} className="flex items-start gap-2.5">
                        <CheckCircle2 className="h-4 w-4 shrink-0 text-[#00d4ff] mt-0.5" />
                        <span className="text-xs sm:text-sm text-[#e2e8f0]">
                          {feat}
                        </span>
                      </div>
                    ))}
                  </div>

                  {/* Specs Table */}
                  <div className="mt-6 rounded-xl border border-[#1e293b] bg-[#090e1a] p-3 text-xs space-y-1.5 font-mono">
                    {Object.entries(product.specs).map(([key, val]) => (
                      <div key={key} className="flex justify-between text-[#94a3b8]">
                        <span className="text-[#64748b]">{key}:</span>
                        <span className="text-right text-[#cbd5e1] ml-2">{val}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Card CTA Actions */}
                <div className="mt-8 pt-5 border-t border-[#1e293b] flex items-center gap-3">
                  {product.id === 'opus-pro' ? (
                    <>
                      <button
                        onClick={() => onOpenCheckout('pro')}
                        className="flex-1 flex items-center justify-center gap-2 rounded-xl bg-[#00d4ff] py-2.5 text-sm font-bold text-slate-950 hover:bg-[#00d4ff]/90 transition-all cursor-pointer"
                      >
                        <CreditCard className="h-4 w-4" />
                        <span>Go Pro ($24/mo)</span>
                      </button>
                      <button
                        onClick={onLaunchWorkstation}
                        className="px-4 py-2.5 rounded-xl border border-[#2a3a52] bg-[#1a2332] text-xs font-semibold text-white hover:border-[#00d4ff] transition-all cursor-pointer flex items-center gap-1.5"
                      >
                        <Laptop className="h-3.5 w-3.5 text-[#00d4ff]" />
                        <span>Live Demo</span>
                      </button>
                    </>
                  ) : product.id === 'opus-enterprise' ? (
                    <button
                      onClick={() => onOpenCheckout('enterprise')}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#ffb300]/40 bg-[#ffb300]/10 py-2.5 text-sm font-semibold text-[#ffb300] hover:bg-[#ffb300]/20 transition-all cursor-pointer"
                    >
                      <Shield className="h-4 w-4" />
                      <span>Configure Enterprise Seats ($79/mo)</span>
                    </button>
                  ) : product.id === 'pawclaw-kids' ? (
                    <button
                      onClick={onLaunchWorkstation}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#00e676]/40 bg-[#00e676]/10 py-2.5 text-sm font-semibold text-[#00e676] hover:bg-[#00e676]/20 transition-all cursor-pointer"
                    >
                      <GraduationCap className="h-4 w-4" />
                      <span>Launch Safe Kids Sandbox</span>
                    </button>
                  ) : (
                    <button
                      onClick={onLaunchWorkstation}
                      className="w-full flex items-center justify-center gap-2 rounded-xl border border-[#e040fb]/40 bg-[#e040fb]/10 py-2.5 text-sm font-semibold text-[#e040fb] hover:bg-[#e040fb]/20 transition-all cursor-pointer"
                    >
                      <Sparkles className="h-4 w-4" />
                      <span>Test Jules Code Sentinel in Workstation</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
