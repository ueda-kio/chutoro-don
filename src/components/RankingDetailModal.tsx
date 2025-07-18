'use client';

import { useEffect } from 'react';
import type { RankingEntry } from '@/types/ranking';

interface RankingDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  entry: RankingEntry | null;
}

export function RankingDetailModal({ isOpen, onClose, entry }: RankingDetailModalProps) {
  // デバッグログを追加
  useEffect(() => {
    if (isOpen && entry) {
      console.log('🎭 モーダルに渡されたエントリ:', {
        username: entry.username,
        hasDetails: !!entry.details,
        detailsLength: entry.details?.length || 0,
        details: entry.details,
      });
    }
  }, [isOpen, entry]);

  // ESCキーでモーダルを閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen || !entry) return null;

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'SS':
        return 'text-pink-500 bg-pink-100';
      case 'S':
        return 'text-yellow-500 bg-yellow-100';
      case 'A':
        return 'text-blue-500 bg-blue-100';
      case 'B':
        return 'text-green-500 bg-green-100';
      case 'C':
        return 'text-purple-500 bg-purple-100';
      case 'D':
        return 'text-orange-500 bg-orange-100';
      default:
        return 'text-gray-500 bg-gray-100';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* オーバーレイ */}
      <div
        className="absolute inset-0 bg-black bg-opacity-50"
        onClick={onClose}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            onClose();
          }
        }}
        tabIndex={0}
        role="button"
        aria-label="モーダルを閉じる"
      />

      {/* モーダル本体 */}
      <div className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* ヘッダー */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
          <h2 className="text-2xl font-bold text-gray-900">プレイヤー詳細</h2>
          <button type="button" onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl font-bold" aria-label="閉じる">
            ×
          </button>
        </div>

        {/* コンテンツ */}
        <div className="p-6">
          {/* プレイヤー情報 */}
          <div className="bg-gray-50 rounded-lg p-6 mb-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">プレイヤー名</h3>
                <p className="text-lg font-bold text-gray-900">{entry.username}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">スコア</h3>
                <p className="text-lg font-bold text-gray-900">{entry.score.toLocaleString()}</p>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">ランク</h3>
                <span className={`inline-block px-3 py-1 rounded-full text-sm font-bold ${getRankColor(entry.rank)}`}>{entry.rank}</span>
              </div>
              <div>
                <h3 className="text-sm font-medium text-gray-500 mb-1">プレイ日時</h3>
                <p className="text-sm text-gray-700">{formatDate(entry.created_at)}</p>
              </div>
            </div>
          </div>

          {/* 曲ごとの詳細情報 */}
          {entry.details && entry.details.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">曲ごとの詳細</h3>
              <div className="overflow-x-auto">
                <table className="w-full bg-white border border-gray-200 rounded-lg">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">曲名</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">アルバム</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">回答時間</th>
                      <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">再生時間</th>
                      <th className="px-4 py-3 text-center text-xs font-medium text-gray-500 uppercase tracking-wider">答え表示</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {entry.details.map((detail) => (
                      <tr
                        key={`${detail.trackName}-${detail.artistName}-${detail.albumName}-${detail.playbackDuration}`}
                        className="hover:bg-gray-50"
                      >
                        <td className="px-4 py-3">
                          <div>
                            <p className="font-medium text-gray-900">{detail.trackName}</p>
                            <p className="text-sm text-gray-500">{detail.artistName}</p>
                          </div>
                        </td>
                        <td className="px-4 py-3 text-sm text-gray-700">{detail.albumName}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-700">{formatTime(detail.answerTime)}</td>
                        <td className="px-4 py-3 text-right text-sm text-gray-700">{detail.playbackDuration}秒</td>
                        <td className="px-4 py-3 text-center">
                          {detail.wasRevealed ? (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
                              表示
                            </span>
                          ) : (
                            <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">
                              正解
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 詳細情報がない場合 */}
          {(!entry.details || entry.details.length === 0) && (
            <div className="text-center py-8">
              <p className="text-gray-500">詳細情報がありません</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
