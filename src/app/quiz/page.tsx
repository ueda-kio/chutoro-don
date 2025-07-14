'use client';

import { Suspense } from 'react';
import { QuizPageContent } from './QuizPageContent';

export default function QuizPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-lg text-gray-600">クイズを準備中...</div>
        </div>
      }
    >
      <QuizPageContent />
    </Suspense>
  );
}
