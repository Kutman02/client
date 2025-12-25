import React from "react";
import type { YouTubeVideo } from "../../types";

interface SearchResultsProps {
  results: YouTubeVideo[];
  onAddTrack: (video: YouTubeVideo) => void | Promise<boolean>;
}

export const SearchResults: React.FC<SearchResultsProps> = ({ results, onAddTrack }) => {
  if (!results.length) return null;
  
  return (
    <div className="mt-6 space-y-3">
      {results.map((v) => (
        <div 
          key={v.id.videoId} 
          onClick={() => onAddTrack(v)} 
          className="flex gap-4 bg-white/5 p-3 rounded-2xl border border-white/10 hover:bg-white/20 cursor-pointer transition-all active:scale-[0.98]"
        >
          <img 
            src={v.snippet.thumbnails.default.url} 
            className="w-14 h-14 rounded-xl object-cover" 
            alt={v.snippet.title} 
          />
          <div className="flex-1 min-w-0 flex flex-col justify-center">
            <p className="text-white font-bold text-sm truncate">{v.snippet.title}</p>
            <p className="text-white/40 text-xs truncate">{v.snippet.channelTitle}</p>
          </div>
          <div className="flex items-center pr-2 text-blue-400 text-2xl">＋</div>
        </div>
      ))}
    </div>
  );
};