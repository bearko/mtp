# SPEC-056: ランダムイベント統一モーダル + ミッション体力 0 許容

| 項目 | 内容 |
|---|---|
| 仕様ID | SPEC-056 |
| 機能名 | 全ランダム発火イベントの統一モーダル化（イラスト + コメント + 影響）と、ミッション挑戦の体力 0 許容（デザートは別腹） |
| 対応ファイル | `prototype/data/events.json`（リッチ化）, `prototype/data/morning-events.json`（新設）, `prototype/game.js` `showEventModal()`, `runMorningEventQueue()`, `tryStartMissionAccomplish()`（体力 0 許容） , `prototype/index.html` `#event-overlay`, `prototype/styles.css` `.event-overlay-*` |
| 関連仕様 | SPEC-004（S4 ランダムイベント）, SPEC-011 §10（保育園感染症）, SPEC-047（場所システム）, SPEC-050/052（ミッション）, SPEC-055（manualAttempt） |
| ステータス | **Active** |
| 最終更新 | 2026-04-26 |

## 0. 本 SPEC のコンセプト

### 0.1 解決したい問題

GAME-FLOW.md（PR #26）で 4 系統に分類したランダム発火イベントのうち、**朝の発火**（感染症・親遣い遠出の旧経路）が **トーストだけ** で済まされており、**「何が起きたか」「なぜ影響が出ているか」がプレイヤーに伝わらない** 問題があった。

> ユーザーフィードバック (PR #25 後の打診):
> 「ランダム系のイベントは、何が起きたかわかりやすいようにポップアップか、画面を間に挟んでください。
>  各種ランダムイベントに対してイラスト付きで説明、コメント、影響をわかりやすく伝えたい」

### 0.2 解決方針 1：統一モーダル

すべてのランダム発火イベントを、共通の **「イベントモーダル」** で表現する：

```
┌────────────────────────────┐
│         🤧                  │ ← 大きなイラスト（emoji or 後日 PNG 化）
│    風邪をひいてしまった       │ ← タイトル
│                              │
│  保育園で風邪をもらってきた   │ ← 説明（情景）
│  みたい。3日間お休みだ…     │
│                              │
│  ┌──── 影響 ────┐           │
│  │ 余剰時間  −8h │           │ ← 影響リスト（before→after）
│  │ 感染症    3日 │           │
│  └──────────────┘           │
│                              │
│  「お母さんが心配そうに      │ ← コメント（NPC のセリフ）
│   見守っている」             │
│                              │
│  [   なるほど   ]            │
└────────────────────────────┘
```

### 0.3 解決方針 2：ミッション挑戦は体力 0 でも OK

> ユーザー: 「ミッションについてはその時点で体力ゼロでも挑戦できるようにしてほしいです。
>            分岐自体が不要になる想定（**デザートは別腹**、みたいな、楽しいブーストがかかって
>            体力残ってなくても遊べる的な概念）」

#### 設計の核心：ミッション達成は「体力消費」ではなく「物語の到達」

通常の遊びは身体的な疲労を伴うが、ミッションの達成シーンは **「やってきたことの結実」** であり、新たな疲労を伴わない。むしろ達成の喜びがブースト効果として機能する。

#### 実装規則
1. `manualAttempt` 達成プロンプトの表示自体は **体力ゼロでも妨げない**
2. 「うたってみる」を押した瞬間、達成シーン演出を最優先で表示
3. 達成シーンが終わった後で初めて `handleStaminaDepleted()` を呼ぶ
4. 達成時の素養加算は通常通り適用される（時間消費・体力消費はゼロ）

## 1. 統一イベントモーダル（`#event-overlay`）

### 1.1 既存資産の整理

既存の `#interrupt-overlay` は **アイコン + タイトル + 説明** の 3 要素のみ対応。これを拡張するのではなく、**新規 `#event-overlay`** を立てて棲み分けを明確にする：

| オーバーレイ | 用途 | 構成 |
|---|---|---|
| `#interrupt-overlay`（既存） | チュートリアル発見・境界日メッセージ等の **告知系** | アイコン + タイトル + 本文 |
| **`#event-overlay`（新規）** | ランダム発火・状態変化を伴う **イベント系** | アイコン + タイトル + 説明 + **影響リスト** + **コメント** |

### 1.2 DOM 構造

```html
<div id="event-overlay" class="event-overlay" hidden>
  <div class="event-modal">
    <div class="event-modal-art" id="event-modal-art">🎒</div>
    <h3 class="event-modal-title" id="event-modal-title">タイトル</h3>
    <p class="event-modal-desc" id="event-modal-desc">情景の説明</p>
    <div class="event-modal-effects" id="event-modal-effects" hidden>
      <div class="event-modal-effects-title">影響</div>
      <ul class="event-modal-effects-list" id="event-modal-effects-list"></ul>
    </div>
    <p class="event-modal-comment" id="event-modal-comment" hidden>
      <span class="event-modal-comment-speaker" id="event-modal-comment-speaker">お母さん</span>
      <span class="event-modal-comment-body" id="event-modal-comment-body">セリフ</span>
    </p>
    <button class="btn btn-primary btn-wide" data-action="event-modal-close">なるほど</button>
  </div>
</div>
```

### 1.3 API：`showEventModal({...})`

```js
showEventModal({
  art:     "🤧",                 // emoji 大 or img path（後日対応）
  title:   "風邪をひいてしまった",
  desc:    "保育園で風邪をもらってきた…3日間お休みだ",
  effects: [                     // 必須ではない
    { label: "余剰時間",  delta: -8, unit: "h" },
    { label: "感染症日数", delta: 3,  unit: "日" }
  ],
  comment: {                     // 必須ではない（NPC コメント）
    speaker: "お母さん",
    body:    "ゆっくり休もうね"
  },
  buttonLabel: "なるほど",        // デフォルト「なるほど」
  onClose:     () => {...}        // 閉じた後に実行する callback
});
```

### 1.4 影響リスト（effects）の表示規則
- `delta > 0` → 緑色、`+N`
- `delta < 0` → 赤色、`-N`（マイナスは強調）
- `delta = 0` → 灰色（通常表示）
- `unit` 指定があれば末尾に付ける（`h` / `日` / 体力 / 友人 etc）

## 2. 朝のランダム発火イベントのデータ化

### 2.1 新マスター `morning-events.json`

旧 `_pendingOuting`（`events.json` scope=`parental_outing`）と、感染症（コードに直書き）の 2 つを 1 つの **morning event** マスターに統合する：

```jsonc
[
  {
    "id": "morning_infection_cold",
    "category": "infection",
    "art": "🤧",
    "title": "風邪をひいてしまった",
    "desc": "保育園で風邪をもらってきたみたい。3日間はお休み…",
    "comment": { "speaker": "mother", "body": "ゆっくり休もうね" }
  },
  {
    "id": "morning_outing_zoo",
    "category": "fullday_trip",
    "art": "🦁",
    "title": "動物園に行くことになった！",
    "desc": "今日はパパお休み。動物園に連れて行ってくれるって！",
    "comment": { "speaker": "father", "body": "今日は思いっきり楽しもう" }
  },
  ...
]
```

### 2.2 連携と移行
- 既存 `events.json` の `scope: "parental_outing"` 5 件は廃止予定（v2 で削除）。
- 既存実装 `maybeTriggerNurserySpecialEvent()` は **モーダル方式に書き換え**：
  - トースト → `showEventModal()` 呼び出し
  - 親遣い遠出は SPEC-047 の S15/16 経路に統合
  - 感染症のみ朝に静的モーダル表示（S15 経路には入らない）

## 3. S4 ランダムイベント（既存画面）の統一

### 3.1 課題
現状、S4 は独立画面（`screen-event`）でアイコン・タイトル・説明・影響を表示しているが、コメントが無く、他のイベントとの **演出統一感** が無い。

### 3.2 対応
SPEC-056 v1 では：
- **S4 独立画面はそのまま維持**（既存テストとの互換性のため）
- ただし、`events.json` のレコードに **`comment` フィールド（任意）** を追加し、S4 画面でも下部に表示するよう `renderEvent()` を拡張
- v2 以降で S4 を `event-overlay` に統合検討（モーダル化することで「遊び続行 → 結果表示 → イベントモーダル → 結果表示」の流れがスムーズになる可能性）

### 3.3 events.json のスキーマ拡張

```jsonc
{
  "id": "event_lost_money",
  "icon": "💸",
  "title": "ポケットの小銭をなくした",
  "text": "走って遊んでいたら、ポケットから小銭が落ちたみたい",
  "weight": 4,
  "scope": "any",
  "effect": { "money": -50 },
  "comment": { "speaker": "narration", "body": "今度から確認しようね" }
}
```

`comment` は省略可。省略時は従来通りコメント欄非表示。

## 4. ミッション挑戦：体力 0 許容（デザートは別腹）

### 4.1 現状の問題
`finalizePlay()` の処理順序：
```
1. 素養加算
2. 体力消費
3. onPlayFinalized()  ← ミッション達成プロンプトが表示される
4. if (player.stamina <= 0) handleStaminaDepleted() ← 強制就寝が走る
```

#### ケース A: プロンプト表示中に handleStaminaDepleted が画面を上書き
プロンプトモーダル `screen-mission-attempt-prompt` が `showScreen()` で表示された直後、`handleStaminaDepleted()` が別画面に `showScreen()` してしまう **画面競合バグ** が潜在的に存在。

#### ケース B: 体力 0 状態で manualAttempt をブロックする条件分岐
今のところ `tryStartMissionAccomplish()` 内に体力チェックは無い。**この問題は無い**。

### 4.2 対応：ミッションフラグを立てて handleStaminaDepleted を遅延

```js
// finalizePlay() 内
try { onPlayFinalized(play); } catch (e) { ... }

// 体力ゼロ判定（SPEC-056 §4.2）
//   ミッション系モーダル（達成プロンプト・発端・触媒・達成シーン）が表示されている間は遅延
if (player.stamina <= 0) {
  if (isMissionModalActive()) {
    player._pendingStaminaDepleted = true;  // モーダル閉じ時に発動
  } else {
    handleStaminaDepleted();
    return;
  }
}
```

ミッションモーダル/プロンプトを閉じた直後に `_pendingStaminaDepleted` をチェックして消化。

### 4.3 達成シーンは「体力ゼロでも完走」する
- `completeMission()` 内では時間消費・体力消費は **行わない**（既存通り）
- 達成モーダルの「つぎへ」を全部押して S2 に戻った時点で、`_pendingStaminaDepleted` が true なら強制就寝へ
- → **「ミッション達成 → そのまま就寝」** という自然な流れになる

### 4.4 デザートは別腹のメタファ

> 体力（夕食）が満腹でも、「デザート（ミッション達成）」は別の喜びとして体験できる。
> 楽しさのブーストが、疲労を一時的に忘れさせてくれる。

このメタファを **モーダルの一言コメントに反映**：

```
🎉 達成！
「あきらめずにやれたね！」
（疲れていたけど、最後まで集中できた）
```

## 5. 影響範囲

### 5.1 既存仕様への影響
- SPEC-004（S4 ランダムイベント）: スキーマに `comment` 任意フィールド追加（後方互換）
- SPEC-011 §10（保育園特別イベント）: トースト → モーダル化（v2 反映）
- SPEC-019 §5.4（体力ゼロ）: ミッションモーダル中は遅延（v2 反映）
- SPEC-055（manualAttempt）: 体力 0 でも挑戦可能を明示

### 5.2 既存テストへの影響
- 朝の感染症は `toast()` 確認をしていないため、テスト破壊なし
- ミッション達成テストは体力 15/15 の状態で動かしているため、影響なし
- 新規追加：体力 1 → manualAttempt → 達成可能の整合性テスト

## 6. テスト観点

### 6.1 単体
- `showEventModal()` で effects / comment 省略時に該当領域が hidden になる
- delta の正負で色クラスが切り替わる

### 6.2 結合
- 朝に感染症発動 → `event-overlay` がイラスト + コメントで表示
- S4 ランダムイベントに comment フィールドがあるとコメント欄表示
- 体力 1 で song を遊んで体力 0 に → manualAttempt プロンプトが先に表示される
- 「うたってみる」→ 達成モーダル → S2 → 強制就寝（pending stamina depleted）

## 7. Why not（他の選択肢）

### 7.1 Why not：S4 画面も即座に event-overlay に統合
- 既存 S4 はテスト多数、画面遷移依存の処理（pendingEvent → finalizePlay）も多い
- v1 では comment フィールド追加のみで延命、v2 で統合検討の方が安全

### 7.2 Why not：ミッション挑戦時に体力を回復させる
- 「達成は体力に左右されない」の方が物語的に自然
- 「自動回復」だと無料ヒールになり、通常プレイのバランスが崩れる

### 7.3 Why not：handleStaminaDepleted を完全に廃止
- 通常プレイで体力 0 になったら強制就寝はゲーム性として必要
- ミッション中だけ遅延、というスコープが合理的

### 7.4 Why not：影響リストに「累積後の値」を表示
- 「+8h → 12h/14h」のように累積を見せると数値ゲー感が強まる
- delta だけ見せて、HUD 側で累積を確認してもらう方がエウダイモニア的

### 7.5 Why not：comment を必須化
- すべての S4 イベントにコメントを書くと工数が増えて、世界観が散漫になりがち
- 「キャラクターが何か言いたくなる時だけ」のオプション扱いが適切

## 8. 改訂履歴
- 2026-04-26 初版（PR #26 GAME-FLOW.md のフィードバック対応）
