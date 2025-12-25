import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { FaPlus, FaCheck, FaSearch, FaTimes } from "react-icons/fa";
import type { YouTubeVideo, Track } from "../../types";

const YOUTUBE_KEY = import.meta.env.VITE_YOUTUBE_KEY;

/* =======================
   SearchResultItem
   ======================= */
interface SearchResultItemProps {
  video: YouTubeVideo;
  onAdd: (track: Omit<Track, '_id' | 'id'>) => Promise<boolean>;
  isAccessCodeVerified: boolean;
  closeSearch: () => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ 
  video, 
  onAdd, 
  isAccessCodeVerified, 
  closeSearch 
}) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>("idle");

  const handleAdd = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.stopPropagation();
    if (!isAccessCodeVerified || status === "loading") return;

    setStatus("loading");

    // ✅ НОРМАЛИЗАЦИЯ ДАННЫХ
    const payload: Omit<Track, '_id' | 'id'> = {
      videoId: video.id?.videoId || '',
      title: video.snippet?.title || '',
      thumbnail: video.snippet?.thumbnails?.default?.url || '',
    };

    // защитный чек (на будущее)
    if (!payload.videoId || !payload.title) {
      console.error("❌ Некорректные данные видео:", payload);
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
      return;
    }

    const success = await onAdd(payload);

    if (success) {
      setStatus("success");
      setTimeout(() => {
        setStatus("idle");
        closeSearch();
      }, 1200);
    } else {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  return (
    <div className="flex items-center gap-2 p-1.5 hover:bg-white/5 rounded-xl transition-all border-b border-white/3 last:border-none group">
      <img
        src={video.snippet.thumbnails.default.url}
        className="w-8 h-8 rounded-lg object-cover"
        alt={video.snippet.title}
      />

      <div className="flex-1 min-w-0">
        <p className="text-white text-[11px] font-bold truncate leading-tight uppercase">
          {video.snippet.title}
        </p>
        <p className="text-white/40 text-[9px] truncate uppercase font-medium">
          {video.snippet.channelTitle}
        </p>
      </div>

      <button
        onClick={handleAdd}
        className={`w-7 h-7 rounded-full flex items-center justify-center transition-all ${
          status === "success"
            ? "bg-green-500 text-white"
            : "bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600 hover:text-white"
        }`}
      >
        {status === "loading" ? (
          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : status === "success" ? (
          <FaCheck size={10} />
        ) : (
          <FaPlus size={10} />
        )}
      </button>
    </div>
  );
};

/* =======================
   PassengerSearch
   ======================= */
interface PassengerSearchProps {
  isAccessCodeVerified: boolean;
  onTrackAdded: (track: Omit<Track, '_id' | 'id'>) => Promise<boolean>;
}

const PassengerSearch: React.FC<PassengerSearchProps> = ({ isAccessCodeVerified, onTrackAdded }) => {
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setResults([]);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = async (): Promise<void> => {
    if (!query.trim() || isLoading) return;

    setIsLoading(true);
    try {
      const res = await axios.get<{ items: YouTubeVideo[] }>("https://www.googleapis.com/youtube/v3/search", {
        params: {
          q: query,
          part: "snippet",
          maxResults: 6,
          type: "video",
          videoCategoryId: "10",
          key: YOUTUBE_KEY,
        },
      });

      setResults(res.data.items || []);
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div ref={searchRef} className="relative w-full">
      <div
        className={`flex items-center bg-[#1a1a1a] border border-white/10 pl-3 pr-1.5 h-11 transition-all shadow-xl ${
          results.length > 0
            ? "rounded-t-xl border-b-indigo-500/50"
            : "rounded-xl"
        }`}
      >
        <FaSearch className="text-white/20 mr-2" size={12} />

        <input
          className="flex-1 bg-transparent border-none outline-none text-white text-xs placeholder-white/20 font-medium"
          placeholder="Поиск музыки..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSearch()}
        />

        <div className="flex items-center gap-1">
          {query && (
            <button
              onClick={() => {
                setQuery("");
                setResults([]);
              }}
              className="p-1.5 text-white/20 hover:text-white"
            >
              <FaTimes size={12} />
            </button>
          )}

          <button
            onClick={handleSearch}
            disabled={isLoading}
            className="h-8 px-4 bg-linear-to-r from-indigo-600 to-blue-600 text-white rounded-lg text-[10px] font-bold uppercase tracking-wider hover:from-indigo-500 hover:to-blue-500 transition-all active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isLoading ? (
              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
            ) : (
              "Найти"
            )}
          </button>
        </div>
      </div>

      {results.length > 0 && (
        <div className="absolute top-full left-0 right-0 bg-[#1a1a1a] border border-white/10 border-t-0 rounded-b-xl shadow-2xl z-150 overflow-hidden">
          <div className="max-h-[280px] overflow-y-auto p-1 custom-scrollbar">
            {results.map((v) => (
              <SearchResultItem
                key={v.id.videoId}
                video={v}
                onAdd={onTrackAdded}
                isAccessCodeVerified={isAccessCodeVerified}
                closeSearch={() => setResults([])}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PassengerSearch;
