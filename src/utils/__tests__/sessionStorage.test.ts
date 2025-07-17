import { saveChallengeResult, getChallengeResult, clearChallengeResult } from '../sessionStorage';
import type { ChallengeScore } from '@/types';

// SessionStorageのモック
const mockSessionStorage = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
  length: 0,
  key: jest.fn(),
};

// グローバルオブジェクトのモック
Object.defineProperty(window, 'sessionStorage', {
  value: mockSessionStorage,
  writable: true,
});

describe('SessionStorage Utilities', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('saveChallengeResult', () => {
    it('チャレンジ結果を正しく保存する', () => {
      const scores: ChallengeScore[] = [
        {
          questionIndex: 0,
          trackId: 'track001',
          timeBonus: 200,
          playDurationBonus: 500,
          revealPenalty: 0,
          totalScore: 1700,
          timeElapsed: 10,
          playDuration: 1,
          wasRevealed: false,
        },
      ];
      const totalScore = 1700;

      saveChallengeResult(totalScore, scores);

      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'challengeResult',
        expect.stringContaining('"totalScore":1700')
      );
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'challengeResult',
        expect.stringContaining('"scores":[')
      );
      expect(mockSessionStorage.setItem).toHaveBeenCalledWith(
        'challengeResult',
        expect.stringContaining('"timestamp":')
      );
    });

    it('SessionStorageエラー時にコンソールエラーを出力する', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSessionStorage.setItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      saveChallengeResult(1000, []);

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to save challenge result to sessionStorage:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('getChallengeResult', () => {
    it('保存されたチャレンジ結果を正しく取得する', () => {
      const mockResult = {
        totalScore: 1700,
        scores: [
          {
            questionIndex: 0,
            trackId: 'track001',
            timeBonus: 200,
            playDurationBonus: 500,
            revealPenalty: 0,
            totalScore: 1700,
            timeElapsed: 10,
            playDuration: 1,
            wasRevealed: false,
          },
        ],
        timestamp: Date.now(),
      };

      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(mockResult));

      const result = getChallengeResult();

      expect(mockSessionStorage.getItem).toHaveBeenCalledWith('challengeResult');
      expect(result).toEqual(mockResult);
    });

    it('データが存在しない場合はnullを返す', () => {
      mockSessionStorage.getItem.mockReturnValue(null);

      const result = getChallengeResult();

      expect(result).toBeNull();
    });

    it('古いデータ（5分以上前）の場合はnullを返し、データを削除する', () => {
      const oldTimestamp = Date.now() - 6 * 60 * 1000; // 6分前
      const mockResult = {
        totalScore: 1700,
        scores: [],
        timestamp: oldTimestamp,
      };

      mockSessionStorage.getItem.mockReturnValue(JSON.stringify(mockResult));

      const result = getChallengeResult();

      expect(result).toBeNull();
      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('challengeResult');
    });

    it('JSON解析エラー時にコンソールエラーを出力し、nullを返す', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSessionStorage.getItem.mockReturnValue('invalid json');

      const result = getChallengeResult();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to get challenge result from sessionStorage:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });

  describe('clearChallengeResult', () => {
    it('チャレンジ結果を正しく削除する', () => {
      clearChallengeResult();

      expect(mockSessionStorage.removeItem).toHaveBeenCalledWith('challengeResult');
    });

    it('SessionStorageエラー時にコンソールエラーを出力する', () => {
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      mockSessionStorage.removeItem.mockImplementation(() => {
        throw new Error('Storage error');
      });

      clearChallengeResult();

      expect(consoleSpy).toHaveBeenCalledWith(
        'Failed to clear challenge result from sessionStorage:',
        expect.any(Error)
      );
      consoleSpy.mockRestore();
    });
  });
});