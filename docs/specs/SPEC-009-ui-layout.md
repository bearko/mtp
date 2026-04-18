# SPEC-009: UIレイアウト（固定HUD・固定フッター）

| 項目 | 内容 |
|---|---|
| 仕様ID | SPEC-009 |
| 機能名 | UIレイアウト規約 |
| 対応ファイル | `prototype/styles.css`, `prototype/index.html` |
| 関連仕様 | 全画面共通 |
| ステータス | Active |
| 最終更新 | 2026-04-18 |

## 1. 目的
画面解像度に依存せず、**下部のアクションボタンが常に画面内に表示** される状態を保証する。  
プレイヤーがスクロールせずに次のアクションを実行できるようにする。

## 2. 用語定義
- **フォンフレーム**：画面全体を包むコンテナ（`.phone-frame`）。
- **HUD**：画面上部に固定されるステータスバー。
- **Scene**：画面本体（スクロール可能な領域）。
- **Actions**：画面下部に固定されるボタンエリア。

## 3. 入力（Input）
- 画面のビューポートサイズ（320px 幅以上、高さ任意）。

## 4. 出力（Output）
- HUD・Scene・Actions の3段構成が常に維持される。

## 5. 挙動（Behavior）

### 5.1 レイアウト構造
```
┌───────────── .phone-frame (100vh, flex column) ─────────────┐
│ .hud       ← 固定（flex-shrink: 0）                          │
├──────────────────────────────────────────────────────────────┤
│ .screen.active                                               │
│   ┌─ .scene (flex: 1, overflow-y: auto) ─┐                   │
│   │  可変コンテンツ                      │                   │
│   └──────────────────────────────────────┘                   │
│   .actions ← 固定（flex-shrink: 0）                          │
├──────────────────────────────────────────────────────────────┤
│ safe-area-inset-bottom で iOS のホームバー分のパディング    │
└──────────────────────────────────────────────────────────────┘
```

### 5.2 CSS要件
- `html, body { height: 100% }` および `body { min-height: 100vh }` で全画面高を確保。
- `.phone-frame`：`height: 100vh; display: flex; flex-direction: column;`（`min-height` ではなく `height` にすることで子要素の overflow が確実に動作する）。
- `.hud`：`flex-shrink: 0;`（縮まない）。
- `.screen.active`：`flex: 1; display: flex; flex-direction: column; min-height: 0;`（flex child の overflow 子を機能させるため `min-height: 0` が必須）。
- `.scene`：`flex: 1; overflow-y: auto; -webkit-overflow-scrolling: touch;`（ここだけがスクロール）。
- `.actions`：`flex-shrink: 0;` 常に画面下に固定。

### 5.3 モバイルSafari対策
- `100vh` は iOS Safari のアドレスバーで変動するため、`height: 100dvh;` を併用する（対応ブラウザのみ）。

### 5.4 ボタンのタップ領域
- 高さ最低 48px（WCAG）／本プロトは 52px 確保。
- `.actions` の bottom padding に `env(safe-area-inset-bottom)` を加算する。

## 6. UIへの反映
- 全画面（S1〜S5）でこのレイアウト規約が適用される。

## 7. 想定される利用シナリオ
- iPhone SE（375×667）でも、Galaxy S8（360×740）でも、下部ボタンがスクロールなしで押せる。
- 長いコンテンツを表示する画面では、中央の Scene エリアのみがスクロールする。

## 8. 例外・エッジケース
- 画面高が 400px 未満の極端に小さいビューポートの場合、Scene が極端に狭くなるが機能は維持される。
