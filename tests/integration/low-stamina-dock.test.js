/**
 * @spec SPEC-002 §5.9 低リソースプレイ / PR #18 バグ対応
 *
 * 【バグ回帰テスト】
 * 体力 1 / 2 / 3 など低体力時、ドックが空にならず遊びが選択可能であることを確認。
 * 時間不足（spareHours < timeCost）でも選択可能。
 * 余剰時間が完全ゼロ（<= 0）の場合のみドックは空。
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

  // シナリオ 1: 体力 1, 時間 8h
  const s1 = await page.evaluate(() => {
    player.stamina = 1;
    player.spareHours = 8;
    renderChooseScreen();
    return {
      dockCount: document.querySelectorAll(".dock-icon[data-play-id]").length,
      firstPlay: document.querySelector(".dock-icon[data-play-id]")?.dataset.playId,
      lowStaminaBadge: document.querySelector(".dock-icon[data-play-id].low-stamina") ? true : false,
    };
  });
  describe("SPEC-002 §5.9 体力 1 / 時間 8h でドックに遊びが出る", () => {
    it("ドックに 1 件以上ある（picturebook）", () => assert(s1.dockCount >= 1, `dockCount=${s1.dockCount}`));
    it("最初の遊びは picturebook", () => assertEq(s1.firstPlay, "picturebook"));
    it("low-stamina クラスが付いている", () => assertEq(s1.lowStaminaBadge, true));
  });

  // シナリオ 2: 体力 2, 時間 8h（ユーザー報告『2や3の時は正しい』を検証）
  const s2 = await page.evaluate(() => {
    player.stamina = 2;
    player.spareHours = 8;
    renderChooseScreen();
    return { dockCount: document.querySelectorAll(".dock-icon[data-play-id]").length };
  });
  describe("SPEC-002 §5.9 体力 2 でもドック表示", () => {
    it("dockCount >= 1", () => assert(s2.dockCount >= 1));
  });

  // シナリオ 3: 体力 3, 時間 8h
  const s3 = await page.evaluate(() => {
    player.stamina = 3;
    player.spareHours = 8;
    renderChooseScreen();
    return { dockCount: document.querySelectorAll(".dock-icon[data-play-id]").length };
  });
  describe("SPEC-002 §5.9 体力 3 でもドック表示", () => {
    it("dockCount >= 1", () => assert(s3.dockCount >= 1));
  });

  // シナリオ 4: 体力 1 + 時間 0.5h（旧バグの組み合わせ）
  const s4 = await page.evaluate(() => {
    player.stamina = 1;
    player.spareHours = 0.5;
    renderChooseScreen();
    return {
      dockCount: document.querySelectorAll(".dock-icon[data-play-id]").length,
      emptyMsg: document.querySelector("#play-dock p")?.textContent || "",
    };
  });
  describe("SPEC-002 §5.9 体力 1 / 時間 0.5h（旧バグ組み合わせ）", () => {
    it("ドックが空でない（時間不足でも遊べる）", () => {
      assert(s4.dockCount >= 1, `dockCount=${s4.dockCount} empty=${s4.emptyMsg}`);
    });
  });

  // シナリオ 5: 時間 0h（完全ゼロ） → ドック全滅
  const s5 = await page.evaluate(() => {
    player.stamina = 10;
    player.spareHours = 0;
    renderChooseScreen();
    return {
      dockCount: document.querySelectorAll(".dock-icon[data-play-id]").length,
      emptyMsg: document.querySelector("#play-dock p")?.textContent || "",
    };
  });
  describe("SPEC-002 §5.9.1a 時間 0 はドック全滅", () => {
    it("dockCount = 0", () => assertEq(s5.dockCount, 0));
    it("空メッセージ『今できる遊びがありません』", () => {
      assert(s5.emptyMsg.includes("今できる"), `msg=${s5.emptyMsg}`);
    });
  });

  // シナリオ 6: 体力 0 / 時間 8h → 選択可（倍率 0）
  const s6 = await page.evaluate(() => {
    player.stamina = 0;
    player.spareHours = 8;
    renderChooseScreen();
    const avails = PLAYS.map(p => isPlayAvailable(p)).filter(a => !a.isHidden);
    return {
      dockCount: document.querySelectorAll(".dock-icon[data-play-id]").length,
      allLow: avails.every(a => a.isLowStamina),
      sampleReason: avails[0]?.reasons?.[0] || "",
    };
  });
  describe("SPEC-002 §5.9 体力 0 / 時間 8h → 選択可（0%）", () => {
    it("dockCount >= 1", () => assert(s6.dockCount >= 1));
    it("全て low-stamina 扱い", () => assertEq(s6.allLow, true));
    it("経験値 0% の表示を含む", () => assert(/0%/.test(s6.sampleReason), `reason=${s6.sampleReason}`));
  });

  describe("PAGEERR なし", () => {
    it("全シナリオで PAGEERR 0 件", () => {
      if (errs.length) throw new Error(errs.slice(0, 3).join("\n"));
    });
  });

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
