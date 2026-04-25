/**
 * @spec SPEC-050 / SPEC-052 ストーリー型ミッションの End-to-End
 *
 * 検証内容：
 *  - マスターロード（mission-scenarios / titles）
 *  - 発端トリガ（playCountAtLeast）→ INCITED → モーダル表示
 *  - 「つぎへ」で dialog を進める
 *  - catalyst フェーズに移行、ACCEPTED 状態、バナー表示
 *  - 達成トリガ → completeMission 実行
 *  - 報酬（title / soyouBonus / persistBuff）が反映
 *  - memorableDays / renrakuchoHighlights に追加
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
    if (t.includes("favicon")) return;
    if (t.includes("404")) return;  // static リソース不足は無視
    errs.push(t);
  });

  await page.goto("http://localhost:8765/index.html", { waitUntil: "networkidle0" });
  await new Promise(r => setTimeout(r, 500));
  await jumpToChoose(page);

  const masters = await page.evaluate(() => ({
    missions: MISSION_SCENARIOS.length,
    titles: TITLES.length,
  }));
  describe("SPEC-052 マスターロード", () => {
    it("MISSION_SCENARIOS が 3 件以上", () => assert(masters.missions >= 3, `missions=${masters.missions}`));
    it("TITLES が 10 件以上", () => assert(masters.titles >= 10, `titles=${masters.titles}`));
  });

  // --- 発端 → 触媒 ---
  await page.evaluate(() => {
    player.day = 8;
    player.age = 2;
    player.location = "home";
    player._playCounts = { song: 3 };
    const trig = findMissionsToTrigger({ type: "playCountAtLeast", playId: "song" });
    if (trig.length > 0 && trig[0].phase === "incite") {
      startMissionIncite(trig[0].mission);
    }
  });
  await new Promise(r => setTimeout(r, 400));
  const inciteState = await page.evaluate(() => ({
    active: document.querySelector(".screen.active")?.id,
    phase: document.getElementById("mission-modal-phase")?.textContent,
    title: document.getElementById("mission-modal-title")?.textContent,
    state: player.activeMissions[0]?.state,
  }));
  describe("SPEC-050 §3 発端 (incite)", () => {
    it("screen-mission-modal active", () => assertEq(inciteState.active, "screen-mission-modal"));
    it("phase = 🌱 はじまり", () => assert(inciteState.phase.includes("はじまり"), inciteState.phase));
    it("title = おうたをうたえるようになる", () => assertEq(inciteState.title, "おうたをうたえるようになる"));
    it("activeMissions state = INCITED", () => assertEq(inciteState.state, "INCITED"));
  });

  // つぎへを連打して catalyst 終了まで進める
  for (let i = 0; i < 10; i++) {
    await page.click("#btn-mission-modal-next");
    await new Promise(r => setTimeout(r, 200));
    const act = await page.evaluate(() => document.querySelector(".screen.active")?.id);
    if (act !== "screen-mission-modal") break;
  }
  const afterCatalyst = await page.evaluate(() => ({
    active: document.querySelector(".screen.active")?.id,
    state: player.activeMissions[0]?.state,
    bannerHidden: document.getElementById("mission-banner")?.hidden,
    bannerCount: document.getElementById("mission-banner-count")?.textContent,
  }));
  describe("SPEC-050 §3 触媒 (catalyst) 後", () => {
    it("screen-choose に復帰", () => assertEq(afterCatalyst.active, "screen-choose"));
    it("state = ACCEPTED", () => assertEq(afterCatalyst.state, "ACCEPTED"));
    it("ミッションバナー表示", () => assertEq(afterCatalyst.bannerHidden, false));
    it("バナーカウント = 1", () => assertEq(afterCatalyst.bannerCount, "1"));
  });

  // --- 達成 ---
  await page.evaluate(() => {
    player._playCounts.song = 10;
    player.soyou.sensitivity = 40;
    player.soyou.passion = 30;
    const trig = findMissionsToTrigger({ type: "playCountAtLeast", playId: "song" });
    const acc = trig.find(t => t.phase === "accomplish");
    if (acc) completeMission(acc.mission);
  });
  await new Promise(r => setTimeout(r, 400));
  const accomplishState = await page.evaluate(() => ({
    active: document.querySelector(".screen.active")?.id,
    phase: document.getElementById("mission-modal-phase")?.textContent,
    celebration: document.getElementById("screen-mission-modal").classList.contains("celebration"),
  }));
  describe("SPEC-050 §5 達成 (accomplish)", () => {
    it("screen-mission-modal active", () => assertEq(accomplishState.active, "screen-mission-modal"));
    it("phase = 🎉 達成！", () => assert(accomplishState.phase.includes("達成"), accomplishState.phase));
    it("celebration クラスが付与", () => assertEq(accomplishState.celebration, true));
  });

  // 完了まで進める
  for (let i = 0; i < 10; i++) {
    await page.click("#btn-mission-modal-next");
    await new Promise(r => setTimeout(r, 200));
    const act = await page.evaluate(() => document.querySelector(".screen.active")?.id);
    if (act !== "screen-mission-modal") break;
  }

  const final = await page.evaluate(() => ({
    active: document.querySelector(".screen.active")?.id,
    activeLen: player.activeMissions.length,
    completed: player.completedMissions,
    titleIds: player.titles.map(t => t.id),
    sensitivity: player.soyou.sensitivity,
    hasMusicBuff: (player.persistBuffs || []).some(b => b.category === "music"),
    memorableDaysLen: player.memorableDays.length,
    renrakuchoHighlightsLen: player.renrakuchoHighlights.length,
    bannerHidden: document.getElementById("mission-banner")?.hidden,
  }));
  describe("SPEC-050 §5 達成後の報酬適用", () => {
    it("screen-choose に復帰", () => assertEq(final.active, "screen-choose"));
    it("activeMissions 空", () => assertEq(final.activeLen, 0));
    it("completedMissions に m_song_10", () => assert(final.completed.includes("m_song_10")));
    it("titles に title_singer", () => assert(final.titleIds.includes("title_singer"), JSON.stringify(final.titleIds)));
    it("sensitivity += 25（40→65）", () => assertEq(final.sensitivity, 65));
    it("persistBuffs に music が追加", () => assertEq(final.hasMusicBuff, true));
    it("memorableDays に 1 件追加", () => assertEq(final.memorableDaysLen, 1));
    it("renrakuchoHighlights に 1 件追加", () => assertEq(final.renrakuchoHighlightsLen, 1));
    it("バナーは再度 hidden（ACCEPTED ミッション 0 件）", () => assertEq(final.bannerHidden, true));
  });

  describe("PAGEERR なし", () => {
    it("ミッションフロー全体でエラー 0 件", () => {
      if (errs.length) throw new Error(errs.slice(0, 3).join("\n"));
    });
  });

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
