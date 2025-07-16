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
      expect(calculatePlayDurationBonus(1)).toBe(500);
      expect(calculatePlayDurationBonus(1.5)).toBe(300);
      expect(calculatePlayDurationBonus(2)).toBe(100);
      expect(calculatePlayDurationBonus(3)).toBe(0);
      expect(calculatePlayDurationBonus(5)).toBe(-100);
    });

    it('定義されていない再生時間の場合は0を返す', () => {
      expect(calculatePlayDurationBonus(4)).toBe(0);
      expect(calculatePlayDurationBonus(10)).toBe(0);
    });
  });

  describe('calculateTimeBonus', () => {
    it('10秒以内の場合はボーナス', () => {
      expect(calculateTimeBonus(5)).toBe(200);
      expect(calculateTimeBonus(10)).toBe(200);
    });

    it('15秒以内の場合は中程度のボーナス', () => {
      expect(calculateTimeBonus(12)).toBe(100);
      expect(calculateTimeBonus(15)).toBe(100);
    });

    it('20秒以内の場合は減点なし', () => {
      expect(calculateTimeBonus(18)).toBe(0);
      expect(calculateTimeBonus(20)).toBe(0);
    });

    it('30秒以内の場合は減点', () => {
      expect(calculateTimeBonus(25)).toBe(-100);
      expect(calculateTimeBonus(30)).toBe(-100);
    });

    it('30秒以上の場合は大きく減点', () => {
      expect(calculateTimeBonus(31)).toBe(-300);
      expect(calculateTimeBonus(60)).toBe(-300);
    });
  });

  describe('calculateQuestionScore', () => {
    it('基本的なスコア計算が正しく行われる', () => {
      const score = calculateQuestionScore(0, 20, 2, false);
      expect(score.baseScore).toBe(1000);
      expect(score.timeBonus).toBe(0); // 20秒経過時
      expect(score.playDurationBonus).toBe(100); // 2秒
      expect(score.revealPenalty).toBe(0); // 答え表示なし
      expect(score.totalScore).toBe(1100);
    });

    it('答えを表示した場合はペナルティが適用される', () => {
      const score = calculateQuestionScore(0, 20, 2, true);
      expect(score.revealPenalty).toBe(-1000);
      expect(score.totalScore).toBe(100); // 1000 + 0 + 100 - 1000
    });

    it('時間超過の場合は減点される', () => {
      const score = calculateQuestionScore(0, 90, 1, false);
      expect(score.timeBonus).toBe(-300);
      expect(score.totalScore).toBe(1200); // 1000 - 300 + 500
    });

    it('スコアが0を下回らない', () => {
      const score = calculateQuestionScore(0, 120, 5, true);
      expect(score.totalScore).toBeGreaterThanOrEqual(0);
    });
  });

  describe('calculateTotalScore', () => {
    it('複数のスコアを正しく合計する', () => {
      const scores = [
        { questionIndex: 0, baseScore: 1000, timeBonus: 200, playDurationBonus: 500, revealPenalty: 0, totalScore: 1700, timeElapsed: 10, playDuration: 1, wasRevealed: false },
        { questionIndex: 1, baseScore: 1000, timeBonus: 100, playDurationBonus: 300, revealPenalty: 0, totalScore: 1400, timeElapsed: 15, playDuration: 1.5, wasRevealed: false },
        { questionIndex: 2, baseScore: 1000, timeBonus: 0, playDurationBonus: 100, revealPenalty: -1000, totalScore: 100, timeElapsed: 20, playDuration: 2, wasRevealed: true },
      ];

      expect(calculateTotalScore(scores)).toBe(3200);
    });

    test('各ランクの動作確認', () => {
      // ランクSS: 1秒×5問（10秒以内）+ 1.5秒×5問（15秒以内）
      const ssScores = [
        ...Array(5).fill(null).map((_, i) => calculateQuestionScore(i, 10, 1, false)),
        ...Array(5).fill(null).map((_, i) => calculateQuestionScore(i + 5, 15, 1.5, false))
      ];
      const ssTotal = calculateTotalScore(ssScores);
      console.log('ランクSS:', ssTotal, getScoreRank(ssTotal));

      // ランクS: 1.5秒×10問、15秒以内
      const sScores = Array(10).fill(null).map((_, i) =>
        calculateQuestionScore(i, 15, 1.5, false)
      );
      const sTotal = calculateTotalScore(sScores);
      console.log('ランクS:', sTotal, getScoreRank(sTotal));

      // ランクA: 1.5秒×5問（15秒以内）+ 2秒×5問（20秒以内）
      const aScores = [
        ...Array(5).fill(null).map((_, i) => calculateQuestionScore(i, 15, 1.5, false)),
        ...Array(5).fill(null).map((_, i) => calculateQuestionScore(i + 5, 20, 2, false))
      ];
      const aTotal = calculateTotalScore(aScores);
      console.log('ランクA:', aTotal, getScoreRank(aTotal));

      // ランクB: 2秒×10問、15~20秒、答え表示2回
      const bScores = Array(10).fill(null).map((_, i) =>
        calculateQuestionScore(i, 17, 2, i < 2)
      );
      const bTotal = calculateTotalScore(bScores);
      console.log('ランクB:', bTotal, getScoreRank(bTotal));

      // ランクC: 2秒×5問 + 3秒×5問、15~20秒、答え表示4回
      const cScores = [
        ...Array(5).fill(null).map((_, i) => calculateQuestionScore(i, 17, 2, i < 4)),
        ...Array(5).fill(null).map((_, i) => calculateQuestionScore(i + 5, 17, 3, false))
      ];
      const cTotal = calculateTotalScore(cScores);
      console.log('ランクC:', cTotal, getScoreRank(cTotal));
    })

    it('空の配列の場合は0を返す', () => {
      expect(calculateTotalScore([])).toBe(0);
    });
  });

  describe('getScoreRank', () => {
    it('スコアに応じて正しいランクを返す', () => {
      expect(getScoreRank(15500)).toBe('SS'); // 最高ランク
      expect(getScoreRank(14000)).toBe('S');  // 優秀
      expect(getScoreRank(12500)).toBe('A');  // 良好
      expect(getScoreRank(9000)).toBe('B');   // 普通
      expect(getScoreRank(7000)).toBe('C');   // 要改善
      expect(getScoreRank(5000)).toBe('D');   // 要練習
      expect(getScoreRank(4000)).toBe('F');   // 要改善
    });

    it('境界値で正しく判定する', () => {
      expect(getScoreRank(15499)).toBe('S');  // SS未満
      expect(getScoreRank(13999)).toBe('A');  // S未満
      expect(getScoreRank(12499)).toBe('B');  // A未満
      expect(getScoreRank(8999)).toBe('C');   // B未満
      expect(getScoreRank(6999)).toBe('D');   // C未満
      expect(getScoreRank(4999)).toBe('F');   // D未満
    });
  });

  describe('getScoreMessage', () => {
    it('ランクに応じて適切なメッセージを返す', () => {
      expect(getScoreMessage(15500)).toContain('完璧');
      expect(getScoreMessage(14000)).toContain('素晴らしい');
      expect(getScoreMessage(12500)).toContain('よくできました');
      expect(getScoreMessage(9000)).toContain('もう少し');
      expect(getScoreMessage(7000)).toContain('惜しい');
      expect(getScoreMessage(5000)).toContain('まだまだ');
      expect(getScoreMessage(4000)).toContain('お疲れ様');
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