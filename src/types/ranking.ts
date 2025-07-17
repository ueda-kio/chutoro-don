/**
 * ランキング機能の型定義
 */

export interface RankingEntry {
  id: number;
  username: string;
  score: number;
  rank: string;
  created_at: string;
}

export interface ScoreDetails {
  trackId: string;
  answerTime: number;
  playbackDuration: number;
}

export interface ScoreSubmission {
  username: string;
  score: number;
  rank: string;
  details: ScoreDetails[];
}

export interface RankingApiResponse {
  success: boolean;
  data?: RankingEntry[];
  message?: string;
  error?: string;
}

export interface ScoreRegistrationResponse {
  success: boolean;
  message?: string;
  error?: string;
}