import React from "react";
import { Play, Pause, SkipForward } from "lucide-react";
import { cn } from "../../lib/utils";
import type { VideoProgress } from "../../types";

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

interface ExternalPlayerControlsProps {
  playing: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  trackTitle?: string;
  progress?: VideoProgress;
  onSeek: (percent: number) => void;
  autoplay: boolean;
  onToggleAutoplay: (value: boolean) => void;
}

export const ExternalPlayerControls: React.FC<ExternalPlayerControlsProps> = ({ 
  playing, 
  onTogglePlay, 
  onNext, 
  trackTitle, 
  progress, 
  onSeek,
  autoplay,
  onToggleAutoplay 
}) => {
  const percent = progress?.percent || 0;
  const currentSeconds = progress?.currentTime || 0;
  const totalSeconds = progress?.duration || 0;

  return (
    <div className={cn("rounded-none")}>
      <div className="flex flex-col gap-5">
        <div className="flex justify-between items-center px-2">
          <div className="flex-1 truncate text-white mr-4">
            <p className="font-bold truncate text-sm">{trackTitle || "Без названия"}</p>
          </div>

          <div className="flex items-center gap-4">
            {/* Кнопка Автоплея */}
            <label className="flex items-center gap-2 cursor-pointer group">
              <span className={cn(
                "text-[10px] font-black uppercase tracking-widest transition-colors",
                autoplay ? "text-blue-500" : "text-white/30 group-hover:text-white/50"
              )}>
                Автоплей
              </span>
              <input 
                type="checkbox" 
                className="hidden" 
                checked={autoplay} 
                onChange={(e) => onToggleAutoplay(e.target.checked)} 
              />
              <div className={cn(
                "w-4 h-4 border-2 transition-all flex items-center justify-center",
                autoplay ? "border-blue-500 bg-blue-500" : "border-white/20"
              )}>
                {autoplay && <div className="w-1.5 h-1.5 bg-white" />}
              </div>
            </label>

            <div className="text-white font-mono text-xs flex items-center gap-1">
              <span className="text-blue-400">{formatTime(currentSeconds)}</span>
              <span className="text-white/20">/</span>
              <span className="text-white/50">{formatTime(totalSeconds)}</span>
            </div>
          </div>
        </div>

        <div className="relative group px-2">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={percent}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500 outline-none hover:h-2.5 transition-all"
            style={{ 
              background: `linear-gradient(to right, #6366f1 ${percent}%, rgba(255,255,255,0.1) ${percent}%)` 
            }}
          />
        </div>

        <div className="flex gap-3">
          <button 
            onClick={onTogglePlay} 
            className="flex-1 py-4 rounded-2xl font-bold text-lg bg-linear-to-r from-indigo-600 to-blue-600 text-white hover:from-indigo-500 hover:to-blue-500 active:scale-[0.97] transition-all flex items-center justify-center gap-3 shadow-lg shadow-indigo-900/30"
          >
            {playing ? (
              <><Pause size={22} strokeWidth={2.5} /> ПАУЗА</>
            ) : (
              <><Play size={22} fill="white" strokeWidth={0} /> ИГРАТЬ</>
            )}
          </button>

          <button 
            onClick={onNext} 
            className="px-8 py-4 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-bold active:scale-[0.97] transition-all flex items-center justify-center border border-white/10"
            title="Следующий трек"
          >
            <SkipForward size={24} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};