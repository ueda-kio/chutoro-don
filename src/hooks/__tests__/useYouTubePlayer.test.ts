import { renderHook, act } from '@testing-library/react';
import { useYouTubePlayer } from '../useYouTubePlayer';

// YouTube API のモック
const mockPlayer = {
  loadVideoById: jest.fn(),
  cueVideoById: jest.fn(),
  seekTo: jest.fn(),
  playVideo: jest.fn(),
  pauseVideo: jest.fn(),
  destroy: jest.fn(),
};

// グローバルオブジェクトのモック
const mockYT = {
  Player: jest.fn().mockImplementation((containerId, config) => {
    // onReady コールバックを即座に実行
    setTimeout(() => config.events.onReady(), 0);
    return mockPlayer;
  }),
  PlayerState: {
    PLAYING: 1,
    PAUSED: 2,
    BUFFERING: 3,
    CUED: 5,
  },
};

Object.defineProperty(window, 'YT', {
  value: mockYT,
  writable: true,
});

describe('useYouTubePlayer プリロード機能', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('プリロード機能が正しく動作すること', async () => {
    const { result } = renderHook(() => useYouTubePlayer());

    // プレイヤーを初期化
    act(() => {
      result.current.initializePlayer('test-container');
    });

    // プレイヤーが準備完了するまで待機
    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    expect(result.current.isPlayerReady).toBe(true);

    // 動画をプリロード
    act(() => {
      result.current.preloadVideo('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    });

    // cueVideoById が呼び出されることを確認
    expect(mockPlayer.cueVideoById).toHaveBeenCalledWith({
      videoId: 'dQw4w9WgXcQ',
      startSeconds: 0,
    });
  });

  it('同じ動画が既にプリロードされている場合、重複してプリロードしないこと', async () => {
    const { result } = renderHook(() => useYouTubePlayer());

    act(() => {
      result.current.initializePlayer('test-container');
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

    // 同じ動画を2回プリロード
    act(() => {
      result.current.preloadVideo(testUrl);
      result.current.preloadVideo(testUrl);
    });

    // cueVideoById は1回だけ呼び出されることを確認
    expect(mockPlayer.cueVideoById).toHaveBeenCalledTimes(1);
  });

  it('プリロード済みの動画再生時は seekTo + playVideo が使用されること', async () => {
    const { result } = renderHook(() => useYouTubePlayer());

    act(() => {
      result.current.initializePlayer('test-container');
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    const testUrl = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';

    // 動画をプリロード
    act(() => {
      result.current.preloadVideo(testUrl);
    });

    // 動画が読み込み済み状態をシミュレート
    act(() => {
      // onStateChange コールバックで CUED 状態を送信
      const config = mockYT.Player.mock.calls[0][1];
      config.events.onStateChange({ data: mockYT.PlayerState.CUED });
    });

    // プリロード済み動画を再生
    act(() => {
      result.current.playTrack(testUrl, 60, 2);
    });

    // seekTo と playVideo が呼び出されることを確認
    expect(mockPlayer.seekTo).toHaveBeenCalledWith(60, true);
    expect(mockPlayer.playVideo).toHaveBeenCalled();
    // loadVideoById は呼び出されないことを確認
    expect(mockPlayer.loadVideoById).not.toHaveBeenCalled();
  });

  it('異なる動画の再生時は loadVideoById が使用されること', async () => {
    const { result } = renderHook(() => useYouTubePlayer());

    act(() => {
      result.current.initializePlayer('test-container');
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // 異なる動画を再生
    act(() => {
      result.current.playTrack('https://www.youtube.com/watch?v=different123', 30, 1.5);
    });

    // loadVideoById が呼び出されることを確認
    expect(mockPlayer.loadVideoById).toHaveBeenCalledWith({
      videoId: 'different123',
      startSeconds: 30,
    });
  });

  it('isVideoLoaded 状態が正しく更新されること', async () => {
    const { result } = renderHook(() => useYouTubePlayer());

    act(() => {
      result.current.initializePlayer('test-container');
    });

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 10));
    });

    // 初期状態では isVideoLoaded は false
    expect(result.current.isVideoLoaded).toBe(false);

    // 動画をプリロード
    act(() => {
      result.current.preloadVideo('https://www.youtube.com/watch?v=test123');
    });

    // BUFFERING 状態をシミュレート
    act(() => {
      const config = mockYT.Player.mock.calls[0][1];
      config.events.onStateChange({ data: mockYT.PlayerState.BUFFERING });
    });

    // isVideoLoaded が true になることを確認
    expect(result.current.isVideoLoaded).toBe(true);
  });
});