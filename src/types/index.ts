// Global types for the application

export interface Track {
  _id?: string;
  id?: string;
  videoId: string;
  title: string;
  thumbnail: string;
  addedAt?: Date;
}

export interface PlaylistData {
  playlist: Track[];
  currentIndex: number;
  playing: boolean;
  isPlayerActive: boolean;
}

export interface VideoProgress {
  percent: number;
  currentTime: number;
  duration: number;
}

export interface AccessCodeData {
  accessCode: string;
  updatedAt?: Date;
  nextUpdateAt?: Date;
}

export interface Passenger {
  id: string;
  isOnline: boolean;
  lastSeen?: string; // ISO date string
  joinedAt?: string; // ISO date string
}

export interface PassengersData {
  passengers: Passenger[];
}

export interface User {
  username: string;
  password?: string;
}

export interface AuthState {
  accessCode: string | null;
  isVerified: boolean;
  username: string | null;
  token: string | null;
}

export interface PlayerState {
  playing: boolean;
  isPlayerActive: boolean;
  currentIndex: number;
  videoProgress: VideoProgress;
}

export interface YouTubeVideo {
  id: {
    videoId: string;
  };
  snippet: {
    title: string;
    channelTitle: string;
    thumbnails: {
      default: {
        url: string;
      };
    };
  };
}

export interface YouTubeSearchResponse {
  items: YouTubeVideo[];
}

export interface SocketEvents {
  track_added: () => void;
  track_removed: () => void;
  track_moved: () => void;
  current_track_changed: () => void;
  playback_state_changed: (data: { playing: boolean; isPlayerActive: boolean }) => void;
  track_changed: (data: { currentIndex: number; playing: boolean }) => void;
  video_seeked: (data: { percent: number }) => void;
  video_progress_update: (data: VideoProgress) => void;
  passenger_connected: (data: { passengerId: string; timestamp: Date }) => void;
  passenger_disconnected: (data: { passengerId: string; timestamp: Date }) => void;
  passenger_kicked: (data: { passengerId: string; timestamp: Date; wasOnline?: boolean }) => void;
}

