
import React from 'react';
import { Megaphone, ExternalLink, Target, Layers, Music, AlertTriangle } from 'lucide-react';

const AdsManager: React.FC = () => {
  const platforms = [
    {
      name: 'Google Ads',
      icon: <Target className="text-blue-500" size={32} />,
      url: 'https://ads.google.com',
      desc: 'Search, Display, and YouTube campaigns.',
      color: 'border-blue-500/30 bg-blue-500/5',
    },
    {
      name: 'Meta Ads',
      icon: <Layers className="text-blue-400" size={32} />,
      url: 'https://adsmanager.facebook.com',
      desc: 'Facebook and Instagram social targeting.',
      color: 'border-blue-400/30 bg-blue-400/5',
    },
    {
      name: 'TikTok Ads',
      icon: <Music className="text-pink-500" size={32} />,
      url: 'https://ads.tiktok.com',
      desc: 'Viral video campaigns and influencer sparks.',
      color: 'border-pink-500/30 bg-pink-500/5',
    },
  ];

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in">
      {/* No Budget Notice */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-start gap-3">
        <AlertTriangle className="text-amber-400 shrink-0 mt-0.5" size={20} />
        <div>
          <p className="text-amber-200 font-bold text-sm">No Active Ad Campaigns</p>
          <p className="text-amber-300/70 text-xs mt-1">
            Budget: $0. Current strategy is organic traffic via Reddit and social posts.
            Ad campaigns will launch when revenue supports paid acquisition.
          </p>
        </div>
      </div>

      {/* Overview */}
      <div className="bg-surface p-6 rounded-xl border border-slate-700">
        <h2 className="text-2xl font-bold text-white flex items-center gap-2">
          <Megaphone className="text-primary" /> Paid Acquisition
        </h2>
        <p className="text-slate-400 text-sm mt-1">
          Quick-launch to ad platform consoles. No campaigns running — zero spend.
        </p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6">
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Total Budget</div>
            <div className="text-xl font-bold text-white font-mono">$0</div>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">ROAS</div>
            <div className="text-xl font-bold text-slate-600">—</div>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Total Clicks</div>
            <div className="text-xl font-bold text-slate-600">0</div>
          </div>
          <div className="bg-slate-900/50 p-4 rounded-lg border border-slate-800">
            <div className="text-[10px] text-slate-500 font-bold uppercase mb-1">Conversion Rate</div>
            <div className="text-xl font-bold text-slate-600">—</div>
          </div>
        </div>
      </div>

      {/* Platform Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {platforms.map(p => (
          <div key={p.name} className={`p-6 rounded-xl border ${p.color} flex flex-col justify-between`}>
            <div>
              <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-surface rounded-lg border border-slate-700 shadow-xl">
                  {p.icon}
                </div>
                <span className="px-2 py-1 bg-slate-900/50 rounded text-[10px] text-slate-500 uppercase tracking-wider border border-slate-800">
                  Not Active
                </span>
              </div>
              <h3 className="text-xl font-bold text-white mb-1">{p.name}</h3>
              <p className="text-sm text-slate-400 mb-6">{p.desc}</p>
            </div>
            <a
              href={p.url}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center justify-center gap-2 w-full py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-medium transition-colors border border-slate-700"
            >
              Open Console <ExternalLink size={16} />
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdsManager;
