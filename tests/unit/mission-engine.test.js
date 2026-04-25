/**
 * @spec SPEC-052 §7 ミッション条件評価のロジック
 */
const { describe, it, assert, assertEq, assertNear } = require("../lib/assert.js");

// 実装を再現
function evaluateMissionCondition(cond, player) {
  if (!cond) return { match: true, progress: 1.0 };
  const parts = [];
  if (cond.soyouAtLeast) {
    for (const [k, v] of Object.entries(cond.soyouAtLeast)) {
      parts.push(Math.min(1.0, (player.soyou[k] || 0) / v));
    }
  }
  if (cond.playCountAtLeast) {
    for (const [id, v] of Object.entries(cond.playCountAtLeast)) {
      parts.push(Math.min(1.0, (player._playCounts[id] || 0) / v));
    }
  }
  const match = parts.every((p) => p >= 1.0);
  const progress = parts.length > 0 ? parts.reduce((a, b) => a + b, 0) / parts.length : 1.0;
  return { match, progress };
}

describe("SPEC-052 §7 evaluateMissionCondition", () => {
  const player = {
    soyou: { body: 20, intellect: 30, sensitivity: 50, social: 10, passion: 40 },
    _playCounts: { song: 8, picturebook: 20 },
  };

  it("条件なし → match, progress=1.0", () => {
    const r = evaluateMissionCondition(null, player);
    assertEq(r.match, true);
    assertNear(r.progress, 1.0, 0.001);
  });

  it("soyouAtLeast 単一条件: body 10 → match", () => {
    const r = evaluateMissionCondition({ soyouAtLeast: { body: 10 } }, player);
    assertEq(r.match, true);
    assertNear(r.progress, 1.0, 0.001);
  });

  it("soyouAtLeast 未達: body 100 → unmatched, progress=0.2", () => {
    const r = evaluateMissionCondition({ soyouAtLeast: { body: 100 } }, player);
    assertEq(r.match, false);
    assertNear(r.progress, 0.2, 0.001);
  });

  it("複合条件: body 10 & sensitivity 100（片方未達）→ unmatched、平均進捗", () => {
    const r = evaluateMissionCondition(
      { soyouAtLeast: { body: 10, sensitivity: 100 } },
      player
    );
    assertEq(r.match, false);
    // (min(20/10,1)=1) + (min(50/100,1)=0.5) / 2 = 0.75
    assertNear(r.progress, 0.75, 0.001);
  });

  it("playCountAtLeast: song 10 → unmatched 80%", () => {
    const r = evaluateMissionCondition(
      { playCountAtLeast: { song: 10 } },
      player
    );
    assertEq(r.match, false);
    assertNear(r.progress, 0.8, 0.001);
  });

  it("パズル9の達成条件（複合）", () => {
    const cond = {
      soyouAtLeast: { body: 30, intellect: 40, passion: 50 },
      playCountAtLeast: { puzzle_4pieces: 5 },
    };
    const p2 = { soyou: { body: 30, intellect: 40, passion: 50 }, _playCounts: { puzzle_4pieces: 5 } };
    const r = evaluateMissionCondition(cond, p2);
    assertEq(r.match, true);
  });
});
