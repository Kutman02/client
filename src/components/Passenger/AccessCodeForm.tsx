import React, { useState } from "react";
import { FaLock, FaCheck, FaTimes, FaMusic, FaQrcode, FaHeadphones, FaUsers, FaHeart } from "react-icons/fa";
import { useVerifyAccessCodeMutation } from "../../api/apiSlice";
import { useAppDispatch } from "../../redux/hooks";
import { setAccessCode } from "../../redux/slices/authSlice";
import DonationModal from "../DonationModal";

interface AccessCodeFormProps {
  username: string | undefined;
  onCodeVerified?: () => void;
}

const AccessCodeForm: React.FC<AccessCodeFormProps> = ({ username, onCodeVerified }) => {
  if (!username) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center p-4">
        <div className="text-center text-white">
          <p className="text-red-400">Ошибка: имя водителя не указано</p>
        </div>
      </div>
    );
  }
  const dispatch = useAppDispatch();
  const [code, setCode] = useState<string[]>(["", "", "", ""]);
  const [error, setError] = useState<string>("");
  const [isVerifying, setIsVerifying] = useState<boolean>(false);
  const [verifyAccessCode] = useVerifyAccessCodeMutation();
  const [isDonationModalOpen, setIsDonationModalOpen] = useState<boolean>(false);

  const inputRefs = [
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
    React.useRef<HTMLInputElement>(null),
  ];

  const handleChange = (index: number, value: string): void => {
    // Разрешаем только цифры
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);
    setError("");

    // Автоматический переход к следующему полю
    if (value && index < 3) {
      const nextRef = inputRefs[index + 1];
      if (nextRef) {
        nextRef.current?.focus();
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>): void => {
    // Удаление при Backspace
    if (e.key === "Backspace" && !code[index] && index > 0) {
      const prevRef = inputRefs[index - 1];
      if (prevRef) {
        prevRef.current?.focus();
      }
    }
    // Переход при стрелке влево
    if (e.key === "ArrowLeft" && index > 0) {
      const prevRef = inputRefs[index - 1];
      if (prevRef) {
        prevRef.current?.focus();
      }
    }
    // Переход при стрелке вправо
    if (e.key === "ArrowRight" && index < 3) {
      const nextRef = inputRefs[index + 1];
      if (nextRef) {
        nextRef.current?.focus();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>): void => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").slice(0, 4);
    if (/^\d{4}$/.test(pastedData)) {
      const newCode = pastedData.split("");
      setCode(newCode);
      setError("");
      // Фокус на последнее поле
      const lastRef = inputRefs[3];
      if (lastRef) {
        lastRef.current?.focus();
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    const fullCode = code.join("");
    
    if (fullCode.length !== 4) {
      setError("Введите 4-значный код");
      return;
    }

    setIsVerifying(true);
    setError("");

    try {
      const result = await verifyAccessCode({ username, accessCode: fullCode }).unwrap();
      
      if (result.success) {
        // Сохраняем код в Redux и localStorage
        dispatch(setAccessCode({ username, accessCode: fullCode }));
        onCodeVerified?.();
      }
    } catch (err: unknown) {
      const error = err as { data?: { error?: string } };
      setError(error.data?.error || "Неверный код доступа");
      setCode(["", "", "", ""]);
      const firstRef = inputRefs[0];
      if (firstRef) {
        firstRef.current?.focus();
      }
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0f0f0f] text-white">
      {/* Animated background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-10 w-72 h-72 bg-indigo-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-10 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
      </div>
      

      <div className="relative z-10 min-h-screen flex flex-col p-4 md:p-8 lg:p-12">
        <div className="max-w-6xl w-full mx-auto mt-8 md:mt-12 lg:mt-16">
          {/* Логотип и название */}
          <div className="text-center mb-12 md:mb-16 lg:mb-20">
            <div className="flex items-center justify-center gap-3 mb-6">
              <div className="w-14 h-14 md:w-16 md:h-16 bg-linear-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-500/30">
                <FaMusic className="text-white text-xl md:text-2xl" />
              </div>
              <div className="flex flex-col">
                <span className="text-2xl md:text-3xl lg:text-4xl font-black bg-linear-to-r from-indigo-400 to-blue-400 bg-clip-text text-transparent leading-tight">
                  Driver's Music
                </span>
                <span className="text-xs md:text-sm font-medium text-white/40 leading-tight">from KutSoft</span>
              </div>
            </div>
            <h1 className="text-2xl md:text-4xl lg:text-5xl font-black mb-4 md:mb-6 leading-tight">
              <span className="bg-linear-to-r from-indigo-400 via-blue-400 to-purple-400 bg-clip-text text-transparent">
                Музыка в пути
              </span>
              <br />
              <span className="text-white text-lg md:text-2xl lg:text-3xl">для каждого пассажира</span>
            </h1>
            <p className="text-sm md:text-base lg:text-lg text-white/60 leading-relaxed max-w-2xl mx-auto mt-4 md:mt-6">
              Инновационный сервис, позволяющий вам выбирать музыку во время поездки. Сканируйте QR-код, вводите код доступа и управляйте плейлистом вместе с другими пассажирами.
            </p>
          </div>

          {/* Форма ввода кода */}
          <div className="max-w-md w-full mx-auto mb-12 md:mb-16 lg:mb-20">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl shadow-2xl p-6 md:p-8 lg:p-10">
              <div className="text-center mb-8">
                <div className="inline-flex items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-full bg-indigo-600/20 text-indigo-400 mb-4">
                  <FaLock size={28} />
                </div>
                <h2 className="text-xl md:text-2xl font-black text-white mb-2">Код доступа</h2>
                <p className="text-sm md:text-base text-white/60 mb-3">
                  Введите 4-значный код водителя
                </p>
                <p className="text-base md:text-lg font-bold text-indigo-400 uppercase tracking-wider">
                  {username}
                </p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="flex justify-center gap-3 md:gap-4">
                  {code.map((digit, index) => (
                    <input
                      key={index}
                      ref={inputRefs[index]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleChange(index, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(index, e)}
                      onPaste={index === 0 ? handlePaste : undefined}
                      className={`
                        w-14 h-14 md:w-16 md:h-16 lg:w-20 lg:h-20 text-center text-2xl md:text-3xl font-black rounded-xl
                        border-2 transition-all
                        ${error 
                          ? "border-red-500 bg-red-500/10 text-red-400" 
                          : "border-white/20 bg-white/5 text-white focus:border-indigo-500 focus:bg-indigo-500/10"
                        }
                        focus:outline-none focus:ring-2 focus:ring-indigo-500/50
                      `}
                      disabled={isVerifying}
                    />
                  ))}
                </div>

                {error && (
                  <div className="flex items-center justify-center gap-2 text-red-400 text-sm md:text-base py-2">
                    <FaTimes size={16} />
                    <span>{error}</span>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={isVerifying || code.join("").length !== 4}
                  className={`
                    w-full py-4 md:py-4.5 rounded-xl font-bold text-white transition-all
                    ${isVerifying || code.join("").length !== 4
                      ? "bg-gray-700 text-gray-400 cursor-not-allowed"
                      : "bg-linear-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 active:scale-[0.98] shadow-lg shadow-indigo-900/20"
                    }
                  `}
                >
                  {isVerifying ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      Проверка...
                    </span>
                  ) : (
                    <span className="flex items-center justify-center gap-2">
                      <FaCheck size={16} />
                      Подтвердить
                    </span>
                  )}
                </button>
              </form>

              <p className="text-center text-xs md:text-sm text-white/40 mt-6 md:mt-8">
                Код обновляется каждый час
              </p>
            </div>
          </div>

          {/* Особенности */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6 lg:gap-8 mb-6 md:mb-8 max-w-4xl mx-auto w-full">
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-5 lg:p-6 hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-linear-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center mb-3 md:mb-4 shadow-lg shadow-indigo-500/30 mx-auto">
                <FaQrcode className="text-white text-sm md:text-base lg:text-lg" />
              </div>
              <h3 className="text-xs md:text-sm lg:text-base font-black mb-2 md:mb-3 text-white text-center">QR-код</h3>
              <p className="text-[10px] md:text-xs lg:text-sm text-white/60 leading-relaxed text-center">
                Быстрый доступ через сканирование
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-5 lg:p-6 hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-linear-to-br from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mb-3 md:mb-4 shadow-lg shadow-blue-500/30 mx-auto">
                <FaHeadphones className="text-white text-sm md:text-base lg:text-lg" />
              </div>
              <h3 className="text-xs md:text-sm lg:text-base font-black mb-2 md:mb-3 text-white text-center">Синхронизация</h3>
              <p className="text-[10px] md:text-xs lg:text-sm text-white/60 leading-relaxed text-center">
                Все слышат одну музыку
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-5 lg:p-6 hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-linear-to-br from-purple-600 to-pink-600 rounded-xl flex items-center justify-center mb-3 md:mb-4 shadow-lg shadow-purple-500/30 mx-auto">
                <FaUsers className="text-white text-sm md:text-base lg:text-lg" />
              </div>
              <h3 className="text-xs md:text-sm lg:text-base font-black mb-2 md:mb-3 text-white text-center">Совместный плейлист</h3>
              <p className="text-[10px] md:text-xs lg:text-sm text-white/60 leading-relaxed text-center">
                Добавляйте любимые треки
              </p>
            </div>

            <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-2xl p-4 md:p-5 lg:p-6 hover:bg-white/10 transition-all duration-300">
              <div className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 bg-linear-to-br from-indigo-600 to-blue-600 rounded-xl flex items-center justify-center mb-3 md:mb-4 shadow-lg shadow-indigo-500/30 mx-auto">
                <FaLock className="text-white text-sm md:text-base lg:text-lg" />
              </div>
              <h3 className="text-xs md:text-sm lg:text-base font-black mb-2 md:mb-3 text-white text-center">Безопасность</h3>
              <p className="text-[10px] md:text-xs lg:text-sm text-white/60 leading-relaxed text-center">
                Код обновляется каждый час
              </p>
            </div>
          </div>

        </div>
      </div>

      {/* Фиксированная иконка доната */}
      <button
        onClick={() => setIsDonationModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 md:w-16 md:h-16 bg-linear-to-br from-pink-600 to-red-600 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/50 hover:shadow-pink-500/70 transition-all duration-300 hover:scale-110 active:scale-95"
        aria-label="Поддержать проект"
      >
        <FaHeart className="text-white text-lg md:text-xl" />
      </button>

      {/* Модальное окно доната */}
      <DonationModal 
        isOpen={isDonationModalOpen} 
        onClose={() => setIsDonationModalOpen(false)} 
      />
    </div>
  );
};

export default AccessCodeForm;