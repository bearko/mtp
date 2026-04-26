# SPEC-INDEX.md への追記内容

以下の行を「コア機能（Active）」テーブルの末尾（SPEC-057の行の直下）に追加してください。

---

| [SPEC-058](../design/SPEC-058-design-system.md) | デザインシステム & デザイン憲章（カラー・タイポ・コンポーネントトークン・16原則） | Active | `prototype/styles.css`（全体）/ `prototype/index.html`（全画面）/ `docs/screens/SCREEN-DESIGN.md` | 2026-04-26 |

---

## SPEC-058 追加に伴う横断ドキュメント更新チェックリスト

DEVELOPMENT_RULES.md §6.2 に基づき、以下の更新が必要です。

### ✅ 更新が必要なファイル

| ファイル | 更新内容 |
|---|---|
| `docs/specs/SPEC-INDEX.md` | 上記の行を追加する |
| `docs/specs/SPEC-009-ui-layout.md` | 関連仕様に `SPEC-058` を追記する |
| `docs/specs/SPEC-034-s2-hud-redesign.md` | 関連仕様に `SPEC-058` を追記する |
| `docs/specs/SPEC-035-result-summary-ui.md` | 関連仕様に `SPEC-058` を追記する |
| `docs/specs/SPEC-040-worldview.md` | 関連仕様に `SPEC-058` を追記する |

### ✅ 更新不要なファイル（理由）

| ファイル | 理由 |
|---|---|
| `docs/screens/SCREEN-DESIGN.md` | 新規画面を追加していないため。既存画面（S2/S3/S10）への適用であり遷移図の変更なし |
| `docs/screens/GAME-FLOW.md` | フローの分岐・発火タイミングに変更なし |
| `docs/screens/INDEX.md` | 新規画面IDを追加していないため |
| `docs/DEVELOPMENT_RULES.md` | 新カテゴリのSPECではなく既存カテゴリ内の追加のため |

---

## コミットメッセージ（推奨）

```
docs(spec): add SPEC-058 design system and design charter

デザイン憲章16原則・カラーパレット・タイポグラフィ・
コンポーネントトークンを SPEC-058 として定義。
SPEC-034/035/040 に散在していた横断ルールを集約。

Spec: docs/design/SPEC-058-design-system.md (added)
```
