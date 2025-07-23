'use client';

import { useEffect, useState } from 'react';
import type { QuizQuestion, SongsData } from '@/types';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { SongAnswer } from './SongAnswer';
import Image from 'next/image';

interface QuizPlayerProps {
  question: QuizQuestion;
  onNext: () => void;
  isLastQuestion: boolean;
  defaultPlayDuration?: number | null;
  songsData?: SongsData | null;
}

export function QuizPlayer({ question, onNext, isLastQuestion, defaultPlayDuration, songsData }: QuizPlayerProps) {
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [playDuration, setPlayDuration] = useState(defaultPlayDuration ?? 1);
  const [userAnswer, setUserAnswer] = useState<string>('');
  const [isAnswerCorrect, setIsAnswerCorrect] = useState<boolean>(false);
  const [showAnswer, setShowAnswer] = useState(false);
  const [showIncorrectFeedback, setShowIncorrectFeedback] = useState(false);
  const { isReady, isPlayerReady, isPlaying, isVideoLoaded, initializePlayer, playTrack, stopTrack, preloadVideo } = useYouTubePlayer();

  useEffect(() => {
    setIsAnswerRevealed(false);
    setUserAnswer('');
    setIsAnswerCorrect(false);
    setShowAnswer(false);
    setShowIncorrectFeedback(false);
    // デフォルト再生時間が設定されている場合は、そのデフォルト値を使用
    // 未設定の場合は、現在の再生時間を引き継ぐ
    if (defaultPlayDuration !== null && defaultPlayDuration !== undefined) {
      setPlayDuration(defaultPlayDuration);
    }
    // defaultPlayDurationがnullの場合は、現在のplayDurationを維持（引き継ぎ）
  }, [question, defaultPlayDuration]);

  useEffect(() => {
    if (isReady) {
      initializePlayer('youtube-player');
    }
  }, [isReady, initializePlayer]);

  // 問題が変わったら自動的に動画をプリロード
  useEffect(() => {
    if (isPlayerReady && question?.track?.youtubeUrl) {
      preloadVideo(question.track.youtubeUrl);
    }
  }, [question?.track?.youtubeUrl, isPlayerReady, preloadVideo]);

  const handlePlay = () => {
    if (!isPlayerReady) {
      console.warn('Player not ready yet');
      return;
    }

    if (isPlaying) {
      stopTrack();
    } else {
      playTrack(question.track.youtubeUrl, question.startTime, playDuration);
    }
  };

  const handleRevealAnswer = () => {
    setIsAnswerRevealed(true);
    setShowAnswer(true);
    // 答えを表示時も5秒間自動再生
    if (isPlayerReady) {
      playTrack(question.track.youtubeUrl, question.startTime, 5);
    }
  };

  const handleAnswerConfirm = (isCorrect: boolean, answer: string) => {
    setUserAnswer(answer);
    setIsAnswerCorrect(isCorrect);

    // 正解時のみ完全に解答を表示
    if (isCorrect) {
      setShowAnswer(true);
      setIsAnswerRevealed(true);
      // 正解時は5秒間自動再生
      if (isPlayerReady) {
        playTrack(question.track.youtubeUrl, question.startTime, 5);
      }
    } else {
      // 不正解時は不正解フィードバックを表示し、2秒後に自動的に消す
      setShowIncorrectFeedback(true);
      stopTrack();

      // 2秒後に不正解フィードバックを自動的に消す
      setTimeout(() => {
        setShowIncorrectFeedback(false);
        setUserAnswer('');
        setIsAnswerCorrect(false);
      }, 2000);
    }
  };

  const handleNext = () => {
    stopTrack();
    onNext();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* YouTube Player (非表示) */}
      <div style={{ position: 'absolute', left: '-9999px' }}>
        <div id="youtube-player" />
      </div>

      {/* 再生コントロール */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center space-x-4 mb-4">
          <button
            type="button"
            onClick={handlePlay}
            disabled={!isPlayerReady || !isVideoLoaded}
            className="flex items-center justify-center w-16 h-16 bg-primary-600 hover:bg-primary-700 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          >
            {isPlaying ? (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20" role="img" aria-label="一時停止">
                <title>一時停止</title>
                <path
                  fillRule="evenodd"
                  d="M6 4a1 1 0 011 1v10a1 1 0 01-2 0V5a1 1 0 011-1zm4 0a1 1 0 011 1v10a1 1 0 01-2 0V5a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
            ) : (
              <svg className="w-8 h-8" fill="currentColor" viewBox="0 0 20 20" role="img" aria-label="再生">
                <title>再生</title>
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>

          <div>
            <label htmlFor="duration-select" className="block text-sm font-medium text-gray-700 mb-1">
              再生時間
            </label>
            <select
              id="duration-select"
              value={playDuration}
              onChange={(e) => setPlayDuration(Number(e.target.value))}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value={1}>1秒</option>
              <option value={1.5}>1.5秒</option>
              <option value={2}>2秒</option>
              <option value={3}>3秒</option>
              <option value={5}>5秒</option>
            </select>
          </div>
        </div>

        {/* 注意文言 */}
        <div className="text-center mt-3 mb-4">
          <p className="text-xs text-gray-400">※ 1曲目は再生に時間がかかる場合があります</p>
        </div>
      </div>

      {/* 楽曲回答機能 */}
      {!showAnswer && !isAnswerRevealed && (
        <SongAnswer
          disabled={!isPlayerReady}
          isChallenge={false}
          onAnswerConfirm={handleAnswerConfirm}
          onRevealAnswer={handleRevealAnswer}
          correctAnswer={question.track.title}
          songsData={songsData}
          placeholder="楽曲名を入力..."
          submitButtonText="回答する"
          revealButtonText="答えを表示"
        />
      )}

      {/* 不正解フィードバック */}
      {showIncorrectFeedback && !isAnswerRevealed && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="p-4 rounded-md">
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <title>不正解</title>
                  <path
                    fillRule="evenodd"
                    d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                    clipRule="evenodd"
                  />
                </svg>
                <span className="text-red-800 font-medium">不正解</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 解答エリア */}
      {isAnswerRevealed && (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          {/* 正解メッセージ */}
          {isAnswerCorrect && userAnswer && (
            <div className="mb-6">
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center justify-center">
                  <svg className="w-6 h-6 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <title>正解</title>
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-green-800 font-bold text-lg">正解！</span>
                </div>
                <p className="text-green-700 mt-2">回答: {userAnswer}</p>
                {isPlaying && (
                  <div className="flex items-center justify-center mt-3">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                    <span className="text-green-600 ml-2 text-sm">楽曲を再生中...</span>
                  </div>
                )}
              </div>
            </div>
          )}

          <div className="mb-4">
            <Image
              src={question.album.jacketUrl}
              alt={question.album.name}
              width={200}
              height={200}
              className="mx-auto rounded-lg shadow-md"
            />
          </div>

          {/* 解答表示時の再生中インジケーター */}
          {isPlaying && !isAnswerCorrect && (
            <div className="flex items-center justify-center mb-4">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <div className="w-2 h-2 bg-primary-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-primary-600 ml-2 text-sm">楽曲を再生中...</span>
            </div>
          )}

          <h2 className="text-2xl font-bold text-gray-900 mb-2">{question.track.title}</h2>
          <p className="text-lg text-gray-600 mb-1">{question.artist.name}</p>
          <p className="text-md text-gray-500">{question.album.name}</p>
        </div>
      )}

      {/* 次へボタン */}
      <div className="text-center">
        <button
          type="button"
          onClick={handleNext}
          disabled={!showAnswer}
          className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLastQuestion ? 'クイズ終了' : '次へ'}
        </button>
      </div>
    </div>
  );
}
