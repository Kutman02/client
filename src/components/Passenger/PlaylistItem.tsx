import React from "react";
import type { Track } from "../../types";

interface PlaylistItemProps {
  track: Track;
  index: number;
  total: number;
  onMove: (fromIndex: number, toIndex: number) => void;
  onRemove: (index: number) => void;
}

export const PlaylistItem: React.FC<PlaylistItemProps> = ({ track, index, total, onMove, onRemove }) => {
  return (
    <div className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/15 transition-all group">
      {/* Номер трека */}
      <span className="text-blue-400 font-black text-lg min-w-[28px]">
        {String(index + 1).padStart(2, '0')}
      </span>

      {/* Название */}
      <div className="flex-1 min-w-0">
        <p className="text-white font-bold text-sm truncate uppercase tracking-tight">
          {track.title || "YouTube Video"}
        </p>
      </div>
      
      {/* Кнопки управления */}
      <div className="flex items-center gap-1">
        {index > 0 && (
          <button 
            onClick={() => onMove(index, index - 1)} 
            className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-125 text-xl"
            title="Вверх"
          >
            ⬆️
          </button>
        )}
        {index < total - 1 && (
          <button 
            onClick={() => onMove(index, index + 1)} 
            className="p-2 hover:bg-white/10 rounded-full transition-all active:scale-125 text-xl"
            title="Вниз"
          >
            ⬇️
          </button>
        )}
        <button 
          onClick={() => onRemove(index)} 
          className="p-2 ml-1 text-red-400 hover:text-red-300 hover:bg-red-500/10 rounded-full transition-all active:scale-90 text-lg"
          title="Удалить"
        >
          ✕
        </button>
      </div>
    </div>
  );
};