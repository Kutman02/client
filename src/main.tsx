import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Provider } from 'react-redux'
import { store } from './redux/store'
import { loadFromStorage } from './redux/slices/authSlice'
import './index.css'
import App from './App'

// Загружаем данные из localStorage при инициализации
// Проверяем и очищаем старые данные (email вместо username)
const savedUsername = localStorage.getItem('username');
if (savedUsername && savedUsername.includes('@')) {
  console.warn("⚠️ Обнаружен email в localStorage вместо username, очищаем старые данные");
  localStorage.removeItem('username');
  localStorage.removeItem('token');
  // Очищаем все старые коды доступа
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('accessCode_')) {
      localStorage.removeItem(key);
    }
  });
} else {
  store.dispatch(loadFromStorage());
}

// Подавляем предупреждения YouTube iframe (postMessage ошибки)
window.addEventListener('error', (event) => {
  // Игнорируем ошибки YouTube iframe и рекламные скрипты
  if (
    event.message?.includes('postMessage') ||
    event.message?.includes('youtube.com') ||
    event.message?.includes('doubleclick.net') ||
    event.message?.includes('googleads') ||
    event.filename?.includes('www-widgetapi.js') ||
    event.filename?.includes('ad_status.js')
  ) {
    event.preventDefault();
    return;
  }
}, true);

// Подавляем необработанные промисы от YouTube
window.addEventListener('unhandledrejection', (event) => {
  if (
    event.reason?.message?.includes('postMessage') ||
    event.reason?.message?.includes('youtube.com')
  ) {
    event.preventDefault();
  }
});

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error('Root element not found');
}

createRoot(rootElement).render(
  <StrictMode>
    {/* 3. Оборачиваем App в Provider */}
    <Provider store={store}>
      <App />
    </Provider>
  </StrictMode>,
)