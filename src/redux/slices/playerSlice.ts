import { createSlice, type PayloadAction } from '@reduxjs/toolkit';
import type { PlayerState, VideoProgress } from '../../types';

const initialState: PlayerState = {
  playing: false,
  isPlayerActive: false,
  currentIndex: 0,
  videoProgress: {
    percent: 0,
    currentTime: 0,
    duration: 0,
  },
};

interface UpdatePlayerStatePayload {
  playing?: boolean;
  isPlayerActive?: boolean;
  currentIndex?: number;
}

const playerSlice = createSlice({
  name: 'player',
  initialState,
  reducers: {
    setPlaying: (state, action: PayloadAction<boolean>) => {
      state.playing = action.payload;
    },
    setIsPlayerActive: (state, action: PayloadAction<boolean>) => {
      state.isPlayerActive = action.payload;
    },
    setCurrentIndex: (state, action: PayloadAction<number>) => {
      state.currentIndex = action.payload;
    },
    setVideoProgress: (state, action: PayloadAction<Partial<VideoProgress>>) => {
      state.videoProgress = { ...state.videoProgress, ...action.payload };
    },
    updatePlayerState: (state, action: PayloadAction<UpdatePlayerStatePayload>) => {
      const { playing, isPlayerActive, currentIndex } = action.payload;
      if (playing !== undefined) state.playing = playing;
      if (isPlayerActive !== undefined) state.isPlayerActive = isPlayerActive;
      if (currentIndex !== undefined) state.currentIndex = currentIndex;
    },
  },
});

export const { setPlaying, setIsPlayerActive, setCurrentIndex, setVideoProgress, updatePlayerState } = playerSlice.actions;
export default playerSlice.reducer;

