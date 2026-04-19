# SPEC-031: 転生イントロ演出

| 項目 | 内容 |
|---|---|
| 仕様ID | SPEC-031 |
| 機能名 | 転生イントロ（世界観説明） |
| 対応ファイル | `prototype/index.html` `#screen-isekai` / `prototype/game.js` `startIsekaiIntro()`, `advanceIsekai()`, `renderIsekaiScene()` / `prototype/data/isekai.json`, `prototype/data/names.json` / `prototype/styles.css` `.isekai-*` |
| 関連仕様 | SPEC-030（タイトル画面）, SPEC-032（メッセージマスタ）, SPEC-001（プレイヤー基本パラメータ） |
| ステータス | Active |
| 最終更新 | 2026-04-19 |

## 1. 目的

「はじめから」を押したプレイヤーに対して、本作の **世界観（前世ブラック企業社員 → 異世界転生）** を短い紙芝居形式で伝える。ゲーム開始 1 度目の体験として、プレイヤー名の決定と主人公名の付与を含む。

## 2. 用語定義

- **シーン（Scene）**：背景と表示メッセージのセット。タップで次メッセージ／次シーンへ進む
- **ナレーター**：発話者の種別。`narration`（情景）, `mystery`（？？？）, `god`（神）, `player`（プレイヤー）
- **証明書（Isekai Certificate）**：転生の許可を示す架空のメタデータ書類
- **名前候補マスタ**：主人公名のランダム選出に使う候補リスト（SPEC-032）

## 3. 前提
- SPEC-030 の「はじめから」ボタンから開始される
- 新規ゲーム時は `player = DEFAULT_PLAYER` の状態で入ってくる

## 4. シーン仕様

### 4.1 シーン 1：暗闇
- 背景：真っ黒 `#000`
- 表示メッセージ（順に表示、タップで 1 つずつ進む）：
  1. `narration: 「・・・」`
  2. `mystery: 「・・・次の方どうぞ」`
- 最終タップで シーン 2 へ

### 4.2 シーン 2：神との対話 + 名前入力
- 背景：黒 + 画面中央に「白い後光 + シルエット」
- フロー：
  1. `god: はい。では確認のためにお名前をお願いします`
  2. **名前入力フェーズ**：メッセージ下に `<input type="text">` と「決定」ボタンを表示
      - 空のまま決定すると `player.name = randomPlayerName()` を使う
      - 入力があれば `player.name = 入力値` をトリム
      - プレイヤー名（＝前世の名前）をここで確定
  3. `god: ありがとうございます。[プレイヤー名]さんですね`
  4. `god: 前世はブラック企業で働きづめてボロボロになりながら、30歳で交通事故に遭い、ここにいる、と……`
  5. `god: あなたは、これから『転生』します`
  6. `god: 次はもっと遊んでからまた来てくださいね。`
- 最終タップで シーン 3 へ

### 4.3 シーン 3：転生証明書
- 背景：セピア地（和紙風）
- 表示：証明書オブジェクト
  - タイトル：「転生証明書」
  - 項目：
    - 転生先：人間
    - 国：日本
    - 家庭：中流家庭
    - 性別：男
    - 寿命：100 歳
    - その他：現代／温かい両親／標準体格
- **承認演出**：2 秒後 or タップで、画面中央下に朱色ハンコ（「神」の印章）がアニメーションで押される（`scale 0 → 1.2 → 1.0` + 朱赤色 + 短い振動）
- ハンコが押された後に「進む」ラベルのタップ領域が出現、タップで シーン 4 へ

### 4.4 シーン 4：転生 → 名付け → 遊び選択へ
- 背景：徐々に白へフェードイン → 暖色系ベージュ
- 主人公の名前を決定（`data/names.json` から `player.avatarName` をランダム選出）
- ナレーション（タップ 1 つずつ進む）：
  1. `narration: 2026 年 4 月 1 日　誕生`
  2. `narration: 名前は『[ランダム名]』となった`
  3. `narration: 温かい家庭で育てられ、1 歳の誕生日を迎えた`
  4. `narration: さて、今日は何をして遊ぼうか`
- 最終タップで **S2 遊び選択** へ遷移（`showScreen("screen-choose")` + `goChooseFromToday()`）

## 5. データ構造

### 5.1 `prototype/data/isekai.json`（SPEC-032 に準拠）

```json
{
  "scenes": [
    {
      "id": "scene1",
      "bg": "dark",
      "messages": [
        { "speaker": "narration", "text": "・・・" },
        { "speaker": "mystery",  "text": "・・・次の方どうぞ" }
      ]
    },
    {
      "id": "scene2",
      "bg": "halo",
      "steps": [
        { "type": "message", "speaker": "god", "text": "はい。では確認のためにお名前をお願いします" },
        { "type": "input",   "field": "playerName", "placeholder": "お名前をどうぞ", "confirmLabel": "決定" },
        { "type": "message", "speaker": "god", "text": "ありがとうございます。{playerName}さんですね" },
        { "type": "message", "speaker": "god", "text": "前世はブラック企業で働きづめてボロボロになりながら、30歳で交通事故に遭い、ここにいる、と……" },
        { "type": "message", "speaker": "god", "text": "あなたは、これから『転生』します" },
        { "type": "message", "speaker": "god", "text": "次はもっと遊んでからまた来てくださいね。" }
      ]
    },
    {
      "id": "scene3",
      "bg": "certificate",
      "certificate": {
        "title": "転生証明書",
        "fields": [
          { "label": "転生先", "value": "人間" },
          { "label": "国",     "value": "日本" },
          { "label": "家庭",   "value": "中流家庭" },
          { "label": "性別",   "value": "男" },
          { "label": "寿命",   "value": "100歳" }
        ],
        "stampText": "神"
      }
    },
    {
      "id": "scene4",
      "bg": "dawn",
      "messages": [
        { "speaker": "narration", "text": "2026年4月1日　誕生" },
        { "speaker": "narration", "text": "名前は『{avatarName}』となった" },
        { "speaker": "narration", "text": "温かい家庭で育てられ、1歳の誕生日を迎えた" },
        { "speaker": "narration", "text": "さて、今日は何をして遊ぼうか" }
      ]
    }
  ]
}
```

### 5.2 `prototype/data/names.json`

```json
{
  "male": ["晃", "翔太", "拓也", "大輔", "健太", "蓮", "陽翔", "湊", "海斗", "隼人"],
  "female": ["美咲", "優花", "結衣", "さくら", "陽菜", "葵", "凛", "芽衣", "茉莉", "花音"]
}
```

性別は転生証明書で「男」を固定しているため、現状は `male` からランダム選出。将来的に性別切り替えがあれば `names.json` から対応する配列を選ぶ。

### 5.3 プレースホルダ
- `{playerName}`：`player.name`（前世の本人）
- `{avatarName}`：`player.avatarName`（異世界での主人公名、ランダム）

メッセージ表示時に `text.replace(/\{(\w+)\}/g, (_, k) => player[k] || "")` で簡易置換する。

## 6. 実装

### 6.1 状態機械
```js
let isekaiState = {
  sceneIndex: 0,
  stepIndex: 0,  // scene 内の step / message index
  stampShown: false,  // scene3 のハンコ表示済み
};
```

- `advanceIsekai()` が呼ばれるたびに `stepIndex++`、次の step/message を表示
- step が尽きたら `sceneIndex++`, `stepIndex = 0` にして次のシーンへ
- 最終シーンの最後で `finishIsekaiIntro()` を呼び、S2 へ遷移

### 6.2 タップ入力
- `#screen-isekai` 全体をクリッカブルにして `advanceIsekai` を呼ぶ
- 名前入力フェーズは `stopPropagation` で背景タップを止め、「決定」ボタンでのみ進める

### 6.3 証明書ハンコ演出
- CSS `@keyframes stamp { 0% {transform: scale(3) rotate(-20deg); opacity:0;} 50% {transform:scale(1.15) rotate(-10deg); opacity:1;} 100% {transform:scale(1) rotate(-10deg);opacity:1;} }`
- JS で `.isekai-stamp` にクラス `stamped` を付けて発火

### 6.4 HUD 非表示
`#screen-isekai` がアクティブな間は `.hud` を `hidden`（SPEC-030 §5.3 と同じ処理）

### 6.5 失敗モード
- `isekai.json` 読み込み失敗：`DEFAULT_ISEKAI_SCENES` 定数をフォールバック
- `names.json` 読み込み失敗：`DEFAULT_NAMES = { male: ["晃"], female: ["美咲"] }`

## 7. プレイヤーモデルへの追加
SPEC-001 §5 に追加：
- `player.name`：前世のプレイヤー名（シーン 2 で入力）
- `player.avatarName`：主人公名（シーン 4 で付与）

デフォルトは空文字列。`DEFAULT_PLAYER` に両フィールドを追加する。

## 8. テスト観点
- タイトル「はじめから」→ シーン1 の暗闇画面が出る
- 暗闇シーンは 2 回タップで神のシーンへ
- 名前未入力で「決定」→ ランダム名で進む
- 入力して「決定」→ 入力名が「ありがとうございます。〇〇さんですね」に反映
- シーン 3 で証明書とハンコアニメ
- シーン 4 で `avatarName` がランダム（男性名リストから）に設定
- シーン 4 の最後のタップで S2 遊び選択画面に遷移し、HUD が再表示される

## 9. 改訂履歴
- 2026-04-19: 初版
