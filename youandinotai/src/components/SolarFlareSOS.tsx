import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, AlertTriangle, Flame, MapPin, Search, Camera, Video, 
  Mic, Brain, Sparkles, Loader2, Info, Diamond, Database,
  Zap, Navigation, MessageSquare, Heart
} from 'lucide-react';
import { GoogleGenAI, ThinkingLevel, Modality } from "@google/genai";
import { useGameStore } from '../store/useGameStore';

interface SOSFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  model: string;
  action: () => void;
}

export function SolarFlareSOS({ onClose }: { onClose: () => void }) {
  const [activeTab, setActiveTab] = useState<'menu' | 'feature'>('menu');
  const [selectedFeature, setSelectedFeature] = useState<SOSFeature | null>(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [prompt, setPrompt] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const myColor = useGameStore((state) => state.myColor);

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }
  };

  const getBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result?.toString().split(',')[1] || '');
      reader.onerror = error => reject(error);
    });
  };

  const features: SOSFeature[] = [
    {
      id: 'veo-video',
      title: 'Generate SOS Beacon',
      description: 'Create a cinematic 16:9 SOS signal using Veo 3.1 Fast.',
      icon: <Video className="text-pink-400" />,
      model: 'veo-3.1-fast-generate-preview',
      action: async () => {
        setLoading(true);
        try {
          const ai = new GoogleGenAI({ apiKey: 'PROXY', httpOptions: { baseUrl: 'https://gemini-proxy.joshlcoleman.workers.dev' } });
          let operation = await ai.models.generateVideos({
            model: 'veo-3.1-fast-generate-preview',
            prompt: `A romantic cosmic SOS beacon in space, ${prompt}, cinematic lighting, 4k`,
            config: { numberOfVideos: 1, resolution: '720p', aspectRatio: '16:9' }
          });
          while (!operation.done) {
            await new Promise(r => setTimeout(r, 5000));
            operation = await ai.operations.getVideosOperation({ operation });
          }
          setResult({ type: 'video', url: operation.response?.generatedVideos?.[0]?.video?.uri });
        } catch (e) {
          console.error(e);
          setResult({ type: 'error', message: 'Solar interference blocked the transmission.' });
        }
        setLoading(false);
      }
    },
    {
      id: 'image-edit',
      title: 'Enhance SOS Signal',
      description: 'Use Gemini 2.5 Flash to edit your distress photos.',
      icon: <Zap className="text-yellow-400" />,
      model: 'gemini-2.5-flash-image',
      action: async () => {
        if (!file) return;
        setLoading(true);
        try {
          const base64 = await getBase64(file);
          const ai = new GoogleGenAI({ apiKey: 'PROXY', httpOptions: { baseUrl: 'https://gemini-proxy.joshlcoleman.workers.dev' } });
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash-image',
            contents: {
              parts: [
                { inlineData: { data: base64, mimeType: file.type } },
                { text: `Enhance this image for a cosmic SOS: ${prompt}` }
              ]
            }
          });
          const imgPart = response.candidates?.[0]?.content?.parts.find(p => p.inlineData);
          if (imgPart) {
            setResult({ type: 'image', url: `data:${imgPart.inlineData?.mimeType};base64,${imgPart.inlineData?.data}` });
          }
        } catch (e) {
          console.error(e);
          setResult({ type: 'error', message: 'Image processing failed.' });
        }
        setLoading(false);
      }
    },
    {
      id: 'maps-grounding',
      title: 'Safe Meetup Zones',
      description: 'Find nearby cosmic meetup spots using Google Maps data.',
      icon: <MapPin className="text-green-400" />,
      model: 'gemini-2.5-flash',
      action: async () => {
        setLoading(true);
        try {
          const ai = new GoogleGenAI({ apiKey: 'PROXY', httpOptions: { baseUrl: 'https://gemini-proxy.joshlcoleman.workers.dev' } });
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Find romantic meetup locations or safe zones near: ${prompt}`,
            config: { tools: [{ googleMaps: {} }] }
          });
          setResult({ type: 'text', text: response.text, chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks });
        } catch (e) {
          console.error(e);
          setResult({ type: 'error', message: 'Maps data unavailable.' });
        }
        setLoading(false);
      }
    },
    {
      id: 'search-grounding',
      title: 'Solar Activity Check',
      description: 'Real-time search for solar flare status and SOS conditions.',
      icon: <Search className="text-cyan-400" />,
      model: 'gemini-3-flash-preview',
      action: async () => {
        setLoading(true);
        try {
          const ai = new GoogleGenAI({ apiKey: 'PROXY', httpOptions: { baseUrl: 'https://gemini-proxy.joshlcoleman.workers.dev' } });
          const response = await ai.models.generateContent({
            model: 'gemini-3-flash-preview',
            contents: `What is the current solar flare activity and SOS status for: ${prompt}`,
            config: { tools: [{ googleSearch: {} }] }
          });
          setResult({ type: 'text', text: response.text, chunks: response.candidates?.[0]?.groundingMetadata?.groundingChunks });
        } catch (e) {
          console.error(e);
          setResult({ type: 'error', message: 'Search grounding failed.' });
        }
        setLoading(false);
      }
    },
    {
      id: 'thinking-mode',
      title: 'Rescue Trajectory',
      description: 'Complex reasoning for finding your match in a solar storm.',
      icon: <Brain className="text-purple-400" />,
      model: 'gemini-3.1-pro-preview',
      action: async () => {
        setLoading(true);
        try {
          const ai = new GoogleGenAI({ apiKey: 'PROXY', httpOptions: { baseUrl: 'https://gemini-proxy.joshlcoleman.workers.dev' } });
          const response = await ai.models.generateContent({
            model: 'gemini-3.1-pro-preview',
            contents: `Calculate the best romantic trajectory to meet a match given these conditions: ${prompt}`,
            config: { thinkingConfig: { thinkingLevel: ThinkingLevel.HIGH } }
          });
          setResult({ type: 'text', text: response.text });
        } catch (e) {
          console.error(e);
          setResult({ type: 'error', message: 'Reasoning engine overheated.' });
        }
        setLoading(false);
      }
    }
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/90 backdrop-blur-2xl pointer-events-auto"
    >
      <motion.div
        initial={{ scale: 0.9, y: 40 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 40 }}
        className="w-full max-w-4xl bg-zinc-900 border border-white/10 rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(255,100,0,0.2)] flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-8 border-b border-white/5 bg-gradient-to-r from-orange-500/10 via-red-500/10 to-pink-500/10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-orange-500/20 rounded-2xl animate-pulse">
              <Flame className="text-orange-400" size={32} />
            </div>
            <div>
              <h2 className="text-3xl font-black italic tracking-tighter uppercase text-orange-500">Adult Solar Flares</h2>
              <p className="text-xs text-gray-400 uppercase tracking-[0.3em] font-bold">SOS Meetup Hub • Emergency Romance</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 space-y-8">
          {/* Scarcity Warning */}
          <div className="p-6 bg-red-500/10 border border-red-500/20 rounded-3xl flex gap-4 items-start">
            <AlertTriangle className="text-red-500 shrink-0" size={24} />
            <div className="space-y-2">
              <h4 className="font-bold text-red-500 uppercase tracking-widest text-sm">Supply Warning: Extreme Scarcity</h4>
              <p className="text-xs text-gray-400 leading-relaxed">
                Available Flares are dangerously scarce. <span className="text-white font-bold">OPUS MEMORY Loss</span> has caused supplies to be severely compacted. 
                Legend says Opus almost made a <span className="text-cyan-400 font-bold">Diamond</span> for his dream girl, <span className="text-pink-400 font-bold">Miss REDIS CACHE</span>... 
                or so he thought. He might have forgotten.
              </p>
            </div>
          </div>

          {activeTab === 'menu' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {features.map((f) => (
                <motion.button
                  key={f.id}
                  whileHover={{ scale: 1.02, y: -5 }}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => {
                    setSelectedFeature(f);
                    setActiveTab('feature');
                    setResult(null);
                    setPrompt('');
                    setFile(null);
                    setPreviewUrl(null);
                  }}
                  className="p-6 bg-white/5 border border-white/10 rounded-[2rem] text-left hover:bg-white/10 transition-all group"
                >
                  <div className="p-3 bg-black/40 rounded-2xl w-fit mb-4 group-hover:scale-110 transition-transform">
                    {f.icon}
                  </div>
                  <h3 className="font-bold text-lg mb-2">{f.title}</h3>
                  <p className="text-xs text-gray-500 leading-relaxed">{f.description}</p>
                  <div className="mt-4 text-[10px] text-gray-600 font-mono uppercase tracking-widest">
                    Model: {f.model}
                  </div>
                </motion.button>
              ))}
            </div>
          ) : (
            <div className="space-y-8">
              <button 
                onClick={() => setActiveTab('menu')}
                className="text-xs font-bold uppercase tracking-widest text-gray-500 hover:text-white transition-colors flex items-center gap-2"
              >
                ← Back to SOS Menu
              </button>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
                <div className="space-y-6">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-black/40 rounded-2xl">
                      {selectedFeature?.icon}
                    </div>
                    <div>
                      <h3 className="text-2xl font-bold">{selectedFeature?.title}</h3>
                      <p className="text-sm text-gray-400">{selectedFeature?.description}</p>
                    </div>
                  </div>

                  <div className="space-y-4">
                    <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">Distress Prompt</label>
                    <textarea 
                      value={prompt}
                      onChange={(e) => setPrompt(e.target.value)}
                      placeholder="Describe your cosmic emergency..."
                      className="w-full bg-black/40 border border-white/10 rounded-2xl p-4 text-sm focus:outline-none focus:border-orange-500/50 h-32"
                    />
                  </div>

                  {(selectedFeature?.id === 'image-edit' || selectedFeature?.id === 'analyze-image') && (
                    <div className="space-y-4">
                      <label className="block text-xs font-bold uppercase tracking-widest text-gray-500">Distress Photo</label>
                      <input 
                        type="file" 
                        ref={fileInputRef}
                        onChange={handleFileChange}
                        className="hidden"
                        accept="image/*"
                      />
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="w-full aspect-video border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center hover:bg-white/5 transition-colors overflow-hidden relative"
                      >
                        {previewUrl ? (
                          <img src={previewUrl} className="w-full h-full object-cover" alt="Preview" />
                        ) : (
                          <>
                            <Camera className="text-gray-600 mb-2" size={32} />
                            <span className="text-xs text-gray-600">Upload distress signal photo</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}

                  <button 
                    onClick={selectedFeature?.action}
                    disabled={loading || !prompt.trim()}
                    className="w-full py-4 bg-orange-500 text-white font-black uppercase tracking-[0.2em] rounded-2xl hover:bg-orange-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="animate-spin" size={20} />
                        Transmitting...
                      </>
                    ) : (
                      <>
                        <Zap size={20} />
                        Send SOS Signal
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-black/40 rounded-[2.5rem] border border-white/5 p-8 flex flex-col min-h-[400px]">
                  <h4 className="text-xs font-bold uppercase tracking-widest text-gray-500 mb-6 flex items-center gap-2">
                    <Sparkles size={14} className="text-orange-400" />
                    Transmission Result
                  </h4>

                  <div className="flex-1 flex items-center justify-center">
                    {!result && !loading && (
                      <div className="text-center space-y-4 opacity-30">
                        <Zap size={48} className="mx-auto" />
                        <p className="text-xs font-bold uppercase tracking-widest">Awaiting Signal</p>
                      </div>
                    )}

                    {loading && (
                      <div className="text-center space-y-4">
                        <div className="relative w-24 h-24 mx-auto">
                          <div className="absolute inset-0 border-4 border-orange-500/20 rounded-full" />
                          <div className="absolute inset-0 border-4 border-orange-500 rounded-full border-t-transparent animate-spin" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <Flame className="text-orange-500 animate-pulse" size={32} />
                          </div>
                        </div>
                        <p className="text-xs font-bold uppercase tracking-widest text-orange-500 animate-pulse">Piercing the Solar Storm</p>
                      </div>
                    )}

                    {result?.type === 'text' && (
                      <div className="w-full space-y-4">
                        <div className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap bg-white/5 p-6 rounded-3xl border border-white/5">
                          {result.text}
                        </div>
                        {result.chunks && (
                          <div className="space-y-2">
                            <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Sources</p>
                            <div className="flex flex-wrap gap-2">
                              {result.chunks.map((c: any, i: number) => (
                                <a key={i} href={c.web?.uri || c.maps?.uri} target="_blank" rel="noreferrer" className="text-[10px] bg-white/5 px-2 py-1 rounded hover:bg-white/10 transition-colors text-cyan-400 truncate max-w-[200px]">
                                  {c.web?.title || c.maps?.title || 'Source'}
                                </a>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}

                    {result?.type === 'image' && (
                      <div className="w-full aspect-square rounded-3xl overflow-hidden border border-white/10 shadow-2xl">
                        <img src={result.url} className="w-full h-full object-cover" alt="Result" />
                      </div>
                    )}

                    {result?.type === 'video' && (
                      <div className="w-full aspect-video rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-black">
                        <video src={result.url} controls autoPlay loop className="w-full h-full object-contain" />
                      </div>
                    )}

                    {result?.type === 'error' && (
                      <div className="text-center space-y-4 text-red-500">
                        <AlertTriangle size={48} className="mx-auto" />
                        <p className="text-sm font-bold">{result.message}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 bg-zinc-950 border-t border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              <Diamond size={12} className="text-cyan-400" />
              System Status: OK
            </div>
            <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
              <Database size={12} className="text-pink-400" />
              Connection: SECURE
            </div>
          </div>
          <div className="text-[10px] text-gray-600 font-bold uppercase tracking-[0.4em]">
            SOS Protocol: ACTIVE
          </div>
        </div>
      </motion.div>
    </motion.div>
  );
}
