import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import HomePage from '../page';
import * as quizUtils from '@/utils/quiz';

jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

jest.mock('@/utils/quiz', () => ({
  loadSongsData: jest.fn(),
}));

const mockPush = jest.fn();
const mockLoadSongsData = quizUtils.loadSongsData as jest.MockedFunction<typeof quizUtils.loadSongsData>;

const mockSongsData = {
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
          ],
        },
      ],
    },
  ],
};

describe('HomePage', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    mockPush.mockClear();
    mockLoadSongsData.mockClear();
    mockLoadSongsData.mockResolvedValue(mockSongsData);
  });

  it('renders title and start button', async () => {
    render(<HomePage />);

    await waitFor(() => {
      expect(screen.getByText('中トロドン')).toBeInTheDocument();
      expect(screen.getByText('のんびりモード')).toBeInTheDocument();
      expect(screen.getByText('タイムアタック')).toBeInTheDocument();
    });
  });

  it('navigates to quiz page when starting freeplay mode', async () => {
    render(<HomePage />);

    await waitFor(() => {
      const freeModeButton = screen.getByText('のんびりモード');
      fireEvent.click(freeModeButton);
    });

    await waitFor(() => {
      const startButton = screen.getByText('クイズ開始');
      fireEvent.click(startButton);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/quiz'));
    });
  });

  it('navigates to challenge page when starting challenge mode', async () => {
    render(<HomePage />);

    await waitFor(() => {
      const challengeButton = screen.getByText('タイムアタック');
      fireEvent.click(challengeButton);
    });

    await waitFor(() => {
      const startButton = screen.getByText('タイムアタック開始');
      fireEvent.click(startButton);
    });

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith(expect.stringContaining('/challenge'));
    });
  });
});