'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { RankingEntry, RankingApiResponse } from '@/types/ranking';
import { RankingDetailModal } from '@/components/RankingDetailModal';

const RankingPageContent = () => {
  const router = useRouter();
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedEntry, setSelectedEntry] = useState<RankingEntry | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    const fetchRankings = async () => {
      try {
        // 開発環境ではMSW、本番環境では実際のAPIが呼ばれる
        const response = await fetch('/api/rankings?limit=100');
        const data: RankingApiResponse = await response.json();

        if (data.success && data.data) {
          setRankings(data.data);
        } else {
          setError(data.error || 'ランキングの取得に失敗しました');
        }
      } catch {
        setError('ネットワークエラーが発生しました');
      } finally {
        setLoading(false);
      }
    };

    fetchRankings();
  }, []);

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'SS':
        return 'text-pink-400 font-bold';
      case 'S':
        return 'text-yellow-400 font-bold';
      case 'A':
        return 'text-red-400 font-bold';
      case 'B':
        return 'text-blue-400 font-semibold';
      case 'C':
        return 'text-green-400 font-medium';
      case 'D':
        return 'text-orange-400';
      case 'F':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('ja-JP', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleBack = () => {
    router.back();
  };

  const handleEntryClick = (entry: RankingEntry) => {
    console.log('🏆 クリックされたエントリ:', {
      username: entry.username,
      hasDetails: !!entry.details,
      detailsCount: entry.details?.length || 0,
      details: entry.details,
    });
    setSelectedEntry(entry);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedEntry(null);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-center mb-8">ランキング</h1>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
                <p>ランキングを読み込み中...</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
        <div className="container mx-auto px-4 py-8">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-4xl font-bold text-center mb-8">ランキング</h1>
            <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-8">
              <div className="text-center">
                <p className="text-red-300 mb-4">{error}</p>
                <button
                  type="button"
                  onClick={handleBack}
                  className="inline-block bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg transition-colors"
                >
                  戻る
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 text-white">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold text-center mb-8">ランキング</h1>

          <div className="bg-white bg-opacity-10 backdrop-blur-sm rounded-lg p-6 mb-6">
            <div className="text-center mb-4">
              <p className="text-sm opacity-80">チャレンジモードの上位100位までを表示しています</p>
              <p className="text-xs opacity-60 mt-1">🖱️ 各プレイヤーをクリックすると詳細情報を表示できます</p>
            </div>

            {rankings.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-lg mb-4">まだランキングデータがありません</p>
                <p className="text-sm opacity-80 mb-6">チャレンジモードをプレイしてスコアを登録しましょう！</p>
                <Link href="/challenge" className="inline-block bg-purple-600 hover:bg-purple-700 px-6 py-3 rounded-lg transition-colors">
                  チャレンジモードをプレイ
                </Link>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white border-opacity-20">
                      <th className="text-left py-3 px-4 font-semibold">順位</th>
                      <th className="text-left py-3 px-4 font-semibold">ランク</th>
                      <th className="text-left py-3 px-4 font-semibold">ユーザー名</th>
                      <th className="text-right py-3 px-4 font-semibold">スコア</th>
                      <th className="text-right py-3 px-4 font-semibold">登録日時</th>
                    </tr>
                  </thead>
                  <tbody>
                    {rankings.map((entry, index) => (
                      <tr
                        key={entry.id}
                        className={`border-b border-white border-opacity-10 ${index < 3 ? 'bg-white bg-opacity-5' : ''}`}
                        title="クリックで詳細を表示"
                      >
                        <td className="py-3 px-4" colSpan={5} style={{ padding: 0 }}>
                          <button
                            type="button"
                            onClick={() => handleEntryClick(entry)}
                            className="w-full flex items-center text-left hover:bg-white hover:bg-opacity-10 transition-colors cursor-pointer focus:outline-none"
                            style={{ padding: 0 }}
                          >
                            <span className="py-3 px-4 w-1/12">
                              <span
                                className={`font-bold ${
                                  index === 0
                                    ? 'text-yellow-400 text-lg'
                                    : index === 1
                                    ? 'text-gray-300 text-lg'
                                    : index === 2
                                    ? 'text-orange-400 text-lg'
                                    : 'text-white'
                                }`}
                              >
                                {index + 1}
                                {index === 0 && ' 🥇'}
                                {index === 1 && ' 🥈'}
                                {index === 2 && ' 🥉'}
                              </span>
                            </span>
                            <span className="py-3 px-4 w-1/12">
                              <span className={getRankColor(entry.rank)}>{entry.rank}</span>
                            </span>
                            <span className="py-3 px-4 w-3/12 font-medium">{entry.username}</span>
                            <span className="py-3 px-4 w-3/12 text-right font-bold text-lg">{entry.score.toLocaleString()}</span>
                            <span className="py-3 px-4 w-4/12 text-right text-sm opacity-80">{formatDate(entry.created_at)}</span>
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="text-center">
            <button
              type="button"
              onClick={handleBack}
              className="inline-block bg-blue-600 hover:bg-blue-700 px-8 py-3 rounded-lg transition-colors mr-4"
            >
              戻る
            </button>
            <Link href="/challenge" className="inline-block bg-purple-600 hover:bg-purple-700 px-8 py-3 rounded-lg transition-colors">
              チャレンジモードをプレイ
            </Link>
          </div>
        </div>
      </div>

      {/* 詳細モーダル */}
      <RankingDetailModal isOpen={isModalOpen} onClose={handleCloseModal} entry={selectedEntry} />
    </div>
  );
};

export default RankingPageContent;
