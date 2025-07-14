import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
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
const mockGet = jest.fn();
const mockLoadSongsData = quizUtils.loadSongsData as jest.MockedFunction<typeof quizUtils.loadSongsData>;
const mockGenerateQuizQuestions = quizUtils.generateQuizQuestions as jest.MockedFunction<typeof quizUtils.generateQuizQuestions>;
const mockGenerateQuizQuestionsFromAllSongs = quizUtils.generateQuizQuestionsFromAllSongs as jest.MockedFunction<
  typeof quizUtils.generateQuizQuestionsFromAllSongs
>;

const mockSongsData: SongsData = {
  artists: [
    {
      id: 'artist001',
      name: 'Test Artist 1',
      albums: [
        {
          id: 'album001',
          name: 'Test Album 1',
          jacketUrl: '/test-jacket1.jpg',
          tracks: [
            {
              id: 'track001',
              title: 'Test Track 1',
              youtubeUrl: 'https://www.youtube.com/watch?v=testId1',
            },
          ],
        },
        {
          id: 'album002',
          name: 'Test Album 2',
          jacketUrl: '/test-jacket2.jpg',
          tracks: [
            {
              id: 'track002',
              title: 'Test Track 2',
              youtubeUrl: 'https://www.youtube.com/watch?v=testId2',
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

describe('QuizPageContent - アルバム選択機能対応', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    (useSearchParams as jest.Mock).mockReturnValue({
      get: mockGet,
    });
    mockPush.mockClear();
    mockGet.mockClear();
    mockLoadSongsData.mockClear();
    mockGenerateQuizQuestions.mockClear();
    mockGenerateQuizQuestionsFromAllSongs.mockClear();
  });

  describe('初期化とURL パラメータ処理', () => {
    it('アルバムパラメータがない場合、全曲からクイズが生成される', async () => {
      mockGet.mockReturnValue(null);
      mockLoadSongsData.mockResolvedValue(mockSongsData);
      mockGenerateQuizQuestionsFromAllSongs.mockReturnValue(mockQuestions);

      render(<QuizPageContent />);

      expect(screen.getByText('クイズを準備中...')).toBeInTheDocument();

      await waitFor(() => {
        expect(mockLoadSongsData).toHaveBeenCalled();
        expect(mockGenerateQuizQuestionsFromAllSongs).toHaveBeenCalledWith(mockSongsData, 10);
        expect(mockGenerateQuizQuestions).not.toHaveBeenCalled();
      });
    });

    it('アルバムパラメータがある場合、選択されたアルバムからクイズが生成される', async () => {
      mockGet.mockReturnValue('album001,album002');
      mockLoadSongsData.mockResolvedValue(mockSongsData);
      mockGenerateQuizQuestions.mockReturnValue(mockQuestions);

      render(<QuizPageContent />);

      await waitFor(() => {
        expect(mockLoadSongsData).toHaveBeenCalled();
        expect(mockGenerateQuizQuestions).toHaveBeenCalledWith(['album001', 'album002'], mockSongsData, 10);
        expect(mockGenerateQuizQuestionsFromAllSongs).not.toHaveBeenCalled();
      });
    });

    it('データ読み込みに失敗した場合はトップページにリダイレクトする', async () => {
      mockGet.mockReturnValue(null);
      mockLoadSongsData.mockRejectedValue(new Error('Failed to load'));

      render(<QuizPageContent />);

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });

    it('問題生成に失敗した場合はエラー画面を表示する', async () => {
      mockGet.mockReturnValue(null);
      mockLoadSongsData.mockResolvedValue(mockSongsData);
      mockGenerateQuizQuestionsFromAllSongs.mockReturnValue([]);

      render(<QuizPageContent />);

      await waitFor(() => {
        expect(screen.getByText('クイズの準備に失敗しました')).toBeInTheDocument();
      });
    });
  });

  describe('UIコンポーネント表示', () => {
    beforeEach(async () => {
      mockGet.mockReturnValue(null);
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
        expect(screen.getByRole('button', { name: '再生' })).toBeInTheDocument();
      });
    });
  });

  describe('クイズ進行機能', () => {
    beforeEach(async () => {
      mockGet.mockReturnValue(null);
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

    it('クイズ終了後はトップページに戻る', async () => {
      const singleQuestion = [mockQuestions[0]];
      mockGenerateQuizQuestionsFromAllSongs.mockReturnValue(singleQuestion);

      render(<QuizPageContent />);

      // 初期レンダリングを待機
      await waitFor(() => {
        expect(screen.getByText('答えを表示')).toBeInTheDocument();
      });

      // 答えを表示ボタンをクリック
      const revealButton = screen.getByText('答えを表示');
      fireEvent.click(revealButton);

      // 答えが表示され、クイズ終了ボタンが有効になるまで待機
      await waitFor(() => {
        const finishButton = screen.getByText('クイズ終了');
        expect(finishButton).toBeEnabled();
      });

      // クイズ終了ボタンをクリック
      const finishButton = screen.getByText('クイズ終了');
      fireEvent.click(finishButton);

      // トップページへのリダイレクトを確認
      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith('/');
      });
    });
  });

  describe('出題範囲設定ボタン', () => {
    beforeEach(() => {
      mockGet.mockReturnValue('album001');
      mockLoadSongsData.mockResolvedValue(mockSongsData);
      mockGenerateQuizQuestions.mockReturnValue(mockQuestions);
    });

    it('設定ボタンが表示される', async () => {
      render(<QuizPageContent />);

      await waitFor(() => {
        const settingsButton = screen.getByTitle('出題範囲を設定');
        expect(settingsButton).toBeInTheDocument();
      });
    });

    it('設定ボタンをクリックするとモーダルが開く', async () => {
      render(<QuizPageContent />);

      await waitFor(() => {
        const settingsButton = screen.getByTitle('出題範囲を設定');
        fireEvent.click(settingsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('出題範囲設定')).toBeInTheDocument();
      });
    });
  });
});
