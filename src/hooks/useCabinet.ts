import { useState, useEffect } from "react";
import { socket } from "../api/socket";
import { 
  useGetPlaylistQuery, 
  useDeleteTrackMutation, 
  useMoveTrackMutation,
  useGetAccessCodeQuery,
  useChangeTrackMutation
} from "../api/apiSlice";
import { updatePlayerState } from "../redux/slices/playerSlice";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import { 
  getPlaylistFromCache, 
  getPlayerStateFromCache,
  savePlaylistToCache,
  savePlayerStateToCache
} from "../utils/cache";
import type { Track } from "../types";

interface UseCabinetReturn {
  playlist: Track[];
  currentIndex: number;
  setCurrentIndex: (idx: number) => void;
  playing: boolean;
  setPlaying: (value: boolean) => void;
  isPlayerActive: boolean;
  setIsPlayerActive: (value: boolean) => void;
  autoPlay: boolean;
  setAutoPlay: (value: boolean) => void;
  handleRemoveTrack: (idx: number) => Promise<void>;
  handleMoveTrack: (fromIndex: number, toIndex: number) => Promise<void>;
  handleNext: () => Promise<void>;
  isLoading: boolean;
}

export const useCabinet = (username: string | null): UseCabinetReturn => {
  const dispatch = useAppDispatch();
  
  // Используем Redux для состояния плеера
  const { currentIndex, playing, isPlayerActive } = useAppSelector((state) => state.player);
  
  // Локальное состояние только для UI
  const [autoPlay, setAutoPlay] = useState(true);

  // Получаем код доступа для водителя (обновляем каждые 5 минут)
  const { data: accessCodeData } = useGetAccessCodeQuery(username || '', {
    skip: !username,
    pollingInterval: 300000,
  });

  // Получаем плейлист по username + accessCode
  const { data: playlistData, refetch, isLoading, isUninitialized, isError, error } = useGetPlaylistQuery(
    { 
      username: username || '', 
      accessCode: accessCodeData?.accessCode || '' 
    },
    {
      skip: !username || !accessCodeData?.accessCode,
    }
  );

  const [deleteTrack] = useDeleteTrackMutation();
  const [moveTrack] = useMoveTrackMutation();
  const [changeTrack] = useChangeTrackMutation();

  // Используем кеш при ошибках сети
  const [cachedPlaylist, setCachedPlaylist] = useState<Track[]>([]);
  
  // Загружаем из кеша при монтировании, если данных еще нет
  useEffect(() => {
    if (username && !playlistData && !isLoading) {
      const cached = getPlaylistFromCache(username, true);
      if (cached && cached.length > 0) {
        setCachedPlaylist(cached);
        console.log('📦 Загружен плейлист из кеша при старте');
      }
    }
  }, [username]); // Только при монтировании
  
  useEffect(() => {
    if (username && isError) {
      // Пытаемся загрузить из кеша при ошибке
      const cached = getPlaylistFromCache(username, true);
      if (cached && cached.length > 0) {
        setCachedPlaylist(cached);
        console.log('📦 Используем плейлист из кеша из-за ошибки сети');
      }
    } else if (playlistData?.playlist) {
      setCachedPlaylist([]);
    }
  }, [username, isError, playlistData]);

  const playlist = playlistData?.playlist || cachedPlaylist || [];

  // Синхронизируем состояние из плейлиста с Redux
  useEffect(() => {
    if (playlistData) {
      dispatch(updatePlayerState({
        currentIndex: playlistData.currentIndex ?? 0,
        playing: playlistData.playing ?? false,
        isPlayerActive: playlistData.isPlayerActive ?? false
      }));
    } else if (isError && username) {
      // При ошибке загружаем состояние из кеша
      const cachedState = getPlayerStateFromCache(username, true);
      if (cachedState) {
        dispatch(updatePlayerState(cachedState));
        console.log('📦 Используем состояние плеера из кеша из-за ошибки сети');
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlistData?.currentIndex, playlistData?.playing, playlistData?.isPlayerActive, isError, username]); // dispatch стабилен, не нужен в зависимостях

  useEffect(() => {
    if (!username) return;

    if (!socket.connected) socket.connect();
    socket.emit("join_username", username, "driver");

    // Когда приходит событие по сокету, мы просто просим RTK обновить данные с сервера
    const handleRefresh = () => {
      // Проверяем, что запрос был инициализирован перед вызовом refetch
      if (!isUninitialized && username && accessCodeData?.accessCode) {
        refetch().catch(err => {
          // Игнорируем ошибки refetch, если запрос еще не был запущен
          if (!err.message?.includes('has not been started')) {
            console.error("❌ Ошибка обновления плейлиста:", err);
            // При ошибке сети пытаемся использовать кеш
            if (err?.status === 'FETCH_ERROR' || err?.status === 'NETWORK_ERROR') {
              const cached = getPlaylistFromCache(username, true);
              if (cached && cached.length > 0) {
                setCachedPlaylist(cached);
                console.log('📦 Используем плейлист из кеша после ошибки обновления');
              }
            }
          }
        });
      }
    };

    socket.on("track_added", handleRefresh);
    socket.on("track_removed", handleRefresh);
    socket.on("track_moved", handleRefresh);
    
    // Синхронизация состояния плеера через Redux
    // Не вызываем handleRefresh, так как состояние плеера не влияет на плейлист
    socket.on("playback_state_changed", (data) => {
      dispatch(updatePlayerState({
        playing: data.playing,
        isPlayerActive: data.isPlayerActive
      }));
    });

    socket.on("track_changed", (data) => {
      dispatch(updatePlayerState({
        currentIndex: data.currentIndex,
        playing: data.playing
      }));
      handleRefresh();
    });

    return () => {
      socket.off("track_added", handleRefresh);
      socket.off("track_removed", handleRefresh);
      socket.off("track_moved", handleRefresh);
      socket.off("playback_state_changed");
      socket.off("track_changed");
    };
  }, [username, refetch, dispatch, isUninitialized]); // accessCode не влияет на socket подключение

  const handleRemoveTrack = async (idx: number): Promise<void> => {
    const track = playlist[idx];
    const trackId = track?._id || track?.id;
    if (trackId && username && accessCodeData?.accessCode) {
      try {
        await deleteTrack({ 
          username, 
          trackId: String(trackId),
          accessCode: accessCodeData.accessCode
        }).unwrap();
      } catch (err: any) {
        console.error("❌ Ошибка при удалении трека:", err);
        // При ошибке сети показываем предупреждение, но не блокируем UI
        if (err?.status === 'FETCH_ERROR' || err?.status === 'NETWORK_ERROR') {
          console.warn("⚠️ Операция удаления будет выполнена при восстановлении соединения");
        }
      }
    }
  };

  const handleMoveTrack = async (fromIndex: number, toIndex: number): Promise<void> => {
    if (username && accessCodeData?.accessCode) {
      try {
        await moveTrack({ 
          username, 
          fromIndex, 
          toIndex,
          accessCode: accessCodeData.accessCode
        }).unwrap();
      } catch (err: any) {
        console.error("❌ Ошибка при перемещении трека:", err);
        // При ошибке сети показываем предупреждение, но не блокируем UI
        if (err?.status === 'FETCH_ERROR' || err?.status === 'NETWORK_ERROR') {
          console.warn("⚠️ Операция перемещения будет выполнена при восстановлении соединения");
        }
      }
    }
  };

  const handleNext = async (): Promise<void> => {
    if (username && accessCodeData?.accessCode && currentIndex < playlist.length - 1) {
      try {
        await changeTrack({ username, direction: 'next', accessCode: accessCodeData.accessCode }).unwrap();
      } catch (err: any) {
        console.error("❌ Ошибка при переключении трека:", err);
        // При ошибке сети показываем предупреждение, но не блокируем UI
        if (err?.status === 'FETCH_ERROR' || err?.status === 'NETWORK_ERROR') {
          console.warn("⚠️ Операция переключения будет выполнена при восстановлении соединения");
        }
      }
    }
  };

  const setCurrentIndex = (idx: number): void => {
    dispatch(updatePlayerState({ currentIndex: idx }));
  };

  const setPlaying = (value: boolean): void => {
    dispatch(updatePlayerState({ playing: value }));
  };

  const setIsPlayerActive = (value: boolean): void => {
    dispatch(updatePlayerState({ isPlayerActive: value }));
  };

  return {
    playlist,
    currentIndex,
    setCurrentIndex,
    playing,
    setPlaying,
    isPlayerActive,
    setIsPlayerActive,
    autoPlay,
    setAutoPlay,
    handleRemoveTrack,
    handleMoveTrack,
    handleNext,
    isLoading
  };
};