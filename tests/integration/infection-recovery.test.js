/**
 * @spec SPEC-057 感染症と治癒システム（毎晩判定 + 通院ショートカット）
 *
 * 検証内容:
 *  - 感染症中の朝に S2 をスキップして S10 直行
 *  - maybeHealInfection の確率分布（残1日 ~50%、残2日 ~30%、残3日 0%）
 *  - clinic 訪問フラグで 100% 治癒
 *  - 感染症中の朝の親遣い抽選で clinic が 90% 重み
 *  - clinic 訪問翌朝に「熱が下がった」モーダル
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
  // §2 maybeHealInfection 確率分布（モンテカルロ風サンプリング）
  // ============================================================
  const dist = await page.evaluate(() => {
    const sample = (remain, visited) => {
      let healed = 0;
      const N = 200;
      for (let i = 0; i < N; i++) {
        player._infectionRemainingDays = remain;
        player._visitedClinicToday = visited;
        if (maybeHealInfection()) healed++;
      }
      return healed / N;
    };
    return {
      remain1: sample(1, false),
      remain2: sample(2, false),
      remain3: sample(3, false),
      clinic: sample(5, true),
    };
  });
  describe("SPEC-057 §2 maybeHealInfection 確率分布", () => {
    it("残1日は 30%-70% の範囲（期待 50%）", () =>
      assert(dist.remain1 >= 0.3 && dist.remain1 <= 0.7, `actual=${dist.remain1}`));
    it("残2日は 15%-50% の範囲（期待 30%）", () =>
      assert(dist.remain2 >= 0.15 && dist.remain2 <= 0.5, `actual=${dist.remain2}`));
    it("残3日は 0%（期待 0%）", () => assertEq(dist.remain3, 0));
    it("clinic 訪問時は 100% 治癒", () => assertEq(dist.clinic, 1));
  });

  // ============================================================
  // §3 clinic 抽選（感染症中）
  // ============================================================
  const clinicDist = await page.evaluate(() => {
    let clinic = 0, home = 0, other = 0;
    const N = 100;
    for (let i = 0; i < N; i++) {
      player._specialDayMode = "infection";
      player._infectionRemainingDays = 2;
      const picked = pickWeekdayParentalOuting();
      if (picked?.id === "clinic") clinic++;
      else if (picked?.id === "home") home++;
      else other++;
    }
    return { clinic: clinic / N, home: home / N, other };
  });
  describe("SPEC-057 §3 感染症中の clinic 抽選", () => {
    it("clinic は 80%-100% の範囲（期待 90%）", () =>
      assert(clinicDist.clinic >= 0.8, `clinic=${clinicDist.clinic}`));
    it("clinic / home 以外は 0", () => assertEq(clinicDist.other, 0));
  });

  // ============================================================
  // §3 通常時は clinic を抽選しない
  // ============================================================
  const normalDist = await page.evaluate(() => {
    let clinic = 0;
    const N = 50;
    for (let i = 0; i < N; i++) {
      player._specialDayMode = null;
      player._infectionRemainingDays = 0;
      const picked = pickWeekdayParentalOuting();
      if (picked?.id === "clinic") clinic++;
    }
    return clinic;
  });
  describe("SPEC-057 §3 通常時は clinic を抽選しない", () => {
    it("clinic 選出 = 0", () => assertEq(normalDist, 0));
  });

  // ============================================================
  // §3 onLocationEntered("clinic") で訪問フラグ
  // ============================================================
  const visitFlag = await page.evaluate(() => {
    player._visitedClinicToday = false;
    player._specialDayMode = "infection";
    onLocationEntered("clinic");
    return {
      visited: player._visitedClinicToday,
      mode: player._specialDayMode,
    };
  });
  describe("SPEC-057 §3 clinic 訪問でフラグが立つ", () => {
    it("_visitedClinicToday = true", () => assertEq(visitFlag.visited, true));
    it("_specialDayMode = clinic", () => assertEq(visitFlag.mode, "clinic"));
  });

  // ============================================================
  // §1 感染症中は S2 スキップ → S10 へ直行
  // ============================================================
  // モーダル表示中 → 閉じる → S10 になることを確認
  await page.evaluate(() => {
    // S2 を一旦表示
    showScreen("screen-choose");
    player._infectionRemainingDays = 3;
    player._specialDayMode = "infection";
    player.spareHours = 0;
    player._pendingMorningEventModals = [];
    enqueueMorningEventModal({
      art: "🤧",
      title: "風邪をひいてしまった",
      desc: "保育園で風邪をもらってきたみたい",
      effects: [{ label: "余剰時間", delta: -8, unit: "h" }],
      comment: { speaker: "mother", body: "ゆっくり休もうね" },
    });
    goChooseFromToday();
  });
  await new Promise(r => setTimeout(r, 300));
  const inModal = await page.evaluate(() => ({
    visible: !document.getElementById("event-overlay")?.hidden,
    title: document.getElementById("event-modal-title")?.textContent,
  }));
  describe("SPEC-057 §1 感染症発動でイベントモーダル表示", () => {
    it("モーダル visible", () => assertEq(inModal.visible, true));
    it("title = 風邪をひいてしまった", () => assertEq(inModal.title, "風邪をひいてしまった"));
  });

  await page.click("#btn-event-modal-close");
  await new Promise(r => setTimeout(r, 500));
  const afterClose = await page.evaluate(() => ({
    active: document.querySelector(".screen.active")?.id,
  }));
  describe("SPEC-057 §1 モーダル閉じる → S10 直行（S2 スキップ）", () => {
    it("screen-day-summary に遷移", () => assertEq(afterClose.active, "screen-day-summary"));
  });

  // ============================================================
  // §2 治癒したら _infectionJustHealed が立ち、翌朝モーダル表示
  // ============================================================
  const healFlow = await page.evaluate(() => {
    player._infectionRemainingDays = 5;
    player._visitedClinicToday = true;
    player._infectionJustHealed = false;
    const healed = maybeHealInfection();
    return {
      healed,
      remain: player._infectionRemainingDays,
      mode: player._specialDayMode,
      justHealed: player._infectionJustHealed,
      visited: player._visitedClinicToday,
    };
  });
  describe("SPEC-057 §2 §3 clinic 訪問翌晩の治癒判定", () => {
    it("healed = true", () => assertEq(healFlow.healed, true));
    it("残日数 = 0", () => assertEq(healFlow.remain, 0));
    it("specialDayMode = null", () => assertEq(healFlow.mode, null));
    it("_infectionJustHealed = true（朝モーダル用）", () => assertEq(healFlow.justHealed, true));
    it("_visitedClinicToday は消費されてリセット", () => assertEq(healFlow.visited, false));
  });

  // ============================================================
  // §1 clinic 場所マスタが locations.json に存在する
  // ============================================================
  const clinicLoc = await page.evaluate(() =>
    LOCATIONS.find(l => l.id === "clinic"));
  describe("SPEC-057 §1 clinic 場所マスタ", () => {
    it("LOCATIONS に clinic", () => assert(clinicLoc, "no clinic"));
    it("name = お医者さん", () => assertEq(clinicLoc.name, "お医者さん"));
    it("specialBuffs.healInfection = true", () =>
      assertEq(clinicLoc.specialBuffs?.healInfection, true));
    it("通常時の親遣い重み = 0", () =>
      assertEq(clinicLoc.parentalOutingWeekdayWeight, 0));
  });

  describe("PAGEERR なし", () => {
    it("感染症 / 治癒 / 通院フローでエラー 0 件", () => {
      if (errs.length) throw new Error(errs.slice(0, 3).join("\n"));
    });
  });

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
