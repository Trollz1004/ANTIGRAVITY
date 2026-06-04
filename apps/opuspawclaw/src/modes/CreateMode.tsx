import React from 'react';
import { Image as ImageIcon, FileText } from 'lucide-react';

export function CreateMode() {
  return (
    <div className="flex h-full bg-[#0a0f1a] text-[#e8f0ff]">
      {/* Image Generation Panel */}
      <div className="flex-1 p-6 flex flex-col border-r border-[#2a3a52]">
        <div className="flex items-center gap-2 mb-6 text-[#e040fb]">
          <ImageIcon size={20} />
          <h3 className="font-bold">Media Studio</h3>
        </div>
        
        <div className="bg-[#1a2332] p-4 rounded-xl border border-[#2a3a52] mb-6">
          <textarea 
            placeholder="Describe the image you want to generate..." 
            className="w-full bg-[#0a0f1a] border border-[#2a3a52] rounded-lg p-3 mb-4 text-sm focus:border-[#e040fb] outline-none resize-none h-24" 
          />
          <div className="flex justify-between items-center">
            <select className="bg-[#0a0f1a] border border-[#2a3a52] rounded px-3 py-1.5 text-sm text-[#6b82a6] outline-none">
              <option>Stability AI (SDXL)</option>
              <option>DALL-E 3</option>
              <option>Midjourney (Proxy)</option>
            </select>
            <button className="px-6 py-2 bg-[#e040fb] hover:bg-[#c030d8] text-white rounded font-medium transition-colors">
              Generate
            </button>
          </div>
        </div>

        <div className="flex-1 bg-[#111827] rounded-xl border border-[#2a3a52] flex items-center justify-center text-[#6b82a6]">
          Gallery Empty
        </div>
      </div>

      {/* Document / Markdown Panel */}
      <div className="flex-1 p-6 flex flex-col">
        <div className="flex items-center gap-2 mb-6 text-[#00d4ff]">
          <FileText size={20} />
          <h3 className="font-bold">Document Editor</h3>
        </div>
        <textarea 
          className="flex-1 bg-[#1a2332] border border-[#2a3a52] rounded-xl p-6 text-[#e8f0ff] resize-none focus:border-[#00d4ff] outline-none font-sans leading-relaxed" 
          placeholder="# Start writing or ask AI to generate a document..."
        />
      </div>
    </div>
  );
}
