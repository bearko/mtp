# SPEC-055: 予告ヒントと能動的達成（プレイヤーの自律性と予測誤差の制御）

| 項目 | 内容 |
|---|---|
| 仕様ID | SPEC-055 |
| 機能名 | ミッション発動前の予告ヒント（mission-prelude）と達成時の意思確認（manualAttempt） |
| 対応ファイル | `prototype/data/mission-scenarios.json`（previewHint 追加・manualAttempt 化）, `prototype/game.js` `renderMissionPrelude()`, `tryStartMissionAccomplish()`, `prototype/index.html` `#mission-prelude`, `#screen-mission-attempt-prompt` / `prototype/styles.css` `.mission-prelude`, `.attempt-prompt` |
| 関連仕様 | SPEC-053（脳科学レビュー §3.1 §3.2）, SPEC-050（ストーリー型ミッション）, SPEC-052（DSL）, SPEC-048 v3（4 軸） |
| ステータス | **Active（PR #21〜24 を前提に追加実装）** |
| 最終更新 | 2026-04-25 |

## 0. 本 SPEC のコンセプト

### 0.1 解決したい問題

SPEC-053（脳科学レビュー）の §3.1 と §3.2 で指摘された 2 つの懸念に対応します：

1. **予測誤差の野放し（§3.1）**：発端の確率発動（例：児童館入場時 60%）は、確率が低すぎると **「期待外れの連続」** になり、Schultz の RPE 理論ではマイナスのドーパミン信号を生む。プレイヤーに **「何かがありそう」の枠組み** を予告し、内容はサプライズに保つ。

2. **自律感の欠如（§3.2）**：達成可能になった瞬間に `autoAttempt: true` で自動発動すると、SDT「自律」を奪う。「自分の意思で挑戦した」感覚が失われる。**「ちょうせんしてみる？」の選択肢** で意思を介在させる。

### 0.2 設計の核心：予測の「枠だけ」与えてサプライズは保つ

> 予測の **完全不在** → 偶然の事象になる
> 予測の **完全的中** → ドーパミン無反応
> 予測の **枠組みだけある** → 「やっぱり！」の喜び（最強の RPE）

Schultz の研究によれば、ドーパミンは「どこかで何かが起きる」枠組みは持ちつつ、具体的な内容と発動タイミングが分からない時に **最大化** する。

### 0.3 設計の核心：能動性 ≒ 自律感

> 「自分が選んでやった」 > 「気づいたら起きていた」

SDT の Autonomy（自律）は、**選択を介在させること** で生まれる。たとえ選択肢が「はい / まだ」の 2 つだけでも、プレイヤーがクリックする行為自体が自律感を生む。

## 1. 予告ヒント（Preview Hint）

### 1.1 表示場所
- **HUD 直下のミッションバナーのさらに上** に小さなスロット
- 1 行で簡潔に：「💭 もうすぐ何か…」
- タップで詳しい場面ヒント（『最近、児童館でなにかが起きそう』）

### 1.2 表示タイミング
- 発端の確率発動条件を持つミッションが **「あと一歩」の状態** になったら表示
- 「あと一歩」の判定：
  - `enterLocation` トリガなら：その場所が **次回の親遣い候補** に含まれている
  - `playCountAtLeast` トリガなら：累計が **必要数の 70% 以上**
  - `soyouAtLeast` トリガなら：素養値が **必要数の 80% 以上**

### 1.3 表示の枠組みと内容

```
💭 もうすぐ何か…
   « 児童館で誰かが見守っている? »
```

- **何が起きるかは伏せる**（予測誤差の枠組みは作るが、サプライズは保つ）
- ただし「場所」「ジャンル」程度のヒントは出す
- 各シナリオの `previewHint` フィールドで指定

### 1.4 v1 では：実装スコープを限定
- 1 つしか表示しない（複数候補があっても優先度トップだけ）
- アニメは控えめ（震える程度の `box-shadow` 揺れ）
- ヒント自体は **タップ可能だが必須アクションではない**（チラ見だけで OK）

## 2. 能動的達成（manualAttempt）

### 2.1 SPEC-052 v2：trigger に `manualAttempt` フラグを追加

```jsonc
"accomplish": {
  "trigger": {
    "type": "enterLocation",
    "location": "children_hall",
    "manualAttempt": true,    // ← 新規
    "requires": { ... }
  },
  ...
}
```

- `autoAttempt: true` から **`manualAttempt: true` に書き換え**
- 互換性：既存 `autoAttempt: true` も読めるが、新規ミッションは `manualAttempt: true` を推奨

### 2.2 達成可能時のフロー

```
[ プレイヤーが場所に到着 ]
        ↓
[ 達成条件を満たしているか？ ]
   No → 通常の S2 へ
   Yes ↓
[ S-mission-attempt-prompt：『ちょうせんしてみる？』モーダル ]
   - はい → 達成シーン発動
   - まだ → S2 へ（後でも挑戦できる）
```

### 2.3 モーダルの構成

```
┌────────────────────────────┐
│  🎯 もうできるかも？         │
├────────────────────────────┤
│  パズルにちょうせん！        │
│  ジグソーパズル 9 ピースを   │
│  完成させる                  │
│                              │
│  「準備できた」              │
│   毎日4ピースを練習してきた  │
│   よ。9ピースに挑戦できる？  │
│                              │
│  [ ちょうせんしてみる ]      │
│  [ まだ、こんどにする ]      │
└────────────────────────────┘
```

### 2.4 「まだ」を選んだ場合の挙動

- 通常の S2 に戻る
- ミッションバナーは ACCEPTED のまま、進捗 100% で表示
- プレイヤーが心の準備ができたら、**もう一度同じ場所に行く** と再度モーダル表示
- バナーで「準備できた！」のフレーバーが表示される

### 2.5 「ちょうせんしてみる」を選んだ場合
- 既存の達成演出（4 軸を埋める dialog → 報酬 → 連絡帳）が発動
- 流れは SPEC-050 §3.2 と同じ

## 3. データ構造

### 3.1 `mission-scenarios.json` への追加

```jsonc
{
  "id": "m_puzzle_9",
  ...
  "incite": {
    "trigger": { "type": "enterLocation", "location": "children_hall", "probability": 0.6 },
    "previewHint": {
      "icon": "💭",
      "headline": "もうすぐ何か…",
      "detail": "児童館で誰かが見守っている?"
    },
    ...
  },
  "accomplish": {
    "trigger": {
      "type": "enterLocation",
      "location": "children_hall",
      "manualAttempt": true,        // ← v2 で追加
      "attemptPrompt": {
        "title": "もうできるかも？",
        "headline": "毎日4ピースを練習してきたよ。9ピースに挑戦できる？",
        "yesLabel": "ちょうせんしてみる",
        "laterLabel": "まだ、こんどにする"
      },
      "requires": { ... }
    },
    ...
  }
}
```

## 4. 実装：ゲームエンジン拡張

### 4.1 予告ヒント計算

```js
function computePreviewHint() {
  const stage = resolveLifeStage(player.age);
  if (!stage) return null;
  const stageId = stage.id;

  for (const m of MISSION_SCENARIOS) {
    if (m.lifeStageTag && m.lifeStageTag !== stageId) continue;
    if (player.completedMissions.includes(m.id)) continue;
    if (player.activeMissions.some((a) => a.id === m.id)) continue;
    if (!m.incite || !m.incite.previewHint) continue;
    const t = m.incite.trigger;
    if (!t) continue;

    let nearReady = false;
    switch (t.type) {
      case "enterLocation":
        // 親遣い先の候補に含まれていれば near
        nearReady = (player.unlockedLocations || []).includes(t.location)
                  || player._parentalOutingToday === t.location;
        break;
      case "playCountAtLeast":
        const count = (player._playCounts || {})[t.playId] || 0;
        nearReady = count >= Math.floor(t.count * 0.7);
        break;
    }
    if (nearReady) {
      return { mission: m, hint: m.incite.previewHint };
    }
  }
  return null;
}
```

### 4.2 manualAttempt の選択フロー

```js
function tryStartMissionAccomplish(mission) {
  const trigger = mission.accomplish && mission.accomplish.trigger;
  if (!trigger) return;
  // 既存：autoAttempt は即発動
  if (trigger.autoAttempt && !trigger.manualAttempt) {
    completeMission(mission);
    return;
  }
  // 新規：manualAttempt は『ちょうせんしてみる？』モーダル
  if (trigger.manualAttempt) {
    showAttemptPromptModal(mission);
    return;
  }
  // どちらの指定もない場合はデフォルトで manualAttempt 扱い
  showAttemptPromptModal(mission);
}
```

### 4.3 モーダルでの選択結果

```js
function onAttemptPromptYes() {
  const mission = _attemptPromptMission;
  _attemptPromptMission = null;
  if (mission) completeMission(mission);
}

function onAttemptPromptLater() {
  // S2 へ戻る、ミッションは ACCEPTED 維持
  _attemptPromptMission = null;
  goChooseFromToday();
}
```

## 5. UI

### 5.1 予告ヒントスロット（HUD 直下）

```html
<div class="mission-prelude" id="mission-prelude" hidden>
  <span class="mission-prelude-icon">💭</span>
  <span class="mission-prelude-text">
    <span class="mission-prelude-headline">もうすぐ何か…</span>
    <span class="mission-prelude-detail">児童館で誰かが見守っている?</span>
  </span>
</div>
```

### 5.2 attempt-prompt モーダル（独立画面）

```html
<section class="screen" id="screen-mission-attempt-prompt">
  <div class="attempt-prompt-stage">
    <div class="attempt-prompt-icon">🎯</div>
    <h2 class="attempt-prompt-title">もうできるかも？</h2>
    <p class="attempt-prompt-subtitle">パズルにちょうせん！</p>
    <p class="attempt-prompt-headline">
      毎日4ピースを練習してきたよ。9ピースに挑戦できる？
    </p>
    <button class="btn btn-primary btn-wide" data-action="attempt-prompt-yes">ちょうせんしてみる</button>
    <button class="btn btn-secondary btn-wide" data-action="attempt-prompt-later">まだ、こんどにする</button>
  </div>
</section>
```

### 5.3 styles.css
- `.mission-prelude`：パステル紫の背景、軽い `pulse` アニメ
- `#screen-mission-attempt-prompt`：温かいベージュ系背景、🎯 を大きく

## 6. テスト観点

### 6.1 単体
- `computePreviewHint()` が active / completed を除外する
- nearReady の判定（playCountAtLeast の 70% 閾値）

### 6.2 結合
- 自宅で song 7 回（70%）以上歌うと、HUD 直下に予告ヒント表示
- 児童館に到着 → 達成条件満たす → モーダル「もうできるかも？」が表示
- 「ちょうせんしてみる」→ 達成演出
- 「まだ、こんどにする」→ S2 復帰、ミッション ACCEPTED 維持
- 同じ場所に再度行くとモーダル再表示

## 7. Why not：他の選択肢を選ばなかった理由

### 7.1 Why not：予告ヒントで具体的な内容を出す
- 「もうすぐ児童館でパズルが」と具体名まで出すと、サプライズ要素がゼロになり RPE が消える
- 「枠組みだけ」にとどめる

### 7.2 Why not：確率を 100% にして発端を確実化
- §3.1 で議論した通り、確実すぎると慣れて RPE が出なくなる
- 60% のままで予告ヒントを足すのが最適

### 7.3 Why not：常に attempt-prompt を出す（autoAttempt 廃止）
- 軽量なミッション（散歩で挨拶した程度）まで毎回モーダルを出すと煩わしい
- 重要なミッションは manualAttempt、軽いものは autoAttempt の使い分けが現実的
- 既存 autoAttempt は互換のため残す

### 7.4 Why not：「まだ、こんどにする」を選んだら数日 cooldown
- プレイヤーが「タイミング待ち」をしたい場合、cooldown を入れると **再挑戦の機会を奪う**
- すぐ再挑戦できる方が SDT 自律性に資する

### 7.5 Why not：予告ヒントを「振動」「音」で派手に
- 通知ハック（注意を独占する）は短期エンゲージメントには効くが、エウダイモニアを毀損
- 静かな box-shadow 揺らぎ程度に留める

## 8. 既存ミッション 3 件の改修方針

| ミッション | manualAttempt 化 | previewHint 内容 |
|---|---|---|
| `m_puzzle_9` | ✅ | 「児童館で誰かが見守っている?」 |
| `m_share_toy` | ✅ | 「公園で誰かが寂しそう?」 |
| `m_song_10` | ✅（playCountAtLeast 型） | 「お父さん・お母さんが何か聞きたそう?」 |

## 9. 改訂履歴
- 2026-04-25: 初版（SPEC-053 §3.1 §3.2 への対応）
