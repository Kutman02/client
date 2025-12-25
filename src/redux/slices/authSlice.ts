import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { AuthState } from '../../types';

const initialState: AuthState = {
  accessCode: null,
  username: null,
  isVerified: false,
  token: null,
};

interface SetAccessCodePayload {
  accessCode: string;
  username: string;
}

interface SetAuthPayload {
  username: string;
  token: string;
}

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    setAuth: (state, action: PayloadAction<SetAuthPayload>) => {
      state.username = action.payload.username;
      state.token = action.payload.token;
      // Сохраняем в localStorage
      localStorage.setItem('username', action.payload.username);
      localStorage.setItem('token', action.payload.token);
    },
    setAccessCode: (state, action: PayloadAction<SetAccessCodePayload>) => {
      state.accessCode = action.payload.accessCode;
      state.username = action.payload.username;
      state.isVerified = true;
      // Сохраняем в localStorage (не sessionStorage)
      if (action.payload.accessCode && action.payload.username) {
        localStorage.setItem(`accessCode_${action.payload.username}`, action.payload.accessCode);
      }
    },
    clearAuth: (state) => {
      if (state.username) {
        localStorage.removeItem(`accessCode_${state.username}`);
      }
      localStorage.removeItem('username');
      localStorage.removeItem('token');
      state.accessCode = null;
      state.username = null;
      state.token = null;
      state.isVerified = false;
    },
    clearAccessCode: (state) => {
      if (state.username) {
        localStorage.removeItem(`accessCode_${state.username}`);
      }
      state.accessCode = null;
      state.isVerified = false;
    },
    loadFromStorage: (state) => {
      const savedUsername = localStorage.getItem('username');
      const savedToken = localStorage.getItem('token');
      
      // Проверяем, что username не является email (старые данные)
      if (savedUsername && savedToken) {
        if (savedUsername.includes('@')) {
          console.warn("⚠️ Обнаружен email в localStorage вместо username, очищаем старые данные");
          localStorage.removeItem('username');
          localStorage.removeItem('token');
          // Очищаем все старые коды доступа
          Object.keys(localStorage).forEach(key => {
            if (key.startsWith('accessCode_')) {
              localStorage.removeItem(key);
            }
          });
          return;
        }
        
        state.username = savedUsername;
        state.token = savedToken;
        // Загружаем код доступа если есть
        const savedCode = localStorage.getItem(`accessCode_${savedUsername}`);
        if (savedCode) {
          state.accessCode = savedCode;
          state.isVerified = true;
        }
      }
    },
  },
});

export const { setAuth, setAccessCode, clearAuth, clearAccessCode, loadFromStorage } = authSlice.actions;
export default authSlice.reducer;

