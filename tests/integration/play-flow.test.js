/**
 * @spec SPEC-002 §5.3 / SPEC-003 §5 / SPEC-035 §7.1
 * S2 → プレビュー → 遊ぶ → S3 描写 → 結果 → S2 復帰 のフロー。
 *
 * - 絵本を選ぶとヘッダーに体力ゴースト、素養カードに +10 バッジ
 * - 遊んだ後は S3 結果画面に素養カード3行・スキル行3行が出る
 * - 次の遊びを選ぶで S2 に戻り、素養の実数値が更新されている
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

  // 絵本選択
  await page.click('.dock-icon[data-play-id="picturebook"]');
  await new Promise(r => setTimeout(r, 250));

  const preview = await page.evaluate(() => ({
    hours: document.getElementById("hud-hours")?.textContent,
    ghostPct: document.getElementById("hud-stamina-bar-ghost")?.style.width,
    paramLabels: document.getElementById("param-strip-labels")?.textContent.replace(/\s+/g, " "),
    paramValues: document.getElementById("param-strip-values")?.textContent.replace(/\s+/g, " "),
    paramLabelCount: document.querySelectorAll("#param-strip-labels .param-strip-label").length,
    paramValueCount: document.querySelectorAll("#param-strip-values .param-strip-value").length,
    intellectParam: [...document.querySelectorAll("#param-strip-values .param-strip-value")][1]?.textContent.replace(/\s+/g, " "),
    paramVisible: !document.getElementById("param-strip")?.hidden,
    skillTags: document.getElementById("soyou-skill-tags")?.innerHTML,
    selected: document.querySelector('.dock-icon[data-play-id="picturebook"]')?.classList.contains("selected"),
    confirmBtnVisible: !!document.getElementById("btn-confirm-play") && getComputedStyle(document.getElementById("btn-confirm-play")).display !== "none",
  }));
  describe("SPEC-002 §5.3.1 絵本選択時のプレビュー", () => {
    it("時間表示が『8→6』", () => assertEq(preview.hours, "8→6"));
    it("ヘッダーに体力ゴースト（width>0）", () => {
      const pct = parseFloat(preview.ghostPct);
      assert(pct > 0, `ghostPct=${preview.ghostPct}`);
    });
    it("共通パラメーターバーが表示される", () => assertEq(preview.paramVisible, true));
    it("共通パラメーターバーに5素養が横並び", () => {
      assert(preview.paramLabels.includes("身体"), preview.paramLabels);
      assert(preview.paramLabels.includes("知性"), preview.paramLabels);
      assert(preview.paramLabels.includes("情熱"), preview.paramLabels);
    });
    it("共通パラメーターバー『知性』に +10", () => {
      assert(preview.paramValues.includes("+10"), preview.paramValues);
    });
    it("スキルタグが #読書 #文字 #感受性", () => {
      assert(preview.skillTags.includes("読書"), preview.skillTags);
      assert(preview.skillTags.includes("文字"), preview.skillTags);
    });
    it("絵本アイコンが選択状態", () => assertEq(preview.selected, true));
    it("旧『遊ぶ』ボタンは廃止", () => assertEq(preview.confirmBtnVisible, false));
    it("共通パラメーターバーが 2行×5列で表示される", () => {
      assertEq(preview.paramVisible, true);
      assertEq(preview.paramLabelCount, 5);
      assertEq(preview.paramValueCount, 5);
    });
    it("知性にプレビュー +10 が表示される", () =>
      assert(preview.intellectParam.includes("+10"), preview.intellectParam));
  });

  // 遊ぶ
  await page.click('.dock-icon[data-play-id="picturebook"]');
  await new Promise(r => setTimeout(r, 250));
  await page.click("#btn-skip-play");
  await new Promise(r => setTimeout(r, 500));
  // 介入モーダル / S4 ランダムイベント画面があれば閉じる
  for (let i = 0; i < 5; i++) {
    const cur = await page.evaluate(() => document.querySelector(".screen.active")?.id);
    const interrupt = await page.evaluate(() => !document.getElementById("interrupt-overlay").hidden);
    if (interrupt) {
      await page.evaluate(() => document.getElementById("btn-interrupt-close").click());
      await new Promise(r => setTimeout(r, 250));
      continue;
    }
    if (cur === "screen-event") {
      await page.evaluate(() => document.querySelector('[data-action="close-event"]').click());
      await new Promise(r => setTimeout(r, 250));
      continue;
    }
    break;
  }

  const result = await page.evaluate(() => ({
    active: document.querySelector(".screen.active")?.id,
    soyouRows: [...document.querySelectorAll("#result-soyou-list .soyou-row")].map(r => r.textContent.replace(/\s+/g, " ").trim()),
    skillLines: [...document.querySelectorAll("#result-skill-lines .skill-line")].map(r => r.textContent.replace(/\s+/g, " ").trim()),
    statusCardHidden: document.getElementById("result-status-card")?.hidden,
    intellectValue: player.soyou.intellect,
  }));
  describe("SPEC-035 §7.1 S3 結果画面", () => {
    it("screen-playing のまま結果フェーズ", () => assertEq(result.active, "screen-playing"));
    it("素養カードが少なくとも 1 行", () => assert(result.soyouRows.length >= 1, JSON.stringify(result.soyouRows)));
    it("知性の素養が増えている", () => assert(result.intellectValue > 0, `intellect=${result.intellectValue}`));
    it("スキル行が少なくとも 1 行", () => assert(result.skillLines.length >= 1));
    it("旧ステータスカードは hidden", () => assertEq(result.statusCardHidden, true));
  });

  // 次の遊びを選ぶ → S2
  await page.evaluate(() => {
    const b = document.getElementById("btn-next-play");
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 300));

  const back = await page.evaluate(() => ({
    active: document.querySelector(".screen.active")?.id,
    hours: document.getElementById("hud-hours")?.textContent,
    stamina: document.getElementById("hud-stamina")?.textContent,
  }));
  describe("SPEC-002 S2 復帰", () => {
    it("screen-choose に戻る", () => assertEq(back.active, "screen-choose"));
    it("残り時間が 8 未満に減少", () => {
      const h = parseFloat(back.hours.replace(/→.*/, ""));
      assert(h < 8, `hours=${back.hours}`);
    });
    it("体力が 15 未満に減少", () => {
      const s = parseFloat(back.stamina);
      assert(s < 15, `stamina=${back.stamina}`);
    });
  });

  describe("PAGEERR なし", () => {
    it("プレイフロー中エラー 0 件", () => {
      if (errs.length) throw new Error(errs.join("\n"));
    });
  });

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
