import React from "react";
import { PlaylistItem } from "./PlaylistItem";
import type { Track } from "../../types";

interface PlaylistProps {
  playlist: Track[];
  onMove: (fromIndex: number, toIndex: number) => void;
  onRemove: (index: number) => void;
}

export const Playlist: React.FC<PlaylistProps> = ({ playlist, onMove, onRemove }) => {
  return (
    <div className="bg-white/10 backdrop-blur-xl rounded-3xl p-6 md:p-8 border border-white/20">
      <div className="flex items-center gap-2 mb-6">
        <h2 className="text-white font-black text-lg uppercase tracking-wider">📻 Очередь</h2>
        <span className="bg-blue-600 text-white text-xs font-bold px-3 py-1 rounded-full">
          {playlist.length}
        </span>
      </div>

      {playlist.length > 0 ? (
        <div className="space-y-3 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
          {playlist.map((track, index) => (
            <PlaylistItem 
              key={`${track.videoId}-${index}`} 
              track={track} 
              index={index} 
              total={playlist.length}
              onMove={onMove}
              onRemove={onRemove}
            />
          ))}
        </div>
      ) : (
        <div className="text-center py-12">
          <p className="text-white/40 text-lg font-bold uppercase tracking-widest">📭 Очередь пуста</p>
        </div>
      )}
    </div>
  );
};