/**
 * カネとジカンとジョウネツと - プロトタイプ
 *
 * 仕様駆動開発ルール：docs/DEVELOPMENT_RULES.md
 * 全仕様索引：docs/specs/SPEC-INDEX.md
 *
 * 画面構成（docs/screen-design.md）：
 *   S1 起床
 *     ↓ 今日を始める
 *   [コアタイム判定 SPEC-010]
 *     ├─ ある（1-3歳=保育園 等） → S6 コアタイム画面 → S2
 *     └─ ない（老後）             → S2
 *   S2 遊びを選ぶ → S3 遊びの描写(結果統合) → [S4 イベント]
 *     ↓ 余剰時間残り 0 / 今日おわる
 *   S5 就寝 → 翌日 S1 起床
 *
 * 各関数の頭にある @spec コメントは、コードが読めない人でも挙動を仕様書から把握できるようにするためのルール。
 */

// =========================================================================
// マスタデータ
// =========================================================================

/**
 * @spec docs/specs/SPEC-002-play-selection.md
 * @spec docs/specs/SPEC-007-friends.md
 * 遊びマスタ。プロト段階では未就学児〜小学生向けを中心に収録。
 */
const PLAYS = [
  {
    id: "sandbox",
    name: "砂場遊び",
    icon: "🏖",
    timeCost: 1,
    moneyCost: 0,
    staminaCost: 10,
    seasons: ["spring", "summer", "autumn"],
    ageMin: 1,
    ageMax: 10,
    gain: { physical: 10, creative: 5 },
    descriptions: [
      "砂で大きな山を作り始めた…",
      "トンネルを通す挑戦。崩れた！もう一度！",
      "友だちが来て、一緒にお城を築いた。",
    ],
  },
  {
    id: "tag",
    name: "鬼ごっこ",
    icon: "🤼",
    timeCost: 2,
    moneyCost: 0,
    staminaCost: 20,
    ageMin: 3,
    minFriends: 1,
    friendBonusPerPerson: 3,
    gain: { physical: 15, social: 10 },
    descriptions: [
      "「もういいかい？」全力ダッシュ！",
      "追いかけっこ。息が上がってきた。",
      "鬼に捕まった！次は自分の番だ。",
    ],
  },
  {
    id: "pool",
    name: "プール",
    icon: "🏊",
    timeCost: 3,
    moneyCost: 300,
    staminaCost: 25,
    seasons: ["summer"],
    ageMin: 2,
    gain: { physical: 25, social: 5 },
    descriptions: [
      "水しぶきを上げてジャンプ！",
      "水中で目を開けて見るのが楽しい。",
      "浮き輪でぷかぷか浮いてみる。",
    ],
  },
  {
    id: "clay",
    name: "粘土遊び",
    icon: "🧱",
    timeCost: 2,
    moneyCost: 0,
    staminaCost: 5,
    ageMin: 1,
    ageMax: 12,
    gain: { creative: 15 },
    descriptions: [
      "粘土をこねて、恐竜を作ってみた。",
      "色を混ぜたら新しい色ができた！",
      "お母さんに見せると「上手ね」と言われた。",
    ],
  },
  {
    id: "trampoline",
    name: "トランポリン",
    icon: "🤸",
    timeCost: 1,
    moneyCost: 0,
    staminaCost: 15,
    ageMin: 3,
    gain: { physical: 12 },
    descriptions: [
      "ぴょんぴょん飛び跳ねる。空が近い！",
      "回転に挑戦。少しだけ怖い。",
      "息が切れるまで飛んだ。",
    ],
  },
  {
    id: "snow",
    name: "雪遊び",
    icon: "☃️",
    timeCost: 2,
    moneyCost: 0,
    staminaCost: 20,
    seasons: ["winter"],
    ageMin: 2,
    gain: { physical: 15, creative: 8 },
    descriptions: [
      "雪だるまを作り始めた。大きいぞ！",
      "雪合戦。顔に雪が命中した。",
      "雪の上にごろんと寝転ぶ。",
    ],
  },
  {
    id: "picturebook",
    name: "絵本を読む",
    icon: "📖",
    timeCost: 1,
    moneyCost: 0,
    staminaCost: 2,
    ageMin: 1,
    gain: { explore: 10, creative: 3 },
    descriptions: [
      "大好きな絵本。何回読んでも面白い。",
      "新しい言葉を覚えた。",
      "絵の細部に気づいて嬉しくなった。",
    ],
  },
  {
    id: "slide",
    name: "滑り台",
    icon: "🛝",
    timeCost: 1,
    moneyCost: 0,
    staminaCost: 8,
    ageMin: 2,
    ageMax: 10,
    gain: { physical: 8, social: 3 },
    descriptions: [
      "何度も滑る。階段を登るのがちょっと大変。",
      "逆走に挑戦！…でも怒られた。",
      "友だちと競争した。",
    ],
  },
  {
    // @spec docs/specs/SPEC-011-nursery.md §5.6
    // 保育園の Discovery `learn_slide` を発見したときに player.unlockedPlays に追加される。
    // 初期状態ではプレイ候補に出ない（unlockRequired: true）。
    id: "big_slide",
    name: "大きな滑り台",
    icon: "🎢",
    timeCost: 1,
    moneyCost: 0,
    staminaCost: 12,
    ageMin: 2,
    ageMax: 12,
    gain: { physical: 15, social: 4 },
    unlockRequired: true,
    descriptions: [
      "公園の大きな滑り台。先生が教えてくれた順番を守って滑る。",
      "スピードが出て風が気持ちいい！",
      "一人で最後まで滑り切れた。",
    ],
  },
  {
    id: "bughunt",
    name: "虫取り",
    icon: "🦗",
    timeCost: 2,
    moneyCost: 0,
    staminaCost: 10,
    seasons: ["summer", "autumn"],
    ageMin: 4,
    gain: { explore: 12, physical: 5 },
    descriptions: [
      "草むらにいるバッタを追いかけた。",
      "セミの抜け殻を見つけた。",
      "カブトムシの捕まえ方を覚えた。",
    ],
  },
  {
    id: "playhouse",
    name: "ごっこ遊び",
    icon: "🏠",
    timeCost: 2,
    moneyCost: 0,
    staminaCost: 3,
    ageMin: 2,
    ageMax: 10,
    minFriends: 1,
    friendBonusPerPerson: 2,
    gain: { creative: 10, social: 12 },
    descriptions: [
      "今日はパン屋さんごっこ。",
      "プリンセスと勇者の物語が始まる。",
      "役を交代して、また別の物語。",
    ],
  },
];

/**
 * @spec docs/specs/SPEC-004-random-event.md
 * ランダムイベントマスタ。weight付きで抽選される。
 */
const EVENTS = [
  { id: "new_friend", text: "近所の子に話しかけられて、仲良くなった！", icon: "🤝", effect: { friends: 1, social: 5 }, weight: 10 },
  { id: "coins",      text: "地面で100円玉を拾った！",              icon: "🪙", effect: { money: 100 },                 weight: 6 },
  { id: "praised",    text: "先生に上手だと褒められた。自信がついた！", icon: "🌟", effect: { passion: 5, creative: 5 },    weight: 8 },
  { id: "tripped",    text: "派手に転んだ。ちょっとケガ…",           icon: "🩹", effect: { stamina: -10 },                weight: 6 },
  { id: "weather",    text: "急に天気が崩れてきた。",                icon: "🌧",  effect: { stamina: -5 },                 weight: 5 },
  { id: "flow",       text: "気がつけば夢中になっていた。これが「没頭」か…", icon: "🔥", effect: { passion: 10 },         weight: 7 },
];

/**
 * @spec docs/specs/SPEC-010-core-time.md §3 ライフステージとコアタイムのマトリクス
 * @spec docs/specs/SPEC-011-nursery.md 保育園の詳細挙動
 *
 * 各ライフステージは年齢範囲とコアタイム枠を持つ。
 * プロト段階では保育園（1-3歳）のみ実装されており、他は枠のみ定義。
 * 詳細は SPEC-012〜SPEC-018 を参照。
 */
// @spec docs/specs/SPEC-019-stamina-cap.md §5.1 年齢4歳は保育園扱い（体力上限50）
const LIFE_STAGES = [
  { id: "nursery",      label: "保育園",   icon: "🏫", ageMin: 1,  ageMax: 4,   coreTime: { startHour: 9,  endHour: 16,   label: "保育園" }, implemented: true  },
  { id: "kindergarten", label: "幼稚園",   icon: "🏫", ageMin: 5,  ageMax: 6,   coreTime: { startHour: 9,  endHour: 14,   label: "幼稚園" }, implemented: false },
  { id: "elementary",   label: "小学校",   icon: "🏫", ageMin: 7,  ageMax: 12,  coreTime: { startHour: 8,  endHour: 15.5, label: "小学校" }, implemented: false },
  { id: "juniorhigh",   label: "中学校",   icon: "🎒", ageMin: 13, ageMax: 15,  coreTime: { startHour: 8,  endHour: 17,   label: "中学校" }, implemented: false },
  { id: "highschool",   label: "高校",     icon: "🎓", ageMin: 16, ageMax: 18,  coreTime: { startHour: 9,  endHour: 16,   label: "高校" },   implemented: false },
  { id: "university",   label: "大学",     icon: "🎓", ageMin: 19, ageMax: 22,  coreTime: { startHour: 9,  endHour: 18,   label: "大学" },   implemented: false, customizable: true },
  { id: "worker",       label: "社会人",   icon: "💼", ageMin: 23, ageMax: 65,  coreTime: { startHour: 9,  endHour: 18,   label: "仕事" },   implemented: false },
  { id: "retirement",   label: "老後",     icon: "🪑", ageMin: 66, ageMax: 100, coreTime: null, implemented: false },
];

/**
 * @spec docs/specs/SPEC-019-stamina-cap.md §5.1
 * 年齢別の体力ベース上限テーブル。51歳以上は計算式で求める（§5.1.1）。
 */
const STAMINA_BASE_CAP_TABLE = {
  1: 10,  2: 15,  3: 30,  4: 50,
  5: 55,  6: 60,
  7: 75,  8: 80,  9: 85, 10: 90, 11: 95, 12: 100,
  13: 200, 14: 250, 15: 300,
  16: 300, 17: 300, 18: 300,
  19: 280, 20: 280, 21: 280, 22: 260,
};
/**
 * @spec docs/specs/SPEC-019-stamina-cap.md §5.1
 * 年齢から体力ベース上限を返す。テーブルに無い年齢は範囲ごとに計算。
 */
function staminaBaseCapForAge(age) {
  if (age <= 22) return STAMINA_BASE_CAP_TABLE[age] || 10;
  if (age <= 25) return 240;
  if (age <= 30) return 230;
  if (age <= 35) return 220;
  if (age <= 40) return 200;
  if (age <= 45) return 180;
  if (age <= 50) return 160;
  // 51歳以降は1歳ごとに -2
  return Math.max(10, 160 - (age - 50) * 2);
}

/**
 * @spec docs/specs/SPEC-020-fixed-sleep-cycle.md §5.1
 * 年齢別の固定スケジュール。1〜9歳は control:false（プレイヤー側で就寝モード選択不可）。
 * 10歳以降は control:true で SPEC-006 / SPEC-008 の生活リズム式に従う。
 */
const FIXED_SCHEDULE_TABLE = [
  { ageMin: 1,  ageMax: 4,   wakeHour: 7,   sleepHour: 19, control: false },
  { ageMin: 5,  ageMax: 6,   wakeHour: 7,   sleepHour: 20, control: false },
  { ageMin: 7,  ageMax: 9,   wakeHour: 6.5, sleepHour: 21, control: false },
  { ageMin: 10, ageMax: 12,  wakeHour: 6.5, sleepHour: 22, control: false }, // Draft: 一部可
];
/**
 * @spec docs/specs/SPEC-020-fixed-sleep-cycle.md §5.1
 * 固定スケジュールを返す（10歳以上は null）。
 */
function getFixedSchedule(age) {
  return FIXED_SCHEDULE_TABLE.find((r) => age >= r.ageMin && age <= r.ageMax) || null;
}

/**
 * @spec docs/specs/SPEC-011-nursery.md §5.5 発見プール
 * 保育園コアタイムで抽選される「発見」の候補。
 * `unlockPlayId` があるものは、その遊びを player.unlockedPlays に追加する。
 */
const NURSERY_DISCOVERIES = [
  { id: "meet_new_friend",  text: "新しいお友達と仲良くなった！",                    weight: 10, gain: { friends: 1, social: 5 } },
  { id: "learn_slide",      text: "大きな滑り台の上手な滑り方を教えてもらった！",    weight: 8,  gain: { physical: 3 }, unlockPlayId: "big_slide" },
  { id: "learn_sandcastle", text: "砂場で先生にお城の作り方を教わった！",            weight: 8,  gain: { creative: 5, physical: 3 } },
  { id: "nap_refresh",      text: "お昼寝でぐっすり眠った。夢の中で冒険した。",      weight: 6,  gain: { stamina: 10, explore: 3 } },
  { id: "song_time",        text: "「はらぺこあおむし」の歌を覚えた！",              weight: 6,  gain: { explore: 3, creative: 3 } },
  { id: "cry_then_smile",   text: "友達とおもちゃを取り合って泣いた…最後は仲直り。", weight: 4,  gain: { social: 4, passion: 2 } },
  { id: "park_adventure",   text: "公園で小さな虫を見つけて観察した！",              weight: 5,  gain: { explore: 4, physical: 2 } },
];

/**
 * @spec docs/specs/SPEC-001-life-stage.md
 * @spec docs/specs/SPEC-019-stamina-cap.md 体力上限初期値
 * @spec docs/specs/SPEC-020-fixed-sleep-cycle.md 起床07:00、余剰時間 4h
 *
 * 初期プレイヤー状態。
 * プロト段階では保育園コアタイム（SPEC-011）を体験させるため 2歳スタート。
 * 2歳の体力上限 = 15（SPEC-019）、起床=07:00（SPEC-020）、朝の余剰=2h。
 */
const DEFAULT_PLAYER = {
  age: 2,
  day: 1,
  season: "summer",
  clockHour: 7,
  clockMinute: 0,
  spareHours: 2,       // 朝の遊び時間 07:00-09:00（SPEC-020 §5.2）
  spareHoursMax: 4,    // 1日の余剰時間ベース（朝2h + 夜2h）SPEC-021 分母用
  stamina: 15,
  staminaCap: 15,
  staminaBaseCap: 15,
  staminaBonusCap: 0,
  bioRhythm: 90,
  money: 0,
  friends: 2,
  passion: 0,
  exp: { physical: 0, creative: 0, explore: 0, social: 0, competitive: 0 },
  dailyPlays: 0,
  lastPlayCategory: null,
  consecutiveCategoryCount: 0,
  unlockedPlays: [],
  discoveredIds: [],
  depletedDays: [],
  depletedDaysThisYear: 0,
  retirementDecayLocked: false,
  forceSleepNextZeroSpare: false,   // @spec SPEC-019 §5.4.2 強制終了後の翌朝フラグ
  /** コアタイムをまだ今日未消化か（起床直後 true、消化後 false）*/
  coreTimeDoneToday: false,
};

const LABELS = {
  physical: "身体系",
  creative: "創作系",
  explore: "探求系",
  social: "交流系",
  competitive: "競技系",
};

const SEASON_LABEL = { spring: "春", summer: "夏", autumn: "秋", winter: "冬" };

// =========================================================================
// 状態
// =========================================================================
let player = structuredClone(DEFAULT_PLAYER);
let pendingPlay = null;     // 進行中の遊び
let pendingGain = null;     // 予定している獲得値
let pendingEvent = null;    // 発火したイベント
let playRAF = null;         // requestAnimationFrame id

// =========================================================================
// ユーティリティ
// =========================================================================
const byId = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

function showScreen(id) {
  $$(".screen").forEach((el) => el.classList.remove("active"));
  byId(id).classList.add("active");
}

function toast(msg, ms = 1800) {
  const t = byId("toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.hidden = true; }, ms);
}

/**
 * @spec docs/specs/SPEC-005-parameter.md §5.1
 * exp から Lv を算出する: Lv = floor(sqrt(exp / 10))
 */
function levelFromExp(exp) {
  return Math.floor(Math.sqrt(Math.max(0, exp) / 10));
}

function fmtTime(h, m = 0) {
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

function pickWeighted(list) {
  const total = list.reduce((s, e) => s + (e.weight || 1), 0);
  let r = Math.random() * total;
  for (const e of list) {
    r -= e.weight || 1;
    if (r <= 0) return e;
  }
  return list[list.length - 1];
}

/**
 * @spec docs/specs/SPEC-007-friends.md §5.2
 * 遊びの主カテゴリ（gain の最大値を持つカテゴリ）を返す。
 */
function majorGainCategory(gain) {
  let best = null;
  let bestVal = 0;
  for (const k of Object.keys(gain)) {
    if (gain[k] > bestVal) { best = k; bestVal = gain[k]; }
  }
  return best;
}

// =========================================================================
// HUD
// =========================================================================

/**
 * @spec docs/specs/SPEC-001-life-stage.md §6
 * @spec docs/specs/SPEC-010-core-time.md §6
 * @spec docs/specs/SPEC-021-parameter-gauge-ui.md §5.7 HUDミニゲージ
 * 共通HUDの描画。全画面共通。
 */
function renderHUD() {
  byId("hud-age").textContent = `${player.age}歳`;
  byId("hud-date").textContent = `${player.day}日目(${SEASON_LABEL[player.season]}) ${fmtTime(player.clockHour, player.clockMinute)}`;
  byId("hud-stamina").textContent = Math.max(0, Math.floor(player.stamina));
  byId("hud-stamina-cap").textContent = Math.floor(player.staminaCap || 0);
  byId("hud-money").textContent = player.money;
  byId("hud-hours").textContent = Math.max(0, player.spareHours).toFixed(1).replace(".0", "");
  byId("hud-friends").textContent = player.friends;
  byId("hud-passion").textContent = player.passion;

  // HUDミニゲージ
  applyGaugePercent(byId("hud-stamina-bar"), player.stamina, player.staminaCap);
  applyGaugePercent(byId("hud-hours-bar"),   player.spareHours, player.spareHoursMax || 1);

  const stage = resolveLifeStage(player.age);
  const stageEl = byId("hud-stage");
  if (stage) stageEl.textContent = `${stage.icon} ${stage.label}`;
  else stageEl.textContent = "";
}

/**
 * @spec docs/specs/SPEC-021-parameter-gauge-ui.md §5.3
 * ゲージ要素に width を %で反映し、閾値に応じて色を切り替える。
 */
function applyGaugePercent(el, current, max) {
  if (!el) return;
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  el.style.width = pct + "%";
  el.classList.remove("warn", "bad");
  if (pct < 30)      el.classList.add("bad");
  else if (pct < 60) el.classList.add("warn");
}

/**
 * @spec docs/specs/SPEC-021-parameter-gauge-ui.md §5.1 §5.6
 * フルサイズゲージを container に1本描画する。
 * kind: "stamina" | "time" | "exp" でクラス切替と色の閾値が変わる。
 */
function renderGauge(container, { current, max, label, kind, delta }) {
  if (!container) return;
  const pct = max > 0 ? Math.max(0, Math.min(100, (current / max) * 100)) : 0;
  const barClass =
    kind === "exp" ? "exp" :
    pct < 30 ? "bad" :
    pct < 60 ? "warn" : "";
  const deltaHtml = (delta !== undefined && delta !== 0)
    ? `<span class="delta ${delta > 0 ? "" : "down"}">${delta > 0 ? "+" : ""}${delta}</span>`
    : "";
  const displayValue = kind === "time"
    ? `${Number(current).toFixed(1).replace(".0", "")}h / ${Number(max).toFixed(1).replace(".0", "")}h`
    : `${Math.floor(current)} / ${Math.floor(max)}`;
  container.innerHTML = `
    <div class="gauge-track"><div class="gauge-bar ${barClass}" style="width:${pct}%"></div></div>
    <div class="gauge-label"><span>${label}</span><b>${displayValue}${deltaHtml}</b></div>
  `;
}

/**
 * @spec docs/specs/SPEC-021-parameter-gauge-ui.md §5.2 起床画面のゲージ
 */
function renderWakeupGauges() {
  const root = byId("wu-gauges");
  if (!root) return;
  root.innerHTML = `
    <div class="gauge" id="wu-g-stamina"></div>
    <div class="gauge" id="wu-g-time"></div>
    <div class="gauge" id="wu-g-rhythm"></div>
  `;
  renderGauge(byId("wu-g-stamina"), { current: player.stamina, max: player.staminaCap, label: "❤️ 体力", kind: "stamina" });
  renderGauge(byId("wu-g-time"),    { current: player.spareHours, max: player.spareHoursMax, label: "⏳ 余剰時間", kind: "time" });
  renderGauge(byId("wu-g-rhythm"),  { current: player.bioRhythm, max: 100, label: "🌙 生活リズム", kind: "stamina" });
}

/**
 * @spec docs/specs/SPEC-010-core-time.md §5.1
 * 年齢から現在のライフステージを返す。該当しない場合は null。
 */
function resolveLifeStage(age) {
  return LIFE_STAGES.find((s) => age >= s.ageMin && age <= s.ageMax) || null;
}

/**
 * @spec docs/specs/SPEC-010-core-time.md §5.1
 * 現在のライフステージの coreTime を返す（null の場合はコアタイム無し）。
 */
function resolveCoreTime(age) {
  const stage = resolveLifeStage(age);
  return stage ? stage.coreTime : null;
}

// =========================================================================
// S1. 起床
// =========================================================================

/**
 * @screen S1 起床
 * @spec docs/specs/SPEC-001-life-stage.md
 * @spec docs/specs/SPEC-006-bio-rhythm.md
 * @spec docs/specs/SPEC-020-fixed-sleep-cycle.md 低年齢の起床時刻表示
 * @spec docs/specs/SPEC-021-parameter-gauge-ui.md ゲージ表示
 * 前日の状態と生活リズムに基づいて、起床画面のメッセージとコンディションを表示する。
 */
function renderWakeup() {
  byId("wakeup-subtitle").textContent =
    `あなたは ${player.age}歳 / ${SEASON_LABEL[player.season]}の朝 ${fmtTime(player.clockHour, player.clockMinute)}`;

  const sched = getFixedSchedule(player.age);
  let msg = "よく眠れた。今日も元気だ！";
  if (sched) {
    msg = `今日は ${fmtTime(sched.wakeHour)} 起床〜${fmtTime(sched.sleepHour)} 就寝の1日。`;
  } else if (player.bioRhythm < 40) {
    msg = "寝坊した…体が重い。生活リズムが乱れているようだ。";
  } else if (player.bioRhythm >= 80) {
    msg = "生活リズムが整っている。頭も体もスッキリだ！";
  }
  if (player.stamina < player.staminaCap * 0.3) {
    msg += "\n体がだるい。体調不良かもしれない。";
  }
  byId("wakeup-msg").textContent = msg;
  byId("wakeup-art").textContent = player.bioRhythm >= 60 ? "🌅" : "😵‍💫";

  renderWakeupGauges();
  renderHUD();
}

// =========================================================================
// S2. 遊びを選ぶ
// =========================================================================

/**
 * @screen S2 遊びを選ぶ
 * @spec docs/specs/SPEC-002-play-selection.md §5.1
 * @spec docs/specs/SPEC-007-friends.md §5.1
 * @spec docs/specs/SPEC-010-core-time.md §5.5 解禁遊びの扱い
 * 遊びの実行可否を判定する。満たされない条件を reasons に並べて返す。
 * `unlockRequired` が true の遊びは、player.unlockedPlays に含まれるときだけ候補に出す
 *  （候補外なので reasons でなく isHidden を立てる）。
 */
function isPlayAvailable(play) {
  if (play.unlockRequired && !(player.unlockedPlays || []).includes(play.id)) {
    return { ok: false, reasons: ["まだ知らない遊び"], isHidden: true };
  }
  const reasons = [];
  if (play.seasons && !play.seasons.includes(player.season)) {
    reasons.push(`${SEASON_LABEL[player.season]}は季節外`);
  }
  if (play.ageMin && player.age < play.ageMin) reasons.push(`${play.ageMin}歳以上が必要`);
  if (play.ageMax && player.age > play.ageMax) reasons.push(`${play.ageMax}歳まで`);
  if (play.moneyCost > player.money) reasons.push(`所持金不足 (¥${play.moneyCost}必要)`);
  if (play.timeCost > player.spareHours) reasons.push(`時間不足`);
  if ((play.staminaCost || 0) > player.stamina) reasons.push(`体力不足`);
  if (play.minFriends && player.friends < play.minFriends) {
    reasons.push(`友人${play.minFriends}人以上必要`);
  }
  return { ok: reasons.length === 0, reasons };
}

// @spec SPEC-002 §5.3 インタラクションフロー
let selectedPlayId = null;

/**
 * @screen S2 遊びを選ぶ（ドック型アイコンUI）
 * @spec docs/specs/SPEC-002-play-selection.md §5.2, §5.4, §5.5
 * ドックにアイコンを並べ、選択中の遊びをプレビューに表示する。
 * 実行可能な遊びを左、ロック中を右に配置。`unlockRequired` で未解禁は非表示。
 */
function renderChooseScreen() {
  byId("choose-hours").textContent = player.spareHours.toFixed(1).replace(".0", "");
  selectedPlayId = null;

  const dock = byId("play-dock");
  dock.innerHTML = "";

  // SPEC-002 §5.5 並び順：実行可 → ロック中。隠し（unlockRequired未解禁）は除外。
  const candidates = PLAYS
    .map((p) => ({ play: p, avail: isPlayAvailable(p) }))
    .filter(({ avail }) => !avail.isHidden)
    .sort((a, b) => (b.avail.ok ? 1 : 0) - (a.avail.ok ? 1 : 0));

  if (candidates.length === 0) {
    dock.innerHTML = `<p style="color:var(--muted);padding:14px;">今できる遊びがありません</p>`;
  }

  candidates.forEach(({ play, avail }) => {
    const btn = document.createElement("button");
    btn.className = "dock-icon" + (avail.ok ? "" : " locked");
    btn.textContent = play.icon;
    btn.setAttribute("aria-label", `${play.name}, ${play.timeCost}時間, ${
      Object.entries(play.gain).map(([k, v]) => `${LABELS[k]}+${v}`).join(", ")
    }`);
    btn.dataset.playId = play.id;
    btn.addEventListener("click", () => selectPlay(play.id));
    dock.appendChild(btn);
  });

  // プレビューは初期はプレースホルダー
  byId("preview").hidden = true;
  byId("preview-placeholder").hidden = false;
  byId("btn-confirm-play").disabled = true;
  byId("btn-confirm-play").textContent = "遊ぶ";

  renderHUD();
}

/**
 * @screen S2
 * @spec docs/specs/SPEC-002-play-selection.md §5.3 インタラクションフロー
 * アイコンタップ時の挙動：
 *  - 未選択 or 別の遊びを選択中 → プレビュー更新
 *  - 既に同じ遊びを選択中（selectedPlayId === id）→ 確定し startPlay
 */
function selectPlay(id) {
  const play = PLAYS.find((p) => p.id === id);
  if (!play) return;
  const avail = isPlayAvailable(play);

  if (selectedPlayId === id) {
    if (avail.ok) { confirmPlay(); }
    else { toast("この遊びは今できない"); }
    return;
  }
  selectedPlayId = id;

  // ドックの選択状態更新
  for (const el of document.querySelectorAll(".dock-icon")) {
    el.classList.toggle("selected", el.dataset.playId === id);
  }

  // プレビュー差し替え
  byId("preview-placeholder").hidden = true;
  byId("preview").hidden = false;
  byId("preview-icon").textContent = play.icon;
  byId("preview-name").textContent = play.name;
  byId("preview-desc").textContent = play.descriptions[0];
  byId("preview-time").textContent = `${play.timeCost}h`;
  byId("preview-money").textContent = `¥${play.moneyCost}`;
  byId("preview-stamina").textContent = `-${play.staminaCost || 0}`;

  byId("preview-gain").innerHTML = Object.entries(play.gain)
    .map(([k, v]) => `<li><span>${LABELS[k]}</span><b class="up">+${v}</b></li>`)
    .join("");

  if (play.minFriends) {
    byId("preview-friend-card").hidden = false;
    byId("preview-friend").textContent = `要友人 ${play.minFriends}人以上${
      play.friendBonusPerPerson ? `（1人ごと経験値+${play.friendBonusPerPerson}）` : ""
    }`;
  } else {
    byId("preview-friend-card").hidden = true;
  }

  // ロック理由表示と「遊ぶ」ボタンの enable/disable
  const confirmBtn = byId("btn-confirm-play");
  if (avail.ok) {
    byId("preview-lock").hidden = true;
    confirmBtn.disabled = false;
    confirmBtn.textContent = `🎮 遊ぶ（-${play.timeCost}h）`;
  } else {
    byId("preview-lock").hidden = false;
    byId("preview-lock-text").textContent = `⚠ ${avail.reasons.join(" / ")}`;
    confirmBtn.disabled = true;
    confirmBtn.textContent = "ロック中";
  }
}

/**
 * @spec docs/specs/SPEC-002-play-selection.md §5.3 「遊ぶ」確定
 */
function confirmPlay() {
  if (!selectedPlayId) return;
  const play = PLAYS.find((p) => p.id === selectedPlayId);
  if (!play) return;
  const avail = isPlayAvailable(play);
  if (!avail.ok) { toast("この遊びは今できない"); return; }
  startPlay(play);
}

// =========================================================================
// S3. 遊びの描写（結果統合版）
// =========================================================================

/**
 * @screen S3 遊びの描写（結果統合）
 * @spec docs/specs/SPEC-003-play-execution.md §5.1
 * 遊びを開始する：描写フェーズ（プログレスバー）を開始し、終了後に finalizePlay へ。
 */
function startPlay(play) {
  pendingPlay = play;
  pendingGain = null;
  pendingEvent = null;

  byId("playing-icon").textContent = play.icon;
  byId("playing-name").textContent = play.name;
  byId("playing-desc").textContent =
    play.descriptions[Math.floor(Math.random() * play.descriptions.length)];

  byId("playing-bar").style.width = "0%";
  byId("playing-timer").textContent = "遊び進行中… 0%";
  byId("playing-progress-wrap").hidden = false;
  byId("result-panel").hidden = true;

  byId("actions-skip").hidden = false;
  byId("actions-result").hidden = true;

  showScreen("screen-playing");

  const duration = 2200;
  const start = performance.now();
  const tick = (t) => {
    const pct = Math.min(100, Math.round(((t - start) / duration) * 100));
    byId("playing-bar").style.width = pct + "%";
    byId("playing-timer").textContent = `遊び進行中… ${pct}%`;
    if (pct < 100) {
      playRAF = requestAnimationFrame(tick);
    } else {
      finishDescription();
    }
  };
  playRAF = requestAnimationFrame(tick);
}

/**
 * @screen S3 遊びの描写
 * @spec docs/specs/SPEC-003-play-execution.md §5.1
 * スキップボタン：描写演出をカットして結果へ進む。
 */
function skipDescription() {
  if (playRAF) cancelAnimationFrame(playRAF);
  byId("playing-bar").style.width = "100%";
  finishDescription();
}

/**
 * @screen S3 → S4 分岐
 * @spec docs/specs/SPEC-003-play-execution.md §5.1
 * @spec docs/specs/SPEC-004-random-event.md §5.1
 * 描写フェーズ終了後、35%で S4 ランダムイベントへ。
 * それ以外は直接、結果統合表示へ。
 */
function finishDescription() {
  if (Math.random() < 0.35) {
    pendingEvent = pickWeighted(EVENTS);
    renderEvent();
    showScreen("screen-event");
  } else {
    pendingEvent = null;
    finalizePlay();
  }
}

/**
 * @screen S4 ランダムイベント
 * @spec docs/specs/SPEC-004-random-event.md §5.3
 * イベントの効果表示（実反映は finalizePlay 内で行う）。
 */
function renderEvent() {
  byId("event-icon").textContent = pendingEvent.icon;
  byId("event-desc").textContent = pendingEvent.text;
  const rows = Object.entries(pendingEvent.effect)
    .map(([k, v]) => `<li><span>${effectLabel(k)}</span><b class="${v > 0 ? "up" : "down"}">${v > 0 ? "+" : ""}${v}</b></li>`)
    .join("");
  byId("event-effects").innerHTML = `<div class="card-title">変化</div><ul class="kv-list">${rows}</ul>`;
}

function effectLabel(key) {
  if (LABELS[key]) return LABELS[key];
  const map = { friends: "友人数", money: "所持金", stamina: "体力", passion: "ジョウネツ", bioRhythm: "生活リズム" };
  return map[key] || key;
}

/**
 * @screen S3 結果フェーズ（旧 S5 遊び終了 + S6 反映 + S7 時間経過 を統合）
 * @spec docs/specs/SPEC-003-play-execution.md §5.2-5.4
 * @spec docs/specs/SPEC-005-parameter.md §5.2
 * @spec docs/specs/SPEC-007-friends.md §5.2
 *
 * 1画面の下部に結果をフェードインで表示する。
 * ① 獲得原体験の計算（基本gain + 友人数ボーナス）
 * ② イベント効果の合算
 * ③ プレイヤー状態へ反映（exp, stamina, money, passion, friends, spareHours, clock）
 * ④ UIに差分として表示
 * ⑤ アクションボタンを「次の遊び」「今日おわる」に切替
 */
function finalizePlay() {
  const play = pendingPlay;

  // ---- ① 獲得経験値の計算 ----
  const gain = { ...play.gain };
  // @spec SPEC-007 §5.2 友人数ボーナス
  if (play.friendBonusPerPerson) {
    const mainKey = majorGainCategory(play.gain) || "social";
    gain[mainKey] = (gain[mainKey] || 0) + play.friendBonusPerPerson * player.friends;
  }

  // @spec SPEC-003 §5.2 没頭ボーナス
  const mainCat = majorGainCategory(play.gain);
  let passionGain = 3;
  if (mainCat && player.lastPlayCategory === mainCat) {
    passionGain += 2 + player.consecutiveCategoryCount;
  }

  // ---- ② 反映前スナップショット ----
  const before = {
    exp: { ...player.exp },
    stamina: player.stamina,
    money: player.money,
    friends: player.friends,
    bioRhythm: player.bioRhythm,
    passion: player.passion,
    clock: fmtTime(player.clockHour, player.clockMinute),
    spareHours: player.spareHours,
  };

  // ---- ③ 経験値加算 ----
  for (const [k, v] of Object.entries(gain)) {
    player.exp[k] = (player.exp[k] || 0) + v;
  }

  // ---- ④ 基本ステータス反映 ----
  // @spec SPEC-019 上限は staminaCap、体力は 0 でクランプ。
  player.stamina = Math.max(0, player.stamina - (play.staminaCost || 0));
  player.money = Math.max(0, player.money - (play.moneyCost || 0));
  player.passion += passionGain;

  // ---- ⑤ 時間経過 ----
  const h = Math.floor(play.timeCost);
  const m = Math.round((play.timeCost - h) * 60);
  player.clockHour += h;
  player.clockMinute += m;
  if (player.clockMinute >= 60) { player.clockHour += 1; player.clockMinute -= 60; }
  player.spareHours = Math.max(0, +(player.spareHours - play.timeCost).toFixed(1));
  player.dailyPlays += 1;

  // ---- ⑥ イベント効果の反映 ----
  if (pendingEvent) {
    const e = pendingEvent.effect;
    if (e.friends) player.friends = Math.max(0, player.friends + e.friends);
    if (e.money)   player.money   = Math.max(0, player.money + e.money);
    if (e.stamina) player.stamina = Math.max(0, Math.min(player.staminaCap, player.stamina + e.stamina));
    if (e.passion) player.passion = Math.max(0, player.passion + e.passion);
    if (e.bioRhythm) player.bioRhythm = Math.max(0, Math.min(100, player.bioRhythm + e.bioRhythm));
    for (const cat of Object.keys(LABELS)) {
      if (e[cat]) player.exp[cat] = (player.exp[cat] || 0) + e[cat];
    }
  }

  // ---- ⑦ 没頭カウント更新 ----
  if (mainCat === player.lastPlayCategory) {
    player.consecutiveCategoryCount += 1;
  } else {
    player.consecutiveCategoryCount = 0;
    player.lastPlayCategory = mainCat;
  }

  pendingGain = { gain, passion: passionGain };

  // ---- ⑧ UIへ結果を描画 ----
  renderResultPanel(before);
  renderHUD();

  // ---- ⑨ 体力ゼロ判定（SPEC-019 §5.4）----
  if (player.stamina <= 0) {
    handleStaminaDepleted();
    // handleStaminaDepleted 内で画面遷移・ボタン制御が行われるため、以降の処理は行わない
    return;
  }

  // ---- ⑩ アクションボタンの切替（結果フェーズのフッター構成 SPEC-003 §5.8）----
  showResultActions();

  // S4から戻ってきた場合は、S3画面を再表示
  showScreen("screen-playing");
}

/**
 * @screen S3 結果フェーズのフッター切替
 * @spec docs/specs/SPEC-003-play-execution.md §5.7 §5.8
 * 「もう一度遊ぶ」「次の遊びを選ぶ or コアタイム or 就寝」「今日おわる」の状態を更新する。
 * 「次の遊びを選ぶ」ボタンは文脈で変化：
 *   - 余剰あり & 朝の遊び中（コアタイム前）→ "次の遊びを選ぶ"
 *   - 余剰0 & 朝の遊び中 → "保育園へ行く"（S6へ）
 *   - 余剰0 & 保育園済み → "おやすみ"（S5へ）
 */
function showResultActions() {
  byId("actions-skip").hidden = true;
  byId("actions-result").hidden = false;

  // 「もう一度遊ぶ」の有効判定（SPEC-003 §5.7）
  const replayBtn = byId("btn-replay-play");
  if (pendingPlay) {
    const avail = isPlayAvailable(pendingPlay);
    replayBtn.textContent = `🔁 もう一度遊ぶ（-${pendingPlay.timeCost}h）`;
    replayBtn.disabled = !avail.ok;
  }

  // 「次の遊び」ボタンは常に有効、ラベルを文脈に応じて変える（goChooseFromToday が判定）
  const nextBtn = byId("btn-next-play");
  const stage = resolveLifeStage(player.age);
  const coreTime = stage ? stage.coreTime : null;
  nextBtn.disabled = false;
  if (player.spareHours <= 0 && coreTime && stage.implemented && !player.coreTimeDoneToday) {
    nextBtn.textContent = `🏫 ${coreTime.label}へ`;
    toast(`朝の遊び時間おわり。${coreTime.label}に行こう`);
  } else if (player.spareHours <= 0) {
    nextBtn.textContent = "🌙 おやすみ";
    toast("余剰時間がなくなった。夜になる…");
  } else if (coreTime && stage.implemented && !player.coreTimeDoneToday) {
    nextBtn.textContent = "次の遊びを選ぶ";
  } else {
    nextBtn.textContent = "次の遊びを選ぶ";
  }
}

/**
 * @screen S3 結果フェーズ → リプレイ
 * @spec docs/specs/SPEC-003-play-execution.md §5.7
 * S2 を経由せず、同じ遊びをもう一度実行する。没頭ボーナスの連続数は維持。
 */
function replayPlay() {
  if (!pendingPlay) return;
  const avail = isPlayAvailable(pendingPlay);
  if (!avail.ok) { toast("もう一度遊ぶ条件を満たしていません"); return; }
  // consecutiveCategoryCount / lastPlayCategory は startPlay 内でリセットされないので維持。
  startPlay(pendingPlay);
}

/**
 * @spec docs/specs/SPEC-019-stamina-cap.md §5.4
 * 体力ゼロ時のライフステージ別挙動：
 *  - 1〜12歳：強制睡眠 2h（体力 staminaCap × 0.30 回復）
 *  - 13〜65歳：強制終了（即就寝＋翌朝余剰0）
 *  - 66歳以上：強制終了＋体力ゼロ記録
 */
function handleStaminaDepleted() {
  const age = player.age;

  // 体力ゼロ記録日を残す
  if (!player.depletedDays.includes(player.day)) {
    player.depletedDays.push(player.day);
    player.depletedDaysThisYear += 1;
  }

  if (age <= 12) {
    // 強制睡眠 2h
    const recover = Math.floor(player.staminaCap * 0.30);
    player.stamina = recover;
    player.clockHour += 2;
    if (player.clockHour >= 24) player.clockHour = 23;
    player.spareHours = Math.max(0, +(player.spareHours - 2).toFixed(1));
    toast(`体力ゼロ…2時間お昼寝した（体力+${recover}）`, 2400);
    renderHUD();

    // 結果フェーズの表示更新（時刻と体力の再描画）
    byId("result-clock").textContent = `${byId("result-clock").textContent.split("→")[0]}→ ${fmtTime(player.clockHour, player.clockMinute)} (+仮眠2h)`;
    byId("result-spare").textContent = `余剰時間 ${player.spareHours}h`;

    // 余剰時間 0 なら自動就寝
    if (player.spareHours <= 0) {
      setTimeout(() => goSleep(), 1000);
    } else {
      showResultActions();
      showScreen("screen-playing");
    }
    return;
  }

  // 13-65歳 強制終了 or 66歳以上 強制終了
  if (age >= 13 && age <= 65) {
    player.forceSleepNextZeroSpare = true; // 翌朝余剰0
    toast("倒れるように眠りに落ちた…", 2400);
  } else if (age >= 66) {
    toast("疲れ果てて眠りに落ちた…", 2400);
  }
  setTimeout(() => goSleep(), 900);
}

/**
 * @screen S3 結果フェーズ
 * @spec docs/specs/SPEC-003-play-execution.md §5
 * @spec docs/specs/SPEC-005-parameter.md §5.3
 * スナップショットと現在値を比較して、差分だけを見やすく描画する。
 */
function renderResultPanel(before) {
  byId("result-panel").hidden = false;

  // ---- 原体験（Lvゲージ SPEC-021）----
  const expRoot = byId("result-exp-gauges");
  const expHtml = [];
  Object.keys(LABELS).forEach((k) => {
    const b = before.exp[k] || 0;
    const a = player.exp[k] || 0;
    if (a === b) return;
    const bLv = levelFromExp(b);
    const aLv = levelFromExp(a);
    const nextLvNeeded = (aLv + 1) * (aLv + 1) * 10;
    const curLvBase = aLv * aLv * 10;
    const progressCurrent = a - curLvBase;
    const progressMax = nextLvNeeded - curLvBase;
    const lvUp = aLv > bLv;
    expHtml.push(`<div class="gauge" data-exp="${k}" id="result-exp-${k}"></div>`);
    // あとから renderGauge で埋める
    setTimeout(() => {
      renderGauge(byId(`result-exp-${k}`), {
        current: progressCurrent,
        max: progressMax,
        label: `${LABELS[k]} Lv${aLv}${lvUp ? " ⬆ Lv UP!" : ""}`,
        kind: "exp",
        delta: a - b,
      });
    }, 0);
  });
  expRoot.innerHTML = expHtml.join("") || `<p style="color:var(--muted);font-size:13px;">（経験値の変化なし）</p>`;

  // ---- ステータスゲージ（体力）----
  const statusGaugeRoot = byId("result-status-gauges");
  statusGaugeRoot.innerHTML = `<div class="gauge" id="result-stamina-g"></div>`;
  renderGauge(byId("result-stamina-g"), {
    current: player.stamina,
    max: player.staminaCap,
    label: "❤️ 体力",
    kind: "stamina",
    delta: Math.floor(player.stamina) - Math.floor(before.stamina),
  });

  // ---- ステータス差分（数値表示）----
  const statusRows = [];
  if (before.money !== player.money) {
    statusRows.push(`<li><span>所持金</span><b class="${player.money >= before.money ? "up" : "down"}">¥${before.money} → ¥${player.money}</b></li>`);
  }
  if (before.friends !== player.friends) {
    statusRows.push(`<li><span>友人数</span><b class="${player.friends >= before.friends ? "up" : "down"}">${before.friends} → ${player.friends}</b></li>`);
  }
  if (before.passion !== player.passion) {
    statusRows.push(`<li><span>🔥 ジョウネツ</span><b class="up">${before.passion} → ${player.passion}</b></li>`);
  }
  byId("result-status").innerHTML = statusRows.join("");

  // ---- 時間経過 ----
  byId("result-clock").textContent = `${before.clock} → ${fmtTime(player.clockHour, player.clockMinute)}`;
  byId("result-spare").textContent = `${before.spareHours}h → ${player.spareHours}h`;

  // ---- 没頭ボーナス表示 ----
  const passionMsg = pendingGain && pendingGain.passion
    ? `🔥 ジョウネツ +${pendingGain.passion}${player.consecutiveCategoryCount > 0 ? `（同カテゴリ ${player.consecutiveCategoryCount + 1}連続の没頭ボーナス）` : ""}`
    : "";
  byId("result-passion").textContent = passionMsg;

  // 描写フェーズの UI を縮小
  byId("playing-progress-wrap").hidden = true;
}

// =========================================================================
// S6. コアタイム（学びごと・仕事）
// =========================================================================

/**
 * @screen S1 → S2（朝の遊び） or S6 コアタイム への分岐
 * @spec docs/specs/SPEC-010-core-time.md §5.2
 * @spec docs/specs/SPEC-020-fixed-sleep-cycle.md §5.2 朝の遊び時間
 *
 * 起床後「今日を始める」を押したときに呼ばれる。
 *  1. コアタイム未実装のステージは beginDayUnimpl() で擬似消化
 *  2. 実装済みステージ（保育園）：
 *     - まだコアタイム未消化 & 現在時刻がコアタイム開始前 → S2 朝の遊び
 *       余剰時間を「コアタイム開始 − 現在時刻」でセット
 *     - それ以外 → S6 コアタイム画面へ直行
 */
function beginDay() {
  const stage = resolveLifeStage(player.age);
  const coreTime = stage ? stage.coreTime : null;

  if (!coreTime) {
    // 老後：コアタイム無し。全時間を自由に使える。
    player.spareHoursMax = 14;
    player.spareHours = 14;
    goChooseFromToday();
    return;
  }

  if (!stage.implemented) {
    beginDayUnimpl(stage, coreTime);
    return;
  }

  // 実装済み（保育園）
  const now = player.clockHour + player.clockMinute / 60;
  if (!player.coreTimeDoneToday && now < coreTime.startHour) {
    // 朝の遊び時間へ
    const morningHours = +(coreTime.startHour - now).toFixed(1);
    player.spareHours = morningHours;
    goChooseFromToday();
    return;
  }

  // 既に朝の遊び終了、またはコアタイム時間到来 → コアタイム画面
  renderCoreTime(stage);
  showScreen("screen-coretime");
}

/**
 * @spec docs/specs/SPEC-010-core-time.md §5.4
 * 未実装ステージは時計だけ進めて S2 へ。将来 SPEC-012〜SPEC-018 実装時に個別 renderer へ分岐。
 */
function beginDayUnimpl(stage, coreTime) {
  player.clockHour = Math.max(player.clockHour, coreTime.endHour);
  player.clockMinute = Math.round((coreTime.endHour % 1) * 60);
  recomputeSpareHoursAfterCoreTime(coreTime);
  toast(`${stage.label} の時間を過ごした（未実装）`);
  goChooseFromToday();
}

/**
 * @spec docs/specs/SPEC-010-core-time.md §5.3
 * @spec docs/specs/SPEC-020-fixed-sleep-cycle.md §5.4
 * コアタイム消化後の夜の余剰時間を再計算する。
 * 1〜9歳は SPEC-020 の固定就寝時刻を使用、その他は 22:00 を仮の就寝時刻とする。
 * 食事・入浴バッファ 1h を差し引く。
 */
function recomputeSpareHoursAfterCoreTime(coreTime) {
  const sched = getFixedSchedule(player.age);
  const sleepTargetHour = sched ? sched.sleepHour : 22;
  const mealBufferHours = 1;
  const now = player.clockHour + player.clockMinute / 60;
  const remain = Math.max(0, sleepTargetHour - now - mealBufferHours);
  player.spareHours = +remain.toFixed(1);
}

/**
 * @screen 次の遊び画面への遷移
 * @spec docs/specs/SPEC-010-core-time.md §5.2
 * @spec docs/specs/SPEC-020-fixed-sleep-cycle.md §5.2 朝の遊び → コアタイム遷移
 *
 * 次に遊び画面を出すべきか、コアタイム画面に進むべきかを判定する。
 * 朝の遊び時間が終わり、かつ現在時刻がコアタイム開始時刻に到達していたら S6 へ。
 * 余剰時間が 0 なら S5 就寝へ。
 */
function goChooseFromToday() {
  const stage = resolveLifeStage(player.age);
  const coreTime = stage ? stage.coreTime : null;
  const now = player.clockHour + player.clockMinute / 60;

  // 実装済みコアタイム：まだ今日未消化 & 時刻が開始に達したか 朝の余剰 0 に達したら S6
  if (coreTime && stage.implemented && !player.coreTimeDoneToday) {
    if (now >= coreTime.startHour || player.spareHours <= 0) {
      // 時刻を開始時刻まで早送り（朝の遊びが早く終わった場合）
      if (now < coreTime.startHour) {
        player.clockHour = coreTime.startHour;
        player.clockMinute = 0;
      }
      renderCoreTime(stage);
      showScreen("screen-coretime");
      return;
    }
  }

  if (player.spareHours <= 0) {
    goSleep();
    return;
  }

  renderChooseScreen();
  showScreen("screen-choose");
}

/**
 * @screen S6 コアタイム
 * @spec docs/specs/SPEC-011-nursery.md
 * 保育園の1日を描画し、獲得値・発見を確定させる。
 * 他のライフステージは将来ここを分岐ポイントにする予定。
 */
function renderCoreTime(stage) {
  if (stage.id !== "nursery") {
    // プロト段階では保育園しか実装していないので、他ステージは beginDay() 側で擬似消化される。
    // ここに来るのはバグ。
    console.warn("renderCoreTime: unimplemented stage", stage.id);
    return;
  }
  renderNurseryCoreTime(stage);
}

/**
 * @screen S6 コアタイム（保育園版）
 * @spec docs/specs/SPEC-011-nursery.md §5
 *
 * 保育園コアタイムの処理：
 * 1. 09:00 に時刻を揃える（起床が早い場合）
 * 2. タイムラインを画面に描画（§5.2）
 * 3. 生活活動時間の内容を日替わりで決定（§5.4）
 * 4. 発見を 70% で抽選（§5.5）
 * 5. 獲得値を確定（§5.3）＋ 発見の効果 ＋ 新しい遊び解禁（§5.6）
 * 6. 時刻を 16:00 に進め、余剰時間を再計算
 */
function renderNurseryCoreTime(stage) {
  const ct = stage.coreTime;

  // 1) 時刻を 09:00 に揃える（ただし既に遅刻している場合はそのまま）
  if (player.clockHour < ct.startHour) {
    player.clockHour = ct.startHour;
    player.clockMinute = 0;
  }

  // 2) HUDと画面の基本情報
  byId("ct-icon").textContent = stage.icon;
  byId("ct-title").textContent = "保育園に行ってきた";
  byId("ct-subtitle").textContent = `${fmtTime(ct.startHour)} 〜 ${fmtTime(ct.endHour)}`;

  // 3) 生活活動時間の日替わり決定（SPEC-011 §5.4）
  const isPark = player.day % 2 === 1; // 奇数日=公園 / 偶数日=室内
  const activityLabel = isPark ? "🌳 公園遊び（滑り台・砂場）" : "🏠 室内遊び（粘土・工作）";

  // タイムライン描画
  byId("ct-timeline").innerHTML = [
    ["09:00", "🎒 登園、先生と挨拶"],
    ["10:00", "📖 朝の会、絵本を読む"],
    ["11:00", "🎵 クラス活動（うた、てあそび）"],
    ["12:00", "🍱 給食、昼食休憩"],
    ["13:00", activityLabel],
    ["15:00", "🍪 おやつ、自由遊び"],
    ["16:00", "👋 降園"],
  ].map(([t, txt]) => `<li><span>${t}</span><b>${txt}</b></li>`).join("");

  // 4) 発見抽選（70%、重複を除外）
  const pool = NURSERY_DISCOVERIES.filter((d) => !player.discoveredIds.includes(d.id));
  const discoveryHit = pool.length > 0 && Math.random() < 0.70;
  const discovery = discoveryHit ? pickWeighted(pool) : null;

  // 5) 獲得値の確定（§5.3 ＋ §5.4 ＋ 発見効果）
  // @spec SPEC-011 §5.3 獲得値（確定分）
  const gain = { physical: 5, social: 3 };
  if (isPark) gain.physical += 5;
  else        gain.creative = (gain.creative || 0) + 3;

  // 差分のスナップショット
  const before = {
    exp: { ...player.exp },
    stamina: player.stamina,
    friends: player.friends,
    passion: player.passion,
  };

  // 基本ステータス反映
  // @spec SPEC-011 §5.3.1 年齢別の体力消費
  const ageStaminaCost = { 1: 5, 2: 8, 3: 12, 4: 20 }[player.age] || 10;
  player.stamina = Math.max(0, player.stamina - ageStaminaCost);
  player.passion += 1;
  for (const [k, v] of Object.entries(gain)) {
    player.exp[k] = (player.exp[k] || 0) + v;
  }

  // @spec SPEC-011 §5.3.2 1〜2歳は昼寝で体力回復
  if (player.age <= 2) {
    const napRecover = Math.floor(player.staminaCap * 0.20);
    player.stamina = Math.min(player.staminaCap, player.stamina + napRecover);
  }

  // 発見効果の反映
  let unlockedPlayName = null;
  if (discovery) {
    player.discoveredIds.push(discovery.id);

    if (discovery.unlockPlayId && !player.unlockedPlays.includes(discovery.unlockPlayId)) {
      player.unlockedPlays.push(discovery.unlockPlayId);
      const def = PLAYS.find((p) => p.id === discovery.unlockPlayId);
      if (def) unlockedPlayName = `${def.icon} ${def.name}`;
    }
    const eff = discovery.gain || {};
    if (eff.friends)  player.friends = Math.max(0, player.friends + eff.friends);
    if (eff.stamina)  player.stamina = Math.max(0, Math.min(player.staminaCap, player.stamina + eff.stamina));
    if (eff.passion)  player.passion = Math.max(0, player.passion + eff.passion);
    for (const cat of Object.keys(LABELS)) {
      if (eff[cat]) player.exp[cat] = (player.exp[cat] || 0) + eff[cat];
    }
  }

  // 発見カード描画
  const dCard = byId("ct-discovery-card");
  const dText = byId("ct-discovery-text");
  const dEff  = byId("ct-discovery-effects");
  if (discovery) {
    dCard.hidden = false;
    dText.textContent = discovery.text;
    const rows = [];
    const eff = discovery.gain || {};
    for (const k of Object.keys(eff)) {
      const v = eff[k];
      rows.push(`<li><span>${effectLabel(k)}</span><b class="${v > 0 ? "up" : "down"}">${v > 0 ? "+" : ""}${v}</b></li>`);
    }
    if (unlockedPlayName) rows.push(`<li><span>🆕 新しく覚えた</span><b class="up">${unlockedPlayName}</b></li>`);
    dEff.innerHTML = rows.join("");
  } else {
    dCard.hidden = true;
  }

  // 6) 時刻を 16:00 に進める
  player.clockHour = ct.endHour;
  player.clockMinute = Math.round((ct.endHour % 1) * 60);
  player.coreTimeDoneToday = true;
  // @spec SPEC-020 §5.4 夜の遊び時間（食事バッファ 18:00-19:00 を除く 16:00-18:00）
  recomputeSpareHoursAfterCoreTime(ct);

  // 獲得カード
  const gainRows = [];
  for (const k of Object.keys(LABELS)) {
    const b = before.exp[k] || 0;
    const a = player.exp[k] || 0;
    if (a !== b) gainRows.push(`<li><span>${LABELS[k]}</span><b class="up">+${a - b}exp</b></li>`);
  }
  if (before.stamina !== player.stamina) {
    gainRows.push(`<li><span>体力</span><b class="${player.stamina >= before.stamina ? "up" : "down"}">${Math.floor(before.stamina)} → ${Math.floor(player.stamina)}</b></li>`);
  }
  if (before.friends !== player.friends) {
    gainRows.push(`<li><span>友人数</span><b class="up">${before.friends} → ${player.friends}</b></li>`);
  }
  if (before.passion !== player.passion) {
    gainRows.push(`<li><span>🔥 ジョウネツ</span><b class="up">${before.passion} → ${player.passion}</b></li>`);
  }
  gainRows.push(`<li><span>時刻</span><b>${fmtTime(ct.startHour)} → ${fmtTime(ct.endHour)}</b></li>`);
  byId("ct-gain").innerHTML = gainRows.join("");

  renderHUD();
}

/**
 * @screen S6 コアタイム → S2
 * @spec docs/specs/SPEC-011-nursery.md §5.7
 * 「家に帰る」押下で遊び選択画面に遷移する。
 */
function closeCoreTime() {
  goChooseFromToday();
}

// =========================================================================
// 「1h休む」（遊び選択画面で使う）
// =========================================================================

/**
 * @screen S2 遊びを選ぶ
 * @spec docs/specs/SPEC-002-play-selection.md §8
 * 1時間だけ休憩。余剰時間を1減らす代わりに体力+5。
 */
function doNothing() {
  if (player.spareHours < 1) { toast("休む時間もない！"); return; }
  player.spareHours = +(player.spareHours - 1).toFixed(1);
  // @spec SPEC-019 体力上限でクランプ。回復量は上限の10%
  const recover = Math.max(3, Math.floor(player.staminaCap * 0.10));
  player.stamina = Math.min(player.staminaCap, player.stamina + recover);
  player.clockHour += 1;
  toast(`1時間休んだ（体力 +${recover}）`);
  // 朝の遊び中に09:00到達したらコアタイムへ遷移させる
  goChooseFromToday();
}

// =========================================================================
// S5. 就寝
// =========================================================================

/**
 * @screen S5 就寝
 * @spec docs/specs/SPEC-008-sleep.md §5.1
 * @spec docs/specs/SPEC-020-fixed-sleep-cycle.md §5.5 年齢別のモード選択可否
 * 1日の成果を表示し、就寝モード選択を促す。1〜9歳はモード選択不可。
 */
function goSleep() {
  byId("sleep-summary").innerHTML = `
    <li><span>遊んだ回数</span><b>${player.dailyPlays} 回</b></li>
    <li><span>現在のジョウネツ</span><b>${player.passion}</b></li>
    <li><span>体力</span><b>${Math.floor(player.stamina)} / ${Math.floor(player.staminaCap)}</b></li>
    <li><span>生活リズム</span><b>${Math.floor(player.bioRhythm)} / 100</b></li>
    <li><span>友人数</span><b>${player.friends} 人</b></li>
  `;

  const sched = getFixedSchedule(player.age);
  if (sched && sched.control === false) {
    // 1〜9歳：モード選択不可
    byId("sleep-title").textContent = `${fmtTime(sched.sleepHour)} になった`;
    byId("sleep-child").hidden = false;
    byId("sleep-adult").hidden = true;
    byId("sleep-actions-child").hidden = false;
    byId("sleep-actions-adult").hidden = true;
    byId("sleep-child-text").textContent =
      `もう${fmtTime(sched.sleepHour)}。ママが布団をかけてくれた…`;
  } else {
    byId("sleep-title").textContent = "夜になった";
    byId("sleep-child").hidden = true;
    byId("sleep-adult").hidden = false;
    byId("sleep-actions-child").hidden = true;
    byId("sleep-actions-adult").hidden = false;
  }

  showScreen("screen-sleep");
}

/**
 * @screen S5 就寝 → S1 起床
 * @spec docs/specs/SPEC-006-bio-rhythm.md §5.1
 * @spec docs/specs/SPEC-008-sleep.md §5.2
 * 就寝モードに応じて生活リズムと体力を変化させ、翌日に進む。
 * staminaCap で体力をクランプ（SPEC-019）。
 */
function sleep(mode) {
  if (mode === "early") {
    player.bioRhythm = Math.min(100, player.bioRhythm + 10);
    player.stamina = Math.min(player.staminaCap, player.stamina + 25);
  } else if (mode === "normal") {
    player.stamina = Math.min(player.staminaCap, player.stamina + 15);
  } else if (mode === "latenight") {
    player.bioRhythm = Math.max(0, player.bioRhythm - 15);
  }
  // 就寝時に生活リズムを矯正（低年齢）
  const sched = getFixedSchedule(player.age);
  if (sched && sched.control === false) {
    player.bioRhythm = Math.max(player.bioRhythm, 90);
  }
  nextDay(mode);
}

/**
 * @spec docs/specs/SPEC-006-bio-rhythm.md §5.2-5.4
 * @spec docs/specs/SPEC-008-sleep.md §5.3
 * 翌日の起床時刻・余剰時間・体調不良を生活リズムと就寝モードから決定する。
 */
function nextDay(sleepMode) {
  player.day += 1;
  const seasons = ["spring", "summer", "autumn", "winter"];
  if (player.day % 30 === 0) {
    const idx = seasons.indexOf(player.season);
    player.season = seasons[(idx + 1) % 4];
  }
  // 誕生日：120日ごとに +1歳
  const hasBirthday = (player.day % 120 === 0);
  if (hasBirthday) player.age += 1;

  // @spec SPEC-019 §5.3 年齢繰り上げ時に体力上限を再計算
  player.staminaBaseCap = staminaBaseCapForAge(player.age);
  player.staminaCap = player.staminaBaseCap + (player.staminaBonusCap || 0);
  // 現在体力が新しい上限を超えたらクランプ
  player.stamina = Math.min(player.stamina, player.staminaCap);

  // 新しい1日の初期化
  player.coreTimeDoneToday = false;
  player.dailyPlays = 0;

  const sched = getFixedSchedule(player.age);
  const stage = resolveLifeStage(player.age);
  const coreTime = stage ? stage.coreTime : null;

  // ---- 起床時刻 ----
  let wakeH, wakeM = 0;
  if (sched) {
    // @spec SPEC-020 §5.3 固定起床
    const sh = sched.wakeHour;
    wakeH = Math.floor(sh);
    wakeM = Math.round((sh - wakeH) * 60);
  } else {
    // @spec SPEC-006 §5.2 生活リズムに応じた起床
    if (player.bioRhythm < 40) { wakeH = 9;  wakeM = 0; }
    else if (player.bioRhythm < 70) { wakeH = 7; wakeM = 30; }
    else { wakeH = 6; wakeM = 30; }
  }

  // ---- 体調不良（大人のみ）----
  let sickness = false;
  if (!sched && sleepMode === "latenight" && player.bioRhythm < 60 && Math.random() < 0.3) {
    sickness = true;
    player.stamina = Math.max(0, player.stamina - 15);
  }

  // ---- 朝の余剰時間 ----
  //  SPEC-020 §5.3 朝の遊び時間 = coreTime.startHour - 起床時刻
  //  SPEC-019 §5.4.2 強制終了後の翌朝は余剰 0
  let morning = 0;
  if (coreTime) {
    morning = Math.max(0, coreTime.startHour - (wakeH + wakeM / 60));
  } else {
    // 老後：1日全部が自由時間
    morning = 14;
  }
  if (player.forceSleepNextZeroSpare) {
    morning = 0;
    player.forceSleepNextZeroSpare = false;
    toast("朝の余剰時間がない…そのまま仕事（コアタイム）へ", 2400);
  }
  if (sickness) morning = Math.max(0, morning - 2);
  player.spareHours = +morning.toFixed(1);

  // 1日の余剰時間ベース（ゲージ分母 SPEC-021）
  //   朝の余剰 + 夜の余剰（コアタイム終了〜就寝−1h食事）
  const sleepHour = sched ? sched.sleepHour : 22;
  const eveningBase = coreTime ? Math.max(0, sleepHour - 1 - coreTime.endHour) : 0;
  player.spareHoursMax = +(morning + eveningBase).toFixed(1) || 1;

  player.clockHour = wakeH;
  player.clockMinute = wakeM;

  if (sickness) toast("朝から体調がすぐれない…（余剰時間 -2h）", 2400);
  else if (!sched && sleepMode === "latenight") toast("夜更かしで生活リズムが乱れた…");
  else if (!sched && sleepMode === "early") toast("早寝でリズム回復！");

  renderWakeup();
  showScreen("screen-wakeup");
}

// =========================================================================
// イベント配線
// =========================================================================

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-action]");
  if (!t || t.disabled) return;
  const a = t.dataset.action;
  switch (a) {
    case "start-day":
      beginDay();
      break;
    case "close-coretime":
      closeCoreTime();
      break;
    case "skip-playing":
      skipDescription();
      break;
    case "close-event":
      finalizePlay();
      break;
    case "choose-next":
      goChooseFromToday();
      break;
    case "replay-play":
      replayPlay();
      break;
    case "confirm-play":
      confirmPlay();
      break;
    case "child-sleep":
      // 1〜9歳：モード選択なしの就寝（SPEC-020 §5.5）
      sleep("normal");
      break;
    case "do-nothing":
      doNothing();
      break;
    case "go-sleep":
      goSleep();
      break;
  }
});

document.addEventListener("click", (e) => {
  const s = e.target.closest("[data-sleep]");
  if (!s) return;
  sleep(s.dataset.sleep);
});

// =========================================================================
// 初期描画
// =========================================================================
// @spec SPEC-019 初期時の体力上限を年齢から再計算
player.staminaBaseCap = staminaBaseCapForAge(player.age);
player.staminaCap = player.staminaBaseCap + (player.staminaBonusCap || 0);
player.stamina = Math.min(player.stamina, player.staminaCap);

renderWakeup();
renderHUD();
