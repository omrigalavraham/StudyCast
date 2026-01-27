
import React, { useEffect, useRef, useState } from 'react';
import { createWavUrl } from '../utils/audioUtils';

interface AudioPlayerProps {
  base64Audio: string;
  audioGeneratedDate?: string;
  onProgressUpdate?: (currentTime: number, duration: number) => void;
  onRegenerate?: () => void;
  isRegenerating?: boolean;
}

export const AudioPlayer: React.FC<AudioPlayerProps> = ({ base64Audio, audioGeneratedDate, onProgressUpdate, onRegenerate, isRegenerating = false }) => {
  const audioRef = useRef<HTMLAudioElement>(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [playbackRate, setPlaybackRate] = useState(1.0);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  useEffect(() => {
    // Track the URL created in this effect to ensure proper cleanup
    let currentUrl: string | null = null;

    if (base64Audio) {
      currentUrl = createWavUrl(base64Audio, 24000);
      if (currentUrl) {
        setAudioUrl(currentUrl);
      } else {
        console.warn("AudioPlayer: Failed to create audio URL (corrupted data?)");
        setAudioUrl(null);
      }
    } else {
      setAudioUrl(null);
    }

    // Cleanup: always revoke the URL created in THIS effect run
    return () => {
      if (currentUrl) {
        URL.revokeObjectURL(currentUrl);
      }
    };
  }, [base64Audio]);

  useEffect(() => {
    if (audioRef.current) audioRef.current.playbackRate = playbackRate;
  }, [playbackRate]);

  const togglePlay = () => {
    if (!audioRef.current) return;
    if (isPlaying) audioRef.current.pause();
    else audioRef.current.play();
  };

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const curr = audioRef.current.currentTime;
      const dur = audioRef.current.duration;
      setCurrentTime(curr);
      if (dur > 0) {
        const pct = (curr / dur) * 100;
        setProgress(pct);
        if (onProgressUpdate) onProgressUpdate(curr, dur);
      }
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) setDuration(audioRef.current.duration);
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setProgress(100);
    if (audioRef.current && onProgressUpdate) onProgressUpdate(audioRef.current.duration, audioRef.current.duration);
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = Number(e.target.value);
    if (audioRef.current && duration > 0) {
      const time = (val / 100) * duration;
      audioRef.current.currentTime = time;
      setProgress(val);
      setCurrentTime(time);
      if (onProgressUpdate) onProgressUpdate(time, duration);
    }
  };

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = Math.floor(seconds % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const speeds = [0.75, 1, 1.25, 1.5, 2];

  // Check for error state: base64 provided but valid URL not created
  if (base64Audio && audioUrl === null) {
    return (
      <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-3xl p-6 text-center">
        <div className="w-16 h-16 bg-red-100 dark:bg-red-800/50 rounded-full flex items-center justify-center mx-auto mb-4 text-red-500 dark:text-red-300">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />
          </svg>
        </div>
        <h3 className="text-lg font-bold text-red-800 dark:text-red-200 mb-2">שגיאה בטעינת הפודקאסט</h3>
        <p className="text-red-600 dark:text-red-300 text-sm mb-6">קובץ האודיו פגום. אנא צור אותו מחדש.</p>
        {onRegenerate && (
          <button
            onClick={onRegenerate}
            disabled={isRegenerating}
            className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-xl font-bold shadow-lg shadow-red-500/30 transition-all hover:scale-105 flex items-center gap-2 mx-auto disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100"
          >
            {isRegenerating ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                יוצר...
              </>
            ) : (
              <>
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
                צור מחדש
              </>
            )}
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="relative overflow-hidden bg-white/10 dark:bg-black/20 backdrop-blur-2xl rounded-3xl border border-white/20 shadow-2xl p-6 group">
      {/* Dynamic Background Glow */}
      <div className={`absolute top-0 right-0 w-64 h-64 bg-indigo-500/20 rounded-full blur-[80px] transition-opacity duration-1000 pointer-events-none ${isPlaying ? 'opacity-100 animate-pulse' : 'opacity-30'}`}></div>
      <div className={`absolute bottom-0 left-0 w-64 h-64 bg-purple-500/20 rounded-full blur-[80px] transition-opacity duration-1000 pointer-events-none ${isPlaying ? 'opacity-100 animate-pulse delay-700' : 'opacity-30'}`}></div>

      <audio
        ref={audioRef}
        src={audioUrl || undefined}
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onPlay={() => setIsPlaying(true)}
        onPause={() => setIsPlaying(false)}
        className="hidden"
      />

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/30">
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 9l10.5-3m0 6.553v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 11-.99-3.467l2.31-.66a2.25 2.25 0 001.632-2.163zm0 0V2.25L9 5.25v10.303m0 0v3.75a2.25 2.25 0 01-1.632 2.163l-1.32.377a1.803 1.803 0 01-.99-3.467l2.31-.66A2.25 2.25 0 009 15.553z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-black text-slate-800 dark:text-white leading-tight">StudyCast</h3>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest">AI Podcast</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={isRegenerating}
              className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-white/50 rounded-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
              title={isRegenerating ? "יוצר פודקאסט..." : "צור מחדש"}
            >
              {isRegenerating ? (
                <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0l3.181 3.183a8.25 8.25 0 0013.803-3.7M4.031 9.865a8.25 8.25 0 0113.803-3.7l3.181 3.182m0-4.991v4.99" />
                </svg>
              )}
            </button>
          )}
          {audioUrl && (
            <a
              href={audioUrl}
              download="studycast-episode.wav"
              className="p-2 text-slate-400 hover:text-indigo-500 hover:bg-white/50 rounded-lg transition-all"
              title="הורד פרק"
            >
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" />
              </svg>
            </a>
          )}
        </div>
      </div>

      {/* Main Player Display */}
      <div className="relative z-10 flex flex-col items-center justify-center mb-8">
        {/* Play Button with Rings */}
        <div className="relative group/play">
          {/* Pulsing Rings */}
          <div className={`absolute inset-0 bg-indigo-500/30 rounded-full blur-xl transition-all duration-1000 ${isPlaying ? 'scale-150 opacity-100' : 'scale-100 opacity-0'}`}></div>
          <div className={`absolute inset-0 bg-purple-500/30 rounded-full blur-xl transition-all duration-1000 delay-100 ${isPlaying ? 'scale-125 opacity-100' : 'scale-90 opacity-0'}`}></div>

          <button
            onClick={togglePlay}
            disabled={!audioUrl}
            className={`
                    relative w-24 h-24 rounded-full flex items-center justify-center 
                    bg-gradient-to-br from-indigo-500 to-purple-600 
                    text-white shadow-2xl shadow-indigo-500/40 
                    transition-all duration-300 hover:scale-105 active:scale-95
                    ${!audioUrl ? 'opacity-50 grayscale cursor-not-allowed' : ''}
                `}
          >
            {isPlaying ? (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-10 h-10">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 5.25v13.5m-7.5-13.5v13.5" />
              </svg>
            ) : (
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2.5} stroke="currentColor" className="w-10 h-10 ml-1.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5.25 5.653c0-.856.917-1.398 1.667-.986l11.54 6.348a1.125 1.125 0 010 1.971l-11.54 6.347a1.125 1.125 0 01-1.667-.985V5.653z" />
              </svg>
            )}
          </button>
        </div>

        {/* Visualizer Effect (Fake) */}
        <div className="flex items-end justify-center gap-1 h-8 mt-6 opacity-80">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className={`w-1 bg-gradient-to-t from-indigo-500 to-purple-500 rounded-full transition-all duration-300 ease-in-out`}
              style={{
                height: isPlaying ? `${Math.max(20, Math.random() * 100)}%` : '20%',
                opacity: isPlaying ? 1 : 0.3
              }}
            ></div>
          ))}
        </div>
      </div>

      {/* Progress & Speed */}
      <div className="relative z-10 space-y-4">
        {/* Scrubber */}
        <div className="group/scrubber relative h-2">
          <div className="absolute inset-0 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-indigo-500 to-purple-600 transition-all duration-100 ease-linear relative"
              style={{ width: `${progress}%` }}
            >
              <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-white shadow-md rounded-full scale-0 group-hover/scrubber:scale-100 transition-transform"></div>
            </div>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={handleSeek}
            disabled={!audioUrl}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        <div className="flex justify-between items-center text-xs font-bold text-slate-400 font-mono">
          <span>{formatTime(currentTime)}</span>
          <div className="flex gap-1.5 bg-slate-100 dark:bg-slate-800/50 p-1 rounded-lg">
            {speeds.map((rate) => (
              <button
                key={rate}
                onClick={() => setPlaybackRate(rate)}
                className={`px-1.5 py-0.5 rounded transition-colors
                        ${playbackRate === rate
                    ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-300 shadow-sm'
                    : 'hover:bg-gray-200 dark:hover:bg-slate-700'
                  }
                    `}
              >
                {rate}x
              </button>
            ))}
          </div>
          <span>{formatTime(duration)}</span>
        </div>
      </div>
      {/* Premium Liquid Ring Generation Overlay */}
      {isRegenerating && (
        <div className="absolute inset-0 z-50 flex items-center justify-center bg-white/40 dark:bg-slate-900/60 backdrop-blur-xl rounded-3xl transition-all duration-700">
          <style>{`
            @keyframes liquid-dash {
              0% { stroke-dasharray: 1, 200; stroke-dashoffset: 0; }
              50% { stroke-dasharray: 89, 200; stroke-dashoffset: -35px; }
              100% { stroke-dasharray: 89, 200; stroke-dashoffset: -124px; }
            }
          `}</style>

          <div className="relative w-28 h-28">
            {/* Base Glow */}
            <div className="absolute inset-0 bg-indigo-500/10 rounded-full blur-2xl animate-pulse"></div>

            <svg className="w-full h-full animate-[spin_3s_linear_infinite]" viewBox="0 0 100 100">
              <defs>
                <linearGradient id="liquidGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#6366f1" />
                  <stop offset="50%" stopColor="#ec4899" />
                  <stop offset="100%" stopColor="#8b5cf6" />
                </linearGradient>
              </defs>

              {/* Track Ring (Thin) */}
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="currentColor"
                strokeWidth="1"
                className="text-white/20 dark:text-white/10"
              />

              {/* Liquid Fill Ring */}
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="url(#liquidGradient)"
                strokeWidth="3"
                strokeLinecap="round"
                style={{
                  animation: 'liquid-dash 2s ease-in-out infinite'
                }}
              />
            </svg>

            {/* Center Minimal Icon */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-indigo-600 dark:text-indigo-300 drop-shadow-lg animate-pulse">
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-8 h-8">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 15.75a3 3 0 01-3-3V4.5a3 3 0 116 0v8.25a3 3 0 01-3 3z" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};