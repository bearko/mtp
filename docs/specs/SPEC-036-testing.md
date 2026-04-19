# SPEC-036: テスト戦略と自動テスト基盤

| 項目 | 内容 |
|---|---|
| 仕様ID | SPEC-036 |
| 機能名 | 自動テスト（単体 / 結合 / シナリオ） |
| 対応ファイル | `tests/` ディレクトリ全体 / `tests/README.md` / `tests/run.sh` / `tests/unit/*.js` / `tests/integration/*.js` / `tests/scenario/*.js` |
| 関連仕様 | 全 SPEC。テストケースは各仕様の「テスト観点」セクションと対応する |
| ステータス | Active |
| 最終更新 | 2026-04-19 |

## 1. 目的

本プロジェクトはプロトタイプ段階で SPEC の数が 35 を超え、機能の組み合わせで回帰バグが出やすい段階に入った。コードの改修・リデザインごとに手動確認だけでは品質が不安定なので、**3 階層の自動テスト** を導入する。

- **単体テスト**：純関数・個別仕様の入力／出力を小さく速く確認する
- **結合テスト**：画面遷移や複数モジュールの連携を headless Chrome で再現する
- **シナリオテスト**：1 週間／1 ヶ月／1 年など長時間プレイを通してエラー・パフォーマンス問題が出ないか確認する

## 2. 用語定義
- **アサーション**：期待値と実測値を比較する関数（`assert`, `assertEq`, `assertNear` など）
- **スイート（Suite）**：複数のテストケースを束ねた 1 つのファイル／ブロック
- **フィクスチャ**：テストごとに用意する前提状態（プレイヤー初期状態、マスタデータ等）
- **回帰**：過去に通っていたテストが新しい変更で通らなくなる現象

## 3. テストレイヤーと責務

### 3.1 単体テスト（unit）
- 依存が少ない **純関数** を対象：`soyouGrade`, `progressToNextGrade`, `boostPctFromLv`, `daysUntilWeekend`, `fiscalWeekInfo`, `tutorialPhase` ほか
- **Node.js 単体** で動く（ブラウザ不要）
- `tests/unit/*.js` に格納し、`tests/run.sh` からまとめて実行
- 実行時間：全件合計で **1 秒以内**

### 3.2 結合テスト（integration）
- headless Chrome（puppeteer-core）で `prototype/index.html` を開き、複数画面を跨いで挙動確認
- 例：「タイトル → 転生イントロ → S2 到達で HUD の日付が `2026年4月1日（水）` になる」
- `tests/integration/*.js` に格納
- 実行時間：1 ケースあたり **10 秒以内**、全件で **2 分以内**

### 3.3 シナリオテスト（scenario）
- 複数日・複数週を通しプレイする長いシナリオ
- 例：「Day 1〜Day 14 を手動モードで回して無エラー」「Day 8〜Day 21 を自動モードで回してクラッシュなし」
- `tests/scenario/*.js` に格納
- 実行時間：1 シナリオあたり **30 秒以内**

## 4. ディレクトリ構成

```
tests/
├─ README.md              テストの実行方法・書き方ガイド
├─ run.sh                 全テスト一括実行シェル
├─ lib/
│   └─ assert.js          最小アサーションライブラリ（Node.js 単体で動く）
├─ unit/
│   ├─ soyou-grade.test.js        SPEC-033 のグレード境界値
│   ├─ fiscal-week.test.js        SPEC-001 §5.7 日付 / fiscal week
│   ├─ tutorial-phase.test.js     SPEC-026 チュートリアルフェーズ判定
│   ├─ skill-boost.test.js        SPEC-024 skillBoostMultiplier / boostPctFromLv
│   └─ progress-grade.test.js     SPEC-035 progressToNextGrade
├─ integration/
│   ├─ title-to-choose.test.js    SPEC-030 / SPEC-031 起動→タイトル→転生→S2
│   ├─ play-flow.test.js          SPEC-002 / SPEC-003 S2→S3→S10 の通常フロー
│   ├─ depleted-stamina.test.js   SPEC-019 体力ゼロ時の強制仮眠
│   └─ weekly-summary.test.js     SPEC-025 日曜夜の S10→S9→翌朝
└─ scenario/
    └─ week-1-manual.test.js      Day 1〜5（第1週）を手動プレイで無エラー完走
```

## 5. 実行方法

### 5.1 単体のみ
```bash
# 要件: node がインストール済みであること
node tests/unit/soyou-grade.test.js
```

### 5.2 結合・シナリオ
バックグラウンドで HTTP サーバを立てる必要がある：
```bash
cd prototype && python3 -m http.server 8765 &
node tests/integration/title-to-choose.test.js
```

### 5.3 全件
```bash
./tests/run.sh
# 引数で unit / integration / scenario を絞り込みできる
./tests/run.sh unit
./tests/run.sh integration scenario
```

### 5.4 CI
将来的に GitHub Actions で `run.sh all` を走らせる。現状は開発者ローカルとプロトタイプ VM 上での実行に留める。

## 6. アサーション API

最小構成のアサーションライブラリ `tests/lib/assert.js`：

```js
function assertEq(actual, expected, msg) {
  if (actual === expected) return;
  throw new Error(`${msg || "assertEq"}: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
}
function assert(cond, msg) {
  if (cond) return;
  throw new Error(msg || "assert failed");
}
function assertNear(actual, expected, tol, msg) {
  if (Math.abs(actual - expected) <= tol) return;
  throw new Error(`${msg || "assertNear"}: expected ~${expected}, got ${actual}`);
}
function describe(title, fn) { /* ... */ }
function it(name, fn) { /* ... */ }
```

## 7. 仕様書との対応ルール

- 各 SPEC の **「テスト観点」章** が、そのまま該当するテストファイルの `describe` ブロックに 1:1 対応する
- テストケースを追加・変更したら、**必ず SPEC のテスト観点章も更新** する（SPEC-DRIVEN DEVELOPMENT）
- テストファイル冒頭に `@spec` コメントで対応 SPEC-ID を明記する

```js
// @spec SPEC-033 §10 テスト観点
// soyouGrade の境界値が G/F/E/D/C/B/A に正しく分かれる
```

## 8. バグ発見時のプロトコル

1. テスト実行でバグを検出
2. 失敗テストのログを Issue or PR に記録
3. 原因を調査して修正
4. 修正後に同じテストがパスすることを確認
5. SPEC の「改訂履歴」にバグ修正を追記

## 9. 将来拡張

- **ビジュアル回帰テスト**：スクリーンショット差分比較（`pixelmatch` 等）
- **ファジング**：ランダムなプレイ選択で 1 年分を走らせてクラッシュ検出
- **パフォーマンス**：自動モード時の 1 日処理時間を計測し閾値超えなら失敗
- **i18n**：メッセージマスタ（SPEC-032）を別言語に差し替えて通す
- **CI 化**：GitHub Actions で PR ごとに自動実行

## 10. テスト観点（本 SPEC 自体のテスト）
- `tests/run.sh` が exit 0 を返す（全テスト成功時）
- 失敗時は exit 1 で終わる
- 新規追加したテストファイルは run.sh の glob で自動的に拾われる

## 11. 改訂履歴
- 2026-04-19: 初版
- 2026-04-19 v2: 低リソースプレイ（SPEC-002 §5.9 v4）のテスト追加
  - `tests/unit/low-resource.test.js`（9 ケース）：lowStaminaMultiplier の境界値
  - `tests/integration/low-stamina-dock.test.js`（12 ケース）：ドック表示のシナリオ 6 種類
  - バグ回帰テスト：「体力 1 で遊べなくなる」が旧 isHidden 時間不足扱いの副作用だったことを記録
