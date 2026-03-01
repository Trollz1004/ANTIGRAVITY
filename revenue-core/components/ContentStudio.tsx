import React, { useState } from 'react';
import { PenTool, Send, Save, Sparkles, Calendar } from 'lucide-react';
import { ContentDraft } from '../types';
import { generateContent } from '../services/geminiService';

interface ContentStudioProps {
  drafts: ContentDraft[];
  setDrafts: React.Dispatch<React.SetStateAction<ContentDraft[]>>;
}

const ContentStudio: React.FC<ContentStudioProps> = ({ drafts, setDrafts }) => {
  const [activeDraftId, setActiveDraftId] = useState<string | null>(drafts[0]?.id || null);
  const [isGenerating, setIsGenerating] = useState(false);

  const activeDraft = drafts.find(d => d.id === activeDraftId) || {
    id: 'new', title: '', body: '', status: 'Draft', platform: 'Blog', tags: []
  } as ContentDraft;

  const handleUpdate = (field: keyof ContentDraft, value: any) => {
    if (activeDraftId === 'new') return; // Simplified for demo
    setDrafts(prev => prev.map(d => d.id === activeDraftId ? { ...d, [field]: value } : d));
  };

  const handleGenerateAI = async () => {
    if (!activeDraft.title) return;
    setIsGenerating(true);
    const content = await generateContent(`Write a ${activeDraft.platform} post about: ${activeDraft.title}`, activeDraft.platform === 'Blog' ? 'blog' : 'social');
    handleUpdate('body', content);
    setIsGenerating(false);
  };

  return (
    <div className="h-full flex gap-6">
      {/* Sidebar List */}
      <div className="w-64 flex flex-col bg-surface rounded-xl border border-slate-700 overflow-hidden">
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <h3 className="font-bold text-white">Drafts</h3>
          <button className="text-primary hover:text-indigo-400">
            <PenTool size={18} />
          </button>
        </div>
        <div className="flex-1 overflow-auto p-2 space-y-2">
          {drafts.map(draft => (
            <div 
              key={draft.id}
              onClick={() => setActiveDraftId(draft.id)}
              className={`p-3 rounded-lg cursor-pointer transition-colors ${activeDraftId === draft.id ? 'bg-primary/20 border border-primary/50' : 'hover:bg-slate-700/50 border border-transparent'}`}
            >
              <h4 className="text-sm font-medium text-white truncate">{draft.title}</h4>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-slate-400">{draft.platform}</span>
                <span className={`text-[10px] px-1.5 py-0.5 rounded ${draft.status === 'Scheduled' ? 'bg-emerald-500/20 text-emerald-400' : 'bg-slate-600 text-slate-300'}`}>
                  {draft.status}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Editor Area */}
      <div className="flex-1 flex flex-col bg-surface rounded-xl border border-slate-700 overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-slate-700 flex justify-between items-center">
          <input 
            type="text" 
            value={activeDraft.title}
            onChange={(e) => handleUpdate('title', e.target.value)}
            placeholder="Content Title..."
            className="bg-transparent text-xl font-bold text-white focus:outline-none placeholder-slate-600 w-1/2"
          />
          <div className="flex items-center gap-2">
            <select 
              value={activeDraft.platform}
              onChange={(e) => handleUpdate('platform', e.target.value)}
              className="bg-background border border-slate-600 text-slate-300 text-xs rounded px-2 py-1.5 focus:outline-none"
            >
              <option value="Blog">Blog Post</option>
              <option value="Social">Social Media</option>
              <option value="Email">Email Blast</option>
            </select>
            <button 
              onClick={handleGenerateAI}
              disabled={isGenerating}
              className="flex items-center gap-2 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white text-xs rounded font-medium transition-colors"
            >
              <Sparkles size={14} className={isGenerating ? 'animate-spin' : ''} />
              {isGenerating ? 'Thinking...' : 'AI Write'}
            </button>
            <button className="p-2 text-slate-400 hover:text-white">
              <Calendar size={18} />
            </button>
            <button className="p-2 text-slate-400 hover:text-emerald-400">
              <Save size={18} />
            </button>
          </div>
        </div>

        {/* Text Area */}
        <div className="flex-1 relative">
          <textarea 
            value={activeDraft.body}
            onChange={(e) => handleUpdate('body', e.target.value)}
            placeholder="Start typing or use AI generation..."
            className="w-full h-full bg-transparent p-6 text-slate-300 resize-none focus:outline-none font-mono leading-relaxed"
          />
        </div>

        {/* Footer */}
        <div className="p-3 bg-slate-900/50 border-t border-slate-700 flex justify-between items-center text-xs text-slate-500">
          <div>Words: {activeDraft.body.split(/\s+/).filter(w => w.length > 0).length}</div>
          <div className="flex items-center gap-2">
            <span>Automation Status:</span>
            <span className="text-emerald-400">Ready for Posting</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ContentStudio;