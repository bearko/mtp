# SPEC-057: 感染症と治癒システム（毎晩判定 + 通院ショートカット）

| 項目 | 内容 |
|---|---|
| 仕様ID | SPEC-057 |
| 機能名 | 感染症中の S2 スキップ、毎晩の治癒判定（前倒し可能）、お医者さん通院による即治癒 |
| 対応ファイル | `prototype/data/locations.json`（clinic 追加）, `prototype/data/morning-events.json`（clinic 用シナリオ）, `prototype/game.js` `goChooseFromToday()` 感染症スキップ, `nextDay()` 治癒判定, `pickWeekdayParentalOuting()` clinic 4倍重み |
| 関連仕様 | SPEC-011 §10（感染症基礎仕様）, SPEC-047（場所システム）, SPEC-056（統一イベントモーダル） |
| ステータス | **Active** |
| 最終更新 | 2026-04-26 |

## 0. 本 SPEC のコンセプト

### 0.1 解決したい問題

> ユーザーフィードバック (PR #27 後の打診):
> 1. 「熱がある時は直接1日の終わり画面に飛んでほしい（今は遊び選択画面に遷移して、何も選べないから手動で1日の終わりまでスキップする必要がある）」
> 2. 「休みは3日間固定ではなく、毎日1日の終わりに治癒判定を入れて前倒しで治る可能性も残しておきたい」
> 3. 「風邪を引いた時は1日のはじめの親の移動判定で医者に連れて行ってくれた場合、その日の夜に必ず治るように判定用意しておきたい」

### 0.2 解決方針

1. **S2 スキップ**：感染症中は朝のモーダル（風邪継続）を見せた直後、`goChooseFromToday()` 内で **即 `goSleep()` へ転送** する。プレイヤーは「今日もお休みだ…」と納得して 1 日の終わりへ進める。
2. **毎晩の治癒判定**：`nextDay()` の冒頭（前日の最終結果として）で確率治癒。残日数が 0 になる前に治る可能性。
3. **お医者さん**：感染症中の朝に限り、親遣い抽選で **clinic 場所が 4 倍重み**で選ばれる。clinic に行った日は **その日の夜に 100% 治癒**。

### 0.3 設計の核心

> 「病気は子育ての日常」だが、**プレイヤーの能動性を奪うグレー画面の連続にしない**。
> 病気でも何かが起きる：医者に連れて行ってもらう、回復が早まる、家族が労ってくれる。

## 1. 感染症中の S2 スキップ

### 1.1 既存挙動
- `nextDay()` で `_infectionRemainingDays > 0` なら `spareHours = 0` に設定
- `goChooseFromToday()` 内で `spareHours <= 0` なら `goSleep()` に飛ぶ
- だが、**コアタイム判定が先に走る** ため、保育園期は `screen-coretime` に遷移してしまう問題

### 1.2 修正
`goChooseFromToday()` 内で **感染症フラグが立っている場合は即 `goSleep()`**：

```js
// SPEC-057 §1 感染症中はコアタイム抽選も飛ばし、直接1日の終わりへ
if (player._specialDayMode === "infection") {
  goSleep();
  return;
}
```

これにより：
- 朝のモーダル「まだ熱がある…」表示
- そのまま S10 へ自動遷移
- プレイヤーは「なるほど」を 1 回押すだけで 1 日が終わる

### 1.3 自動モードとの整合
`runAutoTurn()` も同様に `_specialDayMode === "infection"` を見て、自動で sleep に進む。これにより `_skipRemainingDays` 中の感染症日も問題なく処理される。

## 2. 毎晩の治癒判定（前倒し可能）

### 2.1 仕組み

毎晩 `nextDay()` の冒頭（あるいは `sleep()` の最後）で、感染症残日数を 1 減らす **前に**、追加で治癒判定する：

| 残日数 | 通常治癒確率 |
|---|---|
| 3 | 0%（初日は確実に休む） |
| 2 | 30% |
| 1 | 50% |
| 0 | 100%（自動的に治る、既存挙動） |

```js
function maybeHealInfection() {
  const r = player._infectionRemainingDays || 0;
  if (r <= 0) return false;

  // 通院した日は確定治癒
  if (player._visitedClinicToday) {
    player._infectionRemainingDays = 0;
    player._specialDayMode = null;
    player._visitedClinicToday = false;
    return true;
  }

  // 通常の治癒確率（残日数が少ないほど高確率）
  const probTable = { 3: 0.00, 2: 0.30, 1: 0.50 };
  const prob = probTable[r] ?? 0.0;
  if (Math.random() < prob) {
    player._infectionRemainingDays = 0;
    player._specialDayMode = null;
    return true;
  }
  return false;
}
```

### 2.2 治癒した翌朝のモーダル

治癒した翌朝はモーダルで **「熱が下がった」イベント** を表示：

```
🌟 熱が下がった！
昨日まで熱があったけど、今日はすっかり元気
影響：余剰時間 +8h（通常通り）
お母さん：「もう大丈夫そうね、よかった」
```

## 3. お医者さん（clinic）による即治癒

### 3.1 場所マスタの拡張

`locations.json` に新しい場所 `clinic` を追加：

```jsonc
{
  "id": "clinic",
  "name": "お医者さん",
  "shortName": "病院",
  "icon": "🏥",
  "type": "institution",
  "travelTime": 0.5,
  "lifeStageTag": ["nursery", "kindergarten", "elementary", "juniorhigh", "highschool"],
  "description": "風邪などをみてもらえる病院。",
  "specialBuffs": { "healInfection": true },
  "parentalOutingWeekdayWeight": 0,    // 通常時は 0（出ない）
  "parentalOutingWeekendWeight": 0,    // 同上
  "infectionPriorityWeight": 80,       // 感染症中だけ高重みで抽選
  "category": "everyday"
}
```

### 3.2 抽選ロジック（v2 修正版）

> **v1 のバグ**：v1 ではガード条件を `_specialDayMode === "infection" && _infectionRemainingDays > 0` の AND としていたが、感染症最終日（`maybeTriggerNurserySpecialEvent` で残日数を -1 した直後、つまり残 1 → 0 になる日）は `_specialDayMode === "infection"` のままで `_infectionRemainingDays === 0` となるため、ガードに弾かれて **通常プールから児童館・公園が抽選される** バグが発生していた。

> **v2**：`_specialDayMode === "infection" || _infectionRemainingDays > 0` の OR ガードに変更。最終日でも mode が立っていれば clinic / home 限定。

```js
function pickInfectionDayLocation() {
  // OR で評価（mode と残日数のどちらかでも病気フラグが立っていれば）
  const sick = (player._specialDayMode === "infection") || (player._infectionRemainingDays > 0);
  if (!sick) return null;
  const clinic = LOCATIONS.find((l) => l.id === "clinic");
  if (clinic && Math.random() < 0.9) return clinic;
  return LOCATIONS.find((l) => l.id === "home");
}

function pickWeekdayParentalOuting() {
  const infectionLoc = pickInfectionDayLocation();
  if (infectionLoc) return infectionLoc;
  // 通常抽選
  ...
}
```

ヘルパ関数 `pickInfectionDayLocation()` に切り出し、平日・週末両方で参照することで条件分岐の漏れを排除。

### 3.3 通院フロー

1. 朝起床 → `_specialDayMode === "infection"`
2. `pickWeekdayParentalOuting()` で `clinic` 選出
3. S15/S16 移動演出（既存の親遣い travel フロー流用）
4. `onLocationEntered("clinic")` でフラグ：`player._visitedClinicToday = true`
5. その日も S2 スキップで S10 へ（病院の後はおうちで安静）
6. 翌朝 `nextDay()` の `maybeHealInfection()` で 100% 治癒

### 3.4 通院モーダル

通院当日の朝モーダル（morning-events.json）：

```jsonc
{
  "id": "morning_clinic_visit",
  "category": "clinic",
  "art": "🏥",
  "title": "お医者さんに連れて行ってもらった",
  "desc": "おかあさんがお医者さんに連れて行ってくれた。お薬をもらって、ゆっくり休めば明日には元気になりそう。",
  "comment": { "speaker": "mother", "body": "明日には元気になるよ、頑張ったね" }
}
```

## 4. データ構造

### 4.1 player 拡張フィールド

| フィールド | 型 | 用途 |
|---|---|---|
| `_visitedClinicToday` | boolean | 今日 clinic に行ったか（夜に消費して 100% 治癒） |
| `_infectionJustHealed` | boolean | 治癒した直後フラグ（朝モーダル表示用、消費後 false） |

### 4.2 既存フィールドとの関係
- `_specialDayMode` は `null` / `"outing"` / `"infection"` / **`"clinic"`**（新規） に拡張
- `_infectionRemainingDays` の半減は `maybeHealInfection()` 内でのみ実行

## 5. 実装：処理順序

### 5.1 nextDay 冒頭

```
1. player.day += 1
2. cleanupPersistBuffs / staminaCap 計算
3. maybeHealInfection()         ← SPEC-057 §2 治癒判定（前倒し）
   ├─ clinic 行ってたら: 100% 治癒、_infectionJustHealed = true
   └─ 通常: 残日数別の確率で治癒
4. maybeResolveMorningLocation()  ← SPEC-047 既存（_specialDayMode を見て clinic 重み）
5. maybeTriggerNurserySpecialEvent() ← SPEC-011 既存（残日数を 1 減らす、感染症の継続表示モーダル）
   ※ ただし maybeHealInfection で既に 0 になっていれば何もしない
6. _infectionJustHealed なら「熱が下がった」モーダル enqueue
```

### 5.2 goChooseFromToday 冒頭（モーダル消化後）

```
1. 朝のモーダル消化
2. 親遣い travel 開始判定（既存）
3. SPEC-057 §1: _specialDayMode === "infection" なら即 goSleep()
4. コアタイム判定
5. spareHours <= 0 なら goSleep()
6. それ以外は遊び選択画面
```

## 6. テスト観点

### 6.1 単体
- `maybeHealInfection`：残日数 3 / 2 / 1 で 0% / 30% / 50% の確率分布が概ね合う
- `maybeHealInfection` 通院フラグ立ってたら確実に治る

### 6.2 結合
- 風邪発動 → モーダル表示 → S10 直行（コアタイムも遊び選択もスキップ）
- 4 日連続休まなくても、確率で前倒しで治ることがある
- 感染症中の朝、親遣い抽選で clinic に行ける（90% 確率）
- clinic に行った翌朝、「熱が下がった」モーダル表示
- 治癒翌朝は通常の遊び選択画面に戻る

## 7. Why not（他の選択肢）

### 7.1 Why not：感染症中も S2 を見せて選べる遊びを表示
- そもそも何もできないのにドックを見せるのは UX 上の罠
- 「今日もお休み」を 1 タップで終わらせる方が誠実

### 7.2 Why not：治癒確率を一律 30% にする
- 残日数 3 の初日に 30% で治ると「あれ、すぐ治った」感が強すぎてリアリティが減る
- 「日が経つほど治りやすい」が病気の現実感に合う

### 7.3 Why not：clinic 訪問でその日のうちに治る
- 「お医者さん → すぐ元気」は子育てのリアリティから外れる
- 「今日は薬を飲んで休む → 翌朝には元気」が自然
- ゲーム的にも「保留中の喜び」を 1 ステップ作る方がドーパミン的に強い

### 7.4 Why not：clinic を平日抽選プールに常時混ぜる
- 健康な日に病院に連れて行かれる演出はギャグになりかねない
- `_specialDayMode === "infection"` の時だけ抽選プールに入れる

### 7.5 Why not：通院費用を取る
- 保育園期はプレイヤーが資産を持たないので、無料で OK
- 大人になってから医療費イベントは別途 SPEC-042（経済）で扱う

## 8. 改訂履歴
- 2026-04-26 v1: 初版（PR #27 後のユーザーフィードバック対応）
- 2026-04-26 v2: §3.2 抽選ガードを OR 条件に修正（PR #28 ユーザーフィードバック対応）。
  v1 では感染症最終日に `_infectionRemainingDays = 0` になり、ガードを抜けて児童館・公園などに連れて行かれるバグがあった。
  ヘルパ関数 `pickInfectionDayLocation()` に切り出して厳格化。回帰テスト 3 ケース追加。
