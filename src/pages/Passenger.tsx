import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { FaHeart } from "react-icons/fa";
import { socket } from "../api/socket";
import PassengerSearch from "../components/Passenger/PassengerSearch";
import PassengerPlaylist from "../components/Passenger/PassengerPlaylist";
import AccessCodeForm from "../components/Passenger/AccessCodeForm";
import { PassengerPlayerControls } from "../components/Passenger/PassengerPlayerControls";
import { PlaylistLimitModal } from "../components/PlaylistLimitModal";
import { ClearCacheButton } from "../components/ClearCacheButton";
import DonationModal from "../components/DonationModal";
import { PassengerKickedNotification } from "../components/PassengerKickedNotification";
import { 
  savePlaylistToCache, 
  savePlayerStateToCache,
  getPlayerStateFromCache,
  saveVideoProgressToCache,
  getVideoProgressFromCache
} from "../utils/cache";
import { 
  useGetPlaylistQuery, 
  useAddTrackMutation, 
  useDeleteTrackMutation, 
  useMoveTrackMutation,
  useControlPlaybackMutation,
  useChangeTrackMutation,
  useSeekVideoMutation
} from "../api/apiSlice";
import { clearAccessCode, setAccessCode } from "../redux/slices/authSlice";
import { updatePlayerState, setVideoProgress } from "../redux/slices/playerSlice";
import { useAppDispatch, useAppSelector } from "../redux/hooks";
import type { Track, VideoProgress } from "../types";

const Passenger: React.FC = () => {
  const { username } = useParams<{ username: string }>();
  const dispatch = useAppDispatch();
  
  // Redux state
  const { accessCode, isVerified } = useAppSelector((state) => state.auth);
  const { playing, isPlayerActive, currentIndex, videoProgress } = useAppSelector((state) => state.player);

  // Генерируем уникальный ID пассажира (сохраняем в localStorage)
  const [passengerId] = useState(() => {
    const stored = localStorage.getItem(`passengerId_${username}`);
    if (stored) return stored;
    const newId = `passenger_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    localStorage.setItem(`passengerId_${username}`, newId);
    return newId;
  });

  // Загружаем код из localStorage при монтировании
  useEffect(() => {
    if (username) {
      // Загружаем сохраненный код доступа для этого username
      const savedCode = localStorage.getItem(`accessCode_${username}`);
      if (savedCode) {
        dispatch(setAccessCode({ username, accessCode: savedCode }));
      }
    }
  }, [username, dispatch]);

  // Получаем плейлист (только если есть username, код проверен и accessCode доступен)
  // Polling отключен - обновления идут через socket события
  const { 
    data: playlistData, 
    isLoading, 
    isError, 
    refetch,
    isUninitialized
  } = useGetPlaylistQuery(
    { username: username || '', accessCode: accessCode || '' }, 
    { 
      skip: !username || !isVerified || !accessCode
    }
  );

  const playlist = playlistData?.playlist || [];

  // Кеширование плейлиста
  useEffect(() => {
    if (username && playlist.length > 0) {
      savePlaylistToCache(username, playlist, false);
    }
  }, [playlist, username]);

  // Кеширование состояния плеера
  useEffect(() => {
    if (username) {
      savePlayerStateToCache(username, {
        currentIndex,
        playing,
        isPlayerActive
      }, false);
    }
  }, [currentIndex, playing, isPlayerActive, username]);

  // Кеширование прогресса видео
  useEffect(() => {
    if (username && videoProgress.duration > 0) {
      saveVideoProgressToCache(username, videoProgress);
    }
  }, [videoProgress, username]);

  // Восстановление данных из кеша при загрузке
  useEffect(() => {
    if (username) {
      const cachedPlayerState = getPlayerStateFromCache(username, false);
      const cachedProgress = getVideoProgressFromCache(username);

      // Восстанавливаем прогресс видео если есть
      if (cachedProgress) {
        dispatch(setVideoProgress(cachedProgress));
      }

      // Восстанавливаем состояние плеера если есть
      if (cachedPlayerState) {
        dispatch(updatePlayerState(cachedPlayerState));
      }
    }
  }, [username, dispatch]);

  // Состояние для модального окна превышения лимита
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [limitModalData, setLimitModalData] = useState<{ currentCount: number; maxCount: number } | null>(null);
  
  // Состояние для уведомления о выгоне
  const [kickedNotificationOpen, setKickedNotificationOpen] = useState(false);
  
  // Состояние для модального окна доната
  const [isDonationModalOpen, setIsDonationModalOpen] = useState<boolean>(false);

  // Синхронизируем состояние из плейлиста с Redux (все данные уже в playlistData)
  useEffect(() => {
    if (playlistData) {
      dispatch(updatePlayerState({
        currentIndex: playlistData.currentIndex ?? 0,
        playing: playlistData.playing ?? false,
        isPlayerActive: playlistData.isPlayerActive ?? false
      }));
    }
  }, [playlistData?.currentIndex, playlistData?.playing, playlistData?.isPlayerActive, dispatch]);

  const currentTrack = playlist[currentIndex];

  // Мутации
  const [addTrack] = useAddTrackMutation();
  const [deleteTrack] = useDeleteTrackMutation();
  const [moveTrack] = useMoveTrackMutation();
  const [controlPlayback] = useControlPlaybackMutation();
  const [changeTrack] = useChangeTrackMutation();
  const [seekVideo] = useSeekVideoMutation();

  // Socket.IO синхронизация по username
  useEffect(() => {
    if (!username || !isVerified) return;

    if (!socket.connected) socket.connect();
    socket.emit("join_username", username, "passenger", passengerId);

    const handleUpdate = () => {
      // Проверяем, что запрос был инициализирован перед вызовом refetch
      if (!isUninitialized && username && isVerified && accessCode) {
        refetch().catch(err => {
          // Игнорируем ошибки refetch, если запрос еще не был запущен
          if (!err.message?.includes('has not been started')) {
            console.error("Ошибка обновления плейлиста:", err);
          }
        });
      }
    };

    socket.on("track_added", handleUpdate);
    socket.on("track_removed", handleUpdate);
    socket.on("track_moved", handleUpdate);
    socket.on("current_track_changed", handleUpdate);
    
    socket.on("playback_state_changed", (data: { playing: boolean; isPlayerActive: boolean }) => {
      dispatch(updatePlayerState({
        playing: data.playing,
        isPlayerActive: data.isPlayerActive
      }));
    });

    socket.on("track_changed", (data: { currentIndex: number; playing: boolean }) => {
      dispatch(updatePlayerState({ 
        currentIndex: data.currentIndex,
        playing: data.playing 
      }));
      handleUpdate();
    });

    socket.on("video_seeked", (data: { percent: number }) => {
      // При перемотке обновляем percent и вычисляем currentTime на основе существующего duration
      const currentDuration = videoProgress.duration || 0;
      const newCurrentTime = currentDuration > 0 ? (data.percent / 100) * currentDuration : 0;
      dispatch(setVideoProgress({ 
        percent: data.percent,
        currentTime: newCurrentTime
      }));
    });

    // Получаем обновления прогресса от водителя
    socket.on("video_progress_update", (data: VideoProgress) => {
      // Обновляем только если duration валиден (больше 0)
      if (data.duration && data.duration > 0) {
        dispatch(setVideoProgress({
          percent: data.percent,
          currentTime: data.currentTime || 0,
          duration: data.duration
        }));
      } else {
        // Если duration не валиден, обновляем только percent и currentTime
        dispatch(setVideoProgress({
          percent: data.percent,
          currentTime: data.currentTime || 0
        }));
      }
    });

    socket.on("passenger_kicked", (_data: { passengerId: string; timestamp: Date }) => {
      console.log("👋 Вы вышли из системы");
      dispatch(clearAccessCode());
      setKickedNotificationOpen(true);
    });

    return () => {
      socket.off("track_added", handleUpdate);
      socket.off("track_removed", handleUpdate);
      socket.off("track_moved", handleUpdate);
      socket.off("current_track_changed", handleUpdate);
      socket.off("playback_state_changed");
      socket.off("track_changed");
      socket.off("video_seeked");
      socket.off("video_progress_update");
      socket.off("passenger_kicked");
    };
  }, [username, isVerified, refetch, dispatch, isUninitialized, accessCode]);

  // Функция удаления самого старого трека (первого в плейлисте)
  const handleDeleteOldestTrack = async (): Promise<void> => {
    if (playlist.length > 0 && accessCode && username) {
      try {
        const oldestTrack = playlist[0];
        if (oldestTrack) {
          const trackId = oldestTrack._id || oldestTrack.id;
          if (trackId) {
            await handleRemoveTrack(String(trackId));
          }
        }
      } catch (err) {
        console.error("❌ Ошибка при удалении старого трека:", err);
      }
    }
  };

  // Обработчики действий
  const handleAddTrack = async (trackData: Omit<Track, '_id' | 'id'>): Promise<boolean> => {
    if (!accessCode || !username) {
      dispatch(clearAccessCode());
      return false;
    }
    try {
      await addTrack({ username, trackData, accessCode }).unwrap();
      return true;
    } catch (err: any) {
      if (err && typeof err === 'object' && 'status' in err) {
        if (err.status === 401) {
          dispatch(clearAccessCode());
        } else if (err.status === 400 && (err.data?.error === "PLAYLIST_LIMIT_EXCEEDED" || err.data?.error)) {
          // Обработка превышения лимита плейлиста
          const errorData = err.data || {};
          setLimitModalData({
            currentCount: errorData.currentCount || playlist.length,
            maxCount: errorData.maxCount || 5
          });
          setLimitModalOpen(true);
        }
      }
      return false;
    }
  };

  const handleRemoveTrack = async (trackId: string): Promise<void> => {
    if (!accessCode || !username) {
      dispatch(clearAccessCode());
      return;
    }
    try {
      await deleteTrack({ username, trackId, accessCode }).unwrap();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'status' in err && err.status === 401) {
        dispatch(clearAccessCode());
      }
    }
  };

  const handleMoveTrack = async (fromIndex: number, toIndex: number): Promise<void> => {
    if (!accessCode || !username) {
      dispatch(clearAccessCode());
      return;
    }
    try {
      await moveTrack({ username, fromIndex, toIndex, accessCode }).unwrap();
    } catch (err: unknown) {
      if (err && typeof err === 'object' && 'status' in err && err.status === 401) {
        dispatch(clearAccessCode());
      }
    }
  };

  const handleTogglePlay = async (): Promise<void> => {
    if (!accessCode || !username) return;
    try {
      const newPlaying = !playing;
      // Если плеер не активен, активируем его при нажатии на "Играть"
      const shouldActivatePlayer = !isPlayerActive && newPlaying;
      
      await controlPlayback({
        username,
        playing: newPlaying,
        isPlayerActive: shouldActivatePlayer ? true : isPlayerActive,
        accessCode
      }).unwrap();
      
      // Обновляем локальное состояние
      if (shouldActivatePlayer) {
        dispatch(updatePlayerState({ isPlayerActive: true, playing: newPlaying }));
      }
    } catch (err: any) {
      if (err && typeof err === 'object' && 'status' in err) {
        if (err.status === 401) {
          dispatch(clearAccessCode());
        } else if (err.status === 'FETCH_ERROR' || err.status === 'NETWORK_ERROR') {
          console.warn("⚠️ Ошибка сети при управлении воспроизведением. Повторная попытка...");
          // Обновляем локальное состояние даже при ошибке сети для отзывчивости UI
          dispatch(updatePlayerState({ playing: !playing }));
        }
      }
    }
  };

  const handleNext = async (): Promise<void> => {
    if (!accessCode || !username) return;
    try {
      await changeTrack({ username, direction: 'next', accessCode }).unwrap();
    } catch (err: any) {
      if (err && typeof err === 'object' && 'status' in err) {
        if (err.status === 401) {
          dispatch(clearAccessCode());
        } else if (err.status === 'FETCH_ERROR' || err.status === 'NETWORK_ERROR') {
          console.warn("⚠️ Ошибка сети при переключении трека. Повторная попытка...");
        }
      }
    }
  };

  const handlePrevious = async (): Promise<void> => {
    if (!accessCode || !username) return;
    try {
      await changeTrack({ username, direction: 'previous', accessCode }).unwrap();
    } catch (err: any) {
      if (err && typeof err === 'object' && 'status' in err) {
        if (err.status === 401) {
          dispatch(clearAccessCode());
        } else if (err.status === 'FETCH_ERROR' || err.status === 'NETWORK_ERROR') {
          console.warn("⚠️ Ошибка сети при переключении трека. Повторная попытка...");
        }
      }
    }
  };

  const handleSeek = async (percent: number): Promise<void> => {
    if (!accessCode || !username) return;
    
    // Вычисляем currentTime на основе percent и текущей duration
    const currentDuration = videoProgress.duration || 0;
    const newCurrentTime = currentDuration > 0 ? (percent / 100) * currentDuration : 0;
    
    // Обновляем локально сразу для отзывчивости
    dispatch(setVideoProgress({ 
      percent,
      currentTime: newCurrentTime
    }));
    
    // Отправляем на сервер для синхронизации
    try {
      await seekVideo({ username, percent, accessCode }).unwrap();
    } catch (err: any) {
      if (err && typeof err === 'object' && 'status' in err) {
        if (err.status === 401) {
          dispatch(clearAccessCode());
        } else if (err.status === 'FETCH_ERROR' || err.status === 'NETWORK_ERROR') {
          console.warn("⚠️ Ошибка сети при перемотке. Повторная попытка...");
        }
      }
    }
  };

  const handleCodeVerified = (): void => {
    // Код уже сохранен в Redux через AccessCodeForm
  };

  // Состояние ошибки - очищаем код в useEffect, а не во время рендеринга
  // ВАЖНО: все хуки должны быть ПЕРЕД условными возвратами
  useEffect(() => {
    if (isError) {
      dispatch(clearAccessCode());
    }
  }, [isError, dispatch]);

  // Если код не проверен, показываем форму
  if (!isVerified) {
    return <AccessCodeForm username={username} onCodeVerified={handleCodeVerified} />;
  }

  // Состояние загрузки
  if (isLoading) {
    return (
      <div className="min-h-screen bg-[#0f0f0f] flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500"></div>
      </div>
    );
  }

  if (isError) {
    return <AccessCodeForm username={username} onCodeVerified={handleCodeVerified} />;
  }

  return (
    <div className="min-h-screen bg-[#0f0f0f] p-4 md:p-8 text-white font-sans">
      <div className="max-w-5xl mx-auto flex flex-col gap-6">
        {/* Хедер */}
        <div className="flex flex-col md:flex-row items-stretch gap-3">
          <div className="shrink-0 flex items-center bg-white/5 backdrop-blur-md px-4 h-12 rounded-2xl border border-white/10 gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_10px_#22c55e]"></div>
            <span className="text-white font-bold text-sm uppercase">Водитель: {username}</span>
          </div>
          <div className="grow">
            <PassengerSearch isAccessCodeVerified={isVerified} onTrackAdded={handleAddTrack} />
          </div>
        </div>

        {/* Текущий трек и управление плеером */}
        {currentTrack && (
          <div className="space-y-4">
            <div className="bg-linear-to-r from-indigo-600/20 to-blue-600/20 rounded-3xl border border-indigo-500/30 shadow-2xl overflow-hidden p-6">
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/20 shrink-0">
                  {currentTrack.thumbnail ? (
                    <img src={currentTrack.thumbnail} alt={currentTrack.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-indigo-400">
                      <span className="text-2xl">🎵</span>
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className={`w-2 h-2 rounded-full ${playing ? 'bg-green-500 animate-pulse' : 'bg-gray-500'}`}></span>
                    <span className="text-[10px] text-green-400 font-black uppercase tracking-widest">
                      {playing ? 'На машине сейчас играет' : 'На паузе'}
                    </span>
                  </div>
                  <p className="text-white font-bold text-lg truncate">{currentTrack.title}</p>
                </div>
              </div>
            </div>

            <PassengerPlayerControls
              playing={playing}
              onTogglePlay={handleTogglePlay}
              onNext={handleNext}
              onPrevious={handlePrevious}
              trackTitle={currentTrack.title}
              progress={videoProgress}
              onSeek={handleSeek}
              disabled={false}
            />
          </div>
        )}

        {/* Плейлист */}
        <div className="bg-[#1a1a1a] rounded-3xl border border-white/5 shadow-2xl overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
              <h3 className="text-xs font-bold text-white/30 uppercase tracking-widest">Текущая очередь</h3>
              <span className="text-xs text-indigo-400 font-black">{playlist.length} ТРЕКОВ</span>
            </div>
          </div>
          <div className="h-[60vh] overflow-y-auto custom-scrollbar px-6 pb-6">
            <PassengerPlaylist 
              playlist={playlist}
              currentIndex={currentIndex}
              onRemoveTrack={handleRemoveTrack}
              onMoveTrack={handleMoveTrack}
            />
          </div>
        </div>

        {/* Футер с кнопкой очистки кеша */}
        <footer className="mt-8 pt-6 border-t border-white/5">
          <div className="flex items-center justify-center">
            <ClearCacheButton />
          </div>
        </footer>
      </div>

      {/* Модальное окно превышения лимита плейлиста */}
      <PlaylistLimitModal
        isOpen={limitModalOpen}
        onClose={() => setLimitModalOpen(false)}
        currentCount={limitModalData?.currentCount || 5}
        maxCount={limitModalData?.maxCount || 5}
        onDeleteOldest={handleDeleteOldestTrack}
      />

      {/* Фиксированная иконка доната */}
      <button
        onClick={() => setIsDonationModalOpen(true)}
        className="fixed bottom-6 right-6 z-40 w-14 h-14 md:w-16 md:h-16 bg-linear-to-br from-pink-600 to-red-600 rounded-full flex items-center justify-center shadow-lg shadow-pink-500/50 hover:shadow-pink-500/70 transition-all duration-300 hover:scale-110 active:scale-95"
        aria-label="Поддержать проект"
      >
        <FaHeart className="text-white text-lg md:text-xl" />
      </button>

      {/* Модальное окно доната */}
      <DonationModal 
        isOpen={isDonationModalOpen} 
        onClose={() => setIsDonationModalOpen(false)} 
      />

      {/* Уведомление о выгоне */}
      <PassengerKickedNotification
        isOpen={kickedNotificationOpen}
        onClose={() => setKickedNotificationOpen(false)}
        message="Вы вышли из системы. Спасибо, что были с нами!"
      />
    </div>
  );
};

export default Passenger;
