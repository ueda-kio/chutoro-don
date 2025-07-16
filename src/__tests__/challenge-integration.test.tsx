import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import HomePage from '@/app/page';
import { ChallengePageContent } from '@/app/challenge/ChallengePageContent';
import { ChallengeResultPageContent } from '@/app/challenge/result/ChallengeResultPageContent';
import * as quizUtils from '@/utils/quiz';
import * as challengeUtils from '@/utils/challenge';
import type { SongsData, QuizQuestion } from '@/types';

// Next.js Router をモック
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

// クイズユーティリティをモック
jest.mock('@/utils/quiz');

// チャレンジユーティリティをモック
jest.mock('@/utils/challenge', () => ({
  ...jest.requireActual('@/utils/challenge'),
  getHighPrecisionTime: jest.fn(),
  calculateElapsedTime: jest.fn(),
}));

// YouTube Player Hook をモック
jest.mock('@/hooks/useYouTubePlayer', () => ({
  useYouTubePlayer: () => ({
    isReady: true,
    isPlayerReady: true,
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

const mockGetHighPrecisionTime = challengeUtils.getHighPrecisionTime as jest.MockedFunction<typeof challengeUtils.getHighPrecisionTime>;
const mockCalculateElapsedTime = challengeUtils.calculateElapsedTime as jest.MockedFunction<typeof challengeUtils.calculateElapsedTime>;

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

const mockQuestions: QuizQuestion[] = [
  {
    track: {
      id: 'track001',
      title: 'テスト楽曲',
      youtubeUrl: 'https://www.youtube.com/watch?v=testId',
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

describe('チャレンジモード 統合テスト', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });

    (useSearchParams as jest.Mock).mockReturnValue({
      get: jest.fn().mockReturnValue(null),
    });

    mockPush.mockClear();
    mockLoadSongsData.mockClear();
    mockGenerateQuizQuestionsFromAllSongs.mockClear();
    mockGetHighPrecisionTime.mockClear();
    mockCalculateElapsedTime.mockClear();

    // デフォルトのモック設定
    mockLoadSongsData.mockResolvedValue(mockSongsData);
    mockGenerateQuizQuestionsFromAllSongs.mockReturnValue(mockQuestions);
    mockGetHighPrecisionTime.mockReturnValue(1000);
    mockCalculateElapsedTime.mockReturnValue(30);
  });

  describe('機能要件1: モード選択画面', () => {
    describe('UI表示要件', () => {
      it('プレイモード選択エリアが表示される', async () => {
        render(<HomePage />);

        await waitFor(() => {
          expect(screen.getByText('プレイモード')).toBeInTheDocument();
          expect(screen.getByText('のんびりモード')).toBeInTheDocument();
          expect(screen.getByText('タイムアタック')).toBeInTheDocument();
        });
      });

      it('モード選択後にボタンの表示が変わる', async () => {
        render(<HomePage />);

        await waitFor(() => {
          // チャレンジモードを選択
          const challengeMode = screen.getByText('タイムアタック');
          fireEvent.click(challengeMode);

          // ボタンのテキストが変わる
          expect(screen.getByText('タイムアタック開始')).toBeInTheDocument();
        });
      });
    });

    describe('ユーザーインタラクション要件', () => {
      it('チャレンジモードを選択してクイズを開始できる', async () => {
        render(<HomePage />);

        await waitFor(() => {
          // チャレンジモードを選択
          const challengeMode = screen.getByText('タイムアタック');
          fireEvent.click(challengeMode);

          // クイズ開始ボタンをクリック
          const startButton = screen.getByText('タイムアタック開始');
          fireEvent.click(startButton);

          // チャレンジ画面に遷移
          expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/challenge'));
        });
      });

      it('モード未選択時は開始ボタンが無効化される', async () => {
        render(<HomePage />);

        await waitFor(() => {
          const startButton = screen.getByText('クイズ開始');
          expect(startButton).toBeDisabled();
        });
      });
    });
  });

  describe('機能要件2: チャレンジクイズ画面', () => {
    describe('初期化とデータ読み込み要件', () => {
      it('チャレンジモードが正しく初期化される', async () => {
        render(<ChallengePageContent />);

        await waitFor(() => {
          expect(mockLoadSongsData).toHaveBeenCalledTimes(1);
          expect(mockGenerateQuizQuestionsFromAllSongs).toHaveBeenCalledWith(mockSongsData, 10);
        });
      });

      it('10問固定で問題が生成される', async () => {
        render(<ChallengePageContent />);

        await waitFor(() => {
          expect(mockGenerateQuizQuestionsFromAllSongs).toHaveBeenCalledWith(mockSongsData, 10);
        });
      });
    });

    describe('UI表示要件', () => {
      it('チャレンジモード固有のヘッダーが表示される', async () => {
        render(<ChallengePageContent />);

        await waitFor(() => {
          expect(screen.getByText('中トロドン')).toBeInTheDocument();
          expect(screen.getByText('タイムアタック')).toBeInTheDocument();
        });
      });

      it('時間表示とスコア表示が表示される', async () => {
        render(<ChallengePageContent />);

        await waitFor(() => {
          expect(screen.getByText('経過時間')).toBeInTheDocument();
          expect(screen.getAllByText('現在のスコア')).toHaveLength(2);
        });
      });

      it('プログレスバーが表示される', async () => {
        render(<ChallengePageContent />);

        await waitFor(() => {
          expect(screen.getByText('Q.1 / 1')).toBeInTheDocument();
          expect(screen.getByText('進捗: 100%')).toBeInTheDocument();
        });
      });

      it('入力フォームが表示される', async () => {
        render(<ChallengePageContent />);

        await waitFor(() => {
          expect(screen.getByLabelText('楽曲名を入力してください')).toBeInTheDocument();
          expect(screen.getByText('回答する')).toBeInTheDocument();
          expect(screen.getByText('答えを表示 (-1000pt)')).toBeInTheDocument();
        });
      });
    });

    describe('スコアシステム要件', () => {
      it('再生時間ボーナスが正しく表示される', async () => {
        render(<ChallengePageContent />);

        await waitFor(() => {
          expect(screen.getByText('1秒 (+500pt)')).toBeInTheDocument();
          expect(screen.getByText('1.5秒 (+300pt)')).toBeInTheDocument();
          expect(screen.getByText('2秒 (+100pt)')).toBeInTheDocument();
          expect(screen.getByText('3秒 (+0pt)')).toBeInTheDocument();
          expect(screen.getByText('5秒 (-100pt)')).toBeInTheDocument();
        });
      });

      it('答え表示ペナルティが表示される', async () => {
        render(<ChallengePageContent />);

        await waitFor(() => {
          expect(screen.getByText('答えを表示 (-1000pt)')).toBeInTheDocument();
        });
      });
    });
  });

  describe('機能要件3: スコア表示画面', () => {
    describe('スコア表示要件', () => {
      it('最終スコアが正しく表示される', async () => {
        // スコア表示画面用のモック
        (useSearchParams as jest.Mock).mockReturnValue({
          get: jest.fn().mockImplementation((key) => {
            if (key === 'totalScore') return '8500';
            if (key === 'scores') return JSON.stringify([
              {
                questionIndex: 0,
                baseScore: 1000,
                timeBonus: 0,
                playDurationBonus: 200,
                revealPenalty: 0,
                totalScore: 1200,
                timeElapsed: 25,
                playDuration: 1,
                wasRevealed: false,
              },
            ]);
            return null;
          }),
        });

        render(<ChallengeResultPageContent />);

        await waitFor(() => {
          expect(screen.getByText('最終結果')).toBeInTheDocument();
          expect(screen.getByText('8,500')).toBeInTheDocument();
          expect(screen.getByText('点')).toBeInTheDocument();
        });
      });

      it('ランク判定が正しく表示される', async () => {
        (useSearchParams as jest.Mock).mockReturnValue({
          get: jest.fn().mockImplementation((key) => {
            if (key === 'totalScore') return '8500';
            return null;
          }),
        });

        render(<ChallengeResultPageContent />);

        await waitFor(() => {
          expect(screen.getByText('ランク C')).toBeInTheDocument();
        });
      });

      it('問題別スコア詳細が表示される', async () => {
        (useSearchParams as jest.Mock).mockReturnValue({
          get: jest.fn().mockImplementation((key) => {
            if (key === 'totalScore') return '1200';
            if (key === 'scores') return JSON.stringify([
              {
                questionIndex: 0,
                baseScore: 1000,
                timeBonus: 0,
                playDurationBonus: 200,
                revealPenalty: 0,
                totalScore: 1200,
                timeElapsed: 25,
                playDuration: 1,
                wasRevealed: false,
              },
            ]);
            return null;
          }),
        });

        render(<ChallengeResultPageContent />);

        await waitFor(() => {
          expect(screen.getByText('問題別スコア詳細')).toBeInTheDocument();
          expect(screen.getByText('Q.1')).toBeInTheDocument();
          expect(screen.getByText('1000')).toBeInTheDocument(); // 基本点
          expect(screen.getByText('+200')).toBeInTheDocument(); // 再生時間ボーナス
          expect(screen.getByText('1200')).toBeInTheDocument(); // 合計点
        });
      });

      it('リトライボタンが機能する', async () => {
        (useSearchParams as jest.Mock).mockReturnValue({
          get: jest.fn().mockImplementation((key) => {
            if (key === 'totalScore') return '8500';
            return null;
          }),
        });

        render(<ChallengeResultPageContent />);

        await waitFor(() => {
          const retryButton = screen.getByText('もう一度チャレンジ');
          fireEvent.click(retryButton);

          expect(mockPush).toHaveBeenCalledWith('/');
        });
      });

      it('トップに戻るボタンが機能する', async () => {
        (useSearchParams as jest.Mock).mockReturnValue({
          get: jest.fn().mockImplementation((key) => {
            if (key === 'totalScore') return '8500';
            return null;
          }),
        });

        render(<ChallengeResultPageContent />);

        await waitFor(() => {
          const backButton = screen.getByText('トップに戻る');
          fireEvent.click(backButton);

          expect(mockPush).toHaveBeenCalledWith('/');
        });
      });
    });
  });

  describe('機能要件4: 画面遷移フロー', () => {
    it('トップ画面からチャレンジモードを選択して開始できる', async () => {
      render(<HomePage />);

      await waitFor(() => {
        // チャレンジモードを選択
        const challengeMode = screen.getByText('タイムアタック');
        fireEvent.click(challengeMode);

        // クイズ開始ボタンをクリック
        const startButton = screen.getByText('タイムアタック開始');
        fireEvent.click(startButton);

        // チャレンジ画面に遷移
        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/challenge?mode=challenge'));
      });
    });
  });

  describe('機能要件5: エラーハンドリング', () => {
    it('データ読み込み失敗時はエラー画面を表示する', async () => {
      mockLoadSongsData.mockRejectedValue(new Error('Failed to load'));

      render(<ChallengePageContent />);

      await waitFor(() => {
        expect(screen.getByText('チャレンジモードの初期化に失敗しました。')).toBeInTheDocument();
        expect(screen.getByText('トップに戻る')).toBeInTheDocument();
      });
    });

    it('問題生成失敗時はエラー画面を表示する', async () => {
      mockGenerateQuizQuestionsFromAllSongs.mockReturnValue([]);

      render(<ChallengePageContent />);

      await waitFor(() => {
        expect(screen.getByText('クイズ問題を生成できませんでした。')).toBeInTheDocument();
      });
    });
  });
});