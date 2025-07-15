import {
  normalizeSongTitle,
  isSongTitleMatch,
  calculatePlayDurationBonus,
  calculateTimeBonus,
  calculateQuestionScore,
  calculateTotalScore,
  getScoreRank,
  getScoreMessage,
  calculateElapsedTime,
  getHighPrecisionTime,
} from '../challenge';

describe('チャレンジモード - ユーティリティ関数', () => {
  describe('normalizeSongTitle', () => {
    it('大文字小文字を統一する', () => {
      expect(normalizeSongTitle('HELLO WORLD')).toBe('helloworld');
      expect(normalizeSongTitle('hello world')).toBe('helloworld');
      expect(normalizeSongTitle('Hello World')).toBe('helloworld');
    });

    it('全角文字を半角に変換する', () => {
      expect(normalizeSongTitle('ＨＥＬＬＯ')).toBe('hello');
      expect(normalizeSongTitle('１２３')).toBe('123');
    });

    it('空白を削除する', () => {
      expect(normalizeSongTitle('  hello   world  ')).toBe('helloworld');
      expect(normalizeSongTitle('hello\t\nworld')).toBe('helloworld');
    });

    it('複合的な正規化を行う', () => {
      expect(normalizeSongTitle('  ＨＥＬＬＯ　　ＷＯＲＬＤ  ')).toBe('helloworld');
    });
  });

  describe('isSongTitleMatch', () => {
    it('完全一致する場合はtrueを返す', () => {
      expect(isSongTitleMatch('hello world', 'hello world')).toBe(true);
      expect(isSongTitleMatch('HELLO WORLD', 'hello world')).toBe(true);
      expect(isSongTitleMatch('  hello   world  ', 'hello world')).toBe(true);
    });

    it('一致しない場合はfalseを返す', () => {
      expect(isSongTitleMatch('hello world', 'hello universe')).toBe(false);
      expect(isSongTitleMatch('hello', 'hello world')).toBe(false);
    });

    it('日本語の楽曲名でも正しく判定する', () => {
      expect(isSongTitleMatch('君の名は', '君の名は')).toBe(true);
      expect(isSongTitleMatch('君の名は', '君の名前')).toBe(false);
    });
  });

  describe('calculatePlayDurationBonus', () => {
    it('再生時間に応じて正しいボーナスを計算する', () => {
      expect(calculatePlayDurationBonus(1)).toBe(200);
      expect(calculatePlayDurationBonus(1.5)).toBe(150);
      expect(calculatePlayDurationBonus(2)).toBe(100);
      expect(calculatePlayDurationBonus(3)).toBe(50);
      expect(calculatePlayDurationBonus(5)).toBe(0);
    });

    it('定義されていない再生時間の場合は0を返す', () => {
      expect(calculatePlayDurationBonus(4)).toBe(0);
      expect(calculatePlayDurationBonus(10)).toBe(0);
    });
  });

  describe('calculateTimeBonus', () => {
    it('10秒以内の場合は減点なし', () => {
      expect(calculateTimeBonus(5)).toBe(0);
      expect(calculateTimeBonus(10)).toBe(0);
    });

    it('10秒から30秒の場合は徐々に減点', () => {
      expect(calculateTimeBonus(20)).toBe(-100); // 中間点
      expect(calculateTimeBonus(30)).toBe(-200); // 最大減点
    });

    it('30秒以上の場合は最大減点', () => {
      expect(calculateTimeBonus(31)).toBe(-200);
      expect(calculateTimeBonus(60)).toBe(-200);
    });
  });

  describe('calculateQuestionScore', () => {
    it('基本的なスコア計算が正しく行われる', () => {
      const score = calculateQuestionScore(0, 20, 2, false);
      expect(score.baseScore).toBe(1000);
      expect(score.timeBonus).toBe(0); // 30秒以内
      expect(score.playDurationBonus).toBe(100); // 2秒
      expect(score.revealPenalty).toBe(0); // 答え表示なし
      expect(score.totalScore).toBe(1100);
    });

    it('答えを表示した場合はペナルティが適用される', () => {
      const score = calculateQuestionScore(0, 20, 2, true);
      expect(score.revealPenalty).toBe(-500);
      expect(score.totalScore).toBe(600); // 1000 + 0 + 100 - 500
    });

    it('時間超過の場合は減点される', () => {
      const score = calculateQuestionScore(0, 90, 1, false);
      expect(score.timeBonus).toBe(-200);
      expect(score.totalScore).toBe(1000); // 1000 - 200 + 200
    });

    it('スコアが0を下回らない', () => {
      const score = calculateQuestionScore(0, 120, 5, true);
      expect(score.totalScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateTotalScore', () => {
    it('複数のスコアを正しく合計する', () => {
      const scores = [
        { questionIndex: 0, baseScore: 1000, timeBonus: 0, playDurationBonus: 200, revealPenalty: 0, totalScore: 1200, timeElapsed: 20, playDuration: 1, wasRevealed: false },
        { questionIndex: 1, baseScore: 1000, timeBonus: -100, playDurationBonus: 150, revealPenalty: 0, totalScore: 1050, timeElapsed: 45, playDuration: 1.5, wasRevealed: false },
        { questionIndex: 2, baseScore: 1000, timeBonus: 0, playDurationBonus: 100, revealPenalty: -500, totalScore: 600, timeElapsed: 25, playDuration: 2, wasRevealed: true },
      ];

      expect(calculateTotalScore(scores)).toBe(2850);
    });

    it('空の配列の場合は0を返す', () => {
      expect(calculateTotalScore([])).toBe(0);
    });
  });

  describe('getScoreRank', () => {
    it('スコアに応じて正しいランクを返す', () => {
      expect(getScoreRank(9500, 10000)).toBe('S'); // 95%
      expect(getScoreRank(8500, 10000)).toBe('A'); // 85%
      expect(getScoreRank(7500, 10000)).toBe('B'); // 75%
      expect(getScoreRank(6500, 10000)).toBe('C'); // 65%
      expect(getScoreRank(5500, 10000)).toBe('D'); // 55%
      expect(getScoreRank(4500, 10000)).toBe('F'); // 45%
    });

    it('境界値で正しく判定する', () => {
      expect(getScoreRank(9000, 10000)).toBe('S'); // 90%
      expect(getScoreRank(8000, 10000)).toBe('A'); // 80%
      expect(getScoreRank(7000, 10000)).toBe('B'); // 70%
      expect(getScoreRank(6000, 10000)).toBe('C'); // 60%
      expect(getScoreRank(5000, 10000)).toBe('D'); // 50%
    });
  });

  describe('getScoreMessage', () => {
    it('ランクに応じて適切なメッセージを返す', () => {
      expect(getScoreMessage(9500, 10000)).toContain('完璧');
      expect(getScoreMessage(8500, 10000)).toContain('素晴らしい');
      expect(getScoreMessage(7500, 10000)).toContain('よくできました');
      expect(getScoreMessage(6500, 10000)).toContain('もう少し');
      expect(getScoreMessage(5500, 10000)).toContain('惜しい');
      expect(getScoreMessage(4500, 10000)).toContain('まだまだ');
    });
  });

  describe('calculateElapsedTime', () => {
    it('経過時間を正しく計算する', () => {
      const startTime = 1000;
      const endTime = 3000;
      expect(calculateElapsedTime(startTime, endTime)).toBe(2); // 2秒
    });

    it('同時刻の場合は0を返す', () => {
      const time = 1000;
      expect(calculateElapsedTime(time, time)).toBe(0);
    });
  });

  describe('getHighPrecisionTime', () => {
    it('performance.now()の値を返す', () => {
      const time = getHighPrecisionTime();
      expect(typeof time).toBe('number');
      expect(time).toBeGreaterThan(0);
    });

    it('連続して呼び出すと異なる値を返す', () => {
      const time1 = getHighPrecisionTime();
      const time2 = getHighPrecisionTime();
      expect(time2).toBeGreaterThanOrEqual(time1);
    });
  });
});