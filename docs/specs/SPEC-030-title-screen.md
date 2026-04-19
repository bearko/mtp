# SPEC-030: タイトル画面（りとらいふ）

| 項目 | 内容 |
|---|---|
| 仕様ID | SPEC-030 |
| 機能名 | タイトル画面 |
| 対応ファイル | `prototype/index.html` `#screen-title` / `prototype/game.js` `renderTitleScreen()`, `startNewGame()` / `prototype/styles.css` `.title-*` |
| 関連仕様 | SPEC-031（転生イントロ）, SPEC-032（メッセージマスタ） |
| ステータス | Active |
| 最終更新 | 2026-04-19 |

## 1. 目的

ゲーム起動時に必ず表示される **タイトル画面**（S0）を追加し、「はじめから／続きから」の導入口を設ける。従来はゲーム起動時にいきなり S2（遊び選択）へ遷移していたが、世界観演出（SPEC-031）を挟む前段として S0 を設ける。

## 2. 用語定義
- **S0 タイトル画面**：ゲーム起動直後に表示される画面。タイトルロゴ + 2 ボタン
- **はじめから**：新規ゲームを始める導線。押下で SPEC-031 の転生イントロへ進む
- **続きから**：セーブデータから再開する導線。今回は **無効化**（常に disabled）

## 3. 前提
- タイトルは「**りとらいふ**」（プロダクト名「カネとジカンとジョウネツと」の内包企画）
- セーブ機能は未実装（将来の SPEC でローカルストレージ対応予定）

## 4. 画面仕様

### 4.1 ワイヤーフレーム
```
┌────────────────────────────┐
│                            │
│                            │
│       （ロゴ装飾）          │
│                            │
│      りとらいふ             │
│                            │
│   ── ── ── ── ── ──        │
│                            │
│   ┌──────────────────┐    │
│   │   はじめから       │    │  アクティブ
│   └──────────────────┘    │
│   ┌──────────────────┐    │
│   │   続きから（近日） │    │  disabled
│   └──────────────────┘    │
│                            │
│   © カネとジカンとジョウネツと │
└────────────────────────────┘
```

### 4.2 表示要素
- ロゴ文字：「りとらいふ」（セリフ系大文字、文字サイズ 48-56px、縦書き風装飾は不要）
- サブタイトル：「— あそびと人生のリトライ —」
- はじめから ボタン（`#btn-title-start`）：押下で `startNewGame()` を呼ぶ
- 続きから ボタン（`#btn-title-continue`）：`disabled` 固定、ラベル「続きから（近日対応）」
- フッター：著作権風テキスト

### 4.3 遷移
- **起動直後**：`DOMContentLoaded` → `loadMasters()` → `showScreen("screen-title")`
- **はじめから**：`startNewGame()` → `showScreen("screen-isekai")`（SPEC-031）
- **続きから**：無効化。押下しても何もしない（ボタンに `disabled` 属性）

### 4.4 共通 HUD
S0 では HUD を **表示しない**。`.hud` 要素にクラス `.hud-hidden` を付与するか、`#screen-title` がアクティブな間は HUD を display:none にする。

## 5. 実装

### 5.1 HTML
```html
<section class="screen active" id="screen-title">
  <div class="title-container">
    <div class="title-logo-mark">🌱</div>
    <h1 class="title-logo">りとらいふ</h1>
    <p class="title-sub">— あそびと人生のリトライ —</p>
    <div class="title-actions">
      <button class="title-btn primary" id="btn-title-start" data-action="title-start">はじめから</button>
      <button class="title-btn" id="btn-title-continue" disabled>続きから（近日対応）</button>
    </div>
    <p class="title-footer">© カネとジカンとジョウネツと</p>
  </div>
</section>
```

### 5.2 JS
```js
function startNewGame() {
  // プレイヤーをデフォルトで初期化（SPEC-001）
  player = structuredClone(DEFAULT_PLAYER);
  // 転生イントロへ（SPEC-031）
  startIsekaiIntro();
}
```

### 5.3 HUD 非表示処理
`showScreen(id)` の既存ロジックに、`id === "screen-title" || id === "screen-isekai"` の場合は `.hud` に `hidden` 属性を付ける、それ以外では外す、という分岐を追加する。

## 6. 失敗モードと UX
- マスタ読み込み失敗：タイトル画面は表示できる（ボタン押下後に `DEFAULT_PLAYS` にフォールバック）
- ブラウザ超小画面：縦並びボタンで潰れないよう max-width 360px

## 7. テスト観点
- 起動時に必ず S0 が表示される
- 「はじめから」で転生イントロへ進む
- 「続きから」は常に disabled
- S0 では HUD が見えない

## 8. 改訂履歴
- 2026-04-19: 初版
