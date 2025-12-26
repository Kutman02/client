import { io, Socket } from "socket.io-client";

const BASE_URL = "https://longheadedly-unprevailing-quinn.ngrok-free.dev/";

// Настройки для стабильной работы при плохом соединении
export const socket: Socket = io(BASE_URL, { 
  transports: ["websocket", "polling"], // Fallback на polling если websocket не работает
  autoConnect: true,
  reconnection: true, // Включаем автоматическое переподключение
  reconnectionDelay: 1000, // Начинаем переподключение через 1 секунду
  reconnectionDelayMax: 5000, // Максимальная задержка между попытками - 5 секунд
  reconnectionAttempts: Infinity, // Бесконечное количество попыток переподключения
  timeout: 20000, // Таймаут подключения - 20 секунд
  forceNew: false, // Переиспользуем существующее соединение если возможно
  // Дополнительные настройки для стабильности
  upgrade: true, // Позволяем обновление с polling до websocket
  rememberUpgrade: true, // Запоминаем предпочтительный транспорт
});

// Обработка событий соединения для отладки и стабильности
socket.on("connect", () => {
  console.log("✅ Socket.IO подключен:", socket.id);
});

socket.on("disconnect", (reason) => {
  console.warn("⚠️ Socket.IO отключен:", reason);
  // Не вызываем socket.connect() вручную - socket.io автоматически переподключится
  // благодаря настройкам reconnection: true
});

socket.on("connect_error", (error) => {
  console.error("❌ Ошибка подключения Socket.IO:", error.message);
  // Не нужно делать ничего - socket.io автоматически попытается переподключиться
});

socket.on("reconnect", (attemptNumber) => {
  console.log(`✅ Socket.IO переподключен после ${attemptNumber} попыток`);
});

socket.on("reconnect_attempt", (attemptNumber) => {
  console.log(`🔄 Попытка переподключения Socket.IO #${attemptNumber}`);
});

socket.on("reconnect_error", (error) => {
  console.error("❌ Ошибка переподключения Socket.IO:", error.message);
});

socket.on("reconnect_failed", () => {
  console.error("❌ Не удалось переподключиться к Socket.IO после всех попыток");
  // Socket.io с reconnectionAttempts: Infinity будет продолжать попытки автоматически
  // Не нужно вызывать socket.connect() вручную
});