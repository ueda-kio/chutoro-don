import type { ChallengeScore } from '@/types';

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
      return 500;   // SS ランク用
    case 1.5:
      return 300;   // S/A ランク用
    case 2:
      return 100;   // A/B/C ランク用
    case 3:
      return 0;     // C ランク用
    case 5:
      return -100;  // ペナルティ
    default:
      return 0;
  }
}

/**
 * 時間に基づくボーナス点数を計算
 */
export function calculateTimeBonus(timeElapsed: number): number {
  if (timeElapsed <= 10) {
    return 200; // SS ランク用：10秒以内でボーナス
  }
  if (timeElapsed <= 15) {
    return 100; // S/A ランク用：15秒以内でボーナス
  }
  if (timeElapsed <= 20) {
    return 0;   // B/C ランク用：20秒以内は減点なし
  }
  if (timeElapsed <= 30) {
    return -100; // 20-30秒は軽い減点
  }
  // 30秒以上は大きな減点
  return -300;
}

/**
 * 問題のスコアを計算
 */
export function calculateQuestionScore(
  questionIndex: number,
  trackId: string,
  trackName: string,
  albumName: string,
  artistName: string,
  timeElapsed: number,
  playDuration: number,
  wasRevealed: boolean
): ChallengeScore {
  const baseScore = 1000;
  const timeBonus = calculateTimeBonus(timeElapsed);
  const playDurationBonus = calculatePlayDurationBonus(playDuration);
  const revealPenalty = wasRevealed ? -1000 : 0; // ペナルティを増加

  const totalScore = Math.max(0, baseScore + timeBonus + playDurationBonus + revealPenalty);

  return {
    questionIndex,
    trackId,
    trackName,
    albumName,
    artistName,
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
export function getScoreRank(totalScore: number) {
  if (totalScore >= 16000) return 'SS'; // 神の領域
  if (totalScore >= 14500) return 'S';  // 素晴らしい
  if (totalScore >= 12500) return 'A';  // 上級者
  if (totalScore >= 9000) return 'B';   // 良好
  if (totalScore >= 7000) return 'C';   // 普通
  if (totalScore >= 5000) return 'D';   // 要練習
  return 'F'; // 要改善
}

/**
 * スコアに基づくメッセージを取得
 */
export function getScoreMessage(totalScore: number): string {
  const rank = getScoreRank(totalScore);

  switch (rank) {
    case 'SS':
      return '完璧です！神の領域に到達しました！';
    case 'S':
      return '素晴らしい！かなりの上級者ですね！';
    case 'A':
      return 'よくできました！さらなる高みを目指しましょう！';
    case 'B':
      return 'もう少し！練習すればもっと上達できます！';
    case 'C':
      return '惜しい！基礎を固めてもう一度チャレンジしましょう！';
    case 'D':
      return 'まだまだ！諦めずに頑張りましょう！';
    case 'F':
      return 'お疲れ様でした！';
    default:
      return 'お疲れ様でした！';
  }
}