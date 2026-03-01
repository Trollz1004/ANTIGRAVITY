
import React, { useState, useRef } from 'react';
import { Image as ImageIcon, Video, Sparkles, Upload, Download, Loader2, Wand2 } from 'lucide-react';
import { editImage, generateVeoVideo } from '../services/geminiService';

const CreativeStudio: React.FC = () => {
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [prompt, setPrompt] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [resultMedia, setResultMedia] = useState<{ type: 'image' | 'video', url: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setSelectedImage(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const handleEdit = async () => {
    if (!selectedImage || !prompt) return;
    setIsLoading(true);
    try {
      const result = await editImage(prompt, selectedImage);
      if (result) setResultMedia({ type: 'image', url: result });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAnimate = async () => {
    if (!selectedImage && !prompt) return;
    setIsLoading(true);
    try {
      const result = await generateVeoVideo(prompt || "Animate this photo", selectedImage || undefined);
      if (result) setResultMedia({ type: 'video', url: result });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="h-full flex flex-col gap-6 animate-fade-in">
      <div className="bg-surface p-6 rounded-xl border border-slate-700 flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-white flex items-center gap-2">
            <Wand2 className="text-primary" /> Creative Studio
          </h2>
          <p className="text-slate-400 text-sm">Gemini 2.5 Flash Image & Veo Video Generation</p>
        </div>
      </div>

      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-6 overflow-hidden">
        {/* Workspace */}
        <div className="bg-surface rounded-xl border border-slate-700 p-6 flex flex-col gap-6 overflow-auto">
          <div 
            onClick={() => fileInputRef.current?.click()}
            className="aspect-video bg-slate-900 border-2 border-dashed border-slate-700 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-primary transition-colors relative overflow-hidden group"
          >
            {selectedImage ? (
              <img src={selectedImage} className="w-full h-full object-contain" alt="Selected" />
            ) : (
              <>
                <Upload className="text-slate-500 group-hover:text-primary mb-2" size={40} />
                <p className="text-slate-400 text-sm">Click to upload base image</p>
              </>
            )}
            <input type="file" ref={fileInputRef} className="hidden" accept="image/*" onChange={handleFileChange} />
          </div>

          <div className="space-y-4">
            <label className="block text-xs font-bold text-slate-500 uppercase">Creative Prompt</label>
            <textarea 
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="e.g., 'Add a retro filter' or 'Make a video of this character driving a car'..."
              className="w-full bg-slate-900 border border-slate-700 rounded-lg p-4 text-white focus:outline-none focus:border-primary resize-none h-24"
            />
            
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={handleEdit}
                disabled={isLoading || !selectedImage}
                className="flex items-center justify-center gap-2 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-lg font-bold disabled:opacity-50"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <ImageIcon size={20} />}
                Edit Image
              </button>
              <button 
                onClick={handleAnimate}
                disabled={isLoading}
                className="flex items-center justify-center gap-2 py-3 bg-primary hover:bg-indigo-600 text-white rounded-lg font-bold disabled:opacity-50 shadow-lg shadow-indigo-500/20"
              >
                {isLoading ? <Loader2 className="animate-spin" /> : <Video size={20} />}
                Generate Video
              </button>
            </div>
          </div>
        </div>

        {/* Output */}
        <div className="bg-slate-900/50 rounded-xl border border-slate-700 p-6 flex flex-col items-center justify-center border-dashed relative">
          {isLoading ? (
            <div className="flex flex-col items-center gap-4 text-slate-400">
              <Loader2 className="animate-spin text-primary" size={48} />
              <div className="animate-pulse space-y-2 text-center">
                <p className="font-bold">Gemini is dreaming...</p>
                <p className="text-xs">Generating neural high-fidelity frames</p>
              </div>
            </div>
          ) : resultMedia ? (
            <div className="w-full h-full flex flex-col gap-4">
              <div className="flex-1 rounded-lg overflow-hidden border border-slate-700 bg-black flex items-center justify-center">
                {resultMedia.type === 'image' ? (
                  <img src={resultMedia.url} className="max-w-full max-h-full object-contain" alt="AI Generated" />
                ) : (
                  <video src={resultMedia.url} controls autoPlay loop className="max-w-full max-h-full" />
                )}
              </div>
              <button 
                onClick={() => {
                   const link = document.createElement('a');
                   link.href = resultMedia.url;
                   link.download = `gemini-output-${Date.now()}`;
                   link.click();
                }}
                className="flex items-center justify-center gap-2 py-2 bg-slate-800 hover:bg-slate-700 text-white rounded-lg text-sm"
              >
                <Download size={16} /> Download Master
              </button>
            </div>
          ) : (
            <div className="text-slate-600 flex flex-col items-center gap-3">
              <Sparkles size={48} />
              <p>Generated content will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreativeStudio;
