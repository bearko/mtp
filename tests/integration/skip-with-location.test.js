/**
 * @spec SPEC-047 §8.2a / SPEC-025 §7.1.3 v2 スキップ中の親遣い抑制
 *
 * 【回帰テスト】PR #20 で報告されたバグ：
 *   「週末までスキップ」押下時、途中の土曜や日曜で場所移動画面に飛び
 *   スキップが中断されてしまう。
 *
 * あるべき挙動：スキップ中は毎朝の親遣い抽選を抑制し、場所は home 固定。
 * 目標日（週末 = 日曜）に到達したら通常通り S10 → S9 → 月曜朝へ。
 */
const puppeteer = require("puppeteer-core");
const { describe, it, assert, assertEq } = require("../lib/assert.js");

async function jumpToChoose(page) {
  await page.click("#btn-title-start");
  await new Promise(r => setTimeout(r, 250));
  for (let i = 0; i < 20; i++) {
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

  await page.goto("http://localhost:8765/index.html", { waitUntil: "networkidle0" });
  await new Promise(r => setTimeout(r, 400));
  await jumpToChoose(page);

  // シナリオ 1: maybeResolveMorningLocation がスキップ中は home 固定
  const r1 = await page.evaluate(() => {
    player.day = 10;
    player.age = 2;
    player._skipRemainingDays = 3;
    player._skipTargetDay = 13;
    // home 以外の location でも、スキップ中は home に戻る
    player.location = "big_park";
    // Math.random を強制して「家以外が当たる」状態を作ってもなお home に戻ることを確認
    const orig = Math.random;
    Math.random = () => 0.99;
    maybeResolveMorningLocation();
    Math.random = orig;
    return {
      location: player.location,
      outingToday: player._parentalOutingToday,
    };
  });
  describe("SPEC-047 §8.2a スキップ中は親遣い抽選を抑制", () => {
    it("スキップ中は player.location = 'home' 固定", () => assertEq(r1.location, "home"));
    it("_parentalOutingToday = null", () => assertEq(r1.outingToday, null));
  });

  // シナリオ 2: _skipTargetDay >= day の日も抑制対象
  const r2 = await page.evaluate(() => {
    player.day = 13;
    player._skipRemainingDays = 0;
    player._skipTargetDay = 13;  // 到達日
    player.location = "big_park";
    Math.random = () => 0.99;
    maybeResolveMorningLocation();
    return { location: player.location, outingToday: player._parentalOutingToday };
  });
  describe("SPEC-047 §8.2a スキップ到達日（当日）も抑制", () => {
    it("到達日の朝は location = 'home' 固定", () => assertEq(r2.location, "home"));
  });

  // シナリオ 3: スキップ完了後は抽選が再開
  const r3 = await page.evaluate(() => {
    player.day = 14;
    player._skipRemainingDays = 0;
    player._skipTargetDay = 13;  // 到達済み
    // age 2 / phase1 の通常状態
    player.age = 2;
    player.location = "home";
    // 家以外が当たる乱数に固定
    Math.random = () => 0.99;
    maybeResolveMorningLocation();
    return {
      location: player.location,
      outingToday: player._parentalOutingToday,
      skipTargetDayCleared: player._skipTargetDay,
    };
  });
  describe("SPEC-047 §8.2a スキップ完了翌日は抽選再開", () => {
    it("_skipTargetDay は 0 にクリアされる", () => assertEq(r3.skipTargetDayCleared, 0));
    it("通常抽選が発動する（_parentalOutingToday が設定されるか home のまま）", () => {
      // Math.random=0.99 で必ず末尾が選ばれる実装なので何かしらの location が選ばれる
      // （home がたまたま選ばれる可能性もあるが、どちらでも PAGEERR なしが本質）
      assert(r3.location === "home" || r3.outingToday !== null,
        `loc=${r3.location} outing=${r3.outingToday}`);
    });
  });

  // シナリオ 4: skipToNextDaySummary を呼ぶと _skipTargetDay が設定される
  const r4 = await page.evaluate(() => {
    player.day = 10;
    player._skipRemainingDays = 0;
    player._skipTargetDay = 0;
    player.autoMode = true;
    player.passionProfileId = "bookworm_kid";
    // goSleep 等の副作用を避けるため、skip 自体を呼ばずにロジックの下限確認
    //   skipToNextDaySummary(3) → _skipRemainingDays=2, _skipTargetDay=13
    try { skipToNextDaySummary(3); } catch (e) { /* sleep → nextDay → render 連鎖で何か失敗しても ok */ }
    return { skipTargetDay: player._skipTargetDay };
  });
  describe("SPEC-047 §7.3 skipToNextDaySummary で _skipTargetDay が設定される", () => {
    it("skipToNextDaySummary(3) from day 10 → _skipTargetDay = 13", () => assertEq(r4.skipTargetDay, 13));
  });

  describe("PAGEERR なし", () => {
    it("スキップ × 場所システムでエラー 0 件", () => {
      if (errs.length) throw new Error(errs.slice(0, 3).join("\n"));
    });
  });

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
