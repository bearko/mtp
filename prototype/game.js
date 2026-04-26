/**
 * カネとジカンとジョウネツと - プロトタイプ
 *
 * 仕様駆動開発ルール：docs/DEVELOPMENT_RULES.md
 * 全仕様索引：docs/specs/SPEC-INDEX.md
 *
 * 画面構成（docs/screens/SCREEN-DESIGN.md）：
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
 * @spec docs/specs/SPEC-022-play-category.md §5.1
 * 遊びカテゴリマスタ。遊びの `categories` 配列で参照される ID と UI 表示ラベルの辞書。
 * プロト段階では保育園で使う 10 カテゴリのみ定義。
 */
const DEFAULT_CATEGORIES = {
  movement:     { label: "運動",     group: "身体" },
  outdoor_toy:  { label: "遊具",     group: "身体" },
  water:        { label: "水遊び",   group: "身体" },
  nature:       { label: "自然",     group: "身体" },
  crafting:     { label: "工作",     group: "創作" },
  imagination:  { label: "想像",     group: "創作" },
  music:        { label: "音楽",     group: "創作" },
  reading:      { label: "読書",     group: "探求" },
  literacy:     { label: "文字",     group: "探求" },
  science:      { label: "観察",     group: "探求" },
  social_play:  { label: "共遊",     group: "交流" },
  friendship:   { label: "交友",     group: "交流" },
  daily_life:   { label: "生活",     group: "生活" },
  sensitivity:  { label: "感受性",   group: "生活" },
  tradition:    { label: "伝統",     group: "文化" },
  tech:         { label: "技術",     group: "文化" },
  competition:  { label: "競技",     group: "文化" },
  travel:       { label: "旅",       group: "文化" },
};
// カテゴリグループの表示順
const CATEGORY_GROUP_ORDER = ["身体", "創作", "探求", "交流", "生活", "文化"];

/**
 * @spec docs/specs/SPEC-025-game-tempo.md §5.2 情熱プロファイル
 * プレイヤーが「何が好きな子か」を 4 種から選ぶ。自動選択のスコア式で使う。
 */
const PASSION_PROFILES = [
  {
    id: "outdoor_kid",
    label: "外が好きな子",
    icon: "🌳",
    description: "走ったり、自然に触れたりするのが大好き",
    preferredCategories: ["movement", "outdoor_toy", "nature", "water"],
  },
  {
    id: "creator_kid",
    label: "ものづくりが好きな子",
    icon: "🎨",
    description: "手を動かして何かを作るのが楽しい",
    preferredCategories: ["crafting", "imagination", "music"],
  },
  {
    id: "bookworm_kid",
    label: "じっくり派",
    icon: "📚",
    description: "絵本や観察が好きで、ゆっくり楽しむタイプ",
    preferredCategories: ["reading", "literacy", "sensitivity", "science"],
  },
  {
    id: "social_kid",
    label: "友達といる子",
    icon: "🤝",
    description: "みんなで遊ぶのが何より楽しい",
    preferredCategories: ["social_play", "friendship", "imagination"],
  },
];

/**
 * @spec docs/specs/SPEC-025-game-tempo.md §4 ライフステージ別の時間流速
 * 1 回の自動ターンで進む日数を返す。プロト段階では保育園（1日/ターン）のみ実装。
 */
function tempoDaysPerTurn(age) {
  if (age <= 4)  return 1;     // 保育園
  if (age <= 6)  return 2;     // 幼稚園
  if (age <= 12) return 3;     // 小学校
  if (age <= 18) return 7;     // 中高
  if (age <= 22) return 14;    // 大学
  if (age <= 50) return 30;    // 社会人
  if (age <= 65) return 60;
  return 30;                   // 老後
}

/**
 * @spec docs/specs/SPEC-002-play-selection.md
 * @spec docs/specs/SPEC-007-friends.md
 * @spec docs/specs/SPEC-022-play-category.md §5.2 遊びマスタへのカテゴリ付与
 * 遊びマスタ。プロト段階では未就学児〜小学生向けを中心に収録。
 */
const DEFAULT_PLAYS = [
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
    categories: ["outdoor_toy", "crafting", "nature"],
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
    categories: ["movement", "social_play"],
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
    categories: ["water", "movement"],
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
    categories: ["crafting", "imagination"],
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
    categories: ["movement", "outdoor_toy"],
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
    categories: ["nature", "movement", "tradition"],
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
    categories: ["reading", "literacy", "sensitivity"],
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
    categories: ["outdoor_toy", "movement"],
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
    categories: ["outdoor_toy", "movement", "competition"],
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
    categories: ["nature", "science"],
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
    categories: ["imagination", "social_play", "friendship"],
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
const DEFAULT_EVENTS = [
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
const DEFAULT_NURSERY_DISCOVERIES = [
  { id: "meet_new_friend",  text: "新しいお友達と仲良くなった！",                    weight: 10, gain: { friends: 1, social: 5 } },
  { id: "learn_slide",      text: "大きな滑り台の上手な滑り方を教えてもらった！",    weight: 8,  gain: { physical: 3 }, unlockPlayId: "big_slide" },
  { id: "learn_sandcastle", text: "砂場で先生にお城の作り方を教わった！",            weight: 8,  gain: { creative: 5, physical: 3 } },
  { id: "nap_refresh",      text: "お昼寝でぐっすり眠った。夢の中で冒険した。",      weight: 6,  gain: { stamina: 10, explore: 3 } },
  { id: "song_time",        text: "「はらぺこあおむし」の歌を覚えた！",              weight: 6,  gain: { explore: 3, creative: 3 } },
  { id: "cry_then_smile",   text: "友達とおもちゃを取り合って泣いた…最後は仲直り。", weight: 4,  gain: { social: 4, passion: 2 } },
  { id: "park_adventure",   text: "公園で小さな虫を見つけて観察した！",              weight: 5,  gain: { explore: 4, physical: 2 } },
];

/*
 * @spec docs/specs/SPEC-028-master-data.md §4 §6
 * マスタは let で保持して、loadMasters() が data/*.json から fetch して上書きできるようにする。
 * 読み込み失敗時は DEFAULT_* のハードコード値をそのまま使う。
 */
let CATEGORIES          = DEFAULT_CATEGORIES;
let PLAYS               = DEFAULT_PLAYS;
let EVENTS              = DEFAULT_EVENTS;
let NURSERY_DISCOVERIES = DEFAULT_NURSERY_DISCOVERIES;
/** @spec SPEC-026 §5.2.1 チュートリアル専用の発見（絵本→滑り台→砂場） */
let TUTORIAL_DISCOVERIES = [];
/** @spec SPEC-047 §4 場所マスタ（locations.json から読み込み） */
let LOCATIONS = [
  { id: "home", name: "自宅", shortName: "自宅", icon: "🏠", type: "residential",
    travelTime: 0, travelFare: 0, accessibleFromHome: true,
    lifeStageTag: ["nursery","kindergarten","elementary","juniorhigh","highschool","university","worker","retirement"],
    description: "自宅", specialBuffs: {},
    parentalOutingWeekdayWeight: 40, parentalOutingWeekendWeight: 0, category: "always" },
];

/** @spec SPEC-050 §4.1 / SPEC-052 ミッションシナリオマスタ */
let MISSION_SCENARIOS = [];
/** @spec SPEC-051 §4.5 称号マスタ */
let TITLES = [];
/** @spec SPEC-054 §2 親が他者から褒められる場面 */
let PARENTAL_COMPLIMENTS = [];
/** @spec SPEC-011 §10.1 親遣い遠出（Issue #14 反映） */
let EVENTS_PARENTAL_OUTING = [];
/** @spec SPEC-056 §2 朝の発火イベントマスタ（感染症・遠出・ふだんの場所） */
let MORNING_EVENTS = [];

/* =========================================================================
 * @spec SPEC-031 / SPEC-032 転生イントロのシーン定義とランダム名マスタ
 *   - ISEKAI_SCENES / NAMES は起動時に data/isekai.json / data/names.json から
 *     上書きされる。読み込み失敗時は DEFAULT_ISEKAI_SCENES / DEFAULT_NAMES を使う。
 * ========================================================================= */
const DEFAULT_ISEKAI_SCENES = [
  {
    id: "scene1",
    bg: "dark",
    messages: [
      { speaker: "narration", text: "・・・" },
      { speaker: "mystery",   text: "・・・次の方どうぞ" },
    ],
  },
  {
    id: "scene2",
    bg: "halo",
    steps: [
      { type: "message", speaker: "god", text: "はい。では確認のためにお名前をお願いします" },
      { type: "input",   field: "playerName", placeholder: "お名前をどうぞ", confirmLabel: "決定" },
      { type: "message", speaker: "god", text: "ありがとうございます。{playerName}さんですね" },
      { type: "message", speaker: "god", text: "前世はブラック企業で働きづめてボロボロになりながら、30歳で交通事故に遭い、ここにいる、と……" },
      { type: "message", speaker: "god", text: "あなたは、これから『転生』します" },
      { type: "message", speaker: "god", text: "次はもっと遊んでからまた来てくださいね。" },
    ],
  },
  {
    id: "scene3",
    bg: "certificate",
    certificate: {
      title: "転生証明書",
      fields: [
        { label: "転生先", value: "人間" },
        { label: "国",     value: "日本" },
        { label: "家庭",   value: "中流家庭" },
        { label: "性別",   value: "男" },
        { label: "寿命",   value: "100歳" },
        { label: "発行日", value: "2026年4月1日" },
      ],
      stampText: "神",
      prompt: "内容をご確認のうえ、タップで承認を受けてください",
      afterStampPrompt: "承認されました。タップで次へ",
    },
  },
  {
    id: "scene4",
    bg: "dawn",
    messages: [
      { speaker: "narration", text: "2026年4月1日　誕生" },
      { speaker: "narration", text: "名前は『{avatarName}』となった" },
      { speaker: "narration", text: "温かい家庭で育てられ、1歳の誕生日を迎えた" },
      { speaker: "narration", text: "さて、今日は何をして遊ぼうか" },
    ],
  },
];
const DEFAULT_NAMES = {
  male:   ["晃", "翔太", "蓮", "陽翔"],
  female: ["美咲", "結衣", "さくら", "葵"],
};
let ISEKAI_SCENES = DEFAULT_ISEKAI_SCENES;
let NAMES         = DEFAULT_NAMES;

/**
 * @spec docs/specs/SPEC-028-master-data.md §6.1
 * マスタデータを data/ 配下の JSON から読み込む。ファイル URL の場合は fetch に失敗するので、
 * DEFAULT_* をそのまま使う（プロト段階の簡易運用）。
 */
async function loadMasters() {
  try {
    const [cat, plays, evs, locs, missions, titles] = await Promise.all([
      fetch("./data/categories.json").then((r) => { if (!r.ok) throw new Error("categories " + r.status); return r.json(); }),
      fetch("./data/plays.json").then((r) => { if (!r.ok) throw new Error("plays " + r.status); return r.json(); }),
      fetch("./data/events.json").then((r) => { if (!r.ok) throw new Error("events " + r.status); return r.json(); }),
      // @spec SPEC-047 §4.1 場所マスタ。失敗しても LOCATIONS = home だけで動くように耐性あり
      fetch("./data/locations.json").then((r) => { if (!r.ok) throw new Error("locations " + r.status); return r.json(); }).catch((e) => { console.warn("[master] locations optional", e); return null; }),
      // @spec SPEC-050 / SPEC-052 ミッションシナリオ。失敗時は空配列で OK
      fetch("./data/mission-scenarios.json").then((r) => { if (!r.ok) throw new Error("mission-scenarios " + r.status); return r.json(); }).catch((e) => { console.warn("[master] missions optional", e); return []; }),
      // @spec SPEC-051 称号マスタ
      fetch("./data/titles.json").then((r) => { if (!r.ok) throw new Error("titles " + r.status); return r.json(); }).catch((e) => { console.warn("[master] titles optional", e); return []; }),
    ]);
    // @spec SPEC-054 §2 parental_compliment マスタ（並列ロードに混ぜると Promise.all が複雑なので別 await）
    try {
      const pc = await fetch("./data/parental-compliments.json").then((r) => r.ok ? r.json() : []);
      if (Array.isArray(pc)) PARENTAL_COMPLIMENTS = pc;
    } catch (e) { console.warn("[master] parental-compliments optional", e); }
    // @spec SPEC-056 §2 morning event マスタ（感染症・親遣い遠出など朝の演出）
    try {
      const me = await fetch("./data/morning-events.json").then((r) => r.ok ? r.json() : []);
      if (Array.isArray(me)) MORNING_EVENTS = me;
    } catch (e) { console.warn("[master] morning-events optional", e); }
    if (Array.isArray(locs) && locs.length > 0) LOCATIONS = locs;
    if (Array.isArray(missions)) MISSION_SCENARIOS = missions;
    if (Array.isArray(titles)) TITLES = titles;
    CATEGORIES = cat;
    PLAYS = plays;
    EVENTS = evs.filter((e) => e.scope === "random_play");
    NURSERY_DISCOVERIES = evs
      .filter((e) => e.scope === "nursery_discovery")
      .map((e) => ({
        id: e.id,
        text: e.text,
        weight: e.weight || 1,
        gain: e.effect || {},
        unlockPlayId: e.unlockPlayId,
      }));
    TUTORIAL_DISCOVERIES = evs
      .filter((e) => e.scope === "tutorial_phase0")
      .map((e) => ({
        id: e.id,
        text: e.text,
        icon: e.icon || "✨",
        unlockPlayId: e.unlockPlayId,
        triggerPlayId: e.triggerPlayId,
        gain: e.effect || {},
      }));
    // @spec SPEC-011 §10.1 親遣い遠出（Issue #14）
    EVENTS_PARENTAL_OUTING = evs.filter((e) => e.scope === "parental_outing");
    console.log(`[master] loaded: ${Object.keys(CATEGORIES).length} categories, ${PLAYS.length} plays, ${EVENTS.length} random events, ${NURSERY_DISCOVERIES.length} discoveries, ${TUTORIAL_DISCOVERIES.length} tutorial events, ${EVENTS_PARENTAL_OUTING.length} parental outings`);
    validateMasters();
  } catch (err) {
    console.warn("[master] load failed, using DEFAULT_*", err);
  }
}

/**
 * @spec docs/specs/SPEC-032-message-master.md §4
 * メッセージマスタ（転生イントロ・名前）を data/ 配下から読み込む。
 * 失敗時は DEFAULT_ISEKAI_SCENES / DEFAULT_NAMES をそのまま使う。
 */
async function loadMessageMasters() {
  try {
    const [isekai, names] = await Promise.all([
      fetch("./data/isekai.json").then((r) => { if (!r.ok) throw new Error("isekai " + r.status); return r.json(); }),
      fetch("./data/names.json").then((r) => { if (!r.ok) throw new Error("names "  + r.status); return r.json(); }),
    ]);
    if (Array.isArray(isekai.scenes) && isekai.scenes.length > 0) {
      ISEKAI_SCENES = isekai.scenes;
    }
    if (names && (Array.isArray(names.male) || Array.isArray(names.female))) {
      NAMES = {
        male:   (Array.isArray(names.male)   && names.male.length   > 0) ? names.male   : DEFAULT_NAMES.male,
        female: (Array.isArray(names.female) && names.female.length > 0) ? names.female : DEFAULT_NAMES.female,
      };
    }
    console.log(`[master] loaded: isekai scenes=${ISEKAI_SCENES.length}, names=male:${NAMES.male.length}/female:${NAMES.female.length}`);
  } catch (err) {
    console.warn("[master] message load failed, using DEFAULT_*", err);
  }
}

/** @spec SPEC-028 §5.4 相互参照の整合性チェック */
function validateMasters() {
  for (const p of PLAYS) {
    for (const c of (p.categories || [])) {
      if (!CATEGORIES[c]) console.warn(`[master] play '${p.id}' references unknown category '${c}'`);
    }
  }
  const playIds = new Set(PLAYS.map((p) => p.id));
  for (const e of [...EVENTS, ...NURSERY_DISCOVERIES, ...TUTORIAL_DISCOVERIES]) {
    if (e.unlockPlayId && !playIds.has(e.unlockPlayId)) {
      console.warn(`[master] event '${e.id}' unlocks unknown play '${e.unlockPlayId}'`);
    }
  }
}

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
  // @spec SPEC-031 §7 転生イントロで入力・付与される名前
  name: "",         // 前世の本人名（プレイヤーが入力）
  avatarName: "",   // 異世界での主人公名（ランダム）
  age: 1,
  day: 1,
  season: "spring",
  clockHour: 7,
  clockMinute: 0,
  // @spec SPEC-026 §5.2 Day 1 は Phase 0（保育園休業）、1 日 8h 自由遊び
  spareHours: 8,
  spareHoursMax: 8,    // 1日の余剰時間ベース（SPEC-021 分母用）
  stamina: 15,
  staminaCap: 15,
  staminaBaseCap: 15,
  staminaBonusCap: 0,
  bioRhythm: 90,
  money: 0,
  friends: 2,
  passion: 0,
  // @spec SPEC-033 素養（旧称: 原体験）。5 カテゴリ。
  //   body(身体) / intellect(知性) / sensitivity(感性) / social(社交) / passion(情熱)
  //   旧ジョウネツは passion に統合。互換のため exp エイリアスで同じオブジェクトを参照する。
  soyou: { body: 0, intellect: 0, sensitivity: 0, social: 0, passion: 0 },
  // @spec SPEC-024 §5.7 スキル（カテゴリ 1:1、Lv 1 - 100）。遅延初期化。
  skills: {},
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
  /** 強制睡眠がコアタイム終了後まで食い込んだ時間（h）。SPEC-019 §5.4.1a */
  _napOverflow: 0,
  /** @spec SPEC-025 §5 情熱プロファイルID。null なら未選択（初回起動時に選ばせる）*/
  passionProfileId: null,
  /** @spec SPEC-025 §5.5 自動進行モード。true のときは runAutoTurn が回る */
  autoMode: false,
  /** @spec SPEC-025 §7 自動進行中のハイライト集約バッファ */
  _autoHighlight: {
    playsById: {},           // playId → 回数
    skillsBefore: {},        // catId → {lv, exp}（開始時点）
    expBefore: {},           // 原体験5カテゴリの開始値
    discoveries: [],         // 新規解禁 or 発見イベントのテキスト
    dayStart: 0,
    dayEnd: 0,
    turnCount: 0,
  },
  /** @spec SPEC-025 §7.1 1 日の終わりサマリ用バッファ（起床時にスナップショット取得） */
  _daySnapshot: {
    dayAtStart: 0,
    expStart: {},
    skillsStart: {},
    playsById: {},
    discoveries: [],
    staminaStart: 0,
    friendsStart: 0,
    moneyStart: 0,
    passionStart: 0,
  },
  /** @spec SPEC-025 §7.1 スキップ目的地（"tomorrow-night" or "weekend"） */
  _skipTarget: null,
  /** 目的地までのカウントダウン日数 */
  _skipRemainingDays: 0,
  /** @spec SPEC-026 §5.3 §5.4 チュートリアル境界日のモーダル表示済みフラグ */
  _tutorialBoundariesSeen: { day8: false, day15: false },
  /** @spec SPEC-026 §5.2.1 チュートリアル発見の保留キュー（finalizePlay 後に通知） */
  _pendingTutorialInterrupts: [],
  /** @spec SPEC-056 §2.1 朝の発火イベントモーダルキュー（goChooseFromToday 冒頭で flush） */
  _pendingMorningEventModals: [],
  /** @spec SPEC-056 §4 ミッション中に体力 0 になった場合、モーダル閉じ時に handleStaminaDepleted を発動 */
  _pendingStaminaDepleted: false,
  /** @spec SPEC-025 §7.2.0 週境界に到達したかどうか。S10 閉じる時に S9 へ分岐するために使う */
  _pendingWeeklyHighlight: false,
  /** @spec SPEC-025 §7.2.0 スキップ中に S9 経由 → 続けるで sleep に戻るフラグ */
  _skipAfterWeekly: false,
  /** @spec SPEC-047 §4.3 現在地の場所 id */
  location: "home",
  /** @spec SPEC-047 §4.3 解禁済みの場所（現状は「親に連れて行ってもらった先」を記録） */
  unlockedLocations: ["home", "near_park"],
  /** @spec SPEC-047 §8.3 場所由来の持続バフ（期限付き） */
  persistBuffs: [],
  /** @spec SPEC-047 §7.3 今日の親遣い先（null なら自宅） */
  _parentalOutingToday: null,
  /** @spec SPEC-047 §7.3 スキップの到達日。この日までは親遣い抽選を抑制。0 ならスキップなし */
  _skipTargetDay: 0,
  /**
   * @spec SPEC-050 §4 ストーリー型ミッションの進行状態。
   *   各エントリ: { id, state: "INCITED"|"ACCEPTED"|"COMPLETED", startDay, hintsShown: [hintIdx...] }
   */
  activeMissions: [],
  completedMissions: [],
  /** @spec SPEC-051 §4.5 獲得済み称号 { id, acquiredDay, flavor } */
  titles: [],
  /** @spec SPEC-051 §6.2.2 忘れられない日（ミッション達成・fullday trip 等） */
  memorableDays: [],
  /** @spec SPEC-051 §6.2.1 連絡帳ハイライト（感情温度が高いコメント） */
  renrakuchoHighlights: [],
  /** @spec SPEC-051 §3.1 各遊びの累計プレイ回数（称号判定用） */
  _playCounts: {},
  /** @spec SPEC-054 §2.3 parental_compliment の cooldown（30 日に 1 回まで） */
  _lastParentalComplimentDay: 0,
  /** @spec SPEC-011 §10.1 §10.3 Issue #14 保育園特別イベントモード */
  _specialDayMode: null,      // null | "outing" | "infection" | "clinic"
  _visitedClinicToday: false, // SPEC-057 §3 通院フラグ。夜の治癒判定で消費
  _infectionJustHealed: false,// SPEC-057 §2 治癒した直後フラグ。朝モーダルで使う
  _pendingOuting: null,       // 今日発動した遠出イベントオブジェクト
  _infectionRemainingDays: 0, // 感染症の残日数
};

/**
 * @spec SPEC-033 §3 素養の日本語ラベル（S3 結果・S9 ハイライト等で使う）。
 *   旧 LABELS（physical/creative/explore/social/competitive）は廃止し、
 *   5 素養（body/intellect/sensitivity/social/passion）に統一。
 */
const LABELS = {
  body:        "身体",
  intellect:   "知性",
  sensitivity: "感性",
  social:      "社交",
  passion:     "情熱",
};

const SEASON_LABEL = { spring: "春", summer: "夏", autumn: "秋", winter: "冬" };

// =========================================================================
// 状態
// =========================================================================
let player = structuredClone(DEFAULT_PLAYER);

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * @spec SPEC-033 §5 §6 素養モデルの互換層
 * - player.exp は player.soyou を指すエイリアス（同オブジェクト参照）
 * - player.passion は player.soyou.passion に対する getter/setter
 * 既存コードが `player.exp.body += n` や `player.passion += m` をやっても、
 * 実体は `player.soyou` に一本化される。
 */
/**
 * @spec SPEC-033 §3 5 素養のキーとラベル
 */
const SOYOU_KEYS = ["body", "intellect", "sensitivity", "social", "passion"];
const SOYOU_META = {
  body:        { label: "身体", icon: "💪" },
  intellect:   { label: "知性", icon: "🧠" },
  sensitivity: { label: "感性", icon: "🎨" },
  social:      { label: "社交", icon: "👥" },
  passion:     { label: "情熱", icon: "🔥" },
};

/**
 * @spec SPEC-033 §5 旧キーを新キーに変換（互換用）
 */
const LEGACY_EXP_TO_SOYOU = {
  physical:    "body",
  explore:     "intellect",
  creative:    "sensitivity",
  social:      "social",
  competitive: null, // 廃止
};
function toSoyouKey(key) {
  if (SOYOU_KEYS.includes(key)) return key;
  const mapped = LEGACY_EXP_TO_SOYOU[key];
  if (mapped === undefined) return key;  // 未知のキーはそのまま
  return mapped; // null 含む
}

/** gain オブジェクト {legacyKey: n, ...} を {soyouKey: n, ...} に変換。旧キー混在に強い。 */
function normalizeGainToSoyou(gain) {
  if (!gain) return {};
  const out = {};
  for (const [k, v] of Object.entries(gain)) {
    const nk = toSoyouKey(k);
    if (nk == null) continue; // 廃止キー
    if (!SOYOU_KEYS.includes(nk)) {
      // soyou 以外の値（friends, stamina, passion は別枠）はそのまま保持する
      out[k] = (out[k] || 0) + v;
      continue;
    }
    out[nk] = (out[nk] || 0) + v;
  }
  return out;
}

/**
 * @spec SPEC-033 §4 実数値をグレード文字に変換
 */
function soyouGrade(value) {
  const v = Math.floor(Number(value) || 0);
  if (v >= 140) return "A";
  if (v >= 110) return "B";
  if (v >=  80) return "C";
  if (v >=  66) return "D";
  if (v >=  40) return "E";
  if (v >=  20) return "F";
  return "G";
}

/* =========================================================================
 * @spec SPEC-047 §4 §5 §8 場所ヘルパ関数
 * ========================================================================= */

/** @return 現在の場所オブジェクト（なければ home） */
function currentLocation() {
  return LOCATIONS.find((l) => l.id === player.location) || LOCATIONS.find((l) => l.id === "home") || LOCATIONS[0];
}

/** 場所 id → 名前（id 不明なら id 自体を返す） */
function locationName(id) {
  const l = LOCATIONS.find((x) => x.id === id);
  return l ? l.name : id;
}

/** 場所 id → アイコン */
function locationIcon(id) {
  const l = LOCATIONS.find((x) => x.id === id);
  return l ? l.icon : "📍";
}

/**
 * 重み付きランダム抽選
 * @param pool [{ weight キー: number, ...}]
 * @param weightKey 重みフィールド名
 */
function weightedRandomLocation(pool, weightKey) {
  if (!pool || pool.length === 0) return null;
  const total = pool.reduce((sum, p) => sum + (p[weightKey] || 0), 0);
  if (total <= 0) return pool[0];
  let r = Math.random() * total;
  for (const p of pool) {
    r -= (p[weightKey] || 0);
    if (r <= 0) return p;
  }
  return pool[pool.length - 1];
}

/**
 * @spec SPEC-057 §3 v2 感染症中の親遣い抽選は clinic / home に厳格に限定。
 *   バグ防止のため `_specialDayMode === "infection"` だけでなく
 *   `_infectionRemainingDays > 0` でもガードする（OR で評価）。
 * @returns {object|null} clinic / home が決まれば返す、感染症ではない場合は null
 */
function pickInfectionDayLocation() {
  const sick = (player._specialDayMode === "infection") || (player._infectionRemainingDays > 0);
  if (!sick) return null;
  const clinic = LOCATIONS.find((l) => l.id === "clinic");
  if (clinic && Math.random() < 0.9) return clinic;
  return LOCATIONS.find((l) => l.id === "home");
}

/** @spec SPEC-047 §8.1 保育園期 平日の親遣い抽選 */
function pickWeekdayParentalOuting() {
  // @spec SPEC-057 §3 v2 感染症中は clinic / home 以外には絶対に行かない（風邪なのに公園・児童館は禁忌）
  const infectionLoc = pickInfectionDayLocation();
  if (infectionLoc) return infectionLoc;
  const pool = LOCATIONS.filter((l) =>
    l.parentalOutingWeekdayWeight > 0 &&
    (l.lifeStageTag || []).includes("nursery")
  );
  return weightedRandomLocation(pool, "parentalOutingWeekdayWeight");
}

/** @spec SPEC-047 §8.2 保育園期 土日祝の親遣い抽選 */
function pickWeekendParentalOuting() {
  // @spec SPEC-057 §3 v2 感染症中は土日祝でも clinic / home に限定
  const infectionLoc = pickInfectionDayLocation();
  if (infectionLoc) return infectionLoc;
  if (Math.random() < 0.40) {
    return LOCATIONS.find((l) => l.id === "home");
  }
  const pool = LOCATIONS.filter((l) =>
    l.parentalOutingWeekendWeight > 0 &&
    (l.lifeStageTag || []).includes("nursery") &&
    (!l.seasonWindow || l.seasonWindow.includes(player.season))
  );
  return weightedRandomLocation(pool, "parentalOutingWeekendWeight") || LOCATIONS.find((l) => l.id === "home");
}

/** @spec SPEC-047 §8.3 持続バフの期限切れを掃除 */
function cleanupPersistBuffs() {
  if (!Array.isArray(player.persistBuffs)) { player.persistBuffs = []; return; }
  player.persistBuffs = player.persistBuffs.filter((b) => (b.untilDay || 0) >= player.day);
}

/** @spec SPEC-047 §8.3 持続バフからこのプレイの加算倍率を算出 */
function applyPersistBuffsToGain(play) {
  cleanupPersistBuffs();
  let mul = 1.0;
  const cats = play.categories || [];
  for (const buff of player.persistBuffs || []) {
    if (buff.type === "category" && cats.includes(buff.category)) {
      mul *= buff.multiplier || 1.0;
    }
  }
  return mul;
}

/* =========================================================================
 * @spec SPEC-050 / SPEC-052 ミッションエンジン（ストーリー型）
 *
 * ミッションの進行状態：
 *   INCITED（発端済み、触媒待ち）→ ACCEPTED（受諾、挑戦中）→ COMPLETED（達成）
 *
 * 主要関数：
 *   - getMissionState(id) / setMissionState(id, ...)
 *   - evaluateMissionCondition(cond)           ：SPEC-052 §7 条件評価
 *   - checkMissionTriggers(context)            ：発端/達成のトリガー判定
 *   - startMissionIncite(m, context)           ：発端シーンを起動
 *   - acceptMission(m)                         ：触媒を経て受諾
 *   - completeMission(m)                       ：達成演出を起動
 *   - showMissionModal(mission, phase)         ：モーダルでセリフを順次表示
 *   - renderMissionBanner()                    ：HUD 下のバナー更新
 * ========================================================================= */

function getMissionState(id) {
  return player.activeMissions.find((m) => m.id === id);
}

/** @spec SPEC-052 §7 進捗条件の評価 */
function evaluateMissionCondition(cond) {
  if (!cond) return { match: true, progress: 1.0 };
  const parts = [];
  if (cond.soyouAtLeast) {
    for (const [k, v] of Object.entries(cond.soyouAtLeast)) {
      parts.push(Math.min(1.0, (player.soyou[k] || 0) / v));
    }
  }
  if (cond.playCountAtLeast) {
    for (const [id, v] of Object.entries(cond.playCountAtLeast)) {
      parts.push(Math.min(1.0, (player._playCounts[id] || 0) / v));
    }
  }
  if (cond.playCountAtLeastAtLocation) {
    const count = cond.playCountAtLeastAtLocation.locationIds.reduce((s, lid) => s + (player._playCountsByLocation?.[lid] || 0), 0);
    parts.push(Math.min(1.0, count / cond.playCountAtLeastAtLocation.count));
  }
  if (cond.allSoyouAtLeast != null) {
    const v = cond.allSoyouAtLeast;
    for (const k of SOYOU_KEYS) {
      parts.push(Math.min(1.0, (player.soyou[k] || 0) / v));
    }
  }
  const match = parts.every((p) => p >= 1.0);
  const progress = parts.length > 0 ? parts.reduce((a, b) => a + b, 0) / parts.length : 1.0;
  return { match, progress };
}

/**
 * @spec SPEC-052 §2 発端／達成トリガーの判定。
 * context = { type: "enterLocation", location: "..." } or { type: "afterPlay", playId: "..." }
 * 候補ミッションを返す。副作用は呼び出し側で。
 */
function findMissionsToTrigger(context) {
  const stage = resolveLifeStage(player.age);
  const stageId = stage ? stage.id : "nursery";
  const candidates = [];

  for (const m of MISSION_SCENARIOS) {
    if (m.lifeStageTag && m.lifeStageTag !== stageId) continue;
    const cur = getMissionState(m.id);
    const completed = (player.completedMissions || []).includes(m.id);

    // 発端：まだ未受諾かつ未完了
    if (!cur && !completed && m.incite && triggerMatches(m.incite.trigger, context)) {
      if (m.incite.minAge && player.age < m.incite.minAge) continue;
      if (m.incite.maxAge && player.age > m.incite.maxAge) continue;
      if (m.incite.trigger.probability != null && Math.random() >= m.incite.trigger.probability) continue;
      candidates.push({ mission: m, phase: "incite" });
      continue;
    }

    // 達成：受諾済みかつトリガー一致かつ条件達成
    if (cur && cur.state === "ACCEPTED" && m.accomplish && triggerMatches(m.accomplish.trigger, context)) {
      const { match } = evaluateMissionCondition(m.accomplish.trigger.requires);
      if (match) {
        candidates.push({ mission: m, phase: "accomplish" });
      }
    }
  }
  return candidates;
}

function triggerMatches(trigger, context) {
  if (!trigger || !context) return false;
  if (trigger.type !== context.type) return false;
  switch (trigger.type) {
    case "enterLocation":
      return trigger.location === context.location;
    case "playCountAtLeast":
      return context.playId === trigger.playId && (player._playCounts[trigger.playId] || 0) >= trigger.count;
    case "afterPlay":
      return context.playId === trigger.playId;
    default:
      return false;
  }
}

/** @spec SPEC-050 §3 発端シーンの起動（モーダル演出） */
function startMissionIncite(mission) {
  const ms = { id: mission.id, state: "INCITED", startDay: player.day, hintsShown: [] };
  player.activeMissions.push(ms);
  showMissionModal(mission, "incite", () => {
    acceptMission(mission);
  });
}

/** @spec SPEC-050 §3 触媒（モーダル＋解禁＋バナー登録） */
function acceptMission(mission) {
  const ms = getMissionState(mission.id);
  if (!ms) return;
  ms.state = "ACCEPTED";
  const cat = mission.catalyst || {};
  // 遊び解禁
  for (const pid of (cat.unlockPlays || [])) {
    if (!player.unlockedPlays.includes(pid)) player.unlockedPlays.push(pid);
  }
  // 場所解禁
  for (const lid of (cat.unlockLocations || [])) {
    if (!player.unlockedLocations.includes(lid)) player.unlockedLocations.push(lid);
  }
  // 関係値増減
  if (cat.relationshipDelta) {
    player.relationships = player.relationships || {};
    for (const [npcId, delta] of Object.entries(cat.relationshipDelta)) {
      const cur = player.relationships[npcId] || { value: 50, history: [] };
      cur.value = Math.max(0, Math.min(100, cur.value + delta));
      player.relationships[npcId] = cur;
    }
  }
  showMissionModal(mission, "catalyst", () => {
    renderMissionBanner();
  });
}

/** @spec SPEC-050 §5 達成（4 軸を埋める演出 + 報酬 + 連絡帳） */
/**
 * @spec SPEC-055 §2 達成可能になったとき：
 *   - autoAttempt: true → 即 completeMission（既存挙動）
 *   - manualAttempt: true → 『ちょうせんしてみる？』モーダル経由（SDT 自律性）
 *   - どちらの指定も無い → manualAttempt 扱い（v2 デフォルト）
 */
let _attemptPromptMission = null;
function tryStartMissionAccomplish(mission) {
  const trigger = (mission.accomplish && mission.accomplish.trigger) || {};
  if (trigger.autoAttempt && !trigger.manualAttempt) {
    completeMission(mission);
    return;
  }
  // manualAttempt or デフォルト → モーダル
  showAttemptPromptModal(mission);
}

function showAttemptPromptModal(mission) {
  _attemptPromptMission = mission;
  const trigger = (mission.accomplish && mission.accomplish.trigger) || {};
  const prompt = trigger.attemptPrompt || {};
  const titleEl = byId("attempt-prompt-title");
  if (titleEl) titleEl.textContent = prompt.title || "もうできるかも？";
  const subtitleEl = byId("attempt-prompt-subtitle");
  if (subtitleEl) subtitleEl.textContent = mission.title || "";
  const headlineEl = byId("attempt-prompt-headline");
  if (headlineEl) headlineEl.textContent = prompt.headline || "今ならできるかもしれない…挑戦してみる？";
  const yesBtn = byId("btn-attempt-prompt-yes");
  if (yesBtn) yesBtn.textContent = prompt.yesLabel || "ちょうせんしてみる";
  const laterBtn = byId("btn-attempt-prompt-later");
  if (laterBtn) laterBtn.textContent = prompt.laterLabel || "まだ、こんどにする";
  showScreen("screen-mission-attempt-prompt");
}

function onAttemptPromptYes() {
  const mission = _attemptPromptMission;
  _attemptPromptMission = null;
  if (mission) {
    completeMission(mission);
  } else {
    goChooseFromToday();
  }
}

function onAttemptPromptLater() {
  // S2 へ。ミッションは ACCEPTED のまま、再訪時に再度プロンプトが出る
  _attemptPromptMission = null;
  // @spec SPEC-056 §4 「まだ」を選んだ場合は別腹扱いをしないので、保留中の強制就寝があればここで消化
  // ただし isMissionModalActive() は現在 attempt-prompt を含むので、いったんプロンプト active 判定を外して呼ぶ
  if (player._pendingStaminaDepleted && player.stamina <= 0) {
    player._pendingStaminaDepleted = false;
    try { handleStaminaDepleted(); } catch (e) { console.warn("[stamina] depleted error", e); }
    return;
  }
  goChooseFromToday();
}

/**
 * @spec SPEC-055 §1 予告ヒントの計算
 * 未完了かつ active でないミッションの中から、発端トリガが「あと一歩」のものを返す。
 */
function computePreviewHint() {
  const stage = resolveLifeStage(player.age);
  if (!stage) return null;
  const stageId = stage.id;
  for (const m of MISSION_SCENARIOS) {
    if (m.lifeStageTag && m.lifeStageTag !== stageId) continue;
    if (player.completedMissions.includes(m.id)) continue;
    if (player.activeMissions.some((a) => a.id === m.id)) continue;
    if (!m.incite || !m.incite.previewHint) continue;
    if (m.incite.minAge && player.age < m.incite.minAge) continue;
    const t = m.incite.trigger;
    if (!t) continue;

    let nearReady = false;
    switch (t.type) {
      case "enterLocation":
        // @spec SPEC-055 §1.2 v2 enterLocation 型は「今朝の親遣い先」のときだけ near。
        //   解禁済みだけで判定すると毎日鳴ってサプライズ性が消えるため。
        nearReady = (player._parentalOutingToday === t.location);
        break;
      case "playCountAtLeast":
        const count = (player._playCounts || {})[t.playId] || 0;
        nearReady = count >= Math.floor((t.count || 1) * 0.7);
        break;
    }
    if (nearReady) {
      return { mission: m, hint: m.incite.previewHint };
    }
  }
  return null;
}

/**
 * @spec SPEC-055 §1 HUD 直下に予告ヒントを描画。
 *   なければ要素を hidden に。
 */
function renderPreviewHint() {
  const root = byId("mission-prelude");
  if (!root) return;
  const result = computePreviewHint();
  const headlineEl0 = byId("mission-prelude-headline");
  const detailEl0   = byId("mission-prelude-detail");
  if (!result) {
    root.hidden = true;
    // テキストもクリアして残留を避ける（テスト時の状態遷移検証も含む）
    if (headlineEl0) headlineEl0.textContent = "";
    if (detailEl0)   detailEl0.textContent   = "";
    return;
  }
  root.hidden = false;
  const headlineEl = byId("mission-prelude-headline");
  const detailEl   = byId("mission-prelude-detail");
  const iconEl     = byId("mission-prelude-icon");
  if (iconEl)     iconEl.textContent     = result.hint.icon || "💭";
  if (headlineEl) headlineEl.textContent = result.hint.headline || "もうすぐ何か…";
  if (detailEl)   detailEl.textContent   = result.hint.detail || "";
}

function completeMission(mission) {
  const ms = getMissionState(mission.id);
  if (!ms || ms.state !== "ACCEPTED") return;
  ms.state = "COMPLETED";
  const acc = mission.accomplish || {};
  const rew = acc.rewards || {};

  // 称号
  for (const titleId of (rew.titles || [])) {
    const t = TITLES.find((x) => x.id === titleId);
    if (!t) continue;
    if (player.titles.some((pt) => pt.id === titleId)) continue;
    player.titles.push({
      id: titleId,
      acquiredDay: player.day,
      flavor: t.flavor ? t.flavor.text : "",
    });
  }
  // 素養ボーナス
  if (rew.soyouBonus) {
    for (const [k, v] of Object.entries(normalizeGainToSoyou(rew.soyouBonus))) {
      if (SOYOU_KEYS.includes(k)) {
        player.soyou[k] = (player.soyou[k] || 0) + v;
      }
    }
  }
  // 持続バフ
  for (const buff of (rew.persistBuffs || [])) {
    player.persistBuffs = player.persistBuffs || [];
    player.persistBuffs.push({
      type: buff.type || "category",
      category: buff.category,
      multiplier: buff.multiplier || 1.0,
      untilDay: player.day + (buff.durationDays || 30),
      sourceMissionId: mission.id,
    });
  }
  // 遊び解禁
  for (const pid of (rew.unlockPlays || [])) {
    if (!player.unlockedPlays.includes(pid)) player.unlockedPlays.push(pid);
  }
  // 関係値増減
  if (rew.relationshipDelta) {
    player.relationships = player.relationships || {};
    for (const [npcId, delta] of Object.entries(rew.relationshipDelta)) {
      const cur = player.relationships[npcId] || { value: 50, history: [] };
      cur.value = Math.max(0, Math.min(100, cur.value + delta));
      player.relationships[npcId] = cur;
    }
  }
  // 忘れられない日
  if (acc.memorableDay) {
    player.memorableDays = player.memorableDays || [];
    player.memorableDays.push({
      day: player.day,
      type: "mission_accomplishment",
      missionId: mission.id,
      emotionText: acc.memorableDay.emotionText,
    });
  }
  // 連絡帳ハイライトにも追加
  if (acc.renrakuchoEntry) {
    player.renrakuchoHighlights = player.renrakuchoHighlights || [];
    player.renrakuchoHighlights.unshift({
      day: player.day,
      speaker: "teacher_sakura",
      text: acc.renrakuchoEntry,
      emotion: "happy",
      fromMissionId: mission.id,
    });
    // 上限 20 件
    if (player.renrakuchoHighlights.length > 20) {
      player.renrakuchoHighlights = player.renrakuchoHighlights.slice(0, 20);
    }
  }

  // activeMissions から除去、completedMissions に追加
  player.activeMissions = player.activeMissions.filter((m) => m.id !== mission.id);
  if (!player.completedMissions.includes(mission.id)) {
    player.completedMissions.push(mission.id);
  }

  // 演出モーダル
  showMissionModal(mission, "accomplish", () => {
    renderMissionBanner();
    renderHUD();  // 素養値の変動を HUD に反映
  });
}

/**
 * 進捗ヒント（挑戦中に親の励まし等を差し込む）
 */
function maybeShowChallengeHints(mission) {
  const ms = getMissionState(mission.id);
  if (!ms || ms.state !== "ACCEPTED") return;
  const hints = (mission.challenge && mission.challenge.progressHints) || [];
  for (let i = 0; i < hints.length; i++) {
    const h = hints[i];
    if (ms.hintsShown.includes(i)) continue;
    const { match } = evaluateMissionCondition(h.condition);
    if (match) {
      ms.hintsShown.push(i);
      // 簡易：トーストで表示
      const firstLine = h.dialog && h.dialog[0] ? h.dialog[0].text : "";
      if (firstLine) toast(firstLine, 2400);
      if (h.once) break;
    }
  }
}

/**
 * 称号の自動認定（ミッション外の累積系）
 */
function evaluateTitleAutoTriggers() {
  for (const t of TITLES) {
    if (!t.autoTrigger) continue;
    if (player.titles.some((pt) => pt.id === t.id)) continue;
    const trig = t.autoTrigger;
    let match = false;
    switch (trig.type) {
      case "playCountAtLeast":
        match = (player._playCounts[trig.playId] || 0) >= trig.count;
        break;
      case "playCountAtLeastAtLocation":
        const sum = (trig.locationIds || []).reduce((s, lid) => s + (player._playCountsByLocation?.[lid] || 0), 0);
        match = sum >= trig.count;
        break;
      case "soyouAtLeast":
        match = (player.soyou[trig.key] || 0) >= trig.value;
        break;
      case "allSoyouAtLeast":
        match = SOYOU_KEYS.every((k) => (player.soyou[k] || 0) >= trig.value);
        break;
      case "discoveryFound":
        match = (player.discoveredIds || []).includes(trig.discovery);
        break;
    }
    if (match) {
      player.titles.push({
        id: t.id,
        acquiredDay: player.day,
        flavor: t.flavor ? t.flavor.text : "",
      });
      toast(`🏆 「${t.name}」を覚えた！`, 2600);
    }
  }
}

/**
 * 場所到着時のミッショントリガ呼び出し（completeTravel / maybeResolveMorningLocation 後に呼ぶ）
 */
function onLocationEntered(locationId) {
  // @spec SPEC-057 §3 clinic 訪問は感染症治癒フラグを立てる（夜の判定で消費）
  if (locationId === "clinic") {
    player._visitedClinicToday = true;
    player._specialDayMode = "clinic";  // S2 スキップは継続
  }

  const triggers = findMissionsToTrigger({ type: "enterLocation", location: locationId });
  // 達成トリガが優先（発端より先に処理）
  const accTrig = triggers.find((x) => x.phase === "accomplish");
  if (accTrig) {
    // @spec SPEC-055 §2 manualAttempt 対応：『ちょうせんしてみる？』モーダルを挟む
    tryStartMissionAccomplish(accTrig.mission);
    return;
  }
  // @spec SPEC-054 §4.1 ミッション発端より優先で parental_compliment を判定
  //   ただし発端と同列なら parental_compliment が cooldown 中の場合は発動しない
  const pc = maybeTriggerParentalCompliment({ type: "enterLocation", location: locationId });
  if (pc) {
    startParentalCompliment(pc);
    return;
  }
  const inciteTrig = triggers.find((x) => x.phase === "incite");
  if (inciteTrig) {
    startMissionIncite(inciteTrig.mission);
  }
}

/* =========================================================================
 * @spec SPEC-054 §4 parental_compliment（親が他者から褒められる場面）
 * ========================================================================= */

/** cooldown と条件をチェックし、発動可能な場面を返す（無ければ null） */
function maybeTriggerParentalCompliment(context) {
  const COOLDOWN_DAYS = 30;
  if (player.day - (player._lastParentalComplimentDay || 0) < COOLDOWN_DAYS) return null;
  const stage = resolveLifeStage(player.age);
  if (!stage || stage.id !== "nursery") return null;
  if (tutorialPhase(player.day) === "phase0") return null;

  const candidates = (PARENTAL_COMPLIMENTS || []).filter((pc) => {
    if (pc.lifeStageTag && pc.lifeStageTag !== stage.id) return false;
    if (!triggerMatches(pc.trigger, context)) return false;
    if (pc.trigger.minAge && player.age < pc.trigger.minAge) return false;
    if (pc.trigger.requires) {
      const { match } = evaluateMissionCondition(pc.trigger.requires);
      if (!match) return false;
    }
    return true;
  });
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

/** parental_compliment を発動：ダイアログ表示＋報酬適用 */
function startParentalCompliment(pc) {
  player._lastParentalComplimentDay = player.day;
  // 報酬を先に適用しておき、ダイアログ閉じた後に S2 へ
  const rew = pc.rewards || {};
  if (rew.soyouBonus) {
    for (const [k, v] of Object.entries(normalizeGainToSoyou(rew.soyouBonus))) {
      if (SOYOU_KEYS.includes(k)) {
        player.soyou[k] = (player.soyou[k] || 0) + v;
      }
    }
  }
  if (pc.dialog && rew.memorableDay) {
    player.memorableDays.push({
      day: player.day,
      type: "parental_compliment",
      pcId: pc.id,
      emotionText: rew.memorableDay.emotionText,
    });
  }
  if (rew.renrakuchoEntry) {
    player.renrakuchoHighlights = player.renrakuchoHighlights || [];
    player.renrakuchoHighlights.unshift({
      day: player.day,
      speaker: "narrator_neighbor",  // 第三者からの言葉として記録
      text: rew.renrakuchoEntry,
      emotion: "happy",
      fromPcId: pc.id,
    });
    if (player.renrakuchoHighlights.length > 20) {
      player.renrakuchoHighlights = player.renrakuchoHighlights.slice(0, 20);
    }
  }
  // ダイアログ表示（既存のミッションモーダルを共用、phase は "compliment" として扱う）
  showComplimentModal(pc);
}

/** parental_compliment 用モーダル（mission-modal を流用、専用クラスで雰囲気を分ける） */
function showComplimentModal(pc) {
  _missionModalQueue = (pc.dialog || []).slice();
  _missionModalOnClose = () => { renderHUD(); };

  const root = byId("screen-mission-modal");
  if (!root) {
    for (const line of (pc.dialog || [])) {
      toast(`${speakerDisplay(line.speaker)}: ${line.text}`, 1400);
    }
    return;
  }
  byId("mission-modal-phase").textContent = "🌸 ほめられた";
  byId("mission-modal-title").textContent = pc.title || "ほめられた瞬間";
  byId("mission-modal-subtitle").textContent = "";
  // 専用クラス（オレンジ寄りの暖色背景）
  root.classList.remove("celebration", "incite", "catalyst");
  root.classList.add("compliment");

  showScreen("screen-mission-modal");
  showNextMissionDialog();
}

/**
 * プレイ完了時のミッショントリガ呼び出し（finalizePlay 末尾に呼ぶ）
 */
function onPlayFinalized(play) {
  player._playCounts = player._playCounts || {};
  player._playCounts[play.id] = (player._playCounts[play.id] || 0) + 1;
  player._playCountsByLocation = player._playCountsByLocation || {};
  player._playCountsByLocation[player.location] = (player._playCountsByLocation[player.location] || 0) + 1;

  // 挑戦中ミッションの進捗ヒント
  for (const ms of player.activeMissions) {
    if (ms.state !== "ACCEPTED") continue;
    const m = MISSION_SCENARIOS.find((x) => x.id === ms.id);
    if (m) maybeShowChallengeHints(m);
  }
  // 累積系トリガ（playCountAtLeast）：達成 → 発端の優先順位
  const triggers = findMissionsToTrigger({ type: "playCountAtLeast", playId: play.id });
  // @spec SPEC-055 §2 達成は manualAttempt 経由（モーダル）
  const acc = triggers.find((x) => x.phase === "accomplish");
  if (acc) {
    tryStartMissionAccomplish(acc.mission);
    return;
  }
  const incite = triggers.find((x) => x.phase === "incite");
  if (incite) startMissionIncite(incite.mission);

  // 称号の自動認定
  evaluateTitleAutoTriggers();
  // ミッションバナーの更新
  renderMissionBanner();
  // @spec SPEC-055 §1 予告ヒントの再計算
  renderPreviewHint();
}

/* =========================================================================
 * @spec SPEC-050 §5 §7  ミッションモーダル演出 / バナー
 * ========================================================================= */

const SPEAKER_LABEL = {
  narration: "（ナレーション）",
  player: "あなた",
  mother: "お母さん",
  father: "お父さん",
  teacher_sakura: "さくら先生",
  teacher_midori: "みどり先生",
  // @spec SPEC-054 §5 第三者 NPC（暫定、SPEC-041 で本格 NPC 化予定）
  narrator_neighbor: "ご近所さん",
  narrator_other_parent: "他のお母さん",
  narrator_relative: "おばあちゃん",
  narrator_park_oji: "公園のおじいさん",
};
function speakerDisplay(id) {
  return SPEAKER_LABEL[id] || id || "";
}

const PHASE_LABEL = {
  incite:     "🌱 はじまり",
  catalyst:   "💬 きっかけ",
  accomplish: "🎉 達成！",
};

let _missionModalQueue = [];
let _missionModalOnClose = null;

/**
 * @spec SPEC-050 ミッションのダイアログをモーダル表示。
 * phase: "incite" | "catalyst" | "accomplish"
 * onDone: すべてのセリフを見終わった後のコールバック
 */
function showMissionModal(mission, phase, onDone) {
  const section = mission[phase] || {};
  const dialog = section.dialog || [];
  if (dialog.length === 0) { if (onDone) onDone(); return; }

  _missionModalQueue = dialog.slice();
  _missionModalOnClose = onDone || null;

  const root = byId("screen-mission-modal");
  if (!root) { // DOM 未実装時のフォールバック
    for (const line of dialog) {
      toast(`${speakerDisplay(line.speaker)}: ${line.text}`, 1200);
    }
    if (onDone) setTimeout(onDone, 1500);
    return;
  }

  byId("mission-modal-phase").textContent = PHASE_LABEL[phase] || "";
  byId("mission-modal-title").textContent = mission.title || "";
  byId("mission-modal-subtitle").textContent = mission.subtitle || "";
  // 達成時だけ紙吹雪クラス
  root.classList.toggle("celebration", phase === "accomplish");
  root.classList.toggle("incite", phase === "incite");
  root.classList.toggle("catalyst", phase === "catalyst");

  showScreen("screen-mission-modal");
  showNextMissionDialog();
}

function showNextMissionDialog() {
  if (_missionModalQueue.length === 0) {
    const cb = _missionModalOnClose;
    _missionModalOnClose = null;
    if (cb) {
      // callback は次のフェーズ（catalyst など）を起動する可能性があるので先に実行
      cb();
      // callback で再度 showMissionModal が呼ばれていれば、screen-mission-modal が active のまま
      if (document.querySelector(".screen.active")?.id === "screen-mission-modal") return;
    }
    // @spec SPEC-056 §4 デザートは別腹：達成・触媒モーダルを閉じる時に
    //   保留中の handleStaminaDepleted があればここで消化する
    if (consumePendingStaminaDepleted()) return;
    // モーダルを閉じる → S2 に戻る
    goChooseFromToday();
    return;
  }
  const line = _missionModalQueue.shift();
  const emotionClass = line.emotion ? `emotion-${line.emotion}` : "";
  byId("mission-modal-speaker").textContent = speakerDisplay(line.speaker);
  const body = byId("mission-modal-body");
  body.className = "mission-modal-body " + emotionClass;
  body.textContent = line.text || "";
}

/**
 * @spec SPEC-050 §5 HUD 下のミッションバナー
 * active ミッション 0 件なら非表示、1+ 件なら折りたたみ式で表示。
 */
function renderMissionBanner() {
  const banner = byId("mission-banner");
  if (!banner) return;
  const list = byId("mission-banner-list");
  const active = (player.activeMissions || []).filter((m) => m.state === "ACCEPTED");
  banner.hidden = (active.length === 0);
  if (active.length === 0) { if (list) list.innerHTML = ""; return; }

  byId("mission-banner-count").textContent = active.length;

  if (list) {
    list.innerHTML = active.map((ms) => {
      const m = MISSION_SCENARIOS.find((x) => x.id === ms.id);
      if (!m) return "";
      const acc = m.accomplish || {};
      const req = acc.trigger && acc.trigger.requires;
      const prog = evaluateMissionCondition(req);
      const pct = Math.round((prog.progress || 0) * 100);
      return `
        <li class="mission-banner-item">
          <div class="mbi-title">${m.title}</div>
          <div class="mbi-subtitle">${m.subtitle || ""}</div>
          <div class="mbi-progress"><div class="mbi-progress-fill" style="width:${pct}%"></div></div>
          <div class="mbi-progress-label">${pct}%</div>
        </li>
      `;
    }).join("");
  }
}

function activeAcceptedMissionWithProgress() {
  const active = (player.activeMissions || [])
    .filter((m) => m.state === "ACCEPTED")
    .map((ms) => {
      const mission = MISSION_SCENARIOS.find((x) => x.id === ms.id);
      if (!mission) return null;
      const req = mission.accomplish?.trigger?.requires;
      const progress = evaluateMissionCondition(req);
      return { mission, progress: progress.progress || 0 };
    })
    .filter(Boolean)
    .sort((a, b) => b.progress - a.progress);
  return active[0] || null;
}

function strongestSoyouKey() {
  const soyou = player.soyou || {};
  return SOYOU_KEYS.slice().sort((a, b) => (soyou[b] || 0) - (soyou[a] || 0))[0] || "passion";
}

function suggestedPlaysForSoyou(key, limit = 2) {
  return PLAYS
    .map((play) => ({ play, avail: isPlayAvailable(play), gain: normalizeGainToSoyou(play.gain || {}) }))
    .filter(({ avail, gain }) => !avail.isHidden && avail.ok && (gain[key] || 0) > 0)
    .sort((a, b) => (b.gain[key] || 0) - (a.gain[key] || 0))
    .slice(0, limit)
    .map(({ play }) => play);
}

/**
 * @screen S2
 * @spec docs/specs/SPEC-058-ui-design-prototypes.md §5
 * 毎日表示する「今日の焦点カード」。ミッションがある日は進行中目標、
 * ない日は今いちばん伸びている素養に関連する遊びを促す。
 */
function renderDailyFocusCard() {
  const card = byId("daily-focus-card");
  if (!card) return;
  const iconEl = byId("daily-focus-icon");
  const titleEl = byId("daily-focus-title");
  const bodyEl = byId("daily-focus-body");
  const chipsEl = byId("daily-focus-chips");

  const activeMission = activeAcceptedMissionWithProgress();
  if (activeMission) {
    const { mission, progress } = activeMission;
    const pct = Math.round(progress * 100);
    if (iconEl) iconEl.textContent = "🎯";
    if (titleEl) titleEl.textContent = mission.title;
    if (bodyEl) bodyEl.textContent = `${mission.subtitle || "いま進めている目標"}。いま ${pct}% くらい近づいているよ。`;
    if (chipsEl) {
      chipsEl.innerHTML = `<span class="daily-focus-chip is-goal">めあて</span><span class="daily-focus-chip">もうすぐ ${pct}%</span>`;
    }
    return;
  }

  const key = strongestSoyouKey();
  const meta = SOYOU_META[key] || SOYOU_META.passion;
  const suggestions = suggestedPlaysForSoyou(key);
  if (iconEl) iconEl.textContent = meta.icon;
  if (titleEl) titleEl.textContent = `今日は「${meta.label}」が育ちそう`;
  if (bodyEl) {
    bodyEl.textContent = suggestions.length > 0
      ? `${suggestions.map((p) => p.name).join("、")}で、今の「すき」をもう少し伸ばしてみよう。`
      : "気になる遊びをひとつ選んで、できることを増やしてみよう。";
  }
  if (chipsEl) {
    const chips = suggestions.length > 0
      ? suggestions.map((p) => `<button class="daily-focus-chip as-button" type="button" data-play-id="${escapeHtml(p.id)}">${p.icon} ${escapeHtml(p.name)}</button>`)
      : [`<span class="daily-focus-chip">すきな遊び</span>`];
    chipsEl.innerHTML = chips.join("");
  }
}

function dailyFocusPlayIds() {
  const chipsEl = byId("daily-focus-chips");
  if (!chipsEl) return new Set();
  return new Set(Array.from(chipsEl.querySelectorAll("[data-play-id]")).map((el) => el.dataset.playId));
}

function playBadgeLabel(play, avail, focusIds) {
  if (avail.isLowStamina) return "つかれる";
  if (focusIds && focusIds.has(play.id)) return "めあて";
  const count = (player._playCounts || {})[play.id] || 0;
  if (count >= 3) return "好き";
  if (count === 0) return "新しい";
  return "";
}

/**
 * @screen S17 きろく
 * @spec docs/specs/SPEC-058-ui-design-prototypes.md §6
 * SPEC-051 の本実装前に、幼少期向けの「きろく」導線を確認する簡易プロトタイプ。
 */
function renderRecordScreen() {
  const achievements = byId("record-achievements");
  const favorites = byId("record-favorites");
  const memories = byId("record-memories");

  if (achievements) {
    const titles = (player.titles || []).slice(-5).reverse();
    achievements.innerHTML = titles.length > 0
      ? titles.map((t) => `<li>🎀 ${escapeHtml(t.id)} <small>Day ${t.acquiredDay || t.awardedDay || player.day}</small></li>`).join("")
      : `<li>🌱 まだこれから。はじめての「できた」を待っているよ。</li>`;
  }

  if (favorites) {
    const counts = Object.entries(player._playCounts || {})
      .map(([id, count]) => ({ play: PLAYS.find((p) => p.id === id), count }))
      .filter((x) => x.play)
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);
    favorites.innerHTML = counts.length > 0
      ? counts.map(({ play, count }) => `<span class="record-favorite-pill">${play.icon} ${escapeHtml(play.name)} <b>${count}回</b></span>`).join("")
      : `<span class="record-empty">まだ、だいすきな遊びを探しているところ。</span>`;
  }

  if (memories) {
    const entries = [
      ...(player.renrakuchoHighlights || []).map((x) => ({ icon: "💬", text: x.text || x.body || "", day: x.day })),
      ...(player.memorableDays || []).map((x) => ({ icon: "📖", text: x.emotionText || x.type || "", day: x.day })),
    ].filter((x) => x.text).slice(0, 6);
    memories.innerHTML = entries.length > 0
      ? entries.map((x) => `<li>${x.icon} ${escapeHtml(x.text)} <small>Day ${x.day || player.day}</small></li>`).join("")
      : `<li>📖 今日の思い出が、ここにたまっていくよ。</li>`;
  }
}

/**
 * @spec SPEC-047 §7 §8 / SPEC-025 §7.1.3 起床時の場所解決。
 *   保育園期：親遣い抽選（平日/土日）で _parentalOutingToday を設定。
 *     - 家以外の場合は移動演出に入る前提で、location はまだ home のまま。
 *     - すぐに pushTravelFlow() で画面遷移を開始する。
 *   幼稚園以降は将来拡張。
 *
 *   【スキップ中の扱い（SPEC-025 §7.1.3 v2）】
 *     - _skipRemainingDays > 0 の間は親遣い抽選を一切行わない。location は home に固定。
 *     - これにより「週末までスキップ」「明日の夜までスキップ」中に移動演出で
 *       ループが止まる不具合を防止する。
 *     - ただしスキップの最終日（_skipRemainingDays が 0 になった朝）は通常通り抽選する。
 */
function maybeResolveMorningLocation() {
  player._parentalOutingToday = null;
  // スキップ継続中は場所イベントを発生させない（§7.1.3 v2）
  // 残り日数が 1 以上 or スキップ目標日まで到達していない間は家固定
  const skipping = (player._skipRemainingDays || 0) > 0;
  const beforeTarget = (player._skipTargetDay || 0) >= player.day;
  if (skipping || beforeTarget) {
    player.location = "home";
    return;
  }
  // 目標日を過ぎたら _skipTargetDay をクリア
  player._skipTargetDay = 0;
  const stage = resolveLifeStage(player.age);
  if (!stage || stage.id !== "nursery") {
    // 保育園期以外は、場所は home に固定（幼稚園以降で改修予定）
    player.location = "home";
    return;
  }
  // phase0 は初週の世界観演出を邪魔しない
  if (tutorialPhase(player.day) === "phase0") {
    player.location = "home";
    return;
  }
  const dow = fakeDateForDay(player.day).getUTCDay(); // 0=日, 6=土
  const weekend = (dow === 0 || dow === 6);
  const picked = weekend ? pickWeekendParentalOuting() : pickWeekdayParentalOuting();
  if (!picked || picked.id === "home") {
    player.location = "home";
    return;
  }
  // 家以外が選ばれた → 今日はそこに親が連れて行く
  player._parentalOutingToday = picked.id;
  player.location = "home";  // 移動前は家にいる状態
  // 解禁済みに追加（マップ画面で視認できるように）
  if (!player.unlockedLocations.includes(picked.id)) {
    player.unlockedLocations = [...player.unlockedLocations, picked.id];
  }
}

/**
 * @spec SPEC-047 §7.3 §7.4 移動開始（保育園期の親遣い移動）
 *   goChooseFromToday の代わりに、親遣いが発動していれば移動演出に遷移する。
 */
function maybeStartParentalOutingTravel() {
  const locId = player._parentalOutingToday;
  if (!locId) return false;
  const loc = LOCATIONS.find((l) => l.id === locId);
  if (!loc) return false;
  // 既にその場所に到着済みなら何もしない（再突入防止）
  if (player.location === locId) return false;
  // 移動演出へ
  startTravelAnimation(loc, /* isParental */ true);
  return true;
}

/** @spec SPEC-047 §7.3 移動演出画面（S15）を開始 */
function startTravelAnimation(targetLoc, isParental) {
  player._pendingTravelTarget = targetLoc.id;
  player._pendingTravelIsParental = !!isParental;
  renderTravelAnimation(targetLoc, isParental);
  showScreen("screen-travel");
  // 演出は 1.6 秒、その後自動的に移動結果画面へ
  if (_travelTimer) clearTimeout(_travelTimer);
  _travelTimer = setTimeout(() => {
    completeTravel(targetLoc, isParental);
  }, 1600);
}

let _travelTimer = null;

/** 移動完了：location を切り替えて移動結果画面（S16）へ */
function completeTravel(targetLoc, isParental) {
  // 時間を進める（travelTime 時間）
  const tt = targetLoc.travelTime || 0;
  if (tt > 0) {
    const h = Math.floor(tt);
    const m = Math.round((tt - h) * 60);
    player.clockHour += h;
    player.clockMinute += m;
    if (player.clockMinute >= 60) { player.clockHour += Math.floor(player.clockMinute / 60); player.clockMinute %= 60; }
    player.spareHours = Math.max(0, +(player.spareHours - tt).toFixed(2));
  }
  // 運賃（保育園期は親負担）
  if (!isParental && (targetLoc.travelFare || 0) > 0) {
    player.money = Math.max(0, player.money - targetLoc.travelFare);
  }
  // 現在地を更新
  player.location = targetLoc.id;
  if (!player.unlockedLocations.includes(targetLoc.id)) {
    player.unlockedLocations.push(targetLoc.id);
  }
  renderHUD();
  // @spec SPEC-050 §3 場所到着はミッションの発端/達成トリガになる
  try { onLocationEntered(targetLoc.id); } catch (e) { console.warn("[mission] onLocationEntered error", e); }
  // onLocationEntered で達成演出に飛んだ場合、screen-mission-modal が active になっているので
  // travel-result を重ねて表示してしまうと後から上書きされる。active 判定で切り分け。
  if (document.querySelector(".screen.active")?.id === "screen-mission-modal") return;
  renderTravelResult(targetLoc, isParental);
  showScreen("screen-travel-result");
}

/** @spec SPEC-047 §7.3 移動演出画面の描画 */
function renderTravelAnimation(targetLoc, isParental) {
  const root = byId("screen-travel");
  if (!root) return;
  byId("travel-icon").textContent = targetLoc.icon || "🚶";
  byId("travel-title").textContent = isParental
    ? `${targetLoc.icon} ${targetLoc.name}にむかっている…`
    : `🚶 ${targetLoc.name}に向かう…`;
  byId("travel-subtitle").textContent = isParental
    ? `おとうさん・おかあさんと一緒に（${Math.round(targetLoc.travelTime * 60)}分）`
    : `徒歩・交通機関で移動中（${Math.round(targetLoc.travelTime * 60)}分）`;
}

/** @spec SPEC-047 §7.3 移動結果画面の描画 */
function renderTravelResult(targetLoc, isParental) {
  byId("travel-result-icon").textContent = targetLoc.icon || "📍";
  byId("travel-result-title").textContent = `${targetLoc.name}に来た！`;
  byId("travel-result-desc").textContent = targetLoc.description || "";
  // fullday_trip の場合は「1日すごす」、通常は「遊ぶ」ボタン
  const btn = byId("btn-travel-result-next");
  if (targetLoc.category === "fullday_trip") {
    btn.textContent = `1日すごす`;
    btn.dataset.mode = "fullday";
    btn.dataset.locId = targetLoc.id;
  } else {
    btn.textContent = "遊ぶ";
    btn.dataset.mode = "choose";
    btn.dataset.locId = targetLoc.id;
  }
}

/** 「遊ぶ／1日すごす」ボタンクリック時の処理 */
function onTravelResultNext() {
  const btn = byId("btn-travel-result-next");
  const mode = btn.dataset.mode;
  const locId = btn.dataset.locId;
  const loc = LOCATIONS.find((l) => l.id === locId);
  if (!loc) { goChooseFromToday(); return; }
  if (mode === "fullday") {
    runFullDayEvent(loc);
  } else {
    // 通常場所：遊び選択画面へ
    renderChooseScreen();
    showScreen("screen-choose");
  }
}

/**
 * @spec SPEC-047 §7.4 土日祝の fullday_trip 発動：
 *   その場所の soyouGain を一括加算し、persistBuff を記録、直接 S10 に遷移する。
 */
function runFullDayEvent(targetLoc) {
  const buffs = targetLoc.specialBuffs || {};
  const gain = buffs.soyouGain || {};
  // 素養加算（旧キー自動変換）
  for (const [k, v] of Object.entries(normalizeGainToSoyou(gain))) {
    if (SOYOU_KEYS.includes(k)) {
      player.soyou[k] = (player.soyou[k] || 0) + v;
    }
  }
  // 日サマリのスナップショットに反映
  if (player._daySnapshot) {
    player._daySnapshot.playsById = player._daySnapshot.playsById || {};
    player._daySnapshot.playsById[`fullday_${targetLoc.id}`] = 1;
    player._daySnapshot.discoveries = player._daySnapshot.discoveries || [];
    player._daySnapshot.discoveries.push(`${targetLoc.icon} ${targetLoc.name}で 1 日過ごした`);
  }
  // 持続バフ
  if (buffs.persistBuff) {
    player.persistBuffs = player.persistBuffs || [];
    player.persistBuffs.push({
      type: "category",
      category: buffs.persistBuff.category,
      multiplier: buffs.persistBuff.multiplier || 1.0,
      untilDay: player.day + (buffs.persistBuff.durationDays || 30),
      sourceLocationId: targetLoc.id,
    });
  }
  // 時間は夕方まで一気に進める
  player.clockHour = 18;
  player.clockMinute = 0;
  player.spareHours = 0;
  player.location = "home"; // 帰宅
  toast(`${targetLoc.icon} ${targetLoc.name}で 1 日過ごした！`, 2400);
  // 日サマリへ
  renderDaySummary();
  showScreen("screen-day-summary");
}

function installSoyouAliases(p) {
  if (!p.soyou) {
    p.soyou = { body: 0, intellect: 0, sensitivity: 0, social: 0, passion: 0 };
  }
  // SOYOU_KEYS 各キーが欠けていたら 0 で埋める
  for (const k of ["body", "intellect", "sensitivity", "social", "passion"]) {
    if (typeof p.soyou[k] !== "number") p.soyou[k] = 0;
  }
  // exp は soyou の別名。プロパティアクセサで同じオブジェクトを返す
  Object.defineProperty(p, "exp", {
    configurable: true, enumerable: false,
    get() { return p.soyou; },
    set(v) { p.soyou = v || p.soyou; },
  });
  // passion は soyou.passion への getter/setter
  Object.defineProperty(p, "passion", {
    configurable: true, enumerable: false,
    get() { return p.soyou.passion || 0; },
    set(v) { p.soyou.passion = Math.max(0, Number(v) || 0); },
  });
  return p;
}
installSoyouAliases(player);

let pendingPlay = null;     // 進行中の遊び
let pendingGain = null;     // 予定している獲得値
let pendingEvent = null;    // 発火したイベント
let playRAF = null;         // requestAnimationFrame id
// @spec docs/specs/SPEC-003-play-execution.md §5.8a スキップ連打防止フラグ
// true のときのみ skipDescription() は有効に動作する。1回スキップされたら false にして以降の連打を無視。
let skipArmed = false;

// =========================================================================
// ユーティリティ
// =========================================================================
const byId = (id) => document.getElementById(id);
const $$ = (sel) => document.querySelectorAll(sel);

function showScreen(id) {
  $$(".screen").forEach((el) => el.classList.remove("active"));
  byId(id).classList.add("active");
  // @spec SPEC-029 §4.2 screen-playing 以外に遷移したら動画を停止＆解放
  if (id !== "screen-playing") {
    hidePlayVideo();
  }
  // @spec SPEC-030 §4.4 / SPEC-031 §6.4 タイトル・転生イントロ中は HUD を隠す
  const hud = byId("hud");
  if (hud) {
    hud.hidden = (id === "screen-title" || id === "screen-isekai");
  }
}

/**
 * @spec SPEC-029 §5.2 遊び中ムービーの再生
 * data/videos/{playId}.mp4 が存在すれば再生、無ければフォールバック。
 */
async function tryPlayIntroVideo(playId) {
  const wrap = byId("play-video");
  const vid  = byId("play-video-el");
  const anim = byId("playing-icon");
  if (!wrap || !vid) return false;
  // 念のためリセット
  wrap.hidden = true;
  if (anim) anim.hidden = false;
  const path = `data/videos/${playId}.mp4`;
  try {
    const res = await fetch(path, { method: "HEAD" });
    if (!res.ok) return false;
  } catch (e) {
    return false;
  }
  try {
    vid.src = path;
    wrap.hidden = false;
    if (anim) anim.hidden = true;
    // autoplay。iOS 対策で muted + playsinline は属性済み
    const p = vid.play();
    if (p && typeof p.catch === "function") p.catch(() => { /* 無視 */ });
    return true;
  } catch (e) {
    wrap.hidden = true;
    if (anim) anim.hidden = false;
    return false;
  }
}

/**
 * @spec SPEC-029 §5.2 動画を停止してリソースを解放
 */
function hidePlayVideo() {
  const wrap = byId("play-video");
  const vid  = byId("play-video-el");
  const anim = byId("playing-icon");
  if (!wrap) return;
  wrap.hidden = true;
  if (anim) anim.hidden = false;
  if (vid) {
    try { vid.pause(); } catch (e) {}
    if (vid.getAttribute("src")) {
      vid.removeAttribute("src");
      try { vid.load(); } catch (e) {}
    }
  }
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

/**
 * @spec docs/specs/SPEC-024-skill.md §5.2
 * スキルLv を計算。1〜100 クランプ。
 * exp=0 → Lv1, exp=10 → Lv2, exp=40 → Lv3, ..., exp=98010 → Lv99, exp>=100000 → Lv100
 */
function skillLvFromExp(exp) {
  const lv = Math.floor(Math.sqrt(Math.max(0, exp) / 10)) + 1;
  return Math.min(100, Math.max(1, lv));
}

/**
 * @spec docs/specs/SPEC-024-skill.md §5.7
 * スキル状態を遅延初期化して返す（無ければ {exp:0, lv:1} を作る）。
 */
function ensureSkill(catId) {
  if (!player.skills[catId]) player.skills[catId] = { exp: 0, lv: 1 };
  return player.skills[catId];
}

/**
 * @spec docs/specs/SPEC-024-skill.md §5.4
 * 遊びの各カテゴリの所持スキルLv 平均から熟練ブースト係数を返す。
 * Lv1 平均 → 1.00、Lv51 以上 → 上限 2.00。
 */
function skillBoostMultiplier(play) {
  const cats = play.categories || [];
  if (cats.length === 0) return 1.0;
  let sum = 0;
  for (const c of cats) {
    const s = player.skills[c];
    sum += s ? s.lv : 1;
  }
  const avg = sum / cats.length;
  return Math.min(2.0, 1 + (avg - 1) * 0.02);
}

/**
 * @spec docs/specs/SPEC-002-play-selection.md §5.9 低体力プレイ
 * 体力不足で遊ぶ場合の経験値倍率（0〜1）。通常プレイは 1。
 */
/**
 * @spec SPEC-002 §5.9 低体力・低時間プレイの倍率（v2）
 * 体力・時間それぞれの充足率を計算し、min を返す（不足している方に従う）。
 *   fullstamina + fulltime → 1.0
 *   体力 50%  + 時間 100% → 0.5
 *   体力 100% + 時間 25%  → 0.25
 *   体力 50%  + 時間 25%  → 0.25
 */
function lowStaminaMultiplier(play) {
  const staminaCost = play.staminaCost || 0;
  const timeCost    = play.timeCost    || 0;
  const staminaMult = staminaCost > 0
    ? Math.min(1.0, Math.max(0, player.stamina / staminaCost))
    : 1.0;
  const timeMult = timeCost > 0
    ? Math.min(1.0, Math.max(0, player.spareHours / timeCost))
    : 1.0;
  return Math.min(staminaMult, timeMult);
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
 * @spec docs/specs/SPEC-021-parameter-gauge-ui.md §5.1.2 体力は起動時に 100% 表示
 * @spec docs/specs/SPEC-021-parameter-gauge-ui.md §5.2 時計円盤で現在時刻を表示
 * 共通HUDの描画。全画面共通。
 */
/**
 * @spec SPEC-034 §4.3 リズム 5 段階の判定
 * @spec SPEC-001 §4 幼少期（age ≤ 6）は「絶好調」固定
 */
function resolveRhythm() {
  if ((player.age || 0) <= 6) {
    return { icon: "🤩", label: "絶好調", key: "best" };
  }
  const r = Math.max(0, Math.min(100, player.bioRhythm || 0));
  if (r <= 20) return { icon: "😵", label: "絶不調", key: "worst" };
  if (r <= 40) return { icon: "😞", label: "不調",   key: "bad"   };
  if (r <= 60) return { icon: "😐", label: "普通",   key: "mid"   };
  if (r <= 80) return { icon: "😊", label: "好調",   key: "good"  };
  return              { icon: "🤩", label: "絶好調", key: "best"  };
}

/**
 * @spec SPEC-034 §4.2 ライフステージ表示用のラベル（N 年目）
 *   保育園: age-1（1歳で1年目、4歳で4年目）
 *   以降、小学校以降はライフステージ内の最小年齢からのオフセット
 */
function stageProgressLabel(stage) {
  if (!stage) return "";
  const y = Math.max(1, (player.age || stage.ageMin || 1) - (stage.ageMin || 1) + 1);
  return `${stage.label}${y}年目`;
}

/**
 * @spec SPEC-034 §4 新 HUD（3 エリア）
 */
function renderHUD() {
  // 左：ライフステージ
  const stage = resolveLifeStage(player.age);
  const stageNameEl = byId("hud-stage-name");
  if (stageNameEl) stageNameEl.textContent = stageProgressLabel(stage);
  const ageChip = byId("hud-age-chip");
  if (ageChip) ageChip.textContent = `${player.age}歳`;

  // 中央：日付・リズム・体力
  byId("hud-date").textContent = formatFullDate(player.day);
  const rhythm = resolveRhythm();
  const rIconEl = byId("hud-rhythm-icon");
  const rLabelEl = byId("hud-rhythm-label");
  if (rIconEl)  rIconEl.textContent  = rhythm.icon;
  if (rLabelEl) rLabelEl.textContent = rhythm.label;

  const staminaEl = byId("hud-stamina");
  const staminaCapEl = byId("hud-stamina-cap");
  if (staminaEl)    staminaEl.textContent    = Math.max(0, Math.floor(player.stamina));
  if (staminaCapEl) staminaCapEl.textContent = Math.floor(player.staminaCap || 0);

  const cap = Math.max(1, player.staminaCap || 1);
  const curPct = Math.max(0, Math.min(100, (player.stamina / cap) * 100));
  const fillEl = byId("hud-stamina-bar-fill");
  if (fillEl) fillEl.style.width = curPct + "%";
  // ゴーストプレビューは selectPlay で上書き。ここではクリア
  const ghostEl = byId("hud-stamina-bar-ghost");
  if (ghostEl) ghostEl.style.width = "0%";

  // 右：所持金・友人・情熱
  const moneyRow = byId("hud-money-row");
  const hideMoney = (player.age || 0) <= 6;
  if (moneyRow) moneyRow.classList.toggle("is-hidden", hideMoney);
  const moneyEl = byId("hud-money");
  if (moneyEl) moneyEl.textContent = player.money;
  const hoursEl = byId("hud-hours");
  if (hoursEl) hoursEl.textContent = Math.max(0, player.spareHours).toFixed(1).replace(".0", "");
  const friendsEl = byId("hud-friends");
  if (friendsEl) friendsEl.textContent = player.friends;
  const passionEl = byId("hud-passion");
  if (passionEl) passionEl.textContent = Math.floor(player.soyou.passion || 0);
  const passionGradeEl = byId("hud-passion-grade");
  if (passionGradeEl) {
    const g = soyouGrade(player.soyou.passion);
    passionGradeEl.textContent = g;
    passionGradeEl.className = "grade-" + g;
  }
  // @spec SPEC-047 §6 HUD 右エリアに場所表示（情熱表示は素養カードに内包されているので廃止）
  const locEl = byId("hud-location");
  if (locEl) {
    const loc = currentLocation();
    locEl.innerHTML = `${loc.icon || "📍"} <span>${loc.shortName || loc.name}</span>`;
  }
}

/**
 * @spec SPEC-034 §5.2 素養カード 5 枚を描画
 * preview（プレビュー中の加算量）が渡されたら (+N) とグレードアップを重ねて表示する。
 */
function renderSoyouList(preview) {
  const host = byId("soyou-list");
  if (!host) return;
  const cur = player.soyou || {};
  host.innerHTML = "";
  for (const key of SOYOU_KEYS) {
    const meta = SOYOU_META[key];
    const value = Math.floor(cur[key] || 0);
    const grade = soyouGrade(value);
    const deltaRaw = preview && preview[key] ? Math.max(0, Math.round(preview[key])) : 0;
    const afterValue = value + deltaRaw;
    const afterGrade = soyouGrade(afterValue);
    const gradeUp = deltaRaw > 0 && afterGrade !== grade;
    const row = document.createElement("div");
    row.className = "soyou-row"
      + (deltaRaw > 0 ? " has-delta" : "")
      + (gradeUp ? " grade-up" : "");
    const valueHtml = deltaRaw > 0
      ? `${value}<span class="soyou-value-arrow">→</span><span class="soyou-value-after">${afterValue}</span>`
      : `${value}`;
    const deltaHtml = deltaRaw > 0 ? `<span class="soyou-delta">+${deltaRaw}</span>` : `<span class="soyou-delta"></span>`;
    row.innerHTML = `
      <div class="soyou-icon">${meta.icon}</div>
      <div class="soyou-label">${meta.label}</div>
      <div class="soyou-grade grade-${gradeUp ? afterGrade : grade}">${gradeUp ? (grade + "→" + afterGrade) : grade}</div>
      ${deltaHtml}
      <div class="soyou-value">${valueHtml}</div>
    `;
    host.appendChild(row);
  }
}

/**
 * @spec SPEC-035 §5.4 素養グレードの進捗帯（次グレードまでの % と閾値）
 */
const GRADE_THRESHOLDS = [0, 20, 40, 66, 80, 110, 140, Infinity];
function progressToNextGrade(value) {
  const v = Math.max(0, Math.floor(value || 0));
  for (let i = 1; i < GRADE_THRESHOLDS.length; i++) {
    if (v < GRADE_THRESHOLDS[i]) {
      const prev = GRADE_THRESHOLDS[i - 1];
      const span = GRADE_THRESHOLDS[i] - prev;
      if (!isFinite(span)) return { pct: 100, nextAt: null };
      return { pct: Math.min(100, ((v - prev) / span) * 100), nextAt: GRADE_THRESHOLDS[i] };
    }
  }
  return { pct: 100, nextAt: null };
}

/**
 * @spec SPEC-035 §5 結果画面用の素養リスト描画
 * host: 描画先 DOM
 * before: 前の素養値（{key: num}）
 * after:  現在の素養値（省略時は player.soyou）
 *   差分ありの素養のみ表示。グレードアップ時はカード全体を金色発光。
 */
function renderSoyouResultList(host, before, after) {
  if (!host) return;
  const b = before || {};
  const a = after  || (player.soyou || {});
  host.innerHTML = "";
  let anyShown = false;
  for (const key of SOYOU_KEYS) {
    const bv = Math.floor(b[key] || 0);
    const av = Math.floor(a[key] || 0);
    const delta = av - bv;
    if (delta <= 0) continue;  // 差分のない素養は出さない
    anyShown = true;
    const meta = SOYOU_META[key];
    const beforeGrade = soyouGrade(bv);
    const afterGrade  = soyouGrade(av);
    const gradeUp = beforeGrade !== afterGrade;
    const prog = progressToNextGrade(av);
    const row = document.createElement("div");
    row.className = "soyou-row has-delta" + (gradeUp ? " grade-up" : "");
    row.innerHTML = `
      <div class="soyou-icon">${meta.icon}</div>
      <div class="soyou-label">${meta.label}</div>
      <div class="soyou-grade grade-${gradeUp ? afterGrade : beforeGrade}">${gradeUp ? (beforeGrade + "→" + afterGrade) : afterGrade}</div>
      <span class="soyou-delta">+${delta}</span>
      <div class="soyou-value">${bv}<span class="soyou-value-arrow">→</span><span class="soyou-value-after">${av}</span></div>
      <div class="grade-progress"><div class="grade-progress-fill" style="width:0%"></div></div>
    `;
    host.appendChild(row);
    // 進捗帯アニメ：次フレームで 0% → prog.pct% に
    const fill = row.querySelector(".grade-progress-fill");
    if (fill) {
      requestAnimationFrame(() => {
        fill.style.width = prog.pct + "%";
      });
    }
  }
  // 表示対象ゼロのときはカード自体を隠すため、上位で制御
  host.dataset.hasAny = anyShown ? "1" : "0";
}

/**
 * @spec SPEC-035 §6 スキル 1 行描画
 * cats: この遊びに紐づくカテゴリ配列。skillBefore: {catId: {lv, exp}} 前スナップショット
 * host: ul 要素
 * 戻り値: 描画した行数（0 なら呼び出し側でカードを隠す）
 */
function renderSkillLines(host, cats, skillBefore) {
  if (!host) return 0;
  host.innerHTML = "";
  let rows = 0;
  for (const c of (cats || [])) {
    const sAfter = player.skills[c];
    const sBefore = skillBefore && skillBefore[c];
    if (!sAfter) continue;
    const afterLv = sAfter.lv || 1;
    const beforeLv = sBefore ? sBefore.lv || 1 : (sBefore === undefined ? null : 1);
    const afterExp = sAfter.exp || 0;
    const beforeExp = sBefore ? sBefore.exp || 0 : 0;
    // 差分が無ければスキップ
    if (sBefore && sBefore.exp === afterExp && sBefore.lv === afterLv) continue;
    rows += 1;
    const isNew = !sBefore;  // before に無かった＝新規獲得
    const label = (CATEGORIES[c] && CATEGORIES[c].label) || c;
    const afterPct = boostPctFromLv(afterLv);
    const beforePct = beforeLv ? boostPctFromLv(beforeLv) : 0;
    const lvUp = beforeLv && afterLv > beforeLv;
    const li = document.createElement("li");
    li.className = "skill-line" + (isNew ? " is-new" : "");
    const lvHtml = isNew
      ? `Lv.<b>${afterLv}</b>`
      : (lvUp ? `Lv.<b>${beforeLv}</b><span class="lv-arrow">→</span><b>${afterLv}</b>` : `Lv.<b>${afterLv}</b>`);
    const pctHtml = lvUp
      ? `<b>${beforePct}%</b><span class="pct-arrow">→</span><b>${afterPct}%</b>`
      : `<b>${afterPct}%</b>`;
    li.innerHTML = `
      <span class="skill-line-name">${label}</span>
      <span class="skill-line-lv">${lvHtml}</span>
      <span class="skill-line-effect">「${label}」で遊ぶ時の経験値を ${pctHtml} UP</span>
    `;
    host.appendChild(li);
  }
  return rows;
}

/**
 * @spec SPEC-035 §6.1 スキル Lv から単体ブースト % を算出
 *   skillBoostMultiplier はプレイのカテゴリ配列の avg Lv から倍率を返すが、
 *   ここではスキル 1 個の寄与の目安として Lv-1 の 2% として表示する（100% キャップ）。
 */
function boostPctFromLv(lv) {
  const n = Math.max(1, Math.floor(lv || 1));
  return Math.min(100, (n - 1) * 2);
}

/**
 * @spec SPEC-035 §7.2 §7.3 遊びピル列描画
 * playsById: {playId: count}
 */
function renderPlayPills(host, playsById) {
  if (!host) return;
  host.innerHTML = "";
  const entries = Object.entries(playsById || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 8);
  if (entries.length === 0) {
    host.innerHTML = `<span class="play-pill empty">（何もしなかった）</span>`;
    return;
  }
  for (const [id, count] of entries) {
    const p = PLAYS.find((x) => x.id === id);
    if (!p) continue;
    const pill = document.createElement("span");
    pill.className = "play-pill";
    pill.title = p.name;
    pill.innerHTML = `<span class="play-pill-icon">${p.icon}</span><span>${p.name}</span><span class="play-pill-count">×${count}</span>`;
    host.appendChild(pill);
  }
}

/**
 * @spec SPEC-034 §5.3 ヘッダー体力ゲージのゴーストプレビュー
 * cost が 0 以上のときに右から半透明の赤を重ねる。
 */
function setStaminaGhostPreview(cost) {
  const ghost = byId("hud-stamina-bar-ghost");
  if (!ghost) return;
  const cap = Math.max(1, player.staminaCap || 1);
  const c = Math.max(0, Math.min(player.stamina, Number(cost) || 0));
  const pct = Math.max(0, Math.min(100, (c / cap) * 100));
  ghost.style.width = pct + "%";
}

/**
 * @spec SPEC-034 §5.3 残り時間プレビュー
 *   選択中の遊びの timeCost を反映して「あと (spare - timeCost) 時間」を予告表示する。
 */
function setHoursGhostPreview(costHours) {
  const el = byId("hud-hours");
  if (!el) return;
  const base = Math.max(0, player.spareHours);
  if (!costHours) {
    el.textContent = base.toFixed(1).replace(".0", "");
    el.classList.remove("ghost-decrease");
    return;
  }
  const after = Math.max(0, base - costHours);
  el.textContent = `${base.toFixed(1).replace(".0","")}→${after.toFixed(1).replace(".0","")}`;
  el.classList.add("ghost-decrease");
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
 * @spec docs/specs/SPEC-021-parameter-gauge-ui.md §5.4a 差分ハイライト付きゲージ
 *
 * 「元の経験値までの base 部分（オレンジ）」の上に「今回増えた分の delta（緑）」を
 * アニメーションで伸ばすゲージを描画する。
 *
 * opts:
 *   label           : ゲージ左ラベル
 *   beforeExp       : 変化前の累計経験値
 *   afterExp        : 変化後の累計経験値
 *   lv              : 現在（after 時点）のLv
 *   lvUp            : Lvアップしたか
 *   lvFn            : 経験値→Lvに使った関数（ブートストラップ用、省略可能）
 *   kind            : 'exp' | 'skill'（色調整用）
 *
 *  Lvごとの exp 区間は `baseAtLv(lv) = lv * lv * 10`（原体験）または
 *  `(lv-1) * (lv-1) * 10`（スキル、Lv=1 開始）で計算する。本関数は
 *  呼び出し側に `lvFn` を渡せるようにして、両方の曲線に対応する。
 */
function renderGaugeWithDelta(container, opts) {
  if (!container) return;
  const {
    label,
    beforeExp,
    afterExp,
    lv,
    lvUp = false,
    kind = "exp",
    // Lvから「そのLvに到達するための累計 exp 下限」を返す関数
    lvBaseExp = (l) => l * l * 10,
  } = opts;

  // 現在Lv（after 時点）の区間
  const curBase = lvBaseExp(lv);
  const nextBase = lvBaseExp(lv + 1);
  const range = Math.max(1, nextBase - curBase);

  // 新Lv 区間内の afterPct（余剰分）。Lv100 など上限時は 100%
  const afterPct = Math.max(0, Math.min(100, ((afterExp - curBase) / range) * 100));

  container.classList.add("gauge", "gauge-with-delta");
  if (lvUp) container.classList.add("lv-up");

  const gainedExp = afterExp - beforeExp;
  const lvUpTag = lvUp ? " ⬆ Lv UP!" : "";

  if (!lvUp) {
    // === (a) 通常プレイ：現Lv 区間内で base から delta を伸ばす ===
    const basePct = Math.max(0, Math.min(100, ((beforeExp - curBase) / range) * 100));
    const deltaPct = Math.max(0, afterPct - basePct);
    const displayValue = `${afterExp - curBase}/${range}`;

    container.innerHTML = `
      <div class="gauge-track">
        <div class="gauge-bar-base" style="width:${basePct}%"></div>
        <div class="gauge-bar-delta" style="left:${basePct}%; width:0%"></div>
      </div>
      <div class="gauge-label">
        <span>${label} Lv${lv}${lvUpTag}</span>
        <b>${displayValue}<span class="delta">+${gainedExp}</span></b>
      </div>
    `;
    const deltaEl = container.querySelector(".gauge-bar-delta");
    if (deltaEl) {
      requestAnimationFrame(() => {
        requestAnimationFrame(() => { deltaEl.style.width = deltaPct + "%"; });
      });
    }
    return;
  }

  // === (b) Lvアップ時：フェーズA 満タン → フェーズB リセット → フェーズC 新Lv 余剰 ===
  // @spec SPEC-021 §5.4a.2 (b)
  const prevLv = lv - 1;
  const prevBase = lvBaseExp(prevLv);
  const prevRange = Math.max(1, curBase - prevBase);
  const prevBasePct = Math.max(0, Math.min(100, ((beforeExp - prevBase) / prevRange) * 100));
  const overflowPct = afterPct;  // 新Lv 区間内の余剰

  const displayValueAfter = `${afterExp - curBase}/${range}`;

  // 最初は「前Lv の状態」を表示
  container.innerHTML = `
    <div class="gauge-track">
      <div class="gauge-bar-base" style="width:${prevBasePct}%"></div>
      <div class="gauge-bar-delta" style="left:${prevBasePct}%; width:0%"></div>
    </div>
    <div class="gauge-label">
      <span>${label} Lv${prevLv}</span>
      <b><span class="delta">+${gainedExp}</span></b>
    </div>
  `;

  const deltaEl = container.querySelector(".gauge-bar-delta");
  const baseEl  = container.querySelector(".gauge-bar-base");
  const labelSpan = container.querySelector(".gauge-label span");
  const labelBold = container.querySelector(".gauge-label b");

  // フェーズA：次フレームで delta を右端まで伸ばす（満タンアニメ 600ms）
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      if (deltaEl) deltaEl.style.width = (100 - prevBasePct) + "%";
    });
  });

  // フェーズB：700ms後に 0% リセット + 新Lv ラベルへ
  setTimeout(() => {
    if (!container.isConnected) return;
    if (baseEl)  baseEl.style.width = "0%";
    if (deltaEl) {
      // transition を一瞬切ってから値を 0 にリセット（手前に戻らないようにするため）
      deltaEl.style.transition = "none";
      deltaEl.style.left = "0%";
      deltaEl.style.width = "0%";
      // 次フレームで transition を戻す
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          deltaEl.style.transition = "";
          // フェーズC：新Lv 余剰分を伸ばす
          deltaEl.style.width = overflowPct + "%";
        });
      });
    }
    if (labelSpan) labelSpan.textContent = `${label} Lv${lv}${lvUpTag}`;
    if (labelBold) {
      labelBold.innerHTML = `${displayValueAfter}<span class="delta">+${gainedExp}</span>`;
    }
  }, 700);
}

/**
 * @spec docs/specs/SPEC-021-parameter-gauge-ui.md §5.2 起床画面のゲージ
 */
function renderWakeupGauges() {
  const root = byId("wu-gauges");
  if (!root) return;
  root.innerHTML = `
    <div class="clock-dial clock-dial-lg" id="wu-clock">
      <svg viewBox="0 0 100 100" class="dial-svg">
        <circle cx="50" cy="50" r="46" class="dial-ring"/>
        <path class="dial-band dial-band-free" d="" fill-rule="evenodd"/>
        <g class="dial-bands-sleep"></g>
        <g class="dial-bands-core"></g>
        <path class="dial-fill" d="" fill-rule="evenodd"/>
        <text x="50" y="48" class="dial-time" text-anchor="middle">--</text>
        <text x="50" y="68" class="dial-sub"  text-anchor="middle">--</text>
      </svg>
    </div>
    <div class="gauge" id="wu-g-stamina"></div>
    <div class="gauge" id="wu-g-rhythm"></div>
  `;
  renderClockDial(byId("wu-clock"), {
    clockHour: player.clockHour,
    clockMinute: player.clockMinute,
    spareHours: player.spareHours,
    showText: true,
    showSub: true,
  });
  renderGauge(byId("wu-g-stamina"), { current: player.stamina, max: player.staminaCap, label: "❤️ 体力", kind: "stamina" });
  renderGauge(byId("wu-g-rhythm"),  { current: player.bioRhythm, max: 100, label: "🌙 生活リズム", kind: "stamina" });
}

/**
 * @spec docs/specs/SPEC-021-parameter-gauge-ui.md §5.2.4
 * 時刻(0〜24) から「中心→真上→時計回りに time 分の扇形」の SVG path を作る。
 *  - 中心：(cx, cy) = (50, 50)
 *  - 半径：r = 46（外枠と同じ）
 *  - 真上 (-90度) を 0時、時計回りに 24h で 1周。
 */
function clockDialPath(time24) {
  return clockArcPath(0, Math.max(0, Math.min(24, time24)));
}

/**
 * @spec docs/specs/SPEC-021-parameter-gauge-ui.md §5.2.5
 * 開始時刻 t1 → 終了時刻 t2（いずれも 0-24）の弧で扇形を描く。
 */
function clockArcPath(t1, t2) {
  const cx = 50, cy = 50, r = 46;
  if (t2 <= t1) return "";
  if (t1 <= 0 && t2 >= 24) {
    return `M ${cx} ${cy - r} A ${r} ${r} 0 1 1 ${cx - 0.01} ${cy - r} Z`;
  }
  const a1 = (t1 / 24) * 2 * Math.PI - Math.PI / 2;
  const a2 = (t2 / 24) * 2 * Math.PI - Math.PI / 2;
  const x1 = cx + r * Math.cos(a1);
  const y1 = cy + r * Math.sin(a1);
  const x2 = cx + r * Math.cos(a2);
  const y2 = cy + r * Math.sin(a2);
  const largeArc = (t2 - t1) > 12 ? 1 : 0;
  return `M ${cx} ${cy} L ${x1.toFixed(3)} ${y1.toFixed(3)} A ${r} ${r} 0 ${largeArc} 1 ${x2.toFixed(3)} ${y2.toFixed(3)} Z`;
}

/**
 * @spec docs/specs/SPEC-021-parameter-gauge-ui.md §5.2.5 3 レイヤー帯
 * プレイヤーの年齢・固定スケジュール・ライフステージから、
 * 時計円盤に描くべき Sleep / Core の区間リストを返す。
 */
function computeDialBands() {
  const sched = getFixedSchedule(player.age);
  const stage = resolveLifeStage(player.age);
  const coreTime = stage ? stage.coreTime : null;

  // Sleep 帯：固定スケジュールがあれば [0, wakeHour] と [sleepHour, 24]
  //   10歳以上は暫定値（0-6, 23-24）を置く
  const sleepBands = [];
  if (sched) {
    if (sched.wakeHour > 0) sleepBands.push([0, sched.wakeHour]);
    if (sched.sleepHour < 24) sleepBands.push([sched.sleepHour, 24]);
  } else {
    sleepBands.push([0, 6], [23, 24]);
  }

  // Core 帯：コアタイムがあれば [start, end]
  const coreBands = [];
  if (coreTime) coreBands.push([coreTime.startHour, coreTime.endHour]);

  return { sleepBands, coreBands };
}

/**
 * @spec docs/specs/SPEC-021-parameter-gauge-ui.md §5.2 時計円盤の描画
 * SVG の path.d と text を更新する。
 *
 * options:
 *   clockHour, clockMinute : 現在時刻（0-24, 0-59）
 *   spareHours             : 残り余剰時間（h）
 *   showText               : 中心の時刻テキストを表示するか
 *   showSub                : 中心下の「残り Xh」テキストを表示するか
 */
function renderClockDial(container, opts) {
  if (!container) return;
  const { clockHour = 0, clockMinute = 0, spareHours, showText = true, showSub = false } = opts || {};
  const t = clockHour + clockMinute / 60;

  // @spec SPEC-021 §5.2.5 Free 全体背景（内円全部）
  const bandFree = container.querySelector(".dial-band-free");
  if (bandFree) bandFree.setAttribute("d", clockArcPath(0, 24));

  // @spec SPEC-021 §5.2.5 Sleep / Core 帯
  const bands = computeDialBands();
  const setBands = (selector, segments, className) => {
    const group = container.querySelector(selector);
    if (!group) return;
    group.innerHTML = segments.map(([t1, t2]) =>
      `<path class="dial-band ${className}" d="${clockArcPath(t1, t2)}" fill-rule="evenodd"/>`
    ).join("");
  };
  setBands(".dial-bands-sleep", bands.sleepBands, "dial-band-sleep");
  setBands(".dial-bands-core",  bands.coreBands,  "dial-band-core");

  // 経過塗り（現在時刻まで）
  const path = container.querySelector(".dial-fill");
  if (path) path.setAttribute("d", clockDialPath(t));

  // テキスト
  const timeEl = container.querySelector(".dial-time");
  if (timeEl) {
    if (showText) {
      timeEl.textContent = fmtTime(clockHour, clockMinute);
      timeEl.style.display = "";
    } else {
      timeEl.style.display = "none";
    }
  }
  const subEl = container.querySelector(".dial-sub");
  if (subEl) {
    if (showSub && spareHours !== undefined) {
      const s = Number(spareHours).toFixed(1).replace(".0", "");
      subEl.textContent = `残り ${s}h`;
      subEl.style.display = "";
    } else {
      subEl.style.display = "none";
    }
  }
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
  // @spec SPEC-026 §5.2 Phase 0 は保育園コアタイムを休業（null 返し）
  if (tutorialPhase(player.day) === "phase0") return null;
  const stage = resolveLifeStage(age);
  return stage ? stage.coreTime : null;
}

/**
 * @spec docs/specs/SPEC-026-tutorial.md §5.1
 * 現在のチュートリアル段階を返す。
 *   phase0: Day 1〜7 初週（保育園休業・遊び段階解禁）
 *   phase1: Day 8〜14 2週目（保育園再開・発見イベント解禁）
 *   phase2: Day 15〜   本編（スキップ解禁）
 */
function tutorialPhase(day) {
  if (day <= 7)  return "phase0";
  if (day <= 14) return "phase1";
  return "phase2";
}

/**
 * @spec SPEC-026 §5.5 スキップ機能は phase2 以降のみ解禁
 */
function isSkipUnlocked() {
  return tutorialPhase(player.day) === "phase2";
}

/**
 * @spec SPEC-026 §5.2 現時点のコアタイムを返す。
 * Phase 0（初週）は保育園休業のため null を返す。
 */
function getActiveCoreTime() {
  if (tutorialPhase(player.day) === "phase0") return null;
  const stage = resolveLifeStage(player.age);
  return stage ? stage.coreTime : null;
}

/**
 * @spec SPEC-026 §5.2.1 チュートリアル発見（段階解禁）
 * ある play.id を初めて完了したとき、その play をトリガーとする tutorial_phase0 イベントを
 * 必ず 1 回発火し、対応する遊びを解禁する。
 * @returns {Array<{icon,title,body}>} 介入モーダル用の通知リスト（空配列もあり）
 */
function checkTutorialDiscoveries(playId) {
  if (tutorialPhase(player.day) !== "phase0") return [];
  const fired = player.discoveredIds || [];
  const results = [];
  for (const ev of TUTORIAL_DISCOVERIES || []) {
    if (ev.triggerPlayId !== playId) continue;
    if (fired.includes(ev.id)) continue;
    // 発火
    player.discoveredIds.push(ev.id);
    if (ev.unlockPlayId && !player.unlockedPlays.includes(ev.unlockPlayId)) {
      player.unlockedPlays.push(ev.unlockPlayId);
    }
    // 効果反映（effect は軽微な exp）。SPEC-033 §5 旧キー自動変換
    for (const [k, v] of Object.entries(normalizeGainToSoyou(ev.gain || {}))) {
      if (SOYOU_KEYS.includes(k)) {
        player.soyou[k] = (player.soyou[k] || 0) + v;
      }
    }
    const unlocked = PLAYS.find((p) => p.id === ev.unlockPlayId);
    results.push({
      icon: ev.icon || "✨",
      title: "あたらしい遊びを見つけた！",
      body: `${ev.text}${unlocked ? `\n\n${unlocked.icon} ${unlocked.name} が遊べるようになったよ。` : ""}`,
    });
  }
  return results;
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
/**
 * @screen S2 統合起床ヘッダー（full モード）
 * @spec docs/specs/SPEC-002-play-selection.md §1.1, §5.2.1
 * @spec docs/specs/SPEC-020-fixed-sleep-cycle.md 低年齢の起床時刻表示
 * @spec docs/specs/SPEC-021-parameter-gauge-ui.md ゲージ表示
 *
 * 朝一番（その日最初の S2）で呼ばれる。時計円盤・体力ゲージ・挨拶を表示。
 */
function renderWakeupFull() {
  byId("wu-subtitle").textContent =
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
  byId("wu-msg").textContent = msg;
  byId("wu-art").textContent = player.bioRhythm >= 60 ? "🌅" : "😵‍💫";

  renderWakeupGauges();
}

/**
 * @screen S2 統合起床ヘッダー（compact モード）
 * @spec docs/specs/SPEC-002-play-selection.md §5.2.1
 * コアタイム後の夜の遊びなど、2回目以降の S2 表示で使う小さな帯。
 */
function renderWakeupCompact() {
  renderClockDial(byId("wu-compact-dial"), {
    clockHour: player.clockHour,
    clockMinute: player.clockMinute,
    showText: true,
  });
  const msg = player.coreTimeDoneToday
    ? "おかえり！夜の遊びを選ぼう"
    : "次の遊びを選んでね";
  byId("wu-compact-msg").textContent = msg;
}

/**
 * @screen S2 統合起床ヘッダー全体を描画する
 * @spec docs/specs/SPEC-002-play-selection.md §5.2.1
 * 朝一（dailyPlays===0 && !coreTimeDoneToday）なら full、それ以外は compact。
 */
function renderWakeupHeader() {
  const isMorning = (!player.coreTimeDoneToday && player.dailyPlays === 0);
  byId("wu-full").hidden = !isMorning;
  byId("wu-compact").hidden = isMorning;
  byId("choose-prompt").textContent = isMorning
    ? "何して遊ぶ？（朝の時間）"
    : (player.coreTimeDoneToday ? "何して遊ぶ？（夜の時間）" : "何して遊ぶ？");
  if (isMorning) renderWakeupFull();
  else           renderWakeupCompact();
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
/**
 * @spec docs/specs/SPEC-002-play-selection.md §5.1 v3 絞り込みルール
 *
 * 戻り値 { ok, reasons, isHidden, isLowStamina }
 *   ok           : true ならドックの「遊ぶ」ボタンが有効
 *   reasons      : ロック理由の文字列配列（非空ならロック中 or 体力不足）
 *   isHidden     : true ならドック自体に表示しない（体力不足を除く全ロック条件）
 *   isLowStamina : true なら体力不足だが遊べる（低体力プレイ SPEC-002 §5.9）
 */
function isPlayAvailable(play) {
  // @spec SPEC-026 §5.2 Phase 0 は段階解禁：絵本を既定で解禁、それ以外は player.unlockedPlays に含まれていなければ非表示
  if (tutorialPhase(player.day) === "phase0") {
    const PHASE0_INITIAL = new Set(["picturebook"]);
    const unlocked = new Set(player.unlockedPlays || []);
    if (!PHASE0_INITIAL.has(play.id) && !unlocked.has(play.id)) {
      return { ok: false, reasons: ["チュートリアル：まだ解禁されていない"], isHidden: true };
    }
  }

  // 解禁条件未達 → 完全非表示
  if (play.unlockRequired && !(player.unlockedPlays || []).includes(play.id)) {
    return { ok: false, reasons: ["まだ知らない遊び"], isHidden: true };
  }

  // @spec SPEC-047 §5.1 場所フィルタ：この遊びが現在地でできるか
  if (Array.isArray(play.locations) && play.locations.length > 0) {
    if (!play.locations.includes(player.location)) {
      return {
        ok: false,
        reasons: [`ここ（${locationName(player.location)}）では遊べない`],
        isHidden: true,
      };
    }
  }

  // v3: 体力不足・時間不足以外のロック条件は isHidden=true でドック非表示
  // @spec SPEC-002 §5.9 低体力・低時間プレイ（v2）：
  //   体力不足 or 時間不足でも遊べるようにする。経験値は min(体力倍率, 時間倍率) で割る。
  const hideReasons = [];
  if (play.seasons && !play.seasons.includes(player.season)) {
    hideReasons.push(`${SEASON_LABEL[player.season]}は季節外`);
  }
  if (play.ageMin && player.age < play.ageMin) hideReasons.push(`${play.ageMin}歳以上が必要`);
  if (play.ageMax && player.age > play.ageMax) hideReasons.push(`${play.ageMax}歳まで`);
  if (play.moneyCost > player.money) hideReasons.push(`所持金不足 (¥${play.moneyCost}必要)`);
  if (play.minFriends && player.friends < play.minFriends) {
    hideReasons.push(`友人${play.minFriends}人以上必要`);
  }
  // 時間不足の特殊ケース：spareHours <= 0 なら完全に時間がないのでドックから消す
  // （朝の遊びが終わった後、コアタイム or 就寝に進む誘導）
  if (player.spareHours <= 0) {
    hideReasons.push(`今日の遊びは終わった`);
  }
  if (hideReasons.length > 0) {
    return { ok: false, reasons: hideReasons, isHidden: true };
  }

  // 体力不足 or 時間不足 → 低体力（／低時間）プレイとして実行可能
  const staminaShort = (play.staminaCost || 0) > player.stamina;
  const timeShort    = (play.timeCost    || 0) > player.spareHours;
  if (staminaShort || timeShort) {
    const staminaMult = staminaShort ? Math.max(0, player.stamina / (play.staminaCost || 1)) : 1.0;
    const timeMult    = timeShort    ? Math.max(0, player.spareHours / (play.timeCost || 1)) : 1.0;
    const mult = Math.min(staminaMult, timeMult);
    const pct = Math.round(mult * 100);
    const reasons = [];
    if (staminaShort) reasons.push(`体力不足`);
    if (timeShort)    reasons.push(`時間不足`);
    reasons.push(`経験値 ${pct}%`);
    return {
      ok: true,
      reasons: [reasons.join(" / ")],
      isLowStamina: true,  // フラグ名は互換維持。「低リソースプレイ」の意
    };
  }

  return { ok: true, reasons: [] };
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
  // @spec SPEC-034 §5.1 起床ヘッダーは削除。情報はすべて HUD と素養カードに集約。
  selectedPlayId = null;
  // 素養カード初期描画（プレビューなし）
  renderSoyouList(null);
  const skillTagsEl = byId("soyou-skill-tags");
  if (skillTagsEl) skillTagsEl.hidden = true;

  const dock = byId("play-dock");
  dock.innerHTML = "";

  // @spec SPEC-025 §9.3 ドック最左端に「自動/手動」モードトグル
  // @spec SPEC-026 §5.2 Phase 0 はトグル非表示（自動モード封印）
  if (player.passionProfileId && tutorialPhase(player.day) !== "phase0") {
    const modeBtn = document.createElement("button");
    modeBtn.className = "dock-icon dock-mode" + (player.autoMode ? " auto" : "");
    modeBtn.innerHTML = player.autoMode
      ? `<span>🤖</span><span class="dock-mode-label">自動</span>`
      : `<span>🎮</span><span class="dock-mode-label">手動</span>`;
    modeBtn.setAttribute("aria-label", "自動／手動モード切替");
    modeBtn.addEventListener("click", toggleAutoMode);
    dock.appendChild(modeBtn);
  }

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
    btn.className = "dock-icon" + (avail.isLowStamina ? " low-stamina" : "");
    btn.textContent = play.icon;
    btn.setAttribute("aria-label", `${play.name}, ${play.timeCost}時間, ${
      Object.entries(play.gain).map(([k, v]) => `${LABELS[k]}+${v}`).join(", ")
    }`);
    btn.dataset.playId = play.id;
    btn.addEventListener("click", () => selectPlay(play.id));
    dock.appendChild(btn);
  });

  // @spec SPEC-002 §5.1.1 §5.1.2 / SPEC-023 §5.1 ドック最右端に 🌳 遊びツリーアイコン
  // 遊びアイコンではなく「画面遷移ナビ」として、ピル型＋濃緑＋ラベルで差別化する。
  const treeBtn = document.createElement("button");
  treeBtn.className = "dock-icon dock-tree";
  treeBtn.innerHTML = `
    <span class="dock-tree-icon">🌳</span>
    <span class="dock-tree-label">ツリー</span>
  `;
  treeBtn.setAttribute("aria-label", "遊びツリー画面へ遷移");
  treeBtn.addEventListener("click", () => {
    renderPlayTreeScreen();
    showScreen("screen-tree");
  });
  dock.appendChild(treeBtn);

  // @spec SPEC-058 §6 プロフィール導線名は「きろく」。SPEC-051 本実装前の簡易記録画面へ遷移。
  const recordBtn = document.createElement("button");
  recordBtn.className = "dock-icon dock-record";
  recordBtn.innerHTML = `
    <span class="dock-record-icon">🌱</span>
    <span class="dock-record-label">きろく</span>
  `;
  recordBtn.setAttribute("aria-label", "きろく画面へ遷移");
  recordBtn.addEventListener("click", () => {
    renderRecordScreen();
    showScreen("screen-record");
  });
  dock.appendChild(recordBtn);

  // @spec SPEC-034 §5.1 §5.3 初期状態：プレビューは非表示、ヘッダーゴーストもクリア
  const wh = byId("wakeup-header"); if (wh) wh.hidden = true;
  const cp = byId("choose-prompt"); if (cp) cp.hidden = true;
  byId("preview").hidden = true;
  byId("preview-placeholder").hidden = true;
  byId("btn-confirm-play").disabled = true;
  setStaminaGhostPreview(0);
  setHoursGhostPreview(0);
  // @spec SPEC-025 自動進行バナーは手動モード初期ではリセット
  const autoProg = byId("auto-progress");
  if (autoProg) autoProg.hidden = true;
  byId("btn-confirm-play").textContent = "遊ぶ";

  renderDailyFocusCard();
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

  // @spec SPEC-034 §5.3 プレビュー：ヘッダーのゴースト + 素養カードの (+N) + スキルタグ
  const gainNorm = normalizeGainToSoyou(play.gain || {});
  renderSoyouList(gainNorm);
  setStaminaGhostPreview(play.staminaCost || 0);
  setHoursGhostPreview(play.timeCost || 0);

  // スキルタグ表示
  const skillTagsEl = byId("soyou-skill-tags");
  if (skillTagsEl) {
    const cats = play.categories || [];
    if (cats.length > 0) {
      skillTagsEl.hidden = false;
      skillTagsEl.innerHTML = cats.map((c) => {
        const label = (CATEGORIES[c] && CATEGORIES[c].label) || c;
        const s = player.skills[c];
        const isNew = !s;
        return `<span class="soyou-skill-tag ${isNew ? "is-new" : ""}">#${label}${s ? ` Lv${s.lv}` : ""}</span>`;
      }).join("");
    } else {
      skillTagsEl.hidden = true;
    }
  }

  // 旧プレビュー要素は非表示のまま（DOM は残してあるがコスト系カードは新UIでは表示しない）
  const oldPrev = byId("preview");
  if (oldPrev) oldPrev.hidden = true;
  byId("preview-placeholder").hidden = true;

  // 友人条件・低体力・ロック警告は互換として text で別ガイドを出す
  if (avail.isLowStamina) {
    toast(`⚠ ${avail.reasons[0]}`);
  }

  // 「遊ぶ」ボタンの enable/disable
  const confirmBtn = byId("btn-confirm-play");
  if (avail.ok) {
    confirmBtn.disabled = false;
    confirmBtn.textContent = avail.isLowStamina
      ? `⚠ 無理して ${play.icon} ${play.name}`
      : `🎮 ${play.icon} ${play.name}`;
  } else {
    confirmBtn.disabled = true;
    confirmBtn.textContent = "できない";
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
  // @spec SPEC-003 §5.8a スキップ連打防止：各開始時にリセット
  skipArmed = true;
  byId("btn-skip-play").disabled = false;
  byId("btn-skip-play").textContent = "スキップ";
  byId("actions-result-normal").hidden = true;
  byId("actions-result-core").hidden = true;
  byId("actions-result-sleep").hidden = true;

  showScreen("screen-playing");
  // @spec SPEC-029 遊び中ムービー（存在すれば再生、無ければ従来アニメ）
  tryPlayIntroVideo(play.id);

  const duration = 2200;
  const start = performance.now();
  const tick = (t) => {
    const pct = Math.min(100, Math.round(((t - start) / duration) * 100));
    byId("playing-bar").style.width = pct + "%";
    byId("playing-timer").textContent = `遊び進行中… ${pct}%`;
    if (pct < 100) {
      playRAF = requestAnimationFrame(tick);
    } else {
      playRAF = null;
      // @spec SPEC-003 §5.8a 自然終了時にも skipArmed を落とし、以後のスキップクリックを無視
      skipArmed = false;
      const btn = byId("btn-skip-play");
      if (btn) btn.disabled = true;
      finishDescription();
    }
  };
  playRAF = requestAnimationFrame(tick);
}

/**
 * @screen S3 遊びの描写
 * @spec docs/specs/SPEC-003-play-execution.md §5.1
 * @spec docs/specs/SPEC-003-play-execution.md §5.8a スキップ連打防止
 *
 * スキップボタン：描写演出をカットして結果へ進む。
 * 連打しても二重実行されないよう skipArmed フラグで防御する。
 */
function skipDescription() {
  if (!skipArmed) return;   // 連打防止
  skipArmed = false;
  // UI 側でも即座に disabled にして視覚的にも2度目のクリックを抑止
  const btn = byId("btn-skip-play");
  if (btn) btn.disabled = true;
  if (playRAF) cancelAnimationFrame(playRAF);
  playRAF = null;
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
  // @spec SPEC-056 §3 コメント欄（events.json に comment があれば表示）
  let commentHtml = "";
  if (pendingEvent.comment && pendingEvent.comment.body) {
    const speaker = speakerDisplay(pendingEvent.comment.speaker || "narration");
    commentHtml = `<div class="event-comment-card"><span class="speaker">${speaker}</span><span>${pendingEvent.comment.body}</span></div>`;
  }
  byId("event-effects").innerHTML = `<div class="card-title">変化</div><ul class="kv-list">${rows}</ul>${commentHtml}`;
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

  // ---- ①' 熟練ブースト・低体力倍率を算出（SPEC-024 §5.4 / SPEC-002 §5.9）----
  const skillBoost   = skillBoostMultiplier(play);
  const lowStamMul   = lowStaminaMultiplier(play);
  // @spec SPEC-047 §8.3 場所由来の持続バフ（博物館 → 読書 +20% など）
  const locBuff      = applyPersistBuffsToGain(play);
  // 3 つを合成して経験値系に掛ける基本倍率
  const gainBoost    = skillBoost * lowStamMul * locBuff;

  // ---- ① 獲得経験値の計算（SPEC-033 §5 旧キー自動変換）----
  const gain = {};
  for (const [k, v] of Object.entries(normalizeGainToSoyou(play.gain))) {
    gain[k] = Math.round(v * gainBoost);
  }

  // @spec SPEC-007 §5.2 友人数ボーナス（熟練・低体力倍率を適用）
  if (play.friendBonusPerPerson) {
    const mainKey = majorGainCategory(play.gain) || "social";
    const friendBonus = Math.round(play.friendBonusPerPerson * player.friends * gainBoost);
    gain[mainKey] = (gain[mainKey] || 0) + friendBonus;
  }

  // @spec SPEC-003 §5.2 没頭ボーナス（熟練ブーストは適用しない、低体力のみ）
  const mainCat = majorGainCategory(play.gain);
  let passionGain = 3;
  if (mainCat && player.lastPlayCategory === mainCat) {
    passionGain += 2 + player.consecutiveCategoryCount;
  }
  passionGain = Math.floor(passionGain * lowStamMul);

  // ---- ②' スキル経験値の事前計算（SPEC-024 §5.3）----
  // baseExp = play.gain の 5 カテゴリ合計 × gainBoost
  // 各カテゴリ当たり = baseExp / categories.length
  const cats = play.categories || [];
  const baseExpTotal = Object.values(play.gain).reduce((a, b) => a + b, 0);
  const skillExpPerCategory = cats.length > 0
    ? Math.round((baseExpTotal * gainBoost) / cats.length)
    : 0;
  const skillBefore = {};
  for (const c of cats) {
    ensureSkill(c);
    skillBefore[c] = { exp: player.skills[c].exp, lv: player.skills[c].lv };
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
    clockHour: player.clockHour,
    clockMinute: player.clockMinute,
    spareHours: player.spareHours,
    gainBoost,
    lowStamMul,
    skillBoost,
    skillBefore,
  };

  // ---- ③ 経験値加算 ----
  for (const [k, v] of Object.entries(gain)) {
    player.exp[k] = (player.exp[k] || 0) + v;
  }

  // ---- ③' スキル経験値加算（SPEC-024 §5.3）----
  for (const c of cats) {
    const s = player.skills[c];
    s.exp += skillExpPerCategory;
    s.lv = skillLvFromExp(s.exp);
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
    // SPEC-033 §5 素養の加算（旧キー自動変換）
    for (const [k, v] of Object.entries(normalizeGainToSoyou(e))) {
      if (SOYOU_KEYS.includes(k)) {
        player.soyou[k] = (player.soyou[k] || 0) + v;
      }
    }
  }

  // ---- ⑦ 没頭カウント更新 ----
  if (mainCat === player.lastPlayCategory) {
    player.consecutiveCategoryCount += 1;
  } else {
    player.consecutiveCategoryCount = 0;
    player.lastPlayCategory = mainCat;
  }

  // @spec SPEC-025 §7.1 / SPEC-027 §5.1 手動モードでも日の終わりサマリに遊びを集約
  if (player._daySnapshot && player._daySnapshot.playsById) {
    player._daySnapshot.playsById[play.id] = (player._daySnapshot.playsById[play.id] || 0) + 1;
  }
  // @spec SPEC-025 §7.2 手動モードでも週サマリ（S9）用のハイライトバッファに集約
  if (player._autoHighlight) {
    const h = player._autoHighlight;
    h.playsById[play.id] = (h.playsById[play.id] || 0) + 1;
    h.turnCount += 1;
    h.dayEnd = player.day;
  }

  // @spec SPEC-026 §5.2.1 チュートリアル発見（絵本→滑り台→砂場の段階解禁）
  const tutDiscoveredFinalize = checkTutorialDiscoveries(play.id);
  if (tutDiscoveredFinalize && tutDiscoveredFinalize.length > 0) {
    player._pendingTutorialInterrupts = (player._pendingTutorialInterrupts || []).concat(tutDiscoveredFinalize);
  }

  pendingGain = {
    gain,
    passion: passionGain,
    skillExpPerCategory,
    skillBoost,
    lowStamMul,
    cats,
  };

  // ---- ⑧ UIへ結果を描画 ----
  renderResultPanel(before);
  renderHUD();

  // ---- ⑧' ミッションエンジンに通知（進捗ヒント・累積トリガ・称号判定）----
  // @spec SPEC-050 §4 §9 / SPEC-051 §4.5
  try { onPlayFinalized(play); } catch (e) { console.warn("[mission] onPlayFinalized error", e); }

  // ---- ⑨ 体力ゼロ判定（SPEC-019 §5.4 / SPEC-056 §4 デザートは別腹）----
  // ミッション系モーダルが立ち上がっている間は強制就寝を遅延させる。
  // 「達成は体力に左右されない」という設計（SPEC-056 §4）。
  if (player.stamina <= 0) {
    if (isMissionModalActive()) {
      player._pendingStaminaDepleted = true;
      return;  // モーダル閉じ時に消化される
    }
    handleStaminaDepleted();
    return;
  }

  // ---- ⑩ アクションボタンの切替（結果フェーズのフッター構成 SPEC-003 §5.8）----
  showResultActions();

  // S4から戻ってきた場合は、S3画面を再表示
  showScreen("screen-playing");

  // @spec SPEC-026 §5.2.1 チュートリアル発見があればモーダル通知（結果画面の上に出る）
  if (player._pendingTutorialInterrupts && player._pendingTutorialInterrupts.length > 0) {
    const q = player._pendingTutorialInterrupts.slice();
    player._pendingTutorialInterrupts = [];
    showInterruptQueue(q, () => {});
  }
}

/**
 * @screen S3 結果フェーズのフッター切替
 * @spec docs/specs/SPEC-003-play-execution.md §5.8 文脈別フッター
 * @spec docs/specs/SPEC-003-play-execution.md §5.8a スキップボタンは描写フェーズ専用
 *
 * 3 つのフッター領域を排他表示する：
 *   actions-result-normal  通常：🔁もう一度 ＋ 次の遊び ＋ 今日おわる
 *   actions-result-core    朝の遊び終了→🏫保育園へ（1ボタン）
 *   actions-result-sleep   余剰0→🌙おやすみ（1ボタン）
 */
function showResultActions() {
  // スキップボタンは必ず非表示（SPEC-003 §5.8a）
  byId("actions-skip").hidden = true;

  const stage = resolveLifeStage(player.age);
  const coreTime = getActiveCoreTime();
  const coreTimeAvailable = !!(coreTime && stage.implemented && !player.coreTimeDoneToday);

  // 文脈判定
  const ctxNormal  = "normal";
  const ctxCore    = "core";
  const ctxSleep   = "sleep";
  let ctx = ctxNormal;
  if (player.spareHours <= 0) {
    ctx = coreTimeAvailable ? ctxCore : ctxSleep;
  }

  byId("actions-result-normal").hidden = (ctx !== ctxNormal);
  byId("actions-result-core").hidden   = (ctx !== ctxCore);
  byId("actions-result-sleep").hidden  = (ctx !== ctxSleep);

  if (ctx === ctxNormal) {
    // @spec SPEC-003 §5.7 リピート可否
    const replayBtn = byId("btn-replay-play");
    if (pendingPlay) {
      const avail = isPlayAvailable(pendingPlay);
      replayBtn.textContent = `🔁 もう一度遊ぶ（-${pendingPlay.timeCost}h）`;
      replayBtn.disabled = !avail.ok;
    }
    byId("btn-next-play").disabled = false;
    byId("btn-next-play").textContent = "次の遊びを選ぶ";
  } else if (ctx === ctxCore) {
    byId("btn-goto-coretime").textContent = `🏫 ${coreTime.label}に行く`;
    toast(`時間だ。${coreTime.label}に行こう`);
  } else if (ctx === ctxSleep) {
    toast("今日はもう遊べない。おやすみの時間だ");
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
    // ---- 強制睡眠 2h（SPEC-019 §5.4.1）----
    const recover = Math.floor(player.staminaCap * 0.30);
    player.stamina = recover;

    // @spec SPEC-019 §5.4.1a コアタイム吸収ルール
    // 仮眠の 2h のうち、コアタイム時間に重なる分は夜の余剰から差し引かない。
    const stage = resolveLifeStage(player.age);
    const core  = stage ? stage.coreTime : null;
    const napStart = player.clockHour + player.clockMinute / 60;
    const napEnd   = napStart + 2;

    // 1) 時刻を 2h 進める（上限 23:00）
    const advancedHour = Math.min(23.99, napEnd);
    player.clockHour   = Math.floor(advancedHour);
    player.clockMinute = Math.round((advancedHour - Math.floor(advancedHour)) * 60);
    if (player.clockMinute >= 60) { player.clockHour += 1; player.clockMinute = 0; }

    // 2) 朝の余剰 or 夜の余剰への影響を計算
    let morningDecrease = 0;  // 朝の余剰から差し引く時間
    let nightOverflow   = 0;  // 夜の余剰から後で差し引く時間
    if (!core) {
      // 老後：コアタイム無し、従来通り 2h 丸々引く
      morningDecrease = 2;
    } else {
      const isBeforeCore    = napStart < core.startHour;
      const isDuringOrAfter = napStart >= core.startHour;

      if (isBeforeCore) {
        // 朝に仮眠発動。コアタイム開始までの分を朝から、コアタイム越えた分を夜へ
        morningDecrease = Math.min(2, Math.max(0, core.startHour - napStart));
        if (napEnd > core.endHour) {
          nightOverflow = napEnd - core.endHour;
        }
        // コアタイム内に収まる部分は「吸収されて」どこからも差し引かない
      } else if (isDuringOrAfter && napStart < core.endHour) {
        // コアタイム中に発動（現状のプロトでは保育園中は遊べないので発生しない想定）
        if (napEnd > core.endHour) {
          nightOverflow = napEnd - core.endHour;
        }
      } else {
        // コアタイム後（夜の遊び中）に発動
        morningDecrease = 2;
      }
    }

    // 3) 朝の余剰から差し引き（上限は現在値）
    if (morningDecrease > 0) {
      player.spareHours = Math.max(0, +(player.spareHours - morningDecrease).toFixed(1));
    }
    // 4) 夜の余剰超過分はフラグに保存（コアタイム消化後に recomputeSpareHoursAfterCoreTime で適用）
    if (nightOverflow > 0) {
      player._napOverflow = +((player._napOverflow || 0) + nightOverflow).toFixed(1);
    }

    const toastMsg = (core && napStart < core.startHour)
      ? `体力ゼロ…2時間お昼寝した（体力+${recover}）保育園時間で吸収`
      : `体力ゼロ…2時間お昼寝した（体力+${recover}）`;
    toast(toastMsg, 2400);

    renderHUD();

    // @spec SPEC-035 §8 旧「時間の流れ」カード（#result-clock-after / #result-spare）は
    //   S3 結果画面のリデザインで削除済み。
    //   もし旧要素が存在している（互換のため残した場合）にだけ更新する。
    //   存在しない場合は null ガードで安全にスキップする（handleStaminaDepleted が TypeError で
    //   止まり、その後のスキップ等の進行ボタンが反応しなくなるバグを回避）。
    const clockAfterEl = byId("result-clock-after");
    if (clockAfterEl && typeof renderClockDial === "function") {
      try {
        renderClockDial(clockAfterEl, {
          clockHour: player.clockHour,
          clockMinute: player.clockMinute,
          showText: true,
        });
      } catch (e) { /* noop */ }
    }
    const spareEl = byId("result-spare");
    if (spareEl) {
      spareEl.textContent = `⏳ 余剰時間 ${player.spareHours}h（+仮眠2h）`;
    }

    showResultActions();
    showScreen("screen-playing");
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

  // @spec SPEC-035 §7.1 素養カード形式で描画（差分ありのみ表示、グレードアップ演出）
  renderSoyouResultList(byId("result-soyou-list"), before.exp || {}, player.soyou || {});

  // @spec SPEC-035 §6 スキル行（1 行 × N）
  const cats = (before.skillBefore && Object.keys(before.skillBefore)) || [];
  const skillHost = byId("result-skill-lines");
  const skillRows = renderSkillLines(skillHost, cats, before.skillBefore);
  const skillCard = byId("result-skill-lines-card");
  if (skillCard) skillCard.hidden = skillRows === 0;
  const boostNoteEl = byId("result-boost-note");
  if (boostNoteEl) {
    if (before.skillBoost && before.skillBoost > 1.001) {
      boostNoteEl.textContent = `熟練ブースト × ${before.skillBoost.toFixed(2)}`;
      boostNoteEl.style.display = "";
    } else {
      boostNoteEl.textContent = "";
      boostNoteEl.style.display = "none";
    }
  }

  // ---- 低体力プレイの警告（SPEC-002 §5.9）----
  const warnCard = byId("result-low-stamina-warn");
  if (before.lowStamMul !== undefined && before.lowStamMul < 1.0) {
    warnCard.hidden = false;
    byId("result-low-stamina-text").textContent =
      `⚠ 体力不足で遊んだ：獲得経験値 × ${Math.round(before.lowStamMul * 100)}%（子どもは無茶する）`;
  } else {
    warnCard.hidden = true;
  }

  // @spec SPEC-035 §4.1 ステータス・時間・ジョウネツ単独カードはカット。ヘッダーで表現。

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
/**
 * @deprecated v2: 旧「今日を始める」ボタンで使われていた関数。
 * S1 起床画面の廃止に伴い呼び出されなくなったため廃止予定。
 * 現在は `goChooseFromToday()` が朝の遊び or コアタイム or 就寝の分岐を内包する。
 */
function beginDay() {
  goChooseFromToday();
}

/**
 * @screen S3 → S6 コアタイム画面
 * @spec docs/specs/SPEC-003-play-execution.md §5.8 「保育園に行く」ボタン押下
 * 結果フェーズから直接コアタイムへ遷移する。時刻を coreTime.startHour に揃える。
 */
function gotoCoreTimeFromResult() {
  const stage = resolveLifeStage(player.age);
  const coreTime = getActiveCoreTime();
  if (!coreTime || !stage.implemented) { goChooseFromToday(); return; }
  // 朝の余剰時間を 0 にクランプし、時刻をコアタイム開始まで早送り
  if (player.clockHour + player.clockMinute / 60 < coreTime.startHour) {
    player.clockHour = Math.floor(coreTime.startHour);
    player.clockMinute = Math.round((coreTime.startHour % 1) * 60);
  }
  player.spareHours = 0;
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
 * @spec docs/specs/SPEC-019-stamina-cap.md §5.4.1a 仮眠のコアタイム越えオーバーフロー消費
 * コアタイム消化後の夜の余剰時間を再計算する。
 * 1〜9歳は SPEC-020 の固定就寝時刻を使用、その他は 22:00 を仮の就寝時刻とする。
 * 食事・入浴バッファ 1h を差し引く。
 * さらに `_napOverflow` がある場合は、それを夜の余剰から一度だけ差し引いてリセット。
 */
function recomputeSpareHoursAfterCoreTime(coreTime) {
  const sched = getFixedSchedule(player.age);
  const sleepTargetHour = sched ? sched.sleepHour : 22;
  const mealBufferHours = 1;
  const now = player.clockHour + player.clockMinute / 60;
  let remain = Math.max(0, sleepTargetHour - now - mealBufferHours);

  // @spec SPEC-019 §5.4.1a コアタイム終了後まで食い込んだ仮眠分を夜の余剰から引く
  if (player._napOverflow && player._napOverflow > 0) {
    remain = Math.max(0, remain - player._napOverflow);
    player._napOverflow = 0;
  }

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
  // @spec SPEC-025 §7.1 / SPEC-027 §5.1 手動モードでも日サマリ・週サマリの集計バッファを
  //   起床時に 1 回だけ初期化する（auto モードの runAutoTurn と同じタイミング）。
  initDaySnapshotIfNeeded();
  initAutoHighlightIfNeeded();

  // @spec SPEC-056 §2.1 朝の発火イベント（感染症・親遣い遠出）のモーダルを先に消化する
  if (player._pendingMorningEventModals && player._pendingMorningEventModals.length > 0) {
    flushMorningEventModalsThen(() => {
      // モーダル消化後、改めて朝の処理に進む（再帰）
      goChooseFromToday();
    });
    return;
  }

  // @spec SPEC-047 §7 親遣いの移動演出が発動する日はここで画面遷移を引き受ける
  if (maybeStartParentalOutingTravel()) return;

  // @spec SPEC-057 §1 感染症中（または通院後）は遊び選択もコアタイムも飛ばして直接 1 日の終わりへ
  //   - "infection" : 自宅療養中
  //   - "clinic"    : 通院から帰宅した後、その日も安静
  if (player._specialDayMode === "infection" || player._specialDayMode === "clinic") {
    goSleep();
    return;
  }

  // @spec SPEC-050 §9 ミッションバナーの更新（ここで毎朝呼ぶのが確実）
  try { renderMissionBanner(); } catch (e) { /* noop */ }
  // @spec SPEC-055 §1 予告ヒント（HUD 直下）も毎朝再計算
  try { renderPreviewHint(); } catch (e) { /* noop */ }

  const stage = resolveLifeStage(player.age);
  const coreTime = getActiveCoreTime();
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

  // @spec SPEC-025 §5.5 自動モード中はドックが出た直後に自動ループ開始
  if (player.autoMode && player.passionProfileId) {
    startAutoLoop();
  }
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
// @screen S7 遊びツリー
// @spec docs/specs/SPEC-023-play-tree.md
// =========================================================================

/**
 * @spec docs/specs/SPEC-023-play-tree.md §5.5 ノード状態の判定
 */
function classifyTreeNode(play) {
  const stage = resolveLifeStage(player.age);
  if (!stage) return "future";
  // この遊びが現ステージ（年齢範囲内）で想定されているかを大まかに判定
  const inStageAge = (play.ageMin == null || play.ageMin <= stage.ageMax) &&
                     (play.ageMax == null || play.ageMax >= stage.ageMin);
  if (!inStageAge) return "future";

  if (play.unlockRequired && !(player.unlockedPlays || []).includes(play.id)) {
    return "nearlock";
  }
  const avail = isPlayAvailable(play);
  if (avail.ok) return "playable";
  return "nearlock";
}

/**
 * @spec docs/specs/SPEC-023-play-tree.md §5.4
 * 解放条件を 1 行テキストにまとめる。
 */
function formatUnlockRequirement(play) {
  const parts = [];
  if (play.ageMin != null && play.ageMax != null) parts.push(`${play.ageMin}〜${play.ageMax}歳`);
  else if (play.ageMin != null) parts.push(`${play.ageMin}歳〜`);
  else if (play.ageMax != null) parts.push(`〜${play.ageMax}歳`);
  if (play.seasons) {
    const map = { spring: "春", summer: "夏", autumn: "秋", winter: "冬" };
    parts.push(play.seasons.map((s) => map[s]).join("・") + "限定");
  }
  if (play.moneyCost > 0) parts.push(`¥${play.moneyCost}`);
  if (play.minFriends) parts.push(`友人${play.minFriends}人以上`);
  if (play.unlockRequired) parts.push("発見で解禁");
  if (parts.length === 0) parts.push("いつでも");
  return parts.join(" / ");
}

/**
 * @screen S7
 * @spec docs/specs/SPEC-023-play-tree.md §5.2, §5.3, §5.7
 * プレイヤーの現ライフステージ遊びをカテゴリグループごとに描画し、
 * 次ステージの代表遊びをシルエットで紹介する。
 */
function renderPlayTreeScreen() {
  const stage = resolveLifeStage(player.age);
  byId("tree-stage-label").textContent =
    `今のステージ：${stage ? stage.icon + " " + stage.label : "—"}`;

  const body = byId("tree-body");
  body.innerHTML = "";

  // 1) 現ライフステージで表示する遊び（年齢範囲が現ステージと重なるもの）
  const currentPlays = PLAYS.filter((p) => {
    const inStage = (p.ageMin == null || p.ageMin <= (stage ? stage.ageMax : 100)) &&
                    (p.ageMax == null || p.ageMax >= (stage ? stage.ageMin : 1));
    return inStage;
  });

  // カテゴリグループごとにセクション化
  CATEGORY_GROUP_ORDER.forEach((group) => {
    const catsInGroup = Object.keys(CATEGORIES).filter((c) => CATEGORIES[c].group === group);
    const playsInGroup = currentPlays.filter((p) =>
      (p.categories || []).some((c) => catsInGroup.includes(c))
    );
    if (playsInGroup.length === 0) return;

    // セクション見出し
    const title = document.createElement("div");
    title.className = "tree-section-title";
    title.textContent = `─ ${group} ─`;
    body.appendChild(title);

    // プレイ可能な遊びを上に、それ以外を下に
    playsInGroup
      .map((p) => ({ play: p, state: classifyTreeNode(p) }))
      .sort((a, b) => {
        const order = { playable: 0, nearlock: 1, future: 2, hidden: 3 };
        return order[a.state] - order[b.state];
      })
      .forEach(({ play, state }) => {
        const node = document.createElement("button");
        node.className = `tree-node state-${state}`;
        const statusLabel = {
          playable: "🟢 今遊べる",
          nearlock: "🟠 条件あり",
          future: "⚪ 先のステージ",
          hidden: "？？？",
        }[state];
        node.innerHTML = `
          <div class="tree-node-icon">${play.icon || "🎮"}</div>
          <div class="tree-node-body">
            <div class="tree-node-name">${play.name}</div>
            <div class="tree-node-req">${formatUnlockRequirement(play)}</div>
          </div>
          <div class="tree-node-status">${statusLabel}</div>
        `;
        node.addEventListener("click", () => {
          if (state === "playable") {
            toast("戻って選ぶとすぐ遊べるよ", 1600);
          } else if (state === "nearlock") {
            toast(formatUnlockRequirement(play), 2000);
          } else {
            toast("まだ遊べないよ", 1600);
          }
        });
        body.appendChild(node);
      });
  });

  // 2) 次のライフステージの予告
  const stageIdx = LIFE_STAGES.findIndex((s) => s === stage);
  const nextStage = stageIdx >= 0 ? LIFE_STAGES[stageIdx + 1] : null;
  if (nextStage) {
    const future = document.createElement("div");
    future.className = "tree-future-section";
    future.innerHTML = `
      <div class="tree-future-title">${nextStage.icon} 次のステージ：${nextStage.label}（${nextStage.ageMin}歳〜）</div>
      <div class="tree-future-sub">そのときが楽しみ…</div>
    `;
    body.appendChild(future);
  }

  // 3) もっと先のティザー
  if (nextStage) {
    const teaser = document.createElement("div");
    teaser.className = "tree-future-section";
    teaser.innerHTML = `
      <div class="tree-future-title">🌌 もっと先…</div>
      <div class="tree-future-sub">小学校、中学校、そして大人へ。人生には、まだまだたくさんの遊びが待っている。</div>
    `;
    body.appendChild(teaser);
  }

  renderHUD();
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
  // @spec SPEC-025 §7.2.0 週境界判定：今日が日曜日なら、週末ハイライトを S10 の後に挿入
  const dow = fakeDateForDay(player.day).getUTCDay(); // 0=日
  if (dow === 0) {
    player._pendingWeeklyHighlight = true;
  }

  // @spec SPEC-025 §6.2 自動モード中は S5 就寝画面を表示せず、S10 日の終わりサマリに直行
  if (player.autoMode) {
    stopAutoLoop();

    // @spec SPEC-025 §7.1.3 スキップ継続中なら、サマリを飛ばしてすぐに翌日へ
    if (player._skipRemainingDays > 0) {
      player._skipRemainingDays -= 1;
      // 就寝 → 翌朝の処理
      sleep("normal");
      // まだ残りがあるか、最後の 1 日だったか
      // sleep() は nextDay を呼び、goChooseFromToday まで行く。
      // goChooseFromToday は autoMode=true なので startAutoLoop で再開する。
      return;
    }

    renderDaySummary();
    showScreen("screen-day-summary");
    return;
  }

  // @spec SPEC-027 保育園・幼稚園期は手動モードでも日の終わりに S10 連絡帳サマリを表示
  const stage = resolveLifeStage(player.age);
  if (stage && (stage.id === "nursery" || stage.id === "kindergarten")) {
    renderDaySummary();
    showScreen("screen-day-summary");
    return;
  }

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
  player._napOverflow = 0;  // @spec SPEC-019 §5.4.1a 前日の持ち越しはしない

  const sched = getFixedSchedule(player.age);
  const stage = resolveLifeStage(player.age);
  // @spec SPEC-026 §5.2 Phase 0 は保育園休業：コアタイムを null 扱い
  const coreTime = getActiveCoreTime();

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
  //  SPEC-026 §5.2 Phase 0 は 1 日 8h を自由遊び（昼寝 2h 含まず）
  let morning = 0;
  const isPhase0 = (tutorialPhase(player.day) === "phase0");
  if (isPhase0) {
    // Phase 0：朝〜就寝まで、昼寝2h・食事1h を引いた 8h を一括で使える
    // （朝 07:00 〜 19:00 = 12h のうち、昼寝 13:00-15:00 と 食事 18:00-19:00 を除く）
    morning = 8;
  } else if (coreTime) {
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
  //   Phase 0 は一括 8h
  const sleepHour = sched ? sched.sleepHour : 22;
  const eveningBase = coreTime ? Math.max(0, sleepHour - 1 - coreTime.endHour) : 0;
  if (isPhase0) {
    player.spareHoursMax = 8;
  } else {
    player.spareHoursMax = +(morning + eveningBase).toFixed(1) || 1;
  }

  player.clockHour = wakeH;
  player.clockMinute = wakeM;

  if (sickness) toast("朝から体調がすぐれない…（余剰時間 -2h）", 2400);
  else if (!sched && sleepMode === "latenight") toast("夜更かしで生活リズムが乱れた…");
  else if (!sched && sleepMode === "early") toast("早寝でリズム回復！");

  // @spec SPEC-057 §2 感染症の治癒判定（朝起床時 = 前日の夜の判定として処理）
  //   通院していたら 100% 治癒、そうでなければ残日数別の確率で前倒し治癒
  let justHealed = false;
  if (typeof maybeHealInfection === "function") {
    try { justHealed = maybeHealInfection(); } catch (e) { /* noop */ }
  }
  if (justHealed) {
    // 治癒した日は通常の余剰時間に戻す（spareHours は既に通常値で計算されているのでそのまま）
    enqueueMorningEventModal({
      art: "🌟",
      title: "熱が下がった！",
      desc: "昨日まで熱があったけど、今日はすっかり元気。やっと外で遊べるよ！",
      effects: [
        { label: "余剰時間", delta: +Math.floor(player.spareHours), unit: "h" },
      ],
      comment: { speaker: "mother", body: "もう大丈夫そうね、よかった" },
    });
    player._infectionJustHealed = false;
  }

  // @spec SPEC-011 §10 / SPEC-057 §3 感染症フラグの更新と clinic 抽選を先に行う
  //   maybeTriggerNurserySpecialEvent 内で感染症発動 + maybeResolveMorningLocation を呼んで
  //   clinic に行く判定をする。感染症無しなら何もしない（次の親遣い抽選に進む）
  let infectionHandled = false;
  if (!justHealed && typeof maybeTriggerNurserySpecialEvent === "function") {
    try {
      maybeTriggerNurserySpecialEvent();
      infectionHandled = (player._specialDayMode === "infection");
    } catch (e) { /* noop */ }
  }

  // @spec SPEC-047 §7 §8 保育園期の親遣い抽選（起床時、感染症が無い時のみ）
  //   感染症中は既に maybeTriggerNurserySpecialEvent 内で clinic / home が決定されている
  if (!infectionHandled) {
    maybeResolveMorningLocation();
  }
  // 治癒した日はその日は健康なので、余剰時間を回復
  if (justHealed) {
    player.spareHours = player.spareHoursMax || 8;
  }

  // @spec SPEC-002 §1.1 翌日も S2 に直行（起床ヘッダーで状態を表示）
  renderHUD();

  // @spec SPEC-026 §5.3 / §5.4 チュートリアル境界日のモーダル
  const tutorialInterrupts = collectTutorialBoundaryInterrupts();
  if (tutorialInterrupts.length > 0) {
    showInterruptQueue(tutorialInterrupts, () => {
      // @spec SPEC-026 §5.3.1 Day 8 到達時に情熱プロファイル未選択なら選ばせる
      if (player.day === 8 && !player.passionProfileId) {
        renderPassionProfileScreen();
        showScreen("screen-passion-profile");
      } else {
        goChooseFromToday();
      }
    });
  } else {
    goChooseFromToday();
  }
}

/* =========================================================================
 * @spec SPEC-056 §4 ミッションモーダル中の体力ゼロ遅延（デザートは別腹）
 *   - 達成プロンプト / 発端 / 触媒 / 達成シーンが表示中なら handleStaminaDepleted を遅らせる
 *   - モーダル閉じ時に消化（消化先は consumePendingStaminaDepleted）
 * ========================================================================= */
function isMissionModalActive() {
  const active = document.querySelector(".screen.active");
  if (!active) return false;
  return active.id === "screen-mission-modal" ||
         active.id === "screen-mission-attempt-prompt";
}

function consumePendingStaminaDepleted() {
  if (!player._pendingStaminaDepleted) return false;
  if (isMissionModalActive()) return false;  // まだミッション中
  // 体力が他経路で回復している可能性をチェック
  if (player.stamina > 0) {
    player._pendingStaminaDepleted = false;
    return false;
  }
  player._pendingStaminaDepleted = false;
  try { handleStaminaDepleted(); } catch (e) { console.warn("[stamina] depleted error", e); }
  return true;
}

/* =========================================================================
 * @spec SPEC-056 §1 統一イベントモーダル
 *   showEventModal({ art, title, desc, effects, comment, buttonLabel, onClose })
 *   - 朝の発火イベント（感染症、親遣い遠出）と将来の S4 統合に使う共通モーダル
 *   - effects/comment は省略可
 * ========================================================================= */
let _eventModalOnClose = null;
function showEventModal(opt) {
  const root = byId("event-overlay");
  if (!root) {
    // フォールバック：オーバーレイが無い場合は toast に降格
    if (opt.title && typeof toast === "function") toast(opt.title);
    if (typeof opt.onClose === "function") opt.onClose();
    return;
  }

  const artEl     = byId("event-modal-art");
  const titleEl   = byId("event-modal-title");
  const descEl    = byId("event-modal-desc");
  const effectsEl = byId("event-modal-effects");
  const listEl    = byId("event-modal-effects-list");
  const commentEl = byId("event-modal-comment");
  const speakerEl = byId("event-modal-comment-speaker");
  const bodyEl    = byId("event-modal-comment-body");
  const btnEl     = byId("btn-event-modal-close");

  if (artEl)   artEl.textContent   = opt.art   || "✨";
  if (titleEl) titleEl.textContent = opt.title || "";
  if (descEl)  descEl.textContent  = opt.desc  || "";
  if (btnEl)   btnEl.textContent   = opt.buttonLabel || "なるほど";

  // ----- 影響リスト -----
  if (Array.isArray(opt.effects) && opt.effects.length > 0) {
    if (listEl) {
      listEl.innerHTML = opt.effects.map((e) => {
        const v = Number(e.delta || 0);
        const cls = v > 0 ? "up" : (v < 0 ? "down" : "flat");
        const sign = v > 0 ? "+" : "";
        const unit = e.unit ? `<span class="effect-unit">${e.unit}</span>` : "";
        return `<li><span>${e.label || ""}</span><b class="effect-delta ${cls}">${sign}${v}${unit ? " " + e.unit : ""}</b></li>`;
      }).join("");
    }
    if (effectsEl) effectsEl.hidden = false;
  } else {
    if (effectsEl) effectsEl.hidden = true;
  }

  // ----- コメント -----
  if (opt.comment && opt.comment.body) {
    if (speakerEl) speakerEl.textContent = speakerDisplay(opt.comment.speaker || "narration");
    if (bodyEl)    bodyEl.textContent    = opt.comment.body;
    if (commentEl) commentEl.hidden = false;
  } else {
    if (commentEl) commentEl.hidden = true;
  }

  _eventModalOnClose = (typeof opt.onClose === "function") ? opt.onClose : null;
  root.hidden = false;
}

function closeEventModal() {
  const root = byId("event-overlay");
  if (root) root.hidden = true;
  const cb = _eventModalOnClose;
  _eventModalOnClose = null;
  if (cb) {
    try { cb(); } catch (e) { console.warn("[event-modal] onClose error", e); }
  }
}

/**
 * @spec SPEC-056 §2.1 morning-events.json から ID を引いてモーダル化
 *   linkedLocationId が一致する fullday_trip / outing_play から探すヘルパも提供
 */
function findMorningEventById(id) {
  return MORNING_EVENTS.find((m) => m.id === id) || null;
}
function findMorningEventByLocation(locId, category) {
  return MORNING_EVENTS.find((m) =>
    m.linkedLocationId === locId &&
    (!category || m.category === category)
  ) || null;
}

/**
 * @spec SPEC-056 §2.1 朝のイベントモーダルキュー
 *   nextDay 内で複数のイベントが立ち上がる可能性を考慮し、配列で蓄積し、
 *   goChooseFromToday の冒頭でフラッシュする。
 */
function enqueueMorningEventModal(opt) {
  player._pendingMorningEventModals = player._pendingMorningEventModals || [];
  player._pendingMorningEventModals.push(opt);
}

function flushMorningEventModalsThen(then) {
  const queue = (player._pendingMorningEventModals || []).slice();
  player._pendingMorningEventModals = [];
  if (queue.length === 0) {
    if (typeof then === "function") then();
    return;
  }
  const next = () => {
    const head = queue.shift();
    if (!head) {
      if (typeof then === "function") then();
      return;
    }
    showEventModal({ ...head, onClose: next });
  };
  next();
}

/**
 * @spec SPEC-011 §10 保育園期の特別イベント抽選（Issue #14 反映）
 *   - 親遣い遠出：土日祝 40% / 平日 2%。発動した日は dock 経由の自由遊び不可
 *   - 感染症：月別（4-6月/11-2月は 15%、その他は 3%）の確率
 *
 * 現段階では以下のみ実装：
 *   - フラグ設定（player._specialDayMode / player._infectionRemainingDays）
 *   - トースト通知
 *   - 感染症中は朝の余剰時間ゼロ＆体力回復鈍化を既に reflect 済み
 *   - 親遣い遠出の「その日は1イベントだけで即S10」は将来実装
 */
/**
 * @spec SPEC-057 §2 §3 感染症の治癒判定（毎晩実行）
 *
 * 通院した日は確定治癒。
 * 通常時は残日数別の確率で前倒し治癒：
 *   残 3 日 → 0%（初日は確実に休む）
 *   残 2 日 → 30%
 *   残 1 日 → 50%
 *   残 0 日 → 自動的に治る（このパス自体が呼ばれない）
 *
 * @returns {boolean} 今夜治ったかどうか
 */
function maybeHealInfection() {
  const r = player._infectionRemainingDays || 0;
  if (r <= 0) return false;

  // 通院した日は確定治癒
  if (player._visitedClinicToday) {
    player._infectionRemainingDays = 0;
    player._specialDayMode = null;
    player._visitedClinicToday = false;
    player._infectionJustHealed = true;
    return true;
  }

  // 残日数別の自然治癒確率
  const probTable = { 3: 0.00, 2: 0.30, 1: 0.50 };
  const prob = (typeof probTable[r] === "number") ? probTable[r] : 0.0;
  if (Math.random() < prob) {
    player._infectionRemainingDays = 0;
    player._specialDayMode = null;
    player._infectionJustHealed = true;
    return true;
  }
  return false;
}

function maybeTriggerNurserySpecialEvent() {
  const stage = resolveLifeStage(player.age);
  if (!stage || stage.id !== "nursery") {
    player._specialDayMode = null;
    return;
  }

  // phase0（初週）は世界観演出を邪魔しないためスキップ
  if (tutorialPhase(player.day) === "phase0") {
    player._specialDayMode = null;
    return;
  }

  // 曜日判定（日=0, 土=6）
  const dow = fakeDateForDay(player.day).getUTCDay();
  const isWeekend = (dow === 0 || dow === 6);
  // 月別感染症確率（month は 0-indexed）
  const month = fakeDateForDay(player.day).getUTCMonth();
  const highSeason = (month >= 3 && month <= 5) || month >= 10 || month <= 1; // 4-6月 or 11-2月
  const infectionRate = highSeason ? 0.15 : 0.03;

  // すでに感染症期間中（残日数 >0）なら継続処理
  let isInfectionContinuation = false;
  let isInfectionFirstDay = false;
  if (player._infectionRemainingDays && player._infectionRemainingDays > 0) {
    player._infectionRemainingDays -= 1;
    player._specialDayMode = "infection";
    player.spareHours = 0;
    isInfectionContinuation = true;
  } else if (Math.random() < infectionRate) {
    // 1. 感染症新規発動
    const durationDays = 3 + Math.floor(Math.random() * 3); // 3-5 日
    player._infectionRemainingDays = durationDays;
    player._specialDayMode = "infection";
    player.spareHours = 0;
    isInfectionFirstDay = true;
  }

  if (isInfectionContinuation || isInfectionFirstDay) {
    // @spec SPEC-057 §3 感染症中は clinic 抽選を先に走らせ、行く予定があれば通院モーダルに切り替え
    //   maybeResolveMorningLocation は clinic 抽選分岐で _parentalOutingToday を設定する
    try { maybeResolveMorningLocation(); } catch (e) { /* noop */ }
    if (player._parentalOutingToday === "clinic") {
      enqueueMorningEventModal({
        art: "🏥",
        title: "お医者さんに連れて行ってもらった",
        desc: "おかあさんがお医者さんに連れて行ってくれた。お薬をもらって、ゆっくり休めば明日には元気になりそう。",
        comment: { speaker: "mother", body: "明日には元気になるよ、頑張ったね" },
      });
      return;
    }
    // 自宅療養：発動初日 / 継続日でモーダルを使い分け
    if (isInfectionFirstDay) {
      enqueueMorningEventModal({
        art: "🤧",
        title: "風邪をひいてしまった",
        desc: `保育園で風邪をもらってきたみたい。${player._infectionRemainingDays}日間はおうちでゆっくり…`,
        effects: [
          { label: "余剰時間",    delta: -8,                              unit: "h" },
          { label: "感染症日数",  delta: player._infectionRemainingDays,  unit: "日" },
        ],
        comment: { speaker: "mother", body: "ゆっくり休もうね、すぐ良くなるよ" },
      });
    } else {
      enqueueMorningEventModal({
        art: "💪",
        title: "風邪、まだ完全には治らない",
        desc: `まだ熱があるみたい。今日もおうちでお休みだ…（残り ${player._infectionRemainingDays + 1}日）`,
        effects: [
          { label: "余剰時間", delta: -8, unit: "h" },
        ],
        comment: { speaker: "father", body: "焦らず、ゆっくりね" },
      });
    }
    return;
  }

  // 2. 親遣い遠出抽選
  const outingRate = isWeekend ? 0.40 : 0.02;
  if (Math.random() < outingRate) {
    // parental_outing スコープのイベントからランダム選択
    const outings = (EVENTS_PARENTAL_OUTING || []);
    if (outings.length === 0) return;
    const totalW = outings.reduce((a, o) => a + (o.weight || 1), 0);
    let r = Math.random() * totalW;
    let picked = outings[0];
    for (const o of outings) {
      r -= (o.weight || 1);
      if (r <= 0) { picked = o; break; }
    }
    player._specialDayMode = "outing";
    player._pendingOuting = picked;
    // 素養加算を即時適用（朝のうちに先取り。実体験は親遣いとして提示）
    const effects = [];
    if (picked.effect) {
      for (const [k, v] of Object.entries(normalizeGainToSoyou(picked.effect))) {
        if (SOYOU_KEYS.includes(k)) {
          player.soyou[k] = (player.soyou[k] || 0) + v;
          effects.push({ label: SOYOU_META[k]?.name || k, delta: v });
        }
      }
    }
    // @spec SPEC-056 §2 トースト → モーダル化
    enqueueMorningEventModal({
      art: picked.icon || "🎒",
      title: picked.name ? `${picked.name}に行ってきた！` : (picked.text || "今日は遠出！"),
      desc: picked.text || "おとうさん・おかあさんと一緒に出かけた一日",
      effects,
      comment: { speaker: "father", body: "今日はたくさん見つけられたね" },
    });
    return;
  }

  player._specialDayMode = null;
}

/**
 * @spec SPEC-026 §5.3 §5.4 チュートリアル境界日の介入を組み立てる。
 * Day 8 到達時と Day 15 到達時に 1 回だけ表示する。
 */
function collectTutorialBoundaryInterrupts() {
  const seen = player._tutorialBoundariesSeen || {};
  const interrupts = [];
  if (player.day === 8 && !seen.day8) {
    seen.day8 = true;
    interrupts.push({
      icon: "🏫",
      title: "月曜日から保育園！",
      body: "今日から保育園が始まります。いろんな遊びや、お友達との出会いがありますよ。",
    });
  }
  if (player.day === 15 && !seen.day15) {
    seen.day15 = true;
    interrupts.push({
      icon: "⏩",
      title: "スキップ機能が使えるようになった！",
      body: "1日の終わりのサマリ画面で、週末までや明日の夜までまとめて時間を進められるようになりました。",
    });
  }
  player._tutorialBoundariesSeen = seen;
  return interrupts;
}

// =========================================================================
// @spec docs/specs/SPEC-025-game-tempo.md §5, §6, §7, §8 ゲームテンポ設計（Option A）
// =========================================================================

/**
 * @screen S8 情熱プロファイル選択
 * @spec SPEC-025 §9.1
 */
let _pendingPassionProfileId = null;
function renderPassionProfileScreen() {
  _pendingPassionProfileId = null;
  const list = byId("passion-list");
  list.innerHTML = PASSION_PROFILES.map((p) => `
    <button class="passion-card" data-profile="${p.id}">
      <div class="passion-card-icon">${p.icon}</div>
      <div class="passion-card-body">
        <div class="passion-card-title">${p.label}</div>
        <div class="passion-card-desc">${p.description}</div>
      </div>
    </button>
  `).join("");
  for (const el of list.querySelectorAll(".passion-card")) {
    el.addEventListener("click", () => {
      _pendingPassionProfileId = el.dataset.profile;
      for (const c of list.querySelectorAll(".passion-card")) c.classList.remove("selected");
      el.classList.add("selected");
      byId("btn-confirm-passion").disabled = false;
    });
  }
  byId("btn-confirm-passion").disabled = true;
}

function confirmPassionProfile() {
  if (!_pendingPassionProfileId) return;
  player.passionProfileId = _pendingPassionProfileId;
  toast("選んだよ！自動で遊ぶ方針をセットしました");
  // 選んだら自動モード ON を既定とする（SPEC-025 §5.5）
  player.autoMode = true;
  goChooseFromToday();
}

/**
 * @spec SPEC-025 §5.4 自動選択アルゴリズム
 * 情熱プロファイルとスキルLvから、今遊ぶべき遊びを選ぶ。
 */
function pickAutoPlay() {
  const profile = PASSION_PROFILES.find((p) => p.id === player.passionProfileId);
  const preferred = profile ? profile.preferredCategories : [];

  const available = PLAYS
    .map((p) => ({ play: p, avail: isPlayAvailable(p) }))
    .filter(({ avail }) => !avail.isHidden && avail.ok);

  if (available.length === 0) return null;

  // スコア計算
  const scored = available.map(({ play }) => {
    const cats = play.categories || [];
    const overlap = cats.filter((c) => preferred.includes(c)).length;
    let skillAvg = 0;
    if (cats.length > 0) {
      const sum = cats.reduce((a, c) => a + ((player.skills[c] && player.skills[c].lv) || 1), 0);
      skillAvg = sum / cats.length;
    }
    const unlockBonus = (play.unlockRequired && player.unlockedPlays.includes(play.id)) ? 5 : 0;
    const jitter = Math.random() * 2;
    const score = overlap * 10 + skillAvg * 0.5 + unlockBonus + jitter;
    return { play, score };
  });

  scored.sort((a, b) => b.score - a.score);
  const top = scored.slice(0, 3);
  // 重み付き抽選（上位 3 からスコア比で選ぶ）
  const total = top.reduce((s, x) => s + x.score, 0) || 1;
  let r = Math.random() * total;
  for (const x of top) {
    r -= x.score;
    if (r <= 0) return x.play;
  }
  return top[0].play;
}

/**
 * @spec SPEC-025 §5.5 自動／手動モードの切替
 */
function toggleAutoMode() {
  // @spec SPEC-026 §5.2 Phase 0 は自動モード封印
  if (tutorialPhase(player.day) === "phase0") {
    toast("自動モードは2週目から使えるようになります");
    return;
  }
  if (player.autoMode) {
    // 手動へ切替
    player.autoMode = false;
    stopAutoLoop();
    toast("手動モードに切り替えました");
    goChooseFromToday();
  } else {
    player.autoMode = true;
    toast("自動モードに切り替えました");
    goChooseFromToday();
  }
}

/**
 * @spec SPEC-025 §5.5, §6
 * 自動モード時に S2 画面を自動進行の演出で表示する。
 */
let _autoTimer = null;
function startAutoLoop() {
  stopAutoLoop();
  // 表示切替
  // @spec SPEC-034 §5.1 起床ヘッダー・choose-prompt は v2 で廃止済みのため、
  //   存在する要素だけ null ガード付きで hidden に切り替える（存在しない要素で
  //   TypeError にならないようにする）。
  const wh = byId("wakeup-header"); if (wh) wh.hidden = true;
  const pv = byId("preview");       if (pv) pv.hidden = true;
  const pp = byId("preview-placeholder"); if (pp) pp.hidden = true;
  const cp = byId("choose-prompt"); if (cp) cp.hidden = true;
  const ap = byId("auto-progress"); if (ap) ap.hidden = false;
  const cb = byId("btn-confirm-play");
  if (cb) {
    cb.disabled = true;
    cb.textContent = "自動進行中…";
  }

  // まず即座に 1 ターン目
  runAutoTurn();
}
function stopAutoLoop() {
  if (_autoTimer) { clearTimeout(_autoTimer); _autoTimer = null; }
  const ap = byId("auto-progress");
  if (ap) ap.hidden = true;
}

/**
 * @spec SPEC-025 §6 自動 1 ターンの処理
 * 遊びを選び、軽量な演出とともに finalize して結果を蓄積。
 * 介入イベント（解禁・Lvアップ・ステージ変化・体力ゼロ）が発生したら停止。
 */
function runAutoTurn() {
  if (!player.autoMode) return;

  // ハイライトバッファの初期化
  initAutoHighlightIfNeeded();
  // @spec SPEC-025 §7.1 日の終わりサマリ用スナップショット（起床時に 1 回）
  initDaySnapshotIfNeeded();

  const play = pickAutoPlay();
  if (!play) {
    // 今遊べるものがない → 手動へフォールバック
    toast("今遊べるものがない…手動に戻します");
    player.autoMode = false;
    stopAutoLoop();
    goChooseFromToday();
    return;
  }

  // バナーの見た目更新
  byId("auto-progress-icon").textContent = play.icon;
  byId("auto-progress-title").textContent = `${play.name}で遊んでいる…`;
  byId("auto-progress-sub").textContent = "じっくり楽しんでいる";
  byId("auto-progress-bar").style.width = "0%";
  // プログレスバーアニメ（0 → 100% を 500ms で）
  requestAnimationFrame(() => {
    requestAnimationFrame(() => {
      byId("auto-progress-bar").style.transition = "width 500ms ease-out";
      byId("auto-progress-bar").style.width = "100%";
    });
  });

  // スキル Lv の before を記録
  for (const c of (play.categories || [])) {
    ensureSkill(c);
    if (!player._autoHighlight.skillsBefore[c]) {
      player._autoHighlight.skillsBefore[c] = { lv: player.skills[c].lv, exp: player.skills[c].exp };
    }
  }

  // 500ms 後に finalize 相当の処理
  _autoTimer = setTimeout(() => {
    const stageBefore = resolveLifeStage(player.age);
    const unlockedBefore = [...player.unlockedPlays];

    // finalize は描写フェーズ無しで実行するための軽量版
    autoFinalizePlay(play);

    // ハイライト集約（週単位）
    const h = player._autoHighlight;
    h.playsById[play.id] = (h.playsById[play.id] || 0) + 1;
    h.turnCount += 1;
    h.dayEnd = player.day;

    // @spec SPEC-025 §7.1 日の終わりサマリへも集約
    const ds = player._daySnapshot;
    ds.playsById[play.id] = (ds.playsById[play.id] || 0) + 1;

    // 介入イベント判定
    const interruptQueue = [];
    // 解禁
    const newUnlocks = player.unlockedPlays.filter((id) => !unlockedBefore.includes(id));
    for (const id of newUnlocks) {
      const p = PLAYS.find((x) => x.id === id);
      if (!p) continue;
      interruptQueue.push({
        icon: p.icon,
        title: "新しい遊びを覚えた！",
        body: `${p.name} が遊びツリーに追加されたよ。`,
      });
      h.discoveries.push(`${p.icon} ${p.name}`);
      ds.discoveries.push(`${p.icon} ${p.name}`);
    }
    // ライフステージ切替
    const stageAfter = resolveLifeStage(player.age);
    if (stageBefore && stageAfter && stageBefore.id !== stageAfter.id) {
      interruptQueue.push({
        icon: stageAfter.icon,
        title: "ライフステージが変わった！",
        body: `${stageAfter.label} に進んだよ。`,
      });
    }
    // コアタイムに到達 or 余剰 0 → 自動ループは一旦停止（通常の画面遷移に任せる）
    const now = player.clockHour + player.clockMinute / 60;
    const coreTime = stageAfter ? stageAfter.coreTime : null;
    const reachedCore = coreTime && stageAfter.implemented && !player.coreTimeDoneToday && now >= coreTime.startHour;
    const spentAll = player.spareHours <= 0;
    // 体力ゼロ（強制睡眠・終了）は finalize 内で遷移するのでここでは触らない

    // @spec SPEC-025 §6.2 自動モード中は S6 コアタイム画面を出さず、裏で処理して介入イベントだけ収集
    if (reachedCore) {
      const coreInterrupts = autoAdvanceCoreTime();  // S6 を裏で消化し、発見イベントを返す
      interruptQueue.push(...coreInterrupts);
    }

    // @spec SPEC-026 §5.2.1 チュートリアル発見があれば介入キューに先頭で追加（必ず見せる）
    if (player._pendingTutorialInterrupts && player._pendingTutorialInterrupts.length > 0) {
      interruptQueue.unshift(...player._pendingTutorialInterrupts);
      player._pendingTutorialInterrupts = [];
    }

    // 介入イベントがあれば順にモーダル表示
    if (interruptQueue.length > 0) {
      showInterruptQueue(interruptQueue, () => {
        // 介入終了後の分岐：余剰なしなら日の終わりサマリへ、余剰ありなら次ターンへ
        if (player.spareHours <= 0) {
          stopAutoLoop();
          goSleep();  // 自動モード中は goSleep→renderDaySummary に分岐
        } else {
          runAutoTurn();
        }
      });
      return;
    }

    // 区切り判定
    if (player.spareHours <= 0) {
      stopAutoLoop();
      goSleep();  // 自動モード中は goSleep→renderDaySummary
      return;
    }
    // @spec SPEC-025 §7.2.0 週境界は goSleep→renderDaySummary の後で showHighlight を挟む
    // 次のターンへ
    _autoTimer = setTimeout(runAutoTurn, 350);
  }, 650);
}

/**
 * @spec SPEC-025 §6.2 自動モード中の S6 保育園を裏で消化する。
 * renderCoreTime() は副作用で経験値や解禁を反映するが、画面遷移せずに実行する。
 * @returns {Array} 発生した介入イベント（新解禁など）
 */
function autoAdvanceCoreTime() {
  const stage = resolveLifeStage(player.age);
  const coreTime = stage ? stage.coreTime : null;
  if (!coreTime || !stage.implemented) return [];

  const unlockedBefore = [...player.unlockedPlays];
  // 時刻を startHour に揃えておく
  if (player.clockHour + player.clockMinute / 60 < coreTime.startHour) {
    player.clockHour = Math.floor(coreTime.startHour);
    player.clockMinute = Math.round((coreTime.startHour % 1) * 60);
  }
  // renderCoreTime() は裏で呼び、画面には showScreen しない
  renderCoreTime(stage);
  // ハイライトバッファに発見を追記
  const h = player._autoHighlight;
  const ds = player._daySnapshot;
  const interrupts = [];
  const newUnlocks = player.unlockedPlays.filter((id) => !unlockedBefore.includes(id));
  for (const id of newUnlocks) {
    const p = PLAYS.find((x) => x.id === id);
    if (!p) continue;
    h.discoveries.push(`${p.icon} ${p.name}（${stage.label}）`);
    if (ds) ds.discoveries.push(`${p.icon} ${p.name}（${stage.label}）`);
    interrupts.push({
      icon: p.icon,
      title: `${stage.label}で発見！`,
      body: `${p.name} を覚えたよ。遊びツリーに追加されました。`,
    });
  }
  h.dayEnd = player.day;
  return interrupts;
}

/**
 * @spec SPEC-025 §6 描写フェーズをスキップして finalize と同じ結果反映だけを行う。
 * 構造上は finalizePlay の再利用が難しいので、同等のロジックをコンパクトに再実装する。
 */
function autoFinalizePlay(play) {
  pendingPlay = play;
  pendingGain = null;
  pendingEvent = null;

  // 倍率計算
  const skillBoost = skillBoostMultiplier(play);
  const lowStamMul = lowStaminaMultiplier(play);
  const gainBoost  = skillBoost * lowStamMul;

  // 経験値計算（SPEC-033 §5 旧キー自動変換）
  const gain = {};
  for (const [k, v] of Object.entries(normalizeGainToSoyou(play.gain))) gain[k] = Math.round(v * gainBoost);
  if (play.friendBonusPerPerson) {
    const mainKey = majorGainCategory(play.gain) || "social";
    const bonus = Math.round(play.friendBonusPerPerson * player.friends * gainBoost);
    gain[mainKey] = (gain[mainKey] || 0) + bonus;
  }

  const mainCat = majorGainCategory(play.gain);
  let passionGain = 3;
  if (mainCat && player.lastPlayCategory === mainCat) {
    passionGain += 2 + player.consecutiveCategoryCount;
  }
  passionGain = Math.floor(passionGain * lowStamMul);

  // スキル経験値
  const cats = play.categories || [];
  const baseExpTotal = Object.values(play.gain).reduce((a, b) => a + b, 0);
  const skillExpPerCategory = cats.length > 0
    ? Math.round((baseExpTotal * gainBoost) / cats.length)
    : 0;
  for (const c of cats) {
    ensureSkill(c);
    player.skills[c].exp += skillExpPerCategory;
    player.skills[c].lv = skillLvFromExp(player.skills[c].exp);
  }

  // 原体験反映
  for (const [k, v] of Object.entries(gain)) {
    player.exp[k] = (player.exp[k] || 0) + v;
  }

  // ステータス反映
  player.stamina = Math.max(0, player.stamina - (play.staminaCost || 0));
  player.money = Math.max(0, player.money - (play.moneyCost || 0));
  player.passion += passionGain;

  // 時間経過
  const h = Math.floor(play.timeCost);
  const m = Math.round((play.timeCost - h) * 60);
  player.clockHour += h;
  player.clockMinute += m;
  if (player.clockMinute >= 60) { player.clockHour += 1; player.clockMinute -= 60; }
  player.spareHours = Math.max(0, +(player.spareHours - play.timeCost).toFixed(1));
  player.dailyPlays += 1;

  // 没頭連続
  if (mainCat === player.lastPlayCategory) {
    player.consecutiveCategoryCount += 1;
  } else {
    player.consecutiveCategoryCount = 0;
    player.lastPlayCategory = mainCat;
  }

  // autoFinalizePlay 側の _daySnapshot 集約は呼び出し元 runAutoTurn で行うため、ここでは追加しない

  // @spec SPEC-026 §5.2.1 チュートリアル発見（絵本→滑り台→砂場の段階解禁）
  const tutDiscovered = checkTutorialDiscoveries(play.id);
  if (tutDiscovered && tutDiscovered.length > 0) {
    // 自動モード中でも、チュートリアル発見は必ずモーダル通知したい
    // autoFinalizePlay の呼び出し元（runAutoTurn）で介入キューに追加されるよう、バッファに積む
    player._pendingTutorialInterrupts = (player._pendingTutorialInterrupts || []).concat(tutDiscovered);
  }

  renderHUD();

  // 体力ゼロ時は共通フローに乗せる（強制睡眠／強制終了）
  if (player.stamina <= 0) {
    stopAutoLoop();
    handleStaminaDepleted();
  }
}

function initAutoHighlightIfNeeded() {
  const h = player._autoHighlight;
  if (!h || h.turnCount === 0) {
    // @spec SPEC-025 §7.2 既知スキル全体のスナップショット
    const skillsSnapshot = {};
    for (const c of Object.keys(player.skills)) {
      skillsSnapshot[c] = { lv: player.skills[c].lv, exp: player.skills[c].exp };
    }
    player._autoHighlight = {
      playsById: {},
      skillsBefore: skillsSnapshot,
      expBefore: { ...player.exp },
      discoveries: [],
      dayStart: player.day,
      dayEnd: player.day,
      turnCount: 0,
    };
  }
}

/**
 * @spec SPEC-025 §7.1 日の終わりサマリ用スナップショット
 * その日の起床時点（dailyPlays===0）で 1 回だけ撮る。
 */
function initDaySnapshotIfNeeded() {
  const s = player._daySnapshot;
  if (!s || s.dayAtStart !== player.day) {
    // スキル全体のスナップショット
    const skillsStart = {};
    for (const c of Object.keys(player.skills)) {
      skillsStart[c] = { lv: player.skills[c].lv, exp: player.skills[c].exp };
    }
    player._daySnapshot = {
      dayAtStart: player.day,
      expStart: { ...player.exp },
      skillsStart,
      playsById: {},
      discoveries: [],
      staminaStart: player.stamina,
      friendsStart: player.friends,
      moneyStart: player.money,
      passionStart: player.passion,
    };
  }
}

/**
 * @spec SPEC-025 §6 介入モーダル
 */
let _interruptQueue = [];
let _interruptThen = null;
function showInterruptQueue(queue, then) {
  _interruptQueue = queue.slice();
  _interruptThen = then;
  showNextInterrupt();
}
function showNextInterrupt() {
  if (_interruptQueue.length === 0) {
    const cb = _interruptThen;
    _interruptThen = null;
    byId("interrupt-overlay").hidden = true;
    if (cb) cb();
    return;
  }
  const item = _interruptQueue.shift();
  byId("interrupt-icon").textContent = item.icon;
  byId("interrupt-title").textContent = item.title;
  byId("interrupt-body").textContent = item.body;
  byId("interrupt-overlay").hidden = false;
}
function closeInterrupt() {
  showNextInterrupt();
}

/**
 * @spec SPEC-025 §7, §9.4 ハイライト集約画面
 */
/**
 * @screen S9 ウィークリーハイライト
 * @spec SPEC-025 §7.2, §9.4
 * 原体験・スキルを差分ハイライト付きゲージで描画。
 */
function showHighlight() {
  const h = player._autoHighlight;
  // @spec SPEC-034 §6 自動モード解禁前は「手動に切り替え」ボタンを隠す
  const switchBtn = byId("btn-highlight-switch-manual");
  if (switchBtn) {
    switchBtn.hidden = !(player.autoMode && tutorialPhase(player.day) !== "phase0");
  }
  // @spec SPEC-001 §5.7 第N週の範囲表示
  const fw = fiscalWeekInfo(h.dayEnd);
  byId("highlight-range").textContent = `${fw.weekNumber}週（${fw.rangeLabel}） / ${player.age}歳`;

  // @spec SPEC-035 §7.3 遊んだ回数をピル形式で
  renderPlayPills(byId("highlight-play-pills"), h.playsById || {});

  // @spec SPEC-035 §7.3 素養カード
  renderSoyouResultList(byId("highlight-soyou-list"), h.expBefore || {}, player.soyou || {});
  const hlSoyouCard = byId("highlight-soyou-card");
  if (hlSoyouCard) {
    const host = byId("highlight-soyou-list");
    hlSoyouCard.hidden = !(host && host.dataset.hasAny === "1");
  }

  // @spec SPEC-035 §6 スキル行（1 行 × N）
  const skillsBeforeMap = h.skillsBefore || {};
  const changedCats = Object.keys(player.skills).filter((c) => {
    const a = player.skills[c];
    const b = skillsBeforeMap[c];
    return a && (!b || a.exp > (b.exp || 0));
  });
  const hlSkillRows = renderSkillLines(byId("highlight-skill-lines"), changedCats, skillsBeforeMap);
  const hlSkillCard = byId("highlight-skill-lines-card");
  if (hlSkillCard) hlSkillCard.hidden = hlSkillRows === 0;

  const discCard = byId("highlight-discoveries-card");
  if (h.discoveries.length > 0) {
    discCard.hidden = false;
    byId("highlight-discoveries").innerHTML = h.discoveries.map((d) => `<li><span>${d}</span><b>覚えた！</b></li>`).join("");
  } else {
    discCard.hidden = true;
  }

  showScreen("screen-highlight");
  // @spec SPEC-025 §7.2.0 ハイライト表示したらバッファをリセットして次区間の開始地点を更新
  //   スキルも現時点の Lv/exp を保存しておく（次週の差分計算用）。
  const skillsReset = {};
  for (const c of Object.keys(player.skills)) {
    skillsReset[c] = { lv: player.skills[c].lv, exp: player.skills[c].exp };
  }
  player._autoHighlight = {
    playsById: {},
    skillsBefore: skillsReset,
    expBefore: { ...player.exp },
    discoveries: [],
    dayStart: player.day,
    dayEnd: player.day,
    turnCount: 0,
  };
}

/**
 * @spec SPEC-025 §7.1.3 スキップ継続
 * S10 画面から「週末まで」「明日の夜まで」を押したときの共通処理。
 *  - _skipRemainingDays に残り日数をセット（0 以上）
 *  - 直ちに sleep("normal") を呼んで翌朝へ進む。そこから自動ループが回る
 *  - goSleep 側で _skipRemainingDays をデクリメントし、0 の時に S10 を見せる
 */
function skipToNextDaySummary(days) {
  if (!player.autoMode) {
    player.autoMode = true;  // 切替保険
  }
  // days 日進むが、この直後の 1 回は「今から夜までのスキップ」なので days-1 を残す
  player._skipRemainingDays = Math.max(0, days - 1);
  player._skipTarget = days >= 5 ? "weekend" : "tomorrow-night";
  // @spec SPEC-047 §7.3 スキップの到達日を記録。この日の朝までは親遣い抽選を抑制する。
  //   例：Day 1（水）で「週末までスキップ」→ daysUntilWeekend(1)=4 → _skipTargetDay=5（日）
  //   スキップ中（Day 2-5）の朝は全て maybeResolveMorningLocation で home 固定。
  //   Day 5 の夜に S10 → S9 を見る正常フロー。
  player._skipTargetDay = player.day + days;
  // @spec SPEC-025 §7.2.0 スキップ開始直後に週境界なら S9 を先に見せてから sleep
  if (consumeWeeklyHighlightIfPending()) {
    // S9 表示中。続ける押下時に自動で goChooseFromToday → 翌日ループに戻る
    // ただし skip 継続中なので、continueAuto から直接 sleep を呼ぶ必要がある
    player._skipAfterWeekly = true;
    return;
  }
  // 就寝 → 翌朝 → 自動ループ再開
  sleep("normal");
}

/**
 * @screen S10 日の終わりサマリ
 * @spec SPEC-025 §7.1, §9.5
 *
 * 前日の起床時点のスナップショット（_daySnapshot）と現在値を比較して、
 * 1 日の成長を差分ハイライト付きゲージで表示する。
 * フッターは「週末までスキップ」「明日の夜までスキップ」「手動に切り替え」の 3 択。
 */
function renderDaySummary() {
  const snap = player._daySnapshot || {};
  // @spec SPEC-034 §6 自動モード解禁前（phase0）は「手動に切り替え」を隠す
  const switchBtn = byId("btn-day-summary-switch-manual");
  if (switchBtn) {
    switchBtn.hidden = !(player.autoMode && tutorialPhase(player.day) !== "phase0");
  }
  // @spec SPEC-001 §5.7 日付表記
  byId("day-summary-range").textContent =
    `${formatDayWithWeek(player.day)} / ${player.age}歳`;

  // @spec SPEC-035 §7.2 今日の遊びをピル形式で簡素に
  renderPlayPills(byId("day-summary-play-pills"), snap.playsById || {});

  // @spec SPEC-035 §7.2 素養カード（差分のあるものだけ）
  const beforeSoyou = snap.expStart || {};
  renderSoyouResultList(byId("day-summary-soyou-list"), beforeSoyou, player.soyou || {});
  const soyouCard = byId("day-summary-soyou-card");
  if (soyouCard) {
    const host = byId("day-summary-soyou-list");
    soyouCard.hidden = !(host && host.dataset.hasAny === "1");
  }

  // @spec SPEC-035 §6 スキル行（差分のあるスキルだけ 1 行ずつ）
  const skillsStart = snap.skillsStart || {};
  const changedCats = Object.keys(player.skills).filter((c) => {
    const a = player.skills[c];
    const b = skillsStart[c];
    return a && (!b || a.exp > (b.exp || 0));
  });
  const dsSkillRows = renderSkillLines(byId("day-summary-skill-lines"), changedCats, skillsStart);
  const dsSkillCard = byId("day-summary-skill-lines-card");
  if (dsSkillCard) dsSkillCard.hidden = dsSkillRows === 0;

  // @spec SPEC-035 §4.1 ステータスカード・時間カードは削除。ヘッダーで表現。

  // 学んだこと
  const discCard = byId("day-summary-discoveries-card");
  const discoveries = (snap.discoveries || []);
  if (discoveries.length > 0) {
    discCard.hidden = false;
    byId("day-summary-discoveries").innerHTML = discoveries.map((d) => `<li><span>${d}</span><b>覚えた！</b></li>`).join("");
  } else {
    discCard.hidden = true;
  }

  // @spec SPEC-027 連絡帳セクション
  renderRenrakuchoForToday(snap);

  // @spec SPEC-026 §5.5 スキップボタンの出し分け
  const skipUnlocked = isSkipUnlocked();
  byId("day-summary-skip-row").hidden = !skipUnlocked;
  byId("day-summary-skip-row2").hidden = !skipUnlocked;
  byId("day-summary-continue-row").hidden = skipUnlocked;
  byId("day-summary-tutorial-hint").hidden = skipUnlocked;
  if (!skipUnlocked) {
    // phase0/1：スキップ機能はまだ解禁されていない旨ヒント
    const phase = tutorialPhase(player.day);
    const remainDays = phase === "phase0" ? (15 - player.day) : (15 - player.day);
    byId("day-summary-tutorial-hint").textContent =
      `⏩ スキップ機能は3週目（あと ${Math.max(0, remainDays)} 日）から使えるようになります`;
  }
}

/**
 * @spec docs/specs/SPEC-027-renrakucho.md §5
 * その日のスナップショットから連絡帳カードを組み立てる。
 * 対象ライフステージ（保育園 1-4, 幼稚園 5-6）以外では非表示。
 */
function renderRenrakuchoForToday(snap) {
  const card = byId("day-summary-renrakucho");
  if (!card) return;
  const stage = resolveLifeStage(player.age);
  const isNursery = stage && stage.id === "nursery";
  const isKinder  = stage && stage.id === "kindergarten";
  if (!isNursery && !isKinder) {
    card.hidden = true;
    return;
  }
  card.hidden = false;

  // @spec SPEC-027 §1.1 §5.4.1 Phase 0 は「おうち日報」スタイル（先生コメントなし）
  const phase0 = (tutorialPhase(player.day) === "phase0");

  // タイトル
  byId("renrakucho-title").textContent = phase0
    ? "🏠 おうちの 1 日"
    : (isNursery ? "🏫 保育園 れんらくちょう" : "🏫 幼稚園 れんらくちょう");

  // Phase 0 は先生セクションを隠す
  byId("renrakucho-entry-teacher").hidden = phase0;

  // @spec SPEC-001 §5.7 年月日（曜日）＋第何週（期間）
  byId("renrakucho-date").textContent = formatDayWithWeek(player.day);

  // 出席シール
  const stickers = Object.entries(snap.playsById || {})
    .sort((a, b) => b[1] - a[1])
    .slice(0, 6)
    .map(([id]) => {
      const p = PLAYS.find((x) => x.id === id);
      return p ? `<span class="sticker" title="${p.name}">${p.icon}</span>` : "";
    }).join("");
  byId("renrakucho-stickers").innerHTML = stickers || `<span class="sticker">🌙</span>`;

  // 主役プレイ（最多回数のもの）
  const topEntry = Object.entries(snap.playsById || {})
    .sort((a, b) => b[1] - a[1])[0];

  // 先生コメント
  let teacher = "今日も元気に過ごしていました☺";
  if (topEntry) {
    const [topPlayId] = topEntry;
    const p = PLAYS.find((x) => x.id === topPlayId);
    if (p && p.renrakuchoTeacher) teacher = p.renrakuchoTeacher;
  }
  // 発見があれば一文追加
  if ((snap.discoveries || []).length > 0) {
    teacher += ` 今日は「${snap.discoveries[0]}」を見つけて目を輝かせていました。`;
  }
  byId("renrakucho-teacher").textContent = teacher;

  // 家庭コメント（プロファイルに応じたテンプレから選択）
  byId("renrakucho-parent").textContent = buildParentComment(snap);
}

/**
 * @spec docs/specs/SPEC-027-renrakucho.md §5.3
 * 家庭コメント。プレイヤーのプロファイル（SPEC-025）と、伸びたスキルから選ぶ。
 */
function buildParentComment(snap) {
  // そのスナップショット期間で最も伸びたスキル（カテゴリ）を特定
  let bestCat = null;
  let bestDelta = 0;
  for (const c of Object.keys(snap.skillsStart || {})) {
    const a = player.skills[c];
    const b = snap.skillsStart[c];
    if (!a || !b) continue;
    const d = a.exp - b.exp;
    if (d > bestDelta) { bestDelta = d; bestCat = c; }
  }

  // 代表プレイの parent テンプレを使う（主役最多プレイ）
  const topEntry = Object.entries(snap.playsById || {})
    .sort((a, b) => b[1] - a[1])[0];
  if (topEntry) {
    const p = PLAYS.find((x) => x.id === topEntry[0]);
    if (p && p.renrakuchoParent) return p.renrakuchoParent;
  }

  // フォールバック：カテゴリに応じた一般コメント
  if (bestCat) {
    const c = CATEGORIES[bestCat];
    if (c) return `最近は「${c.label}」に興味があるみたいです。この調子で伸びてほしいです。`;
  }
  return "今日は早く寝てくれそうです。";
}

/** ゲーム内 day を擬似日付ラベルに変換 */
/**
 * @spec SPEC-001 §5.7 日付表記・Fiscal Year / Fiscal Week
 * Day を Date（UTC 固定で扱う）に変換する。Day 1 = 2026-04-01（水）
 * タイムゾーンに依存しないよう、全ての日付計算で getUTCFullYear/Month/Date/Day を使う。
 */
function fakeDateForDay(day) {
  // UTC 基準で 2026-04-01 00:00 を開始点とする
  const base = Date.UTC(2026, 3, 1);  // month は 0-indexed（3 = April）
  return new Date(base + (day - 1) * 24 * 60 * 60 * 1000);
}
const WEEK_JP = ["日", "月", "火", "水", "木", "金", "土"];

/** 「2026年4月1日（水）」形式 */
function formatFullDate(day) {
  const d = fakeDateForDay(day);
  return `${d.getUTCFullYear()}年${d.getUTCMonth() + 1}月${d.getUTCDate()}日（${WEEK_JP[d.getUTCDay()]}）`;
}

/**
 * Fiscal Week 情報：今の週が fiscal year 内の第何週目か、週の範囲はいつか。
 * - fiscal year: 4/1〜翌3/31
 * - 第1週 = fiscal year 開始日（4/1）を含む週。週は月曜起点とする
 * - 戻り値: { weekNumber, rangeStart: Date, rangeEnd: Date, rangeLabel: string }
 *     rangeLabel は "4/1-4/5" のような形式
 */
function fiscalWeekInfo(day) {
  const d = fakeDateForDay(day);
  // fiscal year 開始日（今日が 1-3月なら前年4月1日、4-12月なら今年4月1日）
  const yearStart = (d.getUTCMonth() < 3)
    ? new Date(Date.UTC(d.getUTCFullYear() - 1, 3, 1))
    : new Date(Date.UTC(d.getUTCFullYear(), 3, 1));
  // 月曜起点にするため、yearStart を含む週の月曜を求める（4/1 が水曜なら月曜は 3/30）
  const ysDow = yearStart.getUTCDay(); // 0=日..6=土
  const toMon = (ysDow === 0) ? 6 : (ysDow - 1); // 月曜までの戻り日数
  const firstWeekMon = new Date(yearStart.getTime() - toMon * 24 * 60 * 60 * 1000);

  // 今日が属する週の月曜を求める
  const dDow = d.getUTCDay();
  const toMonToday = (dDow === 0) ? 6 : (dDow - 1);
  const thisMon = new Date(d.getTime() - toMonToday * 24 * 60 * 60 * 1000);

  // 週番号：(thisMon - firstWeekMon) / 7 + 1
  const weekNumber = Math.round((thisMon.getTime() - firstWeekMon.getTime()) / (7 * 24 * 60 * 60 * 1000)) + 1;

  // 週の範囲：月曜〜日曜
  //   ただし第1週は fiscal year 開始日（4/1）から始まる短縮週にする
  const rangeStart = (weekNumber === 1) ? yearStart : thisMon;
  const rangeEnd = new Date(thisMon.getTime() + 6 * 24 * 60 * 60 * 1000);
  const mm = (dt) => `${dt.getUTCMonth() + 1}/${dt.getUTCDate()}`;
  const rangeLabel = `${mm(rangeStart)}-${mm(rangeEnd)}`;

  return { weekNumber, rangeStart, rangeEnd, rangeLabel };
}

/**
 * 「2026年4月1日（水） / 1週（4/1-4/5）」形式のフル表記
 */
function formatDayWithWeek(day) {
  const full = formatFullDate(day);
  const fw = fiscalWeekInfo(day);
  return `${full} / ${fw.weekNumber}週（${fw.rangeLabel}）`;
}

/**
 * @spec SPEC-025 §7.1.4 今週の週末（日曜）まで何日あるか
 * 今が日曜なら 7（次の日曜まで）を返す。月曜なら 6、土曜なら 1。
 */
function daysUntilWeekend(day) {
  const dow = fakeDateForDay(day).getUTCDay(); // 0=日, 1=月, ..., 6=土
  if (dow === 0) return 7; // 日曜は次の日曜まで 7 日
  return 7 - dow;
}

/** 互換性維持：旧 fakeDateLabel はシンプルな日付のみを返す */
function fakeDateLabel(day) {
  return formatFullDate(day);
}

/**
 * @spec SPEC-025 §7.2.0 週境界ハイライトが保留中なら、ここで消費して S9 を表示する。
 * S9 表示できたら true を返し、呼び出し側はそこで処理を打ち切る。
 */
function consumeWeeklyHighlightIfPending() {
  if (!player._pendingWeeklyHighlight) return false;
  player._pendingWeeklyHighlight = false;
  // ハイライト実行前に、バッファの dayEnd を今日に合わせる
  const h = player._autoHighlight;
  if (h) h.dayEnd = player.day;
  showHighlight();
  return true;
}

// =========================================================================
// イベント配線
// =========================================================================

document.addEventListener("click", (e) => {
  const t = e.target.closest("[data-action]");
  if (!t || t.disabled) return;
  const a = t.dataset.action;
  switch (a) {
    case "close-coretime":
      closeCoreTime();
      break;
    case "close-tree":
      // @spec docs/specs/SPEC-023-play-tree.md §5.1 S7 → S2
      goChooseFromToday();
      break;
    case "close-record":
      // @spec docs/specs/SPEC-058-ui-design-prototypes.md §6 S17 → S2
      goChooseFromToday();
      break;
    case "confirm-passion":
      // @spec SPEC-025 §5.3
      confirmPassionProfile();
      break;
    case "continue-auto":
      // @spec SPEC-025 §9.4 / §7.2.0 §7.2.3 ハイライト後は必ず「翌朝」へ進む。
      //   S9 は週境界（日曜の夜）に表示されるため、続ける押下＝翌日（月曜）へ進む。
      //   以前は goChooseFromToday() を直接呼んでいたが、player.day が進まずに
      //   S2 が描画され、そこで「今日おわる」を押すとまた S10 → S9 のループに陥っていた。
      if (player._skipAfterWeekly) {
        player._skipAfterWeekly = false;
      }
      sleep("normal");
      break;
    case "skip-to-tomorrow-night":
      // @spec SPEC-025 §7.1.3 「明日の夜までスキップ」
      skipToNextDaySummary(1);
      break;
    case "skip-to-weekend":
      // @spec SPEC-025 §7.1.3 §7.1.4 「週末までスキップ」 = 今週の日曜まで
      skipToNextDaySummary(daysUntilWeekend(player.day));
      break;
    case "day-summary-continue":
      // @spec SPEC-026 §5.5 チュートリアル中のサマリ→次の日へ
      // @spec SPEC-025 §7.2.0 週境界なら次に週末ハイライトを挟む
      if (consumeWeeklyHighlightIfPending()) { /* S9 を表示中 */ }
      else { sleep("normal"); }
      break;
    case "travel-result-next":
      // @spec SPEC-047 §7.3 §7.4 移動結果から次画面（通常は S2／fullday なら S10）
      onTravelResultNext();
      break;
    case "mission-modal-next":
      // @spec SPEC-050 §5 ミッションモーダルの「つぎへ」
      showNextMissionDialog();
      break;
    case "attempt-prompt-yes":
      // @spec SPEC-055 §2 達成プロンプト『ちょうせんしてみる』
      onAttemptPromptYes();
      break;
    case "attempt-prompt-later":
      // @spec SPEC-055 §2 達成プロンプト『まだ、こんどにする』
      onAttemptPromptLater();
      break;
    case "switch-to-manual":
      // @spec SPEC-025 §5.5 / §7.1.3 手動に切替
      player.autoMode = false;
      player._skipRemainingDays = 0;
      player._skipTarget = null;
      player._skipTargetDay = 0;
      toast("手動モードに切り替えました");
      goChooseFromToday();
      break;
    case "goto-coretime":
      // @spec SPEC-003 §5.8 結果フェーズから「保育園へ行く」でコアタイムへ
      gotoCoreTimeFromResult();
      break;
    case "skip-playing":
      skipDescription();
      break;
    case "close-event":
      finalizePlay();
      break;
    case "event-modal-close":
      // @spec SPEC-056 §1 統一イベントモーダル close
      closeEventModal();
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

// =========================================================================
// @spec SPEC-030 タイトル画面 / SPEC-031 転生イントロ
// =========================================================================

/**
 * @spec SPEC-030 §5.2 新規ゲーム開始：player を初期化して転生イントロへ
 */
function startNewGame() {
  // プレイヤーを deep clone で初期化
  player = JSON.parse(JSON.stringify(DEFAULT_PLAYER));
  // @spec SPEC-033 §6 エイリアス（exp, passion）を再設定
  installSoyouAliases(player);
  player.stamina = Math.min(player.stamina, player.staminaCap);
  startIsekaiIntro();
}

/**
 * @spec SPEC-031 §6 転生イントロの状態
 * sceneIndex: 現在のシーン番号（0 〜 scenes.length-1）
 * stepIndex:  シーン内のメッセージ／ステップのインデックス
 * inputActive: 名前入力フェーズで advance をブロック
 * stampShown: 証明書シーンでハンコ演出済みか
 */
let isekaiState = {
  sceneIndex: 0,
  stepIndex: 0,
  inputActive: false,
  stampShown: false,
};

/** ランダムに異世界での主人公名を選ぶ */
function randomAvatarName(gender) {
  const arr = (NAMES && NAMES[gender]) ? NAMES[gender] : DEFAULT_NAMES.male;
  if (!arr || arr.length === 0) return "晃";
  return arr[Math.floor(Math.random() * arr.length)];
}

/** メッセージ内の {playerName} {avatarName} を player の値で置換 */
function interpolateMessage(text) {
  const map = {
    playerName: player && player.name,
    avatarName: player && player.avatarName,
  };
  return String(text || "").replace(/\{(\w+)\}/g, (_, key) => {
    if (Object.prototype.hasOwnProperty.call(map, key)) {
      return map[key] || `{${key}}`;
    }
    const v = player && player[key];
    return (v == null || v === "") ? `{${key}}` : v;
  });
}

function speakerLabel(speaker) {
  switch (speaker) {
    case "narration": return "（ナレーション）";
    case "mystery":   return "？？？";
    case "god":       return "？？？";
    case "player":    return player.name || "あなた";
    default:          return speaker || "";
  }
}

/** @spec SPEC-031 §4 転生イントロ開始 */
function startIsekaiIntro() {
  isekaiState = { sceneIndex: 0, stepIndex: 0, inputActive: false, stampShown: false };
  showScreen("screen-isekai");
  renderIsekaiCurrent();
}

/** 現在の sceneIndex / stepIndex に応じて画面を描画 */
function renderIsekaiCurrent() {
  const scenes = ISEKAI_SCENES;
  const scene = scenes[isekaiState.sceneIndex];
  const root = byId("screen-isekai");
  if (!scene) { finishIsekaiIntro(); return; }

  root.setAttribute("data-scene", scene.id);

  // 背景差し替え
  const bg = byId("isekai-bg");
  bg.className = "isekai-bg bg-" + (scene.bg || "dark");

  // 後光は scene2 のみ
  byId("isekai-halo").hidden = (scene.bg !== "halo");

  // 証明書は scene3 のみ
  const cert = byId("isekai-certificate");
  if (scene.bg === "certificate" && scene.certificate) {
    cert.hidden = false;
    byId("isekai-cert-title").textContent = scene.certificate.title || "転生証明書";
    const fieldsEl = byId("isekai-cert-fields");
    fieldsEl.innerHTML = (scene.certificate.fields || [])
      .map((f) => `<dt>${f.label}</dt><dd>${f.value}</dd>`).join("");
    byId("isekai-stamp-text").textContent = scene.certificate.stampText || "神";
    byId("isekai-stamp").classList.toggle("stamped", isekaiState.stampShown);
    byId("isekai-stamp").hidden = !isekaiState.stampShown;
    const promptText = isekaiState.stampShown
      ? (scene.certificate.afterStampPrompt || "タップで次へ")
      : (scene.certificate.prompt || "タップで承認");
    byId("isekai-speaker").textContent = "";
    byId("isekai-message").textContent = promptText;
  } else {
    cert.hidden = true;
  }

  // メッセージ or ステップの描画
  const items = scene.steps || scene.messages || [];
  if (scene.bg !== "certificate") {
    const item = items[isekaiState.stepIndex];
    if (!item) {
      // このシーンのメッセージは尽きた → 次のシーンへ
      advanceIsekai();
      return;
    }
    const inputRow = byId("isekai-input-row");
    if (item.type === "input") {
      // 名前入力フェーズ
      isekaiState.inputActive = true;
      byId("isekai-speaker").textContent = "";
      byId("isekai-message").textContent = (item.placeholder || "") + "（未入力なら自動で名前が決まります）";
      inputRow.hidden = false;
      const inp = byId("isekai-input");
      inp.placeholder = item.placeholder || "";
      inp.value = player.name || "";
      byId("isekai-input-btn").textContent = item.confirmLabel || "決定";
      byId("isekai-hint").classList.add("hidden");
      setTimeout(() => { try { inp.focus(); } catch (e) {} }, 50);
    } else {
      // 通常メッセージ
      isekaiState.inputActive = false;
      inputRow.hidden = true;
      byId("isekai-speaker").textContent = speakerLabel(item.speaker);
      byId("isekai-message").textContent = interpolateMessage(item.text);
      byId("isekai-hint").classList.remove("hidden");
    }
  } else {
    byId("isekai-input-row").hidden = true;
    byId("isekai-hint").classList.remove("hidden");
  }
}

/** @spec SPEC-031 §6.1 タップで次へ */
function advanceIsekai() {
  if (isekaiState.inputActive) return;  // 入力フェーズ中は進まない

  const scenes = ISEKAI_SCENES;
  const scene = scenes[isekaiState.sceneIndex];
  if (!scene) { finishIsekaiIntro(); return; }

  // 証明書シーン：未捺印ならタップでハンコ、捺印済みなら次シーンへ
  if (scene.bg === "certificate") {
    if (!isekaiState.stampShown) {
      isekaiState.stampShown = true;
      byId("isekai-stamp").hidden = false;
      // アニメーション再発火のために一旦クラスを外す
      byId("isekai-stamp").classList.remove("stamped");
      // reflow
      void byId("isekai-stamp").offsetWidth;
      byId("isekai-stamp").classList.add("stamped");
      byId("isekai-message").textContent =
        (scene.certificate && scene.certificate.afterStampPrompt) || "承認されました。タップで次へ";
      return;
    }
    // 次のシーンへ
    gotoNextIsekaiScene();
    return;
  }

  const items = scene.steps || scene.messages || [];
  isekaiState.stepIndex += 1;

  if (isekaiState.stepIndex >= items.length) {
    gotoNextIsekaiScene();
    return;
  }
  renderIsekaiCurrent();
}

function gotoNextIsekaiScene() {
  isekaiState.sceneIndex += 1;
  isekaiState.stepIndex = 0;
  if (isekaiState.sceneIndex >= ISEKAI_SCENES.length) {
    finishIsekaiIntro();
    return;
  }
  // シーン 4 突入時に主人公名をランダム決定
  const next = ISEKAI_SCENES[isekaiState.sceneIndex];
  if (next && next.id === "scene4" && !player.avatarName) {
    // 証明書の性別に従う（SPEC-031 §5.2）
    const cert = (ISEKAI_SCENES.find((s) => s.bg === "certificate") || {}).certificate || {};
    const genderField = (cert.fields || []).find((f) => f.label === "性別");
    const gender = (genderField && genderField.value === "女") ? "female" : "male";
    player.avatarName = randomAvatarName(gender);
  }
  renderIsekaiCurrent();
}

/** @spec SPEC-031 §4.2 名前入力フェーズの確定 */
function confirmIsekaiInput() {
  const inp = byId("isekai-input");
  const raw = (inp && inp.value) ? inp.value.trim() : "";
  if (raw) {
    player.name = raw;
  } else {
    // 未入力ならランダム（名前マスタから適当に）
    player.name = randomAvatarName("male");
  }
  isekaiState.inputActive = false;
  byId("isekai-input-row").hidden = true;
  byId("isekai-hint").classList.remove("hidden");
  // 次のメッセージへ
  isekaiState.stepIndex += 1;
  renderIsekaiCurrent();
}

/** @spec SPEC-031 §4.4 イントロ終了 → 本編 S2 へ */
function finishIsekaiIntro() {
  // シーン 4 を経由せずに終わる可能性に備え、avatarName が空ならここでも決定
  if (!player.avatarName) {
    player.avatarName = randomAvatarName("male");
  }
  goChooseFromToday();
}

// @spec SPEC-028 §4  マスタデータを全部読み込んでから画面を立ち上げる
// @spec SPEC-030 §4.3 起動直後は必ず S0 タイトル画面
// @spec SPEC-031 §5  転生イントロはタイトルの「はじめから」から入る
(async function boot() {
  await Promise.all([
    loadMasters(),
    loadMessageMasters(),
  ]);

  renderHUD();

  // 介入モーダルの閉じるボタンは dom-load 後に配線
  const _btnInterruptClose = byId("btn-interrupt-close");
  if (_btnInterruptClose) _btnInterruptClose.addEventListener("click", closeInterrupt);

  // @spec SPEC-030 タイトル画面 → 「はじめから」で startNewGame()
  const btnStart = byId("btn-title-start");
  if (btnStart) btnStart.addEventListener("click", startNewGame);

  // @spec SPEC-031 §6.2 転生イントロ：ステージ全体タップで advanceIsekai
  const isekaiStage = byId("isekai-stage");
  if (isekaiStage) {
    isekaiStage.addEventListener("click", (e) => {
      // 入力フィールドや決定ボタンの上ではタップで進行しない
      const inp = byId("isekai-input-row");
      if (inp && !inp.hidden && inp.contains(e.target)) return;
      advanceIsekai();
    });
  }
  const btnIsekaiConfirm = byId("isekai-input-btn");
  if (btnIsekaiConfirm) btnIsekaiConfirm.addEventListener("click", (e) => {
    e.stopPropagation();
    confirmIsekaiInput();
  });
  const isekaiInput = byId("isekai-input");
  if (isekaiInput) isekaiInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") { e.preventDefault(); confirmIsekaiInput(); }
  });

  // 起動時は HUD を一旦非表示にしておく（タイトル中は HUD は要らない）
  showScreen("screen-title");
})();
