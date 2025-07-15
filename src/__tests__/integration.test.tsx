import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import HomePage from '@/app/page';
import { QuizPageContent } from '@/app/quiz/QuizPageContent';
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
      name: 'テストアーティスト',
      albums: [
        {
          id: 'album001',
          name: 'テストアルバム',
          jacketUrl: '/test-jacket.jpg',
          tracks: [
            {
              id: 'track001',
              title: 'テスト楽曲',
              youtubeUrl: 'https://www.youtube.com/watch?v=testId',
            },
          ],
        },
      ],
    },
  ],
};

// 複数アルバムのテスト用データ
const mockMultipleAlbumsSongsData: SongsData = {
  artists: [
    {
      id: 'artist001',
      name: 'テストアーティスト1',
      albums: [
        {
          id: 'album001',
          name: 'テストアルバム1',
          jacketUrl: '/test-jacket1.jpg',
          tracks: [
            {
              id: 'track001',
              title: 'テスト楽曲1',
              youtubeUrl: 'https://www.youtube.com/watch?v=testId1',
            },
          ],
        },
        {
          id: 'album002',
          name: 'テストアルバム2',
          jacketUrl: '/test-jacket2.jpg',
          tracks: [
            {
              id: 'track002',
              title: 'テスト楽曲2',
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
      title: 'テスト楽曲1',
      youtubeUrl: 'https://www.youtube.com/watch?v=testId1',
    },
    album: {
      id: 'album001',
      name: 'テストアルバム',
      jacketUrl: '/test-jacket.jpg',
      tracks: [],
    },
    artist: {
      id: 'artist001',
      name: 'テストアーティスト',
      albums: [],
    },
    startTime: 120,
  },
];

describe('中トロドン アプリケーション 統合テスト', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    // useSearchParams のモックを設定
    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    });

    mockPush.mockClear();
    mockLoadSongsData.mockClear();
    mockGenerateQuizQuestionsFromAllSongs.mockClear();

    // デフォルトのモック設定
    mockLoadSongsData.mockResolvedValue(mockSongsData);
    mockGenerateQuizQuestionsFromAllSongs.mockReturnValue(mockQuestions);
  });

  describe('機能要件1: トップ画面（シンプルスタート機能）', () => {
    describe('UI表示要件', () => {
      it('アプリケーションタイトル「中トロドン」が表示される', async () => {
        render(<HomePage />);

        await waitFor(() => {
          expect(screen.getByText('中トロドン')).toBeInTheDocument();
        });
      });

      it('アプリケーションの説明文が表示される', async () => {
        render(<HomePage />);

        await waitFor(() => {
          expect(screen.getByText('中トロドン')).toBeInTheDocument();
          expect(screen.getByText('曲の中トロを聴いて曲名を当てよう')).toBeInTheDocument();
        });
      });

      it('スタートボタンが表示される', async () => {
        render(<HomePage />);

        await waitFor(() => {
          const startButton = screen.getByRole('button', { name: 'クイズ開始' });
          expect(startButton).toBeInTheDocument();
        });
      });
    });

    describe('ユーザーインタラクション要件', () => {
      it('スタートボタンクリックでクイズ画面に遷移する', async () => {
        render(<HomePage />);

        // のんびりモードを選択
        await waitFor(() => {
          const freeModeButton = screen.getByText('のんびりモード');
          fireEvent.click(freeModeButton);
        });

        await waitFor(() => {
          const startButton = screen.getByRole('button', { name: 'クイズ開始' });
          fireEvent.click(startButton);

          // 単一アルバムのため全アルバム選択となり、クエリパラメータなしで遷移
          expect(mockPush).toHaveBeenCalledWith('/quiz?mode=freeplay');
        });
      });

      it('全アルバム選択時はクエリパラメータなしでクイズ画面に遷移する', async () => {
        // 複数アルバムのデータを使用
        mockLoadSongsData.mockResolvedValue(mockMultipleAlbumsSongsData);

        render(<HomePage />);

        // デフォルトで全アルバムが選択されているため（2個のアルバム）、
        // これが全アルバム選択状態となる

        await waitFor(() => {
          expect(screen.getByText('2個のアルバムが選択されています')).toBeInTheDocument();
        });

        // のんびりモードを選択
        await waitFor(() => {
          const freeModeButton = screen.getByText('のんびりモード');
          fireEvent.click(freeModeButton);
        });

        await waitFor(() => {
          const startButton = screen.getByRole('button', { name: 'クイズ開始' });
          fireEvent.click(startButton);

          // 全アルバムが選択されている場合、クエリパラメータなしで遷移
          expect(mockPush).toHaveBeenCalledWith('/quiz?mode=freeplay');
        });
      });
    });
    describe('レスポンシブデザイン要件', () => {
      it('画面中央にコンテンツが配置される', async () => {
        render(<HomePage />);

        await waitFor(() => {
          const mainContainer = screen.getByText('中トロドン').closest('div')?.parentElement?.parentElement;
          expect(mainContainer).toHaveClass('min-h-screen', 'py-8', 'px-4');
        });
      });
    });
  });

  describe('機能要件2: クイズ画面（ランダム楽曲出題機能）', () => {
    beforeEach(() => {
      mockLoadSongsData.mockResolvedValue(mockSongsData);
      mockGenerateQuizQuestionsFromAllSongs.mockReturnValue(mockQuestions);
    });

    describe('初期化とデータ読み込み要件', () => {
      beforeEach(() => {
        // useSearchParamsがnullを返すように設定（アルバム指定なし）
        (useSearchParams as jest.Mock).mockReturnValue({
          get: jest.fn().mockReturnValue(null),
        });
      });

      it('楽曲データを読み込んで全楽曲からランダムに10問生成する', async () => {
        render(<QuizPageContent />);

        await waitFor(() => {
          expect(mockLoadSongsData).toHaveBeenCalledTimes(1);
          expect(mockGenerateQuizQuestionsFromAllSongs).toHaveBeenCalledWith(mockSongsData, 10);
        });
      });

      it('データ読み込み失敗時はトップページにリダイレクトする', async () => {
        mockLoadSongsData.mockRejectedValue(new Error('Failed to load'));

        render(<QuizPageContent />);

        await waitFor(() => {
          expect(mockPush).toHaveBeenCalledWith('/');
        });
      });
    });

    describe('UI表示要件', () => {
      it('アプリケーションタイトルと問題番号が表示される', async () => {
        (useSearchParams as jest.Mock).mockReturnValue({
          get: jest.fn().mockReturnValue(null), // アルバム指定なし
        });

        render(<QuizPageContent />);

        await waitFor(() => {
          expect(screen.getByText('中トロドン')).toBeInTheDocument();
          expect(screen.getByText('Q.1 / 1')).toBeInTheDocument();
        });
      });

      it('クイズプレイヤーコンポーネントが表示される', async () => {
        (useSearchParams as jest.Mock).mockReturnValue({
          get: jest.fn().mockReturnValue(null), // アルバム指定なし
        });

        render(<QuizPageContent />);

        await waitFor(() => {
          expect(screen.getByRole('button', { name: '再生' })).toBeInTheDocument();
          expect(screen.getByText('答えを表示')).toBeInTheDocument();
        });
      });
    });

    describe('クイズ進行要件', () => {
      it('クイズ終了後はトップページに戻る', async () => {
        (useSearchParams as jest.Mock).mockReturnValue({
          get: jest.fn().mockReturnValue(null), // アルバム指定なし
        });

        render(<QuizPageContent />);

        await waitFor(() => {
          const revealButton = screen.getByText('答えを表示');
          fireEvent.click(revealButton);
        });

        await waitFor(() => {
          const finishButton = screen.getByText('クイズ終了');
          fireEvent.click(finishButton);
        });

        await waitFor(() => {
          expect(mockPush).toHaveBeenCalledWith('/');
        });
      });
    });
  });

  describe('機能要件3: 楽曲再生制御（YouTube IFrame Player API連携）', () => {
    beforeEach(() => {
      // useSearchParamsがnullを返すように設定（アルバム指定なし）
      (useSearchParams as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue(null),
      });
      mockLoadSongsData.mockResolvedValue(mockSongsData);
      mockGenerateQuizQuestionsFromAllSongs.mockReturnValue(mockQuestions);
    });

    describe('再生制御要件', () => {
      it('再生ボタンが表示される', async () => {
        render(<QuizPageContent />);

        await waitFor(() => {
          expect(screen.getByRole('button', { name: '再生' })).toBeInTheDocument();
        });
      });

      it('再生時間選択プルダウンが表示される（1秒、1.5秒、2秒、3秒、5秒）', async () => {
        render(<QuizPageContent />);

        await waitFor(() => {
          expect(screen.getByLabelText('再生時間')).toBeInTheDocument();
          expect(screen.getByDisplayValue('1秒')).toBeInTheDocument(); // デフォルト値
        });
      });

      it('再生時間の選択肢が正しく表示される', async () => {
        render(<QuizPageContent />);

        await waitFor(() => {
          expect(screen.getByRole('option', { name: '1秒' })).toBeInTheDocument();
          expect(screen.getByRole('option', { name: '1.5秒' })).toBeInTheDocument();
          expect(screen.getByRole('option', { name: '2秒' })).toBeInTheDocument();
          expect(screen.getByRole('option', { name: '3秒' })).toBeInTheDocument();
          expect(screen.getByRole('option', { name: '5秒' })).toBeInTheDocument();
        });
      });
    });
  });

  describe('機能要件4: 解答表示機能', () => {
    beforeEach(() => {
      // useSearchParamsがnullを返すように設定（アルバム指定なし）
      (useSearchParams as jest.Mock).mockReturnValue({
        get: jest.fn().mockReturnValue(null),
      });
      mockLoadSongsData.mockResolvedValue(mockSongsData);
      mockGenerateQuizQuestionsFromAllSongs.mockReturnValue(mockQuestions);
    });

    describe('解答表示要件', () => {
      it('答えを表示ボタンクリックで解答エリアが表示される', async () => {
        render(<QuizPageContent />);

        await waitFor(() => {
          const revealButton = screen.getByText('答えを表示');
          fireEvent.click(revealButton);
        });

        await waitFor(() => {
          expect(screen.getByText('テスト楽曲1')).toBeInTheDocument();
          expect(screen.getByText('テストアーティスト')).toBeInTheDocument();
          expect(screen.getByText('テストアルバム')).toBeInTheDocument();
        });
      });

      it('解答表示後に次へボタンが有効化される', async () => {
        render(<QuizPageContent />);

        await waitFor(() => {
          // 初期状態では次へボタンは無効
          const nextButton = screen.getByText('クイズ終了');
          expect(nextButton).toBeDisabled();
        });

        await waitFor(() => {
          const revealButton = screen.getByText('答えを表示');
          fireEvent.click(revealButton);
        });

        await waitFor(() => {
          const nextButton = screen.getByText('クイズ終了');
          expect(nextButton).not.toBeDisabled();
        });
      });

      it('アルバムジャケット画像が表示される', async () => {
        render(<QuizPageContent />);

        await waitFor(() => {
          const revealButton = screen.getByText('答えを表示');
          fireEvent.click(revealButton);
        });

        await waitFor(() => {
          const albumImage = screen.getByAltText('テストアルバム');
          expect(albumImage).toBeInTheDocument();
        });
      });
    });
  });

  describe('機能要件5: エラーハンドリング', () => {
    describe('エラー表示要件', () => {
      it('問題生成失敗時はエラー画面を表示する', async () => {
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
  });
});

// 注意: calculateStartTime関数の詳細テストは src/utils/__tests__/quiz.test.ts に記載されています
