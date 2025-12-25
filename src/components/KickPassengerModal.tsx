import React from "react";
import { FaTimes, FaExclamationTriangle } from "react-icons/fa";

interface KickPassengerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  isLoading?: boolean;
}

export const KickPassengerModal: React.FC<KickPassengerModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  isLoading = false
}) => {
  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
      onClick={onClose}
    >
      <div 
        className="bg-[#1a1a1a] border border-white/10 rounded-3xl shadow-2xl max-w-md w-full p-6 relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors"
        >
          <FaTimes size={20} />
        </button>

        {/* Иконка предупреждения */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-red-500/20 flex items-center justify-center border-2 border-red-500/50">
            <FaExclamationTriangle className="text-red-500 text-3xl" />
          </div>
        </div>

        {/* Заголовок */}
        <h2 className="text-white font-black text-xl text-center mb-3">
          Выгнать пассажира?
        </h2>

        {/* Сообщение */}
        <p className="text-white/80 text-center mb-6 leading-relaxed">
          Пассажир будет отключен от сессии. Это действие нельзя отменить.
        </p>

        {/* Кнопки */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={isLoading}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-white/80 bg-white/5 hover:bg-white/10 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-linear-to-r from-red-600 to-red-700 hover:from-red-500 hover:to-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {isLoading ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                <span>Выгоняем...</span>
              </>
            ) : (
              "Выгнать"
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

