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
const LIFE_STAGES = [
  { id: "nursery",      label: "保育園",   icon: "🏫", ageMin: 1,  ageMax: 3,   coreTime: { startHour: 9,  endHour: 16,   label: "保育園" }, implemented: true  },
  { id: "kindergarten", label: "幼稚園",   icon: "🏫", ageMin: 4,  ageMax: 6,   coreTime: { startHour: 9,  endHour: 14,   label: "幼稚園" }, implemented: false },
  { id: "elementary",   label: "小学校",   icon: "🏫", ageMin: 7,  ageMax: 12,  coreTime: { startHour: 8,  endHour: 15.5, label: "小学校" }, implemented: false },
  { id: "juniorhigh",   label: "中学校",   icon: "🎒", ageMin: 13, ageMax: 15,  coreTime: { startHour: 8,  endHour: 17,   label: "中学校" }, implemented: false },
  { id: "highschool",   label: "高校",     icon: "🎓", ageMin: 16, ageMax: 18,  coreTime: { startHour: 9,  endHour: 16,   label: "高校" },   implemented: false },
  { id: "university",   label: "大学",     icon: "🎓", ageMin: 19, ageMax: 22,  coreTime: { startHour: 9,  endHour: 18,   label: "大学" },   implemented: false, customizable: true },
  { id: "worker",       label: "社会人",   icon: "💼", ageMin: 23, ageMax: 65,  coreTime: { startHour: 9,  endHour: 18,   label: "仕事" },   implemented: false },
  { id: "retirement",   label: "老後",     icon: "🪑", ageMin: 66, ageMax: 100, coreTime: null, implemented: false },
];

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
 * 初期プレイヤー状態。
 * プロト段階では保育園コアタイム（SPEC-011）を体験させるため 2歳スタート。
 */
const DEFAULT_PLAYER = {
  age: 2,
  day: 1,
  season: "summer",
  clockHour: 6,
  clockMinute: 30,
  spareHours: 6,
  stamina: 80,
  bioRhythm: 90,
  money: 0,
  friends: 2,
  passion: 0,
  exp: { physical: 0, creative: 0, explore: 0, social: 0, competitive: 0 },
  dailyPlays: 0,
  lastPlayCategory: null,
  consecutiveCategoryCount: 0,
  unlockedPlays: [],       // @spec SPEC-010, SPEC-011 発見で解禁された遊びID
  discoveredIds: [],       // @spec SPEC-011 §5.5 重複発見の抑止
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
 * 共通HUDの描画。全画面共通。
 */
function renderHUD() {
  byId("hud-age").textContent = `${player.age}歳`;
  byId("hud-date").textContent = `${player.day}日目(${SEASON_LABEL[player.season]}) ${fmtTime(player.clockHour, player.clockMinute)}`;
  byId("hud-stamina").textContent = Math.max(0, Math.floor(player.stamina));
  byId("hud-rhythm").textContent = Math.max(0, Math.floor(player.bioRhythm));
  byId("hud-money").textContent = player.money;
  byId("hud-hours").textContent = Math.max(0, player.spareHours).toFixed(1).replace(".0", "");
  byId("hud-friends").textContent = player.friends;
  byId("hud-passion").textContent = player.passion;

  const stage = resolveLifeStage(player.age);
  const stageEl = byId("hud-stage");
  if (stage) stageEl.textContent = `${stage.icon} ${stage.label}`;
  else stageEl.textContent = "";
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
 * 前日の状態と生活リズムに基づいて、起床画面のメッセージとコンディションを表示する。
 */
function renderWakeup() {
  byId("wakeup-subtitle").textContent =
    `あなたは ${player.age}歳 / ${SEASON_LABEL[player.season]}の朝 ${fmtTime(player.clockHour, player.clockMinute)}`;
  byId("wu-stamina").textContent = `${Math.floor(player.stamina)} / 100`;
  byId("wu-rhythm").textContent = `${Math.floor(player.bioRhythm)} / 100`;
  byId("wu-friends").textContent = `${player.friends} 人`;
  byId("wu-hours").textContent = `${player.spareHours} h`;

  let msg = "よく眠れた。今日も元気だ！";
  if (player.bioRhythm < 40) msg = "寝坊した…体が重い。生活リズムが乱れているようだ。";
  else if (player.bioRhythm >= 80) msg = "生活リズムが整っている。頭も体もスッキリだ！";
  if (player.stamina < 30) msg = "体がだるい。体調不良かもしれない。";
  byId("wakeup-msg").textContent = msg;
  byId("wakeup-art").textContent = player.bioRhythm >= 60 ? "🌅" : "😵‍💫";

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

/**
 * @screen S2 遊びを選ぶ
 * @spec docs/specs/SPEC-002-play-selection.md §5.2
 * 実行可能な遊びを上に、ロック中を下に表示する。
 */
function renderChooseScreen() {
  byId("choose-hours").textContent = player.spareHours.toFixed(1).replace(".0", "");
  const list = byId("play-list");
  list.innerHTML = "";

  const sorted = PLAYS
    .map((p) => ({ play: p, avail: isPlayAvailable(p) }))
    .filter(({ avail }) => !avail.isHidden)
    .sort((a, b) => (b.avail.ok ? 1 : 0) - (a.avail.ok ? 1 : 0));

  sorted.forEach(({ play, avail }) => {
    const card = document.createElement("div");
    card.className = "play-card" + (avail.ok ? "" : " locked");

    const head = document.createElement("div");
    head.className = "play-card-head";
    head.innerHTML = `
      <div class="play-icon">${play.icon}</div>
      <div class="play-name">${play.name}</div>
    `;

    const meta = document.createElement("div");
    meta.className = "play-meta";
    meta.innerHTML = `
      <span>⏳ ${play.timeCost}h</span>
      <span>💰 ¥${play.moneyCost}</span>
      <span>❤️ -${play.staminaCost || 0}</span>
    `;

    const gain = document.createElement("div");
    gain.className = "play-gain";
    gain.textContent = Object.entries(play.gain)
      .map(([k, v]) => `${LABELS[k]} +${v}`)
      .join(" / ");

    card.appendChild(head);
    card.appendChild(meta);
    card.appendChild(gain);

    if (play.minFriends) {
      const req = document.createElement("div");
      req.className = "play-meta";
      req.textContent = `👥 要友人 ${play.minFriends}人以上${
        play.friendBonusPerPerson ? `（1人ごと経験値+${play.friendBonusPerPerson}）` : ""
      }`;
      card.appendChild(req);
    }

    if (!avail.ok) {
      const reason = document.createElement("div");
      reason.className = "play-requirement";
      reason.textContent = `⚠ ${avail.reasons.join(" / ")}`;
      card.appendChild(reason);
    }

    const actions = document.createElement("div");
    actions.className = "play-actions";
    const btn = document.createElement("button");
    btn.className = avail.ok ? "btn btn-primary btn-sm" : "btn btn-ghost btn-sm";
    btn.textContent = avail.ok ? "遊ぶ" : "ロック";
    btn.disabled = !avail.ok;
    btn.addEventListener("click", () => { if (avail.ok) startPlay(play); });
    actions.appendChild(btn);
    card.appendChild(actions);

    list.appendChild(card);
  });

  renderHUD();
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

  byId("btn-skip-play").hidden = false;
  byId("btn-next-play").hidden = true;
  byId("btn-go-sleep-from-play").hidden = true;

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
    if (e.stamina) player.stamina = Math.max(0, Math.min(100, player.stamina + e.stamina));
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

  // ---- ⑨ アクションボタンの切替 ----
  byId("btn-skip-play").hidden = true;
  byId("btn-next-play").hidden = false;
  byId("btn-go-sleep-from-play").hidden = false;

  // 余剰時間がないなら次は就寝のみ
  if (player.spareHours <= 0) {
    byId("btn-next-play").disabled = true;
    toast("余剰時間がなくなった。夜になる…");
  } else {
    byId("btn-next-play").disabled = false;
  }

  // S4から戻ってきた場合は、S3画面を再表示
  showScreen("screen-playing");
}

/**
 * @screen S3 結果フェーズ
 * @spec docs/specs/SPEC-003-play-execution.md §5
 * @spec docs/specs/SPEC-005-parameter.md §5.3
 * スナップショットと現在値を比較して、差分だけを見やすく描画する。
 */
function renderResultPanel(before) {
  byId("result-panel").hidden = false;

  // 原体験（Lv表記付き）
  const gainEl = byId("result-gain");
  const rows = Object.keys(LABELS).map((k) => {
    const b = before.exp[k] || 0;
    const a = player.exp[k] || 0;
    if (a === b) return "";
    const bLv = levelFromExp(b);
    const aLv = levelFromExp(a);
    const lvUp = aLv > bLv ? " <span style='color:var(--good)'>⬆ Lv UP</span>" : "";
    return `<li><span>${LABELS[k]}</span><b class="up">Lv${bLv}→Lv${aLv} (+${a - b}exp)${lvUp}</b></li>`;
  }).filter(Boolean).join("");
  gainEl.innerHTML = rows || `<li><span>（変化なし）</span><b>-</b></li>`;

  // ステータス差分
  const statusRows = [];
  if (before.stamina !== player.stamina) {
    statusRows.push(`<li><span>体力</span><b class="${player.stamina >= before.stamina ? "up" : "down"}">${Math.floor(before.stamina)} → ${Math.floor(player.stamina)}</b></li>`);
  }
  if (before.money !== player.money) {
    statusRows.push(`<li><span>所持金</span><b class="${player.money >= before.money ? "up" : "down"}">¥${before.money} → ¥${player.money}</b></li>`);
  }
  if (before.friends !== player.friends) {
    statusRows.push(`<li><span>友人数</span><b class="${player.friends >= before.friends ? "up" : "down"}">${before.friends} → ${player.friends}</b></li>`);
  }
  if (before.passion !== player.passion) {
    statusRows.push(`<li><span>🔥 ジョウネツ</span><b class="up">${before.passion} → ${player.passion}</b></li>`);
  }
  byId("result-status").innerHTML = statusRows.length
    ? statusRows.join("")
    : `<li><span>（差分なし）</span><b>-</b></li>`;

  // 時間経過
  byId("result-clock").textContent = `${before.clock} → ${fmtTime(player.clockHour, player.clockMinute)}`;
  byId("result-spare").textContent = `${before.spareHours}h → ${player.spareHours}h`;

  // 没頭ボーナスの表示
  const passionMsg = pendingGain && pendingGain.passion
    ? `🔥 ジョウネツ +${pendingGain.passion}${player.consecutiveCategoryCount > 0 ? `（同カテゴリ ${player.consecutiveCategoryCount + 1}連続の没頭ボーナス）` : ""}`
    : "";
  byId("result-passion").textContent = passionMsg;

  // 描写フェーズの UI を縮小（プログレスは残す）
  byId("playing-progress-wrap").hidden = true;
}

// =========================================================================
// S6. コアタイム（学びごと・仕事）
// =========================================================================

/**
 * @screen S1 → S6 or S2 への分岐
 * @spec docs/specs/SPEC-010-core-time.md §5.2
 * 起床後「今日を始める」を押したときに呼ばれる。
 * 現在のライフステージにコアタイムがあり、かつ実装済みならコアタイム画面を挿入する。
 * 未実装の場合はコアタイムを擬似消化（時刻を endHour まで進めるだけ）して S2 へ。
 * コアタイムが無い（老後）場合はそのまま S2 へ。
 */
function beginDay() {
  const stage = resolveLifeStage(player.age);
  const coreTime = stage ? stage.coreTime : null;

  if (!coreTime) {
    goChooseFromToday();
    return;
  }

  if (stage.implemented) {
    renderCoreTime(stage);
    showScreen("screen-coretime");
    return;
  }

  // 実装されていないライフステージは時計だけ進めて S2 へ
  // (SPEC-012〜SPEC-018 実装時に専用の renderCoreTime に差し替える)
  player.clockHour = Math.max(player.clockHour, coreTime.endHour);
  player.clockMinute = Math.round((coreTime.endHour % 1) * 60);
  recomputeSpareHoursAfterCoreTime(coreTime);
  toast(`${stage.label} の時間を過ごした（未実装）`);
  goChooseFromToday();
}

/**
 * @spec docs/specs/SPEC-010-core-time.md §5.3
 * コアタイム消化後の余剰時間を再計算する。
 * プロト段階では「就寝時刻21:00 − 現在時刻 − 食事2h」の単純モデル。
 */
function recomputeSpareHoursAfterCoreTime(coreTime) {
  const sleepTargetHour = 21;
  const mealReserveHours = 2;
  const now = player.clockHour + player.clockMinute / 60;
  const remain = Math.max(0, sleepTargetHour - now - mealReserveHours);
  player.spareHours = +remain.toFixed(1);
}

/**
 * @screen S6 コアタイム画面 → S2
 * @spec docs/specs/SPEC-010-core-time.md §5.2
 */
function goChooseFromToday() {
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
  player.stamina = Math.max(0, player.stamina - 15);
  player.passion += 1;
  for (const [k, v] of Object.entries(gain)) {
    player.exp[k] = (player.exp[k] || 0) + v;
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
    if (eff.stamina)  player.stamina = Math.max(0, Math.min(100, player.stamina + eff.stamina));
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
  player.stamina = Math.min(100, player.stamina + 5);
  player.clockHour += 1;
  toast("1時間休んだ（体力 +5）");
  renderChooseScreen();
}

// =========================================================================
// S5. 就寝
// =========================================================================

/**
 * @screen S5 就寝
 * @spec docs/specs/SPEC-008-sleep.md §5.1
 * 1日の成果を表示し、就寝モード選択を促す。
 */
function goSleep() {
  byId("sleep-summary").innerHTML = `
    <li><span>遊んだ回数</span><b>${player.dailyPlays} 回</b></li>
    <li><span>現在のジョウネツ</span><b>${player.passion}</b></li>
    <li><span>体力</span><b>${Math.floor(player.stamina)} / 100</b></li>
    <li><span>生活リズム</span><b>${Math.floor(player.bioRhythm)} / 100</b></li>
    <li><span>友人数</span><b>${player.friends} 人</b></li>
  `;
  showScreen("screen-sleep");
}

/**
 * @screen S5 就寝 → S1 起床
 * @spec docs/specs/SPEC-006-bio-rhythm.md §5.1
 * @spec docs/specs/SPEC-008-sleep.md §5.2
 * 就寝モードに応じて生活リズムと体力を変化させ、翌日に進む。
 */
function sleep(mode) {
  if (mode === "early") {
    player.bioRhythm = Math.min(100, player.bioRhythm + 10);
    player.stamina = Math.min(100, player.stamina + 25);
  } else if (mode === "normal") {
    player.stamina = Math.min(100, player.stamina + 15);
  } else if (mode === "latenight") {
    player.bioRhythm = Math.max(0, player.bioRhythm - 15);
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
  if (player.day % 120 === 0) player.age += 1;

  // 起床時刻（SPEC-006 §5.2）
  let wakeH = 6, wakeM = 30;
  if (player.bioRhythm < 40) { wakeH = 9; wakeM = 0; }
  else if (player.bioRhythm < 70) { wakeH = 7; wakeM = 30; }

  // 体調不良（SPEC-006 §5.4）
  let sickness = false;
  if (sleepMode === "latenight" && player.bioRhythm < 60 && Math.random() < 0.3) {
    sickness = true;
    player.stamina = Math.max(0, player.stamina - 15);
  }

  // 余剰時間（SPEC-006 §5.3）
  let base = 6;
  if (sleepMode === "latenight") base += 1;
  if (wakeH >= 9) base -= 2;
  if (sickness) base -= 2;
  if (player.stamina < 30) base -= 1;
  player.spareHours = Math.max(0, base);

  player.clockHour = wakeH;
  player.clockMinute = wakeM;
  player.dailyPlays = 0;

  if (sickness) toast("朝から体調がすぐれない…（余剰時間 -2h）", 2400);
  else if (sleepMode === "latenight") toast("夜更かしで生活リズムが乱れた…");
  else if (sleepMode === "early") toast("早寝でリズム回復！");

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
      if (player.spareHours <= 0) { toast("もう遊ぶ時間がない…"); return; }
      renderChooseScreen();
      showScreen("screen-choose");
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
renderWakeup();
renderHUD();
