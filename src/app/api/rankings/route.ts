import type { NextRequest } from 'next/server';
import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import type { ScoreSubmission, RankingApiResponse, ScoreRegistrationResponse, ScoreDetails } from '@/types/ranking';

// グローバルでPrismaClientのインスタンスを管理（開発環境での多重初期化を防ぐ）
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

const prisma = globalForPrisma.prisma ?? new PrismaClient();

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma;

/**
 * ランキングにスコアを登録する
 */
export async function POST(request: NextRequest): Promise<NextResponse<ScoreRegistrationResponse>> {
  try {
    const body: ScoreSubmission = await request.json();

    // バリデーション
    if (!body.username || body.username.trim().length === 0) {
      return NextResponse.json(
        { success: false, error: 'ユーザー名が入力されていません' },
        { status: 400 }
      );
    }

    if (body.username.trim().length > 20) {
      return NextResponse.json(
        { success: false, error: 'ユーザー名は20文字以内で入力してください' },
        { status: 400 }
      );
    }

    if (typeof body.score !== 'number' || body.score < 0) {
      return NextResponse.json(
        { success: false, error: '無効なスコアです' },
        { status: 400 }
      );
    }

    if (!body.rank || !['SS', 'S', 'A', 'B', 'C', 'D', 'F'].includes(body.rank)) {
      return NextResponse.json(
        { success: false, error: '無効なランクです' },
        { status: 400 }
      );
    }

    // データベースに登録
    await prisma.rankings.create({
      data: {
        username: body.username.trim(),
        score: body.score,
        rank: body.rank,
        details: body.details ? JSON.parse(JSON.stringify(body.details)) : null,
      },
    });

    return NextResponse.json({ success: true, message: 'スコアを登録しました' });
  } catch (error) {
    console.error('ランキング登録エラー:', error);
    return NextResponse.json(
      { success: false, error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}

/**
 * ランキング一覧を取得する
 */
export async function GET(request: NextRequest): Promise<NextResponse<RankingApiResponse>> {
  try {
    const { searchParams } = new URL(request.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam ? Number.parseInt(limitParam, 10) : 100;

    // limitの上限チェック
    if (limit > 1000) {
      return NextResponse.json(
        { success: false, error: 'limit は 1000 以下で指定してください' },
        { status: 400 }
      );
    }

    // ランキングデータを取得（スコア降順）
    const rankings = await prisma.rankings.findMany({
      select: {
        id: true,
        username: true,
        score: true,
        rank: true,
        created_at: true,
        details: true,
      },
      orderBy: [
        { score: 'desc' },
        { created_at: 'asc' }, // 同スコアの場合は先に登録された方が上位
      ],
      take: limit,
    });

    // ISO文字列に変換とdetailsの型変換
    const formattedRankings = rankings.map(ranking => ({
      ...ranking,
      created_at: ranking.created_at.toISOString(),
      details: ranking.details ? (ranking.details as unknown as ScoreDetails[]) : undefined,
    }));

    return NextResponse.json({ success: true, data: formattedRankings });
  } catch (error) {
    console.error('ランキング取得エラー:', error);
    return NextResponse.json(
      { success: false, error: 'サーバーエラーが発生しました' },
      { status: 500 }
    );
  }
}