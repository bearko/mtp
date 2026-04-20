/**
 * @spec SPEC-047 場所・マップシステムの結合テスト
 *
 * - LOCATIONS が読み込まれる
 * - HUD に場所表示が出る（情熱 hidden）
 * - player.location = home で、絵本はドックに出る／滑り台は出ない（phase1 の段階解禁で slide は解禁済にしてテスト）
 * - player.location を near_park にすると、滑り台が出て絵本が出ない
 * - 親遣い抽選で家以外が選ばれたとき、移動演出画面（screen-travel）が表示される
 * - 移動結果画面で「遊ぶ」ボタン → screen-choose 遷移
 * - fullday_trip（動物園）選択時は runFullDayEvent 経由で S10 に遷移
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

  const hudCheck = await page.evaluate(() => ({
    hudLocationText: document.getElementById("hud-location")?.textContent,
    hudPassionHidden: document.getElementById("hud-passion-row")?.hidden,
    locationsCount: typeof LOCATIONS !== "undefined" ? LOCATIONS.length : 0,
    playerLocation: player.location,
  }));
  describe("SPEC-047 §4 §6 LOCATIONS ロード & HUD 場所表示", () => {
    it("LOCATIONS は 10 件以上", () => assert(hudCheck.locationsCount >= 10, `count=${hudCheck.locationsCount}`));
    it("HUD に 🏠 自宅 が表示", () => {
      assert(hudCheck.hudLocationText.includes("自宅") || hudCheck.hudLocationText.includes("🏠"), hudCheck.hudLocationText);
    });
    it("旧情熱表示は hidden", () => assertEq(hudCheck.hudPassionHidden, true));
    it("player.location == 'home'", () => assertEq(hudCheck.playerLocation, "home"));
  });

  // 場所変更シナリオ：home では絵本が出る、公園では滑り台が出る
  const homeDock = await page.evaluate(() => {
    player.location = "home";
    player.unlockedPlays = ["picturebook", "slide", "sandbox", "clay", "playhouse"];
    renderChooseScreen();
    return [...document.querySelectorAll(".dock-icon[data-play-id]")].map(el => el.dataset.playId);
  });
  describe("SPEC-047 §5.1 home ではホーム向け遊びのみドック表示", () => {
    it("picturebook（絵本）がある", () => assert(homeDock.includes("picturebook"), JSON.stringify(homeDock)));
    it("slide（滑り台）は出ない（home には紐づかない）", () => {
      assert(!homeDock.includes("slide"), `slide appeared in home dock: ${JSON.stringify(homeDock)}`);
    });
  });

  const parkDock = await page.evaluate(() => {
    // slide は ageMin=2 なので age を持ち上げ、phase0 段階解禁制約を外すため day を 8 に
    player.day = 8;
    player.age = 2;
    player.location = "near_park";
    player.unlockedPlays = ["picturebook", "slide", "sandbox", "clay", "playhouse"];
    renderChooseScreen();
    return [...document.querySelectorAll(".dock-icon[data-play-id]")].map(el => el.dataset.playId);
  });
  describe("SPEC-047 §5.1 near_park では公園向け遊び", () => {
    it("slide がある", () => assert(parkDock.includes("slide"), JSON.stringify(parkDock)));
    it("sandbox がある", () => assert(parkDock.includes("sandbox")));
    it("picturebook は出ない", () => assert(!parkDock.includes("picturebook")));
  });

  // 移動演出フロー：startTravelAnimation を直接呼んで S15 → S16 遷移をテスト
  console.log("\n=== 移動演出フロー ===");
  await page.evaluate(() => {
    const zoo = LOCATIONS.find(l => l.id === "zoo");
    startTravelAnimation(zoo, true);
  });
  await new Promise(r => setTimeout(r, 300));
  const travelScreen = await page.evaluate(() => ({
    active: document.querySelector(".screen.active")?.id,
    title: document.getElementById("travel-title")?.textContent,
  }));
  describe("SPEC-047 §7.3 移動演出画面（S15）", () => {
    it("screen-travel が active", () => assertEq(travelScreen.active, "screen-travel"));
    it("動物園に向かっている", () => assert(/動物園/.test(travelScreen.title), travelScreen.title));
  });

  // 1.7 秒後に自動で S16 へ
  await new Promise(r => setTimeout(r, 1800));
  const resultScreen = await page.evaluate(() => ({
    active: document.querySelector(".screen.active")?.id,
    title: document.getElementById("travel-result-title")?.textContent,
    btnLabel: document.getElementById("btn-travel-result-next")?.textContent,
    location: player.location,
  }));
  describe("SPEC-047 §7.3 移動結果画面（S16）", () => {
    it("screen-travel-result に自動遷移", () => assertEq(resultScreen.active, "screen-travel-result"));
    it("「動物園に来た！」", () => assert(/動物園/.test(resultScreen.title), resultScreen.title));
    it("player.location == 'zoo'", () => assertEq(resultScreen.location, "zoo"));
    it("fullday_trip なので『1日すごす』ボタン", () => assertEq(resultScreen.btnLabel, "1日すごす"));
  });

  // ボタンクリックで runFullDayEvent 発動、intellect が加算される
  const beforeIntellect = await page.evaluate(() => player.soyou.intellect);
  await page.click("#btn-travel-result-next");
  await new Promise(r => setTimeout(r, 500));
  const afterFullday = await page.evaluate(() => ({
    active: document.querySelector(".screen.active")?.id,
    intellect: player.soyou.intellect,
    persistBuffsCount: (player.persistBuffs || []).length,
    location: player.location,
  }));
  describe("SPEC-047 §7.4 fullday_trip：動物園で 1 日過ごす", () => {
    it("S10 日サマリに遷移", () => assertEq(afterFullday.active, "screen-day-summary"));
    it("intellect が大きく増加（動物園は +40）", () => {
      assert(afterFullday.intellect - beforeIntellect >= 40, `diff=${afterFullday.intellect - beforeIntellect}`);
    });
    it("帰宅して location == home", () => assertEq(afterFullday.location, "home"));
  });

  // 持続バフのテスト：博物館後に読書系の倍率が上がる
  console.log("\n=== 博物館の持続バフ ===");
  await page.evaluate(() => {
    // 1 日サマリを閉じて再利用
    const b = document.querySelector('[data-action="day-summary-continue"]');
    if (b) b.click();
  });
  await new Promise(r => setTimeout(r, 500));

  const buffTest = await page.evaluate(() => {
    const museum = LOCATIONS.find(l => l.id === "museum");
    runFullDayEvent(museum);
    return {
      persistBuffs: player.persistBuffs,
    };
  });
  describe("SPEC-047 §8.3 博物館の持続バフ", () => {
    it("persistBuffs に reading +20% 30日 が追加される", () => {
      const b = (buffTest.persistBuffs || []).find(x => x.category === "reading");
      assert(!!b, JSON.stringify(buffTest.persistBuffs));
      if (b) {
        assertEq(b.multiplier, 1.20);
      }
    });
  });

  describe("PAGEERR なし", () => {
    it("場所システム全般でエラー 0 件", () => {
      if (errs.length) throw new Error(errs.slice(0, 3).join("\n"));
    });
  });

  await browser.close();
})().catch(e => { console.error(e); process.exit(1); });
