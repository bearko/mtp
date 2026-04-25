# SPEC-043: 試験・発表会・評価システム（統合）

| 項目 | 内容 |
|---|---|
| 仕様ID | SPEC-043 |
| 機能名 | 大会・検定・発表会・模試・資格試験の統一的な判定フレームワーク |
| 対応ファイル | `prototype/data/events.json` `scope="evaluation"` / `prototype/game.js` `runEvaluationEvent()`, `calcEventResult()` |
| 関連仕様 | SPEC-024 スキル, SPEC-033 素養, SPEC-039 稽古教室, SPEC-014 部活, SPEC-044 進路・受験 |
| ステータス | **Draft（未実装）** |
| 最終更新 | 2026-04-19 |

## 1. 目的

ゲーム内には成功・失敗で素養が大きく変動する **評価イベント** が数多く存在する：
- 稽古教室の発表会（SPEC-039）
- 部活の大会（SPEC-014）
- 模擬試験（SPEC-015）
- 資格試験（SPEC-016）
- 高校・大学受験（SPEC-044）
- 昇進試験（SPEC-045）

本 SPEC では、これらを **統一的なフレームワーク** で扱う。入力は「関連スキルの Lv」「素養」「英霊」「直近の練習回数」、出力は **合格／優秀／失敗** の 3 段階判定と、素養加算。

## 2. 用語定義
- **評価イベント（Evaluation Event）**：合否判定や順位が付くイベント
- **合格率（Pass Rate）**：成功する確率（0-1）
- **スコア（Score）**：判定に使う内部数値（素養・スキル・直近の活動から算出）
- **ティア**：S / A / B / C / D / F の 6 段階（優秀／良好／合格／ボーダー／不合格／大失敗）

## 3. データ構造

### 3.1 マスタ（evaluation-events）
```json
{
  "id": "piano_recital_1",
  "name": "ピアノ発表会（1回目）",
  "type": "recital",
  "lifeStageTag": "kindergarten",
  "requirements": {
    "relatedCategories": ["music", "sensitivity"],
    "minAge": 5
  },
  "difficulty": 50,
  "scoring": {
    "soyouWeight":     { "sensitivity": 1.0, "passion": 0.3 },
    "skillWeight":     { "music": 2.0 },
    "practiceWeight":  2.0,
    "guardianBonus":   { "david": 0.15 }
  },
  "reward": {
    "S": { "soyouGain": { "sensitivity": 80, "passion": 30 }, "money": 0, "flavor": "大喝采で迎えられた！" },
    "A": { "soyouGain": { "sensitivity": 60, "passion": 20 }, "flavor": "拍手をたくさんもらった" },
    "B": { "soyouGain": { "sensitivity": 40, "passion": 10 }, "flavor": "無事に弾ききれた" },
    "C": { "soyouGain": { "sensitivity": 20, "passion": 5 }, "flavor": "途中つまずいたが最後まで弾いた" },
    "D": { "soyouGain": { "sensitivity": 10 }, "flavor": "緊張で間違えてしまった" },
    "F": { "soyouGain": { "passion": 5 }, "flavor": "悔しい結果に終わった（ジョウネツ +5）" }
  }
}
```

## 4. 判定アルゴリズム

### 4.1 スコア計算
```js
function calcEventScore(ev) {
  let score = 0;
  // 素養
  for (const [key, w] of Object.entries(ev.scoring.soyouWeight || {})) {
    score += (player.soyou[key] || 0) * w;
  }
  // スキル（関連カテゴリの Lv）
  for (const [cat, w] of Object.entries(ev.scoring.skillWeight || {})) {
    const s = player.skills[cat];
    score += (s ? s.lv : 1) * w;
  }
  // 直近の練習回数（過去 30 日）
  const practiceCount = countRecentPlays(ev.requirements.relatedCategories, 30);
  score += practiceCount * (ev.scoring.practiceWeight || 1.0);
  // 英霊ボーナス
  for (const [guardianId, bonus] of Object.entries(ev.scoring.guardianBonus || {})) {
    if (player.guardians.some(g => g.id === guardianId)) {
      score *= (1 + bonus);
    }
  }
  return score;
}
```

### 4.2 ティア判定
```js
function tierFromScore(score, difficulty) {
  const ratio = score / difficulty;
  if (ratio >= 2.0) return "S";
  if (ratio >= 1.5) return "A";
  if (ratio >= 1.0) return "B";
  if (ratio >= 0.7) return "C";
  if (ratio >= 0.4) return "D";
  return "F";
}
```

### 4.3 乱数要素
- 最終スコアに **± 10%** のランダム変動を加える（緊張・コンディション）
- 生活リズム（SPEC-006）が「絶好調」「好調」なら +10%、「絶不調」「不調」なら -15%

## 5. 画面フロー

### 5.1 事前通知
- イベントの 1 週間前に「もうすぐ発表会／大会／試験があります」のモーダル
- プレイヤーは関連遊びを増やして練習する

### 5.2 当日
1. `runEvaluationEvent(eventId)` が呼ばれる
2. 画面は S13 評価画面（新設）に遷移
3. 緊張感のある演出（タイマー、プレイヤーの心拍等）
4. スコア計算 → ティア判定 → 結果発表
5. 素養加算・money 加算・history 記録
6. 続ける → S2 復帰

### 5.3 結果画面（S13）
```
┌──────────────────────────┐
│  🎹 ピアノ発表会            │
│   （あなたは 5歳）           │
├──────────────────────────┤
│                            │
│      結果：A ランク！        │
│                            │
│   「拍手をたくさんもらった」 │
├──────────────────────────┤
│ 🎨 感性 +60               │
│ 🔥 情熱 +20               │
│                            │
│     [ 続ける ]             │
└──────────────────────────┘
```

## 6. イベント種類の整理

| type | 名称 | 関連 SPEC | 代表例 |
|---|---|---|---|
| `recital` | 発表会 | SPEC-039 | ピアノ / バイオリン / ダンス / 絵画 |
| `tournament` | 大会・試合 | SPEC-014, 039 | サッカー / バスケ / 水泳検定 |
| `mock_exam` | 模試 | SPEC-015 | 英語 / 数学 / 総合 |
| `entrance_exam` | 受験 | SPEC-044 | 私立幼稚園 / 中学受験 / 高校受験 / 大学受験 |
| `certification` | 資格試験 | SPEC-016 | 司法試験 / 会計士 / 英検 / 漢検 |
| `promotion` | 昇進試験 | SPEC-045 | 係長 / 課長昇進 |
| `social_event` | 社交イベント | SPEC-039 | 英会話パーティー |

## 7. 連続性（シリーズ化）

### 7.1 発表会は複数回
- ピアノ発表会は年 4 回（3 ヶ月ごと）。回を重ねるごとに `difficulty` が増える
- 連続 A ランク以上で「ピアノが得意な子」の称号を獲得（プロフィール画面の飾り）

### 7.2 大会の階層
- 小学校の校内大会 → 市大会 → 県大会 → 全国大会
- 各階層で勝利するごとに次の階層が解禁

## 8. テスト観点
- Piano 稽古を 30 日間、音楽系遊びを 5 回以上でスコア 1.5 × difficulty 以上を獲得
- 英霊ダビデを召喚中で `sensitivity` 発表会の成功率 +15%
- 絶不調リズムで A ランクから B に下がる可能性

## 9. 改訂履歴
- 2026-04-19: 初版（Issue #14 反映の深掘り）
