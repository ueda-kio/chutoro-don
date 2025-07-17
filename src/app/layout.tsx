import '@/app/globals.css';
import type { Metadata } from 'next';
import { MSWProvider } from '@/components/MSWProvider';

export const metadata: Metadata = {
  title: '中トロドン - 楽曲クイズアプリ',
  description: '楽曲の中盤を聴いて曲名を当てる音楽クイズアプリ',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ja">
      <body className="bg-gray-50">
        <MSWProvider>{children}</MSWProvider>
      </body>
    </html>
  );
}
