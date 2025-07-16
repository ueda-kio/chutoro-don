'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { ChallengeScore } from '@/types';
import { getScoreRank, getScoreMessage } from '@/utils/challenge';

export function ChallengeResultPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [totalScore, setTotalScore] = useState(0);
  const [scores, setScores] = useState<ChallengeScore[]>([]);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);

  useEffect(() => {
    const totalScoreParam = searchParams.get('totalScore');
    const scoresParam = searchParams.get('scores');

    if (totalScoreParam) {
      const score = parseInt(totalScoreParam);
      setTotalScore(score);

      // スコアアニメーション
      setTimeout(() => {
        setShowAnimation(true);
        let currentScore = 0;
        const increment = score / 50;
        const timer = setInterval(() => {
          currentScore += increment;
          if (currentScore >= score) {
            currentScore = score;
            clearInterval(timer);
          }
          setAnimatedScore(Math.floor(currentScore));
        }, 30);
      }, 500);
    }

    if (scoresParam) {
      try {
        const parsedScores = JSON.parse(scoresParam);
        setScores(parsedScores);
      } catch (error) {
        console.error('スコアデータの解析に失敗しました:', error);
      }
    }
  }, [searchParams]);

  const rank = getScoreRank(totalScore);
  const message = getScoreMessage(totalScore);

  const handleRetry = () => {
    router.push('/');
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  const getRankColor = (rank: string) => {
    switch (rank) {
      case 'SS':
        return 'text-pink-500';
      case 'S':
        return 'text-yellow-500';
      case 'A':
        return 'text-blue-500';
      case 'B':
        return 'text-green-500';
      case 'C':
        return 'text-purple-500';
      case 'D':
        return 'text-orange-500';
      default:
        return 'text-gray-500';
    }
  };

  const getRankBgColor = (rank: string) => {
    switch (rank) {
      case 'SS':
        return 'bg-pink-100 border-pink-200';
      case 'S':
        return 'bg-yellow-100 border-yellow-200';
      case 'A':
        return 'bg-blue-100 border-blue-200';
      case 'B':
        return 'bg-green-100 border-green-200';
      case 'C':
        return 'bg-purple-100 border-purple-200';
      case 'D':
        return 'bg-orange-100 border-orange-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">中トロドン</h1>
              <span className="text-lg font-semibold text-red-600">タイムアタック結果</span>
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        {/* 最終スコア表示 */}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">最終結果</h2>

          {/* スコア表示 */}
          <div className="mb-6">
            <div className="text-6xl font-bold text-red-600 mb-2">{showAnimation ? animatedScore.toLocaleString() : '0'}</div>
            <div className="text-xl text-gray-600">点</div>
          </div>

          {/* ランク表示 */}
          <div className={`inline-block px-8 py-4 rounded-full border-2 ${getRankBgColor(rank)} mb-4`}>
            <div className={`text-4xl font-bold ${getRankColor(rank)}`}>ランク {rank}</div>
          </div>

          {/* メッセージ */}
          <div className="text-lg text-gray-700 mb-6">{message}</div>

          {/* アクションボタン */}
          <div className="flex justify-center space-x-4">
            <button type="button" onClick={handleRetry} className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium">
              もう一度チャレンジ
            </button>
            <button
              type="button"
              onClick={handleBackToHome}
              className="px-8 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium"
            >
              トップに戻る
            </button>
          </div>
        </div>

        {/* 詳細スコア表示 */}
        {scores.length > 0 && (
          <div className="bg-white rounded-lg shadow-lg p-6">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">問題別スコア詳細</h3>

            <div className="overflow-x-auto">
              <table className="w-full table-auto">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4 font-medium text-gray-700">問題</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">基本点</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">時間</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">時間ボーナス</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">再生時間ボーナス</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">答え表示</th>
                    <th className="text-right py-3 px-4 font-medium text-gray-700">合計点</th>
                  </tr>
                </thead>
                <tbody>
                  {scores.map((score) => (
                    <tr key={score.questionIndex} className="border-b hover:bg-gray-50">
                      <td className="py-3 px-4 text-gray-900">Q.{score.questionIndex + 1}</td>
                      <td className="py-3 px-4 text-right text-gray-900">{score.baseScore}</td>
                      <td className="py-3 px-4 text-right text-gray-600">{formatTime(score.timeElapsed)}</td>
                      <td className={`py-3 px-4 text-right ${score.timeBonus >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {score.timeBonus >= 0 ? '+' : ''}
                        {score.timeBonus}
                      </td>
                      <td className="py-3 px-4 text-right text-green-600">+{score.playDurationBonus}</td>
                      <td className="py-3 px-4 text-right">
                        {score.wasRevealed ? <span className="text-red-600">-1000</span> : <span className="text-gray-400">-</span>}
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-gray-900">{score.totalScore}</td>
                    </tr>
                  ))}
                </tbody>
                <tfoot>
                  <tr className="border-t-2 border-gray-300">
                    <td className="py-3 px-4 font-bold text-gray-900" colSpan={6}>
                      合計
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-red-600 text-lg">{totalScore.toLocaleString()}</td>
                  </tr>
                </tfoot>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
