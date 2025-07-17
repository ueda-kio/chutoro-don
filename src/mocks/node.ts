import { setupServer } from 'msw/node';
import { handlers } from './handlers';

// Node.js環境（テスト）でのMSWサーバーをセットアップ
export const server = setupServer(...handlers);