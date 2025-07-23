# YouTube IFrame Player API 実装ガイド & プリロード最適化

## 概要

本ドキュメントは、YouTube IFrame Player APIを使用した楽曲再生機能の実装方法と、プリロード機能による最適化手法について詳細に解説します。このガイドを参考に、新たなアプリケーションでYouTube動画を効率的に活用できます。

---

## 1. YouTube IFrame Player API の基本実装

### 1.1. API の初期化

#### HTML側の準備
```html
<!-- YouTube IFrame Player API スクリプトの読み込み -->
<script src="https://www.youtube.com/iframe_api"></script>

<!-- プレイヤー用のdiv要素（非表示で配置） -->
<div
  id="youtube-player"
  style="position: absolute; left: -9999px; width: 560px; height: 315px;"
></div>
```

#### JavaScript/TypeScript での初期化
```typescript
// YouTube Player の型定義
interface YouTubePlayer {
  loadVideoById(options: { videoId: string; startSeconds?: number }): void;
  cueVideoById(options: { videoId: string; startSeconds?: number }): void;
  playVideo(): void;
  pauseVideo(): void;
  seekTo(seconds: number, allowSeekAhead: boolean): void;
  getPlayerState(): number;
  addEventListener(event: string, listener: (event: any) => void): void;
}

// グローバル初期化関数（YouTube API が読み込み完了後に自動実行）
declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: {
      Player: new (
        elementId: string,
        config: {
          height: string;
          width: string;
          videoId?: string;
          events: {
            onReady: (event: any) => void;
            onStateChange: (event: any) => void;
          };
        }
      ) => YouTubePlayer;
      PlayerState: {
        UNSTARTED: number;
        ENDED: number;
        PLAYING: number;
        PAUSED: number;
        BUFFERING: number;
        CUED: number;
      };
    };
  }
}

// プレイヤー初期化
const initializeYouTubePlayer = (): Promise<YouTubePlayer> => {
  return new Promise((resolve) => {
    window.onYouTubeIframeAPIReady = () => {
      const player = new window.YT.Player('youtube-player', {
        height: '315',
        width: '560',
        events: {
          onReady: (event) => {
            console.log('YouTube Player Ready');
            resolve(player);
          },
          onStateChange: (event) => {
            console.log('Player State Changed:', event.data);
          },
        },
      });
    };
  });
};
```

### 1.2. 基本的な再生制御

#### YouTube Video ID の抽出
```typescript
/**
 * YouTube URL から Video ID を抽出
 * @param url YouTube URL (https://www.youtube.com/watch?v=VIDEO_ID 形式)
 * @returns Video ID または null
 */
const extractYouTubeVideoId = (url: string): string | null => {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
};
```

#### 基本的な再生機能
```typescript
class YouTubePlayerController {
  private player: YouTubePlayer | null = null;
  private isReady = false;

  async initialize(): Promise<void> {
    this.player = await initializeYouTubePlayer();
    this.isReady = true;
  }

  /**
   * 動画を読み込んで指定位置から再生
   * @param youtubeUrl YouTube URL
   * @param startSeconds 開始時間（秒）
   */
  playVideo(youtubeUrl: string, startSeconds: number = 0): void {
    if (!this.player || !this.isReady) {
      throw new Error('Player not ready');
    }

    const videoId = extractYouTubeVideoId(youtubeUrl);
    if (!videoId) {
      throw new Error('Invalid YouTube URL');
    }

    // 動画をロードして再生開始
    this.player.loadVideoById({
      videoId,
      startSeconds,
    });
  }

  /**
   * 再生停止
   */
  pauseVideo(): void {
    if (this.player) {
      this.player.pauseVideo();
    }
  }

  /**
   * 指定時間にシーク
   * @param seconds シーク先の時間（秒）
   */
  seekTo(seconds: number): void {
    if (this.player) {
      this.player.seekTo(seconds, true);
    }
  }
}
```

---

## 2. React カスタムフック実装

### 2.1. useYouTubePlayer フック

```typescript
import { useRef, useState, useCallback, useEffect } from 'react';

interface UseYouTubePlayerReturn {
  isPlayerReady: boolean;
  isPlaying: boolean;
  playTrack: (youtubeUrl: string, startTime: number, duration: number) => void;
  stopTrack: () => void;
  preloadVideo: (youtubeUrl: string) => void;
  isVideoLoaded: boolean;
}

export const useYouTubePlayer = (): UseYouTubePlayerReturn => {
  // Player インスタンス
  const playerRef = useRef<YouTubePlayer | null>(null);
  
  // 状態管理
  const [isPlayerReady, setIsPlayerReady] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  
  // プリロード管理
  const preloadedVideoRef = useRef<string | null>(null);
  const currentTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Player 初期化
  useEffect(() => {
    const initPlayer = async () => {
      if (typeof window === 'undefined' || !window.YT) return;

      try {
        const player = new window.YT.Player('youtube-player', {
          height: '315',
          width: '560',
          events: {
            onReady: () => {
              playerRef.current = player;
              setIsPlayerReady(true);
            },
            onStateChange: (event) => {
              const state = event.data;
              
              // 再生状態の管理
              setIsPlaying(state === window.YT.PlayerState.PLAYING);
              
              // 動画読み込み状態の管理
              if (state === window.YT.PlayerState.CUED || 
                  state === window.YT.PlayerState.PAUSED ||
                  state === window.YT.PlayerState.PLAYING) {
                setIsVideoLoaded(true);
              }
            },
          },
        });
      } catch (error) {
        console.error('YouTube Player initialization failed:', error);
      }
    };

    // YouTube API が読み込まれるまで待機
    if (window.onYouTubeIframeAPIReady) {
      initPlayer();
    } else {
      window.onYouTubeIframeAPIReady = initPlayer;
    }
  }, []);

  // プリロード機能
  const preloadVideo = useCallback((youtubeUrl: string) => {
    if (!playerRef.current || !isPlayerReady) return;

    const videoId = extractYouTubeVideoId(youtubeUrl);
    if (!videoId || preloadedVideoRef.current === videoId) {
      return; // 重複プリロードを防止
    }

    try {
      // cueVideoById で動画を事前読み込み（再生は開始しない）
      playerRef.current.cueVideoById({
        videoId,
        startSeconds: 0,
      });
      
      preloadedVideoRef.current = videoId;
      setIsVideoLoaded(false); // ロード開始のため一旦false
      
      console.log(`Preloading video: ${videoId}`);
    } catch (error) {
      console.error('Video preload failed:', error);
    }
  }, [isPlayerReady]);

  // 再生機能（プリロード対応）
  const playTrack = useCallback((
    youtubeUrl: string,
    startTime: number,
    duration: number
  ) => {
    if (!playerRef.current || !isPlayerReady) return;

    const videoId = extractYouTubeVideoId(youtubeUrl);
    if (!videoId) return;

    // 現在の再生タイマーをクリア
    if (currentTimeoutRef.current) {
      clearTimeout(currentTimeoutRef.current);
    }

    try {
      // プリロード済み動画の場合：即座に再生
      if (preloadedVideoRef.current === videoId && isVideoLoaded) {
        playerRef.current.seekTo(startTime, true);
        playerRef.current.playVideo();
        console.log(`Playing preloaded video: ${videoId} from ${startTime}s`);
      } else {
        // 未プリロード動画：従来通りの読み込み
        playerRef.current.loadVideoById({
          videoId,
          startSeconds: startTime,
        });
        console.log(`Loading and playing video: ${videoId} from ${startTime}s`);
      }

      // 指定時間後に自動停止
      currentTimeoutRef.current = setTimeout(() => {
        if (playerRef.current) {
          playerRef.current.pauseVideo();
          setIsPlaying(false);
        }
      }, duration * 1000);

    } catch (error) {
      console.error('Video playback failed:', error);
    }
  }, [isPlayerReady, isVideoLoaded]);

  // 停止機能
  const stopTrack = useCallback(() => {
    if (playerRef.current) {
      playerRef.current.pauseVideo();
    }
    
    if (currentTimeoutRef.current) {
      clearTimeout(currentTimeoutRef.current);
      currentTimeoutRef.current = null;
    }
    
    setIsPlaying(false);
  }, []);

  // クリーンアップ
  useEffect(() => {
    return () => {
      if (currentTimeoutRef.current) {
        clearTimeout(currentTimeoutRef.current);
      }
    };
  }, []);

  return {
    isPlayerReady,
    isPlaying,
    isVideoLoaded,
    playTrack,
    stopTrack,
    preloadVideo,
  };
};
```

---

## 3. プリロード最適化の実装詳細

### 3.1. プリロード戦略

#### 自動プリロード機能
```typescript
// コンポーネント側での自動プリロード実装例
const QuizPlayer: React.FC<{ question: QuizQuestion }> = ({ question }) => {
  const { preloadVideo, playTrack, stopTrack, isPlayerReady, isPlaying } = useYouTubePlayer();

  // 問題変更時の自動プリロード
  useEffect(() => {
    if (isPlayerReady && question?.track?.youtubeUrl) {
      // 新しい問題の動画を自動プリロード
      preloadVideo(question.track.youtubeUrl);
    }
  }, [question?.track?.youtubeUrl, isPlayerReady, preloadVideo]);

  const handlePlay = () => {
    if (question?.track?.youtubeUrl && question?.startTime) {
      playTrack(question.track.youtubeUrl, question.startTime, selectedDuration);
    }
  };

  return (
    <button 
      onClick={isPlaying ? stopTrack : handlePlay}
      disabled={!isPlayerReady}
    >
      {isPlaying ? '⏸️ 停止' : '▶️ 再生'}
    </button>
  );
};
```

#### 複数動画のプリロード管理
```typescript
class AdvancedPreloadManager {
  private preloadedVideos = new Map<string, boolean>();
  private maxPreloadCount = 3; // 最大プリロード数

  preloadMultipleVideos(urls: string[], player: YouTubePlayer): void {
    // 既にプリロード済みの動画をスキップ
    const newUrls = urls.filter(url => {
      const videoId = extractYouTubeVideoId(url);
      return videoId && !this.preloadedVideos.has(videoId);
    });

    // 制限数を超える場合は古いプリロードを削除
    if (this.preloadedVideos.size + newUrls.length > this.maxPreloadCount) {
      this.clearOldestPreloads(newUrls.length);
    }

    // 新しい動画をプリロード
    newUrls.forEach(url => {
      const videoId = extractYouTubeVideoId(url);
      if (videoId) {
        player.cueVideoById({ videoId });
        this.preloadedVideos.set(videoId, true);
      }
    });
  }

  private clearOldestPreloads(requiredSpace: number): void {
    const entries = Array.from(this.preloadedVideos.entries());
    const toRemove = entries.slice(0, requiredSpace);
    
    toRemove.forEach(([videoId]) => {
      this.preloadedVideos.delete(videoId);
    });
  }

  isPreloaded(url: string): boolean {
    const videoId = extractYouTubeVideoId(url);
    return videoId ? this.preloadedVideos.has(videoId) : false;
  }
}
```

### 3.2. パフォーマンス監視

#### 再生時間の測定
```typescript
class PerformanceMonitor {
  private startTime: number | null = null;

  startMeasure(): void {
    this.startTime = performance.now();
  }

  endMeasure(action: string): number {
    if (!this.startTime) return 0;
    
    const duration = performance.now() - this.startTime;
    console.log(`${action} took ${duration.toFixed(2)}ms`);
    
    // 分析データとして送信（例）
    this.sendAnalytics(action, duration);
    
    this.startTime = null;
    return duration;
  }

  private sendAnalytics(action: string, duration: number): void {
    // Google Analytics や独自分析システムに送信
    if (typeof gtag !== 'undefined') {
      gtag('event', 'youtube_performance', {
        event_category: 'performance',
        event_label: action,
        value: Math.round(duration),
      });
    }
  }
}

// 使用例
const monitor = new PerformanceMonitor();

const playWithMonitoring = (url: string, startTime: number, duration: number) => {
  monitor.startMeasure();
  
  playTrack(url, startTime, duration);
  
  // 再生開始の検知（onStateChange で呼び出し）
  const onPlayingStarted = () => {
    monitor.endMeasure('video_play_start');
  };
};
```

---

## 4. エラーハンドリングとフォールバック

### 4.1. 堅牢なエラーハンドリング
```typescript
class YouTubePlayerWithErrorHandling {
  private player: YouTubePlayer | null = null;
  private retryCount = 0;
  private maxRetries = 3;

  async initializeWithRetry(): Promise<void> {
    try {
      await this.initialize();
    } catch (error) {
      if (this.retryCount < this.maxRetries) {
        this.retryCount++;
        console.warn(`Player initialization failed, retrying... (${this.retryCount}/${this.maxRetries})`);
        setTimeout(() => this.initializeWithRetry(), 1000 * this.retryCount);
      } else {
        throw new Error('YouTube Player initialization failed after maximum retries');
      }
    }
  }

  safePlayVideo(url: string, startTime: number): void {
    try {
      if (!this.player) {
        throw new Error('Player not initialized');
      }

      const videoId = extractYouTubeVideoId(url);
      if (!videoId) {
        throw new Error('Invalid YouTube URL');
      }

      this.player.loadVideoById({ videoId, startSeconds: startTime });
      
    } catch (error) {
      console.error('Video playback failed:', error);
      
      // フォールバック処理
      this.handlePlaybackError(error);
    }
  }

  private handlePlaybackError(error: Error): void {
    // ユーザーへの通知
    this.showErrorMessage('動画の再生に失敗しました。もう一度お試しください。');
    
    // 分析データの送信
    this.sendErrorAnalytics(error);
    
    // 必要に応じて代替手段の提供
    this.offerAlternativeOptions();
  }

  private showErrorMessage(message: string): void {
    // Toast通知やアラートでユーザーに通知
    console.error(message);
  }

  private sendErrorAnalytics(error: Error): void {
    // エラートラッキング
    if (typeof gtag !== 'undefined') {
      gtag('event', 'exception', {
        description: error.message,
        fatal: false,
      });
    }
  }

  private offerAlternativeOptions(): void {
    // 代替手段の提供（例：別の楽曲への切り替え、スキップ機能など）
  }
}
```

### 4.2. ネットワーク状態対応
```typescript
class NetworkAwarePlayer {
  private connectionType: string = 'unknown';

  constructor() {
    this.detectConnectionType();
    this.setupConnectionMonitoring();
  }

  private detectConnectionType(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      this.connectionType = connection.effectiveType || 'unknown';
    }
  }

  private setupConnectionMonitoring(): void {
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      connection.addEventListener('change', () => {
        this.connectionType = connection.effectiveType;
        this.adjustPreloadStrategy();
      });
    }
  }

  private adjustPreloadStrategy(): void {
    switch (this.connectionType) {
      case 'slow-2g':
      case '2g':
        // 低速回線時はプリロードを無効化
        this.disablePreload();
        break;
      case '3g':
        // 中速回線時は制限的なプリロード
        this.enableLimitedPreload();
        break;
      case '4g':
      default:
        // 高速回線時は積極的なプリロード
        this.enableFullPreload();
        break;
    }
  }

  private disablePreload(): void {
    console.log('Preload disabled due to slow connection');
  }

  private enableLimitedPreload(): void {
    console.log('Limited preload enabled for moderate connection');
  }

  private enableFullPreload(): void {
    console.log('Full preload enabled for fast connection');
  }
}
```

---

## 5. テスト実装

### 5.1. ユニットテスト例
```typescript
import { renderHook, act } from '@testing-library/react';
import { useYouTubePlayer } from './useYouTubePlayer';

// YouTube Player API のモック
const mockPlayer = {
  loadVideoById: jest.fn(),
  cueVideoById: jest.fn(),
  playVideo: jest.fn(),
  pauseVideo: jest.fn(),
  seekTo: jest.fn(),
};

// グローバルオブジェクトのモック
beforeEach(() => {
  Object.defineProperty(window, 'YT', {
    value: {
      Player: jest.fn().mockImplementation(() => mockPlayer),
      PlayerState: {
        PLAYING: 1,
        PAUSED: 2,
        CUED: 5,
      },
    },
    writable: true,
  });
});

describe('useYouTubePlayer', () => {
  test('プリロード機能が正常に動作する', async () => {
    const { result } = renderHook(() => useYouTubePlayer());

    // プレイヤーの準備完了をシミュレート
    act(() => {
      // onReady イベントをトリガー
      result.current.isPlayerReady = true;
    });

    // プリロード実行
    act(() => {
      result.current.preloadVideo('https://www.youtube.com/watch?v=testVideoId');
    });

    expect(mockPlayer.cueVideoById).toHaveBeenCalledWith({
      videoId: 'testVideoId',
      startSeconds: 0,
    });
  });

  test('プリロード済み動画の高速再生が動作する', async () => {
    const { result } = renderHook(() => useYouTubePlayer());

    // プリロード済みの状態をセットアップ
    act(() => {
      result.current.preloadVideo('https://www.youtube.com/watch?v=testVideoId');
      // 動画読み込み完了をシミュレート
      result.current.isVideoLoaded = true;
    });

    // プリロード済み動画の再生
    act(() => {
      result.current.playTrack('https://www.youtube.com/watch?v=testVideoId', 60, 5);
    });

    expect(mockPlayer.seekTo).toHaveBeenCalledWith(60, true);
    expect(mockPlayer.playVideo).toHaveBeenCalled();
  });

  test('重複プリロードが防止される', async () => {
    const { result } = renderHook(() => useYouTubePlayer());

    const testUrl = 'https://www.youtube.com/watch?v=testVideoId';

    // 同じ動画を2回プリロード
    act(() => {
      result.current.preloadVideo(testUrl);
      result.current.preloadVideo(testUrl);
    });

    // cueVideoById は1回だけ呼ばれるべき
    expect(mockPlayer.cueVideoById).toHaveBeenCalledTimes(1);
  });
});
```

### 5.2. 統合テスト例
```typescript
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuizPlayer } from './QuizPlayer';

describe('QuizPlayer Integration', () => {
  test('問題変更時に自動プリロードが実行される', async () => {
    const question1 = {
      track: { youtubeUrl: 'https://www.youtube.com/watch?v=video1' },
      startTime: 60,
    };

    const question2 = {
      track: { youtubeUrl: 'https://www.youtube.com/watch?v=video2' },
      startTime: 90,
    };

    const { rerender } = render(<QuizPlayer question={question1} />);

    // 最初の問題のプリロード確認
    await waitFor(() => {
      expect(mockPlayer.cueVideoById).toHaveBeenCalledWith({
        videoId: 'video1',
        startSeconds: 0,
      });
    });

    // 問題を変更
    rerender(<QuizPlayer question={question2} />);

    // 新しい問題のプリロード確認
    await waitFor(() => {
      expect(mockPlayer.cueVideoById).toHaveBeenCalledWith({
        videoId: 'video2',
        startSeconds: 0,
      });
    });
  });

  test('再生ボタンクリック時にプリロード済み動画が即座に再生される', async () => {
    const question = {
      track: { youtubeUrl: 'https://www.youtube.com/watch?v=testVideoId' },
      startTime: 60,
    };

    render(<QuizPlayer question={question} />);

    // プリロード完了をシミュレート
    act(() => {
      // onStateChange で CUED状態をトリガー
      mockPlayer.addEventListener.mock.calls
        .find(call => call[0] === 'onStateChange')[1]({ data: 5 }); // CUED
    });

    // 再生ボタンをクリック
    const playButton = screen.getByRole('button');
    fireEvent.click(playButton);

    await waitFor(() => {
      expect(mockPlayer.seekTo).toHaveBeenCalledWith(60, true);
      expect(mockPlayer.playVideo).toHaveBeenCalled();
    });
  });
});
```

---

## 6. ベストプラクティスと注意事項

### 6.1. パフォーマンス最適化のポイント

1. **適切なプリロードタイミング**
   - ユーザーが次にアクセスしそうなコンテンツを予測してプリロード
   - 過度なプリロードはメモリとネットワーク帯域を消費するため注意

2. **メモリ管理**
   - 不要になった動画のプリロードデータは適切にクリア
   - 同時プリロード数の制限（推奨：3-5動画まで）

3. **ネットワーク状態の考慮**
   - 低速回線時はプリロードを制限または無効化
   - ユーザーのデータ使用量を意識した実装

### 6.2. セキュリティ考慮事項

1. **URL検証**
   - YouTube URL の形式を厳密にチェック
   - 不正なURLによる XSS 攻撃を防止

2. **Content Security Policy（CSP）**
   ```html
   <meta http-equiv="Content-Security-Policy" 
         content="frame-src 'self' https://www.youtube.com;">
   ```

3. **API制限の遵守**
   - YouTube の利用規約を遵守
   - レート制限を考慮した実装

### 6.3. ユーザビリティ向上のポイント

1. **視覚的フィードバック**
   - ローディング状態の明確な表示
   - ボタンの活性/非活性状態の管理

2. **エラー処理**
   - わかりやすいエラーメッセージ
   - 代替手段の提供

3. **アクセシビリティ**
   - キーボード操作対応
   - スクリーンリーダー対応

---

## 7. 実装チェックリスト

### 基本実装
- [ ] YouTube IFrame Player API の読み込み
- [ ] プレイヤーの初期化処理
- [ ] 基本的な再生制御（再生/停止/シーク）
- [ ] YouTube URL からの Video ID 抽出

### プリロード機能
- [ ] `cueVideoById` によるプリロード機能
- [ ] 重複プリロードの防止
- [ ] プリロード状態の管理
- [ ] 自動プリロードの実装

### エラーハンドリング
- [ ] 初期化エラーの処理
- [ ] 再生エラーの処理
- [ ] ネットワークエラーの処理
- [ ] ユーザーへの適切なフィードバック

---

## まとめ

本ガイドに従って実装することで、YouTube IFrame Player API を効率的に活用し、プリロード機能による快適なユーザー体験を提供できます。特に音楽クイズアプリのような即座の再生が求められるアプリケーションでは、これらの最適化により大幅なユーザビリティ向上が期待できます。

新規開発時は、基本実装から始めて段階的にプリロード機能や最適化を追加することを推奨します。また、定期的なパフォーマンス測定とユーザーフィードバックの収集により、継続的な改善を行ってください。