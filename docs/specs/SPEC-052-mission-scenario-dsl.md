# SPEC-052: ミッションシナリオ DSL（ストーリー型ミッションの記述仕様）

| 項目 | 内容 |
|---|---|
| 仕様ID | SPEC-052 |
| 機能名 | ストーリー型ミッションを JSON で記述するための DSL（Domain Specific Language）定義 |
| 対応ファイル | `prototype/data/mission-scenarios.json` / `prototype/game.js` `parseMissionScenario()`, `triggerMissionEvent()`, `evaluateMissionProgress()` |
| 関連仕様 | SPEC-050（ミッション・両親面談）, SPEC-041（NPC）, SPEC-047（場所）, SPEC-027（連絡帳）, SPEC-028（マスタデータ） |
| ステータス | **Draft（SPEC-050 の実装基盤）** |
| 最終更新 | 2026-04-19 |

## 0. 本 SPEC のコンセプト

### 0.1 コンセプト
> **「パズル 9 ピース」シナリオのような感情豊かな体験を、大量に供給できる仕組みを作る**。  
> コードを書かずに JSON 編集だけで「発端 → 触媒 → 挑戦 → 達成」の 4 幕ストーリーを足せる。

### 0.2 Why DSL か
- ミッションを 50〜100 件供給する必要があり、ハードコードでは管理が破綻
- プランナーがコードを触らずに **物語だけ** を増やせる
- テストケースの拡充も JSON 編集だけで可能

### 0.3 Why not：自由なスクリプト言語
- JavaScript でスクリプトを書くと、ゲームのロジックと混ざってテスト・保守が困難
- 宣言的な JSON DSL なら **変更影響範囲が局所化** される
- 高度な分岐は将来的に「シナリオ関数の拡張」で対応

## 1. シナリオの全体構造

各ミッションは **4 つの段階** に分かれる：

```jsonc
{
  "id": "m_puzzle_9",
  "lifeStageTag": "nursery",
  "title": "パズルにちょうせん！",
  "subtitle": "ジグソーパズル 9 ピースを完成させる",
  "priority": 5,
  "allowConcurrent": true,

  "incite":      { /* §2 発端 */ },
  "catalyst":    { /* §3 触媒 */ },
  "challenge":   { /* §4 挑戦 */ },
  "accomplish":  { /* §5 達成 */ }
}
```

### 1.1 共通フィールド

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| `id` | string | ✅ | ユニーク ID（`m_` プレフィックス推奨） |
| `lifeStageTag` | string | ✅ | `nursery` / `kindergarten` / etc |
| `title` | string | ✅ | ミッション名（プレイヤー向け、ひらがな多め） |
| `subtitle` | string | ｜ | サブタイトル（目標の具体像） |
| `priority` | number | ｜ | 候補同士で競合したときの優先度（1-10）、高いほど優先 |
| `allowConcurrent` | boolean | ｜ | 他ミッションと並行可能か（デフォルト true） |
| `prerequisite` | object | ｜ | 前提ミッション（このミッションが発動するための他ミッション完了条件） |

## 2. `incite`（発端）— ミッションが生まれる瞬間

### 2.1 DSL 定義

```jsonc
"incite": {
  "trigger": {
    "type": "enterLocation",
    "location": "children_hall",
    "minAge": 2,
    "probability": 0.6
  },
  "minAge": 2,
  "maxAge": 5,
  "season": ["spring", "summer", "autumn", "winter"],
  "requireSoyou": { "body": 10 },
  "dialog": [
    { "speaker": "narration", "text": "児童館で、他のお友達がパズルで遊んでいる…" },
    { "speaker": "player", "text": "（やってみたい）" }
  ]
}
```

### 2.2 サポートするトリガータイプ

| type | 説明 | 追加フィールド |
|---|---|---|
| `enterLocation` | 特定の場所に到着 | `location`, `probability` |
| `playCount` | 特定の遊びの累計回数 | `playId`, `count` |
| `soyouReached` | 素養が閾値に達する | `soyou`, `value` |
| `npcRelationship` | NPC 関係値が閾値に達する | `npcId`, `value` |
| `seasonStart` | 季節開始 | `season` |
| `fixedDay` | 特定の日（年月日） | `month`, `day` |
| `npcRemark` | NPC の発言（他シナリオからの連鎖） | `npcId`, `topic` |
| `missionCompleted` | 別ミッションの完了 | `missionId` |
| `random` | 確率的（毎朝抽選） | `probability` |

### 2.3 `dialog` の記述規則

- `speaker`：SPEC-041 の NPC ID（`mother`, `father`, `teacher_sakura`, `player`, `narration` など）
- `text`：セリフ本文。ひらがな多めで保育園児の雰囲気に
- `emotion`（optional）：`happy` / `sad` / `surprised` / `happy_cry` / `concerned` など（UI の表情演出に使う）

## 3. `catalyst`（触媒）— 親・先生の励ましで挑戦が始まる

### 3.1 DSL 定義

```jsonc
"catalyst": {
  "dialog": [
    { "speaker": "mother", "text": "パズルがやってみたいのかな？" },
    { "speaker": "mother", "text": "もう少し簡単なのから始めて、練習したらきっとできるようになるよ" }
  ],
  "unlockPlays": ["puzzle_4pieces"],
  "unlockLocations": [],
  "grantItems": [],
  "relationshipDelta": { "mother": 5 },
  "addToMissionBanner": true
}
```

### 3.2 フィールド

| フィールド | 型 | 説明 |
|---|---|---|
| `dialog` | array | 触媒セリフ |
| `unlockPlays` | string[] | 解禁する遊び ID |
| `unlockLocations` | string[] | 解禁する場所 ID |
| `grantItems` | array | アイテム付与（SPEC-011 §14） |
| `relationshipDelta` | object | NPC 関係値の増減 |
| `addToMissionBanner` | boolean | バナーに登録するか（通常 true） |

### 3.3 Why 触媒に親のセリフ？
- **4 つの実感軸③「親が喜んでくれる」** につながる伏線を早い段階で張る
- 親が励ました目標を達成した瞬間、親の喜びが一層濃くなる

## 4. `challenge`（挑戦）— 挑戦期間の描写

### 4.1 DSL 定義

```jsonc
"challenge": {
  "progressHints": [
    {
      "condition": { "playCountAtLeast": { "puzzle_4pieces": 3 } },
      "dialog": [
        { "speaker": "mother", "text": "4 ピースが上手になったね！" }
      ],
      "once": true
    },
    {
      "condition": { "playUnlocked": "puzzle_6pieces" },
      "dialog": [
        { "speaker": "father", "text": "次はもう少し難しいパズルに挑戦してみよう" }
      ],
      "once": true
    }
  ],
  "autoFailConditions": [
    { "type": "ageExceeded", "value": 5 }
  ],
  "persistenceReward": {
    "everyNPlays": 10,
    "soyouGain": { "passion": 3 }
  }
}
```

### 4.2 `progressHints`

- 挑戦中の **中間マイルストーン** で親・先生が声をかける
- `condition` が満たされると **1 回だけ** 発動（`once: true`）
- 進捗ヒントをバナー下に表示

### 4.3 `autoFailConditions`

- ミッションが自動で期限切れになる条件
- 例：`ageExceeded` で 5 歳過ぎてまだ達成していなければ自動で「もう少し大きくなったらね」と諦めフェードアウト

### 4.4 `persistenceReward`

- 挑戦継続へのご褒美
- 「練習 10 回ごとに passion +3」のような、コツコツ報酬

## 5. `accomplish`（達成）— 4 つの実感軸を一気に演出する

### 5.1 DSL 定義

```jsonc
"accomplish": {
  "trigger": {
    "type": "enterLocation",
    "location": "children_hall",
    "autoAttempt": true,
    "requires": {
      "soyouAtLeast": { "body": 30, "intellect": 40, "passion": 50 },
      "playsCompleted": ["puzzle_4pieces", "puzzle_6pieces"]
    }
  },
  "dialog": [
    { "speaker": "narration", "text": "今日は 9 ピースのパズルに挑戦してみる…" },
    { "speaker": "narration", "text": "（じっと集中して…）" },
    { "speaker": "narration", "text": "できた！" },
    { "speaker": "teacher_sakura", "text": "わあ、できたね！すごいね！", "emotion": "amazed" },
    { "speaker": "mother", "text": "ひと月前はできなかったのに、今日はできたね！", "emotion": "happy_cry" }
  ],
  "animation": {
    "type": "confetti_celebration",
    "duration": 1500,
    "sound": "accomplishment"
  },
  "renrakuchoEntry": "今日○○ちゃんがパズル 9 ピースを自分でクリアできました。お母さんがとても喜んでいましたよ。",
  "memorableDay": {
    "type": "mission_accomplishment",
    "emotionText": "パズル 9 ピース、自分でできた日"
  },
  "rewards": {
    "titles": ["puzzle_master"],
    "persistBuffs": [{ "category": "crafting", "multiplier": 1.15, "durationDays": 30 }],
    "soyouBonus": { "intellect": 20, "sensitivity": 15, "passion": 10 },
    "relationshipDelta": { "mother": 10, "teacher_sakura": 5 },
    "unlockPlays": ["puzzle_12pieces"]
  }
}
```

### 5.2 フィールド詳細

| フィールド | 説明 | 関連する実感軸 |
|---|---|---|
| `trigger.autoAttempt` | 条件満たす状態で該当場所到着 → 自動で達成演出を発火 | – |
| `trigger.requires` | 達成のための素養・遊び完了条件 | – |
| `dialog` | 4 軸①②③を埋める会話列 | ① 主人公の達成、② 先生の賞賛、③ 母の喜び |
| `animation` | 演出（紙吹雪・効果音） | 感情の頂点を視覚化 |
| `renrakuchoEntry` | 連絡帳に追加される特別コメント | ④ 親が褒められる |
| `memorableDay` | プロファイル画面「思い出のアルバム」に登録 | ①〜④ すべて、後で振り返れる |
| `rewards.titles` | 獲得称号 | ① できるようになった |
| `rewards.persistBuffs` | 持続バフ（SPEC-047 §8.3） | – |
| `rewards.soyouBonus` | 素養一括ボーナス | – |
| `rewards.relationshipDelta` | NPC 関係値の上昇 | 親・先生との絆 |
| `rewards.unlockPlays` | 次の遊び解禁（続編誘導） | 挑戦の連鎖 |

### 5.3 4 つの実感軸チェックリスト（DSL の validate 時に使う）

各ミッションシナリオは以下を必ず満たすようにレビューする：

- [ ] ①（できるようになる）：`title` と `dialog` の最後に成功体験が明示される
- [ ] ②（認められる）：`dialog` に主人公以外の賞賛セリフが 1 つ以上含まれる
- [ ] ③（親が喜ぶ）：`dialog` に両親の喜びが含まれる（emotion: happy / happy_cry）
- [ ] ④（親が褒められる）：`renrakuchoEntry` が存在し、両親を主語とする

4 軸すべて埋まっていないシナリオは「定量型」に逆戻りするので、DSL のスキーマチェックで warning を出す。

## 6. 連鎖ミッション（シナリオの連続性）

### 6.1 `rewards.unlockPlays` による遊び解禁

パズル 9 ピース達成 → 12 ピースを解禁。次のシナリオ `m_puzzle_12` が  `prerequisite: "m_puzzle_9"` として発動可能に。

### 6.2 `prerequisite` 記述

```jsonc
{
  "id": "m_puzzle_12",
  "prerequisite": { "completed": ["m_puzzle_9"] },
  ...
}
```

### 6.3 Why 連鎖で提示するか
- プレイヤーに「前の成果が次に繋がっている」実感を生む
- コンテンツ大量供給の際、プランナーが「パズルシリーズ」のような **育成系列** をまとめて設計できる

## 7. 進捗バナー・HUD 表現

### 7.1 進捗計算

`challenge.progressHints` の condition が進捗として扱える：

- `playCountAtLeast: { puzzle_4pieces: 3 }` → (現プレイ数 / 3) × 30% 重み
- `soyouAtLeast: { body: 30 }` → min(現値 / 30, 1) × 35% 重み
- 複数条件の平均を取って 0-100% 表示

### 7.2 条件パーサ（実装）

game.js に `evaluateMissionCondition(cond, player)` を実装：

```js
function evaluateMissionCondition(cond, player) {
  if (!cond) return { match: true, progress: 1.0 };
  let match = true, sum = 0, count = 0;
  if (cond.soyouAtLeast) {
    for (const [k, v] of Object.entries(cond.soyouAtLeast)) {
      const p = Math.min(1.0, (player.soyou[k] || 0) / v);
      sum += p; count++;
      if (p < 1) match = false;
    }
  }
  if (cond.playCountAtLeast) {
    for (const [id, v] of Object.entries(cond.playCountAtLeast)) {
      const p = Math.min(1.0, (player.profileStats.playCountByPlay[id] || 0) / v);
      sum += p; count++;
      if (p < 1) match = false;
    }
  }
  // ... 他の condition type
  return { match, progress: count > 0 ? sum / count : 1.0 };
}
```

## 8. シナリオ作成ガイドライン（プランナー向け）

### 8.1 必ず守ること

1. **4 軸すべてを埋めること**（§5.3）
2. **定量と定性を両立**：`rewards` の数値だけに頼らず、`dialog` で感情を描く
3. **長すぎる dialog は避ける**：1 段階あたり 3-5 行が目安
4. **保育園期はひらがな多め**：漢字は「火」「水」等の常用のみ

### 8.2 推奨されるシナリオパターン

| パターン | 発端 | 触媒 | 達成 |
|---|---|---|---|
| **見て憧れる** | 外で他者の様子を見る | 親の励まし＋下位解禁 | 自分でできる、認められる |
| **できない体験** | 試みて失敗 | 親の慰め＋練習手段 | 時を経てできる |
| **人のために** | 他者が困っている | 親のアドバイス | 助けて感謝される |
| **未知との遭遇** | 新しい場所で出会う | 親の説明 | 挑戦して受け入れる |
| **大切な人のために** | 家族の誕生日 | 準備 | プレゼント成功 |

### 8.3 Why not：一発達成型ミッション（発端と達成が同日）

- 「その日のうちに達成」は単なるイベントに近く、「成長物語」にならない
- シナリオは **最低 3-7 日のスパン** で育つように設計する

## 9. JSON スキーマ（バリデーター用）

実装側では JSON スキーマに基づいてロード時にバリデートする：

```jsonc
{
  "type": "object",
  "required": ["id", "lifeStageTag", "title", "incite", "catalyst", "accomplish"],
  "properties": {
    "id": { "type": "string", "pattern": "^m_[a-z_0-9]+$" },
    "lifeStageTag": { "enum": ["nursery", "kindergarten", "elementary", "juniorhigh", "highschool", "university", "worker", "retirement"] },
    "title": { "type": "string", "minLength": 1, "maxLength": 30 },
    // ... 以下詳細
  }
}
```

## 10. 実装ステップ

### Phase 1：DSL パーサと基本エンジン
1. `parseMissionScenario()`：JSON を内部構造に変換
2. `triggerMissionEvent()`：incite トリガー判定
3. `evaluateMissionProgress()`：進捗計算
4. `completeMissionAccomplishment()`：達成演出発火

### Phase 2：10 シナリオの実装
5. `mission-scenarios.json` に SPEC-050 §6 の 10 件を DSL で記述
6. 動作確認

### Phase 3：作成支援ツール（将来）
7. JSON スキーマエラー表示 UI
8. プランナー向けにサンプルジェネレータ

## 11. テスト観点

### 単体テスト
- `evaluateMissionCondition()` の境界値（達成率 0, 0.5, 1.0）
- `parseMissionScenario()` が規格外 JSON を拒否
- 4 軸チェック（dialog・renrakuchoEntry の存在検証）

### 結合テスト
- 児童館入場 → m_puzzle_9 の incite 発動
- 触媒 dialog 表示 → puzzle_4pieces がドックに出現
- puzzle_4pieces 3 回プレイ → progressHints 発動
- 条件満たして児童館再訪 → accomplish 発動、連絡帳にエントリー追加

## 12. 改訂履歴
- 2026-04-19: 初版（SPEC-050 v2 のデータ基盤として DSL を分離）
