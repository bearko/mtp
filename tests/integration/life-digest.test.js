/**
 * @spec SPEC-059 §8
 * S2 から人生ダイジェストを開始し、各章で1つずつ選択して人生アルバムまで到達する。
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
    await new Promise(r => setTimeout(r, 140));
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
  await new Promise(r => setTimeout(r, 300));
  await jumpToChoose(page);

  const entry = await page.evaluate(() => ({
    active: document.querySelector(".screen.active")?.id,
    entryCard: !!document.getElementById("life-digest-entry"),
    dockLifeIcon: !!document.querySelector(".dock-life-digest"),
    menuExpanded: document.getElementById("btn-s2-menu")?.getAttribute("aria-expanded"),
    menuHidden: document.getElementById("s2-menu")?.hidden,
  }));
  describe("SPEC-059 §5.2 S2 入口", () => {
    it("screen-choose に完走モード入口がある", () => assertEq(entry.active, "screen-choose"));
    it("大きな入口カードは表示しない", () => assertEq(entry.entryCard, false));
    it("完走モードは遊びドックに直接出さない", () => assertEq(entry.dockLifeIcon, false));
    it("サブメニューは初期状態で閉じている", () => {
      assertEq(entry.menuExpanded, "false");
      assertEq(entry.menuHidden, true);
    });
  });

  await page.evaluate(() => document.getElementById("btn-s2-menu")?.click());
  await new Promise(r => setTimeout(r, 100));
  const opened = await page.evaluate(() => ({
    hidden: document.getElementById("s2-menu")?.hidden,
    labels: [...document.querySelectorAll(".s2-menu-item")].map((b) => b.textContent.replace(/\s+/g, "")),
  }));
  describe("SPEC-059 §5.2 サブメニュー内の完走", () => {
    it("サブメニューが開く", () => assertEq(opened.hidden, false));
    it("完走がサブメニュー内にある", () => assert(opened.labels.includes("📚完走"), opened.labels.join(",")));
  });
  await page.evaluate(() => document.querySelector('.s2-menu-item[data-menu-action="start-life-digest"]')?.click());
  await new Promise(r => setTimeout(r, 150));
  const first = await page.evaluate(() => ({
    active: document.querySelector(".screen.active")?.id,
    title: document.getElementById("life-digest-title")?.textContent,
    choices: document.querySelectorAll(".life-choice-card").length,
    progress: document.getElementById("life-digest-progress")?.textContent,
  }));
  describe("SPEC-059 §5.2 S18 初期表示", () => {
    it("screen-life-digest が active", () => assertEq(first.active, "screen-life-digest"));
    it("人生 1/9 表示", () => assertEq(first.progress, "人生 1/9"));
    it("3択が表示される", () => assertEq(first.choices, 3));
    it("最初の章は3歳", () => assert(first.title.includes("3歳"), first.title));
  });

  for (let i = 0; i < 9; i++) {
    await page.click(".life-choice-card");
    await new Promise(r => setTimeout(r, 120));
  }

  const ending = await page.evaluate(() => ({
    active: document.querySelector(".screen.active")?.id,
    summary: document.getElementById("life-ending-summary")?.textContent,
    stats: document.getElementById("life-ending-score")?.textContent.replace(/\s+/g, " "),
    albumCount: document.querySelectorAll("#life-album-list li").length,
    age: player.age,
    passion: player.soyou?.passion,
  }));
  describe("SPEC-059 §6 人生アルバム", () => {
    it("screen-life-ending が active", () => assertEq(ending.active, "screen-life-ending"));
    it("アルバムに9件の思い出", () => assertEq(ending.albumCount, 9));
    it("100歳サマリが表示される", () => assert(ending.summary.includes("100歳"), ending.summary));
    it("ジョウネツが増えている", () => assert(ending.passion > 0, `passion=${ending.passion}`));
  });

  await page.click('[data-action="finish-life-digest"]');
  await new Promise(r => setTimeout(r, 150));
  const record = await page.evaluate(() => ({
    active: document.querySelector(".screen.active")?.id,
    title: [...document.querySelectorAll("#record-achievements li")].map((li) => li.textContent).join(" "),
    memories: document.getElementById("record-memories")?.textContent,
  }));
  describe("SPEC-059 §6.3 きろく保存", () => {
    it("screen-record に戻る", () => assertEq(record.active, "screen-record"));
    it("称号 title_life_album が記録される", () => assert(record.title.includes("title_life_album"), record.title));
    it("人生ダイジェストの思い出が記録に残る", () => assert(record.memories.includes("歳："), record.memories));
  });

  describe("PAGEERR なし", () => {
    it("人生ダイジェスト中にエラー 0 件", () => assertEq(errs.length, 0, errs.join("\n")));
  });

  await browser.close();
})();
