export interface Track {
  id: string;
  title: string;
  youtubeUrl: string;
  duration?: number;
  midpointStart?: number;
}

export interface Album {
  id: string;
  name: string;
  jacketUrl: string;
  tracks: Track[];
}

export interface Artist {
  id: string;
  name: string;
  albums: Album[];
}

export interface SongsData {
  artists: Artist[];
}

export interface QuizQuestion {
  track: Track;
  album: Album;
  artist: Artist;
  startTime: number;
}

export interface QuizSession {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  isAnswerRevealed: boolean;
}

// チャレンジモード用の型定義
export type GameMode = 'freeplay' | 'challenge';

export interface ChallengeScore {
  questionIndex: number;
  trackId: string;
  trackName: string;
  albumName: string;
  artistName: string;
  timeBonus: number;
  playDurationBonus: number;
  revealPenalty: number;
  totalScore: number;
  timeElapsed: number;
  playDuration: number;
  wasRevealed: boolean;
}

export interface ChallengeSession {
  questions: QuizQuestion[];
  currentQuestionIndex: number;
  scores: ChallengeScore[];
  startTime: number;
  currentQuestionStartTime: number;
  isGameCompleted: boolean;
  totalScore: number;
  userAnswer: string;
  isAnswerCorrect: boolean;
  isAnswerRevealed: boolean;
}
