import React, { useEffect, useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Mic, MicOff, Volume2, VolumeX, Loader2, Sparkles, Ghost } from 'lucide-react';
import { GoogleGenAI, LiveServerMessage, Modality } from "@google/genai";

export function VoiceSOS({ onClose }: { onClose: () => void }) {
  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcription, setTranscription] = useState('');
  const [aiResponse, setAiResponse] = useState('');
  const sessionRef = useRef<any>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);

  const startSession = async () => {
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const session = await ai.live.connect({
        model: "gemini-2.5-flash-native-audio-preview-09-2025",
        config: {
          responseModalities: [Modality.AUDIO],
          speechConfig: {
            voiceConfig: { prebuiltVoiceConfig: { voiceName: "Zephyr" } },
          },
          systemInstruction: "You are the Cosmic SOS Voice Assistant. Help the user find their match or navigate solar flares. Use space metaphors.",
          inputAudioTranscription: {},
          outputAudioTranscription: {},
        },
        callbacks: {
          onopen: () => {
            setIsConnected(true);
            startMic();
          },
          onmessage: async (message: LiveServerMessage) => {
            if (message.serverContent?.modelTurn?.parts[0]?.inlineData?.data) {
              const base64Audio = message.serverContent.modelTurn.parts[0].inlineData.data;
              playAudio(base64Audio);
            }
            if (message.serverContent?.modelTurn?.parts[0]?.text) {
              setAiResponse(prev => prev + message.serverContent?.modelTurn?.parts[0]?.text);
            }
          },
          onclose: () => {
            setIsConnected(false);
            stopMic();
          },
          onerror: (e) => console.error(e),
        }
      });
      sessionRef.current = session;
    } catch (e) {
      console.error(e);
    }
  };

  const startMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      setIsRecording(true);
      
      const audioContext = new AudioContext({ sampleRate: 16000 });
      audioContextRef.current = audioContext;
      const source = audioContext.createMediaStreamSource(stream);
      const processor = audioContext.createScriptProcessor(4096, 1, 1);

      processor.onaudioprocess = (e) => {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = new Int16Array(inputData.length);
        for (let i = 0; i < inputData.length; i++) {
          pcmData[i] = Math.max(-1, Math.min(1, inputData[i])) * 0x7FFF;
        }
        const base64Data = btoa(String.fromCharCode(...new Uint8Array(pcmData.buffer)));
        if (sessionRef.current) {
          sessionRef.current.sendRealtimeInput({
            media: { data: base64Data, mimeType: 'audio/pcm;rate=16000' }
          });
        }
      };

      source.connect(processor);
      processor.connect(audioContext.destination);
    } catch (e) {
      console.error(e);
    }
  };

  const stopMic = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
    }
    setIsRecording(false);
  };

  const playAudio = (base64: string) => {
    const binary = atob(base64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
    const pcm = new Int16Array(bytes.buffer);
    const float32 = new Float32Array(pcm.length);
    for (let i = 0; i < pcm.length; i++) float32[i] = pcm[i] / 0x7FFF;

    const ctx = new AudioContext({ sampleRate: 24000 });
    const buffer = ctx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    source.connect(ctx.destination);
    source.start();
  };

  useEffect(() => {
    startSession();
    return () => {
      if (sessionRef.current) sessionRef.current.close();
      stopMic();
    };
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/80 backdrop-blur-3xl pointer-events-auto"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="w-full max-w-md bg-zinc-900 border border-white/10 rounded-[3rem] overflow-hidden shadow-2xl flex flex-col"
      >
        <div className="p-8 border-b border-white/5 bg-gradient-to-r from-blue-500/10 to-purple-500/10 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className={`p-3 rounded-2xl ${isRecording ? 'bg-red-500/20 animate-pulse' : 'bg-blue-500/20'}`}>
              {isRecording ? <Mic className="text-red-400" size={24} /> : <MicOff className="text-blue-400" size={24} />}
            </div>
            <div>
              <h2 className="text-xl font-black italic tracking-tighter uppercase">Voice SOS Channel</h2>
              <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Gemini Live API Active</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors">
            <X size={20} />
          </button>
        </div>

        <div className="p-8 space-y-8 flex flex-col items-center">
          <div className="relative w-48 h-48 flex items-center justify-center">
            <div className={`absolute inset-0 rounded-full border-4 border-blue-500/20 ${isRecording ? 'animate-ping' : ''}`} />
            <div className={`absolute inset-4 rounded-full border-2 border-blue-500/40 ${isRecording ? 'animate-pulse' : ''}`} />
            <div className="w-32 h-32 rounded-full bg-zinc-800 border-2 border-white/10 flex items-center justify-center shadow-2xl">
              <Ghost size={64} className={`${isRecording ? 'text-blue-400' : 'text-gray-600'}`} />
            </div>
          </div>

          <div className="w-full space-y-4 text-center">
            <div className="text-xs font-bold uppercase tracking-[0.3em] text-blue-400">
              {isConnected ? 'Connected to Orbit' : 'Establishing Uplink...'}
            </div>
            <div className="min-h-[60px] p-4 bg-black/40 rounded-2xl border border-white/5 text-sm text-gray-300 italic">
              {aiResponse || "Speak now, cosmic traveler. I am listening to your frequency..."}
            </div>
          </div>

          <div className="flex gap-4 w-full">
            <button 
              onClick={() => isRecording ? stopMic() : startMic()}
              className={`flex-1 py-4 rounded-2xl font-black uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all ${
                isRecording ? 'bg-red-500 text-white' : 'bg-blue-500 text-white'
              }`}
            >
              {isRecording ? <VolumeX size={16} /> : <Volume2 size={16} />}
              {isRecording ? 'Mute Channel' : 'Open Channel'}
            </button>
          </div>
        </div>

        <div className="p-4 bg-black/40 text-center text-[9px] text-gray-600 uppercase tracking-widest font-bold">
          Low Latency • Encrypted • Interstellar
        </div>
      </motion.div>
    </motion.div>
  );
}
