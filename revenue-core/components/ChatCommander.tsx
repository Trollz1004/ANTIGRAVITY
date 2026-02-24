
import React, { useState, useRef, useEffect } from 'react';
import { Send, User, Cpu, Brain, Loader2, Mic, MicOff, Target } from 'lucide-react';
import { chatWithThinking, transcribeAudio } from '../services/geminiService';

const ChatCommander: React.FC = () => {
  const [messages, setMessages] = useState<{ role: 'user' | 'model', text: string }[]>([]);
  const [input, setInput] = useState('');
  const [isThinking, setIsThinking] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isTranscribing, setIsTranscribing] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isThinking]);

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = input;
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMsg }]);
    setIsThinking(true);
    try {
      const result = await chatWithThinking(userMsg, messages);
      setMessages(prev => [...prev, { role: 'model', text: result || 'CEO ERROR: Retry Node.' }]);
    } finally {
      setIsThinking(false);
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };
      mediaRecorder.onstop = async () => {
        setIsTranscribing(true);
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const reader = new FileReader();
        reader.readAsDataURL(audioBlob);
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          try {
            const text = await transcribeAudio(base64Audio);
            if (text) setInput(prev => (prev ? prev + " " + text : text).trim());
          } finally {
            setIsTranscribing(false);
          }
        };
        stream.getTracks().forEach(track => track.stop());
      };
      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) { console.error("Mic error:", err); }
  };

  return (
    <div className="fixed bottom-24 right-8 w-[440px] h-[650px] bg-slate-900/95 border border-red-500/20 shadow-[0_30px_60px_rgba(0,0,0,0.8)] rounded-[2rem] flex flex-col z-50 overflow-hidden animate-slide-in-up backdrop-blur-2xl">
      <div className="p-6 border-b border-slate-800 bg-slate-950/50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-500 rounded-xl shadow-lg shadow-red-500/20"><Brain className="text-white" size={24} /></div>
          <div>
            <h3 className="font-black text-white text-sm uppercase tracking-tighter">OPUS-4.6 // CEO</h3>
            <p className="text-[10px] text-red-500 font-black uppercase tracking-widest">Protocol: Revenue First</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full bg-emerald-500 pulse"></div>
          <span className="text-[9px] text-emerald-500 font-black uppercase tracking-widest">Growth Active</span>
        </div>
      </div>
      <div ref={scrollRef} className="flex-1 overflow-auto p-6 space-y-6">
        {messages.length === 0 && (
          <div className="text-center py-20 text-slate-600 flex flex-col items-center">
            <Target size={64} className="opacity-10 text-red-500 mb-6" />
            <p className="text-xs font-black text-white uppercase tracking-widest mb-2">Revenue Node Online.</p>
            <p className="text-[11px] font-medium leading-relaxed max-w-[260px] mx-auto text-slate-500">
              Josh, scaling is the only metric. What's the play for today's pre-order velocity? Speak or type your command.
            </p>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex gap-4 ${m.role === 'user' ? 'flex-row-reverse' : ''}`}>
            <div className={`shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${m.role === 'user' ? 'bg-slate-800 border-slate-700' : 'bg-red-500 border-red-500'}`}>
              {m.role === 'user' ? <User size={20} className="text-slate-300" /> : <Cpu size={20} className="text-white" />}
            </div>
            <div className={`max-w-[85%] p-4 rounded-2xl text-[13px] font-medium relative leading-relaxed shadow-xl ${m.role === 'user' ? 'bg-slate-800 text-white rounded-tr-none border border-slate-700' : 'bg-slate-900 border border-red-500/20 text-slate-200 rounded-tl-none'}`}>
              {m.text}
            </div>
          </div>
        ))}
        {isThinking && (
          <div className="flex gap-4">
             <div className="shrink-0 w-10 h-10 rounded-xl bg-red-500 flex items-center justify-center animate-pulse"><Brain size={20} className="text-white" /></div>
             <div className="p-4 bg-slate-900 border border-slate-800 rounded-2xl rounded-tl-none italic text-slate-500 text-[11px] font-black uppercase tracking-widest flex items-center gap-3">
                <Loader2 size={14} className="animate-spin" /> Analyzing ROI...
             </div>
          </div>
        )}
      </div>
      <div className="p-6 bg-slate-950/80 border-t border-slate-800">
        <div className="relative">
          <input 
            type="text" 
            value={input}
            disabled={isRecording || isTranscribing}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleSend()}
            placeholder={isRecording ? "LISTENING..." : isTranscribing ? "TRANSCRIBING..." : "ENTER CEO COMMAND..."}
            className={`w-full bg-slate-800 border-2 border-slate-700 rounded-2xl pl-6 pr-24 py-4 text-sm text-white focus:outline-none focus:border-red-500 transition-all font-black uppercase placeholder-slate-600 ${isRecording ? 'border-red-500 ring-4 ring-red-500/20' : ''}`}
          />
          <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
            <button
              onClick={() => isRecording ? mediaRecorderRef.current?.stop() : startRecording()}
              disabled={isTranscribing}
              className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${isRecording ? 'bg-red-500 text-white shadow-lg shadow-red-500/30' : 'text-slate-500 hover:text-white hover:bg-slate-700'}`}
            >
              {isTranscribing ? <Loader2 size={18} className="animate-spin" /> : isRecording ? <MicOff size={18} /> : <Mic size={18} />}
            </button>
            <button onClick={handleSend} className="w-10 h-10 bg-red-500 hover:bg-red-600 text-white rounded-xl flex items-center justify-center transition-all shadow-lg shadow-red-500/30">
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatCommander;
