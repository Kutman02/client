import React, { useState, useEffect } from "react";
import { socket } from "../../api/socket";
import { useGetConnectedPassengersQuery, useKickPassengerMutation } from "../../api/apiSlice";
import { useGetAccessCodeQuery } from "../../api/apiSlice";
import { FaUser, FaTimes, FaEye, FaEyeSlash } from "react-icons/fa";
import { KickPassengerModal } from "../KickPassengerModal";

interface PassengerListProps {
  username: string | null;
}

const PassengerList: React.FC<PassengerListProps> = ({ username }) => {
  const [showList, setShowList] = useState<boolean>(true);
  const [kickModalOpen, setKickModalOpen] = useState(false);
  const [selectedPassengerId, setSelectedPassengerId] = useState<string | null>(null);
  const [isKicking, setIsKicking] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [shouldPoll, setShouldPoll] = useState<boolean>(true);
  
  const { data: passengersData, isLoading, isError, error, refetch, isUninitialized } = useGetConnectedPassengersQuery(username || '', {
    skip: !username || !shouldPoll, // Отключаем запрос полностью при критических ошибках
    pollingInterval: shouldPoll ? 10000 : 0,
  });

  const { data: accessCodeData } = useGetAccessCodeQuery(username || '', {
    skip: !username,
  });

  const [kickPassenger] = useKickPassengerMutation();

  const passengers = passengersData?.passengers || [];

  // Обновляем список пассажиров через socket события
  useEffect(() => {
    if (!username) return;

    // Проверяем состояние socket перед подключением
    // socket.io автоматически переподключится, но мы можем ускорить процесс
    if (socket.disconnected) {
      socket.connect();
    }

    const handlePassengerUpdate = () => {
      // Обновляем список при подключении/отключении пассажиров
      if (!isUninitialized) {
        refetch().catch(err => {
          if (!err.message?.includes('has not been started')) {
            console.error("Ошибка обновления списка пассажиров:", err);
          }
        });
      }
    };

    const handlePassengerKicked = (data: { passengerId: string; timestamp: Date; wasOnline?: boolean }) => {
      // Обновляем список при выгоне пассажира
      console.log('Пассажир выгнан:', data);
      if (!isUninitialized) {
        refetch().catch(err => {
          if (!err.message?.includes('has not been started')) {
            console.error("Ошибка обновления списка пассажиров:", err);
          }
        });
      }
    };

    socket.on("passenger_connected", handlePassengerUpdate);
    socket.on("passenger_disconnected", handlePassengerUpdate);
    socket.on("passenger_kicked", handlePassengerKicked);

    return () => {
      socket.off("passenger_connected", handlePassengerUpdate);
      socket.off("passenger_disconnected", handlePassengerUpdate);
      socket.off("passenger_kicked", handlePassengerKicked);
    };
  }, [username, refetch, isUninitialized]);

  // Обработка ошибок и отключение polling при критических ошибках
  React.useEffect(() => {
    if (isError && username) {
      // Логируем ошибку только если username есть (не логируем ошибки от пустых запросов)
      let errorMessage = 'Неизвестная ошибка';
      let isParsingError = false;
      
      if (error && 'data' in error) {
        const errorData = error.data;
        
        // Проверяем, является ли это PARSING_ERROR (HTML ответ)
        if (typeof errorData === 'object' && errorData !== null) {
          if ('originalStatus' in errorData && errorData.originalStatus === 'PARSING_ERROR') {
            isParsingError = true;
          }
          if ('error' in errorData) {
            errorMessage = String(errorData.error);
          } else if ('message' in errorData) {
            errorMessage = String(errorData.message);
          }
        } 
        // Обработка строковой ошибки (HTML ответ)
        else if (typeof errorData === 'string') {
          if (errorData.trim().startsWith('<!DOCTYPE')) {
            errorMessage = 'Сервер вернул HTML вместо JSON. Проверьте, что маршрут существует.';
            isParsingError = true;
          } else {
            errorMessage = errorData;
          }
        }
      }
      
      // Отключаем polling при PARSING_ERROR, чтобы избежать бесконечных повторных запросов
      if (isParsingError && shouldPoll) {
        setShouldPoll(false);
        console.warn("⚠️ Polling отключен из-за PARSING_ERROR. Маршрут не существует или сервер возвращает HTML.");
      }
      
      // Логируем полную информацию об ошибке (раздельно для лучшей читаемости)
      console.group("❌ Ошибка загрузки пассажиров");
      console.error("Message:", errorMessage);
      console.error("Username:", username);
      console.error("Error Status:", error && 'status' in error ? error.status : 'unknown');
      console.error("Is Parsing Error:", isParsingError);
      
      if (error && 'data' in error) {
        const errorData = error.data;
        if (typeof errorData === 'object' && errorData !== null) {
          console.error("Error Data (JSON):", JSON.stringify(errorData, null, 2));
        } else {
          console.error("Error Data:", errorData);
        }
      } else {
        console.error("Error Data: no data");
      }
      
      if (error && typeof error === 'object') {
        console.error("Full Error (JSON):", JSON.stringify(error, null, 2));
      } else {
        console.error("Full Error:", error);
      }
      console.groupEnd();
    } else if (!isError && !shouldPoll) {
      // Включаем polling обратно, если ошибка исчезла
      setShouldPoll(true);
    }
  }, [isError, error, username]);

  const handleKickClick = (passengerId: string): void => {
    setSelectedPassengerId(passengerId);
    setKickModalOpen(true);
    setErrorMessage(null);
  };

  const handleKickConfirm = async (): Promise<void> => {
    if (!selectedPassengerId || !username) {
      setKickModalOpen(false);
      return;
    }

    setIsKicking(true);
    setErrorMessage(null);

    try {
      const result = await kickPassenger({
        username,
        passengerId: selectedPassengerId,
        accessCode: accessCodeData?.accessCode || '',
      }).unwrap();
      
      // Успешно выгнали - показываем сообщение
      console.log(result.message);
      setKickModalOpen(false);
      setSelectedPassengerId(null);
      
      // Обновляем список пассажиров
      refetch().catch(err => {
        if (!err.message?.includes('has not been started')) {
          console.error("Ошибка обновления списка пассажиров:", err);
        }
      });
    } catch (err: any) {
      console.error("Ошибка выгона пассажира:", err);
      const errorMessage = err?.data?.message || err?.data?.error || "Не удалось выгнать пассажира. Попробуйте еще раз.";
      setErrorMessage(errorMessage);
    } finally {
      setIsKicking(false);
    }
  };

  const handleCloseModal = (): void => {
    if (!isKicking) {
      setKickModalOpen(false);
      setSelectedPassengerId(null);
      setErrorMessage(null);
    }
  };


  const formatTime = (date?: Date | string): string => {
    if (!date) return "—";
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return "—";
    const now = new Date();
    const diff = now.getTime() - d.getTime();
    const minutes = Math.floor(diff / 60000);
    
    if (minutes < 1) return "только что";
    if (minutes < 60) return `${minutes} мин назад`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} ч назад`;
    return d.toLocaleDateString();
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between mb-4 pb-2 border-b border-white/10">
        <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest">
          Пассажиры {isLoading ? "(...)" : `(${passengers.length})`}
        </h3>
        <button
          onClick={() => setShowList(!showList)}
          className="p-2.5 text-white/40 hover:text-white hover:bg-white/10 rounded-lg transition-all active:scale-95"
          title={showList ? "Скрыть список" : "Показать список"}
        >
          {showList ? <FaEyeSlash size={14} /> : <FaEye size={14} />}
        </button>
      </div>

      {showList && (
        <>
          {isError && username ? (
            <div className="text-center py-8">
              <div className="text-red-400 text-sm mb-2">Ошибка загрузки</div>
              <div className="text-white/30 text-xs">
                {(() => {
                  if (!error || !('data' in error)) {
                    return "Не удалось загрузить список";
                  }
                  
                  const errorData = error.data;
                  
                  // Обработка объекта ошибки
                  if (typeof errorData === 'object' && errorData !== null) {
                    if ('error' in errorData) {
                      return String(errorData.error);
                    }
                    if ('message' in errorData) {
                      return String(errorData.message);
                    }
                  }
                  
                  // Обработка строковой ошибки (HTML ответ)
                  if (typeof errorData === 'string') {
                    if (errorData.trim().startsWith('<!DOCTYPE')) {
                      return "Сервер вернул HTML вместо JSON. Проверьте маршрут.";
                    }
                    return errorData;
                  }
                  
                  return "Не удалось загрузить список";
                })()}
              </div>
            </div>
          ) : isLoading ? (
            <div className="text-center py-8">
              <div className="animate-pulse text-white/30 text-sm">Загрузка пассажиров...</div>
            </div>
          ) : passengers.length === 0 ? (
            <div className="text-center py-8 text-white/30 text-sm">
              Нет подключенных пассажиров
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto custom-scrollbar">
              {passengers.map((passenger, index) => (
                <div
                  key={passenger.id}
                  className={`
                    flex items-center justify-between p-3 rounded-xl border transition-all
                    ${passenger.isOnline 
                      ? "bg-green-500/10 border-green-500/30" 
                      : "bg-white/5 border-white/10"
                    }
                  `}
                >
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className={`
                      w-2 h-2 rounded-full shrink-0
                      ${passenger.isOnline ? "bg-green-500 animate-pulse" : "bg-gray-500"}
                    `} />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <FaUser className="text-white/50 text-xs" />
                        <span className="text-white font-semibold text-sm">
                          Пассажир #{index + 1}
                        </span>
                      </div>
                      <div className="text-[10px] text-white/40 mt-1">
                        {passenger.isOnline ? "Онлайн" : `Офлайн (${formatTime(passenger.lastSeen)})`}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => handleKickClick(passenger.id)}
                      className="p-2.5 text-red-400 hover:text-red-300 hover:bg-red-500/20 rounded-lg transition-all active:scale-95 border border-red-500/20 hover:border-red-500/40"
                      title={passenger.isOnline ? "Выгнать пассажира" : "Удалить офлайн пассажира"}
                    >
                      <FaTimes size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}

      {/* Модальное окно подтверждения выгона */}
      <KickPassengerModal
        isOpen={kickModalOpen}
        onClose={handleCloseModal}
        onConfirm={handleKickConfirm}
        isLoading={isKicking}
      />

      {/* Сообщение об ошибке */}
      {errorMessage && (
        <div className="fixed bottom-4 right-4 z-50 bg-red-500/90 backdrop-blur-md border border-red-500/50 rounded-xl p-4 shadow-2xl max-w-sm animate-in slide-in-from-right">
          <div className="flex items-center gap-3">
            <FaTimes className="text-white text-lg shrink-0" />
            <p className="text-white text-sm font-medium">{errorMessage}</p>
            <button
              onClick={() => setErrorMessage(null)}
              className="ml-auto text-white/70 hover:text-white transition-colors"
            >
              <FaTimes size={14} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PassengerList;

