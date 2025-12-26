import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';
import type {
  Track,
  PlaylistData,
  AccessCodeData,
  PassengersData,
  User,
} from '../types';

const baseQuery = fetchBaseQuery({ 
  baseUrl: 'https://longheadedly-unprevailing-quinn.ngrok-free.dev/api/session',
  prepareHeaders: (headers, { getState }) => {
    // Получаем токен из Redux store
    const state = getState() as { auth: { token: string | null } };
    const token = state.auth?.token || localStorage.getItem('token');
    
    if (token) {
      headers.set('authorization', `Bearer ${token}`);
    }
    
    return headers;
  },
});

// Обертка для baseQuery с обработкой ошибок
const baseQueryWithErrorHandling = async (args: any, api: any, extraOptions: any) => {
  // Проверяем, если в URL есть пустые параметры, возвращаем ошибку
  if (typeof args === 'string' && (args.includes('/driver//') || args.includes('//'))) {
    return { error: { status: 400, data: { error: 'Invalid username parameter' } } };
  }
  
  const result = await baseQuery(args, api, extraOptions);
  
  // Логируем ошибки для отладки
  if (result.error) {
    const errorData = result.error.data;
    const errorMessage = typeof errorData === 'object' && errorData !== null && 'error' in errorData
      ? errorData.error
      : result.error.status === 404
      ? 'Маршрут не найден (404) - проверьте, что сервер запущен и перезапущен после изменений'
      : 'Неизвестная ошибка';
    
    console.error('❌ API Error:', {
      status: result.error.status,
      message: errorMessage,
      data: errorData,
      url: typeof args === 'string' ? args : args?.url,
      fullUrl: typeof args === 'string' 
        ? `https://longheadedly-unprevailing-quinn.ngrok-free.dev/api/session${args}`
        : args?.url 
        ? `https://longheadedly-unprevailing-quinn.ngrok-free.dev/api/session${args.url}`
        : 'unknown'
    });
    
    // Если это 404, не логируем как критическую ошибку, так как это может быть временная проблема
    if (result.error.status === 404) {
      console.warn('⚠️ Возможные причины 404:');
      console.warn('  1. Сервер не запущен или не перезапущен после изменений');
      console.warn('  2. Маршруты не зарегистрированы правильно');
      console.warn('  3. Пользователь не существует в базе данных');
    }
  }
  
  return result;
};

export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: baseQueryWithErrorHandling,
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
      { success: boolean },
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