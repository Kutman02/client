import React, { useEffect, useState } from 'react';
import { socket } from '../api/socket';

interface ConnectionStatusProps {
  className?: string;
}

export const ConnectionStatus: React.FC<ConnectionStatusProps> = ({ className = '' }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [socketConnected, setSocketConnected] = useState(socket.connected);
  const [showStatus, setShowStatus] = useState(false);

  useEffect(() => {
    // Обработка онлайн/оффлайн событий браузера
    const handleOnline = () => {
      setIsOnline(true);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowStatus(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // Обработка состояния Socket.IO
    const handleSocketConnect = () => {
      setSocketConnected(true);
      setShowStatus(true);
      setTimeout(() => setShowStatus(false), 3000);
    };

    const handleSocketDisconnect = () => {
      setSocketConnected(false);
      setShowStatus(true);
    };

    socket.on('connect', handleSocketConnect);
    socket.on('disconnect', handleSocketDisconnect);

    // Проверяем начальное состояние
    setIsOnline(navigator.onLine);
    setSocketConnected(socket.connected);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      socket.off('connect', handleSocketConnect);
      socket.off('disconnect', handleSocketDisconnect);
    };
  }, []);

  // Не показываем статус если все в порядке и прошло время
  if (!showStatus && isOnline && socketConnected) {
    return null;
  }

  const isConnected = isOnline && socketConnected;
  const statusText = isConnected 
    ? 'Подключено' 
    : !isOnline 
    ? 'Нет интернета' 
    : !socketConnected 
    ? 'Переподключение...' 
    : 'Проблемы с соединением';

  return (
    <div
      className={`fixed top-4 right-4 z-50 px-4 py-2 rounded-lg shadow-lg backdrop-blur-md border transition-all duration-300 ${
        isConnected
          ? 'bg-green-500/20 border-green-500/50 text-green-400'
          : 'bg-red-500/20 border-red-500/50 text-red-400'
      } ${showStatus ? 'opacity-100 translate-y-0' : 'opacity-0 -translate-y-2 pointer-events-none'} ${className}`}
    >
      <div className="flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${
            isConnected ? 'bg-green-500 animate-pulse' : 'bg-red-500'
          }`}
        />
        <span className="text-sm font-medium">{statusText}</span>
      </div>
    </div>
  );
};

