/**
 * カネとジカンとジョウネツと - プロトタイプ
 *
 * 仕様駆動開発ルール：docs/DEVELOPMENT_RULES.md
 * 全仕様索引：docs/specs/SPEC-INDEX.md
 *
 * 画面構成（docs/screen-design.md）：
 *   S1 起床  →  S2 遊びを選ぶ  →  S3 遊びの描写(結果統合)  →  [S4 イベント]
 *                                        ↓
 *                                    余剰時間>0 → S2 へ戻る
 *                                    余剰時間=0 → S5 就寝
 *                                    ↓
 *                                  翌日 S1 起床
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
 * @spec docs/specs/SPEC-001-life-stage.md
 * 初期プレイヤー状態。
 */
const DEFAULT_PLAYER = {
  age: 5,
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
 * 遊びの実行可否を判定する。満たされない条件を reasons に並べて返す。
 */
function isPlayAvailable(play) {
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
      renderChooseScreen();
      showScreen("screen-choose");
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
