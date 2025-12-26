import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  Track,
  PlaylistData,
  AccessCodeData,
  PassengersData,
} from '../types';

const API_BASE_URL = 'https://longheadedly-unprevailing-quinn.ngrok-free.dev/api/session';

const baseQuery = fetchBaseQuery({ 
  baseUrl: API_BASE_URL,
  // Таймаут для запросов - 30 секунд (увеличено для медленного интернета)
  timeout: 30000,
  prepareHeaders: (headers, { getState }) => {
    // Заголовок для обхода предупреждения ngrok
    headers.set('ngrok-skip-browser-warning', 'true');
    
    // Получаем токен из Redux store
    const state = getState() as { auth: { token: string | null } };
    const token = state.auth?.token || localStorage.getItem('token');
    
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    
    return headers;
  },
});

// Retry логика для запросов при ошибках сети
const retryWithBackoff = async (
  fn: () => any,
  maxRetries: number = 3,
  baseDelay: number = 1000
): Promise<any> => {
  let lastError: any;
  
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      const result = await Promise.resolve(fn());
      
      // Проверяем, есть ли ошибка в результате
      if (result && typeof result === 'object' && 'error' in result) {
        const error = result.error;
        
        // Не повторяем для определенных ошибок
        if (
          error?.status === 400 || // Bad Request
          error?.status === 401 || // Unauthorized
          error?.status === 403 || // Forbidden
          error?.status === 404 || // Not Found
          error?.status === 422    // Unprocessable Entity
        ) {
          return result;
        }
        
        // Если это ошибка сети, повторяем попытку
        if (
          error?.status === 'FETCH_ERROR' || 
          error?.status === 'NETWORK_ERROR' ||
          error?.status === 'TIMEOUT_ERROR' ||
          (typeof error?.status === 'number' && error.status >= 500)
        ) {
          lastError = result;
          
          // Если это последняя попытка, возвращаем ошибку
          if (attempt === maxRetries) {
            return result;
          }
          
          // Экспоненциальная задержка: 1s, 2s, 4s
          const delay = baseDelay * Math.pow(2, attempt);
          console.log(`🔄 Повторная попытка запроса через ${delay}ms (попытка ${attempt + 1}/${maxRetries + 1})`);
          
          await new Promise(resolve => setTimeout(resolve, delay));
          continue;
        }
      }
      
      // Если нет ошибки, возвращаем результат
      return result;
    } catch (error: any) {
      lastError = error;
      
      // Не повторяем для определенных ошибок
      if (
        error?.status === 400 ||
        error?.status === 401 ||
        error?.status === 403 ||
        error?.status === 404 ||
        error?.status === 422
      ) {
        throw error;
      }
      
      // Если это последняя попытка, выбрасываем ошибку
      if (attempt === maxRetries) {
        throw error;
      }
      
      // Экспоненциальная задержка: 1s, 2s, 4s
      const delay = baseDelay * Math.pow(2, attempt);
      console.log(`🔄 Повторная попытка запроса через ${delay}ms (попытка ${attempt + 1}/${maxRetries + 1})`);
      
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  return lastError;
};

// Обертка для baseQuery с обработкой ошибок и retry логикой
const baseQueryWithErrorHandling = async (args: any, api: any, extraOptions: any) => {
  // Проверяем, если в URL есть пустые параметры, возвращаем ошибку
  if (typeof args === 'string' && (args.includes('/driver//') || args.includes('//'))) {
    return { error: { status: 400, data: { error: 'Invalid username parameter' } } };
  }
  
  // Проверяем онлайн статус
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return { 
      error: { 
        status: 'NETWORK_ERROR', 
        data: { error: 'Нет подключения к интернету. Проверьте соединение.' } 
      } 
    };
  }
  
  // Выполняем запрос с retry логикой
  const result = await retryWithBackoff(
    () => baseQuery(args, api, extraOptions),
    3, // Максимум 3 повторные попытки
    1000 // Начальная задержка 1 секунда
  );
  
  // Логируем ошибки для отладки
  if (result.error) {
    const errorData = result.error.data;
    const errorStatus = result.error.status;
    
    // Определяем URL для логирования
    const url = typeof args === 'string' ? args : args?.url;
    const fullUrl = typeof args === 'string' 
      ? `${API_BASE_URL}${args}`
      : args?.url 
      ? `${API_BASE_URL}${args.url}`
      : 'unknown';
    
    // Обработка PARSING_ERROR (когда сервер возвращает HTML вместо JSON)
    let errorMessage = 'Неизвестная ошибка';
    let parsedErrorData = errorData;
    
    if (errorStatus === 'PARSING_ERROR' || (typeof errorData === 'string' && errorData.trim().startsWith('<!DOCTYPE'))) {
      // Сервер вернул HTML вместо JSON
      errorMessage = 'Сервер вернул HTML вместо JSON. Возможно, маршрут не существует или сервер вернул страницу ошибки.';
      parsedErrorData = {
        type: 'HTML_RESPONSE',
        preview: typeof errorData === 'string' 
          ? errorData.substring(0, 200) + (errorData.length > 200 ? '...' : '')
          : errorData
      };
      
      // Пытаемся извлечь информацию из HTML (например, заголовок страницы)
      if (typeof errorData === 'string') {
        const titleMatch = errorData.match(/<title[^>]*>([^<]+)<\/title>/i);
        if (titleMatch) {
          errorMessage = `Сервер вернул HTML страницу: "${titleMatch[1]}"`;
        }
      }
    } else if (typeof errorData === 'object' && errorData !== null) {
      // Стандартная обработка объекта ошибки
      if ('error' in errorData) {
        errorMessage = String(errorData.error);
      } else if ('message' in errorData) {
        errorMessage = String(errorData.message);
      }
    } else if (errorStatus === 404) {
      errorMessage = 'Маршрут не найден (404) - проверьте, что сервер запущен и перезапущен после изменений';
    } else if (errorStatus === 401) {
      errorMessage = 'Не авторизован (401) - проверьте токен доступа';
    } else if (errorStatus === 403) {
      errorMessage = 'Доступ запрещен (403)';
    } else if (errorStatus === 500) {
      errorMessage = 'Внутренняя ошибка сервера (500)';
    }
    
    // Детальное логирование ошибки (раздельно для лучшей читаемости в консоли)
    console.group('❌ API Error');
    console.error('Status:', errorStatus);
    console.error('Message:', errorMessage);
    console.error('URL:', url);
    console.error('Full URL:', fullUrl);
    
    // Логируем данные ошибки с JSON.stringify для видимости
    if (typeof parsedErrorData === 'object' && parsedErrorData !== null) {
      console.error('Error Data (JSON):', JSON.stringify(parsedErrorData, null, 2));
    } else {
      console.error('Error Data:', parsedErrorData);
    }
    
    if (typeof errorData === 'string') {
      const preview = errorData.length > 500 ? errorData.substring(0, 500) + '... (truncated)' : errorData;
      console.error('Original Data (preview):', preview);
      if (errorData.length > 500) {
        console.error('Original Data (full length):', errorData.length, 'characters');
      }
    } else if (typeof errorData === 'object' && errorData !== null) {
      console.error('Original Data (JSON):', JSON.stringify(errorData, null, 2));
    } else {
      console.error('Original Data:', errorData);
    }
    console.groupEnd();
    
    // Дополнительные предупреждения для специфических ошибок
    if (errorStatus === 404 || errorStatus === 'PARSING_ERROR') {
      console.warn('⚠️ Возможные причины:');
      console.warn('  1. Сервер не запущен или не перезапущен после изменений');
      console.warn('  2. Маршруты не зарегистрированы правильно');
      console.warn('  3. Пользователь не существует в базе данных');
      console.warn('  4. Сервер возвращает HTML страницу ошибки вместо JSON');
    }
    
    // Нормализуем ошибку для RTK Query
    if (errorStatus === 'PARSING_ERROR') {
      result.error = {
        ...result.error,
        status: 500,
        data: {
          error: errorMessage,
          originalStatus: 'PARSING_ERROR',
          url: fullUrl
        }
      };
    }
  }
  
  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithErrorHandling,
  // Настройки для стабильной работы при плохом соединении
  keepUnusedDataFor: 60, // Храним неиспользуемые данные 60 секунд для быстрого доступа
  refetchOnMountOrArgChange: 30, // Обновляем данные если они старше 30 секунд
  refetchOnFocus: true, // Обновляем данные при фокусе на вкладке
  refetchOnReconnect: true, // Обновляем данные при восстановлении соединения
  tagTypes: ['Playlist', 'Session', 'Passengers'],
  endpoints: (builder) => ({
    // Получение плейлиста по username + accessCode
    getPlaylist: builder.query<PlaylistData, { username: string; accessCode: string }>({
      query: ({ username, accessCode }) => `/playlist/${encodeURIComponent(username)}?accessCode=${encodeURIComponent(accessCode)}`,
      providesTags: ['Session', 'Playlist'],
    }),

    // Мутации используют username + accessCode
    addTrack: builder.mutation<
      { success: boolean },
      { username: string; trackData: Omit<Track, '_id' | 'id'>; accessCode: string }
    >({
      query: ({ username, trackData, accessCode }) => ({
        url: `/${encodeURIComponent(username)}/track`,
        method: 'POST',
        body: { ...trackData, accessCode },
      }),
      invalidatesTags: ['Playlist', 'Session'],
    }),

    deleteTrack: builder.mutation<
      { success: boolean },
      { username: string; trackId: string; accessCode: string }
    >({
      query: ({ username, trackId, accessCode }) => ({
        url: `/${encodeURIComponent(username)}/track`,
        method: 'DELETE',
        body: { trackId, accessCode },
      }),
      invalidatesTags: ['Playlist', 'Session'],
    }),

    moveTrack: builder.mutation<
      { success: boolean },
      { username: string; fromIndex: number; toIndex: number; accessCode: string }
    >({
      query: ({ username, fromIndex, toIndex, accessCode }) => ({
        url: `/${encodeURIComponent(username)}/track/move`,
        method: 'PATCH',
        body: { fromIndex, toIndex, accessCode },
      }),
      invalidatesTags: ['Playlist', 'Session'],
    }),

    getCurrentTrack: builder.query<{ currentTrack: Track | null; currentIndex: number; playlistLength: number; playing: boolean; isPlayerActive: boolean }, string>({
      query: (username) => `/${encodeURIComponent(username)}/current-track`,
      providesTags: ['Session'],
    }),

    login: builder.mutation<
      { success?: boolean; token: string; username: string },
      { email: string; password: string }
    >({
      query: (credentials) => ({ url: '/login', method: 'POST', body: credentials }),
    }),

    register: builder.mutation<
      { success: boolean },
      { username: string; email: string; password: string }
    >({
      query: (userData) => ({ url: '/register', method: 'POST', body: userData }),
    }),

    // Код доступа
    getAccessCode: builder.query<AccessCodeData, string>({
      query: (username) => {
        if (!username || username.trim() === '') {
          throw new Error('Username is required');
        }
        return `/driver/${encodeURIComponent(username)}/access-code`;
      },
      providesTags: ['Session'],
    }),

    verifyAccessCode: builder.mutation<
      { success: boolean; valid: boolean },
      { username: string; accessCode: string }
    >({
      query: ({ username, accessCode }) => ({
        url: `/verify/${encodeURIComponent(username)}/access-code`,
        method: 'POST',
        body: { accessCode },
      }),
    }),

    // Управление плеером (через username)
    getPlayerState: builder.query<
      { playing: boolean; isPlayerActive: boolean },
      string
    >({
      query: (username) => `/player/${encodeURIComponent(username)}/state`,
      providesTags: ['Session'],
    }),

    controlPlayback: builder.mutation<
      { success: boolean },
      { username: string; playing: boolean; isPlayerActive: boolean; accessCode: string }
    >({
      query: ({ username, playing, isPlayerActive, accessCode }) => ({
        url: `/player/${encodeURIComponent(username)}/playback`,
        method: 'PATCH',
        body: { playing, isPlayerActive, accessCode },
      }),
      // Не инвалидируем теги, так как состояние плеера синхронизируется через socket
      // и не требует refetch плейлиста
    }),

    changeTrack: builder.mutation<
      { success: boolean },
      { username: string; direction?: 'next' | 'previous'; index?: number; playing?: boolean; accessCode: string }
    >({
      query: ({ username, direction, index, playing, accessCode }) => ({
        url: `/player/${encodeURIComponent(username)}/track`,
        method: 'PATCH',
        body: { ...(direction && { direction }), ...(typeof index === 'number' && { index }), ...(playing !== undefined && { playing }), accessCode },
      }),
      invalidatesTags: ['Session'],
    }),

    seekVideo: builder.mutation<
      { success: boolean; percent: number },
      { username: string; percent: number; accessCode: string }
    >({
      query: ({ username, percent, accessCode }) => ({
        url: `/player/${encodeURIComponent(username)}/seek`,
        method: 'PATCH',
        body: { percent, accessCode },
      }),
    }),

    // Управление пассажирами (для водителя)
    getConnectedPassengers: builder.query<PassengersData, string>({
      query: (username) => {
        if (!username || username.trim() === '') {
          throw new Error('Username is required');
        }
        return `/driver/${encodeURIComponent(username)}/passengers`;
      },
      providesTags: ['Passengers'],
    }),

    kickPassenger: builder.mutation<
      { success: boolean; message: string; passengerId: string; wasOnline: boolean },
      { username: string; passengerId: string; accessCode: string }
    >({
      query: ({ username, passengerId, accessCode }) => ({
        url: `/driver/${encodeURIComponent(username)}/kick`,
        method: 'POST',
        body: { passengerId, accessCode },
      }),
      invalidatesTags: ['Passengers'],
    }),

    forgetPassenger: builder.mutation<
      { success: boolean },
      { username: string; passengerId: string; accessCode: string }
    >({
      query: ({ username, passengerId, accessCode }) => ({
        url: `/driver/${encodeURIComponent(username)}/forget`,
        method: 'POST',
        body: { passengerId, accessCode },
      }),
      invalidatesTags: ['Passengers'],
    }),
  }),
});

export const { 
  useGetPlaylistQuery, 
  useAddTrackMutation, 
  useDeleteTrackMutation, 
  useMoveTrackMutation,
  useGetCurrentTrackQuery,
  useLoginMutation,
  useRegisterMutation,
  useGetAccessCodeQuery,
  useVerifyAccessCodeMutation,
  useGetPlayerStateQuery,
  useControlPlaybackMutation,
  useChangeTrackMutation,
  useSeekVideoMutation,
  useGetConnectedPassengersQuery,
  useKickPassengerMutation,
  useForgetPassengerMutation
} = apiSlice;