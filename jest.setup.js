import '@testing-library/jest-dom';

// MSW用のポリフィル
import { TextEncoder, TextDecoder } from 'util';
import 'whatwg-fetch';

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// MSWのテスト設定は一旦コメントアウト（開発環境のAPIモッキングは動作する）
// import { server } from './src/mocks/node';

// // テスト実行前にMSWサーバーを起動
// beforeAll(() => {
//   server.listen({ onUnhandledRequest: 'error' });
// });

// // 各テスト後にハンドラーをリセット
// afterEach(() => {
//   server.resetHandlers();
// });

// // テスト終了後にMSWサーバーを停止
// afterAll(() => {
//   server.close();
// });
