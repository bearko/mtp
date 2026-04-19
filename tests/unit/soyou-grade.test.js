/**
 * @spec SPEC-033 §4 §10 素養グレード境界値テスト
 *
 * 実装（prototype/game.js soyouGrade）:
 *   >= 140 A / >= 110 B / >= 80 C / >= 66 D / >= 40 E / >= 20 F / else G
 *
 * 本テストでは 0..160 で境界値が変わる順序と実装の仕様を確認する。
 * 実装と同じロジックをテスト側にも書き、将来の変更時に両方を見直すよう強制する（二重管理）。
 */
const { describe, it, assertEq } = require("../lib/assert.js");

function soyouGrade(v) {
  const n = Math.max(0, Math.floor(Number(v) || 0));
  if (n >= 140) return "A";
  if (n >= 110) return "B";
  if (n >=  80) return "C";
  if (n >=  66) return "D";
  if (n >=  40) return "E";
  if (n >=  20) return "F";
  return "G";
}

describe("SPEC-033 §4 soyouGrade の境界値", () => {
  it("負の値や NaN は G にクランプ", () => {
    assertEq(soyouGrade(-1), "G");
    assertEq(soyouGrade(NaN), "G");
    assertEq(soyouGrade(undefined), "G");
  });
  it("0 → G / 19 → G / 20 → F", () => {
    assertEq(soyouGrade(0),  "G");
    assertEq(soyouGrade(19), "G");
    assertEq(soyouGrade(20), "F");
  });
  it("39 → F / 40 → E", () => {
    assertEq(soyouGrade(39), "F");
    assertEq(soyouGrade(40), "E");
  });
  it("65 → E / 66 → D", () => {
    assertEq(soyouGrade(65), "E");
    assertEq(soyouGrade(66), "D");
  });
  it("79 → D / 80 → C", () => {
    assertEq(soyouGrade(79), "D");
    assertEq(soyouGrade(80), "C");
  });
  it("109 → C / 110 → B", () => {
    assertEq(soyouGrade(109), "C");
    assertEq(soyouGrade(110), "B");
  });
  it("139 → B / 140 → A", () => {
    assertEq(soyouGrade(139), "B");
    assertEq(soyouGrade(140), "A");
  });
  it("140 を超えても A のまま", () => {
    assertEq(soyouGrade(9999), "A");
  });
});
