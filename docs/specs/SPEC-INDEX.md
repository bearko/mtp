# 仕様書 索引 / Spec Index

> 仕様駆動開発のルールは [`../DEVELOPMENT_RULES.md`](../DEVELOPMENT_RULES.md) を参照。

## コア機能（Active）

| 仕様ID | 機能名 | ステータス | 対応ファイル | 最終更新 |
|---|---|---|---|---|
| [SPEC-001](./SPEC-001-life-stage.md) | ライフステージ / プレイヤー状態 | Active | `prototype/game.js` (DEFAULT_PLAYER, LIFE_STAGES) | 2026-04-18 |
| [SPEC-002](./SPEC-002-play-selection.md) | 遊び選択（ドック型UI・起床画面統合） | Active | `prototype/game.js` (PLAYS, isPlayAvailable, renderChooseScreen, selectPlay, confirmPlay, renderWakeupHeader) | 2026-04-18 |
| [SPEC-003](./SPEC-003-play-execution.md) | 遊びの描写と結果統合（文脈別フッター・スキップ連打防止） | Active | `prototype/game.js` (startPlay, finalizePlay, replayPlay, showResultActions) | 2026-04-18 |
| [SPEC-004](./SPEC-004-random-event.md) | ランダムイベント | Active | `prototype/game.js` (EVENTS, rollEvent) | 2026-04-18 |
| [SPEC-005](./SPEC-005-parameter.md) | 原体験パラメーター / Lv算出 | Active | `prototype/game.js` (levelFromExp, applyGain) | 2026-04-18 |
| [SPEC-006](./SPEC-006-bio-rhythm.md) | 生活リズム | Active | `prototype/game.js` (nextDay, sleep) | 2026-04-18 |
| [SPEC-007](./SPEC-007-friends.md) | 友人数 | Active | `prototype/game.js` (isPlayAvailable, friend bonus) | 2026-04-18 |
| [SPEC-008](./SPEC-008-sleep.md) | 就寝と翌日への遷移 | Active | `prototype/game.js` (goSleep, sleep, nextDay) | 2026-04-18 |
| [SPEC-009](./SPEC-009-ui-layout.md) | UIレイアウト（固定HUD・固定フッター） | Active | `prototype/styles.css`, `prototype/index.html` | 2026-04-18 |
| [SPEC-010](./SPEC-010-core-time.md) | コアタイム（学びごと・仕事）フレームワーク | Active | `prototype/game.js` (LIFE_STAGES, resolveCoreTime) | 2026-04-18 |
| [SPEC-019](./SPEC-019-stamina-cap.md) | 体力上限（年齢依存）・体力ゼロ挙動・コアタイム吸収 | Active（保育園のみ実装） | `prototype/game.js` (STAMINA_CAP_TABLE, staminaCapForAge, handleStaminaDepleted) | 2026-04-18 |
| [SPEC-020](./SPEC-020-fixed-sleep-cycle.md) | 固定起床・就寝サイクル（低年齢・就寝UI分岐） | Active（保育園のみ実装） | `prototype/game.js` (getFixedSchedule, beginDay, goSleep) | 2026-04-18 |
| [SPEC-021](./SPEC-021-parameter-gauge-ui.md) | パラメーター表示UI（時計円盤＋差分ハイライトゲージ） | Active | `prototype/game.js` (renderGauge, renderGaugeWithDelta, renderClockDial) / `prototype/styles.css` (.gauge, .gauge-bar-base, .gauge-bar-delta) | 2026-04-18 |
| [SPEC-022](./SPEC-022-play-category.md) | 遊びカテゴリ | Active（保育園のみ実装） | `prototype/game.js` (CATEGORIES, PLAYS[*].categories) | 2026-04-18 |
| [SPEC-023](./SPEC-023-play-tree.md) | 遊びツリー（新画面 S7） | Active（保育園のみ実装） | `prototype/game.js` (renderPlayTreeScreen) / `prototype/index.html` (#screen-tree) | 2026-04-18 |
| [SPEC-024](./SPEC-024-skill.md) | スキル（カテゴリ 1:1 のLv 1〜100） | Active（保育園のみ実装） | `prototype/game.js` (player.skills, gainSkillExp, skillLvFromExp, skillBoostMultiplier) | 2026-04-18 |
| [SPEC-025](./SPEC-025-game-tempo.md) | ゲームテンポ設計（自動進行＋ステージ依存時間流速） | Active | `prototype/game.js` (PASSION_PROFILES, runAutoTurn, tempoDaysPerTurn, renderDaySummary) | 2026-04-18 |
| [SPEC-026](./SPEC-026-tutorial.md) | チュートリアル（初週・2週目・スキップ解禁） | Active | `prototype/game.js` (tutorialPhase, isSkipUnlocked) | 2026-04-18 |
| [SPEC-027](./SPEC-027-renrakucho.md) | 連絡帳サマリ（保育園・幼稚園の世界観演出） | Active（保育園のみ実装） | `prototype/game.js` (buildRenrakuchoEntry) / `prototype/styles.css` (.renrakucho-*) | 2026-04-18 |
| [SPEC-028](./SPEC-028-master-data.md) | マスタデータ管理（JSONテーブル化） | Active | `prototype/data/*.json` / `prototype/game.js` (loadMasters) | 2026-04-18 |
| [SPEC-029](./SPEC-029-play-video.md) | 遊び中ムービー再生（`data/videos/{playId}.mp4`） | Active | `prototype/data/videos/*.mp4` / `prototype/game.js` (tryPlayIntroVideo / hidePlayVideo) / `prototype/index.html` (#play-video) | 2026-04-19 |
| [SPEC-030](./SPEC-030-title-screen.md) | タイトル画面「りとらいふ」（S0） | Active | `prototype/index.html` (#screen-title) / `prototype/game.js` (renderTitleScreen, startNewGame) | 2026-04-19 |
| [SPEC-031](./SPEC-031-isekai-intro.md) | 転生イントロ演出（4シーン紙芝居） | Active | `prototype/data/isekai.json`, `prototype/data/names.json` / `prototype/game.js` (startIsekaiIntro, advanceIsekai) | 2026-04-19 |
| [SPEC-032](./SPEC-032-message-master.md) | メッセージマスタ（セリフ・名前の JSON 外部化） | Active | `prototype/data/isekai.json`, `prototype/data/names.json` / `prototype/game.js` (loadMessageMasters) | 2026-04-19 |
| [SPEC-033](./SPEC-033-soyou-model.md) | 素養モデル（原体験 5 カテゴリ統合 + 情熱統合） | Active | `prototype/game.js` (SOYOU_KEYS, soyouGrade, player.soyou) / `prototype/data/plays.json` gain | 2026-04-19 |
| [SPEC-034](./SPEC-034-s2-hud-redesign.md) | S2 遊び選択画面リデザイン（3エリアHUD + 素養カード + ゴーストプレビュー） | Active | `prototype/index.html` #hud, #screen-choose / `prototype/game.js` renderHUD, renderChooseScreen, renderPlayPreview / `prototype/styles.css` .hud-*, .soyou-card | 2026-04-19 |

## ライフステージ別コアタイム

| 仕様ID | ライフステージ | 年齢 | コアタイム | ステータス | 実装状況 |
|---|---|---|---|---|---|
| [SPEC-011](./SPEC-011-nursery.md) | 保育園 | 1〜3歳 | 09:00〜16:00 | **Active** | ✅ 実装済み |
| [SPEC-012](./SPEC-012-kindergarten.md) | 幼稚園 | 4〜6歳 | 09:00〜14:00 | Draft | 未実装 |
| [SPEC-013](./SPEC-013-elementary.md) | 小学校 | 7〜12歳 | 08:00〜15:30 | Draft | 未実装 |
| [SPEC-014](./SPEC-014-juniorhigh.md) | 中学校 | 13〜15歳 | 08:00〜17:00 | Draft | 未実装 |
| [SPEC-015](./SPEC-015-highschool.md) | 高校 | 16〜18歳 | 09:00〜16:00 | Draft | 未実装 |
| [SPEC-016](./SPEC-016-university.md) | 大学 | 19〜22歳 | 09:00〜18:00（カスタマイズ可） | Draft | 未実装 |
| [SPEC-017](./SPEC-017-worker.md) | 社会人 | 23〜65歳 | 09:00〜18:00 | Draft | 未実装 |
| [SPEC-018](./SPEC-018-retirement.md) | 老後 | 66〜100歳 | なし | Draft | 未実装 |

## 新規仕様書を追加するとき

1. 連番 `SPEC-0NN` を確保
2. 本索引に行を追加
3. [`../DEVELOPMENT_RULES.md`](../DEVELOPMENT_RULES.md) の §2 のテンプレートに沿って記述
4. コード側に `@spec` 注釈を入れる
