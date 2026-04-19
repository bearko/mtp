# SPEC-039: 稽古教室（Lessons） — 幼稚園以降の習い事システム

| 項目 | 内容 |
|---|---|
| 仕様ID | SPEC-039 |
| 機能名 | 稽古教室（水泳 / バイオリン / ピアノ / ダンス / 絵画 / 英会話） |
| 対応ファイル | `prototype/data/lessons.json`（新設） / `prototype/game.js` `renderLessonEnroll()`, `scheduleLesson()`, `runLessonEvent()` |
| 関連仕様 | SPEC-010（コアタイム）, SPEC-012（幼稚園）, SPEC-033（素養）, SPEC-024（スキル） |
| ステータス | **Draft（未実装）**。幼稚園実装時に着手予定 |
| 最終更新 | 2026-04-19 |

## 1. 目的

幼稚園以降の子どもの生活リズムに「習い事」を導入する。毎年 5 月に親から通う意思を聞かれ、平日の午後の特定時間帯を使って練習する。定期的に **発表会系イベント** が開かれ、結果次第で素養が大きく上昇する。

Issue #14 の幼稚園セクションから起票。

## 2. 用語定義
- **稽古教室（Lesson）**：習い事の総称。6 種類用意。
- **スロット**：曜日 × 時間帯で 1 つの稽古が占有する時間枠。通常は平日の午後 2h。
- **発表会イベント**：定期的（月 1 回 or 3 ヶ月に 1 回）に開催される、稽古の成果判定イベント。
- **練習バフ**：関連する遊び（例：ピアノの稽古をしていると音楽系の遊び）を自宅で行うと、発表会の成功率が上がる。

## 3. 前提
- 幼稚園（SPEC-012）以降で解禁
- コアタイム（SPEC-010）と同じフレームワーク：稽古時間はユーザーが遊びを選べない（自動的に消化）

## 4. 6 種類の稽古

| ID | 名前 | アイコン | スキル伸長 | 発表会名 | 関連遊び |
|---|---|---|---|---|---|
| `lesson_swim`     | 水泳         | 🏊 | body + movement | 検定       | 外遊び・ボール遊び |
| `lesson_violin`   | バイオリン   | 🎻 | sensitivity + music | 発表会     | 絵本・音楽 |
| `lesson_piano`    | ピアノ       | 🎹 | sensitivity + music | 発表会     | 絵本・音楽 |
| `lesson_dance`    | ダンス       | 💃 | body + sensitivity | 発表会     | 外遊び |
| `lesson_paint`    | 絵画         | 🎨 | sensitivity + crafting | 作品展     | 工作・お絵かき |
| `lesson_english`  | 英会話       | 🗣️ | intellect + social | 社交パーティー | 絵本・ごっこ遊び |

### 4.1 データ構造
```json
{
  "id": "lesson_piano",
  "name": "ピアノ",
  "icon": "🎹",
  "categories": ["music", "sensitivity"],
  "day": "wednesday",       // 曜日
  "startHour": 15,          // 15:00〜17:00
  "endHour": 17,
  "moneyCost": 5000,        // 月謝（親が支払うため幼稚園期は関係なし）
  "soyouGain": { "sensitivity": 12, "intellect": 3 },
  "event": {
    "id": "piano_recital",
    "name": "発表会",
    "frequencyDays": 90,    // 90 日ごと = 3 ヶ月に 1 回
    "successSoyouBonus": { "sensitivity": 40, "passion": 15 },
    "practicePlayCategories": ["music", "sensitivity"]
  },
  "lifeStageTag": "kindergarten"
}
```

## 5. UI フロー

### 5.1 入学判定画面（年 1 回・5 月）
- 5 月の 1 日朝に「親からの提案」モーダル
- 6 種類から 0〜2 個を選ぶ
- 月謝は親が負担するため プレイヤー資産からは引かない

### 5.2 稽古日（週次）
- 指定曜日の `startHour` になると `screen-lesson` に自動遷移
- 2h の稽古を自動消化（画面でアニメ＋ナレーション）
- 獲得：`soyouGain` + 対応カテゴリのスキル経験値

### 5.3 発表会イベント
- 90 日ごとに `runLessonEvent(lessonId)` が発火
- 直近 30 日の「関連遊び回数」で成功率を算出：
  ```
  practiceScore = (直近30日で関連カテゴリを遊んだ回数) / 5
  baseRate = 0.5
  passRate = min(0.95, baseRate + practiceScore * 0.1)
  ```
- 成功時：`successSoyouBonus` を獲得、スキル +5〜10 Lv 相当の経験値
- 失敗時：次回への意欲として `passion +5`

### 5.4 コアタイムとの兼ね合い
- コアタイム（幼稚園 9-14h）と稽古は重ならない時間帯にする：稽古は **15-17h**
- 夕方の自由時間は 17h 以降に短縮される（通常 18h までの自由時間が 17h→18h の 1h になる）

## 6. 英霊（SPEC-038）とのインタラクション
- ダビデ召喚中 → 絵画・ダンスの成功率 +15%
- パスカル召喚中 → 英会話の成功率 +10%
- 孫尚香召喚中 → 英会話の社交パーティーで +20%

## 7. テスト観点

- 幼稚園 5 月 1 日に入学提案モーダルが出る
- ピアノを選ぶ → `player.lessons = ["lesson_piano"]`
- 水曜日の 15 時に `screen-lesson` に自動遷移
- 直近 30 日で音楽系を 5 回以上遊んでいると発表会の成功率が 90% を超える

## 8. 改訂履歴
- 2026-04-19: 初版（Issue #14 幼稚園セクションから起票）
