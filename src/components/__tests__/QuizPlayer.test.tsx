import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { QuizPlayer } from '../QuizPlayer';
import * as useYouTubePlayerHook from '@/hooks/useYouTubePlayer';
import type { QuizQuestion } from '@/types';

// YouTube Player Hook をモック
jest.mock('@/hooks/useYouTubePlayer');

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

describe('Quiz Player Component (クイズプレイヤー)', () => {
  const mockOnNext = jest.fn();

  beforeEach(() => {
    (useYouTubePlayerHook.useYouTubePlayer as jest.Mock).mockReturnValue(mockUseYouTubePlayer);
    mockOnNext.mockClear();
    for (const fn of Object.values(mockUseYouTubePlayer)) {
      if (typeof fn === 'function') fn.mockClear();
    }
  });

  describe('UIコンポーネント表示', () => {
    it('再生ボタンが表示される', () => {
      render(<QuizPlayer question={mockQuizQuestion} onNext={mockOnNext} isLastQuestion={false} />);

      expect(screen.getByRole('button', { name: '再生' })).toBeInTheDocument();
    });

    it('再生時間選択プルダウンが表示される', () => {
      render(<QuizPlayer question={mockQuizQuestion} onNext={mockOnNext} isLastQuestion={false} />);

      expect(screen.getByLabelText('再生時間')).toBeInTheDocument();
      expect(screen.getByDisplayValue('1秒')).toBeInTheDocument(); // デフォルト値
    });

    it('答えを表示ボタンが表示される', () => {
      render(<QuizPlayer question={mockQuizQuestion} onNext={mockOnNext} isLastQuestion={false} />);

      expect(screen.getByText('答えを表示')).toBeInTheDocument();
    });

    it('次へボタンが初期状態では無効化されている', () => {
      render(<QuizPlayer question={mockQuizQuestion} onNext={mockOnNext} isLastQuestion={false} />);

      const nextButton = screen.getByText('次へ');
      expect(nextButton).toBeDisabled();
    });

    it('最後の問題の場合は「クイズ終了」ボタンが表示される', () => {
      render(<QuizPlayer question={mockQuizQuestion} onNext={mockOnNext} isLastQuestion={true} />);

      // 答えを表示してからボタンのテキストを確認
      const revealButton = screen.getByText('答えを表示');
      fireEvent.click(revealButton);

      expect(screen.getByText('クイズ終了')).toBeInTheDocument();
    });
  });

  describe('再生機能', () => {
    it('再生時間の選択肢が正しく表示される', () => {
      render(<QuizPlayer question={mockQuizQuestion} onNext={mockOnNext} isLastQuestion={false} />);

      const durationSelect = screen.getByLabelText('再生時間');

      // 各選択肢が存在することを確認
      expect(screen.getByRole('option', { name: '1秒' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '1.5秒' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '2秒' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '3秒' })).toBeInTheDocument();
      expect(screen.getByRole('option', { name: '5秒' })).toBeInTheDocument();
    });

    it('再生時間を変更できる', () => {
      render(<QuizPlayer question={mockQuizQuestion} onNext={mockOnNext} isLastQuestion={false} />);

      const durationSelect = screen.getByLabelText('再生時間');
      fireEvent.change(durationSelect, { target: { value: '3' } });

      expect(durationSelect).toHaveValue('3');
    });

    it('再生ボタンをクリックすると楽曲が再生される', () => {
      render(<QuizPlayer question={mockQuizQuestion} onNext={mockOnNext} isLastQuestion={false} />);

      const playButton = screen.getByRole('button', { name: '再生' });
      fireEvent.click(playButton);

      expect(mockUseYouTubePlayer.playTrack).toHaveBeenCalledWith(
        mockQuizQuestion.track.youtubeUrl,
        mockQuizQuestion.startTime,
        1 // デフォルトの再生時間
      );
    });

    it('再生中に再生ボタンをクリックすると停止する', () => {
      // 再生中の状態をモック
      (useYouTubePlayerHook.useYouTubePlayer as jest.Mock).mockReturnValue({
        ...mockUseYouTubePlayer,
        isPlaying: true,
      });

      render(<QuizPlayer question={mockQuizQuestion} onNext={mockOnNext} isLastQuestion={false} />);

      const pauseButton = screen.getByRole('button', { name: '一時停止' });
      fireEvent.click(pauseButton);

      expect(mockUseYouTubePlayer.stopTrack).toHaveBeenCalled();
    });

    it('YouTube Playerが準備できていない場合は再生ボタンが無効化される', () => {
      (useYouTubePlayerHook.useYouTubePlayer as jest.Mock).mockReturnValue({
        ...mockUseYouTubePlayer,
        isPlayerReady: false,
      });

      render(<QuizPlayer question={mockQuizQuestion} onNext={mockOnNext} isLastQuestion={false} />);

      const playButton = screen.getByRole('button', { name: '再生' });
      expect(playButton).toBeDisabled();
    });
  });

  describe('答え表示機能', () => {
    it('答えを表示ボタンをクリックすると解答エリアが表示される', () => {
      render(<QuizPlayer question={mockQuizQuestion} onNext={mockOnNext} isLastQuestion={false} />);

      // 初期状態では解答エリアは表示されない
      expect(screen.queryByText('テスト楽曲')).not.toBeInTheDocument();

      const revealButton = screen.getByText('答えを表示');
      fireEvent.click(revealButton);

      // 解答エリアが表示される
      expect(screen.getByText('テスト楽曲')).toBeInTheDocument();
      expect(screen.getByText('テストアーティスト')).toBeInTheDocument();
      expect(screen.getByText('テストアルバム')).toBeInTheDocument();
    });

    it('答えを表示後、ボタンが無効化される', () => {
      render(<QuizPlayer question={mockQuizQuestion} onNext={mockOnNext} isLastQuestion={false} />);

      const revealButton = screen.getByText('答えを表示');
      fireEvent.click(revealButton);

      expect(screen.getByText('答えを表示済み')).toBeDisabled();
    });

    it('答えを表示後、次へボタンが有効化される', () => {
      render(<QuizPlayer question={mockQuizQuestion} onNext={mockOnNext} isLastQuestion={false} />);

      const revealButton = screen.getByText('答えを表示');
      fireEvent.click(revealButton);

      const nextButton = screen.getByText('次へ');
      expect(nextButton).not.toBeDisabled();
    });

    it('答えを表示すると再生が停止される', () => {
      render(<QuizPlayer question={mockQuizQuestion} onNext={mockOnNext} isLastQuestion={false} />);

      const revealButton = screen.getByText('答えを表示');
      fireEvent.click(revealButton);

      expect(mockUseYouTubePlayer.stopTrack).toHaveBeenCalled();
    });

    it('アルバムジャケット画像が表示される', () => {
      render(<QuizPlayer question={mockQuizQuestion} onNext={mockOnNext} isLastQuestion={false} />);

      const revealButton = screen.getByText('答えを表示');
      fireEvent.click(revealButton);

      const albumImage = screen.getByAltText('テストアルバム');
      expect(albumImage).toBeInTheDocument();
      expect(albumImage).toHaveAttribute('src', expect.stringContaining('test-jacket.jpg'));
    });
  });

  describe('問題切り替え機能', () => {
    it('次へボタンをクリックするとonNextが呼ばれる', () => {
      render(<QuizPlayer question={mockQuizQuestion} onNext={mockOnNext} isLastQuestion={false} />);

      // まず答えを表示
      const revealButton = screen.getByText('答えを表示');
      fireEvent.click(revealButton);

      // 次へボタンをクリック
      const nextButton = screen.getByText('次へ');
      fireEvent.click(nextButton);

      expect(mockOnNext).toHaveBeenCalledTimes(1);
    });

    it('次の問題に進む際に再生が停止される', () => {
      render(<QuizPlayer question={mockQuizQuestion} onNext={mockOnNext} isLastQuestion={false} />);

      const revealButton = screen.getByText('答えを表示');
      fireEvent.click(revealButton);

      const nextButton = screen.getByText('次へ');
      fireEvent.click(nextButton);

      expect(mockUseYouTubePlayer.stopTrack).toHaveBeenCalled();
    });

    it('問題が変わると答え表示状態がリセットされる', () => {
      const { rerender } = render(<QuizPlayer question={mockQuizQuestion} onNext={mockOnNext} isLastQuestion={false} />);

      // 答えを表示
      const revealButton = screen.getByText('答えを表示');
      fireEvent.click(revealButton);

      expect(screen.getByText('テスト楽曲')).toBeInTheDocument();

      // 新しい問題に変更
      const newQuestion = {
        ...mockQuizQuestion,
        track: { ...mockQuizQuestion.track, id: 'track002', title: '新しい楽曲' },
      };

      rerender(<QuizPlayer question={newQuestion} onNext={mockOnNext} isLastQuestion={false} />);

      // 答えエリアが非表示になり、ボタンが再び有効になる
      expect(screen.queryByText('テスト楽曲')).not.toBeInTheDocument();
      expect(screen.getByText('答えを表示')).toBeInTheDocument();
    });

    it('デフォルト再生時間が未設定の場合、問題が変わっても再生時間が引き継がれる', () => {
      const { rerender } = render(<QuizPlayer question={mockQuizQuestion} onNext={mockOnNext} isLastQuestion={false} />);

      // 再生時間を3秒に変更
      const durationSelect = screen.getByLabelText('再生時間');
      fireEvent.change(durationSelect, { target: { value: '3' } });
      expect(durationSelect).toHaveValue('3');

      // 新しい問題に変更
      const newQuestion = {
        ...mockQuizQuestion,
        track: { ...mockQuizQuestion.track, id: 'track002', title: '新しい楽曲' },
      };

      rerender(<QuizPlayer question={newQuestion} onNext={mockOnNext} isLastQuestion={false} />);

      // 再生時間が引き継がれることを確認
      const updatedDurationSelect = screen.getByLabelText('再生時間');
      expect(updatedDurationSelect).toHaveValue('3');
    });

    it('デフォルト再生時間が設定されている場合、問題が変わるとその値に戻る', () => {
      const { rerender } = render(<QuizPlayer question={mockQuizQuestion} onNext={mockOnNext} isLastQuestion={false} defaultPlayDuration={2} />);

      // 再生時間を5秒に変更
      const durationSelect = screen.getByLabelText('再生時間');
      fireEvent.change(durationSelect, { target: { value: '5' } });
      expect(durationSelect).toHaveValue('5');

      // 新しい問題に変更
      const newQuestion = {
        ...mockQuizQuestion,
        track: { ...mockQuizQuestion.track, id: 'track002', title: '新しい楽曲' },
      };

      rerender(<QuizPlayer question={newQuestion} onNext={mockOnNext} isLastQuestion={false} defaultPlayDuration={2} />);

      // 再生時間がデフォルトの2秒に戻ることを確認
      const updatedDurationSelect = screen.getByLabelText('再生時間');
      expect(updatedDurationSelect).toHaveValue('2');
    });
  });

  describe('YouTube Player連携', () => {
    it('コンポーネントマウント時にYouTube Playerが初期化される', () => {
      render(<QuizPlayer question={mockQuizQuestion} onNext={mockOnNext} isLastQuestion={false} />);

      expect(mockUseYouTubePlayer.initializePlayer).toHaveBeenCalledWith('youtube-player');
    });

    it('YouTube Playerが非表示の位置に配置される', () => {
      render(<QuizPlayer question={mockQuizQuestion} onNext={mockOnNext} isLastQuestion={false} />);

      const playerContainer = document.getElementById('youtube-player');
      expect(playerContainer?.parentElement).toHaveStyle({ position: 'absolute', left: '-9999px' });
    });
  });
});
