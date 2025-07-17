import type { ChallengeScore } from '@/types';

interface ChallengeResult {
  totalScore: number;
  scores: ChallengeScore[];
  timestamp: number;
  isRegistered?: boolean; // ランキング登録済みフラグ
}

const CHALLENGE_RESULT_KEY = 'challengeResult';

/**
 * チャレンジ結果をSessionStorageに保存
 */
export function saveChallengeResult(totalScore: number, scores: ChallengeScore[]): void {
  if (typeof window === 'undefined') return; // SSR対応

  const result: ChallengeResult = {
    totalScore,
    scores,
    timestamp: Date.now(),
  };

  try {
    sessionStorage.setItem(CHALLENGE_RESULT_KEY, JSON.stringify(result));
  } catch (error) {
    console.error('Failed to save challenge result to sessionStorage:', error);
  }
}

/**
 * SessionStorageからチャレンジ結果を取得
 */
export function getChallengeResult(): ChallengeResult | null {
  if (typeof window === 'undefined') return null; // SSR対応

  try {
    const stored = sessionStorage.getItem(CHALLENGE_RESULT_KEY);
    if (!stored) return null;

    const result = JSON.parse(stored) as ChallengeResult;

    // 5分以内のデータのみ有効とする（古いデータの無効化）
    const fiveMinutesAgo = Date.now() - 5 * 60 * 1000;
    if (result.timestamp < fiveMinutesAgo) {
      clearChallengeResult();
      return null;
    }

    return result;
  } catch (error) {
    console.error('Failed to get challenge result from sessionStorage:', error);
    return null;
  }
}

/**
 * チャレンジ結果の登録状態を更新
 */
export function markChallengeResultAsRegistered(): void {
  if (typeof window === 'undefined') return; // SSR対応

  try {
    const stored = sessionStorage.getItem(CHALLENGE_RESULT_KEY);
    if (!stored) return;

    const result = JSON.parse(stored) as ChallengeResult;
    result.isRegistered = true;

    sessionStorage.setItem(CHALLENGE_RESULT_KEY, JSON.stringify(result));
  } catch (error) {
    console.error('Failed to mark challenge result as registered:', error);
  }
}

/**
 * SessionStorageからチャレンジ結果を削除
 */
export function clearChallengeResult(): void {
  if (typeof window === 'undefined') return; // SSR対応

  try {
    sessionStorage.removeItem(CHALLENGE_RESULT_KEY);
  } catch (error) {
    console.error('Failed to clear challenge result from sessionStorage:', error);
  }
}