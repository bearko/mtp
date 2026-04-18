/**
 * カネとジカンとジョウネツと - プロトタイプ
 * 骨子（起床→遊び→描写→イベント→終了→反映→時間経過→就寝）の最小実装
 */

// ===== 遊びマスタ（プロト用・未就学児〜小学生レベル）=====
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

// ===== ランダムイベントマスタ =====
const EVENTS = [
  {
    id: "new_friend",
    text: "近所の子に話しかけられて、仲良くなった！",
    icon: "🤝",
    effect: { friends: 1, social: 5 },
    weight: 10,
  },
  {
    id: "coins",
    text: "地面で100円玉を拾った！",
    icon: "🪙",
    effect: { money: 100 },
    weight: 6,
  },
  {
    id: "praised",
    text: "先生に上手だと褒められた。自信がついた！",
    icon: "🌟",
    effect: { passion: 5, creative: 5 },
    weight: 8,
  },
  {
    id: "tripped",
    text: "派手に転んだ。ちょっとケガ…",
    icon: "🩹",
    effect: { stamina: -10 },
    weight: 6,
  },
  {
    id: "weather",
    text: "急に天気が崩れてきた。",
    icon: "🌧",
    effect: { stamina: -5 },
    weight: 5,
  },
  {
    id: "flow",
    text: "気がつけば夢中になっていた。これが「没頭」か…",
    icon: "🔥",
    effect: { passion: 10 },
    weight: 7,
  },
];

// ===== 初期プレイヤー状態 =====
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
  exp: {
    physical: 0,
    creative: 0,
    explore: 0,
    social: 0,
    competitive: 0,
  },
  dailyPlays: 0,
  dailyGainTotal: 0,
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

// ===== 状態 =====
let player = structuredClone(DEFAULT_PLAYER);
let pendingPlay = null;
let pendingGain = null;
let pendingEvent = null;

// ===== ユーティリティ =====
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);
const byId = (id) => document.getElementById(id);

function showScreen(id) {
  $$(".screen").forEach((el) => el.classList.remove("active"));
  byId(id).classList.add("active");
  window.scrollTo({ top: 0 });
}

function toast(msg, ms = 1600) {
  const t = byId("toast");
  t.textContent = msg;
  t.hidden = false;
  clearTimeout(t._timer);
  t._timer = setTimeout(() => { t.hidden = true; }, ms);
}

function levelFromExp(exp) {
  return Math.floor(Math.sqrt(exp / 10));
}

function expToNextLv(exp) {
  const lv = levelFromExp(exp);
  const next = (lv + 1) * (lv + 1) * 10;
  const curBase = lv * lv * 10;
  return { lv, pct: Math.floor(((exp - curBase) / (next - curBase)) * 100) };
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

function majorGainCategory(gain) {
  let best = null;
  let bestVal = 0;
  for (const k of Object.keys(gain)) {
    if (gain[k] > bestVal) { best = k; bestVal = gain[k]; }
  }
  return best;
}

// ===== HUD更新 =====
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

// ===== S1 起床 =====
function renderWakeup() {
  byId("wakeup-subtitle").textContent = `あなたは ${player.age}歳 / ${SEASON_LABEL[player.season]}の朝 ${fmtTime(player.clockHour, player.clockMinute)}`;
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

// ===== S2 遊びを選ぶ =====
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

function renderChooseScreen() {
  byId("choose-hours").textContent = player.spareHours.toFixed(1).replace(".0", "");
  const list = byId("play-list");
  list.innerHTML = "";

  const candidates = PLAYS.map((p) => ({ play: p, avail: isPlayAvailable(p) }));
  const sorted = candidates.sort((a, b) => (b.avail.ok ? 1 : 0) - (a.avail.ok ? 1 : 0));

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
      req.textContent = `👥 要友人 ${play.minFriends}人以上${play.friendBonusPerPerson ? `（1人ごと経験値+${play.friendBonusPerPerson}）` : ""}`;
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
    btn.addEventListener("click", () => {
      if (avail.ok) startPlay(play);
    });
    actions.appendChild(btn);
    card.appendChild(actions);

    list.appendChild(card);
  });

  renderHUD();
}

// ===== S3 遊びの描写 =====
function startPlay(play) {
  pendingPlay = play;
  const desc = play.descriptions[Math.floor(Math.random() * play.descriptions.length)];
  byId("playing-icon").textContent = play.icon;
  byId("playing-name").textContent = play.name;
  byId("playing-desc").textContent = desc;
  byId("playing-bar").style.width = "0%";
  byId("playing-timer").textContent = `遊び進行中… 0%`;

  showScreen("screen-playing");

  let pct = 0;
  const duration = 2400;
  const start = performance.now();
  const tick = (t) => {
    pct = Math.min(100, Math.round(((t - start) / duration) * 100));
    byId("playing-bar").style.width = pct + "%";
    byId("playing-timer").textContent = `遊び進行中… ${pct}%`;
    if (pct < 100 && pendingPlay) {
      pendingPlay._raf = requestAnimationFrame(tick);
    } else if (pct >= 100) {
      finishPlayingScreen();
    }
  };
  pendingPlay._raf = requestAnimationFrame(tick);
}

function skipPlaying() {
  if (pendingPlay && pendingPlay._raf) cancelAnimationFrame(pendingPlay._raf);
  byId("playing-bar").style.width = "100%";
  finishPlayingScreen();
}

function finishPlayingScreen() {
  // 原体験差分を先に計算
  const play = pendingPlay;
  const gainBase = { ...play.gain };

  // 友人数ボーナス
  if (play.friendBonusPerPerson) {
    const bonus = play.friendBonusPerPerson * player.friends;
    const mainKey = majorGainCategory(play.gain) || "social";
    gainBase[mainKey] = (gainBase[mainKey] || 0) + bonus;
  }

  // 没頭（連続同カテゴリ）ボーナス
  const mainCat = majorGainCategory(play.gain);
  let passionGain = 3;
  if (mainCat && player.lastPlayCategory === mainCat) {
    passionGain += 2 + player.consecutiveCategoryCount;
  }

  pendingGain = {
    play,
    gain: gainBase,
    passion: passionGain,
    mainCat,
  };

  // ランダムイベントを 35% で発火
  if (Math.random() < 0.35) {
    pendingEvent = pickWeighted(EVENTS);
    renderEvent();
    showScreen("screen-event");
  } else {
    pendingEvent = null;
    renderFinish();
    showScreen("screen-finish");
  }
}

// ===== S4 ランダムイベント =====
function renderEvent() {
  byId("event-icon").textContent = pendingEvent.icon;
  byId("event-desc").textContent = pendingEvent.text;
  const box = byId("event-effects");
  const rows = Object.entries(pendingEvent.effect)
    .map(([k, v]) => `<li><span>${effectLabel(k)}</span><b class="${v > 0 ? "up" : "down"}">${v > 0 ? "+" : ""}${v}</b></li>`)
    .join("");
  box.innerHTML = `<div class="card-title">変化</div><ul class="kv-list">${rows}</ul>`;
}

function effectLabel(key) {
  if (LABELS[key]) return LABELS[key];
  const map = {
    friends: "友人数",
    money: "所持金",
    stamina: "体力",
    passion: "ジョウネツ",
    bioRhythm: "生活リズム",
  };
  return map[key] || key;
}

// ===== S5 遊び終了 =====
function renderFinish() {
  const { play, gain, passion } = pendingGain;
  byId("finish-playname").textContent = `${play.icon} ${play.name} (${play.timeCost}h)`;
  byId("finish-passion").textContent = passion;

  const gainEl = byId("finish-gain");
  gainEl.innerHTML = Object.entries(gain)
    .map(([k, v]) => `<li><span>${LABELS[k]}</span><b class="up">+${v}</b></li>`)
    .join("");

  if (pendingEvent) {
    byId("finish-event-card").hidden = false;
    byId("finish-event").innerHTML = Object.entries(pendingEvent.effect)
      .map(([k, v]) => `<li><span>${effectLabel(k)}</span><b class="${v > 0 ? "up" : "down"}">${v > 0 ? "+" : ""}${v}</b></li>`)
      .join("");
  } else {
    byId("finish-event-card").hidden = true;
  }
}

// ===== S6 パラメーター反映 =====
function applyParams() {
  const { play, gain, passion, mainCat } = pendingGain;

  const before = {
    exp: { ...player.exp },
    stamina: player.stamina,
    money: player.money,
    passion: player.passion,
    friends: player.friends,
    bioRhythm: player.bioRhythm,
  };

  // 原体験加算
  for (const [k, v] of Object.entries(gain)) {
    player.exp[k] = (player.exp[k] || 0) + v;
  }
  // ステータス
  player.stamina = Math.max(0, player.stamina - (play.staminaCost || 0));
  player.money = Math.max(0, player.money - (play.moneyCost || 0));
  player.passion += passion;
  player.spareHours = Math.max(0, +(player.spareHours - play.timeCost).toFixed(1));
  player.dailyPlays += 1;

  // イベント反映
  if (pendingEvent) {
    const e = pendingEvent.effect;
    if (e.friends) player.friends = Math.max(0, player.friends + e.friends);
    if (e.money) player.money = Math.max(0, player.money + e.money);
    if (e.stamina) player.stamina = Math.max(0, Math.min(100, player.stamina + e.stamina));
    if (e.passion) player.passion = Math.max(0, player.passion + e.passion);
    if (e.bioRhythm) player.bioRhythm = Math.max(0, Math.min(100, player.bioRhythm + e.bioRhythm));
    for (const cat of Object.keys(LABELS)) {
      if (e[cat]) player.exp[cat] = (player.exp[cat] || 0) + e[cat];
    }
  }

  // 没頭カウント
  if (mainCat === player.lastPlayCategory) {
    player.consecutiveCategoryCount += 1;
  } else {
    player.consecutiveCategoryCount = 0;
    player.lastPlayCategory = mainCat;
  }

  renderParams(before);
  showScreen("screen-params");
}

function renderParams(before) {
  const expEl = byId("params-exp");
  expEl.innerHTML = Object.keys(LABELS).map((k) => {
    const b = before.exp[k] || 0;
    const a = player.exp[k] || 0;
    const bLv = levelFromExp(b);
    const aLv = levelFromExp(a);
    const diff = a - b;
    if (diff === 0) return "";
    const lvUp = aLv > bLv ? " <span style='color:var(--good)'>⬆ Lv UP</span>" : "";
    return `<li><span>${LABELS[k]}</span><b class="up">Lv${bLv} → Lv${aLv} (+${diff}exp)${lvUp}</b></li>`;
  }).filter(Boolean).join("");

  const statusEl = byId("params-status");
  const rows = [];
  if (before.stamina !== player.stamina) {
    rows.push(`<li><span>体力</span><b class="${player.stamina >= before.stamina ? "up" : "down"}">${Math.floor(before.stamina)} → ${Math.floor(player.stamina)}</b></li>`);
  }
  if (before.money !== player.money) {
    rows.push(`<li><span>所持金</span><b class="${player.money >= before.money ? "up" : "down"}">¥${before.money} → ¥${player.money}</b></li>`);
  }
  if (before.passion !== player.passion) {
    rows.push(`<li><span>ジョウネツ</span><b class="up">${before.passion} → ${player.passion}</b></li>`);
  }
  if (before.friends !== player.friends) {
    rows.push(`<li><span>友人数</span><b class="${player.friends >= before.friends ? "up" : "down"}">${before.friends} → ${player.friends}</b></li>`);
  }
  if (before.bioRhythm !== player.bioRhythm) {
    rows.push(`<li><span>生活リズム</span><b class="${player.bioRhythm >= before.bioRhythm ? "up" : "down"}">${Math.floor(before.bioRhythm)} → ${Math.floor(player.bioRhythm)}</b></li>`);
  }
  statusEl.innerHTML = rows.join("");
  renderHUD();
}

// ===== S7 時間経過 =====
function advanceTime() {
  const beforeClock = fmtTime(player.clockHour, player.clockMinute);
  const play = pendingPlay;
  const h = Math.floor(play.timeCost);
  const m = Math.round((play.timeCost - h) * 60);
  player.clockHour += h;
  player.clockMinute += m;
  if (player.clockMinute >= 60) {
    player.clockHour += 1;
    player.clockMinute -= 60;
  }
  byId("time-transition").textContent = `${beforeClock} → ${fmtTime(player.clockHour, player.clockMinute)}`;
  byId("time-remaining").textContent = `${player.spareHours} h`;

  const pct = Math.min(100, (player.spareHours / 8) * 100);
  byId("time-bar").style.width = pct + "%";

  // 余剰時間がなくなれば自動で就寝へ
  showScreen("screen-time");
  if (player.spareHours <= 0) {
    toast("余剰時間がなくなった。夜になる…");
    setTimeout(() => goSleep(), 900);
  }
}

function chooseNextPlay() {
  if (player.spareHours <= 0) {
    toast("もう遊ぶ時間がない…");
    return;
  }
  renderChooseScreen();
  showScreen("screen-choose");
}

// ===== 「何もしない」（1h休む）=====
function doNothing() {
  if (player.spareHours < 1) {
    toast("休む時間もない！");
    return;
  }
  player.spareHours = +(player.spareHours - 1).toFixed(1);
  player.stamina = Math.min(100, player.stamina + 5);
  player.clockHour += 1;
  toast("1時間休んだ（体力 +5）");
  renderHUD();
  renderChooseScreen();
}

// ===== S8 就寝 =====
function goSleep() {
  const ul = byId("sleep-summary");
  ul.innerHTML = `
    <li><span>遊んだ回数</span><b>${player.dailyPlays} 回</b></li>
    <li><span>現在のジョウネツ</span><b>${player.passion}</b></li>
    <li><span>体力</span><b>${Math.floor(player.stamina)} / 100</b></li>
    <li><span>生活リズム</span><b>${Math.floor(player.bioRhythm)} / 100</b></li>
    <li><span>友人数</span><b>${player.friends} 人</b></li>
  `;
  showScreen("screen-sleep");
}

function sleep(mode) {
  if (mode === "early") {
    player.bioRhythm = Math.min(100, player.bioRhythm + 10);
    player.stamina = Math.min(100, player.stamina + 25);
  } else if (mode === "normal") {
    player.stamina = Math.min(100, player.stamina + 15);
  } else if (mode === "latenight") {
    player.bioRhythm = Math.max(0, player.bioRhythm - 15);
    player.stamina = Math.max(0, player.stamina - 10 + 10);
    // 夜更かしで +1h の遊び権が翌日に（ここでは体力+10で補填という擬似処理）
  }
  // 翌日に進む
  nextDay(mode);
}

function nextDay(sleepMode) {
  player.day += 1;
  // 季節の擬似ローテ（30日で変わる）
  const seasons = ["spring", "summer", "autumn", "winter"];
  if (player.day % 30 === 0) {
    const idx = seasons.indexOf(player.season);
    player.season = seasons[(idx + 1) % 4];
  }
  // 年齢の擬似ローテ（120日で1歳加齢）
  if (player.day % 120 === 0) player.age += 1;

  // 起床時刻と余剰時間
  let wakeH = 6;
  let wakeM = 30;
  if (player.bioRhythm < 40) {
    wakeH = 9; wakeM = 0;
  } else if (player.bioRhythm < 70) {
    wakeH = 7; wakeM = 30;
  }

  // 体調不良判定：リズム<60で夜更かししていた場合、確率30%で発動
  let sickness = false;
  if (sleepMode === "latenight" && player.bioRhythm < 60 && Math.random() < 0.3) {
    sickness = true;
    player.stamina = Math.max(0, player.stamina - 15);
  }

  // 余剰時間のベース（未就学児=6h 想定）
  let base = 6;
  if (sleepMode === "latenight") base += 1;
  if (wakeH >= 9) base -= 2;
  if (sickness) base -= 2;
  if (player.stamina < 30) base -= 1;
  player.spareHours = Math.max(0, base);

  player.clockHour = wakeH;
  player.clockMinute = wakeM;
  player.dailyPlays = 0;

  if (sickness) {
    toast("朝から体調がすぐれない…（余剰時間 -2h）", 2400);
  } else if (sleepMode === "latenight") {
    toast("夜更かしで生活リズムが乱れた…");
  } else if (sleepMode === "early") {
    toast("早寝でリズム回復！");
  }

  renderWakeup();
  showScreen("screen-wakeup");
}

// ===== イベント配線 =====
document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-action]");
  if (!t) return;
  const a = t.dataset.action;
  switch (a) {
    case "start-day":
      renderChooseScreen();
      showScreen("screen-choose");
      break;
    case "skip-playing":
      skipPlaying();
      break;
    case "close-event":
      renderFinish();
      showScreen("screen-finish");
      break;
    case "apply-params":
      applyParams();
      break;
    case "advance-time":
      advanceTime();
      break;
    case "choose-next":
      chooseNextPlay();
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

// ===== 初期描画 =====
renderWakeup();
renderHUD();
