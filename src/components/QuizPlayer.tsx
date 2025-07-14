'use client';

import { useEffect, useState } from 'react';
import type { QuizQuestion } from '@/types';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import Image from 'next/image';

interface QuizPlayerProps {
  question: QuizQuestion;
  onNext: () => void;
  isLastQuestion: boolean;
}

export function QuizPlayer({ question, onNext, isLastQuestion }: QuizPlayerProps) {
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [playDuration, setPlayDuration] = useState(1); // デフォルト1秒
  const { isReady, isPlayerReady, isPlaying, initializePlayer, playTrack, stopTrack } = useYouTubePlayer();

  useEffect(() => {
    setIsAnswerRevealed(false);
    setPlayDuration(1); // 次の問題でデフォルトの1秒に戻す
  }, [question]);

  useEffect(() => {
    if (isReady) {
      initializePlayer('youtube-player');
    }
  }, [isReady, initializePlayer]);

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
    stopTrack();
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
            disabled={!isPlayerReady}
            className="flex items-center justify-center w-16 h-16 bg-primary-600 hover:bg-primary-700 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
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

        <div className="text-center">
          <button
            type="button"
            onClick={handleRevealAnswer}
            disabled={isAnswerRevealed}
            className="px-6 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAnswerRevealed ? '答えを表示済み' : '答えを表示'}
          </button>
        </div>
      </div>

      {/* 解答エリア */}
      {isAnswerRevealed && (
        <div className="bg-white rounded-lg shadow-md p-6 text-center">
          <div className="mb-4">
            <Image
              src={question.album.jacketUrl}
              alt={question.album.name}
              width={200}
              height={200}
              className="mx-auto rounded-lg shadow-md"
            />
          </div>
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
          disabled={!isAnswerRevealed}
          className="px-8 py-3 bg-primary-600 hover:bg-primary-700 text-white rounded-md disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isLastQuestion ? 'クイズ終了' : '次へ'}
        </button>
      </div>
    </div>
  );
}
