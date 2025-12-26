import React, { useState, useEffect, useRef } from "react";
import { MdErrorOutline } from "react-icons/md";
import { FaHeart } from "react-icons/fa";
import { socket } from "../api/socket";

// Импорт компонентов
import { VideoPlayer } from "../components/Cabinet/VideoPlayer";
import { TrackList } from "../components/Cabinet/TrackList";
import { ExternalPlayerControls } from "../components/Cabinet/ExternalPlayerControls";
import { ControlPanel } from "../components/Cabinet/ControlPanel";
import DriverSearch from "../components/Cabinet/DriverSearch";
import PassengerList from "../components/Cabinet/PassengerList";
import { PlaylistLimitModal } from "../components/PlaylistLimitModal";
import { ClearCacheButton } from "../components/ClearCacheButton";
import DonationModal from "../components/DonationModal";

// Импорт утилит для кеширования
import { 
  savePlaylistToCache, 
  savePlayerStateToCache,
  saveVideoProgressToCache,
  getVideoProgressFromCache
} from "../utils/cache";

// Импорт хуков RTK Query и вашего кастомного хука
import { useAddTrackMutation, useGetAccessCodeQuery, useControlPlaybackMutation, useSeekVideoMutation, useChangeTrackMutation } from "../api/apiSlice";
import { useCabinet } from "../hooks/useCabinet";
import { useAppSelector, useAppDispatch } from "../redux/hooks";
import { setVideoProgress } from "../redux/slices/playerSlice";
import { clearAuth } from "../redux/slices/authSlice";
import type { VideoProgress, Track } from "../types";

const Cabinet: React.FC = () => {
  const dispatch = useAppDispatch();
  const username = useAppSelector((state) => state.auth.username);
  
  // Проверяем, что username не является email (защита от старых данных)
  useEffect(() => {
    if (username && username.includes('@')) {
      console.error("❌ Обнаружен email в username, очищаем данные");
      dispatch(clearAuth());
      // Перенаправляем на страницу входа
      window.location.href = '/';
    }
  }, [username, dispatch]);

  // Получаем код доступа для водителя (обновляем каждые 5 минут)
  const { data: accessCodeData } = useGetAccessCodeQuery(username || '', {
    skip: !username,
    pollingInterval: 300000, // Обновляем каждые 5 минут
  });

  // 2. RTK Query: Мутации
  const [addTrack] = useAddTrackMutation();
  const [controlPlayback] = useControlPlaybackMutation();
  const [seekVideo] = useSeekVideoMutation();
  const [changeTrack] = useChangeTrackMutation();

  // Используем videoProgress из Redux
  const { videoProgress } = useAppSelector((state) => state.player);
  const [seekTime, setSeekTime] = useState<number | null>(null);
  
  // Ref для хранения актуального videoProgress без перезапуска интервала
  const videoProgressRef = useRef(videoProgress);
  useEffect(() => {
    videoProgressRef.current = videoProgress;
  }, [videoProgress]);

  // Флаг для блокировки множественных нажатий на play/pause
  const isPlaybackProcessingRef = useRef(false);
  // Флаг для предотвращения отправки состояния обратно на сервер при получении от пассажира
  const isExternalUpdateRef = useRef(false);

  // 3. Интеграция с вашим хуком управления плеером
  const {
    playlist,
    currentIndex,
    setCurrentIndex,
    playing,
    setPlaying,
    isPlayerActive,
    setIsPlayerActive,
    autoPlay,
    setAutoPlay,
    handleNext,
    handleRemoveTrack,
    handleMoveTrack,
    isLoading: isPlaylistLoading,
  } = useCabinet(username, () => {
    // Callback для уведомления о внешнем обновлении от пассажира
    isExternalUpdateRef.current = true;
  });

  const displayPlaylist = playlist;

  // Кеширование плейлиста
  useEffect(() => {
    if (username && playlist.length > 0) {
      savePlaylistToCache(username, playlist, true);
    }
  }, [playlist, username]);

  // Кеширование состояния плеера
  useEffect(() => {
    if (username) {
      savePlayerStateToCache(username, {
        currentIndex,
        playing,
        isPlayerActive
      }, true);
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
      const cachedProgress = getVideoProgressFromCache(username);

      // Восстанавливаем прогресс видео если есть
      if (cachedProgress) {
        dispatch(setVideoProgress(cachedProgress));
      }
    }
  }, [username, dispatch]);

  // Состояние для модального окна превышения лимита
  const [limitModalOpen, setLimitModalOpen] = useState(false);
  const [limitModalData, setLimitModalData] = useState<{ currentCount: number; maxCount: number } | null>(null);
  
  // Состояние для модального окна доната
  const [isDonationModalOpen, setIsDonationModalOpen] = useState<boolean>(false);

  // Автоматически активируем плеер когда есть треки в плейлисте
  useEffect(() => {
    if (displayPlaylist.length > 0 && !isPlayerActive) {
      setIsPlayerActive(true);
      // Не запускаем автоматически - пусть пассажир управляет
      setPlaying(false);
    } else if (displayPlaylist.length === 0 && isPlayerActive) {
      // Деактивируем плеер, если плейлист пуст
      setIsPlayerActive(false);
      setPlaying(false);
    }
  }, [displayPlaylist.length, isPlayerActive, setIsPlayerActive, setPlaying]);

  // Отправляем состояние воспроизведения на сервер (с debounce)
  // НЕ отправляем, если изменение пришло от пассажира через socket
  useEffect(() => {
    if (!username || !accessCodeData?.accessCode) {
      // Не логируем предупреждение, если это начальная загрузка
      return;
    }
    
    // Пропускаем отправку, если изменение пришло от пассажира
    if (isExternalUpdateRef.current) {
      isExternalUpdateRef.current = false;
      return;
    }
    
    const timeoutId = setTimeout(async () => {
      if (isPlaybackProcessingRef.current) {
        return; // Пропускаем если уже обрабатывается запрос
      }
      
      isPlaybackProcessingRef.current = true;
      try {
        await controlPlayback({
          username,
          playing,
          isPlayerActive,
          accessCode: accessCodeData.accessCode
        }).unwrap();
      } catch (err: any) {
        // Игнорируем ошибки сети - они будут обработаны автоматически через retry
        if (err && typeof err === 'object' && 'status' in err) {
          if (err.status === 'FETCH_ERROR' || err.status === 'NETWORK_ERROR') {
            console.warn("⚠️ Ошибка сети при отправке состояния воспроизведения. Повторная попытка...");
          } else if (err.status !== 404) {
            console.error("❌ Ошибка при отправке состояния воспроизведения:", err);
          }
        }
      } finally {
        // Разблокируем через небольшую задержку для предотвращения спама
        setTimeout(() => {
          isPlaybackProcessingRef.current = false;
        }, 100);
      }
    }, 300); // Уменьшена задержка для более быстрой реакции

    return () => clearTimeout(timeoutId);
  }, [playing, isPlayerActive, username, accessCodeData?.accessCode]); // controlPlayback стабилен, не нужен в зависимостях

  // Отправляем прогресс видео пассажирам через socket
  useEffect(() => {
    if (!username || !isPlayerActive) return;

    if (!socket.connected) {
      socket.connect();
      // Убеждаемся, что водитель присоединился к комнате
      socket.emit("join_username", username, "driver");
    }
    
    // Throttle для отправки прогресса (максимум 2 раза в секунду)
    let lastSent = 0;
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastSent < 500) return; // Пропускаем если прошло меньше 500ms
      
      const progress = videoProgressRef.current;
      if (progress.duration > 0 && progress.duration < 86400 && socket.connected) {
        socket.emit('video_progress', {
          username,
          progress
        } as { username: string; progress: VideoProgress });
        lastSent = now;
      }
    }, 500); // Проверяем каждые 500ms

    return () => clearInterval(interval);
  }, [username, isPlayerActive]);

  // Слушаем события от пассажиров (seek, track changes)
  // playback_state_changed обрабатывается в useCabinet.ts, чтобы избежать дублирования
  useEffect(() => {
    if (!username) return;

    if (!socket.connected) socket.connect();

    // Обработка seek от пассажиров
    const handleVideoSeeked = (data: { percent: number }) => {
      // Сохраняем существующий duration, обновляем percent и вычисляем currentTime
      const currentDuration = videoProgress.duration || 0;
      const newCurrentTime = currentDuration > 0 ? (data.percent / 100) * currentDuration : 0;
      dispatch(setVideoProgress({ 
        percent: data.percent,
        currentTime: newCurrentTime
      }));
      setSeekTime(data.percent);
      setTimeout(() => setSeekTime(null), 100);
    };

    // Обработка переключения трека от пассажиров
    const handleTrackChanged = (data: { currentIndex: number; playing: boolean }) => {
      isExternalUpdateRef.current = true; // Помечаем как внешнее обновление
      if (data.currentIndex !== undefined) {
        setCurrentIndex(data.currentIndex);
      }
      if (data.playing !== undefined) {
        setPlaying(data.playing);
      }
      // Сбрасываем прогресс при смене трека
      dispatch(setVideoProgress({ percent: 0, currentTime: 0, duration: 0 }));
    };

    socket.on("video_seeked", handleVideoSeeked);
    socket.on("track_changed", handleTrackChanged);

    return () => {
      socket.off("video_seeked", handleVideoSeeked);
      socket.off("track_changed", handleTrackChanged);
    };
  }, [username, setPlaying, setCurrentIndex, dispatch, videoProgress.duration]);

  if (!username) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#0f0f0f] p-4">
        <div className="text-center p-10 bg-[#1a1a1a] border border-white/10 rounded-3xl max-w-sm w-full">
          <MdErrorOutline className="text-red-500 text-6xl mx-auto" />
          <h1 className="text-2xl font-bold text-white mt-4">Ошибка доступа</h1>
          <p className="text-gray-400 mt-2">Пожалуйста, войдите в систему</p>
        </div>
      </div>
    );
  }

  const currentTrack = displayPlaylist[currentIndex];


  const handleSeek = async (val: number): Promise<void> => {
    // Обновляем в Redux сразу для отзывчивости
    // Сохраняем существующие duration и currentTime, обновляем только percent
    const currentDuration = videoProgress.duration || 0;
    const newCurrentTime = currentDuration > 0 ? (val / 100) * currentDuration : 0;
    dispatch(setVideoProgress({ 
      percent: val,
      currentTime: newCurrentTime
    }));
    setSeekTime(val);
    setTimeout(() => setSeekTime(null), 100);

    // Отправляем на сервер для синхронизации с пассажирами
    if (username && accessCodeData?.accessCode) {
      try {
        await seekVideo({ username, percent: val, accessCode: accessCodeData.accessCode }).unwrap();
      } catch (err: any) {
        // Игнорируем ошибки сети - они будут обработаны автоматически через retry
        if (err && typeof err === 'object' && 'status' in err) {
          if (err.status === 'FETCH_ERROR' || err.status === 'NETWORK_ERROR') {
            console.warn("⚠️ Ошибка сети при отправке seek. Повторная попытка...");
          } else {
            console.error("❌ Ошибка при отправке seek на сервер:", err);
          }
        }
      }
    }
  };

  // Функция удаления самого старого трека (первого в плейлисте)
  const handleDeleteOldestTrack = async (): Promise<void> => {
    if (playlist.length > 0 && username && accessCodeData?.accessCode) {
      try {
        await handleRemoveTrack(0); // Удаляем первый трек (самый старый)
      } catch (err) {
        console.error("❌ Ошибка при удалении старого трека:", err);
      }
    }
  };

  // 4. ОБНОВЛЕННАЯ ФУНКЦИЯ ДОБАВЛЕНИЯ (БЕЗ AXIOS)
  const handleAddTrack = async (track: Omit<Track, '_id' | 'id'>): Promise<boolean> => {
    try {
      if (!username) {
        console.error("❌ Username не найден");
        return false;
      }

      if (!accessCodeData?.accessCode) {
        console.error("❌ Код доступа не найден");
        return false;
      }

      const parser = new DOMParser();
      const decodedTitle = parser.parseFromString(track.title, 'text/html').body.textContent;

      const trackData = {
        videoId: track.videoId,
        title: decodedTitle || track.title,
        thumbnail: track.thumbnail
      };

      // Вызов мутации RTK Query с username и кодом доступа
      await addTrack({ 
        username, 
        trackData,
        accessCode: accessCodeData.accessCode
      }).unwrap();
      
      console.log("✅ Трек добавлен и плейлист будет обновлен автоматически");
      return true;
    } catch (err: any) {
      // Проверяем, является ли ошибка превышением лимита плейлиста
      if (err?.data?.error === "PLAYLIST_LIMIT_EXCEEDED" || err?.status === 400) {
        const errorData = err?.data || {};
        setLimitModalData({
          currentCount: errorData.currentCount || playlist.length,
          maxCount: errorData.maxCount || 5
        });
        setLimitModalOpen(true);
        return false;
      }
      
      console.error("❌ Ошибка при добавлении трека:", err);
      return false;
    }
  };

  const cardStyle = "bg-[#1a1a1a] rounded-3xl border border-white/5 shadow-2xl";

  return (
    <div className="min-h-screen bg-[#0f0f0f] p-4 md:p-8 lg:p-12 font-sans text-white">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* Хедер с именем и поиском */}
        <div className="relative z-100 flex items-center gap-4 mb-4">
          <div className="shrink-0 text-sm bg-white/5 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            <span className="text-white font-bold uppercase">{username}</span>
            {accessCodeData?.accessCode && (
              <>
                <span className="text-white/30">|</span>
                <span className="text-white/50 font-medium">Код:</span>
                <span className="text-indigo-400 font-bold font-mono tracking-wider">
                  {accessCodeData.accessCode}
                </span>
              </>
            )}
          </div>

          <div className="grow flex justify-end">
            <DriverSearch username={username} onTrackAdded={handleAddTrack} />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative z-10">
          {/* Левая колонка: Плеер и Список */}
          <div className="lg:col-span-8 flex flex-col gap-8">
            <div className={`${cardStyle} overflow-hidden`}>
              {currentTrack ? (
                <>
                  <div className="aspect-video bg-black relative">
                    <VideoPlayer
                      videoId={currentTrack.videoId}
                      playing={playing}
                      isPlayerActive={isPlayerActive}
                      onEnd={() => {
                        handleNext();
                      }}
                      onProgress={(progress) => {
                        dispatch(setVideoProgress(progress));
                      }}
                      seekTime={seekTime}
                    />
                  </div>

                  <div className="p-6">
                    {isPlayerActive && (
                      <ExternalPlayerControls
                        playing={playing}
                        onTogglePlay={() => {
                          if (!isPlaybackProcessingRef.current) {
                            setPlaying(!playing);
                          }
                        }}
                        onNext={handleNext}
                        trackTitle={currentTrack.title}
                        progress={videoProgress}
                        onSeek={handleSeek}
                        autoplay={autoPlay} 
                        onToggleAutoplay={setAutoPlay}
                      />
                    )}
                    
                    <div className={`${isPlayerActive ? 'mt-8 border-t border-white/5 pt-6' : 'pt-6'}`}>
                      <div className="flex justify-between items-center mb-4">
                          <h3 className="text-xs font-bold text-white/30 uppercase tracking-[0.2em]">Очередь</h3>
                          <div className="flex items-center gap-2">
                            {isPlaylistLoading && <span className="text-[10px] text-blue-500 animate-pulse">Обновление...</span>}
                            <span className="text-[10px] text-indigo-400 font-bold">{displayPlaylist.length} треков</span>
                          </div>
                      </div>
                      <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                        {displayPlaylist.length > 0 ? (
                          <TrackList
                            playlist={displayPlaylist}
                            currentIndex={currentIndex}
                            onSelect={async (idx) => {
                              if (username && accessCodeData?.accessCode) {
                                try {
                                  await changeTrack({ 
                                    username, 
                                    index: idx, 
                                    playing: false, // Не запускаем автоматически при выборе
                                    accessCode: accessCodeData.accessCode 
                                  }).unwrap();
                                  dispatch(setVideoProgress({ percent: 0, currentTime: 0, duration: 0 }));
                                } catch (err: any) {
                                  // Игнорируем ошибки сети - они будут обработаны автоматически через retry
                                  if (err && typeof err === 'object' && 'status' in err) {
                                    if (err.status === 'FETCH_ERROR' || err.status === 'NETWORK_ERROR') {
                                      console.warn("⚠️ Ошибка сети при выборе трека. Повторная попытка...");
                                    } else {
                                      console.error("Ошибка при выборе трека:", err);
                                    }
                                  }
                                }
                              }
                            }}
                            onRemove={handleRemoveTrack}
                            onMove={handleMoveTrack}
                          />
                        ) : (
                          <div className="text-center py-12">
                            <p className="text-white/30 text-sm">Очередь пуста</p>
                            <p className="text-white/20 text-xs mt-2">Добавьте треки через поиск</p>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <>
                  <div className="aspect-video bg-black/50 flex items-center justify-center">
                    <div className="text-center">
                      <p className="text-white/30 text-lg mb-2">Нет треков в очереди</p>
                      <p className="text-white/20 text-sm">Добавьте треки через поиск</p>
                    </div>
                  </div>
                  
                  {displayPlaylist.length > 0 && (
                    <div className="p-6">
                      <div className="border-t border-white/5 pt-6">
                        <div className="flex justify-between items-center mb-4">
                            <h3 className="text-xs font-bold text-white/30 uppercase tracking-[0.2em]">Очередь</h3>
                            <div className="flex items-center gap-2">
                              {isPlaylistLoading && <span className="text-[10px] text-blue-500 animate-pulse">Обновление...</span>}
                              <span className="text-[10px] text-indigo-400 font-bold">{displayPlaylist.length} треков</span>
                            </div>
                        </div>
                        <div className="max-h-[400px] overflow-y-auto custom-scrollbar">
                          <TrackList
                            playlist={displayPlaylist}
                            currentIndex={currentIndex}
                            onSelect={async (idx) => {
                              if (username && accessCodeData?.accessCode) {
                                try {
                                  await changeTrack({ 
                                    username, 
                                    index: idx, 
                                    playing: false, // Не запускаем автоматически при выборе
                                    accessCode: accessCodeData.accessCode 
                                  }).unwrap();
                                  dispatch(setVideoProgress({ percent: 0, currentTime: 0, duration: 0 }));
                                } catch (err: any) {
                                  // Игнорируем ошибки сети - они будут обработаны автоматически через retry
                                  if (err && typeof err === 'object' && 'status' in err) {
                                    if (err.status === 'FETCH_ERROR' || err.status === 'NETWORK_ERROR') {
                                      console.warn("⚠️ Ошибка сети при выборе трека. Повторная попытка...");
                                    } else {
                                      console.error("Ошибка при выборе трека:", err);
                                    }
                                  }
                                }
                              }
                            }}
                            onRemove={handleRemoveTrack}
                            onMove={handleMoveTrack}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
          </div>

          {/* Правая колонка: Панель управления */}
          <div className="lg:col-span-4 flex flex-col gap-6">
            <div className={`${cardStyle} p-6`}>
              <ControlPanel
                username={username}
                isPlayerActive={isPlayerActive}
                playing={playing}
                autoPlay={autoPlay}
                actions={{
                  onTogglePlay: () => {
                    if (!isPlaybackProcessingRef.current) {
                      setPlaying(!playing);
                    }
                  },
                  onToggleAuto: () => setAutoPlay(!autoPlay),
                }}
              />
            </div>
            
            {/* Список пассажиров */}
            <div className={`${cardStyle} p-6`}>
              <PassengerList username={username} />
            </div>
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
    </div>
  );
};

export default Cabinet;