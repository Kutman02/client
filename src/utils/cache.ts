// Утилиты для работы с кешем в localStorage
// Храним данные локально для уменьшения нагрузки на сервер и улучшения производительности

import type { Track, VideoProgress } from '../types';

const STORAGE_PREFIX = 'taximusic_cache_';

// Ключи для разных типов данных
const KEYS = {
  DRIVER_PLAYLIST: (username: string) => `${STORAGE_PREFIX}driver_playlist_${username}`,
  DRIVER_PLAYER_STATE: (username: string) => `${STORAGE_PREFIX}driver_player_${username}`,
  PASSENGER_PLAYLIST: (username: string) => `${STORAGE_PREFIX}passenger_playlist_${username}`,
  PASSENGER_PLAYER_STATE: (username: string) => `${STORAGE_PREFIX}passenger_player_${username}`,
  VIDEO_PROGRESS: (username: string) => `${STORAGE_PREFIX}video_progress_${username}`,
} as const;

// Интерфейсы для кешируемых данных
interface CachedPlaylist {
  playlist: Track[];
  timestamp: number;
}

interface CachedPlayerState {
  currentIndex: number;
  playing: boolean;
  isPlayerActive: boolean;
  timestamp: number;
}

interface CachedVideoProgress {
  progress: VideoProgress;
  timestamp: number;
}

// Время жизни кеша (5 минут)
const CACHE_TTL = 5 * 60 * 1000;

/**
 * Сохраняет плейлист в кеш
 */
export const savePlaylistToCache = (username: string, playlist: Track[], isDriver: boolean = true): void => {
  if (!username) return;
  
  try {
    const key = isDriver ? KEYS.DRIVER_PLAYLIST(username) : KEYS.PASSENGER_PLAYLIST(username);
    const data: CachedPlaylist = {
      playlist,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('❌ Ошибка сохранения плейлиста в кеш:', err);
  }
};

/**
 * Получает плейлист из кеша
 */
export const getPlaylistFromCache = (username: string, isDriver: boolean = true): Track[] | null => {
  if (!username) return null;
  
  try {
    const key = isDriver ? KEYS.DRIVER_PLAYLIST(username) : KEYS.PASSENGER_PLAYLIST(username);
    const data = localStorage.getItem(key);
    if (!data) return null;
    
    const cached: CachedPlaylist = JSON.parse(data);
    
    // Проверяем, не устарел ли кеш
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    
    return cached.playlist;
  } catch (err) {
    console.error('❌ Ошибка чтения плейлиста из кеша:', err);
    return null;
  }
};

/**
 * Сохраняет состояние плеера в кеш
 */
export const savePlayerStateToCache = (
  username: string, 
  state: { currentIndex: number; playing: boolean; isPlayerActive: boolean },
  isDriver: boolean = true
): void => {
  if (!username) return;
  
  try {
    const key = isDriver ? KEYS.DRIVER_PLAYER_STATE(username) : KEYS.PASSENGER_PLAYER_STATE(username);
    const data: CachedPlayerState = {
      ...state,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('❌ Ошибка сохранения состояния плеера в кеш:', err);
  }
};

/**
 * Получает состояние плеера из кеша
 */
export const getPlayerStateFromCache = (
  username: string, 
  isDriver: boolean = true
): { currentIndex: number; playing: boolean; isPlayerActive: boolean } | null => {
  if (!username) return null;
  
  try {
    const key = isDriver ? KEYS.DRIVER_PLAYER_STATE(username) : KEYS.PASSENGER_PLAYER_STATE(username);
    const data = localStorage.getItem(key);
    if (!data) return null;
    
    const cached: CachedPlayerState = JSON.parse(data);
    
    // Проверяем, не устарел ли кеш
    if (Date.now() - cached.timestamp > CACHE_TTL) {
      localStorage.removeItem(key);
      return null;
    }
    
    return {
      currentIndex: cached.currentIndex,
      playing: cached.playing,
      isPlayerActive: cached.isPlayerActive
    };
  } catch (err) {
    console.error('❌ Ошибка чтения состояния плеера из кеша:', err);
    return null;
  }
};

/**
 * Сохраняет прогресс видео в кеш
 */
export const saveVideoProgressToCache = (username: string, progress: VideoProgress): void => {
  if (!username) return;
  
  try {
    const key = KEYS.VIDEO_PROGRESS(username);
    const data: CachedVideoProgress = {
      progress,
      timestamp: Date.now()
    };
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error('❌ Ошибка сохранения прогресса видео в кеш:', err);
  }
};

/**
 * Получает прогресс видео из кеша
 */
export const getVideoProgressFromCache = (username: string): VideoProgress | null => {
  if (!username) return null;
  
  try {
    const key = KEYS.VIDEO_PROGRESS(username);
    const data = localStorage.getItem(key);
    if (!data) return null;
    
    const cached: CachedVideoProgress = JSON.parse(data);
    
    // Проверяем, не устарел ли кеш (для прогресса видео - 1 минута)
    if (Date.now() - cached.timestamp > 60 * 1000) {
      localStorage.removeItem(key);
      return null;
    }
    
    return cached.progress;
  } catch (err) {
    console.error('❌ Ошибка чтения прогресса видео из кеша:', err);
    return null;
  }
};

/**
 * Очищает весь кеш приложения
 */
export const clearAllCache = (): void => {
  try {
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        localStorage.removeItem(key);
      }
    });
    console.log('✅ Кеш очищен');
  } catch (err) {
    console.error('❌ Ошибка очистки кеша:', err);
  }
};

/**
 * Очищает кеш для конкретного пользователя
 */
export const clearUserCache = (username: string): void => {
  if (!username) return;
  
  try {
    Object.values(KEYS).forEach(getKey => {
      const key = getKey(username);
      localStorage.removeItem(key);
    });
    console.log(`✅ Кеш для ${username} очищен`);
  } catch (err) {
    console.error('❌ Ошибка очистки кеша пользователя:', err);
  }
};

/**
 * Получает размер кеша в байтах
 */
export const getCacheSize = (): number => {
  try {
    let size = 0;
    const keys = Object.keys(localStorage);
    keys.forEach(key => {
      if (key.startsWith(STORAGE_PREFIX)) {
        const value = localStorage.getItem(key);
        if (value) {
          size += key.length + value.length;
        }
      }
    });
    return size;
  } catch (err) {
    console.error('❌ Ошибка получения размера кеша:', err);
    return 0;
  }
};

