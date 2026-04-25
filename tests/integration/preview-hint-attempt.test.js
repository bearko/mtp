/**
 * @spec SPEC-055 §1 §2 予告ヒント + manualAttempt（脳科学レビュー Tier 2）
 *
 * 検証内容:
 *  - computePreviewHint：active/completed を除外、nearReady の判定（70%）
 *  - 予告ヒントの表示：HUD 直下、headline + detail
 *  - manualAttempt 経由で『ちょうせんしてみる？』モーダルが表示
 *  - 「まだ」→ S2 復帰、ACCEPTED 維持、再プレイで再表示
 *  - 「ちょうせんしてみる」→ 達成演出 → title 獲得
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

  // === 予告ヒントの非表示・表示確認 ===
  // 開始時：何もカウントしていない → ヒント非表示
  const initial = await page.evaluate(() => ({
    hidden: document.getElementById("mission-prelude")?.hidden,
  }));
  describe("SPEC-055 §1 開始時は予告ヒント非表示", () => {
    it("hidden = true", () => assertEq(initial.hidden, true));
  });

  // song 累計 7 回（70%）で表示
  const reach70 = await page.evaluate(() => {
    player.day = 8;
    player.age = 2;
    player._playCounts = { song: 7 };
    renderPreviewHint();
    return {
      hidden: document.getElementById("mission-prelude")?.hidden,
      headline: document.getElementById("mission-prelude-headline")?.textContent,
      detail: document.getElementById("mission-prelude-detail")?.textContent,
    };
  });
  describe("SPEC-055 §1 song 70%（7回）で予告ヒント表示", () => {
    it("hidden = false", () => assertEq(reach70.hidden, false));
    it("headline = もうすぐ何か…", () => assert(reach70.headline.includes("もうすぐ何か"), reach70.headline));
    it("detail に何かが入っている", () => assert(reach70.detail.length > 0));
  });

  // 完了済みミッションは予告ヒント候補から外れる
  const filtered = await page.evaluate(() => {
    player.completedMissions = ["m_song_10"];
    renderPreviewHint();
    return {
      detailIncludesUta: document.getElementById("mission-prelude-detail")?.textContent.includes("お父さん"),
    };
  });
  describe("SPEC-055 §1 完了済みは予告から除外", () => {
    it("detail に『お父さん』を含まない", () => assertEq(filtered.detailIncludesUta, false));
  });

  // === manualAttempt 達成プロンプト ===
  // m_song_10 を ACCEPTED 状態にして song 10 回 → プロンプト表示
  await page.evaluate(() => {
    player.completedMissions = [];
    player._playCounts = { song: 10 };
    player.soyou.sensitivity = 40;
    player.soyou.passion = 30;
    player.activeMissions = [{ id: "m_song_10", state: "ACCEPTED", startDay: 8, hintsShown: [] }];
    onPlayFinalized({ id: "song", categories: ["music"], gain: { sensitivity: 5 } });
  });
  await new Promise(r => setTimeout(r, 400));
  const promptShown = await page.evaluate(() => ({
    active: document.querySelector(".screen.active")?.id,
    title: document.getElementById("attempt-prompt-title")?.textContent,
    subtitle: document.getElementById("attempt-prompt-subtitle")?.textContent,
    yesLabel: document.getElementById("btn-attempt-prompt-yes")?.textContent,
    laterLabel: document.getElementById("btn-attempt-prompt-later")?.textContent,
    state: player.activeMissions[0]?.state,
  }));
  describe("SPEC-055 §2 manualAttempt 達成プロンプト表示", () => {
    it("screen-mission-attempt-prompt active", () =>
      assertEq(promptShown.active, "screen-mission-attempt-prompt"));
    it("title = もうできるかも？", () => assertEq(promptShown.title, "もうできるかも？"));
    it("subtitle にミッション名", () => assertEq(promptShown.subtitle, "おうたをうたえるようになる"));
    it("yesLabel = うたってみる", () => assertEq(promptShown.yesLabel, "うたってみる"));
    it("laterLabel = まだ、こんどにする", () => assertEq(promptShown.laterLabel, "まだ、こんどにする"));
    it("state = ACCEPTED （プロンプト中も状態は変わらない）", () => assertEq(promptShown.state, "ACCEPTED"));
  });

  // 「まだ、こんどにする」を押す
  await page.click("#btn-attempt-prompt-later");
  await new Promise(r => setTimeout(r, 400));
  const afterLater = await page.evaluate(() => ({
    active: document.querySelector(".screen.active")?.id,
    state: player.activeMissions[0]?.state,
    titles: player.titles.map(t => t.id),
  }));
  describe("SPEC-055 §2 『まだ、こんどにする』選択", () => {
    it("S2 復帰", () => assertEq(afterLater.active, "screen-choose"));
    it("ACCEPTED 維持", () => assertEq(afterLater.state, "ACCEPTED"));
    it("title はまだ未獲得", () => assert(!afterLater.titles.includes("title_singer")));
  });

  // 再プレイで再表示
  await page.evaluate(() => {
    player._playCounts.song = 11;
    onPlayFinalized({ id: "song", categories: ["music"], gain: { sensitivity: 5 } });
  });
  await new Promise(r => setTimeout(r, 400));
  const reshown = await page.evaluate(() => document.querySelector(".screen.active")?.id);
  describe("SPEC-055 §2 再プレイで再度プロンプト表示", () => {
    it("screen-mission-attempt-prompt が active に戻る", () => assertEq(reshown, "screen-mission-attempt-prompt"));
  });

  // 「ちょうせんしてみる」を押す
  await page.click("#btn-attempt-prompt-yes");
  await new Promise(r => setTimeout(r, 500));
  const afterYes = await page.evaluate(() => ({
    active: document.querySelector(".screen.active")?.id,
    phase: document.getElementById("mission-modal-phase")?.textContent,
    titles: player.titles.map(t => t.id),
  }));
  describe("SPEC-055 §2 『ちょうせんしてみる』選択", () => {
    it("達成モーダル表示", () => assertEq(afterYes.active, "screen-mission-modal"));
    it("phase = 🎉 達成！", () => assert(afterYes.phase.includes("達成"), afterYes.phase));
    it("title_singer 獲得", () => assert(afterYes.titles.includes("title_singer"), JSON.stringify(afterYes.titles)));
  });

  describe("PAGEERR なし", () => {
    it("予告ヒント・manualAttempt フローでエラー 0 件", () => {
      if (errs.length) throw new Error(errs.slice(0, 3).join("\n"));
    });
  });

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
