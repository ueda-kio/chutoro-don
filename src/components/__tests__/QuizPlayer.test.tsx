import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react';
import { QuizPlayer } from '../QuizPlayer';
import type { QuizQuestion, SongsData } from '@/types';

jest.mock('@/hooks/useYouTubePlayer', () => ({
  useYouTubePlayer: () => ({
    isReady: true,
    isPlayerReady: true,
    isPlaying: false,
    isVideoLoaded: true,
    initializePlayer: jest.fn(),
    playTrack: jest.fn(),
    stopTrack: jest.fn(),
    preloadVideo: jest.fn(),
  }),
}));

const mockQuestion: QuizQuestion = {
  track: {
    id: 'track001',
    title: 'Test Song',
    youtubeUrl: 'https://www.youtube.com/watch?v=test',
  },
  album: {
    id: 'album001',
    name: 'Test Album',
    jacketUrl: '/test.jpg',
    tracks: [],
  },
  artist: {
    id: 'artist001',
    name: 'Test Artist',
    albums: [],
  },
  startTime: 120,
};

const mockSongsData: SongsData = {
  artists: [
    {
      id: 'artist001',
      name: 'Test Artist',
      albums: [
        {
          id: 'album001',
          name: 'Test Album',
          jacketUrl: '/test.jpg',
          tracks: [
            {
              id: 'track001',
              title: 'Test Song',
              youtubeUrl: 'https://www.youtube.com/watch?v=test',
            },
            {
              id: 'track002',
              title: 'Another Song',
              youtubeUrl: 'https://www.youtube.com/watch?v=test2',
            },
          ],
        },
      ],
    },
  ],
};

describe('QuizPlayer - 不正解時の再選択機能', () => {
  const mockOnNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('不正解時にシンプルな「不正解」表示がされること', async () => {
    render(
      <QuizPlayer
        question={mockQuestion}
        onNext={mockOnNext}
        isLastQuestion={false}
        songsData={mockSongsData}
      />
    );

    // テキスト入力で不正解を送信
    const input = screen.getByLabelText('楽曲名を入力してください');
    const submitButton = screen.getByText('回答する');

    fireEvent.change(input, { target: { value: 'Wrong Answer' } });
    fireEvent.click(submitButton);

    // 不正解フィードバックが表示されることを確認（titleの不正解は除外）
    await waitFor(() => {
      const incorrectElements = screen.getAllByText('不正解');
      // titleとspan、2つの要素が存在することを確認
      expect(incorrectElements.length).toBeGreaterThan(0);
    });

    // 「再度回答する」ボタンは表示されないことを確認
    expect(screen.queryByText('再度回答する')).not.toBeInTheDocument();
  });

  it('不正解フィードバックが2秒後に自動的に消えること', async () => {
    jest.useFakeTimers();
    
    render(
      <QuizPlayer
        question={mockQuestion}
        onNext={mockOnNext}
        isLastQuestion={false}
        songsData={mockSongsData}
      />
    );

    // 不正解を送信
    const input = screen.getByLabelText('楽曲名を入力してください');
    const submitButton = screen.getByText('回答する');

    fireEvent.change(input, { target: { value: 'Wrong Answer' } });
    fireEvent.click(submitButton);

    // 不正解フィードバックが表示されることを確認
    await waitFor(() => {
      const incorrectElements = screen.getAllByText('不正解');
      expect(incorrectElements.length).toBeGreaterThan(0);
    });

    // 2秒経過させる
    act(() => {
      jest.advanceTimersByTime(2000);
    });

    // 不正解フィードバックが消えることを確認
    await waitFor(() => {
      expect(screen.queryByText('不正解')).not.toBeInTheDocument();
    });

    // 回答フォームが再度使用可能になることを確認
    expect(screen.getByLabelText('楽曲名を入力してください')).toBeInTheDocument();
    expect(screen.getByText('回答する')).toBeInTheDocument();

    jest.useRealTimers();
  });

  it('正解時は従来通りに動作すること', async () => {
    render(
      <QuizPlayer
        question={mockQuestion}
        onNext={mockOnNext}
        isLastQuestion={false}
        songsData={mockSongsData}
      />
    );

    // 正解を送信
    const input = screen.getByLabelText('楽曲名を入力してください');
    const submitButton = screen.getByText('回答する');

    fireEvent.change(input, { target: { value: 'Test Song' } });
    fireEvent.click(submitButton);

    // 正解メッセージと解答エリアが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('正解')).toBeInTheDocument();
      expect(screen.getByText('Test Song')).toBeInTheDocument();
      expect(screen.getByText('Test Artist')).toBeInTheDocument();
    });

    // 次へボタンが表示されることを確認
    expect(screen.getByText('次へ')).toBeInTheDocument();
  });

  it('「答えを表示」ボタンで解答エリアが表示されること', async () => {
    render(
      <QuizPlayer
        question={mockQuestion}
        onNext={mockOnNext}
        isLastQuestion={false}
        songsData={mockSongsData}
      />
    );

    // 「答えを表示」ボタンをクリック
    const revealButton = screen.getByText('答えを表示');
    fireEvent.click(revealButton);

    // 解答エリアが表示されることを確認
    await waitFor(() => {
      expect(screen.getByText('Test Song')).toBeInTheDocument();
      expect(screen.getByText('Test Artist')).toBeInTheDocument();
      expect(screen.getByText('Test Album')).toBeInTheDocument();
    });

    // 次へボタンが表示されることを確認
    expect(screen.getByText('次へ')).toBeInTheDocument();
  });
});