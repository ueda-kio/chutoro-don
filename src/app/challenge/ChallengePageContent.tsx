'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import type { SongsData, QuizQuestion, ChallengeSession } from '@/types';
import { loadSongsData, generateQuizQuestionsFromSelectedAlbums, generateQuizQuestionsFromAllSongs } from '@/utils/quiz';
import {
  getHighPrecisionTime,
  calculateElapsedTime,
  calculateQuestionScore,
  calculateTotalScore,
  isSongTitleMatch,
} from '@/utils/challenge';
import { saveChallengeResult } from '@/utils/sessionStorage';
import { ChallengeQuizPlayer } from '@/components/ChallengeQuizPlayer';
import { AlbumSelectorModal } from '@/components/Modal';

export function ChallengePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [songsData, setSongsData] = useState<SongsData | null>(null);
  const [challengeSession, setChallengeSession] = useState<ChallengeSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // モーダル関連の状態
  const [selectedArtistId, setSelectedArtistId] = useState('');
  const [selectedAlbumIds, setSelectedAlbumIds] = useState<string[]>([]);
  const [defaultPlayDuration, setDefaultPlayDuration] = useState<number | null>(null);

  useEffect(() => {
    const initializeChallenge = async () => {
      try {
        const data = await loadSongsData();
        setSongsData(data);

        // URLパラメータから設定を取得
        const albumsParam = searchParams.get('albums');
        const defaultDurationParam = searchParams.get('defaultDuration');

        let questions: QuizQuestion[];

        if (albumsParam) {
          // 特定のアルバムが選択されている場合
          const selectedAlbumIds = albumsParam.split(',');
          questions = generateQuizQuestionsFromSelectedAlbums(data, selectedAlbumIds, 10);
        } else {
          // 全曲から出題
          questions = generateQuizQuestionsFromAllSongs(data, 10);
        }

        if (questions.length === 0) {
          setError('クイズ問題を生成できませんでした。');
          return;
        }

        // デフォルト再生時間の設定
        const defaultDuration = defaultDurationParam ? parseFloat(defaultDurationParam) : null;
        setDefaultPlayDuration(defaultDuration);

        // チャレンジセッションを初期化
        const startTime = getHighPrecisionTime();
        const initialSession: ChallengeSession = {
          questions,
          currentQuestionIndex: 0,
          scores: [],
          startTime,
          currentQuestionStartTime: startTime,
          isGameCompleted: false,
          totalScore: 0,
          userAnswer: '',
          isAnswerCorrect: false,
          isAnswerRevealed: false,
        };

        setChallengeSession(initialSession);

        // モーダル用の初期状態設定
        if (data.artists.length > 0) {
          const firstArtist = data.artists[0];
          setSelectedArtistId(firstArtist.id);
          if (albumsParam) {
            setSelectedAlbumIds(albumsParam.split(','));
          } else {
            setSelectedAlbumIds(firstArtist.albums.map((album) => album.id));
          }
        }
      } catch (err) {
        console.error('チャレンジモードの初期化に失敗しました:', err);
        setError('チャレンジモードの初期化に失敗しました。');
      } finally {
        setLoading(false);
      }
    };

    initializeChallenge();
  }, [searchParams]);

  const handleAnswerSubmit = (answer: string, playDuration: number) => {
    if (!challengeSession) return;

    const currentQuestion = challengeSession.questions[challengeSession.currentQuestionIndex];
    const currentTime = getHighPrecisionTime();
    const timeElapsed = calculateElapsedTime(challengeSession.currentQuestionStartTime, currentTime);
    const isCorrect = isSongTitleMatch(answer, currentQuestion.track.title);

    if (isCorrect) {
      // 正解の場合、スコアを計算して次の問題へ
      const questionScore = calculateQuestionScore(
        challengeSession.currentQuestionIndex,
        currentQuestion.track.id,
        timeElapsed,
        playDuration,
        challengeSession.isAnswerRevealed
      );

      const newScores = [...challengeSession.scores, questionScore];
      const totalScore = calculateTotalScore(newScores);
      const isLastQuestion = challengeSession.currentQuestionIndex === challengeSession.questions.length - 1;

      const updatedSession = {
        ...challengeSession,
        scores: newScores,
        totalScore,
        userAnswer: answer,
        isAnswerCorrect: true,
        isGameCompleted: isLastQuestion,
      };

      setChallengeSession(updatedSession);

      if (isLastQuestion) {
        // 最後の問題の場合、結果画面に遷移
        setTimeout(() => {
          saveChallengeResult(updatedSession.totalScore, updatedSession.scores);
          router.push('/challenge/result');
        }, 1500);
      } else {
        // 次の問題に進む
        setTimeout(() => {
          handleNextQuestion();
        }, 1500);
      }
    } else {
      // 不正解の場合、回答をリセット
      setChallengeSession((prev) =>
        prev
          ? {
              ...prev,
              userAnswer: answer,
              isAnswerCorrect: false,
            }
          : null
      );
    }
  };

  const handleRevealAnswer = (playDuration: number) => {
    if (!challengeSession) return;

    const currentTime = getHighPrecisionTime();
    const timeElapsed = calculateElapsedTime(challengeSession.currentQuestionStartTime, currentTime);

    const questionScore = calculateQuestionScore(
      challengeSession.currentQuestionIndex,
      challengeSession.questions[challengeSession.currentQuestionIndex].track.id,
      timeElapsed,
      playDuration,
      true // 答えを表示したのでペナルティ
    );

    const newScores = [...challengeSession.scores, questionScore];
    const totalScore = calculateTotalScore(newScores);
    const isLastQuestion = challengeSession.currentQuestionIndex === challengeSession.questions.length - 1;

    const updatedSession = {
      ...challengeSession,
      scores: newScores,
      totalScore,
      isAnswerRevealed: true,
      isGameCompleted: isLastQuestion,
    };

    setChallengeSession(updatedSession);

    // 最後の問題で答えを表示した場合、結果画面遷移の準備
    if (isLastQuestion) {
      // 次へボタンで結果画面に遷移するため、ここでは何もしない
    }
  };

  const handleNextQuestion = () => {
    if (!challengeSession) return;

    const nextIndex = challengeSession.currentQuestionIndex + 1;

    if (nextIndex >= challengeSession.questions.length || challengeSession.isGameCompleted) {
      // 全問題が完了（10問目で答えを表示した場合もここに到達）
      const updatedSession = {
        ...challengeSession,
        isGameCompleted: true,
      };
      setChallengeSession(updatedSession);

      // スコア表示画面に遷移（最新のスコアを使用）
      setTimeout(() => {
        saveChallengeResult(updatedSession.totalScore, updatedSession.scores);
        router.push('/challenge/result');
      }, 1000);
    } else {
      // 次の問題に進む
      setChallengeSession((prev) =>
        prev
          ? {
              ...prev,
              currentQuestionIndex: nextIndex,
              currentQuestionStartTime: getHighPrecisionTime(),
              userAnswer: '',
              isAnswerCorrect: false,
              isAnswerRevealed: false,
            }
          : null
      );
    }
  };

  // モーダル関連のハンドラー
  const handleArtistChange = (artistId: string) => {
    setSelectedArtistId(artistId);
    setSelectedAlbumIds([]);
  };

  const handleAlbumToggle = (albumId: string) => {
    setSelectedAlbumIds((prev) => (prev.includes(albumId) ? prev.filter((id) => id !== albumId) : [...prev, albumId]));
  };

  const handleSelectAll = () => {
    const selectedArtist = songsData?.artists.find((artist) => artist.id === selectedArtistId);
    if (selectedArtist) {
      setSelectedAlbumIds(selectedArtist.albums.map((album) => album.id));
    }
  };

  const handleDeselectAll = () => {
    setSelectedAlbumIds([]);
  };

  const handleOpenModal = () => {
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
  };

  const handleBackToHome = () => {
    router.push('/');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4" />
          <div className="text-lg text-gray-600">タイムアタックを準備中...</div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg text-red-600 mb-4">{error}</div>
          <button type="button" onClick={handleBackToHome} className="px-6 py-2 bg-red-600 hover:bg-red-700 text-white rounded-md">
            トップに戻る
          </button>
        </div>
      </div>
    );
  }

  if (!challengeSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-lg text-gray-600 mb-4">チャレンジセッションを初期化中...</div>
        </div>
      </div>
    );
  }

  const currentQuestion = challengeSession.questions[challengeSession.currentQuestionIndex];
  const progress = ((challengeSession.currentQuestionIndex + 1) / challengeSession.questions.length) * 100;

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ヘッダー */}
      <header className="bg-white shadow-sm">
        <div className="max-w-4xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-gray-900">中トロドン</h1>
              <span className="text-lg font-semibold text-red-600">タイムアタック</span>
            </div>
            <div className="flex items-center space-x-4">
              <button type="button" onClick={handleOpenModal} className="p-2 text-gray-600 hover:text-gray-900" aria-label="設定">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                  />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <div className="text-right">
                <div className="text-sm text-gray-600">現在のスコア</div>
                <div className="text-lg font-bold text-red-600">{challengeSession.totalScore.toLocaleString()}</div>
              </div>
            </div>
          </div>

          {/* プログレスバー */}
          <div className="mt-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-600">
                Q.{challengeSession.currentQuestionIndex + 1} / {challengeSession.questions.length}
              </span>
              <span className="text-sm text-gray-600">進捗: {Math.round(progress)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div className="bg-red-600 h-2 rounded-full transition-all duration-300" style={{ width: `${progress}%` }} />
            </div>
          </div>
        </div>
      </header>

      {/* メインコンテンツ */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <ChallengeQuizPlayer
          question={currentQuestion}
          onAnswerSubmit={handleAnswerSubmit}
          onRevealAnswer={handleRevealAnswer}
          onNext={handleNextQuestion}
          isLastQuestion={challengeSession.currentQuestionIndex === challengeSession.questions.length - 1}
          defaultPlayDuration={defaultPlayDuration}
          userAnswer={challengeSession.userAnswer}
          isAnswerCorrect={challengeSession.isAnswerCorrect}
          isAnswerRevealed={challengeSession.isAnswerRevealed}
          isGameCompleted={challengeSession.isGameCompleted}
          currentScore={challengeSession.totalScore}
          songsData={songsData}
        />
      </main>

      {/* 設定モーダル */}
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
  );
}
