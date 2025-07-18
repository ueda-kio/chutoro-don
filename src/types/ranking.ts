/**
 * ランキング機能の型定義
 */

export interface RankingEntry {
  id: number;
  username: string;
  score: number;
  rank: string;
  created_at: string;
  details?: ScoreDetails[];
}

export interface ScoreDetails {
  trackId: string;
  trackName: string;
  albumName: string;
  artistName: string;
  answerTime: number;
  playbackDuration: number;
  wasRevealed: boolean;
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