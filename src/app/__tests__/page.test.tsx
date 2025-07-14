import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import HomePage from '../page';
import * as quizUtils from '@/utils/quiz';

// Next.js Router をモック
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

// quiz utilsをモック
jest.mock('@/utils/quiz', () => ({
  loadSongsData: jest.fn(),
}));

const mockPush = jest.fn();
const mockLoadSongsData = quizUtils.loadSongsData as jest.MockedFunction<typeof quizUtils.loadSongsData>;

// モックデータ
const mockSongsData = {
  artists: [
    {
      id: 'artist001',
      name: 'Test Artist 1',
      albums: [
        {
          id: 'album001',
          name: 'Test Album 1',
          jacketUrl: '/images/test1.png',
          tracks: [
            {
              id: 'track001',
              title: 'Test Track 1',
              youtubeUrl: 'https://www.youtube.com/watch?v=test1',
            },
          ],
        },
        {
          id: 'album002',
          name: 'Test Album 2',
          jacketUrl: '/images/test2.png',
          tracks: [
            {
              id: 'track002',
              title: 'Test Track 2',
              youtubeUrl: 'https://www.youtube.com/watch?v=test2',
            },
          ],
        },
      ],
    },
    {
      id: 'artist002',
      name: 'Test Artist 2',
      albums: [
        {
          id: 'album003',
          name: 'Test Album 3',
          jacketUrl: '/images/test3.png',
          tracks: [
            {
              id: 'track003',
              title: 'Test Track 3',
              youtubeUrl: 'https://www.youtube.com/watch?v=test3',
            },
          ],
        },
      ],
    },
  ],
};

describe('Home Page (トップ画面) - アルバム選択機能', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    mockPush.mockClear();
    mockLoadSongsData.mockResolvedValue(mockSongsData);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('初期表示', () => {
    it('アプリケーションタイトルが表示される', async () => {
      render(<HomePage />);

      await waitFor(() => {
        const title = screen.getByText('中トロドン');
        expect(title).toBeInTheDocument();
        expect(title).toHaveClass('text-6xl', 'font-bold');
      });
    });

    it('アプリケーションの説明文が表示される', async () => {
      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('曲の中トロを聴いて曲名を当てよう')).toBeInTheDocument();
      });
    });

    it('出題範囲設定エリアが表示される', async () => {
      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('出題範囲')).toBeInTheDocument();
      });
    });

    it('ローディング状態が適切に表示される', () => {
      mockLoadSongsData.mockImplementation(() => new Promise(() => {})); // 永続的なpending状態

      render(<HomePage />);

      expect(screen.getByText('データを読み込み中...')).toBeInTheDocument();
    });

    it('データ読み込み完了後、最初のアーティストがデフォルト選択される', async () => {
      render(<HomePage />);

      await waitFor(() => {
        const settingsButton = screen.getByText('出題範囲を設定');
        fireEvent.click(settingsButton);
      });

      await waitFor(() => {
        const artistSelect = screen.getByDisplayValue('Test Artist 1');
        expect(artistSelect).toBeInTheDocument();
      });
    });

    it('データ読み込み完了後、最初のアーティストの全アルバムがデフォルト選択される', async () => {
      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getAllByText('2個のアルバムが選択されています')).toHaveLength(1);
      });
    });

    it('「出題範囲を設定」ボタンが表示される', async () => {
      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('出題範囲を設定')).toBeInTheDocument();
      });
    });
  });

  describe('モーダル機能', () => {
    it('「出題範囲を設定」ボタンをクリックするとモーダルが開く', async () => {
      render(<HomePage />);

      await waitFor(() => {
        const settingsButton = screen.getByText('出題範囲を設定');
        fireEvent.click(settingsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('出題範囲設定')).toBeInTheDocument();
      });
    });

    it('モーダル内にアーティスト選択機能が表示される', async () => {
      render(<HomePage />);

      await waitFor(() => {
        const settingsButton = screen.getByText('出題範囲を設定');
        fireEvent.click(settingsButton);
      });

      await waitFor(() => {
        expect(screen.getByLabelText('アーティストを選択')).toBeInTheDocument();
      });
    });

    it('モーダル内にアルバム選択機能が表示される', async () => {
      render(<HomePage />);

      await waitFor(() => {
        const settingsButton = screen.getByText('出題範囲を設定');
        fireEvent.click(settingsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Album 1')).toBeInTheDocument();
        expect(screen.getByText('Test Album 2')).toBeInTheDocument();
      });
    });

    it('モーダル内で「設定を閉じる」ボタンをクリックするとモーダルが閉じる', async () => {
      render(<HomePage />);

      await waitFor(() => {
        const settingsButton = screen.getByText('出題範囲を設定');
        fireEvent.click(settingsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('出題範囲設定')).toBeInTheDocument();
      });

      const closeButton = screen.getByText('設定を閉じる');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('出題範囲設定')).not.toBeInTheDocument();
      });
    });

    it('モーダルのオーバーレイをクリックするとモーダルが閉じる', async () => {
      render(<HomePage />);

      await waitFor(() => {
        const settingsButton = screen.getByText('出題範囲を設定');
        fireEvent.click(settingsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('出題範囲設定')).toBeInTheDocument();
      });

      // オーバーレイ（背景）をクリック
      const overlay = screen.getByLabelText('モーダルを閉じる');
      fireEvent.click(overlay);

      await waitFor(() => {
        expect(screen.queryByText('出題範囲設定')).not.toBeInTheDocument();
      });
    });

    it('モーダル内でアルバム選択を変更できる', async () => {
      render(<HomePage />);

      await waitFor(() => {
        const settingsButton = screen.getByText('出題範囲を設定');
        fireEvent.click(settingsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('出題範囲設定')).toBeInTheDocument();
      });

      // アルバムの選択を変更
      const albumContainer = screen.getByText('Test Album 1').closest('[role="button"]');
      expect(albumContainer).toBeInTheDocument();
      fireEvent.click(albumContainer as HTMLElement);

      // モーダルを閉じる
      const closeButton = screen.getByText('設定を閉じる');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.getByText('1個のアルバムが選択されています')).toBeInTheDocument();
      });
    });

    it('モーダル内で「すべて解除」ボタンが機能する', async () => {
      render(<HomePage />);

      await waitFor(() => {
        const settingsButton = screen.getByText('出題範囲を設定');
        fireEvent.click(settingsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('出題範囲設定')).toBeInTheDocument();
      });

      const deselectAllButton = screen.getByText('すべて解除');
      fireEvent.click(deselectAllButton);

      // モーダルを閉じる
      const closeButton = screen.getByText('設定を閉じる');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.getByText('出題範囲を設定してください')).toBeInTheDocument();
      });
    });
  });

  describe('モーダル内のアーティスト選択機能', () => {
    it('モーダル内でアーティスト選択プルダウンが表示される', async () => {
      render(<HomePage />);

      await waitFor(() => {
        const settingsButton = screen.getByText('出題範囲を設定');
        fireEvent.click(settingsButton);
      });

      await waitFor(() => {
        const artistSelect = screen.getByLabelText('アーティストを選択');
        expect(artistSelect).toBeInTheDocument();
      });
    });

    it('モーダル内で全アーティストがプルダウンに表示される', async () => {
      render(<HomePage />);

      await waitFor(() => {
        const settingsButton = screen.getByText('出題範囲を設定');
        fireEvent.click(settingsButton);
      });

      await waitFor(() => {
        const artistSelect = screen.getByLabelText('アーティストを選択');
        expect(artistSelect).toBeInTheDocument();
        expect(artistSelect).toContainHTML('Test Artist 1');
        expect(artistSelect).toContainHTML('Test Artist 2');
      });
    });

    it('モーダル内でアーティスト変更時にアルバム選択がリセットされる', async () => {
      render(<HomePage />);

      await waitFor(() => {
        const settingsButton = screen.getByText('出題範囲を設定');
        fireEvent.click(settingsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('出題範囲設定')).toBeInTheDocument();
      });

      const artistSelect = screen.getByLabelText('アーティストを選択');
      fireEvent.change(artistSelect, { target: { value: 'artist002' } });

      // モーダルを閉じる
      const closeButton = screen.getByText('設定を閉じる');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.getByText('出題範囲を設定してください')).toBeInTheDocument();
      });
    });
  });

  describe('モーダル内のアルバム選択機能', () => {
    it('モーダル内で選択されたアーティストのアルバム一覧が表示される', async () => {
      render(<HomePage />);

      await waitFor(() => {
        const settingsButton = screen.getByText('出題範囲を設定');
        fireEvent.click(settingsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('Test Album 1')).toBeInTheDocument();
        expect(screen.getByText('Test Album 2')).toBeInTheDocument();
      });
    });

    it('モーダル内で各アルバムにチェックボックスが表示される', async () => {
      render(<HomePage />);

      await waitFor(() => {
        const settingsButton = screen.getByText('出題範囲を設定');
        fireEvent.click(settingsButton);
      });

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes).toHaveLength(2);
        expect(checkboxes[0]).toBeChecked(); // デフォルトで選択済み
        expect(checkboxes[1]).toBeChecked(); // デフォルトで選択済み
      });
    });

    it('モーダル内でアルバムジャケット画像が表示される', async () => {
      render(<HomePage />);

      await waitFor(() => {
        const settingsButton = screen.getByText('出題範囲を設定');
        fireEvent.click(settingsButton);
      });

      await waitFor(() => {
        const albumImage1 = screen.getByAltText('Test Album 1');
        const albumImage2 = screen.getByAltText('Test Album 2');
        expect(albumImage1).toBeInTheDocument();
        expect(albumImage2).toBeInTheDocument();
      });
    });
  });

  describe('モーダル内の一括選択機能', () => {
    it('モーダル内で「すべて選択」ボタンが表示される', async () => {
      render(<HomePage />);

      await waitFor(() => {
        const settingsButton = screen.getByText('出題範囲を設定');
        fireEvent.click(settingsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('すべて選択')).toBeInTheDocument();
      });
    });

    it('モーダル内で「すべて解除」ボタンが表示される', async () => {
      render(<HomePage />);

      await waitFor(() => {
        const settingsButton = screen.getByText('出題範囲を設定');
        fireEvent.click(settingsButton);
      });

      await waitFor(() => {
        expect(screen.getByText('すべて解除')).toBeInTheDocument();
      });
    });

    it('モーダル内で「すべて選択」をクリックすると全アルバムが選択される', async () => {
      render(<HomePage />);

      await waitFor(() => {
        const settingsButton = screen.getByText('出題範囲を設定');
        fireEvent.click(settingsButton);
      });

      // まず全て解除
      await waitFor(() => {
        const deselectAllButton = screen.getByText('すべて解除');
        fireEvent.click(deselectAllButton);
      });

      // すべて選択をクリック
      const selectAllButton = screen.getByText('すべて選択');
      fireEvent.click(selectAllButton);

      await waitFor(() => {
        const checkboxes = screen.getAllByRole('checkbox');
        expect(checkboxes[0]).toBeChecked();
        expect(checkboxes[1]).toBeChecked();
      });
    });
  });

  describe('クイズ開始機能', () => {
    it('クイズ開始ボタンが表示される', async () => {
      render(<HomePage />);

      await waitFor(() => {
        const startButton = screen.getByText('クイズ開始');
        expect(startButton).toBeInTheDocument();
        expect(startButton).toHaveClass('text-2xl', 'font-bold');
      });
    });

    it('アルバムが選択されている場合、クイズ開始ボタンが活性化される', async () => {
      render(<HomePage />);

      await waitFor(() => {
        const startButton = screen.getByText('クイズ開始');
        expect(startButton).not.toBeDisabled();
        expect(startButton).toHaveClass('bg-primary-600', 'hover:bg-primary-700', 'text-white');
      });
    });

    it('アルバムが選択されていない場合、クイズ開始ボタンが非活性化される', async () => {
      render(<HomePage />);

      // モーダルを開いてすべて解除
      await waitFor(() => {
        const settingsButton = screen.getByText('出題範囲を設定');
        fireEvent.click(settingsButton);
      });

      await waitFor(() => {
        const deselectAllButton = screen.getByText('すべて解除');
        fireEvent.click(deselectAllButton);
      });

      // モーダルを閉じる
      const closeButton = screen.getByText('設定を閉じる');
      fireEvent.click(closeButton);

      await waitFor(() => {
        const startButton = screen.getByText('クイズ開始');
        expect(startButton).toBeDisabled();
        expect(startButton).toHaveClass('bg-gray-400', 'cursor-not-allowed', 'text-gray-200');
      });
    });

    it('選択されたアルバム数が表示される', async () => {
      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('2個のアルバムが選択されています')).toBeInTheDocument();
      });
    });

    it('クイズ開始ボタンをクリックすると適切なパラメータでクイズ画面に遷移する', async () => {
      render(<HomePage />);

      await waitFor(() => {
        const startButton = screen.getByText('クイズ開始');
        fireEvent.click(startButton);
      });

      expect(mockPush).toHaveBeenCalledWith('/quiz?albums=album001%2Calbum002');
    });

    it('すべてのアルバムが選択されている場合、クエリパラメータなしでクイズ画面に遷移する', async () => {
      // 単一アーティストのみのデータに変更
      const singleArtistMockData = {
        artists: [
          {
            id: 'artist001',
            name: 'Test Artist 1',
            albums: [
              {
                id: 'album001',
                name: 'Test Album 1',
                jacketUrl: '/images/test1.png',
                tracks: [
                  {
                    id: 'track001',
                    title: 'Test Track 1',
                    youtubeUrl: 'https://www.youtube.com/watch?v=test1',
                  },
                ],
              },
              {
                id: 'album002',
                name: 'Test Album 2',
                jacketUrl: '/images/test2.png',
                tracks: [
                  {
                    id: 'track002',
                    title: 'Test Track 2',
                    youtubeUrl: 'https://www.youtube.com/watch?v=test2',
                  },
                ],
              },
            ],
          },
        ],
      };

      mockLoadSongsData.mockResolvedValue(singleArtistMockData);

      render(<HomePage />);

      // アーティスト1の全アルバム（2個）がデフォルトで選択されている状態を確認
      await waitFor(() => {
        expect(screen.getByText('2個のアルバムが選択されています')).toBeInTheDocument();
      });

      // クイズ開始ボタンをクリック
      await waitFor(() => {
        const startButton = screen.getByText('クイズ開始');
        expect(startButton).toBeEnabled();
        fireEvent.click(startButton);
      });

      // すべてのアルバムが選択されているので、クエリパラメータなしで遷移
      expect(mockPush).toHaveBeenCalledWith('/quiz');
    });

    it('アルバム未選択時にクイズ開始ボタンが無効になる', async () => {
      render(<HomePage />);

      // モーダルを開いてすべて解除
      await waitFor(() => {
        const settingsButton = screen.getByText('出題範囲を設定');
        fireEvent.click(settingsButton);
      });

      await waitFor(() => {
        const deselectAllButton = screen.getByText('すべて解除');
        fireEvent.click(deselectAllButton);
      });

      // モーダルを閉じる
      const closeButton = screen.getByText('設定を閉じる');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.queryByText('2個のアルバムが選択されています')).not.toBeInTheDocument();
      });

      // クイズ開始ボタンが無効になっていることを確認
      const startButton = screen.getByText('クイズ開始');
      expect(startButton).toBeDisabled();

      // 無効なボタンには適切なスタイルが適用されていることを確認
      expect(startButton).toHaveClass('bg-gray-400', 'cursor-not-allowed', 'text-gray-200');
    });
  });

  describe('エラーハンドリング', () => {
    it('データ読み込み失敗時にエラーメッセージが表示される', async () => {
      mockLoadSongsData.mockRejectedValue(new Error('Network error'));

      render(<HomePage />);

      await waitFor(() => {
        expect(screen.getByText('データの読み込みに失敗しました')).toBeInTheDocument();
        expect(screen.getByText('再読み込み')).toBeInTheDocument();
      });
    });

    it('エラー時の再読み込みボタンが機能する', async () => {
      const mockReload = jest.fn();
      const originalLocation = window.location;

      Object.defineProperty(window, 'location', {
        value: { ...originalLocation, reload: mockReload },
        writable: true,
      });

      mockLoadSongsData.mockRejectedValue(new Error('Network error'));

      render(<HomePage />);

      await waitFor(() => {
        const reloadButton = screen.getByText('再読み込み');
        fireEvent.click(reloadButton);
      });

      expect(mockReload).toHaveBeenCalled();

      // restore
      Object.defineProperty(window, 'location', {
        value: originalLocation,
        writable: true,
      });
    });
  });

  describe('レスポンシブデザインとアクセシビリティ', () => {
    it('画面全体が適切なレスポンシブレイアウトになっている', async () => {
      render(<HomePage />);

      await waitFor(() => {
        const mainContainer = screen.getByText('中トロドン').closest('div')?.parentElement?.parentElement;
        expect(mainContainer).toHaveClass('min-h-screen', 'py-8', 'px-4');
      });
    });

    it('キーボードナビゲーションが可能である', async () => {
      render(<HomePage />);

      await waitFor(() => {
        const settingsButton = screen.getByText('出題範囲を設定');
        fireEvent.click(settingsButton);
      });

      await waitFor(() => {
        const albumContainers = screen.getAllByRole('button');
        const albumContainer = albumContainers.find((container) => container.textContent?.includes('Test Album 1'));
        expect(albumContainer).toHaveAttribute('tabIndex', '0');
      });
    });

    it('モーダル内でEnterキーでアルバム選択ができる', async () => {
      render(<HomePage />);

      await waitFor(() => {
        const settingsButton = screen.getByText('出題範囲を設定');
        fireEvent.click(settingsButton);
      });

      await waitFor(() => {
        const albumContainers = screen.getAllByRole('button');
        const albumContainer = albumContainers.find((container) => container.textContent?.includes('Test Album 1'));
        expect(albumContainer).toBeInTheDocument();

        fireEvent.keyDown(albumContainer as HTMLElement, { key: 'Enter' });
      });

      // モーダルを閉じる
      const closeButton = screen.getByText('設定を閉じる');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.getByText('1個のアルバムが選択されています')).toBeInTheDocument();
      });
    });

    it('モーダル内でスペースキーでアルバム選択ができる', async () => {
      render(<HomePage />);

      await waitFor(() => {
        const settingsButton = screen.getByText('出題範囲を設定');
        fireEvent.click(settingsButton);
      });

      await waitFor(() => {
        const albumContainers = screen.getAllByRole('button');
        const albumContainer = albumContainers.find((container) => container.textContent?.includes('Test Album 1'));
        expect(albumContainer).toBeInTheDocument();

        fireEvent.keyDown(albumContainer as HTMLElement, { key: ' ' });
      });

      // モーダルを閉じる
      const closeButton = screen.getByText('設定を閉じる');
      fireEvent.click(closeButton);

      await waitFor(() => {
        expect(screen.getByText('1個のアルバムが選択されています')).toBeInTheDocument();
      });
    });
  });
});
