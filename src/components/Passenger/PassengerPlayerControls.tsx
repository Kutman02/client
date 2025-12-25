import React from "react";
import { Play, Pause, SkipForward, SkipBack } from "lucide-react";
import type { VideoProgress } from "../../types";

const formatTime = (seconds: number): string => {
  if (!seconds || isNaN(seconds)) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
};

interface PassengerPlayerControlsProps {
  playing: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
  onPrevious: () => void;
  trackTitle?: string;
  progress?: VideoProgress;
  onSeek: (percent: number) => void;
  disabled?: boolean;
}

export const PassengerPlayerControls: React.FC<PassengerPlayerControlsProps> = ({
  playing,
  onTogglePlay,
  onNext,
  onPrevious,
  trackTitle,
  progress,
  onSeek,
  disabled = false
}) => {
  const percent = progress?.percent || 0;
  const currentSeconds = progress?.currentTime || 0;
  const totalSeconds = progress?.duration || 0;

  return (
    <div className="bg-linear-to-r from-indigo-600/20 to-blue-600/20 rounded-2xl border border-indigo-500/30 p-6">
      <div className="flex flex-col gap-4">
        {/* Название трека */}
        <div className="text-center">
          <p className="text-white font-bold text-sm truncate">{trackTitle || "Нет трека"}</p>
        </div>

        {/* Прогресс бар */}
        <div className="relative">
          <input
            type="range"
            min="0"
            max="100"
            step="0.1"
            value={percent}
            onChange={(e) => !disabled && onSeek(parseFloat(e.target.value))}
            disabled={disabled}
            className="w-full h-2.5 bg-white/10 rounded-full appearance-none cursor-pointer accent-indigo-500 outline-none disabled:opacity-50 disabled:cursor-not-allowed hover:h-3 transition-all"
            style={{ 
              background: `linear-gradient(to right, #6366f1 ${percent}%, rgba(255,255,255,0.1) ${percent}%)` 
            }}
          />
        </div>

        {/* Время */}
        <div className="flex justify-between items-center text-base font-mono px-1">
          <span className="text-indigo-300 font-bold">{formatTime(currentSeconds)}</span>
          <span className="text-white/70 font-medium">{formatTime(totalSeconds)}</span>
        </div>

        {/* Кнопки управления */}
        <div className="flex items-center justify-center gap-3">
          <button
            onClick={onPrevious}
            disabled={disabled}
            className="p-3.5 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 border border-white/10 hover:border-white/20"
            title="Предыдущий трек"
          >
            <SkipBack size={22} strokeWidth={2.5} />
          </button>

          <button
            onClick={onTogglePlay}
            disabled={disabled}
            className="flex-1 py-4 bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-2xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.97] flex items-center justify-center gap-2 shadow-lg shadow-indigo-900/30"
          >
            {playing ? (
              <>
                <Pause size={20} strokeWidth={2.5} /> ПАУЗА
              </>
            ) : (
              <>
                <Play size={20} fill="white" strokeWidth={0} /> ИГРАТЬ
              </>
            )}
          </button>

          <button
            onClick={onNext}
            disabled={disabled}
            className="p-3.5 bg-white/10 hover:bg-white/20 rounded-2xl text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 border border-white/10 hover:border-white/20"
            title="Следующий трек"
          >
            <SkipForward size={22} strokeWidth={2.5} />
          </button>
        </div>
      </div>
    </div>
  );
};


