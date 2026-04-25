/**
 * @spec SPEC-054 §4 parental_compliment（親が他者から褒められる場面）
 * @spec SPEC-053 §3.4 4 軸④の強化
 *
 * 検証内容:
 *  - PARENTAL_COMPLIMENTS が 8 件以上ロード
 *  - 公園入場 + social 30+ で pc_neighbor_greeting 発動
 *  - compliment クラスが付与され、🌸 ほめられた フェーズが表示
 *  - 報酬適用（soyou・renrakuchoHighlights・memorableDays）
 *  - cooldown 30 日が機能（同じ場所に再入場しても発動しない）
 *  - 30 日経過後は再発動する
 */
const puppeteer = require("puppeteer-core");
const { describe, it, assert, assertEq } = require("../lib/assert.js");

async function jumpToChoose(page) {
  await page.click("#btn-title-start");
  await new Promise(r => setTimeout(r, 250));
  for (let i = 0; i < 25; i++) {
    const st = await page.evaluate(() => ({
      active: document.querySelector(".screen.active")?.id,
      inputHidden: document.getElementById("isekai-input-row")?.hidden,
    }));
    if (st.active === "screen-choose") return;
    if (st.active !== "screen-isekai") return;
    if (!st.inputHidden) await page.click("#isekai-input-btn");
    else await page.click("#isekai-stage");
    await new Promise(r => setTimeout(r, 180));
  }
}

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/usr/local/bin/google-chrome",
    headless: "new", args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 900, isMobile: true });
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));
  page.on("console", (m) => {
    if (m.type() !== "error") return;
    const t = m.text();
    if (t.includes("favicon") || t.includes("404")) return;
    errs.push(t);
  });

  await page.goto("http://localhost:8765/index.html", { waitUntil: "networkidle0" });
  await new Promise(r => setTimeout(r, 500));
  await jumpToChoose(page);

  const masters = await page.evaluate(() => ({
    pcCount: PARENTAL_COMPLIMENTS.length,
    pcIds: PARENTAL_COMPLIMENTS.map(p => p.id),
  }));
  describe("SPEC-054 §6 parental-compliments マスターロード", () => {
    it("8 件以上ロード", () => assert(masters.pcCount >= 8, `count=${masters.pcCount}`));
    it("pc_neighbor_greeting が含まれる", () => assert(masters.pcIds.includes("pc_neighbor_greeting")));
    it("pc_park_share が含まれる", () => assert(masters.pcIds.includes("pc_park_share")));
  });

  // 発動テスト
  await page.evaluate(() => {
    player.day = 30;
    player.age = 2;
    player.soyou.social = 50;
    player._lastParentalComplimentDay = 0;
    const pc = maybeTriggerParentalCompliment({ type: "enterLocation", location: "near_park" });
    if (pc) startParentalCompliment(pc);
  });
  await new Promise(r => setTimeout(r, 400));
  const inciteState = await page.evaluate(() => ({
    active: document.querySelector(".screen.active")?.id,
    phase: document.getElementById("mission-modal-phase")?.textContent,
    title: document.getElementById("mission-modal-title")?.textContent,
    hasComplimentClass: document.getElementById("screen-mission-modal").classList.contains("compliment"),
    lastPcDay: player._lastParentalComplimentDay,
  }));
  describe("SPEC-054 §4.2 発動と画面表示", () => {
    it("screen-mission-modal active", () => assertEq(inciteState.active, "screen-mission-modal"));
    it("phase = 🌸 ほめられた", () => assert(inciteState.phase.includes("ほめられた"), inciteState.phase));
    it("title = ご近所さんとのあいさつ", () => assertEq(inciteState.title, "ご近所さんとのあいさつ"));
    it("compliment クラスが付与", () => assertEq(inciteState.hasComplimentClass, true));
    it("_lastParentalComplimentDay が更新", () => assertEq(inciteState.lastPcDay, 30));
  });

  // ダイアログを最後まで進める
  for (let i = 0; i < 10; i++) {
    await page.click("#btn-mission-modal-next");
    await new Promise(r => setTimeout(r, 200));
    const act = await page.evaluate(() => document.querySelector(".screen.active")?.id);
    if (act !== "screen-mission-modal") break;
  }

  const final = await page.evaluate(() => ({
    active: document.querySelector(".screen.active")?.id,
    social: player.soyou.social,
    passion: player.soyou.passion,
    memorableLen: player.memorableDays.length,
    renrakuchoLen: player.renrakuchoHighlights.length,
    renrakuchoFirst: player.renrakuchoHighlights[0]?.text,
  }));
  describe("SPEC-054 §3.1 報酬適用", () => {
    it("S2 復帰", () => assertEq(final.active, "screen-choose"));
    it("social += 3（50→53）", () => assertEq(final.social, 53));
    it("passion += 5（0→5）", () => assertEq(final.passion, 5));
    it("memorableDays に 1 件追加", () => assertEq(final.memorableLen, 1));
    it("renrakuchoHighlights に追加（『嬉しそう』含む）", () =>
      assert(final.renrakuchoFirst && final.renrakuchoFirst.includes("嬉しそう"), final.renrakuchoFirst));
  });

  // Cooldown 確認
  const cd1 = await page.evaluate(() => {
    // 1 日経過後に再判定
    player.day = 31;
    const pc = maybeTriggerParentalCompliment({ type: "enterLocation", location: "near_park" });
    return { found: !!pc };
  });
  describe("SPEC-054 §2.3 Cooldown 30 日", () => {
    it("1 日後は再発動しない", () => assertEq(cd1.found, false));
  });

  const cd2 = await page.evaluate(() => {
    player.day = 60;  // 30 日経過
    const pc = maybeTriggerParentalCompliment({ type: "enterLocation", location: "near_park" });
    return { found: !!pc };
  });
  describe("Cooldown 経過後", () => {
    it("30 日後は再発動可能", () => assertEq(cd2.found, true));
  });

  // 過程褒めの検証：mission の dialog から能力褒めが消えていること
  const praiseCheck = await page.evaluate(() => {
    const NG_WORDS = ["えらいね", "天才", "頭いい"];
    const allDialog = MISSION_SCENARIOS.flatMap(m => {
      const lines = [];
      [m.incite, m.catalyst, m.accomplish].forEach(s => {
        if (s && s.dialog) lines.push(...s.dialog);
      });
      return lines.map(l => l.text || "");
    });
    const titlesText = TITLES.map(t => (t.flavor || {}).text || "");
    const all = [...allDialog, ...titlesText];
    return {
      total: all.length,
      ngHits: all.filter(t => NG_WORDS.some(ng => t.includes(ng))),
    };
  });
  describe("SPEC-054 §1 過程褒めへの統一", () => {
    it("『えらいね』『天才』『頭いい』が dialog/flavor に出現しない", () => {
      if (praiseCheck.ngHits.length > 0) throw new Error(`NG words found: ${JSON.stringify(praiseCheck.ngHits)}`);
    });
  });

  describe("PAGEERR なし", () => {
    it("parental_compliment フローでエラー 0 件", () => {
      if (errs.length) throw new Error(errs.slice(0, 3).join("\n"));
    });
  });

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
