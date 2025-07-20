'use client';

import { useState } from 'react';
import type { SongsData, Track } from '@/types';
import { SelectionAnswerModal } from './SelectionAnswerModal';

interface SongAnswerProps {
  // 基本設定
  disabled?: boolean;
  // チャレンジモード向けプロパティ
  isChallenge?: boolean;
  onAnswerSubmit?: (answer: string) => void;
  onRevealAnswer?: () => void;
  // のんびりモード向けプロパティ
  onAnswerConfirm?: (isCorrect: boolean, answer: string) => void;
  correctAnswer?: string;
  // 共通プロパティ
  songsData?: SongsData | null;
  placeholder?: string;
  submitButtonText?: string;
  revealButtonText?: string;
}

export function SongAnswer({
  disabled = false,
  isChallenge = false,
  onAnswerSubmit,
  onRevealAnswer,
  onAnswerConfirm,
  correctAnswer,
  songsData,
  placeholder = "楽曲名を入力...",
  submitButtonText = "回答する",
  revealButtonText = "答えを表示",
}: SongAnswerProps) {
  const [inputValue, setInputValue] = useState('');
  const [answerMode, setAnswerMode] = useState<'text' | 'selection'>('text');
  const [isSelectionModalOpen, setIsSelectionModalOpen] = useState(false);

  // テキスト入力での回答処理
  const handleTextSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    if (isChallenge && onAnswerSubmit) {
      // チャレンジモード: そのまま回答を送信
      onAnswerSubmit(inputValue.trim());
    } else if (!isChallenge && onAnswerConfirm && correctAnswer) {
      // のんびりモード: 正誤判定を行って結果を送信
      const normalizedInput = normalizeString(inputValue.trim());
      const normalizedCorrect = normalizeString(correctAnswer);
      const isCorrect = normalizedInput === normalizedCorrect;
      onAnswerConfirm(isCorrect, inputValue.trim());
    }
  };

  // 選択式での回答処理
  const handleSelectionSubmit = (selectedTrack: Track) => {
    setIsSelectionModalOpen(false);
    
    if (isChallenge && onAnswerSubmit) {
      // チャレンジモード: そのまま回答を送信
      onAnswerSubmit(selectedTrack.title);
    } else if (!isChallenge && onAnswerConfirm && correctAnswer) {
      // のんびりモード: 正誤判定を行って結果を送信
      const normalizedSelected = normalizeString(selectedTrack.title);
      const normalizedCorrect = normalizeString(correctAnswer);
      const isCorrect = normalizedSelected === normalizedCorrect;
      onAnswerConfirm(isCorrect, selectedTrack.title);
    }
  };

  // 答えを表示ボタンの処理
  const handleReveal = () => {
    if (onRevealAnswer) {
      onRevealAnswer();
    }
  };

  // 選択式モーダルを開く
  const handleOpenSelectionModal = () => {
    setIsSelectionModalOpen(true);
  };

  // 文字列正規化関数（チャレンジモードのロジックを流用）
  const normalizeString = (str: string): string => {
    return str
      .toLowerCase()
      .replace(/[Ａ-Ｚａ-ｚ０-９]/g, (s) => String.fromCharCode(s.charCodeAt(0) - 0xfee0))
      .replace(/\s+/g, '')
      .trim();
  };

  return (
    <div className="bg-white rounded-lg shadow-md p-6">
      {/* 回答方式選択タブ */}
      <div className="mb-4">
        <div className="flex items-center justify-center space-x-1 bg-gray-100 p-1 rounded-lg">
          <button
            type="button"
            onClick={() => setAnswerMode('text')}
            disabled={disabled}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${
              answerMode === 'text' 
                ? `bg-white shadow-sm ${isChallenge ? 'text-red-600' : 'text-primary-600'}` 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            テキスト入力
          </button>
          <button
            type="button"
            onClick={() => setAnswerMode('selection')}
            disabled={disabled}
            className={`px-4 py-2 text-sm font-medium rounded-md transition-colors disabled:opacity-50 ${
              answerMode === 'selection' 
                ? `bg-white shadow-sm ${isChallenge ? 'text-red-600' : 'text-primary-600'}` 
                : 'text-gray-600 hover:text-gray-800'
            }`}
          >
            選択式
          </button>
        </div>
      </div>

      {/* 回答フォーム */}
      {answerMode === 'text' ? (
        <form onSubmit={handleTextSubmit} className="space-y-4">
          <div>
            <label htmlFor="answer-input" className="block text-sm font-medium text-gray-700 mb-2">
              楽曲名を入力してください
            </label>
            <input
              id="answer-input"
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={disabled}
              placeholder={placeholder}
              className={`w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm text-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                isChallenge 
                  ? 'focus:ring-red-500 focus:border-red-500'
                  : 'focus:ring-primary-500 focus:border-primary-500'
              }`}
              autoComplete="off"
            />
          </div>

          <div className="flex space-x-3">
            <button
              type="submit"
              disabled={!inputValue.trim() || disabled}
              className={`flex-1 px-6 py-3 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                isChallenge 
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              {submitButtonText}
            </button>
            {onRevealAnswer && (
              <button
                type="button"
                onClick={handleReveal}
                disabled={disabled}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {revealButtonText}
              </button>
            )}
          </div>
        </form>
      ) : (
        <div className="space-y-4">
          <div>
            <span className="block text-sm font-medium text-gray-700 mb-2">楽曲を選択してください</span>
            <button
              type="button"
              onClick={handleOpenSelectionModal}
              disabled={disabled}
              className={`w-full px-4 py-3 border border-gray-300 rounded-md shadow-sm hover:bg-gray-50 text-lg text-left disabled:opacity-50 disabled:cursor-not-allowed ${
                isChallenge 
                  ? 'focus:ring-red-500 focus:border-red-500'
                  : 'focus:ring-primary-500 focus:border-primary-500'
              }`}
            >
              <span className="text-gray-500">アルバム・楽曲を選択...</span>
            </button>
          </div>

          <div className="flex space-x-3">
            <button
              type="button"
              onClick={handleOpenSelectionModal}
              disabled={disabled}
              className={`flex-1 px-6 py-3 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed ${
                isChallenge 
                  ? 'bg-red-600 hover:bg-red-700'
                  : 'bg-primary-600 hover:bg-primary-700'
              }`}
            >
              楽曲を選択して回答
            </button>
            {onRevealAnswer && (
              <button
                type="button"
                onClick={handleReveal}
                disabled={disabled}
                className="px-6 py-3 bg-gray-600 hover:bg-gray-700 text-white rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {revealButtonText}
              </button>
            )}
          </div>
        </div>
      )}

      {/* 選択式回答モーダル */}
      {songsData && (
        <SelectionAnswerModal
          isOpen={isSelectionModalOpen}
          onClose={() => setIsSelectionModalOpen(false)}
          onSubmit={handleSelectionSubmit}
          songsData={songsData}
        />
      )}
    </div>
  );
}