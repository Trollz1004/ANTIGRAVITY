
import React, { useState } from 'react';
import { Search, Filter, RefreshCw, ExternalLink, ShieldCheck, Trash2, MapPin, Globe } from 'lucide-react';
import { ResearchItem } from '../types';
import { searchMaps } from '../services/geminiService';

interface ResearchHubProps {
  items: ResearchItem[];
  setItems: React.Dispatch<React.SetStateAction<ResearchItem[]>>;
}

const ResearchHub: React.FC<ResearchHubProps> = ({ items, setItems }) => {
  const [filterPersonal, setFilterPersonal] = useState(true);
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

  const filteredItems = items.filter(item => {
    if (filterPersonal && item.isPersonal) return false;
    if (searchTerm && !item.title.toLowerCase().includes(searchTerm.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="h-full flex flex-col gap-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-surface p-6 rounded-xl border border-slate-700">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">Target Intelligence Hub</h2>
          <p className="text-slate-400 text-sm">Gemini 2.5 Flash Grounding (Maps & Web Search).</p>
        </div>
        
        <div className="flex gap-3">
          <button 
            onClick={() => setFilterPersonal(!filterPersonal)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filterPersonal ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/50' : 'bg-slate-700 text-slate-400'}`}
          >
            <ShieldCheck size={16} />
            {filterPersonal ? 'Strict Filter ON' : 'Global Filter OFF'}
          </button>
          
          <button 
            onClick={handleRefresh}
            disabled={loading}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-indigo-600 text-white rounded-lg text-sm font-medium disabled:opacity-50"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Scan Trends
          </button>
        </div>
      </div>

      <div className="flex-1 bg-surface rounded-xl border border-slate-700 overflow-hidden flex flex-col">
        <div className="p-4 border-b border-slate-700 flex gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search researched URLs or use Maps Grounding..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border border-slate-700 rounded-lg pl-10 pr-4 py-2 text-white focus:outline-none focus:border-primary"
            />
          </div>
          <button 
            onClick={handleMapsSearch}
            className="flex items-center gap-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-sm font-medium"
          >
            <MapPin size={16} /> Maps Grounding
          </button>
        </div>

        {mapResults && (
          <div className="p-6 bg-emerald-500/5 border-b border-emerald-500/20 animate-fade-in">
             <div className="flex justify-between items-start mb-4">
                <h3 className="font-bold text-emerald-400 flex items-center gap-2"><Globe size={18} /> Grounded AI Analysis</h3>
                <button onClick={() => setMapResults(null)} className="text-slate-500 hover:text-white">Close</button>
             </div>
             <p className="text-slate-300 text-sm leading-relaxed mb-4">{mapResults.text}</p>
             <div className="flex flex-wrap gap-2">
                {mapResults.chunks.map((chunk: any, i: number) => (
                   chunk.maps?.uri && (
                     <a key={i} href={chunk.maps.uri} target="_blank" className="text-[10px] bg-slate-800 text-emerald-400 px-2 py-1 rounded border border-emerald-500/30 flex items-center gap-1">
                        <MapPin size={10} /> {chunk.maps.title || 'Location Result'}
                     </a>
                   )
                ))}
             </div>
          </div>
        )}

        <div className="flex-1 overflow-auto">
          <table className="w-full text-left">
            <thead className="bg-slate-900/50 text-slate-400 sticky top-0 backdrop-blur-sm">
              <tr>
                <th className="p-4 font-medium">Title / Source</th>
                <th className="p-4 font-medium">Type</th>
                <th className="p-4 font-medium">Engagement</th>
                <th className="p-4 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-700">
              {filteredItems.map(item => (
                <tr key={item.id} className="hover:bg-slate-700/30 transition-colors group">
                  <td className="p-4">
                    <div className="font-medium text-white">{item.title}</div>
                    <a href="#" className="text-xs text-indigo-400 hover:underline flex items-center gap-1">
                      {item.url} <ExternalLink size={10} />
                    </a>
                  </td>
                  <td className="p-4">
                    <span className="px-2 py-1 rounded text-xs font-medium bg-slate-800 text-slate-400 border border-slate-700">{item.source}</span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-1 bg-slate-700 rounded-full overflow-hidden">
                        <div className="h-full bg-secondary" style={{ width: `${item.engagementScore}%` }} />
                      </div>
                      <span className="text-xs text-slate-400">{item.engagementScore}%</span>
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button className="p-2 bg-slate-800 hover:bg-slate-700 rounded text-slate-300"><Trash2 size={16} /></button>
                    </div>
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

export default ResearchHub;
