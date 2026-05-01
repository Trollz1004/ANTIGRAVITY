import React from 'react';
import { Search, Link as LinkIcon, BookOpen } from 'lucide-react';

export function ResearchMode() {
  return (
    <div className="flex flex-col h-full bg-[#0a0f1a] text-[#e8f0ff] p-8 overflow-y-auto">
      <div className="max-w-4xl w-full mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3 text-[#00d4ff]">
            <BookOpen size={24} />
            <h2 className="text-2xl font-bold">Research Desk</h2>
          </div>
          <div className="flex items-center gap-2 px-3 py-1 rounded-full bg-[#1a2332] border border-[#2a3a52]">
            <div className="w-1.5 h-1.5 rounded-full bg-[#00d4ff] animate-pulse" />
            <span className="text-[10px] font-bold text-[#6b82a6] uppercase tracking-[0.2em]">Perplexity Deep Research Active</span>
          </div>
        </div>

        <div className="relative mb-8">
          <input 
            type="text" 
            placeholder="Search the web, fetch a URL, or ask a complex question..." 
            className="w-full bg-[#1a2332] border border-[#2a3a52] rounded-xl py-4 pl-14 pr-6 text-lg focus:border-[#00d4ff] outline-none shadow-lg transition-colors" 
          />
          <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-[#6b82a6]" size={24} />
        </div>
        
        <div className="grid grid-cols-3 gap-6">
          <div className="col-span-1 bg-[#111827] border border-[#2a3a52] rounded-xl p-5">
            <h3 className="text-xs font-bold text-[#6b82a6] uppercase tracking-wider mb-4 flex items-center gap-2">
              <LinkIcon size={14}/> Sources
            </h3>
            <div className="space-y-3">
              <div className="text-sm bg-[#1a2332] p-3 rounded-lg border border-[#2a3a52] hover:border-[#00d4ff] cursor-pointer transition-colors truncate">
                1. https://arxiv.org/abs/...
              </div>
              <div className="text-sm bg-[#1a2332] p-3 rounded-lg border border-[#2a3a52] hover:border-[#00d4ff] cursor-pointer transition-colors truncate">
                2. https://github.com/...
              </div>
            </div>
          </div>
          
          <div className="col-span-2 bg-[#111827] border border-[#2a3a52] rounded-xl p-6">
            <h3 className="text-xs font-bold text-[#6b82a6] uppercase tracking-wider mb-4">Synthesis</h3>
            <div className="prose prose-invert max-w-none">
              <p className="text-[#e8f0ff] leading-relaxed">
                Awaiting research query. The synthesis engine will automatically fetch sources, compare claims, and generate a cited summary here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
