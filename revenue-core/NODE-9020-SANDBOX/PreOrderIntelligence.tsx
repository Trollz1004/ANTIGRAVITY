
import React, { useState } from 'react';
import { Search, ShieldCheck, MapPin, RefreshCw, ExternalLink, TrendingUp, Globe } from 'lucide-react';
import { ResearchItem } from '../types';
import { searchMaps } from '../services/geminiService';

interface ResearchHubProps {
  items: ResearchItem[];
  setItems: React.Dispatch<React.SetStateAction<ResearchItem[]>>;
}

const PreOrderIntelligence: React.FC<ResearchHubProps> = ({ items, setItems }) => {
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [mapResults, setMapResults] = useState<any>(null);

  const handleRefresh = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 1500);
  };

  const handleMapsSearch = async () => {
    if (!searchTerm) return;
    setLoading(true);
    try {
      const results = await searchMaps(searchTerm);
      setMapResults(results);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 p-6 animate-fade-in">
      <div className="glass p-8 rounded-[2rem] flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <h2 className="text-3xl font-black text-white tracking-tighter flex items-center gap-3">
            <Globe className="text-primary" size={32} /> INTEL HUB
          </h2>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Grounded ROI Analysis Protocol</p>
        </div>
        
        <div className="flex gap-3">
          <button className="flex items-center gap-2 px-6 py-3 bg-white/5 border border-white/10 hover:border-primary/50 text-white rounded-2xl text-xs font-black transition-all">
            <ShieldCheck size={16} /> CORPORATE SHIELD
          </button>
          <button 
            onClick={handleRefresh}
            className="flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl text-xs font-black shadow-lg shadow-primary/20 hover:bg-red-600 transition-all"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} /> SYNC REVENUE
          </button>
        </div>
      </div>

      <div className="flex-1 glass rounded-[2rem] overflow-hidden flex flex-col shadow-2xl">
        <div className="p-6 border-b border-slate-800 flex gap-4 bg-slate-950/20">
          <div className="relative flex-1">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-600" size={18} />
            <input 
              type="text" 
              placeholder="Competitor analysis / Target demographics..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-black/40 border border-slate-800 rounded-xl pl-12 pr-4 py-3 text-white focus:outline-none focus:border-primary transition-all text-sm font-medium"
            />
          </div>
          <button 
            onClick={handleMapsSearch}
            className="flex items-center gap-2 px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-black uppercase"
          >
            <MapPin size={16} /> Geo-Map Grounding
          </button>
        </div>

        {mapResults && (
          <div className="p-8 bg-primary/5 border-b border-primary/10 animate-fade-in">
             <h3 className="font-black text-primary text-sm uppercase tracking-widest mb-4 flex items-center gap-2">
               <TrendingUp size={18} /> CEO Insight // Revenue Vector
             </h3>
             <p className="text-slate-300 text-sm leading-relaxed mb-6 font-medium italic">
               {mapResults.text}
             </p>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left">
            <thead className="bg-black/50 text-slate-500 sticky top-0 backdrop-blur-md">
              <tr>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest">Growth Vertical</th>
                <th className="px-8 py-5 text-[10px] font-black uppercase tracking-widest text-right">Execute</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {items.map(item => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors group">
                  <td className="px-8 py-6">
                    <div className="font-black text-white tracking-tight">{item.title}</div>
                    <div className="text-[10px] text-slate-500 mono mt-1">{item.url}</div>
                  </td>
                  <td className="px-8 py-6 text-right">
                    <button className="px-4 py-2 bg-slate-800 hover:bg-primary text-white rounded-lg text-[9px] font-black uppercase transition-all">
                      Extract
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default PreOrderIntelligence;
