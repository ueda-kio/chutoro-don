import { http, HttpResponse } from 'msw';
import type { ScoreSubmission, RankingApiResponse, ScoreRegistrationResponse, RankingEntry } from '@/types/ranking';

// モックデータ用のランキングリスト
let mockRankings: RankingEntry[] = [
  {
    id: 1,
    username: 'プレイヤー1',
    score: 9800,
    rank: 'S',
    created_at: '2025-01-15T10:00:00.000Z',
  },
  {
    id: 2,
    username: 'プレイヤー2',
    score: 8500,
    rank: 'A',
    created_at: '2025-01-15T11:00:00.000Z',
  },
  {
    id: 3,
    username: 'プレイヤー3',
    score: 7200,
    rank: 'B',
    created_at: '2025-01-15T12:00:00.000Z',
  },
  {
    id: 4,
    username: 'プレイヤー4',
    score: 6800,
    rank: 'C',
    created_at: '2025-01-15T13:00:00.000Z',
  },
  {
    id: 5,
    username: 'プレイヤー5',
    score: 5500,
    rank: 'D',
    created_at: '2025-01-15T14:00:00.000Z',
  },
  {
    id: 6,
    username: 'テストユーザー',
    score: 4200,
    rank: 'D',
    created_at: '2025-01-15T15:00:00.000Z',
  },
];

export const handlers = [
  // ランキング一覧取得API（GET /api/rankings）
  http.get('/api/rankings', ({ request }) => {
    console.log('🎭 MSW handling GET /api/rankings request');
    const url = new URL(request.url);
    const limitParam = url.searchParams.get('limit');
    const limit = limitParam ? Number.parseInt(limitParam, 10) : 100;

    // limitの上限チェック
    if (limit > 1000) {
      const response: RankingApiResponse = {
        success: false,
        error: 'limit は 1000 以下で指定してください',
      };
      return HttpResponse.json(response, { status: 400 });
    }

    // スコア降順でソートし、同スコアの場合は作成日時の昇順
    const sortedRankings = [...mockRankings]
      .sort((a, b) => {
        if (b.score !== a.score) {
          return b.score - a.score;
        }
        return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
      })
      .slice(0, limit);

    const response: RankingApiResponse = {
      success: true,
      data: sortedRankings,
    };

    return HttpResponse.json(response);
  }),

  // スコア登録API（POST /api/rankings）
  http.post('/api/rankings', async ({ request }) => {
    console.log('🎭 MSW handling POST /api/rankings request');
    try {
      const body = (await request.json()) as ScoreSubmission;

      // バリデーション
      if (!body.username || body.username.trim().length === 0) {
        const response: ScoreRegistrationResponse = {
          success: false,
          error: 'ユーザー名が入力されていません',
        };
        return HttpResponse.json(response, { status: 400 });
      }

      if (body.username.trim().length > 20) {
        const response: ScoreRegistrationResponse = {
          success: false,
          error: 'ユーザー名は20文字以内で入力してください',
        };
        return HttpResponse.json(response, { status: 400 });
      }

      if (typeof body.score !== 'number' || body.score < 0) {
        const response: ScoreRegistrationResponse = {
          success: false,
          error: '無効なスコアです',
        };
        return HttpResponse.json(response, { status: 400 });
      }

      if (!body.rank || !['S', 'A', 'B', 'C', 'D'].includes(body.rank)) {
        const response: ScoreRegistrationResponse = {
          success: false,
          error: '無効なランクです',
        };
        return HttpResponse.json(response, { status: 400 });
      }

      // モックデータに新しいエントリを追加
      const newEntry: RankingEntry = {
        id: mockRankings.length + 1,
        username: body.username.trim(),
        score: body.score,
        rank: body.rank,
        created_at: new Date().toISOString(),
      };

      mockRankings.push(newEntry);

      const response: ScoreRegistrationResponse = {
        success: true,
        message: 'スコアを登録しました',
      };

      return HttpResponse.json(response);
    } catch (error) {
      console.error('モックランキング登録エラー:', error);
      const response: ScoreRegistrationResponse = {
        success: false,
        error: 'サーバーエラーが発生しました',
      };
      return HttpResponse.json(response, { status: 500 });
    }
  }),
];

// テスト用のモックデータリセット機能
export const resetMockRankings = () => {
  mockRankings = [
    {
      id: 1,
      username: 'プレイヤー1',
      score: 9800,
      rank: 'S',
      created_at: '2025-01-15T10:00:00.000Z',
    },
    {
      id: 2,
      username: 'プレイヤー2',
      score: 8500,
      rank: 'A',
      created_at: '2025-01-15T11:00:00.000Z',
    },
    {
      id: 3,
      username: 'プレイヤー3',
      score: 7200,
      rank: 'B',
      created_at: '2025-01-15T12:00:00.000Z',
    },
    {
      id: 4,
      username: 'プレイヤー4',
      score: 6800,
      rank: 'C',
      created_at: '2025-01-15T13:00:00.000Z',
    },
    {
      id: 5,
      username: 'プレイヤー5',
      score: 5500,
      rank: 'D',
      created_at: '2025-01-15T14:00:00.000Z',
    },
    {
      id: 6,
      username: 'テストユーザー',
      score: 4200,
      rank: 'D',
      created_at: '2025-01-15T15:00:00.000Z',
    },
  ];
};

// モックデータを取得する関数（テスト用）
export const getMockRankings = () => mockRankings;