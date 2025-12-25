import { useState, useRef, useEffect } from "react";
import axios from "axios";
import { FaPlus, FaCheck, FaSearch, FaTimes,  } from "react-icons/fa";
import type { YouTubeVideo, Track } from "../../types";

const YOUTUBE_KEY = import.meta.env.VITE_YOUTUBE_KEY;

/* =======================
   SearchResultItem
   ======================= */
interface SearchResultItemProps {
  video: YouTubeVideo;
  onAdd: (track: Omit<Track, '_id' | 'id'>) => Promise<boolean>;
  isAccessCodeAvailable: boolean;
  closeSearch: () => void;
}

const SearchResultItem: React.FC<SearchResultItemProps> = ({ 
  video, 
  onAdd, 
  isAccessCodeAvailable, 
  closeSearch 
}) => {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>("idle");

  const handleAdd = async (e: React.MouseEvent<HTMLButtonElement>): Promise<void> => {
    e.stopPropagation();
    if (!isAccessCodeAvailable || status === "loading") return;

    setStatus("loading");

    // 🔥 ТОЧНО ТАК ЖЕ, КАК В PASSENGER
    const success = await onAdd({
      videoId: video.id.videoId,
      title: video.snippet.title,
      thumbnail: video.snippet.thumbnails.default.url,
    });

    if (success) {
      setStatus("success");
      setTimeout(() => {
        setStatus("idle");
        closeSearch();
      }, 1500);
    } else {
      setStatus("error");
      setTimeout(() => setStatus("idle"), 2000);
    }
  };

  return (
    <div className="flex items-center gap-3 p-2 hover:bg-white/5 rounded-xl transition-colors border-b border-white/5 last:border-none">
      <img
        src={video.snippet.thumbnails.default.url}
        className="w-10 h-10 rounded-lg object-cover"
        alt={video.snippet.title}
      />

      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-bold truncate uppercase tracking-tight">
          {video.snippet.title}
        </p>
        <p className="text-white/40 text-[9px] truncate uppercase">
          {video.snippet.channelTitle}
        </p>
      </div>

      <button
        onClick={handleAdd}
        className={`w-8 h-8 rounded-full flex items-center justify-center transition-all ${
          status === "success"
            ? "bg-green-500 text-white"
            : "bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white"
        }`}
      >
        {status === "loading" ? (
          <div className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
        ) : status === "success" ? (
          <FaCheck size={12} />
        ) : (
          <FaPlus size={12} />
        )}
      </button>
    </div>
  );
};

/* =======================
   DriverSearch
   ======================= */
interface DriverSearchProps {
  username: string | null;
  onTrackAdded: (track: Omit<Track, '_id' | 'id'>) => Promise<boolean>;
}

const DriverSearch: React.FC<DriverSearchProps> = ({ username, onTrackAdded }) => {
  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [query, setQuery] = useState<string>("");
  const [results, setResults] = useState<YouTubeVideo[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const searchRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // закрытие при клике вне поиска
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent): void => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setResults([]);
        setQuery("");
      }
    };
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
      // Фокус на инпут при открытии
      setTimeout(() => {
        if (inputRef.current) inputRef.current.focus();
      }, 100);
    }
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  const handleSearch = async (): Promise<void> => {
    if (!query.trim() || isLoading) return;

    if (inputRef.current) inputRef.current.blur();

    setIsLoading(true);
    try {
      const res = await axios.get<{ items: YouTubeVideo[] }>(
        "https://www.googleapis.com/youtube/v3/search",
        {
          params: {
            q: query,
            part: "snippet",
            maxResults: 6,
            type: "video",
            videoCategoryId: "10",
            key: YOUTUBE_KEY,
          },
        }
      );

      setResults(res.data.items || []);
    } catch (err) {
      console.error("YouTube search error:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = (): void => {
    setIsOpen(false);
    setResults([]);
    setQuery("");
  };

  return (
    <>
      {/* Кнопка для открытия поиска */}
      <button
        onClick={() => setIsOpen(true)}
        className="w-14 h-14 flex items-center justify-center bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-full transition-all shadow-lg shadow-blue-900/30 active:scale-95 hover:scale-105"
        title="Добавить музыку"
      >
        <FaSearch size={20} />
      </button>

      {/* Модальное окно поиска */}
      {isOpen && (
        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-200 flex items-start justify-center p-4 pt-20">
          <div
            ref={searchRef}
            className="w-full max-w-2xl bg-[#1a1a1a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
          >
            {/* Заголовок */}
            <div className="flex items-center justify-between p-4 border-b border-white/10">
              <h3 className="text-white font-bold text-lg">Добавить музыку</h3>
              <button
                onClick={handleClose}
                className="p-2.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all active:scale-95"
                title="Закрыть"
              >
                <FaTimes size={18} />
              </button>
            </div>

            {/* Поисковая строка */}
            <div className="p-4">
              <div className="flex items-center bg-[#0f0f0f] border border-white/10 pl-4 pr-2 h-12 rounded-full transition-all">
                <input
                  ref={inputRef}
                  className="flex-1 bg-transparent border-none outline-none text-white text-sm placeholder-white/20 font-medium"
                  placeholder="Найти любимый трек..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                />

                <div className="flex items-center gap-1">
                  {query && !isLoading && (
                    <button
                      onClick={() => {
                        setQuery("");
                        setResults([]);
                      }}
                      className="p-2 text-white/20 hover:text-white"
                    >
                      <FaTimes size={14} />
                    </button>
                  )}

                  {isLoading && (
                    <div className="mr-2">
                      <div className="w-4 h-4 border-2 border-blue-500/20 border-t-blue-500 rounded-full animate-spin" />
                    </div>
                  )}

                  <button
                    onClick={handleSearch}
                    disabled={!query.trim() || isLoading}
                    className={`w-10 h-10 flex items-center justify-center rounded-full transition-all active:scale-95 ${
                      query.trim()
                        ? "bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-lg shadow-blue-900/20"
                        : "bg-white/5 text-white/10 cursor-not-allowed"
                    }`}
                  >
                    {isLoading ? (
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <FaSearch size={14} />
                    )}
                  </button>
                </div>
              </div>
            </div>

            {/* Результаты */}
            {results.length > 0 && (
              <div className="border-t border-white/10 max-h-[400px] overflow-y-auto p-2 custom-scrollbar">
                {results.map((v) => (
                  <SearchResultItem
                    key={v.id.videoId}
                    video={v}
                    onAdd={onTrackAdded}
                    isAccessCodeAvailable={!!username}
                    closeSearch={handleClose}
                  />
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default DriverSearch;
