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
