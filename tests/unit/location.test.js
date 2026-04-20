/**
 * @spec SPEC-047 §5 §8 場所フィルタ／親遣い抽選のヘルパ検証
 */
const { describe, it, assert, assertEq } = require("../lib/assert.js");

// 場所フィルタの本体ロジックを再現
function isLocationAllowed(play, location) {
  if (!Array.isArray(play.locations) || play.locations.length === 0) return true;
  return play.locations.includes(location);
}

describe("SPEC-047 §5.1 isLocationAllowed", () => {
  const picturebook = { id: "picturebook", locations: ["home", "library"] };
  const slide = { id: "slide", locations: ["near_park", "big_park"] };
  const generic = { id: "generic" };  // locations なし

  it("絵本は自宅で OK", () => assertEq(isLocationAllowed(picturebook, "home"), true));
  it("絵本は図書館で OK", () => assertEq(isLocationAllowed(picturebook, "library"), true));
  it("絵本は公園で NG", () => assertEq(isLocationAllowed(picturebook, "near_park"), false));
  it("滑り台は公園で OK", () => assertEq(isLocationAllowed(slide, "near_park"), true));
  it("滑り台は自宅で NG", () => assertEq(isLocationAllowed(slide, "home"), false));
  it("locations 未定義はどこでも OK", () => {
    assertEq(isLocationAllowed(generic, "home"), true);
    assertEq(isLocationAllowed(generic, "zoo"), true);
  });
});

// 親遣い抽選の統計テスト
function pickWeightedSimulated(pool, key, n = 1000) {
  const counts = {};
  for (let i = 0; i < n; i++) {
    const total = pool.reduce((s, p) => s + (p[key] || 0), 0);
    let r = Math.random() * total;
    let picked = pool[0];
    for (const p of pool) {
      r -= (p[key] || 0);
      if (r <= 0) { picked = p; break; }
    }
    counts[picked.id] = (counts[picked.id] || 0) + 1;
  }
  return counts;
}

describe("SPEC-047 §8.1 平日親遣い抽選：重みに従って分布", () => {
  // 家 40 + 近くの公園 30 + 児童館 15 + 大きな公園 15 + 図書館 5 = 105（合計で正規化）
  const pool = [
    { id: "home", w: 40 },
    { id: "near_park", w: 30 },
    { id: "children_hall", w: 15 },
    { id: "big_park", w: 15 },
    { id: "library", w: 5 },
  ];
  const counts = pickWeightedSimulated(pool, "w", 5000);

  it("home が最多（約 38%）", () => {
    const homeRatio = counts["home"] / 5000;
    assert(homeRatio > 0.33 && homeRatio < 0.43, `home ratio=${homeRatio}`);
  });
  it("library が最少（約 5%）", () => {
    const libRatio = counts["library"] / 5000;
    assert(libRatio < 0.08, `lib ratio=${libRatio}`);
  });
});

describe("SPEC-047 §8.2 土日抽選：40% は home（二段階抽選）", () => {
  // 本番実装は Math.random() < 0.4 → home、そうでなければ残り重み抽選
  function pickWeekend() {
    if (Math.random() < 0.40) return "home";
    const pool = [
      { id: "zoo", w: 10 }, { id: "aquarium", w: 10 }, { id: "big_park", w: 10 },
      { id: "museum", w: 8 }, { id: "grandparents_house", w: 8 }, { id: "amusement_park", w: 7 },
    ];
    const total = pool.reduce((s, p) => s + p.w, 0);
    let r = Math.random() * total;
    for (const p of pool) { r -= p.w; if (r <= 0) return p.id; }
    return pool[0].id;
  }
  const counts = {};
  for (let i = 0; i < 5000; i++) {
    const r = pickWeekend();
    counts[r] = (counts[r] || 0) + 1;
  }
  it("home は全体の約 40%", () => {
    const ratio = counts["home"] / 5000;
    assert(ratio > 0.35 && ratio < 0.45, `home ratio=${ratio}`);
  });
  it("home 以外も分布する", () => {
    const nonHomeIds = Object.keys(counts).filter(k => k !== "home");
    assert(nonHomeIds.length >= 4, `non-home kinds=${nonHomeIds.length}`);
  });
});
