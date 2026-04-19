/**
 * @spec SPEC-035 §5.4 progressToNextGrade
 *   素養実数値を閾値 [0,20,40,66,80,110,140,Inf] で区切り、次グレードまでの進捗率 % を返す。
 *   A 到達後は常に 100%。
 */
const { describe, it, assertEq, assertNear } = require("../lib/assert.js");

const GRADE_THRESHOLDS = [0, 20, 40, 66, 80, 110, 140, Infinity];
function progressToNextGrade(value) {
  const v = Math.max(0, Math.floor(value || 0));
  for (let i = 1; i < GRADE_THRESHOLDS.length; i++) {
    if (v < GRADE_THRESHOLDS[i]) {
      const prev = GRADE_THRESHOLDS[i - 1];
      const span = GRADE_THRESHOLDS[i] - prev;
      if (!isFinite(span)) return { pct: 100, nextAt: null };
      return { pct: Math.min(100, ((v - prev) / span) * 100), nextAt: GRADE_THRESHOLDS[i] };
    }
  }
  return { pct: 100, nextAt: null };
}

describe("SPEC-035 §5.4 progressToNextGrade", () => {
  it("0 → G→F 0%", () => {
    const r = progressToNextGrade(0);
    assertEq(r.nextAt, 20);
    assertNear(r.pct, 0, 0.1);
  });
  it("10 → G→F 50%", () => {
    const r = progressToNextGrade(10);
    assertEq(r.nextAt, 20);
    assertNear(r.pct, 50, 0.1);
  });
  it("20 → F→E 0%", () => {
    const r = progressToNextGrade(20);
    assertEq(r.nextAt, 40);
    assertNear(r.pct, 0, 0.1);
  });
  it("50 → E→D 中間", () => {
    const r = progressToNextGrade(50);
    assertEq(r.nextAt, 66);
    // (50-40)/(66-40) = 10/26 ≒ 38.46
    assertNear(r.pct, 38.46, 0.1);
  });
  it("140 以上は常に 100% / nextAt=null", () => {
    const r = progressToNextGrade(9999);
    assertEq(r.nextAt, null);
    assertEq(r.pct, 100);
  });
});
