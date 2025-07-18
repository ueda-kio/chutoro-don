/**
 * 開発環境用の簡易APIモック機能
 * MSWの代替として使用
 */

import type { RankingEntry, RankingApiResponse, ScoreSubmission, ScoreRegistrationResponse } from '@/types/ranking';

// モックデータ
let mockRankings: RankingEntry[] = [
  {
    id: 1,
    username: 'プレイヤー1',
    score: 9800,
    rank: 'S',
    created_at: '2025-01-15T10:00:00.000Z',
    details: [
      {
        trackId: 'track1',
        trackName: 'サンプル楽曲1',
        albumName: 'サンプルアルバム1',
        artistName: 'サンプルアーティスト1',
        answerTime: 5.2,
        playbackDuration: 1,
        wasRevealed: false,
      },
      {
        trackId: 'track2',
        trackName: 'サンプル楽曲2',
        albumName: 'サンプルアルバム2',
        artistName: 'サンプルアーティスト2',
        answerTime: 8.7,
        playbackDuration: 1.5,
        wasRevealed: false,
      },
      {
        trackId: 'track3',
        trackName: 'サンプル楽曲3',
        albumName: 'サンプルアルバム3',
        artistName: 'サンプルアーティスト3',
        answerTime: 12.1,
        playbackDuration: 2,
        wasRevealed: true,
      },
    ],
  },
  {
    id: 2,
    username: 'プレイヤー2',
    score: 8500,
    rank: 'A',
    created_at: '2025-01-15T11:00:00.000Z',
    details: [
      {
        trackId: 'track4',
        trackName: 'テスト楽曲A',
        albumName: 'テストアルバムA',
        artistName: 'テストアーティストA',
        answerTime: 7.5,
        playbackDuration: 1.5,
        wasRevealed: false,
      },
      {
        trackId: 'track5',
        trackName: 'テスト楽曲B',
        albumName: 'テストアルバムB',
        artistName: 'テストアーティストB',
        answerTime: 15.3,
        playbackDuration: 3,
        wasRevealed: true,
      },
    ],
  },
  {
    id: 3,
    username: 'プレイヤー3',
    score: 7200,
    rank: 'B',
    created_at: '2025-01-15T12:00:00.000Z',
    details: [
      {
        trackId: 'track6',
        trackName: 'デモ楽曲1',
        albumName: 'デモアルバム1',
        artistName: 'デモアーティスト1',
        answerTime: 25.8,
        playbackDuration: 5,
        wasRevealed: false,
      },
    ],
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

/**
 * 開発環境でのみ使用するモックAPI関数
 */
export const mockApiEnabled = process.env.NODE_ENV === 'development' && process.env.NEXT_PUBLIC_ENABLE_MOCK_API === 'true';

/**
 * ランキング一覧を取得するモック
 */
export async function getMockRankings(limit = 100): Promise<RankingApiResponse> {
  // レスポンス遅延をシミュレート
  await new Promise(resolve => setTimeout(resolve, 300));

  if (limit > 1000) {
    return {
      success: false,
      error: 'limit は 1000 以下で指定してください',
    };
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

  return {
    success: true,
    data: sortedRankings,
  };
}

/**
 * スコア登録のモック
 */
export async function postMockRanking(submission: ScoreSubmission): Promise<ScoreRegistrationResponse> {
  // レスポンス遅延をシミュレート
  await new Promise(resolve => setTimeout(resolve, 500));

  // バリデーション
  if (!submission.username || submission.username.trim().length === 0) {
    return {
      success: false,
      error: 'ユーザー名が入力されていません',
    };
  }

  if (submission.username.trim().length > 20) {
    return {
      success: false,
      error: 'ユーザー名は20文字以内で入力してください',
    };
  }

  if (typeof submission.score !== 'number' || submission.score < 0) {
    return {
      success: false,
      error: '無効なスコアです',
    };
  }

  if (!submission.rank || !['SS', 'S', 'A', 'B', 'C', 'D', 'F'].includes(submission.rank)) {
    return {
      success: false,
      error: '無効なランクです',
    };
  }

  // モックデータに新しいエントリを追加
  const newEntry: RankingEntry = {
    id: mockRankings.length + 1,
    username: submission.username.trim(),
    score: submission.score,
    rank: submission.rank,
    created_at: new Date().toISOString(),
    details: submission.details || undefined,
  };

  mockRankings.push(newEntry);

  return {
    success: true,
    message: 'スコアを登録しました',
  };
}

/**
 * モックデータをリセット
 */
export function resetMockRankings() {
  mockRankings = [
    {
      id: 1,
      username: 'プレイヤー1',
      score: 9800,
      rank: 'S',
      created_at: '2025-01-15T10:00:00.000Z',
      details: [
        {
          trackId: 'track1',
          trackName: 'サンプル楽曲1',
          albumName: 'サンプルアルバム1',
          artistName: 'サンプルアーティスト1',
          answerTime: 5.2,
          playbackDuration: 1,
          wasRevealed: false,
        },
        {
          trackId: 'track2',
          trackName: 'サンプル楽曲2',
          albumName: 'サンプルアルバム2',
          artistName: 'サンプルアーティスト2',
          answerTime: 8.7,
          playbackDuration: 1.5,
          wasRevealed: false,
        },
        {
          trackId: 'track3',
          trackName: 'サンプル楽曲3',
          albumName: 'サンプルアルバム3',
          artistName: 'サンプルアーティスト3',
          answerTime: 12.1,
          playbackDuration: 2,
          wasRevealed: true,
        },
      ],
    },
    {
      id: 2,
      username: 'プレイヤー2',
      score: 8500,
      rank: 'A',
      created_at: '2025-01-15T11:00:00.000Z',
      details: [
        {
          trackId: 'track4',
          trackName: 'テスト楽曲A',
          albumName: 'テストアルバムA',
          artistName: 'テストアーティストA',
          answerTime: 7.5,
          playbackDuration: 1.5,
          wasRevealed: false,
        },
        {
          trackId: 'track5',
          trackName: 'テスト楽曲B',
          albumName: 'テストアルバムB',
          artistName: 'テストアーティストB',
          answerTime: 15.3,
          playbackDuration: 3,
          wasRevealed: true,
        },
      ],
    },
    {
      id: 3,
      username: 'プレイヤー3',
      score: 7200,
      rank: 'B',
      created_at: '2025-01-15T12:00:00.000Z',
      details: [
        {
          trackId: 'track6',
          trackName: 'デモ楽曲1',
          albumName: 'デモアルバム1',
          artistName: 'デモアーティスト1',
          answerTime: 25.8,
          playbackDuration: 5,
          wasRevealed: false,
        },
      ],
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
}