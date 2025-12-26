import React, { useState } from "react";
import { FaTimes, FaHeart, FaCopy, FaCheck, FaMobileAlt, FaCreditCard } from "react-icons/fa";
import donationQR from "../assets/qrdonate.svg";


interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const DonationModal: React.FC<DonationModalProps> = ({ isOpen, onClose }) => {
  const [copiedMBank, setCopiedMBank] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);
  const mbankNumberDisplay = "+996 774 522 640";
  const mbankNumberCopy = "774522640"; // Без кода страны, так как в МБанке он уже есть
  const cardNumber = "4177 4901 9760 9011";

  const handleCopy = (text: string, type: 'mbank' | 'card') => {
    navigator.clipboard.writeText(text);
    if (type === 'mbank') {
      setCopiedMBank(true);
      setTimeout(() => setCopiedMBank(false), 2000);
    } else {
      setCopiedCard(true);
      setTimeout(() => setCopiedCard(false), 2000);
    }
  };

  if (!isOpen) return null;

  return (
    <div 
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
      onClick={onClose}
    >
      <div 
        className="bg-white/10 backdrop-blur-xl border border-white/20 rounded-2xl shadow-2xl max-w-sm w-full overflow-hidden relative"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Кнопка закрытия */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 text-white/70 hover:text-white transition-colors bg-white/10 hover:bg-white/20 rounded-full p-1.5"
        >
          <FaTimes size={16} />
        </button>

        {/* Градиентный заголовок */}
        <div className="bg-linear-to-r from-pink-600/20 via-red-600/20 to-purple-600/20 border-b border-white/10 p-4 pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-linear-to-br from-pink-500 to-red-500 flex items-center justify-center shadow-lg">
              <FaHeart className="text-white text-sm" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                Поддержи проект!
              </h2>
              <p className="text-xs text-white/70">
              Ваша помощь ускоряет и улучшает приложение для всех!  
              </p>
            </div>
          </div>
        </div>

        <div className="p-4 space-y-3">
          {/* QR-код */}
          <div className="flex justify-center">
            <div className="bg-white p-2 rounded-xl shadow-lg">
              <img 
                src={donationQR} 
                alt="QR код для доната"
                className="w-40 h-40 object-contain rounded-lg"
              />
            </div>
          </div>

          {/* Номера для перевода - компактные */}
          <div className="space-y-2">
            {/* МБанк */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-all group">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FaMobileAlt className="text-pink-400 text-sm shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-white/50 uppercase tracking-wider mb-0.5">МБанк</p>
                    <p className="text-sm font-bold text-white font-mono truncate">{mbankNumberDisplay}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(mbankNumberCopy, 'mbank')}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-pink-500/20 text-white/70 hover:text-pink-300 transition-all"
                  title="Скопировать"
                >
                  {copiedMBank ? (
                    <FaCheck className="text-green-400 text-xs" />
                  ) : (
                    <FaCopy className="text-xs" />
                  )}
                </button>
              </div>
            </div>

            {/* Карта */}
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 hover:bg-white/10 transition-all group">
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1 min-w-0">
                  <FaCreditCard className="text-indigo-400 text-sm shrink-0" />
                  <div className="min-w-0 flex-1">
                    <p className="text-[10px] text-white/50 uppercase tracking-wider mb-0.5">Карта</p>
                    <p className="text-sm font-bold text-white font-mono truncate">{cardNumber}</p>
                  </div>
                </div>
                <button
                  onClick={() => handleCopy(cardNumber, 'card')}
                  className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-white/10 hover:bg-indigo-500/20 text-white/70 hover:text-indigo-300 transition-all"
                  title="Скопировать"
                >
                  {copiedCard ? (
                    <FaCheck className="text-green-400 text-xs" />
                  ) : (
                    <FaCopy className="text-xs" />
                  )}
                </button>
              </div>
            </div>
          </div>

          {/* Благодарность */}
          <div className="text-center pt-2 pb-1">
            <p className="text-xs text-white/50">
              Спасибо за поддержку! 🙏
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DonationModal;

