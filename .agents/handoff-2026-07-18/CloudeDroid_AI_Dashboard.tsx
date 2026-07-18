import React, { useState, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Volume2, MessageSquare, Cpu, Activity } from 'lucide-react';

const PERPLEXITY_API_KEY = import.meta.env.VITE_PERPLEXITY_API_KEY ?? ''; // wire via backend/OmniRoute, never bake a key into a shipped product

export default function CloudeDroidDashboard() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(70);
  const [chatMessages, setChatMessages] = useState([]);
  const [input, setInput] = useState('');
  const [agent, setAgent] = useState('perplexity');
  const [loading, setLoading] = useState(false);

  const agents = [
    { id: 'perplexity', name: 'Perplexity AI', status: 'online' },
    { id: 'claude', name: 'Claude Sonnet', status: 'online' },
    { id: 'gpt4', name: 'GPT-4', status: 'online' },
    { id: 'gemini', name: 'Gemini Pro', status: 'online' },
    { id: 'ollama', name: 'Ollama Local', status: 'online' }
  ];

  const tracks = [
    { title: "AI Genesis", artist: "CloudeDroid", duration: "3:42" },
    { title: "Neural Networks", artist: "DAO Collective", duration: "4:15" },
    { title: "Blockchain Dreams", artist: "Web3 Sound", duration: "3:58" }
  ];

  const sendToPerplexity = async (message) => {
    setLoading(true);
    
    setChatMessages(prev => [...prev, { role: 'user', content: message, agent }]);

    setTimeout(() => {
      setChatMessages(prev => [...prev, {
        role: 'assistant', 
        content: `Stub response. Wire this to a backend endpoint that fronts OmniRoute (:20128) — the dashboard is the UI shell, the gate does the model call.`, 
        agent
      }]);
      setLoading(false);
    }, 1000);
    
    setInput('');
  };

  const handleSend = () => {
    if (!input.trim() || loading) return;
    sendToPerplexity(input);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 text-white p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        <div className="bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
                CloudeDroid AI
              </h1>
              <p className="text-purple-300 mt-1">DAO Market Platform 1/3</p>
            </div>
            <div className="flex gap-4">
              <div className="bg-green-500/20 px-4 py-2 rounded-lg border border-green-500/50">
                <div className="flex items-center gap-2">
                  <Activity className="w-5 h-5 text-green-400" />
                  <span className="text-green-300 font-semibold">LIVE</span>
                </div>
              </div>
              <div className="bg-purple-500/20 px-4 py-2 rounded-lg border border-purple-500/50">
                <div className="flex items-center gap-2">
                  <Cpu className="w-5 h-5 text-purple-400" />
                  <span className="text-purple-300">5 Agents Online</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          
          <div className="lg:col-span-1 bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30">
            <h2 className="text-xl font-bold mb-4">🎵 Media Player</h2>
            
            <div className="bg-gradient-to-br from-purple-600 to-pink-600 rounded-xl p-6 mb-4">
              <div className="text-center">
                <div className="text-4xl mb-2">🎵</div>
                <h3 className="font-bold text-lg">{tracks[0].title}</h3>
                <p className="text-purple-200">{tracks[0].artist}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-center gap-4">
                <button className="p-3 rounded-full bg-purple-500/20 hover:bg-purple-500/40 transition">
                  <SkipBack className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="p-4 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 transition"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
                <button className="p-3 rounded-full bg-purple-500/20 hover:bg-purple-500/40 transition">
                  <SkipForward className="w-5 h-5" />
                </button>
              </div>

              <div className="flex items-center gap-3">
                <Volume2 className="w-5 h-5 text-purple-400" />
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={volume}
                  onChange={(e) => setVolume(Number(e.target.value))}
                  className="flex-1 accent-purple-500"
                />
                <span className="text-sm w-10">{volume}%</span>
              </div>

              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-purple-300">Queue</h3>
                {tracks.map((track, idx) => (
                  <div key={idx} className="bg-purple-500/10 p-3 rounded-lg hover:bg-purple-500/20 transition cursor-pointer">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-sm">{track.title}</p>
                        <p className="text-xs text-purple-300">{track.artist}</p>
                      </div>
                      <span className="text-xs text-purple-400">{track.duration}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          <div className="lg:col-span-2 bg-black/40 backdrop-blur-xl rounded-2xl p-6 border border-purple-500/30 flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-purple-400" />
                <h2 className="text-xl font-bold">AI Agents</h2>
              </div>
              <select 
                value={agent}
                onChange={(e) => setAgent(e.target.value)}
                className="bg-purple-500/20 border border-purple-500/50 rounded-lg px-4 py-2 text-sm focus:outline-none focus:border-purple-400"
              >
                {agents.map(a => (
                  <option key={a.id} value={a.id}>{a.name}</option>
                ))}
              </select>
            </div>

            <div className="flex-1 bg-black/30 rounded-xl p-4 mb-4 overflow-y-auto max-h-96 space-y-3">
              {chatMessages.length === 0 ? (
                <div className="text-center text-purple-400 py-8">
                  <p className="mb-2">💬 Start a conversation</p>
                  <p className="text-sm text-purple-500">Ready to chat!</p>
                </div>
              ) : (
                chatMessages.map((msg, idx) => (
                  <div key={idx} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    <div className={`max-w-[80%] p-3 rounded-lg ${
                      msg.role === 'user' 
                        ? 'bg-gradient-to-r from-purple-500 to-pink-500' 
                        : 'bg-purple-500/20 border border-purple-500/50'
                    }`}>
                      <p className="text-sm">{msg.content}</p>
                    </div>
                  </div>
                ))
              )}
              {loading && (
                <div className="flex justify-start">
                  <div className="bg-purple-500/20 border border-purple-500/50 p-3 rounded-lg">
                    <div className="flex gap-2">
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
                      <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSend()}
                placeholder="Ask anything..."
                disabled={loading}
                className="flex-1 bg-purple-500/20 border border-purple-500/50 rounded-lg px-4 py-3 focus:outline-none focus:border-purple-400 disabled:opacity-50"
              />
              <button
                onClick={handleSend}
                disabled={loading || !input.trim()}
                className="bg-gradient-to-r from-purple-500 to-pink-500 px-6 py-3 rounded-lg hover:from-purple-600 hover:to-pink-600 transition disabled:opacity-50 disabled:cursor-not-allowed font-bold"
              >
                Send
              </button>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {agents.map(a => (
            <div key={a.id} className="bg-black/40 backdrop-blur-xl rounded-xl p-4 border border-purple-500/30">
              <div className="flex items-center justify-between mb-2">
                <Cpu className="w-5 h-5 text-purple-400" />
                <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></div>
              </div>
              <h3 className="font-semibold text-sm mb-1">{a.name}</h3>
              <p className="text-xs text-purple-400">{a.status}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}