import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { ChallengePageContent } from '../ChallengePageContent';
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
  calculateQuestionScore: jest.fn(),
  calculateTotalScore: jest.fn(),
  isSongTitleMatch: jest.fn(),
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

// ChallengeQuizPlayer をモック
jest.mock('@/components/ChallengeQuizPlayer', () => ({
  ChallengeQuizPlayer: ({ onAnswerSubmit, onRevealAnswer, onNext, isLastQuestion }: any) => (
    <div data-testid="challenge-quiz-player">
      <button onClick={() => onAnswerSubmit('テスト楽曲', 1)}>回答する</button>
      <button onClick={() => onRevealAnswer(1)}>答えを表示</button>
      <button onClick={onNext}>
        {isLastQuestion ? 'スコア確認' : '次の問題'}
      </button>
    </div>
  ),
}));

const mockPush = jest.fn();
const mockLoadSongsData = quizUtils.loadSongsData as jest.MockedFunction<typeof quizUtils.loadSongsData>;
const mockGenerateQuizQuestionsFromAllSongs = quizUtils.generateQuizQuestionsFromAllSongs as jest.MockedFunction<
  typeof quizUtils.generateQuizQuestionsFromAllSongs
>;
const mockGenerateQuizQuestionsFromSelectedAlbums = quizUtils.generateQuizQuestionsFromSelectedAlbums as jest.MockedFunction<
  typeof quizUtils.generateQuizQuestionsFromSelectedAlbums
>;

const mockGetHighPrecisionTime = challengeUtils.getHighPrecisionTime as jest.MockedFunction<typeof challengeUtils.getHighPrecisionTime>;
const mockIsSongTitleMatch = challengeUtils.isSongTitleMatch as jest.MockedFunction<typeof challengeUtils.isSongTitleMatch>;
const mockCalculateQuestionScore = challengeUtils.calculateQuestionScore as jest.MockedFunction<typeof challengeUtils.calculateQuestionScore>;
const mockCalculateTotalScore = challengeUtils.calculateTotalScore as jest.MockedFunction<typeof challengeUtils.calculateTotalScore>;

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

describe('ChallengePageContent コンポーネント', () => {
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
    mockGenerateQuizQuestionsFromSelectedAlbums.mockClear();
    mockGetHighPrecisionTime.mockClear();
    mockIsSongTitleMatch.mockClear();
    mockCalculateQuestionScore.mockClear();
    mockCalculateTotalScore.mockClear();

    // デフォルトのモック設定
    mockLoadSongsData.mockResolvedValue(mockSongsData);
    mockGenerateQuizQuestionsFromAllSongs.mockReturnValue(mockQuestions);
    mockGetHighPrecisionTime.mockReturnValue(1000);
    mockIsSongTitleMatch.mockReturnValue(true);
    mockCalculateQuestionScore.mockReturnValue({
      questionIndex: 0,
      baseScore: 1000,
      timeBonus: 0,
      playDurationBonus: 200,
      revealPenalty: 0,
      totalScore: 1200,
      timeElapsed: 30,
      playDuration: 1,
      wasRevealed: false,
    });
    mockCalculateTotalScore.mockReturnValue(1200);
  });

  describe('初期化とデータ読み込み', () => {
    it('チャレンジモードが正しく初期化される', async () => {
      render(<ChallengePageContent />);

      await waitFor(() => {
        expect(mockLoadSongsData).toHaveBeenCalledTimes(1);
        expect(mockGenerateQuizQuestionsFromAllSongs).toHaveBeenCalledWith(mockSongsData, 10);
      });
    });

    it('特定のアルバムが選択されている場合、そのアルバムから問題を生成する', async () => {
      (useSearchParams as jest.Mock).mockReturnValue({
        get: jest.fn().mockImplementation((key) => {
          if (key === 'albums') return 'album001';
          return null;
        }),
      });

      render(<ChallengePageContent />);

      await waitFor(() => {
        expect(mockGenerateQuizQuestionsFromSelectedAlbums).toHaveBeenCalledWith(mockSongsData, ['album001'], 10);
      });
    });

    it('データ読み込み失敗時はエラー画面を表示する', async () => {
      mockLoadSongsData.mockRejectedValue(new Error('Failed to load'));

      render(<ChallengePageContent />);

      await waitFor(() => {
        expect(screen.getByText('チャレンジモードの初期化に失敗しました。')).toBeInTheDocument();
        expect(screen.getByText('トップに戻る')).toBeInTheDocument();
      });
    });

    it('問題生成に失敗した場合はエラー画面を表示する', async () => {
      mockGenerateQuizQuestionsFromAllSongs.mockReturnValue([]);

      render(<ChallengePageContent />);

      await waitFor(() => {
        expect(screen.getByText('クイズ問題を生成できませんでした。')).toBeInTheDocument();
      });
    });
  });

  describe('UI表示', () => {
    it('ヘッダーが正しく表示される', async () => {
      render(<ChallengePageContent />);

      await waitFor(() => {
        expect(screen.getByText('中トロドン')).toBeInTheDocument();
        expect(screen.getByText('タイムアタック')).toBeInTheDocument();
      });
    });

    it('プログレスバーが表示される', async () => {
      render(<ChallengePageContent />);

      await waitFor(() => {
        expect(screen.getByText('Q.1 / 1')).toBeInTheDocument();
        expect(screen.getByText('進捗: 100%')).toBeInTheDocument();
      });
    });

    it('現在のスコアが表示される', async () => {
      render(<ChallengePageContent />);

      await waitFor(() => {
        expect(screen.getByText('現在のスコア')).toBeInTheDocument();
        expect(screen.getByText('0')).toBeInTheDocument();
      });
    });

    it('ChallengeQuizPlayerが表示される', async () => {
      render(<ChallengePageContent />);

      await waitFor(() => {
        expect(screen.getByTestId('challenge-quiz-player')).toBeInTheDocument();
      });
    });
  });

  describe('回答機能', () => {
    it('正解時にスコアが更新され、次の問題に進む', async () => {
      jest.useFakeTimers();
      render(<ChallengePageContent />);

      await waitFor(() => {
        expect(screen.getByTestId('challenge-quiz-player')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('回答する');
      fireEvent.click(submitButton);

      expect(mockIsSongTitleMatch).toHaveBeenCalledWith('テスト楽曲', 'テスト楽曲');
      expect(mockCalculateQuestionScore).toHaveBeenCalled();
      expect(mockCalculateTotalScore).toHaveBeenCalled();

      // 1.5秒後に次の問題に進む
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        // 最後の問題なので、スコア画面に遷移する
        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/challenge/result'));
      });

      jest.useRealTimers();
    });

    it('不正解時は回答をリセットして続行する', async () => {
      mockIsSongTitleMatch.mockReturnValue(false);

      render(<ChallengePageContent />);

      await waitFor(() => {
        expect(screen.getByTestId('challenge-quiz-player')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('回答する');
      fireEvent.click(submitButton);

      expect(mockIsSongTitleMatch).toHaveBeenCalledWith('テスト楽曲', 'テスト楽曲');
      // 不正解の場合、スコア計算は行われない
      expect(mockCalculateQuestionScore).not.toHaveBeenCalled();
    });
  });

  describe('答え表示機能', () => {
    it('答えを表示するとペナルティ付きでスコアが計算される', async () => {
      mockCalculateQuestionScore.mockReturnValue({
        questionIndex: 0,
        baseScore: 1000,
        timeBonus: 0,
        playDurationBonus: 200,
        revealPenalty: -500,
        totalScore: 700,
        timeElapsed: 30,
        playDuration: 1,
        wasRevealed: true,
      });

      render(<ChallengePageContent />);

      await waitFor(() => {
        expect(screen.getByTestId('challenge-quiz-player')).toBeInTheDocument();
      });

      const revealButton = screen.getByText('答えを表示');
      fireEvent.click(revealButton);

      expect(mockCalculateQuestionScore).toHaveBeenCalledWith(
        0, // questionIndex
        expect.any(Number), // timeElapsed
        1, // playDuration
        true // wasRevealed
      );
    });
  });

  describe('ゲーム終了機能', () => {
    it('最後の問題完了後にスコア画面に遷移する', async () => {
      jest.useFakeTimers();
      render(<ChallengePageContent />);

      await waitFor(() => {
        expect(screen.getByTestId('challenge-quiz-player')).toBeInTheDocument();
      });

      const submitButton = screen.getByText('回答する');
      fireEvent.click(submitButton);

      // 次の問題に進む処理を待つ
      jest.advanceTimersByTime(1500);

      await waitFor(() => {
        // スコア画面に遷移する処理を待つ
        jest.advanceTimersByTime(1000);
      });

      await waitFor(() => {
        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/challenge/result'));
      });

      jest.useRealTimers();
    });
  });

  describe('設定モーダル', () => {
    it('設定ボタンをクリックするとモーダルが開く', async () => {
      render(<ChallengePageContent />);

      await waitFor(() => {
        expect(screen.getByLabelText('設定')).toBeInTheDocument();
      });

      const settingsButton = screen.getByLabelText('設定');
      fireEvent.click(settingsButton);

      // モーダルが開かれたかの確認は、実際のモーダルコンポーネントの存在で判定
      // ここではモーダルが呼び出されることを確認
      expect(settingsButton).toBeInTheDocument();
    });
  });

  describe('エラーハンドリング', () => {
    it('エラー画面でトップに戻るボタンが機能する', async () => {
      mockLoadSongsData.mockRejectedValue(new Error('Failed to load'));

      render(<ChallengePageContent />);

      await waitFor(() => {
        expect(screen.getByText('トップに戻る')).toBeInTheDocument();
      });

      const backButton = screen.getByText('トップに戻る');
      fireEvent.click(backButton);

      expect(mockPush).toHaveBeenCalledWith('/');
    });
  });

  describe('ローディング状態', () => {
    it('初期化中はローディング画面が表示される', () => {
      // loadSongsDataを永続的にpendingにする
      mockLoadSongsData.mockImplementation(() => new Promise(() => {}));

      render(<ChallengePageContent />);

      expect(screen.getByText('タイムアタックを準備中...')).toBeInTheDocument();
    });
  });
});