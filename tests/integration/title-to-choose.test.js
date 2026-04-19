/**
 * @spec SPEC-030 §4.3 / SPEC-031 §4
 * 起動 → タイトル → 転生イントロ 4 シーン → 遊び選択画面（S2）到達まで。
 *
 * - S0 でロゴ「りとらいふ」と「はじめから」ボタンが表示される
 * - 名前入力フェーズで空入力決定だとランダム名が入る
 * - Scene 4 の最後のタップで screen-choose に遷移する
 * - S2 到達時点で HUD の日付が「2026年4月1日（水）」、年齢「1歳」
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
  page.on("pageerror", (e) => errs.push("PAGEERR:" + e.message));

  await page.goto("http://localhost:8765/index.html", { waitUntil: "networkidle0" });
  await new Promise(r => setTimeout(r, 400));

  describe("SPEC-030 タイトル画面", () => {
    // 内部で await を呼べないので同期チェックだけ。結果は外で assert
  });

  const s0 = await page.evaluate(() => ({
    active: document.querySelector(".screen.active")?.id,
    logo: document.querySelector(".title-logo")?.textContent,
    startBtn: document.getElementById("btn-title-start")?.textContent.trim(),
    continueDisabled: document.getElementById("btn-title-continue")?.disabled,
    hudHidden: document.getElementById("hud")?.hidden,
  }));

  describe("SPEC-030 起動直後の S0 タイトル", () => {
    it("screen-title がアクティブ", () => assertEq(s0.active, "screen-title"));
    it("ロゴ『りとらいふ』が表示", () => assertEq(s0.logo, "りとらいふ"));
    it("『はじめから』ボタンが存在", () => assertEq(s0.startBtn, "はじめから"));
    it("『続きから』は disabled", () => assertEq(s0.continueDisabled, true));
    it("タイトル中は HUD が hidden", () => assertEq(s0.hudHidden, true));
  });

  await page.click("#btn-title-start");
  await new Promise(r => setTimeout(r, 300));

  const sc1 = await page.evaluate(() => ({
    active: document.querySelector(".screen.active")?.id,
    scene: document.getElementById("screen-isekai")?.getAttribute("data-scene"),
    speaker: document.getElementById("isekai-speaker")?.textContent,
    message: document.getElementById("isekai-message")?.textContent,
  }));
  describe("SPEC-031 Scene 1 暗闇", () => {
    it("screen-isekai アクティブ", () => assertEq(sc1.active, "screen-isekai"));
    it("scene1 で ・・・", () => {
      assertEq(sc1.scene, "scene1");
      assertEq(sc1.message, "・・・");
    });
  });

  // scene1 を 2 回タップで scene2 へ
  await page.click("#isekai-stage");
  await new Promise(r => setTimeout(r, 200));
  await page.click("#isekai-stage");
  await new Promise(r => setTimeout(r, 300));

  const sc2 = await page.evaluate(() => ({
    scene: document.getElementById("screen-isekai")?.getAttribute("data-scene"),
    haloHidden: document.getElementById("isekai-halo")?.hidden,
    message: document.getElementById("isekai-message")?.textContent,
  }));
  describe("SPEC-031 Scene 2 神との対話", () => {
    it("scene2 に遷移", () => assertEq(sc2.scene, "scene2"));
    it("後光演出（halo）が表示", () => assertEq(sc2.haloHidden, false));
    it("最初のメッセージは『はい。では確認のためにお名前をお願いします』", () =>
      assertEq(sc2.message, "はい。では確認のためにお名前をお願いします"));
  });

  // 名前入力フェーズへ
  await page.click("#isekai-stage");
  await new Promise(r => setTimeout(r, 300));
  // 空入力のまま決定 → ランダム名が入る
  await page.click("#isekai-input-btn");
  await new Promise(r => setTimeout(r, 300));
  const nameState = await page.evaluate(() => ({
    playerName: player.name,
    message: document.getElementById("isekai-message")?.textContent,
  }));
  describe("SPEC-031 §4.2 名前入力", () => {
    it("空入力でもランダム名が入る", () => assert(nameState.playerName && nameState.playerName.length > 0, "name empty"));
    it("次メッセージに名前が置換される", () =>
      assert(nameState.message.includes(nameState.playerName), `message=${nameState.message}`));
  });

  // scene2 の残りメッセージ & scene3 & scene4 までタップで進める
  for (let i = 0; i < 15; i++) {
    const cur = await page.evaluate(() => document.querySelector(".screen.active")?.id);
    if (cur !== "screen-isekai") break;
    await page.click("#isekai-stage");
    await new Promise(r => setTimeout(r, 250));
  }

  const final = await page.evaluate(() => ({
    active: document.querySelector(".screen.active")?.id,
    hudHidden: document.getElementById("hud")?.hidden,
    hudDate: document.getElementById("hud-date")?.textContent,
    hudAge: document.getElementById("hud-age-chip")?.textContent,
    avatarName: player.avatarName,
    stageName: document.getElementById("hud-stage-name")?.textContent,
  }));
  describe("SPEC-031 §4.4 S2 遊び選択画面に到達", () => {
    it("screen-choose アクティブ", () => assertEq(final.active, "screen-choose"));
    it("HUD が再表示される", () => assertEq(final.hudHidden, false));
    it("日付は 2026年4月1日（水）", () => assertEq(final.hudDate, "2026年4月1日（水）"));
    it("年齢チップは 1歳", () => assertEq(final.hudAge, "1歳"));
    it("ステージ名は 保育園1年目", () => assertEq(final.stageName, "保育園1年目"));
    it("主人公名（avatarName）がランダム決定されている", () =>
      assert(final.avatarName && final.avatarName.length > 0, `avatarName=${final.avatarName}`));
  });

  describe("PAGEERR なし", () => {
    it("起動〜S2 到達までエラー 0 件", () => {
      if (errs.length) throw new Error(errs.join("\n"));
    });
  });

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
