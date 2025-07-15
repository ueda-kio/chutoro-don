import type { ChallengeScore, QuizQuestion } from '@/types';

/**
 * チャレンジモードのスコア計算ユーティリティ
 */

/**
 * 楽曲名の正規化
 * 大文字小文字、全角半角、空白の統一を行う
 */
export function normalizeSongTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (char) => String.fromCharCode(char.charCodeAt(0) - 0xFEE0))
    .replace(/\s+/g, '')
    .trim();
}

/**
 * 楽曲名の一致判定
 */
export function isSongTitleMatch(userAnswer: string, correctTitle: string): boolean {
  const normalizedUserAnswer = normalizeSongTitle(userAnswer);
  const normalizedCorrectTitle = normalizeSongTitle(correctTitle);
  return normalizedUserAnswer === normalizedCorrectTitle;
}

/**
 * 再生時間に基づくボーナス点数を計算
 */
export function calculatePlayDurationBonus(playDuration: number): number {
  switch (playDuration) {
    case 1:
      return 200;
    case 1.5:
      return 150;
    case 2:
      return 100;
    case 3:
      return 50;
    case 5:
      return 0;
    default:
      return 0;
  }
}

/**
 * 時間に基づくボーナス点数を計算
 * 10秒以内: 減点なし
 * 10秒〜30秒: 徐々に減点
 * 30秒以上: 最大減点
 */
export function calculateTimeBonus(timeElapsed: number): number {
  if (timeElapsed <= 10) {
    return 0; // 10秒以内は減点なし
  }
  if (timeElapsed <= 30) {
    // 10秒から30秒までは徐々に減点（最大-200点）
    return Math.floor(((timeElapsed - 10) / 20) * -200);
  }
  // 30秒以上は最大減点
  return -200;
}

/**
 * 問題のスコアを計算
 */
export function calculateQuestionScore(
  questionIndex: number,
  timeElapsed: number,
  playDuration: number,
  wasRevealed: boolean
): ChallengeScore {
  const baseScore = 1000;
  const timeBonus = calculateTimeBonus(timeElapsed);
  const playDurationBonus = calculatePlayDurationBonus(playDuration);
  const revealPenalty = wasRevealed ? -500 : 0;

  const totalScore = Math.max(0, baseScore + timeBonus + playDurationBonus + revealPenalty);

  return {
    questionIndex,
    baseScore,
    timeBonus,
    playDurationBonus,
    revealPenalty,
    totalScore,
    timeElapsed,
    playDuration,
    wasRevealed,
  };
}

/**
 * 全体のスコアを計算
 */
export function calculateTotalScore(scores: ChallengeScore[]): number {
  return scores.reduce((total, score) => total + score.totalScore, 0);
}

/**
 * 高精度な時間計測
 */
export function getHighPrecisionTime(): number {
  return performance.now();
}

/**
 * 経過時間を秒単位で計算
 */
export function calculateElapsedTime(startTime: number, endTime: number): number {
  return (endTime - startTime) / 1000;
}

/**
 * スコアランクを取得
 */
export function getScoreRank(totalScore: number, maxScore = 10000) {
  const percentage = (totalScore / maxScore) * 100;

  if (percentage >= 90) return 'S';
  if (percentage >= 80) return 'A';
  if (percentage >= 70) return 'B';
  if (percentage >= 60) return 'C';
  if (percentage >= 50) return 'D';
  return 'F';
}

/**
 * スコアに基づくメッセージを取得
 */
export function getScoreMessage(totalScore: number, maxScore = 10000): string {
  const rank = getScoreRank(totalScore, maxScore);

  switch (rank) {
    case 'S':
      return '完璧です！神の領域に到達しました！';
    case 'A':
      return '素晴らしい！かなりの上級者ですね！';
    case 'B':
      return 'よくできました！さらなる高みを目指しましょう！';
    case 'C':
      return 'もう少し！練習すればもっと上達できます！';
    case 'D':
      return '惜しい！基礎を固めてもう一度チャレンジしましょう！';
    case 'F':
      return 'まだまだ！諦めずに頑張りましょう！';
    default:
      return 'お疲れ様でした！';
  }
}