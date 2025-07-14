'use client';

import { useRouter } from 'next/navigation';

export default function HomePage() {
  const router = useRouter();

  const handleStartQuiz = () => {
    router.push('/quiz');
  };

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="mb-12">
          <h1 className="text-6xl font-bold text-gray-900 mb-6">BUMP 中トロドン</h1>
          <p className="text-2xl text-gray-600 mb-4">曲の中トロを聴いて曲名を当てよう</p>
        </div>
        <button
          type="button"
          onClick={handleStartQuiz}
          className="px-16 py-6 bg-primary-600 hover:bg-primary-700 text-white text-2xl font-bold rounded-lg transform transition hover:scale-105 shadow-lg"
        >
          スタート
        </button>
      </div>
    </div>
  );
}
