import React, { useState } from "react";
import { FaTrash, FaCheck } from "react-icons/fa";
import { clearAllCache, getCacheSize } from "../utils/cache";

interface ClearCacheButtonProps {
  className?: string;
}

export const ClearCacheButton: React.FC<ClearCacheButtonProps> = ({ className = "" }) => {
  const [showConfirm, setShowConfirm] = useState(false);
  const [isCleared, setIsCleared] = useState(false);

  const handleClear = () => {
    if (showConfirm) {
      clearAllCache();
      setIsCleared(true);
      setShowConfirm(false);
      
      // Перезагружаем страницу через 1 секунду
      setTimeout(() => {
        window.location.reload();
      }, 1000);
    } else {
      setShowConfirm(true);
      // Автоматически скрываем подтверждение через 3 секунды
      setTimeout(() => {
        setShowConfirm(false);
      }, 3000);
    }
  };

  const cacheSize = getCacheSize();
  const cacheSizeKB = (cacheSize / 1024).toFixed(2);

  return (
    <div className={`flex items-center justify-center gap-2 ${className}`}>
      {!isCleared ? (
        <>
          {showConfirm ? (
            <button
              onClick={handleClear}
              className="px-4 py-2 bg-linear-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-lg text-xs font-bold transition-all active:scale-95 flex items-center gap-2 shadow-lg shadow-red-900/20"
            >
              <FaTrash size={12} />
              Подтвердить очистку
            </button>
          ) : (
            <button
              onClick={handleClear}
              className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white/60 hover:text-white/80 rounded-lg text-xs font-medium transition-all active:scale-95 flex items-center gap-2 border border-white/10 hover:border-white/20"
              title={`Очистить кеш (${cacheSizeKB} KB)`}
            >
              <FaTrash size={11} />
              Очистить кеш
            </button>
          )}
        </>
      ) : (
        <div className="px-3 py-1.5 bg-green-500/20 text-green-400 rounded-lg text-xs font-medium flex items-center gap-2 border border-green-500/30">
          <FaCheck size={11} />
          Кеш очищен
        </div>
      )}
    </div>
  );
};

