import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import { QuizPageContent } from '../QuizPageContent';
import * as quizUtils from '@/utils/quiz';
import type { SongsData, QuizQuestion } from '@/types';

// Next.js Router をモック
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// クイズユーティリティをモック
jest.mock('@/utils/quiz');

// YouTube Player Hook をモック
jest.mock('@/hooks/useYouTubePlayer', () => ({
  useYouTubePlayer: () => ({
    isReady: true,
    isPlaying: false,
    initializePlayer: jest.fn(),
    playTrack: jest.fn(),
    stopTrack: jest.fn(),
  }),
}));

const mockPush = jest.fn();
const mockLoadSongsData = quizUtils.loadSongsData as jest.MockedFunction<typeof quizUtils.loadSongsData>;
const mockGenerateQuizQuestionsFromAllSongs = quizUtils.generateQuizQuestionsFromAllSongs as jest.MockedFunction<
  typeof quizUtils.generateQuizQuestionsFromAllSongs
>;

const mockSongsData: SongsData = {
  artists: [
    {
      id: 'artist001',
      name: 'Test Artist',
      albums: [
        {
          id: 'album001',
          name: 'Test Album',
          jacketUrl: '/test-jacket.jpg',
          tracks: [
            {
              id: 'track001',
              title: 'Test Track',
              youtubeUrl: 'https://www.youtube.com/watch?v=testId',
            },
          ],
        },
      ],
    },
  ],
};

const mockQuestions: QuizQuestion[] = [
  {
    track: {
      id: 'track001',
      title: 'Test Track 1',
      youtubeUrl: 'https://www.youtube.com/watch?v=testId1',
    },
    album: {
      id: 'album001',
      name: 'Test Album',
      jacketUrl: '/test-jacket.jpg',
      tracks: [],
    },
    artist: {
      id: 'artist001',
      name: 'Test Artist',
      albums: [],
    },
    startTime: 120,
  },
  {
    track: {
      id: 'track002',
      title: 'Test Track 2',
      youtubeUrl: 'https://www.youtube.com/watch?v=testId2',
    },
    album: {
      id: 'album002',
      name: 'Test Album 2',
      jacketUrl: '/test-jacket2.jpg',
      tracks: [],
    },
    artist: {
      id: 'artist002',
      name: 'Test Artist 2',
      albums: [],
    },
    startTime: 90,
  },
];

describe('Quiz Page Content (クイズ画面)', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    mockPush.mockClear();
    mockLoadSongsData.mockClear();
    mockGenerateQuizQuestionsFromAllSongs.mockClear();
  });

  describe('初期化とデータ読み込み', () => {
    it('正常にデータを読み込んでクイズ問題を生成する', async () => {
      mockLoadSongsData.mockResolvedValue(mockSongsData);
      mockGenerateQuizQuestionsFromAllSongs.mockReturnValue(mockQuestions);

      render(<QuizPageContent />);

      expect(screen.getByText('クイズを準備中...')).toBeInTheDocument();

      await waitFor(() => {
        expect(screen.getByText('中トロドン')).toBeInTheDocument();
      });

      expect(mockLoadSongsData).toHaveBeenCalledTimes(1);
      expect(mockGenerateQuizQuestionsFromAllSongs).toHaveBeenCalledWith(mockSongsData, 10);
    });

    it('データ読み込みに失敗した場合はトップページにリダイレクトする', async () => {
      mockLoadSongsData.mockRejectedValue(new Error('Failed to load'));

      render(<QuizPageContent />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('問題生成に失敗した場合はエラー画面を表示する', async () => {
      mockLoadSongsData.mockResolvedValue(mockSongsData);
      mockGenerateQuizQuestionsFromAllSongs.mockImplementation(() => {
        throw new Error('No tracks found');
      });

      render(<QuizPageContent />);

      await waitFor(() => {
        expect(screen.getByText('クイズの準備に失敗しました')).toBeInTheDocument();
      });
    });
  });

  describe('UIコンポーネント表示', () => {
    beforeEach(async () => {
      mockLoadSongsData.mockResolvedValue(mockSongsData);
      mockGenerateQuizQuestionsFromAllSongs.mockReturnValue(mockQuestions);
    });

    it('アプリケーションタイトルが表示される', async () => {
      render(<QuizPageContent />);

      await waitFor(() => {
        expect(screen.getByText('中トロドン')).toBeInTheDocument();
      });
    });

    it('問題番号が正しく表示される', async () => {
      render(<QuizPageContent />);

      await waitFor(() => {
        expect(screen.getByText('Q.1 / 2')).toBeInTheDocument();
      });
    });

    it('QuizPlayerコンポーネントが描画される', async () => {
      render(<QuizPageContent />);

      await waitFor(() => {
        // QuizPlayerの中身（再生ボタンなど）が表示されることを確認
        expect(screen.getByRole('button', { name: '再生' })).toBeInTheDocument();
      });
    });
  });

  describe('クイズ進行機能', () => {
    beforeEach(async () => {
      mockLoadSongsData.mockResolvedValue(mockSongsData);
      mockGenerateQuizQuestionsFromAllSongs.mockReturnValue(mockQuestions);
    });

    it('次の問題に進むことができる', async () => {
      render(<QuizPageContent />);

      await waitFor(() => {
        expect(screen.getByText('Q.1 / 2')).toBeInTheDocument();
      });

      // 答えを表示してから次に進む
      const revealButton = screen.getByText('答えを表示');
      fireEvent.click(revealButton);

      await waitFor(() => {
        const nextButton = screen.getByText('次へ');
        fireEvent.click(nextButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Q.2 / 2')).toBeInTheDocument();
      });
    });

    it('最後の問題でクイズ終了ボタンが表示される', async () => {
      // 2問目から開始するように設定
      const singleQuestion = [mockQuestions[1]];
      mockGenerateQuizQuestionsFromAllSongs.mockReturnValue(singleQuestion);

      render(<QuizPageContent />);

      await waitFor(() => {
        expect(screen.getByText('Q.1 / 1')).toBeInTheDocument();
      });

      // 答えを表示
      const revealButton = screen.getByText('答えを表示');
      fireEvent.click(revealButton);

      await waitFor(() => {
        expect(screen.getByText('クイズ終了')).toBeInTheDocument();
      });
    });

    it('クイズ終了後はトップページに戻る', async () => {
      const singleQuestion = [mockQuestions[0]];
      mockGenerateQuizQuestionsFromAllSongs.mockReturnValue(singleQuestion);

      render(<QuizPageContent />);

      await waitFor(() => {
        const revealButton = screen.getByText('答えを表示');
        fireEvent.click(revealButton);
      });

      await waitFor(() => {
        const finishButton = screen.getByText('クイズ終了');
        fireEvent.click(finishButton);
      });

      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  describe('エラーハンドリング', () => {
    it('問題が0問の場合はエラー画面を表示する', async () => {
      mockLoadSongsData.mockResolvedValue(mockSongsData);
      mockGenerateQuizQuestionsFromAllSongs.mockReturnValue([]);

      render(<QuizPageContent />);

      await waitFor(() => {
        expect(screen.getByText('クイズの準備に失敗しました')).toBeInTheDocument();
        expect(screen.getByText('トップに戻る')).toBeInTheDocument();
      });
    });

    it('エラー画面からトップページに戻ることができる', async () => {
      mockLoadSongsData.mockResolvedValue(mockSongsData);
      mockGenerateQuizQuestionsFromAllSongs.mockReturnValue([]);

      render(<QuizPageContent />);

      await waitFor(() => {
        const backButton = screen.getByText('トップに戻る');
        fireEvent.click(backButton);
      });

      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  describe('ランダム楽曲選択の確認', () => {
    it('全楽曲からランダムに10問生成する設定でクイズが作成される', async () => {
      mockLoadSongsData.mockResolvedValue(mockSongsData);
      mockGenerateQuizQuestionsFromAllSongs.mockReturnValue(mockQuestions);

      render(<QuizPageContent />);

      await waitFor(() => {
        expect(mockGenerateQuizQuestionsFromAllSongs).toHaveBeenCalledWith(mockSongsData, 10);
      });
    });
  });
});
