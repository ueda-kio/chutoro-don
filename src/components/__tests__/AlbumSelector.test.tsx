import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { AlbumSelector } from '../AlbumSelector';
import type { Artist } from '@/types';

const mockArtists: Artist[] = [
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
          {
            id: 'track003',
            title: 'Test Track 3',
            youtubeUrl: 'https://www.youtube.com/watch?v=test3',
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
            id: 'track004',
            title: 'Test Track 4',
            youtubeUrl: 'https://www.youtube.com/watch?v=test4',
          },
        ],
      },
    ],
  },
];

describe('AlbumSelector コンポーネント', () => {
  const defaultProps = {
    artists: mockArtists,
    selectedArtistId: 'artist001',
    selectedAlbumIds: ['album001'],
    onArtistChange: jest.fn(),
    onAlbumToggle: jest.fn(),
    onSelectAll: jest.fn(),
    onDeselectAll: jest.fn(),
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('アーティスト選択機能', () => {
    it('アーティスト選択プルダウンが表示される', () => {
      render(<AlbumSelector {...defaultProps} />);

      const artistSelect = screen.getByLabelText('アーティストを選択');
      expect(artistSelect).toBeInTheDocument();
    });

    it('全アーティストがプルダウンに表示される', () => {
      render(<AlbumSelector {...defaultProps} />);

      expect(screen.getByText('Test Artist 1')).toBeInTheDocument();
      expect(screen.getByText('Test Artist 2')).toBeInTheDocument();
    });

    it('選択されたアーティストが正しく表示される', () => {
      render(<AlbumSelector {...defaultProps} />);

      const artistSelect = screen.getByDisplayValue('Test Artist 1');
      expect(artistSelect).toBeInTheDocument();
    });

    it('アーティスト変更時にonArtistChangeが呼ばれる', () => {
      render(<AlbumSelector {...defaultProps} />);

      const artistSelect = screen.getByLabelText('アーティストを選択');
      fireEvent.change(artistSelect, { target: { value: 'artist002' } });

      expect(defaultProps.onArtistChange).toHaveBeenCalledWith('artist002');
    });

    it('プレースホルダーテキストが表示される', () => {
      render(<AlbumSelector {...defaultProps} selectedArtistId="" />);

      expect(screen.getByText('アーティストを選択してください')).toBeInTheDocument();
    });
  });

  describe('アルバム表示機能', () => {
    it('選択されたアーティストのアルバム一覧が表示される', () => {
      render(<AlbumSelector {...defaultProps} />);

      expect(screen.getByText('Test Album 1')).toBeInTheDocument();
      expect(screen.getByText('Test Album 2')).toBeInTheDocument();
      expect(screen.queryByText('Test Album 3')).not.toBeInTheDocument();
    });

    it('アーティストが選択されていない場合、アルバムが表示されない', () => {
      render(<AlbumSelector {...defaultProps} selectedArtistId="" />);

      expect(screen.queryByText('Test Album 1')).not.toBeInTheDocument();
      expect(screen.queryByText('Test Album 2')).not.toBeInTheDocument();
    });

    it('アルバムジャケット画像が表示される', () => {
      render(<AlbumSelector {...defaultProps} />);

      const albumImage1 = screen.getByAltText('Test Album 1');
      const albumImage2 = screen.getByAltText('Test Album 2');
      expect(albumImage1).toBeInTheDocument();
      expect(albumImage2).toBeInTheDocument();
      // Next.js Image コンポーネントは画像を最適化するため、src属性の値は変更される
      expect(albumImage1.getAttribute('src')).toContain('test1.png');
      expect(albumImage2.getAttribute('src')).toContain('test2.png');
    });

    it('アルバムごとの楽曲数が表示される', () => {
      render(<AlbumSelector {...defaultProps} />);

      expect(screen.getByText('1曲')).toBeInTheDocument(); // Test Album 1
      expect(screen.getByText('2曲')).toBeInTheDocument(); // Test Album 2
    });

    it('選択されたアーティスト名がヘッダーに表示される', () => {
      render(<AlbumSelector {...defaultProps} />);

      expect(screen.getByText('アルバムを選択 (Test Artist 1)')).toBeInTheDocument();
    });
  });

  describe('アルバム選択機能', () => {
    it('各アルバムにチェックボックスが表示される', () => {
      render(<AlbumSelector {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes).toHaveLength(2);
    });

    it('選択されたアルバムのチェックボックスがチェック状態になる', () => {
      render(<AlbumSelector {...defaultProps} selectedAlbumIds={['album001', 'album002']} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).toBeChecked();
    });

    it('選択されていないアルバムのチェックボックスが未チェック状態になる', () => {
      render(<AlbumSelector {...defaultProps} selectedAlbumIds={['album001']} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
    });

    it('選択されたアルバムが視覚的にハイライトされる', () => {
      render(<AlbumSelector {...defaultProps} selectedAlbumIds={['album001']} />);

      const albumContainers = screen.getAllByRole('button');
      const selectedContainer = albumContainers.find((container) => container.textContent?.includes('Test Album 1'));
      const unselectedContainer = albumContainers.find((container) => container.textContent?.includes('Test Album 2'));

      expect(selectedContainer).toHaveClass('border-primary-500', 'bg-primary-50');
      expect(unselectedContainer).toHaveClass('border-gray-200');
    });

    it('チェックボックスをクリックするとonAlbumToggleが呼ばれる', () => {
      render(<AlbumSelector {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      fireEvent.click(checkboxes[0]);

      expect(defaultProps.onAlbumToggle).toHaveBeenCalledWith('album001');
    });

    it('アルバムコンテナをクリックするとonAlbumToggleが呼ばれる', () => {
      render(<AlbumSelector {...defaultProps} />);

      const albumContainer = screen.getByText('Test Album 1').closest('[role="button"]');
      expect(albumContainer).toBeInTheDocument();
      fireEvent.click(albumContainer as HTMLElement);

      expect(defaultProps.onAlbumToggle).toHaveBeenCalledWith('album001');
    });
  });

  describe('キーボードナビゲーション', () => {
    it('アルバムコンテナがタブ操作可能である', () => {
      render(<AlbumSelector {...defaultProps} />);

      // アルバムコンテナ（role="button"があるもの）を取得
      const albumContainers = screen.getAllByRole('button').filter((btn) => btn.querySelector('img') !== null);
      for (const container of albumContainers) {
        expect(container).toHaveAttribute('tabIndex', '0');
      }
    });

    it('Enterキーでアルバムを選択できる', () => {
      render(<AlbumSelector {...defaultProps} />);

      const albumContainer = screen.getByText('Test Album 1').closest('[role="button"]');
      expect(albumContainer).toBeInTheDocument();
      fireEvent.keyDown(albumContainer as HTMLElement, { key: 'Enter' });

      expect(defaultProps.onAlbumToggle).toHaveBeenCalledWith('album001');
    });

    it('スペースキーでアルバムを選択できる', () => {
      render(<AlbumSelector {...defaultProps} />);

      const albumContainer = screen.getByText('Test Album 1').closest('[role="button"]');
      expect(albumContainer).toBeInTheDocument();
      fireEvent.keyDown(albumContainer as HTMLElement, { key: ' ' });

      expect(defaultProps.onAlbumToggle).toHaveBeenCalledWith('album001');
    });

    it('他のキーでは反応しない', () => {
      render(<AlbumSelector {...defaultProps} />);

      const albumContainer = screen.getByText('Test Album 1').closest('[role="button"]');
      expect(albumContainer).toBeInTheDocument();
      fireEvent.keyDown(albumContainer as HTMLElement, { key: 'a' });

      expect(defaultProps.onAlbumToggle).not.toHaveBeenCalled();
    });
  });

  describe('一括選択機能', () => {
    it('「すべて選択」ボタンが表示される', () => {
      render(<AlbumSelector {...defaultProps} />);

      expect(screen.getByText('すべて選択')).toBeInTheDocument();
    });

    it('「すべて解除」ボタンが表示される', () => {
      render(<AlbumSelector {...defaultProps} />);

      expect(screen.getByText('すべて解除')).toBeInTheDocument();
    });

    it('「すべて選択」をクリックするとonSelectAllが呼ばれる', () => {
      render(<AlbumSelector {...defaultProps} />);

      const selectAllButton = screen.getByText('すべて選択');
      fireEvent.click(selectAllButton);

      expect(defaultProps.onSelectAll).toHaveBeenCalled();
    });

    it('「すべて解除」をクリックするとonDeselectAllが呼ばれる', () => {
      render(<AlbumSelector {...defaultProps} />);

      const deselectAllButton = screen.getByText('すべて解除');
      fireEvent.click(deselectAllButton);

      expect(defaultProps.onDeselectAll).toHaveBeenCalled();
    });

    it('一括選択ボタンが適切なスタイルで表示される', () => {
      render(<AlbumSelector {...defaultProps} />);

      const selectAllButton = screen.getByText('すべて選択');
      const deselectAllButton = screen.getByText('すべて解除');

      expect(selectAllButton).toHaveClass('px-3', 'py-1', 'text-sm', 'bg-gray-100');
      expect(deselectAllButton).toHaveClass('px-3', 'py-1', 'text-sm', 'bg-gray-100');
    });
  });

  describe('レスポンシブレイアウト', () => {
    it('アルバムグリッドが適切なレスポンシブクラスを持つ', () => {
      render(<AlbumSelector {...defaultProps} />);

      const albumGrid = screen.getByText('Test Album 1').closest('.grid');
      expect(albumGrid).toHaveClass('grid-cols-2', 'md:grid-cols-3', 'lg:grid-cols-4', 'gap-4');
    });

    it('アルバム画像がアスペクト比を保持する', () => {
      render(<AlbumSelector {...defaultProps} />);

      const imageContainer = screen.getByAltText('Test Album 1').closest('.aspect-square');
      expect(imageContainer).toBeInTheDocument();
    });
  });

  describe('アクセシビリティ', () => {
    it('アルバム名が適切にtruncateされる', () => {
      render(<AlbumSelector {...defaultProps} />);

      const albumNames = screen.getAllByText(/Test Album/);
      for (const name of albumNames) {
        expect(name).toHaveClass('line-clamp-2');
      }
    });

    it('チェックボックスが適切なフォーカススタイルを持つ', () => {
      render(<AlbumSelector {...defaultProps} />);

      const checkboxes = screen.getAllByRole('checkbox');
      for (const checkbox of checkboxes) {
        expect(checkbox).toHaveClass('focus:ring-primary-500');
      }
    });

    it('プルダウンが適切なフォーカススタイルを持つ', () => {
      render(<AlbumSelector {...defaultProps} />);

      const artistSelect = screen.getByLabelText('アーティストを選択');
      expect(artistSelect).toHaveClass('focus:ring-primary-500', 'focus:border-primary-500');
    });
  });

  describe('エッジケース', () => {
    it('アーティストが存在しない場合でもエラーが発生しない', () => {
      render(<AlbumSelector {...defaultProps} artists={[]} />);

      expect(screen.getByLabelText('アーティストを選択')).toBeInTheDocument();
      expect(screen.getByText('アーティストを選択してください')).toBeInTheDocument();
    });

    it('選択されたアーティストが存在しない場合でもエラーが発生しない', () => {
      render(<AlbumSelector {...defaultProps} selectedArtistId="nonexistent" />);

      expect(screen.getByLabelText('アーティストを選択')).toBeInTheDocument();
      expect(screen.queryByText('アルバムを選択')).not.toBeInTheDocument();
    });

    it('アルバムが存在しないアーティストでもエラーが発生しない', () => {
      const artistsWithNoAlbums: Artist[] = [
        {
          id: 'artist003',
          name: 'Artist With No Albums',
          albums: [],
        },
      ];

      render(<AlbumSelector {...defaultProps} artists={artistsWithNoAlbums} selectedArtistId="artist003" />);

      expect(screen.getByText('アルバムを選択 (Artist With No Albums)')).toBeInTheDocument();
    });

    it('空の選択アルバムIDリストでもエラーが発生しない', () => {
      render(<AlbumSelector {...defaultProps} selectedAlbumIds={[]} />);

      const checkboxes = screen.getAllByRole('checkbox');
      for (const checkbox of checkboxes) {
        expect(checkbox).not.toBeChecked();
      }
    });

    it('存在しないアルバムIDが含まれていてもエラーが発生しない', () => {
      render(<AlbumSelector {...defaultProps} selectedAlbumIds={['album001', 'nonexistent']} />);

      const checkboxes = screen.getAllByRole('checkbox');
      expect(checkboxes[0]).toBeChecked();
      expect(checkboxes[1]).not.toBeChecked();
    });
  });
});
