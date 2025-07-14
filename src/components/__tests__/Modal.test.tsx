import '@testing-library/jest-dom';
import { render, screen, fireEvent } from '@testing-library/react';
import { AlbumSelectorModal } from '../Modal';
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
    ],
  },
];

describe('AlbumSelectorModal コンポーネント', () => {
  const defaultProps = {
    isOpen: true,
    onClose: jest.fn(),
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

  describe('モーダル表示機能', () => {
    it('isOpen=trueの場合、モーダルが表示される', () => {
      render(<AlbumSelectorModal {...defaultProps} />);

      expect(screen.getByText('出題範囲設定')).toBeInTheDocument();
    });

    it('isOpen=falseの場合、モーダルが表示されない', () => {
      render(<AlbumSelectorModal {...defaultProps} isOpen={false} />);

      expect(screen.queryByText('出題範囲設定')).not.toBeInTheDocument();
    });

    it('モーダルタイトルが正しく表示される', () => {
      render(<AlbumSelectorModal {...defaultProps} />);

      const title = screen.getByText('出題範囲設定');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('text-xl', 'font-semibold');
    });

    it('閉じるボタン（×）が表示される', () => {
      render(<AlbumSelectorModal {...defaultProps} />);

      // SVGを含むボタンを探す
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find((btn) => btn.querySelector('svg'));
      expect(closeButton).toBeInTheDocument();

      const svg = closeButton?.querySelector('svg');
      expect(svg).toBeInTheDocument();
    });

    it('「設定を閉じる」ボタンが表示される', () => {
      render(<AlbumSelectorModal {...defaultProps} />);

      const closeButton = screen.getByText('設定を閉じる');
      expect(closeButton).toBeInTheDocument();
      expect(closeButton).toHaveClass('px-6', 'py-2', 'bg-primary-600');
    });
  });

  describe('モーダル操作機能', () => {
    it('×ボタンをクリックするとonCloseが呼ばれる', () => {
      render(<AlbumSelectorModal {...defaultProps} />);

      const closeButtons = screen.getAllByRole('button');
      const xButton = closeButtons.find((button) => button.querySelector('svg'));
      expect(xButton).toBeDefined();

      fireEvent.click(xButton as HTMLElement);
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('「設定を閉じる」ボタンをクリックするとonCloseが呼ばれる', () => {
      render(<AlbumSelectorModal {...defaultProps} />);

      const closeButton = screen.getByText('設定を閉じる');
      fireEvent.click(closeButton);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('背景をクリックするとonCloseが呼ばれる', () => {
      render(<AlbumSelectorModal {...defaultProps} />);

      const backdrop = screen.getByRole('button', { name: 'モーダルを閉じる' });
      fireEvent.click(backdrop);

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('Escapeキーを押すとonCloseが呼ばれる', () => {
      render(<AlbumSelectorModal {...defaultProps} />);

      const backdrop = screen.getByRole('button', { name: 'モーダルを閉じる' });
      fireEvent.keyDown(backdrop, { key: 'Escape' });

      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('他のキーではonCloseが呼ばれない', () => {
      render(<AlbumSelectorModal {...defaultProps} />);

      const backdrop = screen.getByRole('button', { name: 'モーダルを閉じる' });
      fireEvent.keyDown(backdrop, { key: 'Enter' });

      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('アルバムセレクター機能', () => {
    it('AlbumSelectorコンポーネントが正しいpropsで表示される', () => {
      render(<AlbumSelectorModal {...defaultProps} />);

      // AlbumSelectorの存在確認
      expect(screen.getByLabelText('アーティストを選択')).toBeInTheDocument();
      expect(screen.getByText('すべて選択')).toBeInTheDocument();
      expect(screen.getByText('すべて解除')).toBeInTheDocument();
    });

    it('アーティスト変更時にonArtistChangeが呼ばれる', () => {
      render(<AlbumSelectorModal {...defaultProps} />);

      const artistSelect = screen.getByLabelText('アーティストを選択');
      fireEvent.change(artistSelect, { target: { value: 'artist001' } });

      expect(defaultProps.onArtistChange).toHaveBeenCalledWith('artist001');
    });

    it('アルバム選択時にonAlbumToggleが呼ばれる', () => {
      render(<AlbumSelectorModal {...defaultProps} />);

      const albumContainer = screen.getByText('Test Album 1').closest('[role="button"]');
      expect(albumContainer).toBeInTheDocument();
      fireEvent.click(albumContainer as HTMLElement);

      expect(defaultProps.onAlbumToggle).toHaveBeenCalledWith('album001');
    });

    it('「すべて選択」をクリックするとonSelectAllが呼ばれる', () => {
      render(<AlbumSelectorModal {...defaultProps} />);

      const selectAllButton = screen.getByText('すべて選択');
      fireEvent.click(selectAllButton);

      expect(defaultProps.onSelectAll).toHaveBeenCalled();
    });

    it('「すべて解除」をクリックするとonDeselectAllが呼ばれる', () => {
      render(<AlbumSelectorModal {...defaultProps} />);

      const deselectAllButton = screen.getByText('すべて解除');
      fireEvent.click(deselectAllButton);

      expect(defaultProps.onDeselectAll).toHaveBeenCalled();
    });
  });

  describe('レイアウトとスタイル', () => {
    it('モーダルが画面中央に表示される', () => {
      render(<AlbumSelectorModal {...defaultProps} />);

      const modalContainer = screen.getByText('出題範囲設定').closest('.fixed');
      expect(modalContainer).toHaveClass('inset-0', 'flex', 'items-center', 'justify-center');
    });

    it('背景オーバーレイが正しく設定される', () => {
      render(<AlbumSelectorModal {...defaultProps} />);

      const backdrop = screen.getByRole('button', { name: 'モーダルを閉じる' });
      expect(backdrop).toHaveClass('fixed', 'inset-0', 'bg-black', 'bg-opacity-50');
    });

    it('モーダルコンテンツが適切なサイズとスタイルで表示される', () => {
      render(<AlbumSelectorModal {...defaultProps} />);

      const modalContent = screen.getByText('出題範囲設定').closest('.bg-white');
      expect(modalContent).toHaveClass('bg-white', 'rounded-lg', 'shadow-xl', 'max-w-4xl', 'max-h-[90vh]');
    });

    it('ヘッダー部分が適切に配置される', () => {
      render(<AlbumSelectorModal {...defaultProps} />);

      const header = screen.getByText('出題範囲設定').closest('.flex');
      expect(header).toHaveClass('flex', 'items-center', 'justify-between', 'p-6', 'border-b');
    });

    it('コンテンツ部分がスクロール可能に設定される', () => {
      render(<AlbumSelectorModal {...defaultProps} />);

      const content = screen.getByLabelText('アーティストを選択').closest('.p-6');
      expect(content).toHaveClass('overflow-y-auto');
    });
  });

  describe('アクセシビリティ', () => {
    it('モーダルに適切なz-indexが設定される', () => {
      render(<AlbumSelectorModal {...defaultProps} />);

      const modalContainer = screen.getByText('出題範囲設定').closest('.fixed');
      expect(modalContainer).toHaveClass('z-50');
    });

    it('背景要素がキーボード操作可能である', () => {
      render(<AlbumSelectorModal {...defaultProps} />);

      const backdrop = screen.getByRole('button', { name: 'モーダルを閉じる' });
      expect(backdrop).toHaveAttribute('tabIndex', '0');
    });

    it('閉じるボタンが適切にaria-labelを持つ', () => {
      render(<AlbumSelectorModal {...defaultProps} />);

      const backdrop = screen.getByRole('button', { name: 'モーダルを閉じる' });
      expect(backdrop).toHaveAttribute('aria-label', 'モーダルを閉じる');
    });
  });

  describe('body要素のスクロール制御', () => {
    it('モーダルが開いた時にbodyのスクロールが無効になる', () => {
      const { rerender } = render(<AlbumSelectorModal {...defaultProps} isOpen={false} />);

      // 初期状態ではbodyのスクロールは通常（unsetの場合もある）
      expect(document.body.style.overflow).toMatch(/^(|unset)$/);

      // モーダルを開く
      rerender(<AlbumSelectorModal {...defaultProps} isOpen={true} />);

      // bodyのスクロールが無効になる
      expect(document.body.style.overflow).toBe('hidden');
    });

    it('モーダルが閉じた時にbodyのスクロールが復元される', () => {
      const { rerender } = render(<AlbumSelectorModal {...defaultProps} isOpen={true} />);

      // モーダル表示中はbodyのスクロールが無効
      expect(document.body.style.overflow).toBe('hidden');

      // モーダルを閉じる
      rerender(<AlbumSelectorModal {...defaultProps} isOpen={false} />);

      // bodyのスクロールが復元される
      expect(document.body.style.overflow).toBe('unset');
    });

    it('コンポーネントアンマウント時にbodyのスクロールが復元される', () => {
      const { unmount } = render(<AlbumSelectorModal {...defaultProps} isOpen={true} />);

      // モーダル表示中はbodyのスクロールが無効
      expect(document.body.style.overflow).toBe('hidden');

      // コンポーネントをアンマウント
      unmount();

      // bodyのスクロールが復元される
      expect(document.body.style.overflow).toBe('unset');
    });
  });
});
