import React, { useEffect } from "react";
import { FaCheckCircle, FaTimes } from "react-icons/fa";

interface PassengerKickedNotificationProps {
  isOpen: boolean;
  onClose: () => void;
  message?: string;
}

export const PassengerKickedNotification: React.FC<PassengerKickedNotificationProps> = ({
  isOpen,
  onClose,
  message = "Вы вышли из системы. Спасибо, что были с нами!"
}) => {
  useEffect(() => {
    if (!isOpen) return;
    
    // Автоматически закрываем через 5 секунд
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    
    return () => clearTimeout(timer);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md pointer-events-none">
      <div className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-md w-full p-6 relative pointer-events-auto animate-in fade-in slide-in-from-bottom-4">
        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-white/70 hover:text-white transition-colors"
        >
          <FaTimes size={18} />
        </button>

        {/* Иконка */}
        <div className="flex justify-center mb-4">
          <div className="w-16 h-16 rounded-full bg-green-500/20 flex items-center justify-center border-2 border-green-500/50">
            <FaCheckCircle className="text-green-400 text-3xl" />
          </div>
        </div>

        {/* Сообщение */}
        <div className="text-center">
          <h3 className="text-white font-black text-lg mb-2">
            Спасибо!
          </h3>
          <p className="text-white/80 text-sm leading-relaxed">
            {message}
          </p>
        </div>

        {/* Кнопка закрытия внизу */}
        <div className="mt-6 flex justify-center">
          <button
            onClick={onClose}
            className="px-6 py-2 rounded-xl font-bold text-white bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 transition-all"
          >
            Понятно
          </button>
        </div>
      </div>
    </div>
  );
};

