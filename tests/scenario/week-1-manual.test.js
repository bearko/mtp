/**
 * @spec SPEC-036 §3.3 シナリオテスト：1 週間（Day 1〜5）を手動で通しプレイ
 *
 * Phase 0（初週）は自動モード封印なので手動のみ。picturebook → slide → sandbox
 * の段階解禁を経験しつつ、毎日 S10 サマリまで到達する。
 * 最終 Day 5 は日曜で S10 → S9 → 月曜朝 S2。
 *
 * 検証項目：
 * - 各日で PAGEERR 発生しない
 * - Day 1 終わりに intellect が増えている（絵本を最低 1 回遊ぶ）
 * - Day 5 終了時に Day=6 に進める
 */
const puppeteer = require("puppeteer-core");
const { describe, it, assert, assertEq } = require("../lib/assert.js");

async function playOneRoundOf(page, playId) {
  // dock アイコンが無ければ fallback（段階解禁中で見えない遊びは飛ばす）
  const found = await page.evaluate((id) => !!document.querySelector(`.dock-icon[data-play-id="${id}"]`), playId);
  if (!found) return false;
  await page.click(`.dock-icon[data-play-id="${playId}"]`);
  await new Promise(r => setTimeout(r, 200));
  // SPEC-002 §5.3: S2 操作はドックへ統合。選択後は同じアイコン再タップで遊ぶ。
  await page.click(`.dock-icon[data-play-id="${playId}"]`);
  await new Promise(r => setTimeout(r, 200));
  // スキップ
  await page.evaluate(() => {
    const b = document.getElementById("btn-skip-play");
    if (b && !b.hidden) b.click();
  });
  await new Promise(r => setTimeout(r, 500));
  // 介入モーダル / ランダムイベント S4 があれば閉じる
  for (let i = 0; i < 5; i++) {
    const cur = await page.evaluate(() => document.querySelector(".screen.active")?.id);
    const interrupt = await page.evaluate(() => !document.getElementById("interrupt-overlay").hidden);
    if (interrupt) {
      await page.evaluate(() => document.getElementById("btn-interrupt-close").click());
      await new Promise(r => setTimeout(r, 200));
      continue;
    }
    if (cur === "screen-event") {
      await page.evaluate(() => document.querySelector('[data-action="close-event"]').click());
      await new Promise(r => setTimeout(r, 200));
      continue;
    }
    break;
  }
  // S2 に戻る
  await page.evaluate(() => {
    const b = document.getElementById("btn-next-play");
    if (b && !b.hidden) b.click();
    const rs = document.getElementById("btn-result-sleep");
    if (rs && !document.getElementById("actions-result-sleep")?.hidden) rs.click();
  });
  await new Promise(r => setTimeout(r, 300));
  return true;
}

async function consumeDay(page) {
  // 体力・余剰がある限り 3 回まで遊ぶ
  for (let i = 0; i < 5; i++) {
    const cur = await page.evaluate(() => document.querySelector(".screen.active")?.id);
    if (cur !== "screen-choose") break;
    const played = await playOneRoundOf(page, "picturebook")
      || await playOneRoundOf(page, "slide")
      || await playOneRoundOf(page, "sandbox");
    if (!played) break;
    const spare = await page.evaluate(() => player.spareHours);
    if (spare <= 1) break;
  }
  // 今日おわる
  await page.evaluate(() => {
    const cur = document.querySelector(".screen.active")?.id;
    if (cur === "screen-choose") {
      const b = document.querySelector('[data-action="go-sleep"]');
      if (b) b.click();
    }
  });
  await new Promise(r => setTimeout(r, 500));
  // sleep 画面があれば進める
  for (let i = 0; i < 3; i++) {
    const s = await page.evaluate(() => document.querySelector(".screen.active")?.id);
    if (s === "screen-sleep") {
      await page.evaluate(() => {
        const b = document.querySelector('[data-action="child-sleep"]');
        if (b) b.click();
      });
      await new Promise(r => setTimeout(r, 400));
    } else break;
  }
}

async function dismissDaySummary(page) {
  // S10 → 続ける（phase0 は continue-row）
  for (let i = 0; i < 3; i++) {
    const s = await page.evaluate(() => document.querySelector(".screen.active")?.id);
    if (s === "screen-day-summary") {
      await page.evaluate(() => {
        const b = document.querySelector('[data-action="day-summary-continue"]');
        if (b) b.click();
      });
      await new Promise(r => setTimeout(r, 400));
    } else if (s === "screen-highlight") {
      await page.evaluate(() => document.getElementById("btn-continue-auto").click());
      await new Promise(r => setTimeout(r, 400));
    } else break;
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

  await page.goto("http://localhost:8765/index.html", { waitUntil: "networkidle0" });
  await new Promise(r => setTimeout(r, 400));
  // タイトル → 転生イントロ → S2
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

  // Day 1 をプレイ → S10 通過
  const day1Before = await page.evaluate(() => ({ day: player.day, intellect: player.soyou.intellect }));
  await consumeDay(page);
  await dismissDaySummary(page);

  const day2 = await page.evaluate(() => ({
    active: document.querySelector(".screen.active")?.id,
    day: player.day,
    intellect: player.soyou.intellect,
  }));
  describe("SPEC-036 シナリオ Day 1 完走", () => {
    it("Day 1 → Day 2 に進む", () => assertEq(day2.day, 2));
    it("Day 2 朝の screen-choose", () => assertEq(day2.active, "screen-choose"));
    it("絵本を遊んだので intellect が増加している", () => {
      if (day2.intellect <= day1Before.intellect) {
        throw new Error(`intellect: ${day1Before.intellect} → ${day2.intellect}`);
      }
    });
  });

  // Day 2..5 をループ
  for (let d = 2; d <= 5; d++) {
    await consumeDay(page);
    await dismissDaySummary(page);
  }

  const final = await page.evaluate(() => ({
    active: document.querySelector(".screen.active")?.id,
    day: player.day,
    dayLabel: document.getElementById("hud-date")?.textContent,
  }));
  describe("SPEC-036 Day 1〜5 シナリオ完走", () => {
    it("Day 6（翌週月曜）に到達", () => assertEq(final.day, 6));
    it("HUD 日付は 2026年4月6日（月）", () => assertEq(final.dayLabel, "2026年4月6日（月）"));
    it("screen-choose アクティブ", () => assertEq(final.active, "screen-choose"));
  });

  describe("PAGEERR なし", () => {
    it("1 週間通しプレイ中にエラー 0 件", () => {
      if (errs.length) throw new Error(errs.slice(0, 3).join("\n"));
    });
  });

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
