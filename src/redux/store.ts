import { configureStore } from '@reduxjs/toolkit';
import { apiSlice } from '../api/apiSlice';
import authReducer from './slices/authSlice';
import playerReducer from './slices/playerSlice';
import type { AuthState } from '../types';
import type { PlayerState } from '../types';

export const store = configureStore({
  reducer: {
    [apiSlice.reducerPath]: apiSlice.reducer,
    auth: authReducer,
    player: playerReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware().concat(apiSlice.middleware),
});

export type RootState = {
  api: ReturnType<typeof apiSlice.reducer>;
  auth: AuthState;
  player: PlayerState;
};

export type AppDispatch = typeof store.dispatch;