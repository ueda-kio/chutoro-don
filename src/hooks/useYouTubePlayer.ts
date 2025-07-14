'use client';

import { useEffect, useRef, useState } from 'react';
import { extractYouTubeVideoId } from '@/utils/quiz';

declare global {
  interface Window {
    YT: typeof YT;
    onYouTubeIframeAPIReady: () => void;
  }
}

export function useYouTubePlayer() {
  const playerRef = useRef<YT.Player | null>(null);
  const [isReady, setIsReady] = useState(false);
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // YouTube IFrame API を読み込み
    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);

      window.onYouTubeIframeAPIReady = () => {
        setIsReady(true);
      };
    } else {
      setIsReady(true);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (playerRef.current && typeof playerRef.current.destroy === 'function') {
        playerRef.current.destroy();
      }
    };
  }, []);

  const initializePlayer = (containerId: string) => {
    if (!isReady || !window.YT || playerRef.current) return;

    playerRef.current = new window.YT.Player(containerId, {
      height: '1',
      width: '1',
      playerVars: {
        autoplay: 0,
        controls: 0,
        disablekb: 1,
        fs: 0,
        iv_load_policy: 3,
        modestbranding: 1,
        rel: 0,
        showinfo: 0,
      },
      events: {
        onReady: () => {
          setIsPlayerReady(true);
        },
        onStateChange: (event: YT.OnStateChangeEvent) => {
          if (event.data === window.YT.PlayerState.PLAYING) {
            setIsPlaying(true);
          } else {
            setIsPlaying(false);
          }
        },
      },
    });
  };

  const playTrack = (youtubeUrl: string, startTime: number, duration: number) => {
    if (!playerRef.current || !isPlayerReady) {
      console.warn('Player not ready yet');
      return;
    }

    const videoId = extractYouTubeVideoId(youtubeUrl);
    if (!videoId) {
      console.error('Invalid YouTube URL:', youtubeUrl);
      return;
    }

    // プレイヤーのメソッドが存在するかチェック
    if (typeof playerRef.current.loadVideoById !== 'function') {
      console.error('loadVideoById method not available on player');
      return;
    }

    // 既存のタイムアウトをクリア
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 動画を読み込んで再生
    playerRef.current.loadVideoById({
      videoId,
      startSeconds: startTime,
    });

    // 指定時間後に停止
    timeoutRef.current = setTimeout(() => {
      if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
        playerRef.current.pauseVideo();
        setIsPlaying(false);
      }
    }, duration * 1000);
  };

  const stopTrack = () => {
    if (playerRef.current && typeof playerRef.current.pauseVideo === 'function') {
      playerRef.current.pauseVideo();
      setIsPlaying(false);
    }
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  return {
    isReady,
    isPlayerReady,
    isPlaying,
    initializePlayer,
    playTrack,
    stopTrack,
  };
}
