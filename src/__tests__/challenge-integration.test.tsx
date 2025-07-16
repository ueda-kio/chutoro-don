import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter, useSearchParams } from 'next/navigation';
import HomePage from '@/app/page';
import { ChallengeResultPageContent } from '@/app/challenge/result/ChallengeResultPageContent';
import * as quizUtils from '@/utils/quiz';
import * as challengeUtils from '@/utils/challenge';
import type { SongsData, QuizQuestion } from '@/types';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
  useSearchParams: jest.fn(),
}));

jest.mock('@/utils/quiz');

jest.mock('@/utils/challenge', () => ({
  ...jest.requireActual('@/utils/challenge'),
  getHighPrecisionTime: jest.fn(),
  calculateElapsedTime: jest.fn(),
}));

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

    mockLoadSongsData.mockResolvedValue(mockSongsData);
    mockGenerateQuizQuestionsFromAllSongs.mockReturnValue(mockQuestions);
    mockGetHighPrecisionTime.mockReturnValue(1000);
    mockCalculateElapsedTime.mockReturnValue(30);
  });

  describe('モード選択機能', () => {
    it('チャレンジモードを選択してクイズを開始できる', async () => {
      render(<HomePage />);

      await waitFor(() => {
        const challengeMode = screen.getByText('タイムアタック');
        fireEvent.click(challengeMode);

        const startButton = screen.getByText('タイムアタック開始');
        fireEvent.click(startButton);

        expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/challenge'));
      });
    });
  });

  describe('スコア表示機能', () => {
    it('最終スコアが正しく表示される', async () => {
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
  });
});