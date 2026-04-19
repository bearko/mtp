/**
 * @spec SPEC-024 §5.4 / SPEC-035 §6.1 スキルブースト率
 *
 * プレイ全体の skillBoostMultiplier = 1 + (avgLv - 1) * 0.02、Lv51+ は 2.00 キャップ。
 * スキル単体の効果表示 boostPctFromLv = min(100, (lv - 1) * 2)。
 */
const { describe, it, assertEq, assertNear } = require("../lib/assert.js");

function skillBoostMultiplier(avgLv) {
  return Math.min(2.0, 1 + (avgLv - 1) * 0.02);
}

function boostPctFromLv(lv) {
  const n = Math.max(1, Math.floor(lv || 1));
  return Math.min(100, (n - 1) * 2);
}

describe("SPEC-024 §5.4 skillBoostMultiplier", () => {
  it("Lv1 avg → 1.00", () => assertNear(skillBoostMultiplier(1), 1.0, 0.001));
  it("Lv5 avg → 1.08", () => assertNear(skillBoostMultiplier(5), 1.08, 0.001));
  it("Lv50 avg → 1.98", () => assertNear(skillBoostMultiplier(50), 1.98, 0.001));
  it("Lv51 avg → 2.00 キャップ", () => assertNear(skillBoostMultiplier(51), 2.0, 0.001));
  it("Lv100 avg → 2.00 キャップ", () => assertNear(skillBoostMultiplier(100), 2.0, 0.001));
});

describe("SPEC-035 §6.1 boostPctFromLv", () => {
  it("Lv1 → 0%", () => assertEq(boostPctFromLv(1), 0));
  it("Lv2 → 2%", () => assertEq(boostPctFromLv(2), 2));
  it("Lv3 → 4%", () => assertEq(boostPctFromLv(3), 4));
  it("Lv51 → 100%", () => assertEq(boostPctFromLv(51), 100));
  it("Lv999 → 100% キャップ", () => assertEq(boostPctFromLv(999), 100));
  it("Lv0 以下は Lv1 扱い（0%）", () => {
    assertEq(boostPctFromLv(0), 0);
    assertEq(boostPctFromLv(-1), 0);
    assertEq(boostPctFromLv(null), 0);
  });
});
