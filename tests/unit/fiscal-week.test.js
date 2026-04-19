/**
 * @spec SPEC-001 §5.7 / SPEC-025 §7.1.4 日付・Fiscal Year / Fiscal Week
 *
 * Day 1 = 2026-04-01（水）を基点に、月曜起点の週で fiscal week 番号を算出する。
 * 第 1 週は 4/1（水）から始まる短縮週（4/1-4/5 = 5 日）。
 */
const { describe, it, assertEq } = require("../lib/assert.js");

function fakeDateForDay(day) {
  const base = Date.UTC(2026, 3, 1);
  return new Date(base + (day - 1) * 24 * 60 * 60 * 1000);
}
const WEEK_JP = ["日", "月", "火", "水", "木", "金", "土"];

function formatFullDate(day) {
  const d = fakeDateForDay(day);
  return `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月${d.getUTCDate()}日（${WEEK_JP[d.getUTCDay()]}）`;
}

function fiscalWeekInfo(day) {
  const d = fakeDateForDay(day);
  const yearStart = (d.getUTCMonth() < 3)
    ? new Date(Date.UTC(d.getUTCFullYear() - 1, 3, 1))
    : new Date(Date.UTC(d.getUTCFullYear(), 3, 1));
  const ysDow = yearStart.getUTCDay();
  const toMon = (ysDow === 0) ? 6 : (ysDow - 1);
  const firstWeekMon = new Date(yearStart.getTime() - toMon * 24 * 60 * 60 * 1000);
  const dDow = d.getUTCDay();
  const toMonToday = (dDow === 0) ? 6 : (dDow - 1);
  const thisMon = new Date(d.getTime() - toMonToday * 24 * 60 * 60 * 1000);
  const weekNumber = Math.round((thisMon.getTime() - firstWeekMon.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;
  const rangeStart = (weekNumber === 1) ? yearStart : thisMon;
  const rangeEnd = new Date(thisMon.getTime() + 6 * 24 * 60 * 60 * 1000);
  const mm = (dt) => `${dt.getUTCMonth() + 1}/${dt.getUTCDate()}`;
  return { weekNumber, rangeLabel: `${mm(rangeStart)}-${mm(rangeEnd)}` };
}

function daysUntilWeekend(day) {
  const dow = fakeDateForDay(day).getUTCDay();
  if (dow === 0) return 7;
  return 7 - dow;
}

describe("SPEC-001 §5.7 formatFullDate", () => {
  it("Day 1 = 2026-04-01（水）", () => assertEq(formatFullDate(1),  "2026年4月1日（水）"));
  it("Day 5 = 2026-04-05（日）", () => assertEq(formatFullDate(5),  "2026年4月5日（日）"));
  it("Day 6 = 2026-04-06（月）", () => assertEq(formatFullDate(6),  "2026年4月6日（月）"));
  it("Day 12 = 2026-04-12（日）", () => assertEq(formatFullDate(12), "2026年4月12日（日）"));
  it("Day 30 = 2026-04-30（木）", () => assertEq(formatFullDate(30), "2026年4月30日（木）"));
});

describe("SPEC-001 §5.7 fiscalWeekInfo", () => {
  it("Day 1 は 1週 (4/1-4/5)", () => {
    const fw = fiscalWeekInfo(1);
    assertEq(fw.weekNumber, 1);
    assertEq(fw.rangeLabel, "4/1-4/5");
  });
  it("Day 5 も 1週 (4/1-4/5)", () => {
    const fw = fiscalWeekInfo(5);
    assertEq(fw.weekNumber, 1);
    assertEq(fw.rangeLabel, "4/1-4/5");
  });
  it("Day 6 は 2週 (4/6-4/12)", () => {
    const fw = fiscalWeekInfo(6);
    assertEq(fw.weekNumber, 2);
    assertEq(fw.rangeLabel, "4/6-4/12");
  });
  it("Day 12 も 2週 (4/6-4/12)", () => {
    const fw = fiscalWeekInfo(12);
    assertEq(fw.weekNumber, 2);
  });
  it("Day 13 は 3週", () => assertEq(fiscalWeekInfo(13).weekNumber, 3));
});

describe("SPEC-025 §7.1.4 daysUntilWeekend", () => {
  it("Day 1 (水) → 4", () => assertEq(daysUntilWeekend(1), 4));
  it("Day 5 (日) → 7（次の日曜まで）", () => assertEq(daysUntilWeekend(5), 7));
  it("Day 6 (月) → 6", () => assertEq(daysUntilWeekend(6), 6));
  it("Day 11 (土) → 1", () => assertEq(daysUntilWeekend(11), 1));
  it("Day 12 (日) → 7", () => assertEq(daysUntilWeekend(12), 7));
});
