import React, { useState, useRef, useEffect } from "react";
import { QRCodeSVG } from "qrcode.react";
import { 
  FaDownload, FaEyeSlash, FaEye, FaMusic, FaCopy
} from "react-icons/fa";
import { useGetAccessCodeQuery } from "../../api/apiSlice";

interface ControlPanelProps {
  username: string | null;
  isPlayerActive?: boolean;
  playing?: boolean;
  autoPlay?: boolean;
  actions?: {
    onTogglePlay?: () => void;
    onToggleAuto?: (value: boolean) => void;
  };
}

export const ControlPanel: React.FC<ControlPanelProps> = ({ username }) => {
  const [showQR, setShowQR] = useState<boolean>(true);
  const qrRef = useRef<HTMLDivElement>(null);
  const url = `${window.location.origin}/passenger/${username ? encodeURIComponent(username) : ''}`;
  
  // Получаем код доступа
  const { 
    data: accessCodeData, 
    isLoading: isLoadingCode,
    isError: isErrorCode,
    refetch: refetchCode 
  } = useGetAccessCodeQuery(username || '', {
    skip: !username,
    pollingInterval: 60000, // Обновляем каждую минуту
  });

  // Используем код из accessCodeData
  const finalAccessCode = accessCodeData?.accessCode;
  const finalUpdatedAt = accessCodeData?.updatedAt;

  // Автоматическое обновление кода каждый час
  useEffect(() => {
    const interval = setInterval(() => {
      refetchCode();
    }, 60 * 60 * 1000); // Каждый час

    return () => clearInterval(interval);
  }, [refetchCode]);

  const copyCode = async (): Promise<void> => {
    const codeToCopy = finalAccessCode;
    if (codeToCopy) {
      try {
        await navigator.clipboard.writeText(codeToCopy);
        // Визуальная обратная связь
        const btn = document.querySelector<HTMLButtonElement>('[data-copy-btn]');
        if (btn) {
          const originalContent = btn.innerHTML;
          // Создаем временный элемент для иконки
          const tempDiv = document.createElement('div');
          tempDiv.innerHTML = '<svg class="w-3.5 h-3.5 inline-block mr-1" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>';
          btn.innerHTML = tempDiv.innerHTML + ' Скопировано!';
          btn.classList.add('bg-green-500');
          setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.classList.remove('bg-green-500');
          }, 2000);
        }
      } catch (err) {
        console.error('Ошибка копирования:', err);
      }
    }
  };

  const downloadQR = (): void => {
    if (!qrRef.current) return;
    const svg = qrRef.current.querySelector<SVGElement>("svg");
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    
    if (!ctx) {
      console.error('Не удалось получить контекст canvas');
      return;
    }
    
    const width = 1200;
    const height = 1600;
    canvas.width = width;
    canvas.height = height;

    const img = new Image();
    img.onload = () => {
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, width, height);

      ctx.fillStyle = "#2563eb"; 
      ctx.fillRect(0, 0, width, 40);

      ctx.fillStyle = "#000000";
      ctx.textAlign = "center";
      
      ctx.font = "bold 70px sans-serif";
      ctx.fillText("ВАША МУЗЫКА ЗДЕСЬ", width / 2, 220);
      
      ctx.font = "40px sans-serif";
      ctx.fillStyle = "#666666";
      ctx.fillText("Отсканируй, чтобы управлять очередью", width / 2, 290);

      ctx.strokeStyle = "#EEEEEE";
      ctx.lineWidth = 2;
      ctx.strokeRect(200, 380, 800, 800);
      
      ctx.drawImage(img, 250, 430, 700, 700);

      ctx.fillStyle = "#F8FAFC";
      ctx.fillRect(100, 1250, 1000, 250); 
      
      ctx.fillStyle = "#1E293B";
      ctx.font = "bold 35px monospace";
      ctx.fillText(url, width / 2, 1350);
      
      ctx.fillStyle = "#94A3B8";
      ctx.font = "30px sans-serif";
      ctx.fillText(`ID Салона: ${username || ''}`, width / 2, 1420);

      ctx.fillStyle = "#2563eb";
      ctx.font = "bold 30px sans-serif";
      ctx.fillText("МУЗЫКАЛЬНЫЙ КАБИНЕТ", width / 2, 1550);

      const pngFile = canvas.toDataURL("image/png", 1.0);
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR_Print_Ready_${username || 'unknown'}.png`;
      downloadLink.href = pngFile;
      downloadLink.click();
    };

    img.src = "data:image/svg+xml;base64," + btoa(unescape(encodeURIComponent(svgData)));
  };

  return (
    <div className="flex flex-col items-center w-full">
      {/* Шапка панели */}
      <div className="text-center mb-8 px-4 group">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-600/10 text-blue-500 mb-4 group-hover:scale-110 transition-transform">
          <FaMusic size={28} />
        </div>
        <h3 className="text-lg font-black text-white leading-tight tracking-tight">
          СТАНЬ DJ В САЛОНЕ
        </h3>
        <p className="text-xs text-gray-500 mt-2 uppercase tracking-widest">
          Твой телефон — твой пульт
        </p>
      </div>
      
      {/* Секция QR-кода */}
      {showQR && (
        <div className="flex flex-col items-center w-full">
          <div 
            ref={qrRef}
            className="p-5 bg-white rounded-[2.5rem] transition-all hover:shadow-[0_0_50px_rgba(59,130,246,0.3)] mb-6 shadow-2xl"
          >
            <QRCodeSVG 
              value={url} 
              size={200}
              level="H"
              bgColor="#FFFFFF"
              fgColor="#000000"
              includeMargin={false}
            />
          </div>
          
          <div className="bg-white/5 border border-white/10 px-4 py-2 rounded-full mb-4">
            <p className="text-[10px] font-mono text-blue-400 truncate max-w-[220px]">
              {url}
            </p>
          </div>

          {/* Код доступа */}
          <div className="w-full mb-8">
            <div className="bg-linear-to-r from-indigo-600/20 to-blue-600/20 border border-indigo-500/30 rounded-2xl p-4">
              <div className="text-center mb-2">
                <p className="text-[10px] text-gray-400 uppercase tracking-widest mb-2">Код доступа</p>
                <div className="flex items-center justify-center gap-3">
                  {isLoadingCode ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
                      <span className="text-sm text-gray-400">Загрузка...</span>
                    </div>
                  ) : isErrorCode ? (
                    <div className="flex flex-col items-center gap-2">
                      <span className="text-sm text-red-400">Ошибка загрузки</span>
                      <button
                        onClick={() => refetchCode()}
                        className="text-xs text-indigo-400 hover:text-indigo-300 underline"
                      >
                        Повторить
                      </button>
                    </div>
                  ) : finalAccessCode ? (
                    <>
                      <span className="text-4xl font-black text-white tracking-widest font-mono">
                        {finalAccessCode}
                      </span>
                      <button
                        data-copy-btn
                        onClick={copyCode}
                        className="p-2.5 bg-white/10 hover:bg-white/20 rounded-lg transition-all active:scale-95"
                        title="Копировать код"
                      >
                        <FaCopy size={14} className="text-gray-400 hover:text-white transition-colors" />
                      </button>
                    </>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-gray-400">Код не найден</span>
                      <button
                        onClick={() => refetchCode()}
                        className="text-xs text-indigo-400 hover:text-indigo-300 underline"
                      >
                        Обновить
                      </button>
                    </div>
                  )}
                </div>
                {finalUpdatedAt && (
                  <p className="text-[9px] text-gray-500 mt-2">
                    {accessCodeData?.nextUpdateAt ? (
                      <>Обновится: {new Date(accessCodeData.nextUpdateAt).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })}</>
                    ) : (
                      <>Обновляется каждый час</>
                    )}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Кнопки действий (QR функции) */}
      <div className="grid grid-cols-2 gap-3 w-full">
        <button 
          onClick={() => setShowQR(!showQR)}
          className="flex items-center justify-center gap-2 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-xs font-semibold text-gray-300 transition-all active:scale-95"
        >
          {showQR ? <FaEyeSlash size={14} /> : <FaEye size={14} />} 
          <span>{showQR ? "Скрыть" : "Показать"}</span>
        </button>
        
        <button 
          onClick={downloadQR}
          className="flex items-center justify-center gap-2 py-3 bg-linear-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 rounded-2xl text-xs font-semibold text-white shadow-lg shadow-blue-900/20 transition-all active:scale-95"
        >
          <FaDownload size={14} /> <span>Для печати</span>
        </button>
      </div>
    </div>
  );
};