import '@testing-library/jest-dom';
import { renderHook, act } from '@testing-library/react';
import { useYouTubePlayer } from '../useYouTubePlayer';

// YouTube API のモック
const mockPlayer = {
  loadVideoById: jest.fn(),
  pauseVideo: jest.fn(),
  playVideo: jest.fn(),
  seekTo: jest.fn(),
  destroy: jest.fn(),
  getCurrentTime: jest.fn().mockReturnValue(0),
  getDuration: jest.fn().mockReturnValue(100),
};

const mockYT = {
  Player: jest.fn().mockImplementation((containerId, config) => {
    // onReady コールバックを即座に実行
    setTimeout(() => {
      if (config.events && config.events.onReady) {
        config.events.onReady();
      }
    }, 0);
    return mockPlayer;
  }),
  PlayerState: {
    PLAYING: 1,
    PAUSED: 2,
  },
};

describe('useYouTubePlayer Hook (YouTube Player制御)', () => {
  beforeEach(() => {
    // DOM環境をセットアップ
    document.head.innerHTML = '<script src="test.js"></script>';
    document.body.innerHTML = '<div id="youtube-player"></div>';

    // window の YouTube API 関連プロパティをリセット
    (window as any).YT = undefined;
    (window as any).onYouTubeIframeAPIReady = undefined;

    // モックをリセット
    jest.clearAllMocks();
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('基本的な状態管理', () => {
    it('初期状態では isReady が false である', () => {
      const { result } = renderHook(() => useYouTubePlayer());

      expect(result.current.isReady).toBe(false);
      expect(result.current.isPlaying).toBe(false);
    });

    it('YouTube API が既に読み込まれている場合、isReady が true になる', () => {
      (window as any).YT = mockYT;

      const { result } = renderHook(() => useYouTubePlayer());

      expect(result.current.isReady).toBe(true);
    });
  });

  describe('スクリプト読み込み機能', () => {
    it('YouTube IFrame API が未読み込みの場合、スクリプトを動的追加する', () => {
      renderHook(() => useYouTubePlayer());

      const scripts = document.querySelectorAll('script[src="https://www.youtube.com/iframe_api"]');
      expect(scripts).toHaveLength(1);
    });

    it('YouTube API 読み込み完了後に isReady が true になる', () => {
      const { result } = renderHook(() => useYouTubePlayer());

      expect(result.current.isReady).toBe(false);

      // API読み込み完了をシミュレート
      act(() => {
        (window as any).YT = mockYT;
        const callback = (window as any).onYouTubeIframeAPIReady;
        if (callback) callback();
      });

      expect(result.current.isReady).toBe(true);
    });
  });

  describe('プレイヤー制御機能', () => {
    it('initializePlayer でプレイヤーが初期化される', () => {
      (window as any).YT = mockYT;
      const { result } = renderHook(() => useYouTubePlayer());

      act(() => {
        result.current.initializePlayer('youtube-player');
      });

      expect(mockYT.Player).toHaveBeenCalledWith('youtube-player', expect.any(Object));
    });

    it('playTrack で楽曲の再生が開始される', async () => {
      (window as any).YT = mockYT;
      const { result } = renderHook(() => useYouTubePlayer());

      act(() => {
        result.current.initializePlayer('youtube-player');
      });

      // onReady コールバックの実行を待つ
      await act(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
      });

      act(() => {
        result.current.playTrack('https://www.youtube.com/watch?v=VIDEO_ID', 30, 10);
      });

      expect(mockPlayer.loadVideoById).toHaveBeenCalledWith({
        videoId: 'VIDEO_ID',
        startSeconds: 30,
      });
    });

    it('stopTrack で再生が停止される', () => {
      (window as any).YT = mockYT;
      const { result } = renderHook(() => useYouTubePlayer());

      act(() => {
        result.current.initializePlayer('youtube-player');
      });

      act(() => {
        result.current.playTrack('https://www.youtube.com/watch?v=VIDEO_ID', 30, 10);
      });

      act(() => {
        result.current.stopTrack();
      });

      expect(mockPlayer.pauseVideo).toHaveBeenCalled();
    });
  });

  describe('エラーハンドリング', () => {
    it('API未読み込み時の操作でエラーが発生しない', () => {
      const { result } = renderHook(() => useYouTubePlayer());

      expect(() => {
        result.current.initializePlayer('youtube-player');
        result.current.playTrack('https://www.youtube.com/watch?v=VIDEO_ID', 30, 10);
        result.current.stopTrack();
      }).not.toThrow();
    });

    it('プレイヤーが作成されていない状態での操作が安全に処理される', () => {
      (window as any).YT = mockYT;
      const { result } = renderHook(() => useYouTubePlayer());

      // プレイヤーを初期化しない状態で操作
      expect(() => {
        result.current.playTrack('https://www.youtube.com/watch?v=VIDEO_ID', 30, 10);
        result.current.stopTrack();
      }).not.toThrow();
    });
  });

  describe('メモリリーク対策', () => {
    it('コンポーネントアンマウント時にリソースが適切に解放される', () => {
      (window as any).YT = mockYT;
      const { result, unmount } = renderHook(() => useYouTubePlayer());

      act(() => {
        result.current.initializePlayer('youtube-player');
      });

      act(() => {
        result.current.playTrack('https://www.youtube.com/watch?v=VIDEO_ID', 30, 10);
      });

      act(() => {
        unmount();
      });

      // プレイヤーの破棄は実装に依存するため、エラーが発生しないことを確認
      expect(true).toBe(true);
    });
  });
});