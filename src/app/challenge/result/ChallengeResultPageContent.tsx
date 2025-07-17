'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { ChallengeScore } from '@/types';
import { getScoreRank, getScoreMessage } from '@/utils/challenge';
import { getChallengeResult, clearChallengeResult, markChallengeResultAsRegistered } from '@/utils/sessionStorage';
import type { ScoreSubmission, ScoreRegistrationResponse } from '@/types/ranking';

export function ChallengeResultPageContent() {
  const router = useRouter();
  const [totalScore, setTotalScore] = useState(0);
  const [scores, setScores] = useState<ChallengeScore[]>([]);
  const [showAnimation, setShowAnimation] = useState(false);
  const [animatedScore, setAnimatedScore] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ランキング登録関連の状態
  const [username, setUsername] = useState('');
  const [isRegistering, setIsRegistering] = useState(false);
  const [registrationMessage, setRegistrationMessage] = useState('');
  const [isRegistered, setIsRegistered] = useState(false);

  useEffect(() => {
    const result = getChallengeResult();

    if (!result) {
      setError('チャレンジ結果が見つかりません。');
      setIsLoading(false);
      return;
    }

    setTotalScore(result.totalScore);
    setScores(result.scores);
    // sessionStorageから登録状態を復元
    setIsRegistered(result.isRegistered || false);
    setIsLoading(false);

    // スコアアニメーション
    setTimeout(() => {
      setShowAnimation(true);
      let currentScore = 0;
      const increment = result.totalScore / 50;
      const timer = setInterval(() => {
        currentScore += increment;
        if (currentScore >= result.totalScore) {
          currentScore = result.totalScore;
          clearInterval(timer);
        }
        setAnimatedScore(Math.floor(currentScore));
      }, 30);
    }, 500);
  }, []);

  const rank = getScoreRank(totalScore);
  const message = getScoreMessage(totalScore);

  const handleRetry = () => {
    clearChallengeResult();
    router.push('/');
  };

  const handleBackToHome = () => {
    clearChallengeResult();
    router.push('/');
  };

  // ランキング登録処理
  const handleRegisterRanking = async () => {
    if (!username.trim()) {
      setRegistrationMessage('ユーザー名を入力してください');
      return;
    }

    if (username.trim().length > 20) {
      setRegistrationMessage('ユーザー名は20文字以内で入力してください');
      return;
    }

    setIsRegistering(true);
    setRegistrationMessage('');

    try {
      // スコア詳細をAPI用のフォーマットに変換
      const details = scores.map((score) => ({
        trackId: score.trackId,
        answerTime: score.timeElapsed,
        playbackDuration: score.playDuration,
      }));

      const submission: ScoreSubmission = {
        username: username.trim(),
        score: totalScore,
        rank: rank,
        details: details,
      };

      // 開発環境ではMSW、本番環境では実際のAPIが呼ばれる
      const response = await fetch('/api/rankings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(submission),
      });

      const result: ScoreRegistrationResponse = await response.json();

      if (result.success) {
        setRegistrationMessage('ランキングに登録しました！');
        setIsRegistered(true);
        // sessionStorageに登録済み状態を保存
        markChallengeResultAsRegistered();
      } else {
        setRegistrationMessage(result.error || 'ランキング登録に失敗しました');
      }
    } catch (err) {
      setRegistrationMessage('ネットワークエラーが発生しました');
    } finally {
      setIsRegistering(false);
    }
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4" />
          <div className="text-lg text-gray-600">結果を読み込み中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-4">{error}</div>
          <button type="button" onClick={handleBackToHome} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md">
            トップに戻る
          </button>
        </div>
      </div>
    );
  }

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

          {/* ランキング登録フォーム */}
          {!isRegistered && (
            <div className="mb-6 p-6 bg-gray-50 rounded-lg">
              <h3 className="text-xl font-bold text-gray-900 mb-4">ランキングに登録</h3>
              <div className="max-w-md mx-auto">
                <div className="flex flex-col space-y-3">
                  <input
                    type="text"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                    placeholder="ユーザー名を入力 (20文字以内)"
                    maxLength={20}
                    className="px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={isRegistering}
                  />
                  <button
                    type="button"
                    onClick={handleRegisterRanking}
                    disabled={isRegistering || !username.trim()}
                    className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-md font-medium transition-colors"
                  >
                    {isRegistering ? '登録中...' : 'ランキングに登録'}
                  </button>
                  {registrationMessage && (
                    <p
                      className={`text-sm text-center ${registrationMessage.includes('登録しました') ? 'text-green-600' : 'text-red-600'}`}
                    >
                      {registrationMessage}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* 登録完了後のメッセージ */}
          {isRegistered && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-center font-medium">✅ ランキング登録完了</p>
            </div>
          )}

          {/* アクションボタン */}
          <div className="flex justify-center space-x-4">
            <button type="button" onClick={handleRetry} className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium">
              もう一度チャレンジ
            </button>
            <Link href="/ranking" className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium text-center">
              ランキングを見る
            </Link>
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
                    <td className="py-3 px-4 font-bold text-gray-900" colSpan={5}>
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
