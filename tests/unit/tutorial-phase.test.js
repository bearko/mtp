/**
 * @spec SPEC-026 §5 チュートリアルフェーズ判定
 *   phase0: Day 1〜7（初週、自動封印、保育園休業）
 *   phase1: Day 8〜14（2週目、プロファイル選択、自動解禁、スキップはまだ）
 *   phase2: Day 15〜（3週目以降、スキップ解禁）
 */
const { describe, it, assertEq } = require("../lib/assert.js");

function tutorialPhase(day) {
  const d = Math.max(1, Math.floor(Number(day) || 1));
  if (d <= 7)  return "phase0";
  if (d <= 14) return "phase1";
  return "phase2";
}

describe("SPEC-026 §5 tutorialPhase の境界", () => {
  it("Day 1..7 は phase0", () => {
    for (let d = 1; d <= 7; d++) assertEq(tutorialPhase(d), "phase0", `day=${d}`);
  });
  it("Day 8 は phase1", () => assertEq(tutorialPhase(8), "phase1"));
  it("Day 14 は phase1", () => assertEq(tutorialPhase(14), "phase1"));
  it("Day 15 は phase2", () => assertEq(tutorialPhase(15), "phase2"));
  it("Day 100 は phase2", () => assertEq(tutorialPhase(100), "phase2"));
});
