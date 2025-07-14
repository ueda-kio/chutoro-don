'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { SongsData, QuizQuestion } from '@/types';
import { loadSongsData, generateQuizQuestions, generateQuizQuestionsFromAllSongs } from '@/utils/quiz';
import { QuizPlayer } from '@/components/QuizPlayer';
import { AlbumSelectorModal } from '@/components/Modal';
import Link from 'next/link';

export function QuizPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);
  const [songsData, setSongsData] = useState<SongsData | null>(null);
  const [defaultPlayDuration, setDefaultPlayDuration] = useState<number | null>(null);

  // 出題範囲設定モーダル用の状態
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedArtistId, setSelectedArtistId] = useState('');
  const [selectedAlbumIds, setSelectedAlbumIds] = useState<string[]>([]);
  const [pendingQuestions, setPendingQuestions] = useState<QuizQuestion[]>([]);

  useEffect(() => {
    const loadDataAndGenerateQuestions = async () => {
      try {
        const data = await loadSongsData();
        setSongsData(data);

        // デフォルト再生時間のパラメータを取得
        const defaultDurationParam = searchParams.get('defaultDuration');
        if (defaultDurationParam) {
          setDefaultPlayDuration(Number(defaultDurationParam));
        }

        const albumsParam = searchParams.get('albums');

        let quizQuestions: QuizQuestion[];
        let initialAlbumIds: string[] = [];

        if (albumsParam) {
          // 選択されたアルバムIDがある場合
          const selectedAlbumIds = albumsParam.split(',').filter((id) => id.trim());
          if (selectedAlbumIds.length > 0) {
            quizQuestions = generateQuizQuestions(selectedAlbumIds, data, 10);
            initialAlbumIds = selectedAlbumIds;
          } else {
            // アルバムIDが無効な場合は全曲から生成
            quizQuestions = generateQuizQuestionsFromAllSongs(data, 10);
          }
        } else {
          // アルバム選択がない場合は全曲から生成
          quizQuestions = generateQuizQuestionsFromAllSongs(data, 10);
        }

        setQuestions(quizQuestions);
        setSelectedAlbumIds(initialAlbumIds);

        // デフォルトアーティストを設定
        if (data.artists.length > 0) {
          setSelectedArtistId(data.artists[0].id);
        }
      } catch (error) {
        console.error('Failed to load data or generate questions:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    loadDataAndGenerateQuestions();
  }, [router, searchParams]);

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // クイズ終了
      router.push('/');
    }
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);

    // モーダルを閉じる時に新しい問題を生成
    if (songsData && selectedAlbumIds.length > 0 && pendingQuestions.length > 0) {
      setQuestions(pendingQuestions);
      setCurrentQuestionIndex(0); // 最初の問題にリセット
      setPendingQuestions([]);
    }
  };

  const handleArtistChange = (artistId: string) => {
    setSelectedArtistId(artistId);
    setSelectedAlbumIds([]); // アーティスト変更時はアルバム選択をリセット
  };

  const handleAlbumToggle = (albumId: string) => {
    const newSelectedAlbumIds = selectedAlbumIds.includes(albumId)
      ? selectedAlbumIds.filter((id) => id !== albumId)
      : [...selectedAlbumIds, albumId];

    setSelectedAlbumIds(newSelectedAlbumIds);

    // 新しいクイズ問題を生成（プレビュー用）
    if (songsData && newSelectedAlbumIds.length > 0) {
      try {
        const newQuestions = generateQuizQuestions(newSelectedAlbumIds, songsData, 10);
        setPendingQuestions(newQuestions);
      } catch (error) {
        console.error('Failed to generate new questions:', error);
        setPendingQuestions([]);
      }
    } else {
      setPendingQuestions([]);
    }
  };

  const handleSelectAll = () => {
    const selectedArtist = songsData?.artists.find((artist) => artist.id === selectedArtistId);
    if (selectedArtist) {
      const allAlbumIds = selectedArtist.albums.map((album) => album.id);
      setSelectedAlbumIds(allAlbumIds);

      // 新しいクイズ問題を生成（プレビュー用）
      if (songsData) {
        try {
          const newQuestions = generateQuizQuestions(allAlbumIds, songsData, 10);
          setPendingQuestions(newQuestions);
        } catch (error) {
          console.error('Failed to generate new questions:', error);
          setPendingQuestions([]);
        }
      }
    }
  };

  const handleDeselectAll = () => {
    setSelectedAlbumIds([]);
    setPendingQuestions([]);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-lg text-gray-600">クイズを準備中...</div>
      </div>
    );
  }

  if (questions.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-4">クイズの準備に失敗しました</div>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-primary-600 hover:bg-primary-700 text-white rounded-md"
          >
            トップに戻る
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* ヘッダー */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">
              <Link href="/">中トロドン</Link>
            </h1>
            <p className="text-lg text-gray-600">
              Q.{currentQuestionIndex + 1} / {questions.length}
            </p>
          </div>
          {/* 出題範囲設定ボタン */}
          <button
            type="button"
            onClick={handleOpenModal}
            className="p-3 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
            title="出題範囲を設定"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <title>設定</title>
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </button>
        </div>

        {/* クイズプレイヤー */}
        <QuizPlayer 
          question={currentQuestion} 
          onNext={handleNext} 
          isLastQuestion={currentQuestionIndex === questions.length - 1}
          defaultPlayDuration={defaultPlayDuration}
        />

        {/* 出題範囲設定モーダル */}
        {songsData && (
          <AlbumSelectorModal
            isOpen={isModalOpen}
            onClose={handleCloseModal}
            artists={songsData.artists}
            selectedArtistId={selectedArtistId}
            selectedAlbumIds={selectedAlbumIds}
            onArtistChange={handleArtistChange}
            onAlbumToggle={handleAlbumToggle}
            onSelectAll={handleSelectAll}
            onDeselectAll={handleDeselectAll}
            defaultPlayDuration={defaultPlayDuration}
            onDefaultPlayDurationChange={setDefaultPlayDuration}
          />
        )}
      </div>
    </div>
  );
}
