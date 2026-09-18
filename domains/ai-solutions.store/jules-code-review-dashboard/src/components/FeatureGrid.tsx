import React from 'react';
import {
  Columns2,
  Cpu,
  Code2,
  Sparkles,
  Compass,
  ShieldCheck,
  ArrowRight,
} from 'lucide-react';
import { STORE_FEATURES } from '../data/products';

interface FeatureGridProps {
  onSelectFeature?: (index: number) => void;
  onLaunchWorkstation: () => void;
}

const ICONS = [
  Columns2,
  Cpu,
  Code2,
  Sparkles,
  Compass,
  ShieldCheck,
];

export const FeatureGrid: React.FC<FeatureGridProps> = ({
  onLaunchWorkstation,
}) => {
  return (
    <section id="features" className="py-20 border-t border-[#1e293b]/80 bg-[#0a0f1a] relative">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 rounded-full border border-[#00d4ff]/30 bg-[#00d4ff]/10 px-3 py-1 text-xs font-semibold text-[#00d4ff] mb-4">
            Unified Desktop AI Architecture
          </div>
          <h2 className="text-3xl font-extrabold tracking-tight text-white sm:text-5xl">
            Everything your workflow needs. In one surface.
          </h2>
          <p className="mt-4 text-base sm:text-lg text-[#94a3b8]">
            Built from first principles to orchestrate modern frontier models side-by-side
            with zero lock-in, zero cloud key storage, and native development tooling.
          </p>
        </div>

        {/* 6 Grid Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {STORE_FEATURES.map((feature, idx) => {
            const Icon = ICONS[idx] || Columns2;
            return (
              <div
                key={feature.title}
                className="group relative rounded-2xl border border-[#2a3a52] bg-[#111827]/70 p-6 sm:p-7 backdrop-blur-sm hover:border-[#00d4ff]/50 hover:bg-[#1a2332]/80 transition-all duration-300 flex flex-col justify-between"
              >
                <div>
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-xl border border-[#2a3a52] bg-[#0a0f1a] mb-5 group-hover:scale-105 transition-transform"
                    style={{ borderColor: `${feature.accentColor}40` }}
                  >
                    <Icon
                      className="h-6 w-6"
                      style={{ color: feature.accentColor }}
                    />
                  </div>

                  <h3 className="text-xl font-bold text-white tracking-tight group-hover:text-[#00d4ff] transition-colors">
                    {feature.title}
                  </h3>

                  <div className="mt-1 text-xs font-semibold font-mono text-[#38bdf8]">
                    {feature.tagline}
                  </div>

                  <p className="mt-3 text-sm text-[#94a3b8] leading-relaxed">
                    {feature.description}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#1e293b] flex items-center justify-between text-xs font-medium text-[#64748b] group-hover:text-white transition-colors">
                  <span>Explore in Workstation</span>
                  <button
                    onClick={onLaunchWorkstation}
                    className="flex items-center gap-1 text-[#00d4ff] hover:underline"
                  >
                    <span>Test live</span>
                    <ArrowRight className="h-3 w-3" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
