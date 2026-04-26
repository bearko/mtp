# SPEC-047: 場所・マップシステム

| 項目 | 内容 |
|---|---|
| 仕様ID | SPEC-047 |
| 機能名 | 場所（Location）と移動（Travel）、マップ画面（S14） |
| 対応ファイル | `prototype/data/locations.json`（新設）、`prototype/data/plays.json` の `locations` フィールド追加 / `prototype/game.js` `player.location`, `loadLocations`, `travelTo`, `renderMap` / `prototype/index.html` `#hud-location`, `#screen-travel`, `#screen-travel-result`, `#screen-map` / `prototype/styles.css` `.hud-location`, `.travel-*`, `.map-*` |
| 関連仕様 | SPEC-002 遊び選択, SPEC-011 保育園, SPEC-014 中学校, SPEC-023 遊びツリー, SPEC-034 HUD, SPEC-042 経済, SPEC-028 マスタデータ, SPEC-056（イベントモーダル）, SPEC-057（感染症と通院抽選） |
| ステータス | Active（保育園期が実装対象、幼稚園以降は段階実装） |
| 最終更新 | 2026-04-26 |

## 1. 目的

これまで遊びは **プレイヤーの年齢・解禁状況のみ** で選択可能だったが、**物理的な「場所」** の概念を導入することで、以下を実現する：

- 遊びに **場所条件** を与え、同じ遊びでも場所で意味を変える（絵本は自宅・図書館、滑り台は公園・園庭）
- **移動フェーズ** を設けて「今いる場所」を切り替える楽しみを作る
- **マップ画面** で地理的な選択肢を俯瞰できる
- 保育園期は **親が連れて行ってくれる** 演出で、受動的な外出体験を作る
- 小学校以降は自分で **公共交通機関** を使って出かけるようになる（運賃＝お金の意義付け）

## 2. 用語定義
- **場所（Location）**：プレイヤーが滞在できる物理スポット。自宅・公園・図書館など
- **移動（Travel）**：現在地から別の場所へ移る行為。時間と（必要なら）お金を消費する
- **移動演出（Travel Animation）**：移動中の画面遷移演出（S15）
- **移動結果画面（Travel Result）**：「〇〇に来た」と明示する画面（S16）
- **場所フィルタ**：遊びを `locations` 配列で絞る機能。現在地と一致しない遊びはドックから除外
- **マップ画面（S14）**：今行ける場所を地図状に表示する画面
- **親遣い（Parental Outing）**：保育園期限定、親の意思で場所が決まる

## 3. 用語の関係

```
 遊び（Play）─────(n:n)───── 場所（Location）
                             │
                             │ 滞在・移動
                             ▼
                          プレイヤー（player.location）
```

## 4. データ構造

### 4.1 場所マスタ（`prototype/data/locations.json`）

```json
[
  {
    "id": "home",
    "name": "自宅",
    "icon": "🏠",
    "type": "residential",
    "travelTime": 0,
    "travelFare": 0,
    "accessibleFromHome": true,
    "lifeStageTag": ["nursery", "kindergarten", "elementary", "juniorhigh", "highschool", "university", "worker", "retirement"],
    "description": "あなたの家。絵本やおもちゃで遊べる。",
    "specialBuffs": {},
    "parentalOutingWeekdayWeight": 40,
    "parentalOutingWeekendWeight": 40,
    "category": "always"
  },
  {
    "id": "near_park",
    "name": "近くの公園",
    "icon": "🌳",
    "type": "outdoor",
    "travelTime": 0.25,
    "travelFare": 0,
    "accessibleFromHome": true,
    "lifeStageTag": ["nursery", "kindergarten", "elementary"],
    "description": "徒歩すぐの小さな公園。砂場と滑り台がある。",
    "specialBuffs": {},
    "parentalOutingWeekdayWeight": 30,
    "parentalOutingWeekendWeight": 5,
    "category": "everyday"
  },
  {
    "id": "big_park",
    "name": "大きな公園",
    "icon": "🏞️",
    "type": "outdoor",
    "travelTime": 0.5,
    "travelFare": 0,
    "accessibleFromHome": true,
    "lifeStageTag": ["nursery", "kindergarten", "elementary", "juniorhigh"],
    "description": "色々な遊具がある広い公園。",
    "specialBuffs": {},
    "parentalOutingWeekdayWeight": 15,
    "parentalOutingWeekendWeight": 10,
    "category": "everyday"
  },
  {
    "id": "children_hall",
    "name": "児童館",
    "icon": "🏢",
    "type": "indoor",
    "travelTime": 0.25,
    "travelFare": 0,
    "accessibleFromHome": true,
    "lifeStageTag": ["nursery", "kindergarten", "elementary"],
    "description": "屋内遊びができる施設。つみき・ブロック・絵本・おままごと・小さなアスレチック。",
    "specialBuffs": { "chanceToAcquireToy": 0.05 },
    "parentalOutingWeekdayWeight": 15,
    "parentalOutingWeekendWeight": 5,
    "category": "everyday"
  },
  {
    "id": "zoo",
    "name": "動物園",
    "icon": "🦒",
    "type": "destination",
    "travelTime": 2,
    "travelFare": 0,
    "accessibleFromHome": false,
    "lifeStageTag": ["nursery", "kindergarten", "elementary"],
    "description": "いろんな動物に出会える。",
    "specialBuffs": { "allDayEvent": true, "soyouGain": { "intellect": 40, "sensitivity": 30, "social": 15, "passion": 10 } },
    "parentalOutingWeekdayWeight": 0,
    "parentalOutingWeekendWeight": 10,
    "category": "fullday_trip"
  },
  {
    "id": "aquarium",
    "name": "水族館",
    "icon": "🐠",
    "type": "destination",
    "travelTime": 2,
    "travelFare": 0,
    "accessibleFromHome": false,
    "lifeStageTag": ["nursery", "kindergarten", "elementary"],
    "description": "海の生き物を観察できる。",
    "specialBuffs": { "allDayEvent": true, "soyouGain": { "intellect": 35, "sensitivity": 35, "passion": 10 } },
    "parentalOutingWeekendWeight": 10,
    "category": "fullday_trip"
  },
  {
    "id": "museum",
    "name": "博物館",
    "icon": "🏛️",
    "type": "destination",
    "travelTime": 2,
    "travelFare": 0,
    "accessibleFromHome": false,
    "lifeStageTag": ["nursery", "kindergarten", "elementary", "juniorhigh"],
    "description": "古代の展示・標本。知的好奇心が高まる。",
    "specialBuffs": {
      "allDayEvent": true,
      "soyouGain": { "intellect": 50, "sensitivity": 20 },
      "persistBuff": { "durationDays": 30, "category": "reading", "multiplier": 1.20 }
    },
    "parentalOutingWeekendWeight": 8,
    "category": "fullday_trip"
  },
  {
    "id": "amusement_park",
    "name": "遊園地",
    "icon": "🎡",
    "type": "destination",
    "travelTime": 2,
    "travelFare": 0,
    "accessibleFromHome": false,
    "lifeStageTag": ["nursery", "kindergarten", "elementary", "juniorhigh"],
    "description": "乗り物とアトラクション。",
    "specialBuffs": {
      "allDayEvent": true,
      "soyouGain": { "body": 40, "passion": 30, "sensitivity": 15 },
      "persistBuff": { "durationDays": 30, "category": "outdoor_toy", "multiplier": 1.25, "staminaMultiplier": 1.15 }
    },
    "parentalOutingWeekendWeight": 7,
    "category": "fullday_trip"
  },
  {
    "id": "grandparents_house",
    "name": "祖父母の家（実家）",
    "icon": "🏡",
    "type": "destination",
    "travelTime": 1.5,
    "travelFare": 0,
    "accessibleFromHome": false,
    "lifeStageTag": ["nursery", "kindergarten", "elementary", "juniorhigh", "highschool"],
    "description": "おじいちゃん・おばあちゃんの家。",
    "specialBuffs": {
      "allDayEvent": true,
      "soyouGain": { "social": 35, "intellect": 15, "sensitivity": 15, "passion": 10 },
      "randomToy": true
    },
    "parentalOutingWeekendWeight": 8,
    "category": "fullday_trip"
  },
  {
    "id": "summer_festival",
    "name": "夏祭り",
    "icon": "🏮",
    "type": "seasonal",
    "travelTime": 1,
    "travelFare": 0,
    "accessibleFromHome": false,
    "lifeStageTag": ["nursery", "kindergarten", "elementary", "juniorhigh", "highschool"],
    "description": "夏の夜の屋台と盆踊り。",
    "seasonWindow": ["summer"],
    "specialBuffs": { "allDayEvent": true, "soyouGain": { "sensitivity": 35, "social": 25, "passion": 20 } },
    "parentalOutingWeekendWeight": 6,
    "category": "fullday_trip"
  },
  {
    "id": "snow_field",
    "name": "雪遊び",
    "icon": "⛄",
    "type": "seasonal",
    "travelTime": 2,
    "travelFare": 0,
    "accessibleFromHome": false,
    "lifeStageTag": ["nursery", "kindergarten", "elementary"],
    "description": "雪だるま・ソリ遊び。",
    "seasonWindow": ["winter"],
    "specialBuffs": { "allDayEvent": true, "soyouGain": { "body": 40, "sensitivity": 20, "passion": 15 } },
    "parentalOutingWeekendWeight": 5,
    "category": "fullday_trip"
  },
  {
    "id": "library",
    "name": "図書館",
    "icon": "📚",
    "type": "indoor",
    "travelTime": 0.5,
    "travelFare": 0,
    "accessibleFromHome": true,
    "lifeStageTag": ["nursery", "kindergarten", "elementary", "juniorhigh", "highschool", "university"],
    "description": "たくさんの絵本・図鑑・小説。",
    "specialBuffs": { "soyouBuffCategory": { "reading": 0.20 } },
    "parentalOutingWeekdayWeight": 5,
    "parentalOutingWeekendWeight": 3,
    "category": "everyday"
  }
]
```

### 4.2 遊びマスタへの `locations` フィールド追加

```jsonc
{
  "id": "picturebook",
  "name": "絵本を読む",
  // ... 既存フィールド ...
  "locations": ["home", "library", "children_hall", "grandparents_house"]
}

{
  "id": "slide",
  "name": "滑り台",
  "locations": ["near_park", "big_park"]
}

{
  "id": "sandbox",
  "name": "砂場遊び",
  "locations": ["near_park", "big_park"]
}
```

旧来の `locations` 未定義の遊びは **全場所で遊べる** とみなす（後方互換）。

### 4.3 プレイヤーオブジェクト拡張

```js
player.location = "home";          // 現在地の location id
player.persistBuffs = [];           // 場所由来の持続バフ（博物館で読書 +20% 30日 など）
player._parentalOutingToday = null; // 今日の親遣い先（null なら家）
player.unlockedLocations = ["home", "near_park"];  // 解禁済みの場所
```

## 5. 場所フィルタ（ドック）

### 5.1 `isPlayAvailable()` への拡張

```js
function isPlayAvailable(play) {
  // ... 既存の条件 ...

  // @spec SPEC-047 §5 場所フィルタ
  if (Array.isArray(play.locations) && play.locations.length > 0) {
    if (!play.locations.includes(player.location)) {
      return { ok: false, reasons: [`ここ（${locationName(player.location)}）では遊べない`], isHidden: true };
    }
  }

  // ... 既存の判定 ...
}
```

### 5.2 場所を絞ることで「同じ場所に滞在＝遊びの繰り返し」が成立
- 自宅に居続ける＝絵本・おもちゃ・TV を繰り返す
- 公園に行く＝滑り台・砂場・かけっこ
- 行き先を変えたくなったら S14 マップ or 移動フェーズ

## 6. HUD への場所表示（SPEC-034 §4.4 v2 改訂）

### 6.1 変更
旧 HUD 右エリアの「情熱（🔥 G(0)）」を **場所表示** に置き換える。情熱は素養カードに既に内包されているので冗長。

### 6.2 新しい右エリア
```
┌──────────┐
│ 💰 所持金   │（幼少期は非表示）
│ 👥 友人     │
│ 📍 自宅     │  ← 新規追加（場所アイコン + 名前）
└──────────┘
```

場所アイコンは location マスタの `icon` を使用。長い名前は省略（現状最長「祖父母の家」8 文字）。

### 6.3 旧 `#hud-passion-row` の扱い
- DOM は残すが `hidden` にする
- 将来（SPEC-048 等）で別の情報に流用する可能性あり

## 7. 移動フェーズ

### 7.1 前提
- **保育園期（age 1-4）**：プレイヤーから移動は選択できない。**親の意思** で決まる（§8）
- **幼稚園期（age 5-6）**：まだ基本は親が連れて行く。稀に「お友達の家」選択肢
- **小学校期（age 7-12）**：自分で近所を歩ける。自転車解禁。運賃発生系は親同伴
- **中学校期（age 13-）**：公共交通機関を自分で使える

### 7.2 実装は段階的
本 SPEC では **保育園期まで** を実装対象にする。幼稚園以降は Draft として章立てだけ残す。

### 7.3 移動フロー（保育園期）

1. **朝起床 `nextDay()`**：
   - 平日 or 土日を判定
   - 平日：`pickWeekdayParentalOuting()` で「家／近くの公園／大きな公園／児童館／図書館」から重み付き抽選
   - 土日：40% の確率で「家」、60% で `pickWeekendParentalOuting()` から抽選（動物園・水族館・博物館・遊園地・祖父母の家・季節限定）
   - 選ばれた場所を `player._parentalOutingToday` にセット
2. **家以外が選ばれた場合**：
   - 起床直後にモーダル「今日はお父さん・お母さんと ⛺〇〇 に行くよ！」
   - モーダル閉じると **S15 移動演出画面** へ
3. **S15 移動演出**：
   - 2 秒間の演出（🚗 or 🚶 アニメ）
   - ナレーション「車で〇分、〇〇に向かっている…」
   - 時間も進める（`player.clockHour` を travelTime 分進める）
4. **S16 移動結果画面**：
   - 「🦒 動物園に来た！」で大きくアイコン表示
   - タップで次へ
5. **遊び選択画面（S2）に戻る**：
   - `player.location = 該当場所`
   - その場所で遊べる遊びのみドックに表示

### 7.4 土日祝限定イベント（場所 = 遊び）
`category: "fullday_trip"` の場所は **朝から夜までその場所で過ごす特別モード**：
1. S15 移動演出
2. S16 移動結果画面
3. **即 `runFullDayEvent(location)`** を実行：
   - その場所の `specialBuffs.soyouGain` を一括で加算
   - 持続バフ（`persistBuff`）があれば `player.persistBuffs` に追加
   - ランダムで「おもちゃをもらった」イベント（祖父母の家）
4. 帰宅演出（別の S15 逆再生 or 短縮版）
5. **直接 S10 日サマリ** へ（その日の自由遊びはナシ）
6. 連絡帳（SPEC-027）に「おうちのおたより」として特別エピソードを追加

## 8. 保育園期の親遣い抽選

### 8.1 平日抽選
```js
function pickWeekdayParentalOuting() {
  const pool = LOCATIONS.filter(l =>
    l.parentalOutingWeekdayWeight > 0 &&
    l.lifeStageTag.includes("nursery")
  );
  return weightedRandom(pool, "parentalOutingWeekdayWeight");
}
```

標準重み（§4.1 参照）：
- 家 40%、近くの公園 30%、児童館 15%、大きな公園 15%、図書館 5%

### 8.2 土日祝抽選
```js
function pickWeekendParentalOuting() {
  // 40% の確率で家
  if (Math.random() < 0.40) return LOCATIONS.find(l => l.id === "home");
  // 残り 60% は weekend weights
  const pool = LOCATIONS.filter(l =>
    l.parentalOutingWeekendWeight > 0 &&
    l.lifeStageTag.includes("nursery") &&
    (!l.seasonWindow || l.seasonWindow.includes(player.season))
  );
  return weightedRandom(pool, "parentalOutingWeekendWeight");
}
```

標準重み：
- 動物園 10、水族館 10、大きな公園 10、博物館 8、祖父母の家 8、遊園地 7、近くの公園 5、児童館 5、夏祭り 6（夏のみ）、雪遊び 5（冬のみ）

### 8.2a スキップ継続中の親遣い抽選抑制（SPEC-025 §7.1.3 連携）

スキップ機能（「週末までスキップ」「明日の夜までスキップ」）との相性を取るため、**スキップ継続中は親遣い抽選を一切行わない**。

- `player._skipRemainingDays > 0` の朝：`maybeResolveMorningLocation()` で `player.location = "home"` 固定、`_parentalOutingToday = null`
- `player._skipTargetDay >= player.day` の朝：上と同様（スキップ到達日を含めて抑制）
- これによりスキップ中に移動演出画面（S15）が挟まってスキップが中断される不具合を防止

#### 背景
PR #20 初版で「週末までスキップ」押下時、Day 2-5 の朝に親遣い抽選で家以外が当たると S15 移動演出に飛んでスキップが中断されていた。さらに S10 → S9 の週末サマリ表示フローが乱れ「月曜に直接ワープする」症状が発生。v2 改訂で `_skipTargetDay` を記録し、スキップ期間中の抽選を無効化することで解決。

### 8.3 特殊バフの適用例：博物館の持続バフ
```js
// 博物館から戻った日：
player.persistBuffs.push({
  type: "category",
  category: "reading",
  multiplier: 1.20,
  untilDay: player.day + 30
});
```

`finalizePlay()` で `gainBoost` に加算：
```js
function applyPersistBuffs(play) {
  let mul = 1.0;
  for (const buff of player.persistBuffs || []) {
    if (buff.untilDay < player.day) continue; // 期限切れ
    if (buff.type === "category" && play.categories?.includes(buff.category)) {
      mul *= buff.multiplier;
    }
  }
  return mul;
}
```

### 8.4 保育園のシナリオ例

| 曜日 | 抽選結果 | 挙動 |
|---|---|---|
| 月（平日）| 家 | いつもの家、絵本など |
| 火（平日）| 近くの公園 | 起床→公園へ移動（0.25h）→滑り台・砂場 |
| 水（平日）| 大きな公園 | 移動 0.5h、1 日大きな公園 |
| 木（平日）| 児童館 | 移動 0.25h、屋内遊び。5% で新おもちゃ獲得 |
| 金（平日）| 図書館 | 移動 0.5h、絵本読み |
| 土（休日）| 40%→家、60% は抽選 | 抽選で動物園に |
| 日（休日）| 抽選で祖父母の家 | 移動 1.5h、1 日滞在、social +35 |

## 9. マップ画面（S14）

### 9.1 役割
「今行ける場所」を俯瞰する画面。小学校以降の自分で移動する時代に本領を発揮。保育園期は **親遣い先を参照できる View** として機能。

### 9.2 レイアウト
```
┌──────────────────────────┐
│  [共通HUD]                │
├──────────────────────────┤
│  🗺️ 今行ける場所           │
├──────────────────────────┤
│       🏠                  │ ← 中央に自宅
│      /  |  \              │
│  🌳   🏢   📚           │ ← 近場（徒歩圏）
│  近くの 児童 図書          │
│  公園   館   館            │
│                            │
│    🏞️                    │
│   大きな公園（徒歩15分）    │
│                            │
│  ──週末限定──              │
│  🦒 🐠 🏛️ 🎡 🏡       │
│  動物 水族 博物 遊園 祖父    │
│  園   館   館   地   母      │
└──────────────────────────┘
```

### 9.3 インタラクション
- タップ可能な場所：`accessibleFromHome: true` の場所
- 無効な場所（週末限定等）：薄く表示してタップ不可
- タップ：
  - 小学校以降：移動を確定、時間＆運賃消費して S15 へ
  - 保育園期：「親に連れて行ってもらう必要があります」のトースト

### 9.4 ドック右端に「🗺️ マップ」アイコン追加
- 遊びツリー（🌳）アイコンの右隣に配置
- 保育園期も閲覧可能（学習用）

## 10. 遊びツリーの場所グルーピング（SPEC-023 拡張）

### 10.1 新モード：場所別表示
- 既存の「カテゴリ別」に加えて「場所別」トグルボタン
- タップで表示切り替え：
  - 🏠 自宅：絵本、積み木、おままごと、ごっこ遊び…
  - 🌳 近くの公園：砂場、滑り台、かけっこ
  - 🏞️ 大きな公園：砂場、大きな滑り台、ブランコ、ボール
  - 🏢 児童館：つみき、ブロック、絵本、おままごと、小アスレチック

### 10.2 実装
```js
function renderPlayTreeByLocation() {
  const grouped = {};
  for (const loc of LOCATIONS) {
    grouped[loc.id] = PLAYS.filter(p =>
      !p.locations || p.locations.includes(loc.id)
    );
  }
  // 描画
}
```

## 11. コアタイム中の場所（自動切り替え）

### 11.1 保育園・幼稚園・小学校・中学校・高校・大学
コアタイム開始時に `player.location` を自動切り替え：

| ステージ | 場所 ID | 名前 |
|---|---|---|
| 保育園 | `nursery_school` | 保育園 |
| 幼稚園 | `kindergarten` | 幼稚園 |
| 小学校 | `elementary_school` | 小学校 |
| 中学校 | `juniorhigh_school` | 中学校 |
| 高校 | `high_school` | 高校 |
| 大学 | `university` | 大学 |
| 社会人 | `workplace` | 職場 |

### 11.2 切り替えタイミング
- コアタイム開始：`renderCoreTime()` の冒頭で `player.location = stage.workplaceLocationId`
- コアタイム終了（`closeCoreTime`）：元の場所（通常は「家」）に戻る
- 移動時間はコアタイムに内包（演出省略）

### 11.3 保育園での位置の見え方
- コアタイム中は HUD に「📍 保育園」
- 自由時間中は親が連れて行った先に応じた「📍 自宅」「📍 動物園」等

## 12. 経済連動（SPEC-042）

### 12.1 小学校以降の運賃
- `travelFare > 0` の場所は、移動時に `player.money -= fare`
- 所持金不足なら移動選択不可

### 12.2 保育園期は親負担
- `player.money` からは引かない
- ただし `_parentalWallet` という仮想値で親の許容頻度を管理（将来拡張）

## 13. 失敗モード

| 状況 | 挙動 |
|---|---|
| `player.location` が locations.json にない | フォールバックで `home` に戻す |
| 季節外の場所を抽選してしまう | `seasonWindow` でフィルタ済みなのでスキップ |
| 夏祭りが冬に抽選される | `seasonWindow` で除外 |
| `player.unlockedLocations` にない場所を直接指定 | accessibleFromHome=false ならエラー |

## 14. テスト観点

### 14.1 単体
- `isPlayAvailable` で場所不一致 → isHidden=true
- `pickWeekendParentalOuting` で 40% は home（大数テスト）
- 持続バフの期限切れ処理

### 14.2 結合
- 保育園 Day 8（平日）朝：40% home / 30% near_park / 15% big_park / 15% children_hall / 5% library（統計的に）
- Day 12（日曜）朝：40% home / 60% 他
- 動物園に連れて行かれると 1 日で S10 に遷移、soyou が大きく加算
- 博物館後 30 日間、読書系プレイで獲得量 1.2 倍

## 15. 段階的ロールアウト

### Phase 1（本 SPEC で実装）
- 場所マスタ（locations.json）
- 遊びへの `locations` フィールド
- `player.location` と HUD 表示
- 保育園期の親遣い抽選
- S15 移動演出 + S16 移動結果画面
- 土日祝の場所=遊び（fullday_trip）
- 持続バフ（博物館など）

### Phase 2（次 PR）
- S14 マップ画面（基本レイアウト）
- 遊びツリーの場所別グルーピング
- コアタイム中の場所自動切り替え（保育園 → 幼稚園 → 小学校）

### Phase 3
- 小学校以降のプレイヤー主導の移動（運賃）
- 遊園地バフの体力消費増大
- 友達との外出（SPEC-041 連携）

## 16. 画面遷移図（保育園期）

```
（朝起床 nextDay）
  │
  ▼
 抽選：home / 近場 / 遠出 ?
  │
  ├─ home          → そのまま S2
  ├─ 近場（移動0.25h-0.5h）
  │    │
  │    ▼
  │   S15 移動演出 → S16 移動結果 → S2（その場所の遊びだけ）
  │    │
  │    └─ 夕方 S2 で「帰る」選択 → 再度 S15 → S16 → home で S2 → 夜 S10
  └─ 遠出（fullday_trip）
        │
        ▼
       S15 移動演出 → S16 移動結果 → runFullDayEvent → 帰宅演出 → S10
```

## 17. 改訂履歴
- 2026-04-19: 初版（Phase 1 対象）
- 2026-04-19 v2: §8.2a スキップ中の親遣い抽選抑制を追加（「週末までスキップ」時に移動演出でスキップが中断するバグ修正）
