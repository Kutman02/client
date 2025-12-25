import React from "react";
import { FaExclamationTriangle, FaTrash } from "react-icons/fa";

interface PlaylistLimitModalProps {
  isOpen: boolean;
  onClose: () => void;
  currentCount: number;
  maxCount: number;
  onDeleteOldest?: () => void;
}

export const PlaylistLimitModal: React.FC<PlaylistLimitModalProps> = ({
  isOpen,
  onClose,
  currentCount,
  maxCount,
  onDeleteOldest
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="bg-[#1a1a1a] rounded-3xl border border-red-500/30 shadow-2xl max-w-md w-full p-6 animate-in fade-in zoom-in">
        {/* Иконка предупреждения */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center border-2 border-red-500/50">
            <FaExclamationTriangle className="text-red-500 text-3xl" />
          </div>
        </div>

        {/* Заголовок */}
        <h2 className="text-white font-black text-xl text-center mb-3 uppercase tracking-wider">
          Плейлист полон!
        </h2>

        {/* Сообщение */}
        <p className="text-white/80 text-center mb-2 leading-relaxed">
          В плейлисте уже <span className="font-bold text-red-400">{currentCount} из {maxCount}</span> песен.
        </p>
        <p className="text-white/60 text-sm text-center mb-6">
          Удалите старые треки, чтобы добавить новые.
        </p>

        {/* Кнопки */}
        <div className="flex flex-col gap-3">
          {onDeleteOldest && (
            <button
              onClick={() => {
                onDeleteOldest();
                onClose();
              }}
              className="w-full py-3 bg-linear-to-r from-red-600 to-red-500 hover:from-red-500 hover:to-red-400 text-white rounded-2xl font-bold transition-all active:scale-95 flex items-center justify-center gap-2 shadow-lg shadow-red-900/30"
            >
              <FaTrash size={16} />
              Удалить самый старый трек
            </button>
          )}
          
          <button
            onClick={onClose}
            className="w-full py-3 bg-white/10 hover:bg-white/20 text-white rounded-2xl font-semibold transition-all active:scale-95 border border-white/20"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};

