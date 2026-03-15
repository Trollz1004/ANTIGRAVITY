import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sliders, Eye, EyeOff, MapPin } from 'lucide-react';

const PREFERENCES = [
  'Women', 'Men', 'Non-binary', 'Genderqueer', 'Genderfluid',
  'Agender', 'Two-Spirit', 'Transgender', 'Intersex', 'Everyone',
];

const SEXUALITIES = [
  'Straight', 'Gay', 'Lesbian', 'Bisexual', 'Pansexual',
  'Queer', 'Asexual', 'Demisexual', 'Fluid', 'Questioning',
];

interface DiscoverSettingsProps {
  open: boolean;
  onClose: () => void;
}

export function DiscoverSettings({ open, onClose }: DiscoverSettingsProps) {
  const [distance, setDistance] = useState(50);
  const [ghostMode, setGhostMode] = useState(false);
  const [selectedPrefs, setSelectedPrefs] = useState<string[]>(['Everyone']);
  const [selectedSexuality, setSelectedSexuality] = useState<string[]>([]);

  const toggleChip = (value: string, list: string[], setter: (v: string[]) => void) => {
    setter(list.includes(value) ? list.filter(v => v !== value) : [...list, value]);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Panel */}
          <motion.div
            className="fixed right-0 top-0 bottom-0 z-50 w-full max-w-md overflow-y-auto"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 28, stiffness: 300 }}
            style={{
              background: 'rgba(10, 10, 20, 0.85)',
              backdropFilter: 'blur(24px)',
              borderLeft: '1px solid rgba(255,255,255,0.08)',
              boxShadow: '-20px 0 60px rgba(0,0,0,0.5)',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-white/5">
              <div className="flex items-center gap-3">
                <Sliders size={18} className="text-pink-400" />
                <h2 className="text-lg font-black text-white tracking-tight">Discovery Settings</h2>
              </div>
              <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-xl transition-colors">
                <X size={18} className="text-gray-400" />
              </button>
            </div>

            <div className="p-6 space-y-8">
              {/* ─── Distance ─── */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin size={14} className="text-pink-400" />
                    <span className="text-sm font-bold text-white">Max Distance</span>
                  </div>
                  <span className="text-sm font-black text-pink-400">{distance} mi</span>
                </div>
                <input
                  type="range"
                  min={1}
                  max={200}
                  value={distance}
                  onChange={(e) => setDistance(Number(e.target.value))}
                  className="w-full h-1.5 rounded-full appearance-none cursor-pointer"
                  style={{
                    background: `linear-gradient(to right, rgb(236,72,153) 0%, rgb(168,85,247) ${(distance / 200) * 100}%, rgba(255,255,255,0.08) ${(distance / 200) * 100}%)`,
                  }}
                />
                <div className="flex justify-between text-[10px] text-gray-600 mt-1.5 font-medium">
                  <span>1 mi</span>
                  <span>200 mi</span>
                </div>
              </div>

              {/* ─── Show Me (Gender Preferences) ─── */}
              <div>
                <span className="text-sm font-bold text-white block mb-3">Show Me</span>
                <div className="flex flex-wrap gap-2">
                  {PREFERENCES.map((pref) => {
                    const active = selectedPrefs.includes(pref);
                    return (
                      <button
                        key={pref}
                        onClick={() => toggleChip(pref, selectedPrefs, setSelectedPrefs)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                          active
                            ? 'text-white shadow-[0_0_12px_rgba(236,72,153,0.3)]'
                            : 'text-gray-400 hover:text-white border border-white/10 hover:border-white/20'
                        }`}
                        style={active ? {
                          background: 'linear-gradient(135deg, rgba(236,72,153,0.6), rgba(168,85,247,0.6))',
                          border: '1px solid rgba(236,72,153,0.4)',
                        } : {
                          background: 'rgba(255,255,255,0.03)',
                        }}
                      >
                        {pref}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ─── Sexuality ─── */}
              <div>
                <span className="text-sm font-bold text-white block mb-1">My Sexuality</span>
                <span className="text-[11px] text-gray-500 block mb-3">Select all that apply. Visible only to you.</span>
                <div className="flex flex-wrap gap-2">
                  {SEXUALITIES.map((s) => {
                    const active = selectedSexuality.includes(s);
                    return (
                      <button
                        key={s}
                        onClick={() => toggleChip(s, selectedSexuality, setSelectedSexuality)}
                        className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all duration-200 ${
                          active
                            ? 'text-white shadow-[0_0_12px_rgba(139,92,246,0.3)]'
                            : 'text-gray-400 hover:text-white border border-white/10 hover:border-white/20'
                        }`}
                        style={active ? {
                          background: 'linear-gradient(135deg, rgba(139,92,246,0.6), rgba(79,70,229,0.6))',
                          border: '1px solid rgba(139,92,246,0.4)',
                        } : {
                          background: 'rgba(255,255,255,0.03)',
                        }}
                      >
                        {s}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* ─── Ghost Mode ─── */}
              <div
                className="flex items-center justify-between p-4 rounded-xl"
                style={{
                  background: ghostMode ? 'rgba(139,92,246,0.08)' : 'rgba(255,255,255,0.03)',
                  border: `1px solid ${ghostMode ? 'rgba(139,92,246,0.2)' : 'rgba(255,255,255,0.06)'}`,
                }}
              >
                <div className="flex items-center gap-3">
                  {ghostMode ? <EyeOff size={18} className="text-purple-400" /> : <Eye size={18} className="text-gray-400" />}
                  <div>
                    <span className="text-sm font-bold text-white block">Incognito Mode</span>
                    <span className="text-[11px] text-gray-500">Only visible to people you like</span>
                  </div>
                </div>
                <button
                  onClick={() => setGhostMode(!ghostMode)}
                  className={`w-12 h-7 rounded-full transition-all duration-300 relative ${
                    ghostMode ? 'bg-purple-600' : 'bg-white/10'
                  }`}
                >
                  <div
                    className={`w-5 h-5 bg-white rounded-full absolute top-1 transition-all duration-300 shadow-md ${
                      ghostMode ? 'left-6' : 'left-1'
                    }`}
                  />
                </button>
              </div>

              {/* Save */}
              <button
                onClick={onClose}
                className="w-full py-3.5 rounded-xl font-bold text-white text-sm transition-all hover:scale-[1.02] active:scale-[0.98]"
                style={{
                  background: 'linear-gradient(135deg, rgb(236,72,153), rgb(168,85,247))',
                  boxShadow: '0 0 20px rgba(236,72,153,0.3)',
                }}
              >
                Save Preferences
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
