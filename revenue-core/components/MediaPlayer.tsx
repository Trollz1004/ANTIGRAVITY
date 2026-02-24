import React, { useRef, useEffect, useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Maximize2, Minimize2, Video } from 'lucide-react';
import { MediaTrack } from '../types';

interface MediaPlayerProps {
  currentTrack: MediaTrack | null;
  isPlaying: boolean;
  onPlayPause: () => void;
  onNext: () => void;
  onPrev: () => void;
  minimized: boolean;
  onToggleMinimize: () => void;
}

const MediaPlayer: React.FC<MediaPlayerProps> = ({
  currentTrack,
  isPlaying,
  onPlayPause,
  onNext,
  onPrev,
  minimized,
  onToggleMinimize
}) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.play().catch(e => console.error("Playback error", e));
      } else {
        videoRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  const handleTimeUpdate = () => {
    if (videoRef.current) {
      const current = videoRef.current.currentTime;
      const total = videoRef.current.duration;
      setProgress((current / total) * 100);
    }
  };

  if (!currentTrack) return null;

  return (
    <div 
      className={`fixed bottom-4 right-4 bg-surface border border-slate-700 shadow-2xl rounded-xl overflow-hidden transition-all duration-300 z-50 ${minimized ? 'w-64 h-16' : 'w-80'}`}
    >
      {/* Video/Visualizer Area */}
      {!minimized && (
        <div className="relative h-48 bg-black group">
          <video
            ref={videoRef}
            src={currentTrack.url}
            className="w-full h-full object-cover opacity-80"
            onTimeUpdate={handleTimeUpdate}
            onEnded={onNext}
            loop={false}
            playsInline
          />
          <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-black/40">
             {currentTrack.type === 'video' ? <Video className="w-8 h-8 text-white" /> : <div className="animate-pulse w-12 h-12 rounded-full bg-primary/20"></div>}
          </div>
        </div>
      )}

      {/* Hidden Audio element for 'audio' tracks if we didn't want visual, but using video element for both for simplicity */}

      {/* Controls */}
      <div className="p-4 flex flex-col justify-center h-full relative">
        {/* Progress Bar (Only visible when not minimized) */}
        {!minimized && (
          <div className="w-full h-1 bg-slate-700 rounded-full mb-3 cursor-pointer">
            <div 
              className="h-full bg-primary rounded-full transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}

        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0 pr-2">
            <h4 className="text-sm font-bold text-white truncate">{currentTrack.title}</h4>
            <p className="text-xs text-slate-400 truncate">{currentTrack.artist}</p>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={onPrev} className="text-slate-400 hover:text-white p-1">
              <SkipBack size={16} />
            </button>
            <button 
              onClick={onPlayPause} 
              className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center hover:bg-indigo-600 transition-colors"
            >
              {isPlaying ? <Pause size={16} /> : <Play size={16} />}
            </button>
            <button onClick={onNext} className="text-slate-400 hover:text-white p-1">
              <SkipForward size={16} />
            </button>
          </div>
        </div>
        
        <button 
          onClick={onToggleMinimize}
          className="absolute top-2 right-2 text-slate-500 hover:text-white"
        >
          {minimized ? <Maximize2 size={12} /> : <Minimize2 size={12} />}
        </button>
      </div>
    </div>
  );
};

export default MediaPlayer;