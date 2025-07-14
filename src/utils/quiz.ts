import type { SongsData, QuizQuestion, Track, Album, Artist } from '@/types';

export async function loadSongsData(): Promise<SongsData> {
  const response = await fetch('/songs.json');
  if (!response.ok) {
    throw new Error('Failed to load songs data');
  }
  return response.json();
}

export function calculateStartTime(track: Track): number {
  // 優先事項: midpointStartが指定されている場合はそれを使用
  if (track.midpointStart !== undefined) {
    return track.midpointStart;
  }

  // 例外ルール: durationが指定されている場合
  if (track.duration !== undefined) {
    const min = Math.floor(track.duration * 0.4);
    const max = Math.floor(track.duration * 0.6);
    return Math.floor(Math.random() * (max - min + 1)) + min;
  }

  // 原則: 90秒から150秒の間のランダムな時間
  return Math.floor(Math.random() * (150 - 90 + 1)) + 90;
}

export function generateQuizQuestions(
  selectedAlbumIds: string[],
  songsData: SongsData,
  questionCount = 10
): QuizQuestion[] {
  const allTracks: Array<{ track: Track; album: Album; artist: Artist }> = [];

  // 選択されたアルバムから全ての楽曲を収集
  for (const artist of songsData.artists) {
    for (const album of artist.albums) {
      if (selectedAlbumIds.includes(album.id)) {
        for (const track of album.tracks) {
          allTracks.push({ track, album, artist });
        }
      }
    }
  }

  if (allTracks.length === 0) {
    throw new Error('No tracks found in selected albums');
  }

  // シャッフルして指定された数の問題を生成
  const shuffled = [...allTracks].sort(() => 0.5 - Math.random());
  const selectedTracks = shuffled.slice(0, Math.min(questionCount, shuffled.length));

  return selectedTracks.map(({ track, album, artist }) => ({
    track,
    album,
    artist,
    startTime: calculateStartTime(track),
  }));
}

export function generateQuizQuestionsFromAllSongs(
  songsData: SongsData,
  questionCount = 10
): QuizQuestion[] {
  const allTracks: Array<{ track: Track; album: Album; artist: Artist }> = [];

  // 全ての楽曲を収集
  for (const artist of songsData.artists) {
    for (const album of artist.albums) {
      for (const track of album.tracks) {
        allTracks.push({ track, album, artist });
      }
    }
  }

  if (allTracks.length === 0) {
    throw new Error('No tracks found');
  }

  // シャッフルして指定された数の問題を生成
  const shuffled = [...allTracks].sort(() => 0.5 - Math.random());
  const selectedTracks = shuffled.slice(0, Math.min(questionCount, shuffled.length));

  return selectedTracks.map(({ track, album, artist }) => ({
    track,
    album,
    artist,
    startTime: calculateStartTime(track),
  }));
}

export function extractYouTubeVideoId(url: string): string | null {
  const regex = /(?:youtube\.com\/watch\?v=|youtu\.be\/)([^&\n?#]+)/;
  const match = url.match(regex);
  return match ? match[1] : null;
}
