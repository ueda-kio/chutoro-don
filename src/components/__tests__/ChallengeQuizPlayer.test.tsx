import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ChallengeQuizPlayer } from '../ChallengeQuizPlayer';
import type { QuizQuestion } from '@/types';

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

describe('ChallengeQuizPlayer', () => {
  const mockOnAnswerSubmit = jest.fn();
  const mockOnRevealAnswer = jest.fn();
  const mockOnNext = jest.fn();

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders quiz player with controls', () => {
    render(
      <ChallengeQuizPlayer
        question={mockQuestion}
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
        songsData={null}
      />
    );

    expect(screen.getByText('回答する')).toBeInTheDocument();
    expect(screen.getByText('答えを表示 (-1000pt)')).toBeInTheDocument();
    expect(screen.getByRole('button', { name: '再生' })).toBeInTheDocument();
  });

  it('calls onAnswerSubmit when submitting answer', async () => {
    render(
      <ChallengeQuizPlayer
        question={mockQuestion}
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
        songsData={null}
      />
    );

    const input = screen.getByLabelText('楽曲名を入力してください');
    const submitButton = screen.getByText('回答する');

    fireEvent.change(input, { target: { value: 'Test Song' } });
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(mockOnAnswerSubmit).toHaveBeenCalledWith('Test Song', expect.any(Number));
    });
  });

  it('calls onRevealAnswer when revealing answer', async () => {
    render(
      <ChallengeQuizPlayer
        question={mockQuestion}
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
        songsData={null}
      />
    );

    const revealButton = screen.getByText('答えを表示 (-1000pt)');
    fireEvent.click(revealButton);

    await waitFor(() => {
      expect(mockOnRevealAnswer).toHaveBeenCalledWith(expect.any(Number));
    });
  });
});