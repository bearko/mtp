# 画面設計書 / Screen Design Document

> ゲーム「カネとジカンとジョウネツと（りとらいふ）」の画面設計書。
> 端末：**スマートフォン縦画面**を想定（最小幅 320px、推奨幅 375〜414px）。
>
> 関連：
> - 開発ルール: [`../DEVELOPMENT_RULES.md`](../DEVELOPMENT_RULES.md)
> - 仕様書索引: [`../specs/SPEC-INDEX.md`](../specs/SPEC-INDEX.md)
> - 画面索引: [`./INDEX.md`](./INDEX.md)
> - **ゲームフロー図**: [`./GAME-FLOW.md`](./GAME-FLOW.md)（Mermaid 形式の繰り返し / ランダム / 分岐の可視化）
> - **デザイン文書**: [`../design/INDEX.md`](../design/INDEX.md)（デザイン憲章 / デザインシステム / UI 改善提案）

> 最終更新: 2026-04-26（SPEC-059 まで反映）

---

## 0. 画面一覧と全体俯瞰

### 設計方針（タップ数最小化）

旧フロー（8 画面）は遷移が多すぎたため、**遊び終了／パラメーター反映／時間経過** の 3 画面を **S3「遊びの描写」** に統合。さらに **連絡帳サマリ S10 / 週末ハイライト S9** を追加し、世界観演出と達成感の集約点を作った。

旧：`起床 → 選ぶ → 描写 → イベント → 終了 → 反映 → 時間経過 → 就寝 → 翌日`（8 画面）
新：`S2 起床+選ぶ → S3 描写+結果 → (S4 イベント) → S5/S10 終了 → (S9 週末) → 翌日`

### 画面 ID 一覧（最新版）

#### コアループ画面

| ID | 画面名 | 主目的 | 対応仕様 |
|---|---|---|---|
| **S0** | タイトル | アプリ起動時の入口 | SPEC-030 |
| **S0'** | 転生イントロ | 4 シーン紙芝居（神との対話・名前入力・転生証明書・誕生） | SPEC-031, SPEC-032 |
| **S2**（S1 統合） | 遊びを選ぶ + 起床ヘッダー | 朝の状態表示 + 余剰時間の投資先選択 | SPEC-001, SPEC-002, SPEC-006, SPEC-020, SPEC-022, SPEC-034 |
| **S3** | 遊びの描写（結果統合） | 演出 → 獲得結果 → 時間経過 を 1 画面で | SPEC-003, SPEC-005, SPEC-007, SPEC-024, SPEC-035 |
| **S4** | ランダムイベント | 遊び中の突発イベント（35% 固定確率） | SPEC-004, **SPEC-056** |
| **S5** | 就寝（大人モード） | 就寝モード選択（10 歳以上） / 自動就寝（1〜9 歳） | SPEC-006, SPEC-008, SPEC-020 |
| **S6** | コアタイム | 学び / 仕事の時間消化 + 発見で遊び解禁 | SPEC-010, SPEC-011〜018 |
| **S7** | 遊びツリー | 解放条件のツリー表示 + 探索 | SPEC-022, SPEC-023, SPEC-024 |
| **S17** | きろく | 目標・できたこと・好きな遊び・思い出を簡易表示 | SPEC-051, SPEC-058 |
| **S18** | 人生ダイジェスト | 節目選択だけで 1〜100歳を通す完走モード | SPEC-059 |
| **S19** | 人生アルバム | 完走モードの選択と思い出をまとめる | SPEC-059 |
| **S9** | 週末ハイライト | 日曜の夜に 1 週間の振り返り | SPEC-025 §7.2, SPEC-035 |
| **S10** | 連絡帳サマリ（1 日の終わり） | 保育園・幼稚園期は連絡帳形式、それ以降は日サマリ | SPEC-027, SPEC-035 |

#### 寄り道画面

| ID | 画面名 | 主目的 | 対応仕様 |
|---|---|---|---|
| **S8** | 情熱プロファイル選択 | Day 8 で 1 度だけ表示。プレイヤーの好みを宣言 | SPEC-025 §6 |
| **S15** | 移動演出 | 親遣いで遠出するときのトラベル演出 | SPEC-047 §7.3 |
| **S16** | 移動結果 | 到着時のフレーバー（fullday_trip は S10 直行） | SPEC-047 §7.4 |

#### モーダル画面（オーバーレイではなく screen 切替）

| ID | 画面名 | 主目的 | 対応仕様 |
|---|---|---|---|
| **S-mission-modal** | ミッションモーダル | 4 幕（はじまり・ひらめき・ちょうせん・たっせい） | SPEC-050, SPEC-052 |
| **S-attempt-prompt** | 「ちょうせんしてみる？」 | 達成可能時のプレイヤー意思介在 | **SPEC-055** §2 |

#### オーバーレイ（HUD 上に重なる）

| 要素 ID | 役割 | 対応仕様 |
|---|---|---|
| `#event-overlay` | 統一イベントモーダル（朝の感染症・親遣い遠出・将来の汎用） | **SPEC-056** §1 |
| `#interrupt-overlay` | 告知系（チュートリアル発見・境界日メッセージ） | SPEC-026 §5 |
| `#mission-prelude` | 予告ヒント「💭 もうすぐ何か…」（HUD 直下） | **SPEC-055** §1 |
| `#mission-banner` | 挑戦中ミッション一覧（HUD 直下、折りたたみ） | SPEC-050 §5 |

### コアループ俯瞰図（簡略版）

> 詳細な分岐・ランダム発火・スキップ動作は [GAME-FLOW.md](./GAME-FLOW.md) を参照。

```
[ アプリ起動 ]
       │
       ▼
   S0 タイトル ──── 続きから ───┐
       │ はじめから              │
       ▼                          │
  S0' 転生イントロ                │
       │                          │
       ▼                          │
[ 朝のモーダル消化（感染症・遠出）] ← #event-overlay
       │                          │
       ▼                          │
  親遣い? ── あり ─▶ S15 → S16 ──┤
       │ なし                     │
       ▼                          │
  S2 遊びを選ぶ ◀──────── 連続 ───┤
       │                          │
       ├── 遊び ─▶ S3 ─ 35% ─▶ S4 │
       │           │              │
       │           ▼              │
       │     結果アクション ──────┤
       │                          │
       ├── 体力 0 / 余剰 0 / 病気 ▶ S5 or S10
       │                          │
       └── 朝コアタイム到達 ─▶ S6 ─▶ S2 夜
                                   │
                          日曜? ─▶ S9 ─▶ 翌朝
                          通常 ─▶ 翌朝（S2 へ）
```

オーバーレイ系（`#mission-prelude`, `#mission-banner`, `#event-overlay`, `#interrupt-overlay`, S-mission-modal, S-attempt-prompt, parental compliment modal）は **横断的に S2/S3/S10 から発火** する。詳細は [`GAME-FLOW.md`](./GAME-FLOW.md) §3 を参照。

HUD 案採用プロトタイプ（SPEC-058）では、S2 をゲーム HUD 寄りの情報設計で固定し、毎日表示の焦点カードと `🌱 きろく` 導線を追加する。画面 ID と遷移は変えない。

SPEC-059 では S2 に `完走モード` 入口を追加する。通常の保育園 1 日ループを維持しつつ、S18/S19 で「人生全体の資源ジレンマ」を短時間で検証できる導線とする。

---

## 1. グローバル仕様（SPEC-009 / SPEC-034 準拠）

### 1.1 共通 HUD（上部固定 / S2・S3・S10 等）

3 エリアに分割（SPEC-034 §4.4）：

```
┌─────────────────────────────────────────┐
│ 保育園1年目 / 1歳 / あと8時間           │
├──────────── 中央エリア ─────────────────┤
│         2026年4月1日（水）               │
│         😊 絶好調 ❤❤❤❤❤ 15/15           │
├──────────── 右エリア ───────────────────┤
│              💰 0  👥 2  🏠 自宅        │
└─────────────────────────────────────────┘
```

`#hud-location`（右下）は SPEC-047 で **現在地** に置き換わった。旧「ジョウネツ等級」は廃止し、Soyou カード（S2 本体）でのみ表示。

### 1.2 画面下部ボタンエリア（固定）

- 解像度に依存せず常に画面内に表示（SPEC-009）
- ボタン高さ最低 52px
- 横並びは最大 2 〜 3

### 1.3 画面遷移アニメーション

- フェード + 上方向スライド 220ms
- モーダル系（S-mission-modal, attempt-prompt, event-overlay）は中央 pop アニメ

### 1.4 オーバーレイ重ね順

```
z-index:
  10  : #mission-banner / #mission-prelude  (HUD 直下)
  100 : #interrupt-overlay
  1000: #event-overlay   (最上位)
  -   : screen-* (通常画面、active クラスで切替)
```

---

## 2. 各画面の詳細（コアループ）

> **方針**：本ドキュメントには **画面 ID と遷移先** のみ記載し、ワイヤーフレーム / 計算式 / 描画ルールは対応 SPEC を参照する。これにより画面が増えても本書が肥大化しない。

### S0 タイトル
- **対応**: [SPEC-030](../specs/SPEC-030-title-screen.md)
- **遷移元**: アプリ起動
- **遷移先**: S0' 転生イントロ（はじめから）/ S2（つづきから）

### S0' 転生イントロ
- **対応**: [SPEC-031](../specs/SPEC-031-isekai-intro.md), [SPEC-032](../specs/SPEC-032-message-master.md)
- 4 シーン紙芝居（暗闇 → 神との対話 → 転生証明書 → 誕生）
- **遷移先**: S2（最終 scene4 タップ）

### S2 遊びを選ぶ + 起床ヘッダー
- **対応**: [SPEC-002](../specs/SPEC-002-play-selection.md), [SPEC-034](../specs/SPEC-034-s2-hud-redesign.md)
- 朝の状態表示と Soyou カード（5 カテゴリ）が中央。下部ドックで遊びを選択。
- **遷移元**: S0' / S3 結果アクション / S6 / 翌朝（nextDay）
- **遷移先**: S3 / S6 / S5 or S10 / S15 / S-mission-modal

### S3 遊びの描写（結果統合）
- **対応**: [SPEC-003](../specs/SPEC-003-play-execution.md), [SPEC-035](../specs/SPEC-035-result-summary-ui.md)
- 演出 2.4 秒 → 35% で S4 → 結果統合
- **遷移先**: S4（35%）/ 結果統合後 S2 / S5 / S10 / S-attempt-prompt（達成可能時）

### S4 ランダムイベント
- **対応**: [SPEC-004](../specs/SPEC-004-random-event.md), [SPEC-056](../specs/SPEC-056-event-modal-unified.md) §3
- 35% 固定確率、コメント欄追加（SPEC-056 v1）
- **遷移先**: S3 結果フェーズ

### S5 就寝（大人モード）
- **対応**: [SPEC-008](../specs/SPEC-008-sleep.md)
- 10 歳以上のモード選択（早寝 / 普通 / 夜更かし）
- **遷移先**: 翌朝（nextDay 経由で S2）

### S6 コアタイム
- **対応**: [SPEC-010](../specs/SPEC-010-core-time.md), [SPEC-011](../specs/SPEC-011-nursery.md)
- 保育園のみ実装。発見で遊びを解禁。
- **遷移先**: S2 夜の遊びまたは S5/S10

### S7 遊びツリー
- **対応**: [SPEC-022](../specs/SPEC-022-play-category.md), [SPEC-023](../specs/SPEC-023-play-tree.md), [SPEC-024](../specs/SPEC-024-skill.md)
- 寄り道画面。S2 ドック右端 🌳 から遷移。
- **遷移先**: S2

### S17 きろく
- **対応**: [SPEC-051](../specs/SPEC-051-profile-screen.md), [SPEC-058](../specs/SPEC-058-ui-design-prototypes.md)
- S2 ドック右端 `🌱 きろく` から遷移。目標・できたこと・好きな遊び・思い出の簡易プロトタイプを表示。
- **遷移先**: S2

### S8 情熱プロファイル選択
- **対応**: [SPEC-025](../specs/SPEC-025-game-tempo.md) §6
- Day 8（phase1 開始）で 1 度だけ表示

### S9 週末ハイライト
- **対応**: [SPEC-025](../specs/SPEC-025-game-tempo.md) §7.2, [SPEC-035](../specs/SPEC-035-result-summary-ui.md)
- 日曜の夜の S10 後に 1 度
- **遷移先**: 翌朝（月曜の S2）

### S10 連絡帳サマリ（1 日の終わり）
- **対応**: [SPEC-027](../specs/SPEC-027-renrakucho.md), [SPEC-035](../specs/SPEC-035-result-summary-ui.md), [SPEC-057](../specs/SPEC-057-infection-recovery.md) §1
- 保育園・幼稚園期は連絡帳形式
- 感染症日は S2 をスキップして直接ここへ（SPEC-057）
- **遷移先**: S9（日曜のとき）/ 翌朝

---

## 3. 寄り道画面

### S15 移動演出
- **対応**: [SPEC-047](../specs/SPEC-047-location-map.md) §7.3
- 親遣いで遠出するときの 1.6 秒トラベル
- **遷移先**: S16

### S16 移動結果
- **対応**: [SPEC-047](../specs/SPEC-047-location-map.md) §7.4
- fullday_trip は直接 S10 に飛ぶ（runFullDayEvent）
- **遷移先**: S2 / S10（fullday_trip）

---

## 4. モーダル画面

### S-mission-modal ミッションモーダル
- **対応**: [SPEC-050](../specs/SPEC-050-annual-mission.md), [SPEC-052](../specs/SPEC-052-mission-scenario-dsl.md)
- 4 幕：はじまり / ひらめき / ちょうせん / たっせい
- **発火**：onLocationEntered, onPlayFinalized, S-attempt-prompt 経由

### S-attempt-prompt 「ちょうせんしてみる？」
- **対応**: [SPEC-055](../specs/SPEC-055-preview-hint-and-manual-attempt.md) §2
- 達成可能になった時にプレイヤー意思を介在
- 「うたってみる」 / 「まだ、こんどにする」の 2 択
- **特殊**: 体力 0 でも表示・進行可能（SPEC-056 §4 デザートは別腹）

---

## 5. オーバーレイ

### `#event-overlay` 統一イベントモーダル
- **対応**: [SPEC-056](../specs/SPEC-056-event-modal-unified.md) §1
- 構成：イラスト + タイトル + 説明 + 影響リスト + NPC コメント
- **発火例**：朝の感染症「風邪をひいた」、親遣い「動物園に行ってきた」、治癒「熱が下がった」

### `#interrupt-overlay` 告知オーバーレイ
- **対応**: [SPEC-025](../specs/SPEC-025-game-tempo.md) §6, [SPEC-026](../specs/SPEC-026-tutorial.md) §5
- チュートリアル発見、境界日メッセージ、新解禁告知

### `#mission-prelude` 予告ヒント
- **対応**: [SPEC-055](../specs/SPEC-055-preview-hint-and-manual-attempt.md) §1
- HUD 直下にパステル紫スロット「💭 もうすぐ何か…」

### `#mission-banner` ミッションバナー
- **対応**: [SPEC-050](../specs/SPEC-050-annual-mission.md) §5
- HUD 直下、折りたたみ式の挑戦中ミッション一覧

---

## 6. データモデル（プロトタイプ用）

> 詳細は [SPEC-001](../specs/SPEC-001-life-stage.md), [SPEC-033](../specs/SPEC-033-soyou-model.md) 参照。

```ts
type PlayerState = {
  // 基本
  age: number;
  day: number;
  season: "spring" | "summer" | "autumn" | "winter";
  clockHour: number;
  clockMinute: number;
  spareHours: number;
  // ステータス
  stamina: number;
  staminaCap: number;
  bioRhythm: number;
  money: number;
  friends: number;
  // SPEC-033 素養（旧 exp は alias）
  soyou: { body: number; intellect: number; sensitivity: number; social: number; passion: number; };
  // SPEC-024 スキル
  skills: { [category: string]: { lv: number; exp: number } };
  // SPEC-047 場所
  location: string;
  unlockedLocations: string[];
  persistBuffs: PersistBuff[];
  // SPEC-050/052 ミッション
  activeMissions: { id: string; state: "INCITED" | "ACCEPTED" | "COMPLETED"; ... }[];
  completedMissions: string[];
  titles: { id: string; awardedDay: number }[];
  // SPEC-027 連絡帳
  renrakuchoHighlights: ContactBookEntry[];
  memorableDays: MemorableDay[];
  // SPEC-011 §10 / SPEC-057 感染症
  _specialDayMode: null | "outing" | "infection" | "clinic";
  _infectionRemainingDays: number;
  _visitedClinicToday: boolean;       // SPEC-057 §3
  _infectionJustHealed: boolean;      // SPEC-057 §2
  // SPEC-056 ペンディング
  _pendingMorningEventModals: EventModalOption[];
  _pendingStaminaDepleted: boolean;
  // 内部キャッシュ
  _autoHighlight: WeeklyHighlight;
  _daySnapshot: DaySnapshot;
  // ... ほか SPEC-025 / SPEC-026 / SPEC-054 関連 ...
};
```

---

## 7. 拡張予定（骨子の外）

- 幼稚園以降のライフステージ実装（SPEC-012〜018）
- セーブ機能（LocalStorage / IndexedDB）
- 100 歳エンディング & 人生アルバム
- 経済システム（SPEC-042）, NPC 関係システム（SPEC-041）

## 改訂履歴
- 2026-04-26 v3: 全画面 ID リスト最新化（S0/S0'/S9/S10/S15/S16/S-mission-modal/S-attempt-prompt + オーバーレイ系）。SPEC-057 反映。本書は **画面一覧と遷移先のみ** 担当し、詳細は対応 SPEC へ集約する方針に転換。
- 2026-04-19 v2: S7 遊びツリー追加。
- 2026-04-04 v1: 初版（5 画面 + 1 イベント）。
