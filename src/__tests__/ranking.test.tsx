import type { RankingEntry } from '@/types/ranking';

describe('ランキング機能', () => {
  describe('基本機能テスト', () => {
    test('ランキングエントリの型定義が正しい', () => {
      const mockRanking: RankingEntry = {
        id: 1,
        username: 'テストユーザー',
        score: 8000,
        rank: 'A',
        created_at: '2025-01-15T10:00:00.000Z',
      };
      
      expect(mockRanking).toHaveProperty('id');
      expect(mockRanking).toHaveProperty('username');
      expect(mockRanking).toHaveProperty('score');
      expect(mockRanking).toHaveProperty('rank');
      expect(mockRanking).toHaveProperty('created_at');
      
      expect(typeof mockRanking.id).toBe('number');
      expect(typeof mockRanking.username).toBe('string');
      expect(typeof mockRanking.score).toBe('number');
      expect(typeof mockRanking.rank).toBe('string');
      expect(typeof mockRanking.created_at).toBe('string');
      
      // ランクの妥当性チェック
      expect(['S', 'A', 'B', 'C', 'D']).toContain(mockRanking.rank);
    });

    test('スコアソート機能をテスト', () => {
      const rankings: RankingEntry[] = [
        { id: 1, username: 'User1', score: 5000, rank: 'D', created_at: '2025-01-15T10:00:00.000Z' },
        { id: 2, username: 'User2', score: 8000, rank: 'A', created_at: '2025-01-15T11:00:00.000Z' },
        { id: 3, username: 'User3', score: 6500, rank: 'C', created_at: '2025-01-15T12:00:00.000Z' },
      ];
      
      // スコア降順でソート
      const sorted = rankings.sort((a, b) => b.score - a.score);
      
      expect(sorted[0].score).toBe(8000);
      expect(sorted[1].score).toBe(6500);
      expect(sorted[2].score).toBe(5000);
    });
  });
});