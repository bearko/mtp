# SPEC-033: 素養（そよう）モデル — 原体験の 5 カテゴリ統合

| 項目 | 内容 |
|---|---|
| 仕様ID | SPEC-033 |
| 機能名 | 素養モデル（原体験 5 カテゴリ + 情熱統合） |
| 対応ファイル | `prototype/game.js` `SOYOU_KEYS`, `SOYOU_LABELS`, `soyouGrade()`, `player.soyou`, player.passion 互換 / `prototype/data/plays.json` `gain` / `prototype/styles.css` `.soyou-*` |
| 関連仕様 | SPEC-005（パラメータ総則）, SPEC-003（遊び実行・経験値加算）, SPEC-021（ゲージUI）, SPEC-034（S2 HUDリデザイン） |
| ステータス | Active |
| 最終更新 | 2026-04-19 |

## 1. 目的

これまでプレイヤーの成長軸は「原体験（physical / creative / explore / social / competitive）」＋独立した「ジョウネツ（passion）」で 6 本存在していたが、UX レビューの結果「似たような指標が多い・抽象的・読みにくい」という課題が出た。

本仕様では、プレイヤーの成長軸を **5 つの『素養』に整理・統合** し、従来の「ジョウネツ」を 5 つ目の素養として正式に組み込む。以降、画面表記は「原体験」ではなく **「素養」** を使用する。

## 2. 用語定義
- **素養（Soyou）**：プレイヤーの長期的な成長軸。5 つのカテゴリからなる
- **グレード（Grade）**：素養の実数値をプレイヤーにわかりやすく A〜G の 7 段階で表示するラベル
- **ジョウネツ（Passion）**：旧称。今後は 5 素養の 1 つ（`passion`）としてのみ扱う

## 3. 5 つの素養

| キー | 日本語 | アイコン | 主な意味 |
|---|---|---|---|
| `body`         | 身体   | 💪 | 運動能力、体の使い方、外遊び |
| `intellect`    | 知性   | 🧠 | 知識・探究・言語・論理 |
| `sensitivity`  | 感性   | 🎨 | 芸術・情緒・表現・観察 |
| `social`       | 社交   | 👥 | 対人関係・協調・コミュニケーション |
| `passion`      | 情熱   | 🔥 | 熱中・没頭・やる気（旧ジョウネツ） |

- `SOYOU_KEYS = ["body", "intellect", "sensitivity", "social", "passion"]`
- 表示順は上記固定（SPEC-034 §5.2 のカード並びも同順）

## 4. グレード表

素養の実数値を、以下の閾値で **グレード文字列** にマッピングする。

| 実数値 | グレード |
|---|---|
| 0〜19   | G |
| 20〜39  | F |
| 40〜65  | E |
| 66〜79  | D |
| 80〜109 | C |
| 110〜139| B |
| 140 以上 | A |

関数シグネチャ：
```js
function soyouGrade(value) {
  if (value >= 140) return "A";
  if (value >= 110) return "B";
  if (value >=  80) return "C";
  if (value >=  66) return "D";
  if (value >=  40) return "E";
  if (value >=  20) return "F";
  return "G";
}
```

- 閾値はテストを入れるほどの分岐はないが、境界 19/20, 39/40, 65/66, 79/80, 109/110, 139/140 は必ず試験する
- 将来、グレード A の上（S, SS 等）を足す場合は本節を拡張

## 5. 旧キーからのマッピング（移行規則）

旧 → 新：

| 旧キー | 新キー | 備考 |
|---|---|---|
| `physical`     | `body`        | 名称変更のみ |
| `explore`      | `intellect`   | 「探求」→「知性」 |
| `creative`     | `sensitivity` | 「創作」→「感性」 |
| `social`       | `social`      | 同一 |
| `competitive`  | （廃止）      | 5 つに集約する過程で削除 |
| `passion`（旧ジョウネツ） | `passion` | 素養 1 つとして昇格、加点方法は SPEC-003 §5.2 の没頭ボーナスを踏襲 |

マッピングは以下の 1 箇所で集約する：

```js
const LEGACY_EXP_TO_SOYOU = {
  physical:    "body",
  explore:     "intellect",
  creative:    "sensitivity",
  social:      "social",
  competitive: null,   // 廃止。該当 play があれば warn ログ
};
function toSoyouKey(legacyKey) {
  const k = LEGACY_EXP_TO_SOYOU[legacyKey];
  if (k === undefined) return legacyKey; // 既に新キーが来てる可能性
  return k;
}
```

`plays.json` の `gain` は新キー（`body`/`intellect`/…）で書き直す（SPEC-033 §7）。読み込み時のフォールバックとして、旧キーが混ざっていたらこのマップで変換する。

## 6. プレイヤーモデルへの反映

### 6.1 `player.soyou`
新しいフィールド：
```js
player.soyou = {
  body:        0,
  intellect:   0,
  sensitivity: 0,
  social:      0,
  passion:     0,
};
```

### 6.2 旧 `player.exp` / `player.passion`
- `player.exp` は削除し、すべて `player.soyou` に集約。
- 旧 `player.passion`（ジョウネツ 0-100）は `player.soyou.passion` に統合。`passion` の上限は他素養と同じ（実値に上限なし、表示のゲージは 150 満タンを目安）。

### 6.3 セーブ互換
- セーブは未実装のため、互換考慮は不要（将来のマイグレーションで吸収）。

## 7. plays.json / events.json への影響

- `plays.json` 全レコードの `gain` を新キーに書き換える：
  - `physical` → `body`
  - `explore`  → `intellect`
  - `creative` → `sensitivity`
  - `social`   はそのまま
  - `competitive` を持つレコードは目測で `body`/`social` 等に分配、または削除
- `events.json` の `effect` も同様にマッピング
- JSON が旧キーのままでも、`game.js` の読み込み時に `toSoyouKey()` で自動変換される安全網を持つ

## 8. スキル（SPEC-024）への影響
- 旧 `categories`（tag）ベースのスキル経験値計算は **素養とは別の仕組み** なので影響なし。
- ただしスキル → 素養への寄与量（SPEC-024 §5.4 の倍率）は、対応する素養がある場合に加点される（既存実装維持）。

## 9. 互換性の段階的ロールアウト
1. 本コミット：`player.soyou` と 5 素養の導入。旧キーが来たら自動変換
2. 次コミット：`plays.json` / `events.json` を新キーで書き直し
3. 旧 `player.exp` / `player.passion` 参照箇所を 1 つずつ `player.soyou.*` に置換
4. 旧 API（`SEASON_LABEL` 等と無関係な部分）を削除

## 10. テスト観点
- `soyouGrade(0)==="G"`, `soyouGrade(19)==="G"`, `soyouGrade(20)==="F"`, `soyouGrade(40)==="E"`, `soyouGrade(66)==="D"`, `soyouGrade(80)==="C"`, `soyouGrade(110)==="B"`, `soyouGrade(140)==="A"`
- 絵本を 1 回プレイ → `player.soyou.intellect` が 10 増加（旧 `explore` → 新 `intellect`）、`sensitivity` が 3 増加
- 砂場遊びを 1 回プレイ → `body` が 15 増加、`sensitivity` が 8 増加（旧 `creative` → 新 `sensitivity`）

## 11. 改訂履歴
- 2026-04-19: 初版（5 素養導入、旧キー互換マップ）
