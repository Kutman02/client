import React, { useEffect, useRef } from 'react';
import YouTube, { type YouTubePlayer } from 'react-youtube';
import type { VideoProgress } from '../../types';

interface VideoPlayerProps {
  videoId?: string;
  playing: boolean;
  isPlayerActive: boolean;
  onEnd: () => void;
  onProgress: (progress: VideoProgress) => void;
  seekTime: number | null;
}

export const VideoPlayer: React.FC<VideoPlayerProps> = ({ 
  videoId, 
  playing, 
  isPlayerActive, 
  onEnd, 
  onProgress, 
  seekTime 
}) => {
  const playerRef = useRef<YouTubePlayer | null>(null);
  const isPlayerReadyRef = useRef<boolean>(false);

  // Проверка готовности плеера
  const isPlayerReady = (): boolean => {
    if (!playerRef.current) return false;
    try {
      // Проверяем наличие методов и что плеер инициализирован
      return (
        typeof playerRef.current.getPlayerState === 'function' &&
        typeof playerRef.current.playVideo === 'function' &&
        typeof playerRef.current.pauseVideo === 'function'
      );
    } catch {
      return false;
    }
  };

  useEffect(() => {
    if (!isPlayerReady() || !isPlayerActive) {
      console.log("🎬 [VideoPlayer] Плеер не готов или не активен:", { isPlayerReady: isPlayerReady(), isPlayerActive });
      return;
    }

    try {
      const state = playerRef.current?.getPlayerState();
      // Проверяем, что state валиден (не null/undefined)
      if (state === null || state === undefined) {
        console.log("🎬 [VideoPlayer] Состояние плеера не валидно:", state);
        return;
      }

      console.log("🎬 [VideoPlayer] Управление плеером:", { playing, currentState: state, isPlayerActive });
      
      if (playing && state !== 1) {
        console.log("🎬 [VideoPlayer] Запускаем видео");
        playerRef.current?.playVideo();
      }
      if (!playing && state !== 2) {
        console.log("🎬 [VideoPlayer] Ставим на паузу");
        playerRef.current?.pauseVideo();
      }
    } catch (err) {
      // Игнорируем ошибки, если плеер еще не готов
      if (isPlayerReadyRef.current) {
        console.error("❌ YouTube player control error:", err);
      }
    }
  }, [playing, isPlayerActive]);

  useEffect(() => {
    if (!isPlayerReady() || seekTime === null || !isPlayerActive) {
      return;
    }

    try {
      const duration = playerRef.current?.getDuration();
      if (duration && duration > 0) {
        const seekToSeconds = (seekTime / 100) * duration;
        playerRef.current?.seekTo(seekToSeconds, true);
      }
    } catch (err) {
      if (isPlayerReadyRef.current) {
        console.error("❌ YouTube seek error:", err);
      }
    }
  }, [seekTime, isPlayerActive]);

  useEffect(() => {
    if (!isPlayerActive) {
      return;
    }
    
    // Используем requestAnimationFrame для более плавного обновления
    let animationFrameId: number;
    let lastUpdate = 0;
    
    const updateProgress = () => {
      const now = Date.now();
      // Обновляем максимум 2 раза в секунду (500ms)
      if (now - lastUpdate < 500) {
        animationFrameId = requestAnimationFrame(updateProgress);
        return;
      }
      
      if (isPlayerReady()) {
        try {
          const currentTime = playerRef.current?.getCurrentTime();
          const duration = playerRef.current?.getDuration();
          
          if (
            duration && 
            duration > 0 && 
            duration < 86400 && 
            currentTime !== undefined && 
            currentTime !== null &&
            !isNaN(currentTime)
          ) {
            const progress = {
              percent: (currentTime / duration) * 100,
              currentTime: currentTime,
              duration: duration
            };
            onProgress(progress);
            lastUpdate = now;
          }
        } catch (err) {
          // Игнорируем ошибки, если плеер еще не готов
          if (isPlayerReadyRef.current) {
            console.error("❌ YouTube progress error:", err);
          }
        }
      }
      
      animationFrameId = requestAnimationFrame(updateProgress);
    };
    
    animationFrameId = requestAnimationFrame(updateProgress);
    
    return () => {
      cancelAnimationFrame(animationFrameId);
    };
  }, [onProgress, isPlayerActive]);

  const opts = {
    height: '100%',
    width: '100%',
    playerVars: {
      autoplay: 1,
      controls: 0,          // Скрывает пульт управления
      modestbranding: 1,    // Минимизирует логотип YouTube
      rel: 0,               // Не показывает похожие видео в конце
      showinfo: 0,          // (Устарело, но полезно) Скрывает название видео
      disablekb: 1,         // Отключает управление клавишами
      fs: 0,                // Скрывает кнопку полноэкранного режима
      iv_load_policy: 3,    // Убирает аннотации
      autohide: 1,
      playsinline: 1,       // Воспроизведение встроено (не полноэкранно)
      enablejsapi: 1,        // Включает JavaScript API для управления
      origin: window.location.origin, // Ограничивает домен для безопасности
    },
  };

  // Блокируем прямое взаимодействие с iframe
  useEffect(() => {
    if (!videoId) return;

    const blockIframeInteraction = () => {
      // Находим все iframe элементы YouTube
      const iframes = document.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]');
      
      iframes.forEach((iframe) => {
        // Блокируем pointer events на iframe
        (iframe as HTMLElement).style.pointerEvents = 'none';
        
        // Блокируем контекстное меню
        iframe.addEventListener('contextmenu', (e) => {
          e.preventDefault();
          e.stopPropagation();
        }, true);
      });
    };

    // Блокируем сразу и после небольшой задержки (когда iframe загрузится)
    blockIframeInteraction();
    const timeoutId = setTimeout(blockIframeInteraction, 1000);
    const intervalId = setInterval(blockIframeInteraction, 2000);

    return () => {
      clearTimeout(timeoutId);
      clearInterval(intervalId);
    };
  }, [videoId]);

  return (
    <div className="relative w-full aspect-video overflow-hidden bg-black">
      {videoId ? (
        <>
          <YouTube
            videoId={videoId}
            opts={opts}
            onReady={(e) => { 
              try {
                playerRef.current = e.target;
                // Даем плееру немного времени на полную инициализацию
                setTimeout(() => {
                  isPlayerReadyRef.current = true;
                  // Блокируем взаимодействие с iframe после готовности
                  const iframes = document.querySelectorAll('iframe[src*="youtube.com"], iframe[src*="youtu.be"]');
                  iframes.forEach((iframe) => {
                    (iframe as HTMLElement).style.pointerEvents = 'none';
                  });
                }, 500);
              } catch (err) {
                console.error("❌ YouTube onReady error:", err);
              }
            }}
            onEnd={() => {
              onEnd();
            }}
            onError={(err) => {
              console.error("❌ YouTube player error:", err);
              isPlayerReadyRef.current = false;
            }}
            onStateChange={(e) => {
              // Когда плеер переходит в состояние "готов" (state 1 = playing, state 2 = paused, state 3 = buffering)
              // это означает, что плеер полностью инициализирован
              if (e.data === 1 || e.data === 2 || e.data === 3) {
                isPlayerReadyRef.current = true;
              }
            }}
            className="absolute inset-0 w-full h-full"
            style={{ zIndex: 1, pointerEvents: 'none' }}
          />
          {/* Прозрачный overlay для блокировки всех кликов */}
          <div 
            className="absolute inset-0 w-full h-full"
            style={{ 
              zIndex: 2, 
              pointerEvents: 'auto',
              cursor: 'default'
            }}
            onClick={(e) => {
              // Блокируем все клики на iframe
              e.preventDefault();
              e.stopPropagation();
            }}
            onContextMenu={(e) => {
              // Блокируем контекстное меню
              e.preventDefault();
              e.stopPropagation();
            }}
            onDoubleClick={(e) => {
              // Блокируем двойной клик (может открыть полноэкранный режим)
              e.preventDefault();
              e.stopPropagation();
            }}
          />
        </>
      ) : (
        <div className="flex h-full items-center justify-center text-gray-400">
          {!isPlayerActive ? "Нужна активация" : "Видео не найдено"}
        </div>
      )}
    </div>
  );
};