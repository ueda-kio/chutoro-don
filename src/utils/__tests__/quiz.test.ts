import {
  calculateStartTime,
  generateQuizQuestions,
  generateQuizQuestionsFromAllSongs,
  extractYouTubeVideoId,
  loadSongsData,
} from '../quiz';
import type { SongsData, Track } from '@/types';

// モックデータ
const mockSongsData: SongsData = {
  artists: [
    {
      id: 'artist001',
      name: 'Test Artist 1',
      albums: [
        {
          id: 'album001',
          name: 'Test Album 1',
          jacketUrl: '/test-jacket-1.jpg',
          tracks: [
            {
              id: 'track001',
              title: 'Test Track 1',
              youtubeUrl: 'https://www.youtube.com/watch?v=testId1',
            },
            {
              id: 'track002',
              title: 'Test Track 2 (with duration)',
              youtubeUrl: 'https://www.youtube.com/watch?v=testId2',
              duration: 180, // 3分
            },
            {
              id: 'track003',
              title: 'Test Track 3 (with midpointStart)',
              youtubeUrl: 'https://www.youtube.com/watch?v=testId3',
              duration: 240, // 4分
              midpointStart: 120, // 2分
            },
          ],
        },
        {
          id: 'album002',
          name: 'Test Album 2',
          jacketUrl: '/test-jacket-2.jpg',
          tracks: [
            {
              id: 'track004',
              title: 'Test Track 4',
              youtubeUrl: 'https://www.youtube.com/watch?v=testId4',
            },
          ],
        },
      ],
    },
    {
      id: 'artist002',
      name: 'Test Artist 2',
      albums: [
        {
          id: 'album003',
          name: 'Test Album 3',
          jacketUrl: '/test-jacket-3.jpg',
          tracks: [
            {
              id: 'track005',
              title: 'Test Track 5',
              youtubeUrl: 'https://www.youtube.com/watch?v=testId5',
            },
          ],
        },
      ],
    },
  ],
};

describe('Quiz Utility Functions', () => {
  describe('楽曲再生開始時間の計算', () => {
    describe('calculateStartTime', () => {
      it('midpointStartが指定されている場合は、その値を使用する（優先事項）', () => {
        const track: Track = {
          id: 'test',
          title: 'Test',
          youtubeUrl: 'https://www.youtube.com/watch?v=test',
          duration: 240,
          midpointStart: 120,
        };

        const startTime = calculateStartTime(track);
        expect(startTime).toBe(120);
      });

      it('durationが指定されている場合は、40%-60%の範囲でランダムな時間を返す（例外ルール）', () => {
        const track: Track = {
          id: 'test',
          title: 'Test',
          youtubeUrl: 'https://www.youtube.com/watch?v=test',
          duration: 300, // 5分
        };

        // 複数回実行して範囲をテスト
        for (let i = 0; i < 100; i++) {
          const startTime = calculateStartTime(track);
          expect(startTime).toBeGreaterThanOrEqual(120); // 40% = 120秒
          expect(startTime).toBeLessThanOrEqual(180); // 60% = 180秒
        }
      });

      it('duration、midpointStartが指定されていない場合は、90-150秒の範囲でランダムな時間を返す（原則）', () => {
        const track: Track = {
          id: 'test',
          title: 'Test',
          youtubeUrl: 'https://www.youtube.com/watch?v=test',
        };

        // 複数回実行して範囲をテスト
        for (let i = 0; i < 100; i++) {
          const startTime = calculateStartTime(track);
          expect(startTime).toBeGreaterThanOrEqual(90);
          expect(startTime).toBeLessThanOrEqual(150);
        }
      });
    });
  });

  describe('クイズ問題生成', () => {
    describe('generateQuizQuestionsFromAllSongs', () => {
      it('全ての楽曲からランダムに指定された数の問題を生成する', () => {
        const questions = generateQuizQuestionsFromAllSongs(mockSongsData, 3);

        expect(questions).toHaveLength(3);
        expect(questions[0]).toHaveProperty('track');
        expect(questions[0]).toHaveProperty('album');
        expect(questions[0]).toHaveProperty('artist');
        expect(questions[0]).toHaveProperty('startTime');
      });

      it('問題数が楽曲数より多い場合は、利用可能な楽曲数を返す', () => {
        const questions = generateQuizQuestionsFromAllSongs(mockSongsData, 100);

        // mockSongsDataには5曲しかない
        expect(questions).toHaveLength(5);
      });

      it('楽曲が存在しない場合はエラーを投げる', () => {
        const emptySongsData: SongsData = { artists: [] };

        expect(() => {
          generateQuizQuestionsFromAllSongs(emptySongsData, 5);
        }).toThrow('No tracks found');
      });

      it('生成された問題のstartTimeが正しく計算されている', () => {
        const questions = generateQuizQuestionsFromAllSongs(mockSongsData, 5);

        for (const question of questions) {
          expect(typeof question.startTime).toBe('number');
          expect(question.startTime).toBeGreaterThanOrEqual(0);
        }
      });

      it('デフォルトで10問を生成する', () => {
        const questions = generateQuizQuestionsFromAllSongs(mockSongsData);

        // mockSongsDataには5曲しかないので5問
        expect(questions).toHaveLength(5);
      });
    });
  });

  describe('YouTube URL処理', () => {
    describe('extractYouTubeVideoId', () => {
      it('標準的なYouTube URLからVideo IDを抽出する', () => {
        const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ';
        const videoId = extractYouTubeVideoId(url);
        expect(videoId).toBe('dQw4w9WgXcQ');
      });

      it('短縮形YouTube URLからVideo IDを抽出する', () => {
        const url = 'https://youtu.be/dQw4w9WgXcQ';
        const videoId = extractYouTubeVideoId(url);
        expect(videoId).toBe('dQw4w9WgXcQ');
      });

      it('パラメータが複数ある場合でもVideo IDを正しく抽出する', () => {
        const url = 'https://www.youtube.com/watch?v=dQw4w9WgXcQ&t=30s&list=PLtest';
        const videoId = extractYouTubeVideoId(url);
        expect(videoId).toBe('dQw4w9WgXcQ');
      });

      it('無効なURLの場合はnullを返す', () => {
        const url = 'https://example.com/invalid';
        const videoId = extractYouTubeVideoId(url);
        expect(videoId).toBeNull();
      });
    });
  });

  describe('楽曲データ読み込み', () => {
    describe('loadSongsData', () => {
      beforeEach(() => {
        // fetchをモック
        global.fetch = jest.fn();
      });

      afterEach(() => {
        jest.resetAllMocks();
      });

      it('正常に楽曲データを読み込む', async () => {
        const mockResponse = {
          ok: true,
          json: async () => mockSongsData,
        };
        (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

        const data = await loadSongsData();
        expect(data).toEqual(mockSongsData);
        expect(global.fetch).toHaveBeenCalledWith('/songs.json');
      });

      it('データ読み込みに失敗した場合はエラーを投げる', async () => {
        const mockResponse = {
          ok: false,
        };
        (global.fetch as jest.Mock).mockResolvedValue(mockResponse);

        await expect(loadSongsData()).rejects.toThrow('Failed to load songs data');
      });
    });
  });

  describe('アルバム選択機能', () => {
    describe('generateQuizQuestions (選択されたアルバムから問題生成)', () => {
      it('選択されたアルバムの楽曲のみから問題を生成する', () => {
        const selectedAlbumIds = ['album001', 'album003'];
        const questions = generateQuizQuestions(selectedAlbumIds, mockSongsData, 10);

        // 選択されたアルバムの楽曲のみが含まれることを確認
        const trackIds = questions.map(q => q.track.id);
        expect(trackIds).toContain('track001');
        expect(trackIds).toContain('track002');
        expect(trackIds).toContain('track003');
        expect(trackIds).toContain('track005');

        // 選択されていないアルバムの楽曲は含まれない
        expect(trackIds).not.toContain('track004');
      });

      it('指定された問題数の通りに問題を生成する', () => {
        const selectedAlbumIds = ['album001'];
        const questions = generateQuizQuestions(selectedAlbumIds, mockSongsData, 2);

        expect(questions).toHaveLength(2);
      });

      it('選択されたアルバムの楽曲数より多い問題数を指定しても、楽曲数までしか生成しない', () => {
        const selectedAlbumIds = ['album003']; // 1曲しかない
        const questions = generateQuizQuestions(selectedAlbumIds, mockSongsData, 10);

        expect(questions).toHaveLength(1);
        expect(questions[0].track.id).toBe('track005');
      });

      it('存在しないアルバムIDが指定された場合でもエラーにならない', () => {
        const selectedAlbumIds = ['album001', 'nonexistent'];
        const questions = generateQuizQuestions(selectedAlbumIds, mockSongsData, 10);

        // album001の楽曲のみ含まれる
        expect(questions).toHaveLength(3);
        const trackIds = questions.map(q => q.track.id);
        expect(trackIds).toContain('track001');
        expect(trackIds).toContain('track002');
        expect(trackIds).toContain('track003');
      });

      it('空のアルバムIDリストが指定された場合はエラーを投げる', () => {
        expect(() => {
          generateQuizQuestions([], mockSongsData, 10);
        }).toThrow('No tracks found in selected albums');
      });

      it('生成された問題の各フィールドが正しく設定される', () => {
        const selectedAlbumIds = ['album001'];
        const questions = generateQuizQuestions(selectedAlbumIds, mockSongsData, 1);

        const question = questions[0];
        expect(question.track).toBeDefined();
        expect(question.album).toBeDefined();
        expect(question.artist).toBeDefined();
        expect(question.startTime).toBeDefined();
        expect(typeof question.startTime).toBe('number');
      });

      it('楽曲の開始時間が正しく計算される', () => {
        const selectedAlbumIds = ['album001'];
        const questions = generateQuizQuestions(selectedAlbumIds, mockSongsData, 3);

        for (const question of questions) {
          const { track, startTime } = question;

          if (track.midpointStart !== undefined) {
            // midpointStartが指定されている場合はその値
            expect(startTime).toBe(track.midpointStart);
          } else if (track.duration !== undefined) {
            // durationが指定されている場合は40%-60%の範囲
            const min = Math.floor(track.duration * 0.4);
            const max = Math.floor(track.duration * 0.6);
            expect(startTime).toBeGreaterThanOrEqual(min);
            expect(startTime).toBeLessThanOrEqual(max);
          } else {
            // デフォルトは90-150秒の範囲
            expect(startTime).toBeGreaterThanOrEqual(90);
            expect(startTime).toBeLessThanOrEqual(150);
          }
        }
      });

      it('複数のアルバムから均等に楽曲が選ばれる（ランダム性のテスト）', () => {
        const selectedAlbumIds = ['album001', 'album002', 'album003'];

        // ランダム性をテストするため、選ばれる楽曲の分布を確認
        const albumCounts = { album001: 0, album002: 0, album003: 0 };

        for (let i = 0; i < 50; i++) {
          const questions = generateQuizQuestions(selectedAlbumIds, mockSongsData, 5);
          for (const question of questions) {
            const albumId = question.album.id;
            albumCounts[albumId as keyof typeof albumCounts]++;
          }
        }

        // 3つのアルバムすべてから楽曲が選ばれることを確認
        expect(albumCounts.album001).toBeGreaterThan(0);
        expect(albumCounts.album002).toBeGreaterThan(0);
        expect(albumCounts.album003).toBeGreaterThan(0);
      });

      it('アルバムとアーティスト情報が正しく関連付けられる', () => {
        const selectedAlbumIds = ['album001', 'album003'];
        const questions = generateQuizQuestions(selectedAlbumIds, mockSongsData, 5);

        for (const question of questions) {
          const { track, album, artist } = question;

          // アルバムに楽曲が含まれることを確認
          const albumTrack = album.tracks.find(t => t.id === track.id);
          expect(albumTrack).toBeDefined();

          // アーティストにアルバムが含まれることを確認
          const artistAlbum = artist.albums.find(a => a.id === album.id);
          expect(artistAlbum).toBeDefined();
        }
      });
    });

    describe('generateQuizQuestionsFromAllSongs との比較', () => {
      it('選択されたアルバムからの生成は、全楽曲からの生成よりも範囲が限定される', () => {
        const selectedAlbumIds = ['album001'];
        const selectedQuestions = generateQuizQuestions(selectedAlbumIds, mockSongsData, 10);
        const allQuestions = generateQuizQuestionsFromAllSongs(mockSongsData, 10);

        // 選択されたアルバムからの問題数は少ない（または同等）
        expect(selectedQuestions.length).toBeLessThanOrEqual(allQuestions.length);

        // 選択されたアルバムの楽曲のみ含まれる
        const selectedTrackIds = selectedQuestions.map(q => q.track.id);
        const allTrackIds = allQuestions.map(q => q.track.id);

        for (const trackId of selectedTrackIds) {
          expect(['track001', 'track002', 'track003']).toContain(trackId);
        }
      });
    });
  });
});
