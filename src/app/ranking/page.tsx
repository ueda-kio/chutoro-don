import type { Metadata } from 'next';
import RankingPageContent from './RankingPageContent';

export const metadata: Metadata = {
  title: 'ランキング | 中トロドン',
  description: 'チャレンジモードのランキングを表示します。',
};

export default function RankingPage() {
  return <RankingPageContent />;
}