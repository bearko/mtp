/**
 * @spec SPEC-025 §7.2 / §7.2.3 週境界ハイライトの正しい遷移
 *
 * Day 5（日曜）に自動進行 → S10 日サマリ → 続ける → S9 週末ハイライト → 続ける → 翌朝 Day 6 の S2
 * 旧バグ：S9 → 続ける → S10 に戻るループが発生していた（SPEC-025 §7.2.3）
 */
const puppeteer = require("puppeteer-core");
const { describe, it, assert, assertEq } = require("../lib/assert.js");

(async () => {
  const browser = await puppeteer.launch({
    executablePath: "/usr/local/bin/google-chrome",
    headless: "new", args: ["--no-sandbox"],
  });
  const page = await browser.newPage();
  await page.setViewport({ width: 375, height: 900, isMobile: true });
  const errs = [];
  page.on("pageerror", (e) => errs.push(e.message));

  await page.goto("http://localhost:8765/index.html", { waitUntil: "networkidle0" });
  await new Promise(r => setTimeout(r, 400));
  await page.click("#btn-title-start");
  await new Promise(r => setTimeout(r, 250));
  for (let i = 0; i < 20; i++) {
    const st = await page.evaluate(() => ({
      active: document.querySelector(".screen.active")?.id,
      inputHidden: document.getElementById("isekai-input-row")?.hidden,
    }));
    if (st.active === "screen-choose") break;
    if (st.active !== "screen-isekai") break;
    if (!st.inputHidden) await page.click("#isekai-input-btn");
    else await page.click("#isekai-stage");
    await new Promise(r => setTimeout(r, 180));
  }

  // Day 5（日曜・週末）にジャンプして「今日おわる」を押す
  await page.evaluate(() => {
    player.day = 5;
    player.spareHours = 0;
    player.stamina = 5;
    renderHUD();
  });
  await page.evaluate(() => document.querySelector('[data-action="go-sleep"]').click());
  await new Promise(r => setTimeout(r, 500));
  // sleep 画面があれば進める（child-sleep）
  for (let i = 0; i < 3; i++) {
    const s = await page.evaluate(() => document.querySelector(".screen.active")?.id);
    if (s === "screen-day-summary") break;
    if (s === "screen-sleep") {
      await page.evaluate(() => {
        const b = document.querySelector('[data-action="child-sleep"]');
        if (b) b.click();
      });
      await new Promise(r => setTimeout(r, 400));
    } else {
      break;
    }
  }

  const s10 = await page.evaluate(() => ({
    active: document.querySelector(".screen.active")?.id,
    day: player.day,
    pendingWeekly: player._pendingWeeklyHighlight,
  }));
  describe("SPEC-025 §7.2 日曜夜の S10 到達", () => {
    it("screen-day-summary", () => assertEq(s10.active, "screen-day-summary"));
    it("day=5", () => assertEq(s10.day, 5));
    it("_pendingWeeklyHighlight=true（日曜判定）", () => assertEq(s10.pendingWeekly, true));
  });

  // S10 → 続ける → S9
  await page.evaluate(() => document.querySelector('[data-action="day-summary-continue"]').click());
  await new Promise(r => setTimeout(r, 400));

  const s9 = await page.evaluate(() => ({
    active: document.querySelector(".screen.active")?.id,
    range: document.getElementById("highlight-range")?.textContent,
  }));
  describe("SPEC-025 §7.2.0 S9 週末ハイライトが出る", () => {
    it("screen-highlight", () => assertEq(s9.active, "screen-highlight"));
    it("範囲ラベルに『1週』または『週』が含まれる", () =>
      assert(/週/.test(s9.range), `range=${s9.range}`));
  });

  // S9 → 続ける → Day 6 (月曜) の S2
  await page.evaluate(() => document.getElementById("btn-continue-auto").click());
  await new Promise(r => setTimeout(r, 500));

  const next = await page.evaluate(() => ({
    active: document.querySelector(".screen.active")?.id,
    day: player.day,
    dayLabel: document.getElementById("hud-date")?.textContent,
    spareHours: player.spareHours,
  }));
  describe("SPEC-025 §7.2.3 S9→続ける→翌朝に直進（ループ回避）", () => {
    it("screen-choose", () => assertEq(next.active, "screen-choose"));
    it("day=6（月曜）", () => assertEq(next.day, 6));
    it("日付表示が 2026年4月6日（月）", () => assertEq(next.dayLabel, "2026年4月6日（月）"));
    it("余剰時間が通常（8h）に復帰", () => assert(next.spareHours > 0, `spareHours=${next.spareHours}`));
  });

  describe("PAGEERR なし", () => {
    it("週境界遷移中エラー 0 件", () => {
      if (errs.length) throw new Error(errs.join("\n"));
    });
  });

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
