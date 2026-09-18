import { useCallback, useEffect, useRef, useState } from 'react';
import { ErrorBoundary } from './ErrorBoundary';

type CallState = 'connecting' | 'waiting' | 'connected' | 'ended';

interface VideoChatProps {
  callId: string;
  initiator: boolean;
  onHangUp?: () => void;
}

function buildWebSocketUrl(callId: string, token: string): string {
  const configuredApiBase =
    import.meta.env.VITE_API_URL || `${window.location.origin}/api/v1`;
  const absoluteApiBase = configuredApiBase.startsWith('http')
    ? configuredApiBase
    : `${window.location.origin}${
        configuredApiBase.startsWith('/') ? '' : '/'
      }${configuredApiBase}`;

  return `${absoluteApiBase.replace(
    /^http/,
    'ws'
  )}/ws/video/${callId}?token=${encodeURIComponent(token)}`;
}

export default function VideoChat({
  callId,
  initiator,
  onHangUp,
}: VideoChatProps) {
  const localVideoRef = useRef<HTMLVideoElement | null>(null);
  const remoteVideoRef = useRef<HTMLVideoElement | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const remoteStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<WebSocket | null>(null);

  const [callState, setCallState] = useState<CallState>('connecting');
  const [micEnabled, setMicEnabled] = useState(true);
  const [cameraEnabled, setCameraEnabled] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [remoteReady, setRemoteReady] = useState(false);

  const stopLocalMedia = useCallback(() => {
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    localStreamRef.current = null;
    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }
  }, []);

  const closeConnections = useCallback(
    (notifyPeer: boolean, triggerCallback: boolean) => {
      if (notifyPeer && socketRef.current?.readyState === WebSocket.OPEN) {
        socketRef.current.send(JSON.stringify({ type: 'hang_up' }));
      }

      socketRef.current?.close();
      socketRef.current = null;

      peerConnectionRef.current?.close();
      peerConnectionRef.current = null;

      remoteStreamRef.current?.getTracks().forEach(track => track.stop());
      remoteStreamRef.current = null;
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }

      stopLocalMedia();
      setCallState('ended');
      if (triggerCallback) {
        onHangUp?.();
      }
    },
    [onHangUp, stopLocalMedia]
  );

  useEffect(() => {
    let cancelled = false;

    async function startCall() {
      const token = localStorage.getItem('access_token');
      if (!token) {
        setError('A valid session is required to start video chat.');
        setCallState('ended');
        return;
      }

      try {
        const localStream = await navigator.mediaDevices.getUserMedia({
          audio: true,
          video: true,
        });
        if (cancelled) {
          localStream.getTracks().forEach(track => track.stop());
          return;
        }

        localStreamRef.current = localStream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = localStream;
        }

        const remoteStream = new MediaStream();
        remoteStreamRef.current = remoteStream;
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
        }

        const peerConnection = new RTCPeerConnection({
          iceServers: [{ urls: 'stun:stun.l.google.com:19302' }],
        });
        peerConnectionRef.current = peerConnection;

        localStream.getTracks().forEach(track => {
          peerConnection.addTrack(track, localStream);
        });

        peerConnection.ontrack = event => {
          const [stream] = event.streams;
          if (stream) {
            stream.getTracks().forEach(track => {
              if (
                !remoteStream
                  .getTracks()
                  .some(existingTrack => existingTrack.id === track.id)
              ) {
                remoteStream.addTrack(track);
              }
            });
          } else {
            remoteStream.addTrack(event.track);
          }
          setRemoteReady(true);
          setCallState('connected');
        };

        peerConnection.onicecandidate = event => {
          if (
            event.candidate &&
            socketRef.current?.readyState === WebSocket.OPEN
          ) {
            socketRef.current.send(
              JSON.stringify({
                type: 'ice_candidate',
                candidate: event.candidate.toJSON(),
              })
            );
          }
        };

        peerConnection.onconnectionstatechange = () => {
          if (peerConnection.connectionState === 'connected') {
            setCallState('connected');
          }

          if (
            peerConnection.connectionState === 'failed' ||
            peerConnection.connectionState === 'disconnected'
          ) {
            setError('The peer-to-peer connection dropped.');
            closeConnections(false, true);
          }
        };

        const socket = new WebSocket(buildWebSocketUrl(callId, token));
        socketRef.current = socket;

        socket.onopen = async () => {
          setCallState(initiator ? 'waiting' : 'connecting');
          if (!initiator) {
            return;
          }

          const offer = await peerConnection.createOffer();
          await peerConnection.setLocalDescription(offer);
          socket.send(
            JSON.stringify({
              type: 'sdp_offer',
              sdp: offer,
            })
          );
        };

        socket.onmessage = async event => {
          const message = JSON.parse(event.data as string) as {
            type: string;
            sdp?: RTCSessionDescriptionInit;
            candidate?: RTCIceCandidateInit;
          };

          if (!peerConnectionRef.current) {
            return;
          }

          switch (message.type) {
            case 'sdp_offer': {
              if (!message.sdp) {
                return;
              }
              await peerConnectionRef.current.setRemoteDescription(message.sdp);
              const answer = await peerConnectionRef.current.createAnswer();
              await peerConnectionRef.current.setLocalDescription(answer);
              socketRef.current?.send(
                JSON.stringify({
                  type: 'sdp_answer',
                  sdp: answer,
                })
              );
              setCallState('waiting');
              break;
            }
            case 'sdp_answer': {
              if (!message.sdp) {
                return;
              }
              await peerConnectionRef.current.setRemoteDescription(message.sdp);
              break;
            }
            case 'ice_candidate': {
              if (!message.candidate) {
                return;
              }
              await peerConnectionRef.current.addIceCandidate(
                message.candidate
              );
              break;
            }
            case 'hang_up': {
              closeConnections(false, true);
              break;
            }
            default:
              break;
          }
        };

        socket.onerror = () => {
          setError('WebSocket signaling failed to connect.');
        };

        socket.onclose = () => {
          if (!cancelled && callState !== 'ended') {
            setCallState('ended');
          }
        };
      } catch (err) {
        console.error(err);
        setError('Unable to access camera or microphone.');
        closeConnections(false, false);
      }
    }

    void startCall();

    return () => {
      cancelled = true;
      closeConnections(false, false);
    };
  }, [callId, closeConnections, initiator]);

  const toggleAudio = useCallback(() => {
    const nextEnabled = !micEnabled;
    localStreamRef.current?.getAudioTracks().forEach(track => {
      track.enabled = nextEnabled;
    });
    setMicEnabled(nextEnabled);
  }, [micEnabled]);

  const toggleVideo = useCallback(() => {
    const nextEnabled = !cameraEnabled;
    localStreamRef.current?.getVideoTracks().forEach(track => {
      track.enabled = nextEnabled;
    });
    setCameraEnabled(nextEnabled);
  }, [cameraEnabled]);

  return (
    <section className="mx-auto flex w-full max-w-6xl flex-col gap-5 rounded-[32px] border border-slate-800 bg-slate-950 p-5 text-slate-100 shadow-[0_35px_140px_rgba(2,6,23,0.6)] md:p-7">
      <div className="flex flex-col gap-3 rounded-[26px] border border-slate-800 bg-[radial-gradient(circle_at_top,_rgba(45,212,191,0.15),_transparent_38%),linear-gradient(180deg,rgba(15,23,42,0.96),rgba(2,6,23,0.96))] p-5 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="text-xs font-semibold uppercase tracking-[0.3em] text-teal-300">
            Live Video
          </div>
          <h2 className="mt-2 text-3xl font-semibold text-white">
            Peer-to-peer WebRTC call
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Signal exchange runs over the matched-user WebSocket relay. Media
            stays on the peer connection.
          </p>
        </div>
        <div className="rounded-2xl border border-slate-800 bg-black/30 px-4 py-3 text-sm">
          <div className="text-slate-400">Call ID</div>
          <div className="mt-1 font-mono text-xs text-slate-200">{callId}</div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-rose-900 bg-rose-950/70 px-4 py-3 text-sm text-rose-200">
          {error}
        </div>
      )}

      <div className="grid gap-5 lg:grid-cols-[0.95fr_1.05fr]">
        <div className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white">Local video</div>
              <div className="text-xs text-slate-500">
                {initiator ? 'Offer initiator' : 'Answerer'}
              </div>
            </div>
            <span className="rounded-full border border-slate-700 bg-slate-950 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-slate-400">
              muted output
            </span>
          </div>
          <div className="overflow-hidden rounded-[24px] border border-slate-800 bg-black">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="aspect-video w-full object-cover"
            />
          </div>
        </div>

        <div className="rounded-[28px] border border-slate-800 bg-slate-900/70 p-4">
          <div className="mb-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium text-white">Remote video</div>
              <div className="text-xs text-slate-500">
                {remoteReady
                  ? 'Peer connected'
                  : 'Waiting for the other matched user'}
              </div>
            </div>
            <span className="rounded-full border border-teal-900/80 bg-teal-950/70 px-3 py-1 text-[11px] uppercase tracking-[0.18em] text-teal-300">
              {callState}
            </span>
          </div>
          <div className="relative overflow-hidden rounded-[24px] border border-slate-800 bg-black">
            <video
              ref={remoteVideoRef}
              autoPlay
              playsInline
              className="aspect-video w-full object-cover"
            />
            {!remoteReady && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-950/75 text-center">
                <div className="text-lg font-medium text-white">
                  {callState === 'waiting'
                    ? 'Offer sent. Waiting for answer.'
                    : 'Waiting for peer media.'}
                </div>
                <p className="mt-2 max-w-sm text-sm text-slate-400">
                  The signaling channel is connected. Once the second user joins
                  this call, the remote stream appears here.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-3 rounded-[26px] border border-slate-800 bg-slate-900/60 p-4 md:flex-row md:items-center md:justify-between">
        <div className="flex flex-wrap gap-3">
          <button
            type="button"
            onClick={toggleAudio}
            className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
              micEnabled
                ? 'bg-slate-800 text-white hover:bg-slate-700'
                : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
            }`}
          >
            {micEnabled ? 'Mute mic' : 'Unmute mic'}
          </button>
          <button
            type="button"
            onClick={toggleVideo}
            className={`rounded-2xl px-4 py-3 text-sm font-medium transition ${
              cameraEnabled
                ? 'bg-slate-800 text-white hover:bg-slate-700'
                : 'bg-amber-500 text-slate-950 hover:bg-amber-400'
            }`}
          >
            {cameraEnabled ? 'Turn camera off' : 'Turn camera on'}
          </button>
        </div>

        <button
          type="button"
          onClick={() => closeConnections(true, true)}
          className="rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-500"
        >
          Hang up
        </button>
      </div>
    </section>
  );
}
