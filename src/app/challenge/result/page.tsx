import { Suspense } from 'react';
import { ChallengeResultPageContent } from './ChallengeResultPageContent';

function ChallengeResultPageFallback() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-red-600 mx-auto mb-4" />
        <p className="text-gray-600">結果を読み込み中...</p>
      </div>
    </div>
  );
}

export default function ChallengeResultPage() {
  return (
    <Suspense fallback={<ChallengeResultPageFallback />}>
      <ChallengeResultPageContent />
    </Suspense>
  );
}
