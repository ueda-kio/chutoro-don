import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChallengeQuizPlayer } from '../ChallengeQuizPlayer';
import * as useYouTubePlayerHook from '@/hooks/useYouTubePlayer';
import * as challengeUtils from '@/utils/challenge';
import type { QuizQuestion } from '@/types';

// YouTube Player Hook をモック
jest.mock('@/hooks/useYouTubePlayer');

// challenge utils をモック
jest.mock('@/utils/challenge', () => ({
  ...jest.requireActual('@/utils/challenge'),
  getHighPrecisionTime: jest.fn(),
  calculateElapsedTime: jest.fn(),
}));

const mockQuizQuestion: QuizQuestion = {
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
};

const mockUseYouTubePlayer = {
  isReady: true,
  isPlaying: false,
  isPlayerReady: true,
  initializePlayer: jest.fn(),
  playTrack: jest.fn(),
  stopTrack: jest.fn(),
};

describe('ChallengeQuizPlayer コンポーネント', () => {
  const mockOnAnswerSubmit = jest.fn();
  const mockOnRevealAnswer = jest.fn();
  const mockOnNext = jest.fn();

  beforeEach(() => {
    (useYouTubePlayerHook.useYouTubePlayer as jest.Mock).mockReturnValue(mockUseYouTubePlayer);
    (challengeUtils.getHighPrecisionTime as jest.Mock).mockReturnValue(1000);
    (challengeUtils.calculateElapsedTime as jest.Mock).mockReturnValue(30);
    
    mockOnAnswerSubmit.mockClear();
    mockOnRevealAnswer.mockClear();
    mockOnNext.mockClear();
    
    for (const fn of Object.values(mockUseYouTubePlayer)) {
      if (typeof fn === 'function') fn.mockClear();
    }
  });

  describe('UIコンポーネント表示', () => {
    it('時間表示エリアが表示される', () => {
      render(
        <ChallengeQuizPlayer
          question={mockQuizQuestion}
          onAnswerSubmit={mockOnAnswerSubmit}
          onRevealAnswer={mockOnRevealAnswer}
          onNext={mockOnNext}
          isLastQuestion={false}
          userAnswer=""
          isAnswerCorrect={false}
          isAnswerRevealed={false}
          isGameCompleted={false}
          currentScore={0}
        />
      );

      expect(screen.getByText('経過時間')).toBeInTheDocument();
      expect(screen.getByText('現在のスコア')).toBeInTheDocument();
    });

    it('再生ボタンが表示される', () => {
      render(
        <ChallengeQuizPlayer
          question={mockQuizQuestion}
          onAnswerSubmit={mockOnAnswerSubmit}
          onRevealAnswer={mockOnRevealAnswer}
          onNext={mockOnNext}
          isLastQuestion={false}
          userAnswer=""
          isAnswerCorrect={false}
          isAnswerRevealed={false}
          isGameCompleted={false}
          currentScore={0}
        />
      );

      expect(screen.getByRole('button', { name: '再生' })).toBeInTheDocument();
    });

    it('再生時間選択プルダウンが表示される', () => {
      render(
        <ChallengeQuizPlayer
          question={mockQuizQuestion}
          onAnswerSubmit={mockOnAnswerSubmit}
          onRevealAnswer={mockOnRevealAnswer}
          onNext={mockOnNext}
          isLastQuestion={false}
          userAnswer=""
          isAnswerCorrect={false}
          isAnswerRevealed={false}
          isGameCompleted={false}
          currentScore={0}
        />
      );

      expect(screen.getByLabelText('再生時間')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1秒 (+500pt)')).toBeInTheDocument();
    });

    it('回答入力フォームが表示される', () => {
      render(
        <ChallengeQuizPlayer
          question={mockQuizQuestion}
          onAnswerSubmit={mockOnAnswerSubmit}
          onRevealAnswer={mockOnRevealAnswer}
          onNext={mockOnNext}
          isLastQuestion={false}
          userAnswer=""
          isAnswerCorrect={false}
          isAnswerRevealed={false}
          isGameCompleted={false}
          currentScore={0}
        />
      );

      expect(screen.getByLabelText('楽曲名を入力してください')).toBeInTheDocument();
      expect(screen.getByText('回答する')).toBeInTheDocument();
      expect(screen.getByText('答えを表示 (-1000pt)')).toBeInTheDocument();
    });

    it('スコア表示のボーナス情報が正しく表示される', () => {
      render(
        <ChallengeQuizPlayer
          question={mockQuizQuestion}
          onAnswerSubmit={mockOnAnswerSubmit}
          onRevealAnswer={mockOnRevealAnswer}
          onNext={mockOnNext}
          isLastQuestion={false}
          userAnswer=""
          isAnswerCorrect={false}
          isAnswerRevealed={false}
          isGameCompleted={false}
          currentScore={0}
        />
      );

      expect(screen.getByText('1秒 (+500pt)')).toBeInTheDocument();
      expect(screen.getByText('1.5秒 (+300pt)')).toBeInTheDocument();
      expect(screen.getByText('2秒 (+100pt)')).toBeInTheDocument();
      expect(screen.getByText('3秒 (+0pt)')).toBeInTheDocument();
      expect(screen.getByText('5秒 (-100pt)')).toBeInTheDocument();
    });
  });

  describe('再生機能', () => {
    it('再生ボタンをクリックすると楽曲が再生される', () => {
      render(
        <ChallengeQuizPlayer
          question={mockQuizQuestion}
          onAnswerSubmit={mockOnAnswerSubmit}
          onRevealAnswer={mockOnRevealAnswer}
          onNext={mockOnNext}
          isLastQuestion={false}
          userAnswer=""
          isAnswerCorrect={false}
          isAnswerRevealed={false}
          isGameCompleted={false}
          currentScore={0}
        />
      );

      const playButton = screen.getByRole('button', { name: '再生' });
      fireEvent.click(playButton);

      expect(mockUseYouTubePlayer.playTrack).toHaveBeenCalledWith(
        mockQuizQuestion.track.youtubeUrl,
        mockQuizQuestion.startTime,
        1 // デフォルトの再生時間
      );
    });

    it('再生時間を変更してから再生すると、実際の再生時間が記録される', () => {
      render(
        <ChallengeQuizPlayer
          question={mockQuizQuestion}
          onAnswerSubmit={mockOnAnswerSubmit}
          onRevealAnswer={mockOnRevealAnswer}
          onNext={mockOnNext}
          isLastQuestion={false}
          userAnswer=""
          isAnswerCorrect={false}
          isAnswerRevealed={false}
          isGameCompleted={false}
          currentScore={0}
        />
      );

      // 再生時間を5秒に変更
      const durationSelect = screen.getByLabelText('再生時間');
      fireEvent.change(durationSelect, { target: { value: '5' } });

      // 再生ボタンをクリック
      const playButton = screen.getByRole('button', { name: '再生' });
      fireEvent.click(playButton);

      // 再生時間を1秒に戻す
      fireEvent.change(durationSelect, { target: { value: '1' } });

      // 回答を送信
      const input = screen.getByLabelText('楽曲名を入力してください');
      const submitButton = screen.getByText('回答する');
      fireEvent.change(input, { target: { value: 'テスト楽曲' } });
      fireEvent.click(submitButton);

      // 実際に再生された時間（5秒）がスコア計算に使用される
      expect(mockOnAnswerSubmit).toHaveBeenCalledWith('テスト楽曲', 5);
    });

    it('再生中に再生ボタンをクリックすると停止する', () => {
      (useYouTubePlayerHook.useYouTubePlayer as jest.Mock).mockReturnValue({
        ...mockUseYouTubePlayer,
        isPlaying: true,
      });

      render(
        <ChallengeQuizPlayer
          question={mockQuizQuestion}
          onAnswerSubmit={mockOnAnswerSubmit}
          onRevealAnswer={mockOnRevealAnswer}
          onNext={mockOnNext}
          isLastQuestion={false}
          userAnswer=""
          isAnswerCorrect={false}
          isAnswerRevealed={false}
          isGameCompleted={false}
          currentScore={0}
        />
      );

      const pauseButton = screen.getByRole('button', { name: '一時停止' });
      fireEvent.click(pauseButton);

      expect(mockUseYouTubePlayer.stopTrack).toHaveBeenCalled();
    });

    it('正解後は再生ボタンが無効化される', () => {
      render(
        <ChallengeQuizPlayer
          question={mockQuizQuestion}
          onAnswerSubmit={mockOnAnswerSubmit}
          onRevealAnswer={mockOnRevealAnswer}
          onNext={mockOnNext}
          isLastQuestion={false}
          userAnswer=""
          isAnswerCorrect={true}
          isAnswerRevealed={false}
          isGameCompleted={false}
          currentScore={0}
        />
      );

      const playButton = screen.getByRole('button', { name: '再生' });
      expect(playButton).toBeDisabled();
    });

    it('答え表示後は再生ボタンが無効化される', () => {
      render(
        <ChallengeQuizPlayer
          question={mockQuizQuestion}
          onAnswerSubmit={mockOnAnswerSubmit}
          onRevealAnswer={mockOnRevealAnswer}
          onNext={mockOnNext}
          isLastQuestion={false}
          userAnswer=""
          isAnswerCorrect={false}
          isAnswerRevealed={true}
          isGameCompleted={false}
          currentScore={0}
        />
      );

      const playButton = screen.getByRole('button', { name: '再生' });
      expect(playButton).toBeDisabled();
    });
  });

  describe('回答機能', () => {
    it('回答入力フォームで回答を送信できる', () => {
      render(
        <ChallengeQuizPlayer
          question={mockQuizQuestion}
          onAnswerSubmit={mockOnAnswerSubmit}
          onRevealAnswer={mockOnRevealAnswer}
          onNext={mockOnNext}
          isLastQuestion={false}
          userAnswer=""
          isAnswerCorrect={false}
          isAnswerRevealed={false}
          isGameCompleted={false}
          currentScore={0}
        />
      );

      const input = screen.getByLabelText('楽曲名を入力してください');
      const submitButton = screen.getByText('回答する');

      fireEvent.change(input, { target: { value: 'テスト楽曲' } });
      fireEvent.click(submitButton);

      expect(mockOnAnswerSubmit).toHaveBeenCalledWith('テスト楽曲', 1);
    });

    it('空の回答は送信できない', () => {
      render(
        <ChallengeQuizPlayer
          question={mockQuizQuestion}
          onAnswerSubmit={mockOnAnswerSubmit}
          onRevealAnswer={mockOnRevealAnswer}
          onNext={mockOnNext}
          isLastQuestion={false}
          userAnswer=""
          isAnswerCorrect={false}
          isAnswerRevealed={false}
          isGameCompleted={false}
          currentScore={0}
        />
      );

      const submitButton = screen.getByText('回答する');
      expect(submitButton).toBeDisabled();
    });

    it('正解後は回答入力が無効化される', () => {
      render(
        <ChallengeQuizPlayer
          question={mockQuizQuestion}
          onAnswerSubmit={mockOnAnswerSubmit}
          onRevealAnswer={mockOnRevealAnswer}
          onNext={mockOnNext}
          isLastQuestion={false}
          userAnswer=""
          isAnswerCorrect={true}
          isAnswerRevealed={false}
          isGameCompleted={false}
          currentScore={0}
        />
      );

      const input = screen.getByLabelText('楽曲名を入力してください');
      const submitButton = screen.getByText('回答する');

      expect(input).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });

    it('答え表示後は回答入力が無効化される', () => {
      render(
        <ChallengeQuizPlayer
          question={mockQuizQuestion}
          onAnswerSubmit={mockOnAnswerSubmit}
          onRevealAnswer={mockOnRevealAnswer}
          onNext={mockOnNext}
          isLastQuestion={false}
          userAnswer=""
          isAnswerCorrect={false}
          isAnswerRevealed={true}
          isGameCompleted={false}
          currentScore={0}
        />
      );

      const input = screen.getByLabelText('楽曲名を入力してください');
      const submitButton = screen.getByText('回答する');

      expect(input).toBeDisabled();
      expect(submitButton).toBeDisabled();
    });
  });

  describe('答え表示機能', () => {
    it('答えを表示ボタンをクリックするとonRevealAnswerが呼ばれる', () => {
      render(
        <ChallengeQuizPlayer
          question={mockQuizQuestion}
          onAnswerSubmit={mockOnAnswerSubmit}
          onRevealAnswer={mockOnRevealAnswer}
          onNext={mockOnNext}
          isLastQuestion={false}
          userAnswer=""
          isAnswerCorrect={false}
          isAnswerRevealed={false}
          isGameCompleted={false}
          currentScore={0}
        />
      );

      const revealButton = screen.getByText('答えを表示 (-1000pt)');
      fireEvent.click(revealButton);

      expect(mockOnRevealAnswer).toHaveBeenCalledWith(1);
    });

    it('再生後に答えを表示すると、実際の再生時間が使用される', () => {
      render(
        <ChallengeQuizPlayer
          question={mockQuizQuestion}
          onAnswerSubmit={mockOnAnswerSubmit}
          onRevealAnswer={mockOnRevealAnswer}
          onNext={mockOnNext}
          isLastQuestion={false}
          userAnswer=""
          isAnswerCorrect={false}
          isAnswerRevealed={false}
          isGameCompleted={false}
          currentScore={0}
        />
      );

      // 再生時間を3秒に変更
      const durationSelect = screen.getByLabelText('再生時間');
      fireEvent.change(durationSelect, { target: { value: '3' } });

      // 再生ボタンをクリック
      const playButton = screen.getByRole('button', { name: '再生' });
      fireEvent.click(playButton);

      // 答えを表示
      const revealButton = screen.getByText('答えを表示 (-1000pt)');
      fireEvent.click(revealButton);

      // 実際に再生された時間（3秒）がスコア計算に使用される
      expect(mockOnRevealAnswer).toHaveBeenCalledWith(3);
    });

    it('答え表示後はボタンが無効化される', () => {
      render(
        <ChallengeQuizPlayer
          question={mockQuizQuestion}
          onAnswerSubmit={mockOnAnswerSubmit}
          onRevealAnswer={mockOnRevealAnswer}
          onNext={mockOnNext}
          isLastQuestion={false}
          userAnswer=""
          isAnswerCorrect={false}
          isAnswerRevealed={true}
          isGameCompleted={false}
          currentScore={0}
        />
      );

      const revealButton = screen.getByText('答えを表示 (-1000pt)');
      expect(revealButton).toBeDisabled();
    });
  });

  describe('フィードバック表示', () => {
    it('正解時に正解メッセージが表示される', () => {
      render(
        <ChallengeQuizPlayer
          question={mockQuizQuestion}
          onAnswerSubmit={mockOnAnswerSubmit}
          onRevealAnswer={mockOnRevealAnswer}
          onNext={mockOnNext}
          isLastQuestion={false}
          userAnswer="テスト楽曲"
          isAnswerCorrect={true}
          isAnswerRevealed={false}
          isGameCompleted={false}
          currentScore={0}
        />
      );

      expect(screen.getByText('正解！')).toBeInTheDocument();
      expect(screen.getByText('回答: テスト楽曲')).toBeInTheDocument();
    });

    it('不正解時に不正解メッセージが表示される', () => {
      const { rerender } = render(
        <ChallengeQuizPlayer
          question={mockQuizQuestion}
          onAnswerSubmit={mockOnAnswerSubmit}
          onRevealAnswer={mockOnRevealAnswer}
          onNext={mockOnNext}
          isLastQuestion={false}
          userAnswer=""
          isAnswerCorrect={false}
          isAnswerRevealed={false}
          isGameCompleted={false}
          currentScore={0}
        />
      );

      // 回答を入力
      const input = screen.getByLabelText('楽曲名を入力してください');
      fireEvent.change(input, { target: { value: '間違った答え' } });

      // 再描画して不正解の状態を反映
      rerender(
        <ChallengeQuizPlayer
          question={mockQuizQuestion}
          onAnswerSubmit={mockOnAnswerSubmit}
          onRevealAnswer={mockOnRevealAnswer}
          onNext={mockOnNext}
          isLastQuestion={false}
          userAnswer="間違った答え"
          isAnswerCorrect={false}
          isAnswerRevealed={false}
          isGameCompleted={false}
          currentScore={0}
        />
      );

      expect(screen.getByText('不正解')).toBeInTheDocument();
      expect(screen.getByText('もう一度チャレンジしてみてください')).toBeInTheDocument();
    });

    it('正解または答え表示後に解答エリアが表示される', () => {
      render(
        <ChallengeQuizPlayer
          question={mockQuizQuestion}
          onAnswerSubmit={mockOnAnswerSubmit}
          onRevealAnswer={mockOnRevealAnswer}
          onNext={mockOnNext}
          isLastQuestion={false}
          userAnswer=""
          isAnswerCorrect={true}
          isAnswerRevealed={false}
          isGameCompleted={false}
          currentScore={0}
        />
      );

      expect(screen.getByText('テスト楽曲')).toBeInTheDocument();
      expect(screen.getByText('テストアーティスト')).toBeInTheDocument();
      expect(screen.getByText('テストアルバム')).toBeInTheDocument();
    });
  });

  describe('次へボタン', () => {
    it('正解後に次へボタンが表示される', () => {
      render(
        <ChallengeQuizPlayer
          question={mockQuizQuestion}
          onAnswerSubmit={mockOnAnswerSubmit}
          onRevealAnswer={mockOnRevealAnswer}
          onNext={mockOnNext}
          isLastQuestion={false}
          userAnswer=""
          isAnswerCorrect={true}
          isAnswerRevealed={false}
          isGameCompleted={false}
          currentScore={0}
        />
      );

      expect(screen.getByText('次の問題')).toBeInTheDocument();
    });

    it('最後の問題では「スコア確認」ボタンが表示される', () => {
      render(
        <ChallengeQuizPlayer
          question={mockQuizQuestion}
          onAnswerSubmit={mockOnAnswerSubmit}
          onRevealAnswer={mockOnRevealAnswer}
          onNext={mockOnNext}
          isLastQuestion={true}
          userAnswer=""
          isAnswerCorrect={true}
          isAnswerRevealed={false}
          isGameCompleted={false}
          currentScore={0}
        />
      );

      expect(screen.getByText('スコア確認')).toBeInTheDocument();
    });

    it('次へボタンをクリックするとonNextが呼ばれる', () => {
      render(
        <ChallengeQuizPlayer
          question={mockQuizQuestion}
          onAnswerSubmit={mockOnAnswerSubmit}
          onRevealAnswer={mockOnRevealAnswer}
          onNext={mockOnNext}
          isLastQuestion={false}
          userAnswer=""
          isAnswerCorrect={true}
          isAnswerRevealed={false}
          isGameCompleted={false}
          currentScore={0}
        />
      );

      const nextButton = screen.getByText('次の問題');
      fireEvent.click(nextButton);

      expect(mockOnNext).toHaveBeenCalled();
    });
  });

  describe('デフォルト再生時間', () => {
    it('デフォルト再生時間が設定されている場合、その値が使用される', () => {
      render(
        <ChallengeQuizPlayer
          question={mockQuizQuestion}
          onAnswerSubmit={mockOnAnswerSubmit}
          onRevealAnswer={mockOnRevealAnswer}
          onNext={mockOnNext}
          isLastQuestion={false}
          defaultPlayDuration={2}
          userAnswer=""
          isAnswerCorrect={false}
          isAnswerRevealed={false}
          isGameCompleted={false}
          currentScore={0}
        />
      );

      expect(screen.getByDisplayValue('2秒 (+100pt)')).toBeInTheDocument();
    });

    it('デフォルト再生時間が未設定の場合、1秒が使用される', () => {
      render(
        <ChallengeQuizPlayer
          question={mockQuizQuestion}
          onAnswerSubmit={mockOnAnswerSubmit}
          onRevealAnswer={mockOnRevealAnswer}
          onNext={mockOnNext}
          isLastQuestion={false}
          defaultPlayDuration={null}
          userAnswer=""
          isAnswerCorrect={false}
          isAnswerRevealed={false}
          isGameCompleted={false}
          currentScore={0}
        />
      );

      expect(screen.getByDisplayValue('1秒 (+500pt)')).toBeInTheDocument();
    });
  });
});