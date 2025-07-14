'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import type { SongsData, QuizQuestion } from '@/types';
import { loadSongsData, generateQuizQuestionsFromAllSongs } from '@/utils/quiz';
import { QuizPlayer } from '@/components/QuizPlayer';
import Link from 'next/link';

export function QuizPageContent() {
  const router = useRouter();
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDataAndGenerateQuestions = async () => {
      try {
        const data = await loadSongsData();
        const quizQuestions = generateQuizQuestionsFromAllSongs(data, 10);
        setQuestions(quizQuestions);
      } catch (error) {
        console.error('Failed to load data or generate questions:', error);
        router.push('/');
      } finally {
        setLoading(false);
      }
    };

    loadDataAndGenerateQuestions();
  }, [router]);

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      // クイズ終了
      router.push('/');
    }
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
        </div>

        {/* クイズプレイヤー */}
        <QuizPlayer question={currentQuestion} onNext={handleNext} isLastQuestion={currentQuestionIndex === questions.length - 1} />
      </div>
    </div>
  );
}
