/**
 * VideoChat — video call UI shell for matched users.
 * Wires to video.py backend:
 *   POST /api/v1/video/call/{matchId}/initiate
 *   POST /api/v1/video/call/{callId}/end
 *   GET  /api/v1/video/call/{matchId}/history
 *
 * No actual WebRTC yet — this is the UI shell + REST state management.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { api } from '../lib/api';

interface VideoCallData {
  id: string;
  match_id: string;
  initiator_id: string;
  status: string;
  duration_seconds: number | null;
  started_at: string;
  ended_at: string | null;
}

interface VideoChatProps {
  matchId: string;
  onClose: () => void;
}

type CallStatus = 'idle' | 'calling' | 'connected' | 'ended';

function formatDuration(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
}

export default function VideoChat({ matchId, onClose }: VideoChatProps) {
  const [callStatus, setCallStatus] = useState<CallStatus>('idle');
  const [activeCallId, setActiveCallId] = useState<string | null>(null);
  const [elapsed, setElapsed] = useState(0);
  const [history, setHistory] = useState<VideoCallData[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const timerRef = useRef<number | null>(null);

  // ── Fetch call history ───────────────────────────────────────────────────

  const fetchHistory = useCallback(async () => {
    setLoadingHistory(true);
    try {
      const data = await api.get<VideoCallData[]>(`/video/call/${matchId}/history`);
      setHistory(data);
    } catch {
      // silent
    } finally {
      setLoadingHistory(false);
    }
  }, [matchId]);

  useEffect(() => { fetchHistory(); }, [fetchHistory]);

  // ── Timer ────────────────────────────────────────────────────────────────

  useEffect(() => {
    if (callStatus === 'connected') {
      timerRef.current = window.setInterval(() => setElapsed((e) => e + 1), 1000);
    }
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [callStatus]);

  // ── Start call ───────────────────────────────────────────────────────────

  const startCall = async () => {
    setError(null);
    setCallStatus('calling');
    try {
      const call = await api.post<VideoCallData>(`/video/call/${matchId}/initiate`);
      setActiveCallId(call.id);
      // Simulate connection after 2s (no real WebRTC yet)
      setTimeout(() => {
        setCallStatus('connected');
        setElapsed(0);
      }, 2000);
    } catch {
      setError('Failed to start call.');
      setCallStatus('idle');
    }
  };

  // ── End call ─────────────────────────────────────────────────────────────

  const endCall = async () => {
    if (!activeCallId) return;
    try {
      await api.post(`/video/call/${activeCallId}/end`);
    } catch {
      // best-effort
    }
    setCallStatus('ended');
    setActiveCallId(null);
    if (timerRef.current) window.clearInterval(timerRef.current);
    fetchHistory();
  };

  // ── Render ───────────────────────────────────────────────────────────────

  return (
    <div className="max-w-lg mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <span className="text-2xl">📹</span> Video Call
        </h2>
        <button
          id="video-close"
          onClick={onClose}
          className="text-gray-500 hover:text-white text-sm transition-colors"
        >
          Close
        </button>
      </div>

      {/* Video frames */}
      <div className="relative aspect-video glass-strong rounded-2xl overflow-hidden">
        {/* Remote video placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          {callStatus === 'idle' ? (
            <div className="text-center space-y-3">
              <p className="text-4xl">📞</p>
              <p className="text-gray-400 text-sm">Ready to connect</p>
            </div>
          ) : callStatus === 'calling' ? (
            <div className="text-center space-y-3 animate-pulse">
              <p className="text-4xl">🔔</p>
              <p className="text-purple-400 text-sm font-medium">Calling...</p>
            </div>
          ) : callStatus === 'connected' ? (
            <div className="text-center space-y-3">
              <div className="w-24 h-24 rounded-full bg-gradient-to-br from-purple-600 to-pink-500 flex items-center justify-center mx-auto shadow-xl shadow-purple-600/30">
                <span className="text-3xl">👤</span>
              </div>
              <p className="text-white text-sm font-medium">Connected</p>
              <p className="text-purple-400 text-lg font-mono font-bold">{formatDuration(elapsed)}</p>
            </div>
          ) : (
            <div className="text-center space-y-3">
              <p className="text-4xl">✅</p>
              <p className="text-gray-400 text-sm">Call ended — {formatDuration(elapsed)}</p>
            </div>
          )}
        </div>

        {/* Self video placeholder (PiP) */}
        {(callStatus === 'connected' || callStatus === 'calling') && (
          <div className="absolute bottom-3 right-3 w-24 h-32 glass rounded-xl flex items-center justify-center border border-white/10">
            <span className="text-sm">🤳</span>
          </div>
        )}

        {/* Connected indicator */}
        {callStatus === 'connected' && (
          <div className="absolute top-3 left-3 flex items-center gap-1.5 glass rounded-full px-3 py-1">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-[10px] text-green-400 font-medium">LIVE</span>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="flex justify-center gap-4">
        {callStatus === 'idle' || callStatus === 'ended' ? (
          <button
            id="video-start-call"
            onClick={startCall}
            className="bg-purple-600 hover:bg-purple-500 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all duration-200 hover:shadow-lg hover:shadow-purple-600/20 flex items-center gap-2"
          >
            📹 Start Video Call
          </button>
        ) : (
          <button
            id="video-end-call"
            onClick={endCall}
            className="bg-red-600 hover:bg-red-500 text-white px-8 py-3 rounded-xl font-bold text-sm transition-all duration-200 hover:shadow-lg hover:shadow-red-600/20 flex items-center gap-2"
          >
            📵 End Call
          </button>
        )}
      </div>

      {/* Error */}
      {error && (
        <div className="bg-red-900/30 border border-red-800/50 text-red-300 rounded-lg px-4 py-2.5 text-sm">
          {error}
        </div>
      )}

      {/* Call history */}
      <div>
        <h3 className="text-sm font-bold text-gray-400 mb-3">Recent Calls</h3>
        {loadingHistory ? (
          <div className="space-y-2">
            {[1, 2].map((i) => (
              <div key={i} className="glass rounded-lg p-3 animate-pulse">
                <div className="h-3 bg-gray-800 rounded w-1/2" />
              </div>
            ))}
          </div>
        ) : history.length === 0 ? (
          <p className="text-gray-600 text-sm">No call history yet.</p>
        ) : (
          <div className="space-y-2">
            {history.map((call) => (
              <div key={call.id} className="glass rounded-lg px-4 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2 text-sm">
                  <span className={call.status === 'ended' ? 'text-gray-400' : 'text-purple-400'}>
                    {call.status === 'ended' ? '📞' : '📵'}
                  </span>
                  <span className="text-gray-300">{formatTime(call.started_at)}</span>
                </div>
                <span className="text-xs text-gray-500">
                  {call.duration_seconds ? formatDuration(call.duration_seconds) : call.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
