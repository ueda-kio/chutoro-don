'use client';

import { useEffect, useState } from 'react';
import type { QuizQuestion, SongsData, Track } from '@/types';
import { useYouTubePlayer } from '@/hooks/useYouTubePlayer';
import { getHighPrecisionTime, calculateElapsedTime } from '@/utils/challenge';
import { SelectionAnswerModal } from './SelectionAnswerModal';
import Image from 'next/image';

interface ChallengeQuizPlayerProps {
  question: QuizQuestion;
  onAnswerSubmit: (answer: string, playDuration: number) => void;
  onRevealAnswer: (playDuration: number) => void;
  onNext: () => void;
  isLastQuestion: boolean;
  defaultPlayDuration?: number | null;
  userAnswer: string;
  isAnswerCorrect: boolean;
  isAnswerRevealed: boolean;
  isGameCompleted: boolean;
  currentScore: number;
  songsData: SongsData | null;
}

export function ChallengeQuizPlayer({
  question,
  onAnswerSubmit,
  onRevealAnswer,
  onNext,
  isLastQuestion,
  defaultPlayDuration,
  userAnswer,
  isAnswerCorrect,
  isAnswerRevealed,
  currentScore,
  songsData,
}: ChallengeQuizPlayerProps) {
  const [playDuration, setPlayDuration] = useState(defaultPlayDuration ?? 1);
  const [inputValue, setInputValue] = useState('');
  const [questionStartTime, setQuestionStartTime] = useState(getHighPrecisionTime());
  const [elapsedTime, setElapsedTime] = useState(0);
  const [showFeedback, setShowFeedback] = useState(false);
  const [actualPlayDuration, setActualPlayDuration] = useState(defaultPlayDuration ?? 1);
  const [answerMode, setAnswerMode] = useState<'text' | 'selection'>('text');
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);
  const { isReady, isPlayerReady, isPlaying, initializePlayer, playTrack, stopTrack } = useYouTubePlayer();

  // 時間更新のタイマー
  useEffect(() => {
    // 正解済みまたは回答が表示済みの場合は、タイマーを停止
    if (isAnswerCorrect || isAnswerRevealed) {
      return;
    }

    const timer = setInterval(() => {
      const currentTime = getHighPrecisionTime();
      const elapsed = calculateElapsedTime(questionStartTime, currentTime);
      setElapsedTime(elapsed);
    }, 100);

    return () => clearInterval(timer);
  }, [questionStartTime, isAnswerCorrect, isAnswerRevealed]);

  // 問題変更時の初期化
  useEffect(() => {
    setInputValue('');
    setQuestionStartTime(getHighPrecisionTime());
    setElapsedTime(0);
    setShowFeedback(false);

    // デフォルト再生時間が設定されている場合は、そのデフォルト値を使用
    if (defaultPlayDuration !== null && defaultPlayDuration !== undefined) {
      setPlayDuration(defaultPlayDuration);
      setActualPlayDuration(defaultPlayDuration);
    }
  }, [question.track.id, defaultPlayDuration]);

  // 回答結果の表示
  useEffect(() => {
    if (isAnswerCorrect || isAnswerRevealed || userAnswer) {
      setShowFeedback(true);
    }
  }, [isAnswerCorrect, isAnswerRevealed, userAnswer]);

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
      // 再生時に実際の再生時間を記録
      setActualPlayDuration(playDuration);
      playTrack(question.track.youtubeUrl, question.startTime, playDuration);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputValue.trim()) {
      onAnswerSubmit(inputValue.trim(), actualPlayDuration);
    }
  };

  const handleReveal = () => {
    stopTrack();
    onRevealAnswer(actualPlayDuration);
  };

  const handleNext = () => {
    stopTrack();
    onNext();
  };

  const handleSelectionSubmit = (selectedTrack: Track) => {
    onAnswerSubmit(selectedTrack.title, actualPlayDuration);
    setIsSelectionModalOpen(false);
  };

  const handleOpenSelectionModal = () => {
    setIsSelectionModalOpen(true);
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* YouTube Player (非表示) */}
      <div style={{ position: 'absolute', left: '-9999px' }}>
        <div id="youtube-player" />
      </div>

      {/* 時間表示 */}
      <div className="bg-white rounded-lg shadow-md p-4">
        <div className="flex items-center justify-between">
          <div className="text-center">
            <div className="text-sm text-gray-600">経過時間</div>
            <div className="text-2xl font-bold text-gray-900">{formatTime(elapsedTime)}</div>
          </div>
          <div className="text-center">
            <div className="text-sm text-gray-600">現在のスコア</div>
            <div className="text-2xl font-bold text-red-600">{currentScore.toLocaleString()}</div>
          </div>
        </div>
      </div>

      {/* 再生コントロール */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex items-center justify-center space-x-4 mb-4">
          <button
            type="button"
            onClick={handlePlay}
            disabled={!isPlayerReady || isAnswerCorrect || isAnswerRevealed}
            className="flex items-center justify-center w-16 h-16 bg-red-600 hover:bg-red-700 text-white rounded-full disabled:opacity-50 disabled:cursor-not-allowed"
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
              disabled={isAnswerCorrect || isAnswerRevealed}
              className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <option value={1}>1秒 (+500pt)</option>
              <option value={1.5}>1.5秒 (+300pt)</option>
              <option value={2}>2秒 (+100pt)</option>
              <option value={3}>3秒 (+0pt)</option>
              <option value={5}>5秒 (-100pt)</option>
            </select>
          </div>
        </div>

        {/* 注意文言とスコア計算に使用される再生時間 */}
        <div className="text-center mt-3 mb-4">
          <p className="text-xs text-gray-400">※ 1曲目は再生に時間がかかる場合があります</p>
          {actualPlayDuration !== playDuration && (
            <p className="text-sm text-orange-600 mt-1">スコア計算に使用される再生時間: {actualPlayDuration}秒</p>
          )}
        </div>
      </div>

      {/* 回答方式選択 */}
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="mb-4">
          <div className="flex items-center justify-center space-x-1 bg-gray-100 p-1 rounded-lg">
            <button
              type="button"
              onClick={() => setAnswerMode('text')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                answerMode === 'text' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              テキスト入力
            </button>
            <button
              type="button"
              onClick={() => setAnswerMode('selection')}
              className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                answerMode === 'selection' ? 'bg-white text-red-600 shadow-sm' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              選択式
            </button>
          </div>
        </div>

        {answerMode === 'text' ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label htmlFor="answer-input" className="block text-sm font-medium text-gray-700 mb-2">
                楽曲名を入力してください
              </label>
              <input
                id="answer-input"
                type="text"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                disabled={isAnswerCorrect || isAnswerRevealed}
                placeholder="楽曲名を入力..."
                className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm focus:ring-red-500 focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-lg"
                autoComplete="off"
              />
            </div>

            <div className="flex space-x-3">
              <button
                type="submit"
                disabled={!inputValue.trim() || isAnswerCorrect || isAnswerRevealed}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                回答する
              </button>
              <button
                type="button"
                onClick={handleReveal}
                disabled={isAnswerCorrect || isAnswerRevealed}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                答えを表示 (-1000pt)
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-4">
            <div>
              <span className="block text-sm font-medium text-gray-700 mb-2">楽曲を選択してください</span>
              <button
                type="button"
                onClick={handleOpenSelectionModal}
                disabled={isAnswerCorrect || isAnswerRevealed}
                className="w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 focus:ring-red-500 focus:border-red-500 disabled:opacity-50 disabled:cursor-not-allowed text-lg text-left"
              >
                <span className="text-gray-500">アルバム・楽曲を選択...</span>
              </button>
            </div>

            <div className="flex space-x-3">
              <button
                type="button"
                onClick={handleOpenSelectionModal}
                disabled={isAnswerCorrect || isAnswerRevealed}
                className="flex-1 px-6 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                楽曲を選択して回答
              </button>
              <button
                type="button"
                onClick={handleReveal}
                disabled={isAnswerCorrect || isAnswerRevealed}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                答えを表示 (-1000pt)
              </button>
            </div>
          </div>
        )}
      </div>

      {/* 選択式回答モーダル */}
      <SelectionAnswerModal
        isOpen={isSelectionModalOpen}
        onClose={() => setIsSelectionModalOpen(false)}
        onSubmit={handleSelectionSubmit}
        songsData={songsData}
      />

      {/* フィードバック表示 */}
      {showFeedback && (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="p-4 rounded-md">
            {isAnswerCorrect && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <div className="flex items-center">
                  {/* biome-ignore lint/a11y/noSvgWithoutTitle: */}
                  <svg className="w-5 h-5 text-green-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-green-800 font-medium">正解！</span>
                </div>
                <p className="text-green-700 mt-1">回答: {userAnswer}</p>
              </div>
            )}
            {!isAnswerCorrect && (inputValue || answerMode === 'selection') && userAnswer && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex items-center">
                  {/* biome-ignore lint/a11y/noSvgWithoutTitle: */}
                  <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                    <path
                      fillRule="evenodd"
                      d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-red-800 font-medium">不正解</span>
                </div>
                <p className="text-red-700 mt-1">もう一度チャレンジしてみてください</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* 解答エリア */}
      {(isAnswerCorrect || isAnswerRevealed) && (
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
      {(isAnswerCorrect || isAnswerRevealed) && (
        <div className="text-center">
          <button type="button" onClick={handleNext} className="px-8 py-3 bg-red-600 hover:bg-red-700 text-white rounded-md font-medium">
            {isLastQuestion ? 'スコア確認' : '次の問題'}
          </button>
        </div>
      )}
    </div>
  );
}
