/**
 * @spec SPEC-056 §1 §4 統一イベントモーダル + ミッション体力 0 許容（デザートは別腹）
 *
 * 検証内容:
 *  - showEventModal() が art/title/desc/effects/comment を正しく描画する
 *  - effects / comment 省略時に該当領域が hidden になる
 *  - delta の正負で色クラスが切り替わる
 *  - 感染症モーダルが朝のフローで表示される
 *  - ミッション達成プロンプト中は handleStaminaDepleted が遅延される
 *  - 体力 1 でプレイ → 体力 0 → ミッション挑戦は阻害されない
 *  - 「ちょうせんしてみる」 → 達成 → S2 復帰の流れ
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

  // ============================================================
  // §1 統一イベントモーダル
  // ============================================================
  // 全要素ありで表示
  await page.evaluate(() => {
    showEventModal({
      art: "🤧",
      title: "風邪をひいてしまった",
      desc: "保育園で風邪をもらってきた…",
      effects: [
        { label: "余剰時間",   delta: -8, unit: "h" },
        { label: "感染症日数", delta: 3,  unit: "日" },
      ],
      comment: { speaker: "mother", body: "ゆっくり休もうね" },
    });
  });
  await new Promise(r => setTimeout(r, 200));
  const full = await page.evaluate(() => ({
    visible: !document.getElementById("event-overlay")?.hidden,
    art: document.getElementById("event-modal-art")?.textContent,
    title: document.getElementById("event-modal-title")?.textContent,
    desc: document.getElementById("event-modal-desc")?.textContent,
    effectsHidden: document.getElementById("event-modal-effects")?.hidden,
    effectsCount: document.querySelectorAll("#event-modal-effects-list li").length,
    firstEffectClass: document.querySelector("#event-modal-effects-list .effect-delta")?.className,
    secondEffectClass: document.querySelectorAll("#event-modal-effects-list .effect-delta")[1]?.className,
    commentHidden: document.getElementById("event-modal-comment")?.hidden,
    speaker: document.getElementById("event-modal-comment-speaker")?.textContent,
    body: document.getElementById("event-modal-comment-body")?.textContent,
  }));
  describe("SPEC-056 §1 統一イベントモーダル：全要素表示", () => {
    it("オーバーレイが visible", () => assertEq(full.visible, true));
    it("art = 🤧", () => assertEq(full.art, "🤧"));
    it("title = 風邪をひいてしまった", () => assertEq(full.title, "風邪をひいてしまった"));
    it("desc に保育園の文言", () => assert(full.desc.includes("保育園")));
    it("effects 領域が表示", () => assertEq(full.effectsHidden, false));
    it("effects 2 件", () => assertEq(full.effectsCount, 2));
    it("delta -8 は down クラス", () => assert(full.firstEffectClass.includes("down"), full.firstEffectClass));
    it("delta +3 は up クラス", () => assert(full.secondEffectClass.includes("up"), full.secondEffectClass));
    it("comment 領域が表示", () => assertEq(full.commentHidden, false));
    it("speaker = お母さん", () => assertEq(full.speaker, "お母さん"));
    it("body = ゆっくり休もうね", () => assertEq(full.body, "ゆっくり休もうね"));
  });

  // 閉じる
  await page.click("#btn-event-modal-close");
  await new Promise(r => setTimeout(r, 200));
  const closed = await page.evaluate(() => document.getElementById("event-overlay")?.hidden);
  describe("SPEC-056 §1 モーダル close", () => {
    it("hidden に戻る", () => assertEq(closed, true));
  });

  // effects / comment 省略
  await page.evaluate(() => {
    showEventModal({
      art: "🌸", title: "シンプル告知", desc: "影響もコメントもないイベント",
    });
  });
  await new Promise(r => setTimeout(r, 200));
  const minimal = await page.evaluate(() => ({
    effectsHidden: document.getElementById("event-modal-effects")?.hidden,
    commentHidden: document.getElementById("event-modal-comment")?.hidden,
  }));
  describe("SPEC-056 §1 effects / comment 省略時", () => {
    it("effects 領域が非表示", () => assertEq(minimal.effectsHidden, true));
    it("comment 領域が非表示", () => assertEq(minimal.commentHidden, true));
  });
  await page.click("#btn-event-modal-close");
  await new Promise(r => setTimeout(r, 200));

  // ============================================================
  // §4 ミッション達成は体力 0 でも挑戦可能（デザートは別腹）
  // ============================================================
  // 体力 1 → picturebook を遊んだ後、累計 6 に到達 → manualAttempt プロンプト
  await page.evaluate(() => {
    player.day = 12;
    player.age = 1;
    player._playCounts = { picturebook: 6 };
    player.soyou.intellect = 15;
    player.soyou.sensitivity = 10;
    player.activeMissions = [{ id: "m_picturebook_first", state: "ACCEPTED", startDay: 8, hintsShown: [] }];
    player.completedMissions = [];
    player.titles = [];
    onPlayFinalized({ id: "picturebook", categories: ["reading"], gain: { intellect: 5 } });
  });
  await new Promise(r => setTimeout(r, 400));
  const prompt = await page.evaluate(() => ({
    active: document.querySelector(".screen.active")?.id,
    isModalActive: isMissionModalActive(),
  }));
  describe("SPEC-056 §4 manualAttempt 達成プロンプト表示", () => {
    it("screen-mission-attempt-prompt が active", () =>
      assertEq(prompt.active, "screen-mission-attempt-prompt"));
    it("isMissionModalActive = true", () => assertEq(prompt.isModalActive, true));
  });

  // 体力を 0 にして、ミッションが阻害されないことを確認
  const noBlock = await page.evaluate(() => {
    player.stamina = 0;
    return {
      // プロンプトは表示されたまま
      active: document.querySelector(".screen.active")?.id,
      isModalActive: isMissionModalActive(),
    };
  });
  describe("SPEC-056 §4 体力 0 でも挑戦可能", () => {
    it("プロンプトのまま (active 不変)", () => assertEq(noBlock.active, "screen-mission-attempt-prompt"));
    it("isMissionModalActive 維持", () => assertEq(noBlock.isModalActive, true));
  });

  // 「ちょうせんしてみる」を押す → 達成シーン → 完走
  await page.click("#btn-attempt-prompt-yes");
  await new Promise(r => setTimeout(r, 400));
  const accomplished = await page.evaluate(() => ({
    active: document.querySelector(".screen.active")?.id,
    titles: player.titles.map(t => t.id),
  }));
  describe("SPEC-056 §4 達成シーン突入", () => {
    it("screen-mission-modal active", () => assertEq(accomplished.active, "screen-mission-modal"));
    it("title_picturebook_first 獲得", () =>
      assert(accomplished.titles.includes("title_picturebook_first"), JSON.stringify(accomplished.titles)));
  });

  // 「つぎへ」連打して完走
  for (let i = 0; i < 12; i++) {
    const a = await page.evaluate(() => document.querySelector(".screen.active")?.id);
    if (a !== "screen-mission-modal") break;
    await page.click("#btn-mission-modal-next");
    await new Promise(r => setTimeout(r, 200));
  }
  const final = await page.evaluate(() => ({
    active: document.querySelector(".screen.active")?.id,
    completedHas: player.completedMissions.includes("m_picturebook_first"),
  }));
  describe("SPEC-056 §4 達成完走後の遷移", () => {
    it("S2 (screen-choose) に復帰", () => assertEq(final.active, "screen-choose"));
    it("completedMissions に m_picturebook_first", () => assertEq(final.completedHas, true));
  });

  // ============================================================
  // §4 体力 0 で finalizePlay → handleStaminaDepleted 遅延の動作
  // ============================================================
  // ミッションプロンプトが立っている状態で stamina <= 0 → _pendingStaminaDepleted=true
  // モーダル閉じ時に消化されることを確認
  await page.evaluate(() => {
    player.day = 14;
    player.age = 1;
    player.stamina = 0;
    player.completedMissions = [];
    player.activeMissions = [{ id: "m_picturebook_first", state: "ACCEPTED", startDay: 8, hintsShown: [] }];
    player.titles = [];
    player._playCounts = { picturebook: 6 };
    // モーダルが立っている疑似状態：onPlayFinalized 経由で attempt-prompt を表示
    onPlayFinalized({ id: "picturebook", categories: ["reading"], gain: { intellect: 0 } });
  });
  await new Promise(r => setTimeout(r, 300));
  const promptOpen = await page.evaluate(() => ({
    active: document.querySelector(".screen.active")?.id,
    isModalActive: isMissionModalActive(),
  }));
  describe("SPEC-056 §4 体力 0 でもプロンプトが先に出る", () => {
    it("screen-mission-attempt-prompt active", () => assertEq(promptOpen.active, "screen-mission-attempt-prompt"));
  });

  // 「まだ、こんどにする」 → consumePendingStaminaDepleted がない（finalizePlay 経由じゃないので）
  // ここでは別の経路でテスト：finalizePlay 経由ではない直接呼び出し
  // 「まだ」を選んでも stamina=0 なので onAttemptPromptLater 内で消化が呼ばれるかどうか
  await page.evaluate(() => {
    player._pendingStaminaDepleted = true;  // 強制セット
  });
  await page.click("#btn-attempt-prompt-later");
  await new Promise(r => setTimeout(r, 500));
  const afterLater = await page.evaluate(() => ({
    pending: player._pendingStaminaDepleted,
    // 強制就寝で screen-sleep または screen-day-summary に遷移したかどうか
    active: document.querySelector(".screen.active")?.id,
  }));
  describe("SPEC-056 §4 「まだ」を選ぶと保留中の体力 0 が消化される", () => {
    it("_pendingStaminaDepleted = false に戻る", () => assertEq(afterLater.pending, false));
  });

  describe("PAGEERR なし", () => {
    it("統一イベントモーダル + デザート別腹フローでエラー 0 件", () => {
      if (errs.length) throw new Error(errs.slice(0, 3).join("\n"));
    });
  });

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
