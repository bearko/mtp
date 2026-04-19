# SPEC-028: マスタデータ管理（JSON テーブル化）

| 項目 | 内容 |
|---|---|
| 仕様ID | SPEC-028 |
| 機能名 | マスタデータ管理（遊び・イベント・カテゴリを JSON テーブルで外部化） |
| 対応ファイル | `prototype/data/plays.json`, `prototype/data/events.json`, `prototype/data/categories.json` / `prototype/game.js` の `loadMasters()`, `PLAYS`, `EVENTS`, `CATEGORIES` |
| 関連仕様 | SPEC-002, SPEC-004, SPEC-011, SPEC-022, SPEC-023, SPEC-024, SPEC-025 |
| ステータス | Active |
| 最終更新 | 2026-04-18 |

## 1. 目的

本仕様は **「コードを編集せずにマスタデータを更新できる」** 状態を目指す。これまで `game.js` のトップにハードコードされていた `PLAYS` / `EVENTS` / `CATEGORIES` を外部 JSON に切り出し、**レコード追加だけで遊びツリーが自動で広がる** ようにする。

狙い：
- 保育園 2 年分（〜幼稚園入園）の遊びを豊富に揃える下地
- ライフステージごとにマスタを増やすときの保守コスト削減
- 将来のバックオフィス／Google Sheet → JSON 変換などのパイプライン拡張

## 2. 用語定義

- **マスタ（Master）**：ゲームの振る舞いを決める定数データ。PLAYS / EVENTS / CATEGORIES が対象。
- **テーブル定義（Table Schema）**：各マスタが持つべき項目と型。本仕様の §5 で厳密に定義。
- **読み込み（Bootstrap）**：ゲーム開始時に `loadMasters()` で JSON を fetch して静的変数に展開する処理。

## 3. ファイル配置

```
prototype/
├─ index.html
├─ game.js
├─ styles.css
└─ data/                    ← 本仕様で新設
    ├─ categories.json       カテゴリマスタ（SPEC-022）
    ├─ plays.json            遊びマスタ（SPEC-002/011/023）
    └─ events.json           ランダムイベントマスタ（SPEC-004）
```

- すべて UTF-8 エンコード
- 行ごと人が読み書きしやすいよう **2 スペースインデント + 配列展開** のフォーマットを推奨

## 4. 読み込みシーケンス

```
DOMContentLoaded
   ↓
loadMasters() を await
   ├─ fetch('./data/categories.json')
   ├─ fetch('./data/plays.json')
   └─ fetch('./data/events.json')
   ↓
グローバル変数 CATEGORIES, PLAYS, EVENTS に代入
   ↓
renderHUD() → 初期画面起動
```

- `file:///` からのアクセスでは fetch が失敗する可能性があるため、開発時は `python3 -m http.server` など静的サーバ前提で動かす
- 読み込み失敗時はコンソールエラーを出した上で **ハードコードのフォールバック定義** を使う（`DEFAULT_CATEGORIES` などを game.js 内に残す）

## 5. テーブル定義

### 5.1 カテゴリマスタ（`data/categories.json`）

ルートはオブジェクト。キー＝カテゴリID、値＝詳細。

```json
{
  "movement": { "label": "運動", "group": "身体", "description": "体を動かすこと全般" },
  "outdoor_toy": { "label": "遊具", "group": "身体" }
}
```

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| id | string (key) | ✅ | カテゴリ識別子（小文字スネーク） |
| label | string | ✅ | UI 表示用ラベル（日本語） |
| group | string | ✅ | 上位グループ（身体／創作／探求／交流／生活／文化） |
| description | string | - | プレビュー用の短い説明（将来表示） |

### 5.2 遊びマスタ（`data/plays.json`）

ルートは配列。各要素が 1 遊び。

```json
[
  {
    "id": "sandbox",
    "name": "砂場遊び",
    "icon": "🏖",
    "timeCost": 1,
    "moneyCost": 0,
    "staminaCost": 10,
    "seasons": ["spring", "summer", "autumn"],
    "ageMin": 1,
    "ageMax": 10,
    "minFriends": null,
    "friendBonusPerPerson": null,
    "categories": ["outdoor_toy", "crafting", "nature"],
    "gain": { "physical": 10, "creative": 5 },
    "unlockRequired": false,
    "unlockHint": "保育園で砂場遊びの楽しさを教わると解放",
    "descriptions": [
      "砂で大きな山を作り始めた…",
      "トンネルを通す挑戦。崩れた！もう一度！"
    ],
    "lifeStageTag": "nursery",
    "renrakuchoTeacher": "公園でお砂場遊びをしました☺スコップを使って上手に穴を掘っていました。",
    "renrakuchoParent": "お外遊びが好きなのかもしれません。"
  }
]
```

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| id | string | ✅ | 一意。他マスタから参照されるキー |
| name | string | ✅ | 日本語名 |
| icon | string | ✅ | 絵文字 1 文字（UI アイコン） |
| timeCost | number | ✅ | 消費時間（h、0.5 刻み可） |
| moneyCost | number | ✅ | 所持金消費（円、0 許容） |
| staminaCost | number | ✅ | 体力消費（0 許容） |
| seasons | array\<string\> \| null | - | 実行可能な季節。null は通年 |
| ageMin / ageMax | number \| null | - | 年齢条件 |
| minFriends | number \| null | - | 最小友人数（SPEC-007） |
| friendBonusPerPerson | number \| null | - | 友人 1 人ごとの経験値ボーナス（主カテゴリに加算） |
| categories | array\<string\> | ✅ | 1 以上。カテゴリID（SPEC-022）の配列 |
| gain | object | ✅ | 原体験 5 カテゴリの初期獲得量（physical 等） |
| unlockRequired | boolean | - | true なら `player.unlockedPlays` に無いと選択肢に出ない（SPEC-023） |
| unlockHint | string | - | 遊びツリー S7 で「どうすれば解禁できるか」を示す文言 |
| descriptions | array\<string\> | ✅ | 1 以上。描写フェーズでランダム表示 |
| lifeStageTag | string | - | 実装がどのライフステージ向けか（"nursery" / "kindergarten" など）。S7 のフィルタ用 |
| renrakuchoTeacher | string | - | 連絡帳「先生から」用のテンプレ（SPEC-027）。遊んだ日にランダムで採用 |
| renrakuchoParent | string | - | 連絡帳「家庭から」用のテンプレ |

### 5.3 イベントマスタ（`data/events.json`）

ルートは配列。ランダムイベント（遊び中に確率発火）＋発見イベント（コアタイム中に抽選）をまとめて扱えるよう、`scope` フィールドで区別する。

```json
[
  {
    "id": "new_friend",
    "scope": "random_play",
    "text": "近所の子に話しかけられて、仲良くなった！",
    "icon": "🤝",
    "effect": { "friends": 1, "social": 5 },
    "weight": 10
  },
  {
    "id": "learn_slide",
    "scope": "nursery_discovery",
    "text": "大きな滑り台の上手な滑り方を教えてもらった！",
    "icon": "🎢",
    "weight": 8,
    "effect": { "physical": 3 },
    "unlockPlayId": "big_slide"
  }
]
```

| フィールド | 型 | 必須 | 説明 |
|---|---|---|---|
| id | string | ✅ | 一意 |
| scope | string | ✅ | `"random_play"` / `"nursery_discovery"` / 将来 `"kindergarten_discovery"` など |
| text | string | ✅ | プレイヤーに見せるテキスト |
| icon | string | ✅ | 絵文字 |
| weight | number | ✅ | 抽選の重み（0 より大） |
| effect | object | - | 適用する差分（friends, money, stamina, passion, physical 等） |
| unlockPlayId | string | - | 発見で解禁する遊びID |
| condition | object | - | 発火条件（ageMin 等。将来拡張用） |

### 5.4 相互参照の整合性

- 遊びの `categories` に書かれた ID は必ず `data/categories.json` に存在しなければならない
- イベントの `unlockPlayId` に書かれた ID は必ず `data/plays.json` に存在しなければならない
- 不整合は起動時に `console.warn` を出して該当レコードを無視する

## 6. 実装方針

### 6.1 `loadMasters()` 関数

```
async function loadMasters() {
  try {
    const [cat, plays, evs] = await Promise.all([
      fetch("./data/categories.json").then(r => r.json()),
      fetch("./data/plays.json").then(r => r.json()),
      fetch("./data/events.json").then(r => r.json()),
    ]);
    CATEGORIES = cat;
    PLAYS      = plays;
    EVENTS     = evs.filter(e => e.scope === "random_play");
    // nursery_discovery はフィルタして別配列に
    NURSERY_DISCOVERIES = evs.filter(e => e.scope === "nursery_discovery");
  } catch (err) {
    console.warn("Master load failed, using fallbacks", err);
    CATEGORIES = DEFAULT_CATEGORIES;
    PLAYS      = DEFAULT_PLAYS;
    EVENTS     = DEFAULT_EVENTS;
    NURSERY_DISCOVERIES = DEFAULT_NURSERY_DISCOVERIES;
  }
}
```

### 6.2 初期化フローの変更

従来の「同期的に初期レンダリング」から、**`await loadMasters()` 後にレンダリング** する形へ変更する：

```
window.addEventListener("DOMContentLoaded", async () => {
  await loadMasters();
  // 以降は従来どおりの初期化
});
```

### 6.3 フォールバックの段階的縮退

- v1（本仕様導入時）：ハードコードのフォールバック定義を game.js に残しつつ、`data/*.json` からの読み込みを優先
- v2（将来）：フォールバックを削除して JSON 必須化

## 7. UI への反映

- データ駆動のため、既存 UI の描画側コード（S2 ドック、S3 描写、S6 保育園コアタイム、S7 ツリー）に **修正は不要**
- ただし `renderPlayTreeScreen()` は `lifeStageTag` を参照して「今のステージ」/「次のステージ」に振り分けるのが望ましい（SPEC-023 §5.5 を補完）

## 8. 想定される利用シナリオ

### 8.1 新しい遊びを追加する（コード編集なし）
1. `prototype/data/plays.json` に 1 レコード追記
2. 必要ならカテゴリが未登録なら `categories.json` にも追記
3. ブラウザリロード → 遊びツリーと S2 ドックに自動反映

### 8.2 既存の遊びのパラメータを調整
- `staminaCost` を変更 → リロードで即反映、コード変更なし

### 8.3 イベントの確率調整
- `events.json` の `weight` を変更 → リロードで反映

## 9. 例外・エッジケース

- JSON 構文エラー：fetch 後 `.json()` で例外、フォールバックに切替
- ID 重複：後勝ちで上書きするが、`console.warn` で通知
- 相互参照切れ：`console.warn` を出してスキップ（§5.4）

## 10. 未決事項・TODO

- [ ] CSV → JSON 変換スクリプトの用意（将来、Google Sheet などを使うとき）
- [ ] スキーマ検証（JSON Schema）
- [ ] 多言語化：`label` / `text` を `{ ja, en, ... }` オブジェクト化
