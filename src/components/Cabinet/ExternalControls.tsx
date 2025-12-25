import React, { useState } from "react";

interface ExternalControlsProps {
  playing: boolean;
  onTogglePlay: () => void;
  onNext: () => void;
}

export const ExternalControls: React.FC<ExternalControlsProps> = ({ playing, onTogglePlay, onNext }) => {
  const [progress, setProgress] = useState<number>(0);

  return (
    <div className="mt-4 bg-slate-900 rounded-3xl p-6 border border-slate-800 shadow-xl">
      <div className="flex flex-col gap-6">
        
        {/* СКРОЛЛИНГ ТАЙМЕРА (Ползунок) */}
        <div className="relative w-full">
          <input
            type="range"
            min="0"
            max="100"
            value={progress}
            onChange={(e) => setProgress(Number(e.target.value))}
            className="w-full h-3 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
          />
          <div className="flex justify-between mt-2 text-[10px] font-bold text-slate-500 uppercase tracking-widest">
            <span>0:00</span>
            {/* <span className="text-blue-400">Играет</span> */}
          </div>
        </div>

        {/* КНОПКИ УПРАВЛЕНИЯ */}
        <div className="flex items-center justify-between gap-4">
          <button 
            onClick={onTogglePlay}
            className={`flex-1 py-4 rounded-2xl font-black text-lg transition-all active:scale-95 ${
              playing ? "bg-slate-800 text-white border border-slate-700" : "bg-emerald-500 text-white shadow-lg shadow-emerald-900/20"
            }`}
          >
            {playing ? "⏸ ПАУЗА" : "▶️ ИГРАТЬ"}
          </button>
          
          <button 
            onClick={onNext}
            className="px-8 py-4 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black text-lg transition-all active:scale-95 shadow-lg shadow-blue-900/20"
          >
            ⏭️ ДАЛЕЕ
          </button>
        </div>
      </div>
    </div>
  );
};