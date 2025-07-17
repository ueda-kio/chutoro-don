'use client';

import { useEffect, useState } from 'react';

interface MSWProviderProps {
  children: React.ReactNode;
}

export function MSWProvider({ children }: MSWProviderProps) {
  const [mswReady, setMswReady] = useState(() => {
    // 本番環境では即座にready
    if (process.env.NODE_ENV === 'production') {
      return true;
    }
    // 開発環境でMSW無効化設定の場合も即座にready
    const enableMSW = process.env.NEXT_PUBLIC_ENABLE_MSW === 'true';
    return !enableMSW;
  });

  useEffect(() => {
    // 本番環境では何もしない
    if (process.env.NODE_ENV === 'production') {
      return;
    }

    // 開発環境でMSWが有効な場合のみ初期化
    const enableMSW = process.env.NEXT_PUBLIC_ENABLE_MSW === 'true';

    if (enableMSW) {
      const initMSW = async () => {
        console.log('🔧 MSW initialization started...');

        // ブラウザ環境チェック
        if (typeof window === 'undefined') {
          console.log('🔧 Not in browser environment, skipping MSW');
          setMswReady(true);
          return;
        }

        // サービスワーカーサポートチェック
        if (!('serviceWorker' in navigator)) {
          console.warn('⚠️ Service Worker not supported, skipping MSW');
          setMswReady(true);
          return;
        }

        try {
          console.log('🔧 Importing MSW browser module...');
          const { worker } = await import('@/mocks/browser');

          console.log('🔧 Starting MSW worker...');

          // シンプルな設定でワーカーを開始
          await worker.start({
            onUnhandledRequest: 'bypass',
          });

          console.log('🔶 MSW enabled for development');
        } catch (error) {
          console.error('❌ MSW initialization failed:', error);
          // 詳細なエラー情報を表示
          if (error instanceof Error) {
            console.error('Error message:', error.message);
            console.error('Error name:', error.name);
          }

          // MSWが失敗してもアプリケーションは続行
          console.warn('⚠️ Continuing without MSW - API calls will reach actual endpoints');
        }

        // 成功・失敗に関わらず続行
        console.log('🔧 Setting MSW as ready');
        setMswReady(true);
      };

      // 初期化を遅延実行（Next.jsのハイドレーション後）
      const timer = setTimeout(initMSW, 500);

      return () => {
        clearTimeout(timer);
      };
    }

    // MSWが無効の場合は即座に準備完了
    setMswReady(true);
  }, []);

  // 開発環境でMSWが初期化されるまで待機
  if (!mswReady) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4" />
          <div className="text-lg text-gray-600">初期化中...</div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
