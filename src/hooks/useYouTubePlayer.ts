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
  const preloadedVideoRef = useRef<string | null>(null);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);

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
          
          // 動画が準備完了（バッファリング済み）状態をトラッキング
          if (event.data === window.YT.PlayerState.BUFFERING || event.data === window.YT.PlayerState.CUED) {
            setIsVideoLoaded(true);
          }
        },
      },
    });
  };

  // 動画の事前読み込み（プリロード）機能
  const preloadVideo = (youtubeUrl: string) => {
    if (!playerRef.current || !isPlayerReady) {
      return;
    }

    const videoId = extractYouTubeVideoId(youtubeUrl);
    if (!videoId || preloadedVideoRef.current === videoId) {
      return; // 既に同じ動画が読み込まれている場合はスキップ
    }

    // 動画をキューに追加（再生はしない）
    if (typeof playerRef.current.cueVideoById === 'function') {
      playerRef.current.cueVideoById({
        videoId,
        startSeconds: 0, // プリロード時は開始位置は指定しない
      });
      preloadedVideoRef.current = videoId;
      setIsVideoLoaded(false); // 新しい動画の読み込み開始
    }
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
    if (typeof playerRef.current.seekTo !== 'function' || typeof playerRef.current.playVideo !== 'function') {
      console.error('Required player methods not available');
      return;
    }

    // 既存のタイムアウトをクリア
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // 同じ動画が既にプリロードされている場合は、シークして即座に再生
    if (preloadedVideoRef.current === videoId && isVideoLoaded) {
      playerRef.current.seekTo(startTime, true);
      playerRef.current.playVideo();
    } else {
      // 異なる動画の場合は従来通りloadVideoById
      if (typeof playerRef.current.loadVideoById === 'function') {
        playerRef.current.loadVideoById({
          videoId,
          startSeconds: startTime,
        });
        preloadedVideoRef.current = videoId;
      }
    }

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
    isVideoLoaded,
    initializePlayer,
    playTrack,
    stopTrack,
    preloadVideo,
  };
}
