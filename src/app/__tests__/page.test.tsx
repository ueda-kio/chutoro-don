import '@testing-library/jest-dom';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { useRouter } from 'next/navigation';
import HomePage from '../page';

// Next.js Router をモック
jest.mock('next/navigation', () => ({
  useRouter: jest.fn(),
}));

const mockPush = jest.fn();

describe('Home Page (トップ画面)', () => {
  beforeEach(() => {
    (useRouter as jest.Mock).mockReturnValue({
      push: mockPush,
    });
    mockPush.mockClear();
  });

  describe('UIコンポーネント表示', () => {
    it('アプリケーションロゴ（タイトル）が表示される', () => {
      render(<HomePage />);

      const title = screen.getByText('中トロドン');
      expect(title).toBeInTheDocument();
      expect(title).toHaveClass('text-6xl', 'font-bold');
    });

    it('アプリケーションの説明文が表示される', () => {
      render(<HomePage />);

      expect(screen.getByText('楽曲の中盤を聴いて曲名を当てるクイズアプリ')).toBeInTheDocument();
      expect(screen.getByText('すべての楽曲からランダムに出題されます')).toBeInTheDocument();
    });

    it('スタートボタンが表示される', () => {
      render(<HomePage />);

      const startButton = screen.getByRole('button', { name: 'スタート' });
      expect(startButton).toBeInTheDocument();
      expect(startButton).toHaveClass('text-2xl', 'font-bold');
    });
  });

  describe('ユーザーインタラクション', () => {
    it('スタートボタンをクリックするとクイズ画面に遷移する', () => {
      render(<HomePage />);

      const startButton = screen.getByRole('button', { name: 'スタート' });
      fireEvent.click(startButton);

      expect(mockPush).toHaveBeenCalledWith('/quiz');
    });

    it('スタートボタンにhover効果がある', () => {
      render(<HomePage />);

      const startButton = screen.getByRole('button', { name: 'スタート' });
      expect(startButton).toHaveClass('hover:scale-105');
    });
  });

  describe('レスポンシブデザイン', () => {
    it('画面中央にコンテンツが配置される', () => {
      render(<HomePage />);

      const outerContainer = screen.getByText('中トロドン').closest('div')?.parentElement?.parentElement;
      expect(outerContainer).toHaveClass('min-h-screen', 'flex', 'items-center', 'justify-center');
    });

    it('テキストが中央揃えになっている', () => {
      render(<HomePage />);

      const textContainer = screen.getByText('中トロドン').closest('div')?.parentElement;
      expect(textContainer).toHaveClass('text-center');
    });
  });
});
