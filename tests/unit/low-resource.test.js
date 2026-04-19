/**
 * @spec SPEC-002 §5.9 低リソースプレイ（低体力・低時間の双方）
 *
 * 体力・時間のいずれかが不足していても遊びは選択可能で、経験値は
 * `min(体力充足率, 時間充足率)` で減衰する。
 *
 * バグ報告（PR #18）：「体力 1 のとき遊びが選べなくなる」
 *   → 実体は「体力 1 かつ余剰時間 <= 1 の状態」。時間不足を
 *     旧仕様は isHidden 扱いにしていたため、ドックが空になっていた。
 *   → v4 で時間不足も lowStamina 枠に取り込むよう修正。
 */
const { describe, it, assertEq, assertNear } = require("../lib/assert.js");

// 実装を再現（prototype/game.js §lowStaminaMultiplier）
function lowStaminaMultiplier(play, player) {
  const staminaCost = play.staminaCost || 0;
  const timeCost    = play.timeCost    || 0;
  const staminaMult = staminaCost > 0
    ? Math.min(1.0, Math.max(0, player.stamina / staminaCost))
    : 1.0;
  const timeMult = timeCost > 0
    ? Math.min(1.0, Math.max(0, player.spareHours / timeCost))
    : 1.0;
  return Math.min(staminaMult, timeMult);
}

describe("SPEC-002 §5.9 低リソースプレイ：倍率計算", () => {
  const play = { staminaCost: 4, timeCost: 2 };

  it("体力フル+時間フル → 1.0", () => {
    assertNear(lowStaminaMultiplier(play, { stamina: 10, spareHours: 8 }), 1.0, 0.001);
  });
  it("体力 1 / コスト 4 → 0.25", () => {
    assertNear(lowStaminaMultiplier(play, { stamina: 1, spareHours: 8 }), 0.25, 0.001);
  });
  it("体力 2 / コスト 4 → 0.5", () => {
    assertNear(lowStaminaMultiplier(play, { stamina: 2, spareHours: 8 }), 0.5, 0.001);
  });
  it("体力 3 / コスト 4 → 0.75", () => {
    assertNear(lowStaminaMultiplier(play, { stamina: 3, spareHours: 8 }), 0.75, 0.001);
  });
  it("時間 0.5 / コスト 2 → 0.25", () => {
    assertNear(lowStaminaMultiplier(play, { stamina: 10, spareHours: 0.5 }), 0.25, 0.001);
  });
  it("体力・時間どちらも 25% → 0.25（両方一致）", () => {
    assertNear(lowStaminaMultiplier(play, { stamina: 1, spareHours: 0.5 }), 0.25, 0.001);
  });
  it("体力 50%・時間 25% → 0.25（時間が低い側）", () => {
    assertNear(lowStaminaMultiplier(play, { stamina: 2, spareHours: 0.5 }), 0.25, 0.001);
  });
  it("体力 0 → 0（泣きながら遊ぶ）", () => {
    assertNear(lowStaminaMultiplier(play, { stamina: 0, spareHours: 8 }), 0, 0.001);
  });
  it("負の体力 → 0 でクランプ", () => {
    assertNear(lowStaminaMultiplier(play, { stamina: -5, spareHours: 8 }), 0, 0.001);
  });
});
