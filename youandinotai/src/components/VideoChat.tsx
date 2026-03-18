/**
 * VideoChat — video call UI shell for matched users.
 * Wires to video.py backend:
 *   POST /api/v1/video/call/{matchId}/initiate
 *   POST /api/v1/video/call/{callId}/end
 *   GET  /api/v1/video/call/{matchId}/history
 *
 * Integrated with Daily.co WebRTC via /video/rooms/{matchId} endpoint.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import DailyIframe from '@daily-co/daily-js';
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

interface VideoRoomData {
  room_url: string;
  room_name: string;
  is_mock?: boolean;
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
  const [roomUrl, setRoomUrl] = useState<string | null>(null);
  
  const timerRef = useRef<number | null>(null);
  const videoContainerRef = useRef<HTMLDivElement>(null);
  const callFrameRef = useRef<any>(null);

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

  // ── Daily.co Event Handlers ──────────────────────────────────────────────

  const handleJoinedMeeting = useCallback(() => {
    setCallStatus('connected');
    setElapsed(0);
  }, []);

  const handleLeftMeeting = useCallback(() => {
    setCallStatus('ended');
    setRoomUrl(null);
  }, []);

  // ── Start call ───────────────────────────────────────────────────────────

  const startCall = async () => {
    setError(null);
    setCallStatus('calling');
    try {
      // 1. Get/Create Daily.co room
      const room = await api.post<VideoRoomData>(`/video/rooms/${matchId}`);
      setRoomUrl(room.room_url);

      // 2. Initiate call state in backend
      const call = await api.post<VideoCallData>(`/video/call/${matchId}/initiate`);
      setActiveCallId(call.id);

      // 3. Initialize Daily.co iframe
      if (videoContainerRef.current) {
        const frame = DailyIframe.createFrame(videoContainerRef.current, {
          iframeStyle: {
            width: '100%',
            height: '100%',
            border: '0',
            borderRadius: '1rem',
          },
          showLeaveButton: true,
          theme: {
            colors: {
              accent: '#9333ea',
              accentText: '#ffffff',
              background: '#111827',
              backgroundAccent: '#1f2937',
              baseText: '#ffffff',
              border: '#374151',
              mainAreaBg: '#111827',
              mainAreaBgAccent: '#1f2937',
              mainAreaText: '#ffffff',
              supportiveText: '#9ca3af',
            },
          },
        });
        
        callFrameRef.current = frame;
        
        frame.on('joined-meeting', handleJoinedMeeting);
        frame.on('left-meeting', handleLeftMeeting);
        frame.on('error', (e) => {
          console.error('Daily error:', e);
          setError('Video connection error.');
        });

        await frame.join({ url: room.room_url });
      } else {
        // Fallback if ref is missing
        setCallStatus('connected');
        setElapsed(0);
      }

    } catch (err: any) {
      console.error('Start call error:', err);
      setError('Failed to start call. Check Daily.co API configuration.');
      setCallStatus('idle');
    }
  };

  // ── End call ─────────────────────────────────────────────────────────────

  const endCall = async () => {
    if (callFrameRef.current) {
      await callFrameRef.current.leave();
      await callFrameRef.current.destroy();
      callFrameRef.current = null;
    }

    if (activeCallId) {
      try {
        await api.post(`/video/call/${activeCallId}/end`);
      } catch {
        // best-effort
      }
    }

    setCallStatus('ended');
    setActiveCallId(null);
    setRoomUrl(null);
    if (timerRef.current) window.clearInterval(timerRef.current);
    fetchHistory();
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (callFrameRef.current) {
        callFrameRef.current.destroy();
      }
    };
  }, []);

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

      {/* Video frames container */}
      <div 
        ref={videoContainerRef}
        className="relative aspect-video glass-strong rounded-2xl overflow-hidden"
      >
        {/* Placeholder UI when not connected */}
        {(callStatus === 'idle' || callStatus === 'calling' || callStatus === 'ended') && !roomUrl && (
          <div className="absolute inset-0 flex items-center justify-center">
            {callStatus === 'idle' ? (
              <div className="text-center space-y-3">
                <p className="text-4xl">📞</p>
                <p className="text-gray-400 text-sm">Ready to connect via Daily.co</p>
              </div>
            ) : callStatus === 'calling' ? (
              <div className="text-center space-y-3 animate-pulse">
                <p className="text-4xl">🔔</p>
                <p className="text-purple-400 text-sm font-medium">Initializing Room...</p>
              </div>
            ) : (
              <div className="text-center space-y-3">
                <p className="text-4xl">✅</p>
                <p className="text-gray-400 text-sm">Call ended — {formatDuration(elapsed)}</p>
              </div>
            )}
          </div>
        )}

        {/* Connected indicator overlaid on iframe if possible, or shown via status */}
        {callStatus === 'connected' && (
          <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 glass rounded-full px-3 py-1">
            <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-[10px] text-green-400 font-medium">LIVE • {formatDuration(elapsed)}</span>
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
