# デザインドキュメント索引 / Design Documents Index

> 最終更新: 2026-04-26

本ディレクトリは、「カネとジカンとジョウネツと（りとらいふ）」の **UI / UX / ビジュアル表現 / 文体** に関する判断基準を管理する。

---

## 文書一覧

| 文書 | 役割 | 参照タイミング |
|---|---|---|
| [`DESIGN-CHARTER.md`](./DESIGN-CHARTER.md) | デザイン憲章。UI 判断で迷ったときの原則 | 新画面・新演出・大きな UI 改修の前 |
| [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md) | 色・余白・タイポグラフィ・コンポーネント・文体・演出の共通ルール | 実装前、レビュー時、CSS / RN コンポーネント設計時 |
| [`UI-IMPROVEMENT-PROPOSAL.md`](./UI-IMPROVEMENT-PROPOSAL.md) | 現状 UI の課題整理と改善提案 | 次に起こす SPEC / PR の優先順位決定時 |
| [`SPEC-058-design-system.md`](./SPEC-058-design-system.md) | main 由来のデザインシステム & デザイン憲章 SPEC 素案 | SPEC として統合・再編するとき |
| [`mtp-design-system.html`](./mtp-design-system.html) | デザインシステム素案の HTML モック | 視覚トーン確認時 |
| [`SPEC-INDEX-diff.md`](./SPEC-INDEX-diff.md) | SPEC-058 素案追加時の索引更新メモ | 履歴確認時 |

---

## 既存ドキュメントとの関係

| 種別 | 主に答える問い | ファイル |
|---|---|---|
| 企画書 | 何のためのゲームか | [`../../README.md`](../../README.md) |
| 開発ルール | どう開発・仕様管理するか | [`../DEVELOPMENT_RULES.md`](../DEVELOPMENT_RULES.md) |
| 画面設計 | どの画面があり、どう遷移するか | [`../screens/SCREEN-DESIGN.md`](../screens/SCREEN-DESIGN.md) |
| 機能仕様 | 何が起き、どう計算するか | [`../specs/SPEC-INDEX.md`](../specs/SPEC-INDEX.md) |
| デザイン | どんな見た目・言葉・手触りにするか | 本ディレクトリ |

---

## 運用ルール

- UI 変更を伴う SPEC は、必要に応じて [`DESIGN-SYSTEM.md`](./DESIGN-SYSTEM.md) の該当章を参照する。
- 新しい画面表現・コンポーネント・文体ルールを導入した場合は、本ディレクトリの該当文書も更新する。
- ゲームの思想やプレイヤーへの向き合い方を変える提案は、まず [`DESIGN-CHARTER.md`](./DESIGN-CHARTER.md) に矛盾しないか確認する。
