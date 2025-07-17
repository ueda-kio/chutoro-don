import { setupWorker } from 'msw/browser';
import { handlers } from './handlers';

// ブラウザ環境でのMSWワーカーをセットアップ
export const worker = setupWorker(...handlers);