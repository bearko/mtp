/**
 * @spec SPEC-019 §5.4.1 体力ゼロ時の強制仮眠（1-12歳）
 * @spec SPEC-035 §8.1 削除済み DOM 参照の null ガード
 *
 * 体力を 3 に下げて picturebook（cost 4）をプレイ → handleStaminaDepleted() が発動
 * PAGEERR 発生しないこと、スキップ等のボタンが無効化されないことを確認。
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

  // タイトル → 転生イントロを抜ける
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

  // 体力を 3 に設定して絵本（cost 4）を遊ぶ → 体力ゼロになり handleStaminaDepleted
  await page.evaluate(() => { player.stamina = 3; renderHUD(); });
  await page.click('.dock-icon[data-play-id="picturebook"]');
  await new Promise(r => setTimeout(r, 200));
  await page.click('.dock-icon[data-play-id="picturebook"]');
  await new Promise(r => setTimeout(r, 200));
  await page.click("#btn-skip-play");
  await new Promise(r => setTimeout(r, 700));
  // 介入モーダル / ランダムイベントが出ていれば閉じる
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

  const state = await page.evaluate(() => ({
    active: document.querySelector(".screen.active")?.id,
    stamina: player.stamina,
    depletedDays: player.depletedDays,
    staminaCap: player.staminaCap,
    // 結果画面のボタンが触れる状態か
    normalBtnHidden: document.getElementById("actions-result-normal")?.hidden,
    btnNextDisabled: document.getElementById("btn-next-play")?.disabled,
  }));

  describe("SPEC-019 §5.4.1 体力ゼロ時の強制仮眠", () => {
    it("depletedDays に当日が記録される", () =>
      assert(state.depletedDays.length >= 1, `depletedDays=${JSON.stringify(state.depletedDays)}`));
    it("体力が 30% 回復している（少なくとも 3 以上）", () =>
      assert(state.stamina >= 3, `stamina=${state.stamina} cap=${state.staminaCap}`));
    it("screen-playing のまま結果画面", () => assertEq(state.active, "screen-playing"));
  });

  describe("SPEC-035 §8.1 ボタンが依然として反応する", () => {
    it("『次の遊びを選ぶ』ボタンは無効化されていない", () => assertEq(state.btnNextDisabled, false));
    it("通常フッターが表示されている", () => assertEq(state.normalBtnHidden, false));
  });

  describe("PAGEERR なし", () => {
    it("体力ゼロ処理中にエラー 0 件（SPEC-035 §8.1 回帰テスト）", () => {
      if (errs.length) throw new Error(errs.join("\n"));
    });
  });

  // 実際に『次の遊びを選ぶ』が動くか
  await page.evaluate(() => document.getElementById("btn-next-play").click());
  await new Promise(r => setTimeout(r, 300));
  const backToChoose = await page.evaluate(() => document.querySelector(".screen.active")?.id);
  describe("S2 復帰が可能", () => {
    it("screen-choose に遷移できる", () => assertEq(backToChoose, "screen-choose"));
  });

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
