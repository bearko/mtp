# SPEC-050: 年間ミッション & 年度末両親面談

| 項目 | 内容 |
|---|---|
| 仕様ID | SPEC-050 |
| 機能名 | 年度開始のミッション提示と年度末の両親面談による年の締めくくり |
| 対応ファイル | `prototype/data/missions.json`（新設）、`prototype/game.js` `annualMissions`, `evaluateAnnualMissions()`, `renderParentalMeeting()` / `prototype/index.html` `#screen-parental-meeting`, `#mission-banner` |
| 関連仕様 | SPEC-048（レビュー）, SPEC-049（マイライフ分析）, SPEC-033（素養）, SPEC-027（連絡帳）, SPEC-041（NPC） |
| ステータス | **Draft（SPEC-049 応用案 B+C を具体化）** |
| 最終更新 | 2026-04-19 |

## 1. 目的

パワプロ『マイライフ』の **監督ミッション + 年俸交渉** 構造を、本作の **年度開始（4 月）の年間ミッション提示 + 年度末（3 月末）の両親面談** として翻訳する。

- **Challenge の強化**：年度開始に「今年の目標 3 つ」を提示して、1 年の方向性を作る
- **Sensation の強化**：年度末に両親が **具体的な数字・エピソード** を挙げて褒めてくれる（年俸交渉の演出翻訳）

## 2. 用語定義
- **年間ミッション（Annual Mission）**：4 月に提示される、今年度の目標 3 つ
- **両親面談（Parental Meeting）**：3 月末に発生する、両親との 1 年の振り返りモーダル
- **達成報酬**：ミッション達成でもらえる bonus（素養ボーナス・お小遣い倍率 UP・特別称号）

## 3. フロー

```
[4/1（新年度）朝の起床]
  │
  ▼
[S18 ミッション提示モーダル]
  今年のミッション 3 つ
  ↓ 受諾
  通常プレイへ
  │
  │ ... 12 ヶ月プレイ ...
  │
[3/31 朝起床]
  │
  ▼
[S19 両親面談画面]
  ▶ 今年の振り返り（主要イベント・素養推移）
  ▶ ミッション達成度
  ▶ 両親からのメッセージ
  ▶ 報酬受け取り
  │
  ▼
[4/1 新年度 → 次のミッション]
```

## 4. 年間ミッションの設計

### 4.1 ミッション生成ロジック
年度開始時に、プレイヤーの現状（年齢・素養・スキル）から **動的に 3 つを提示**：

```
ミッション候補プール（全 30-50 種）から以下の 3 カテゴリで 1 つずつ抽選：
  1. 成長系 ：「素養 XX を X ポイント増やす」など
  2. 体験系 ：「新しい遊びを X 個発見する」「X 箇所の場所に行く」など
  3. 人間関係系：「友達の誰かと関係値 X 以上」「NPC と Y 回遊ぶ」など
```

### 4.2 ミッション例（ライフステージ別）

#### 保育園期（age 1-4）
| カテゴリ | ミッション | 達成条件 | 報酬 |
|---|---|---|---|
| 成長 | 身体を伸ばす | body を 100 以上 | 🏋 身体キッズ称号 |
| 成長 | 知性を育む | intellect を 120 以上 | 🧠 物知り称号 |
| 成長 | 感性を磨く | sensitivity を 80 以上 | 🎨 アーティスト称号 |
| 成長 | バランス成長 | 5 素養すべて 60 以上 | ⚖️ バランサー称号 |
| 体験 | 遊びの発見家 | 新しい遊びを 5 つ発見 | 🗺 発見者称号 |
| 体験 | 公園マスター | 公園で 30 回以上遊ぶ | 🌳 公園の達人 |
| 体験 | 読書家の卵 | 絵本を 40 回以上読む | 📖 読書の種 |
| 体験 | 外出王 | 10 箇所以上の場所に行く | 🏞 冒険家の卵 |
| 人間関係 | 社交的に | 友達を 3 人作る | 👭 お友達マスター |
| 人間関係 | 親密な友 | 特定 NPC と関係値 70 以上 | 🤝 親友 |

#### 幼稚園期（age 5-6）
- 発表会・運動会で A ランク以上
- 稽古教室の級位を 1 段上げる
- 英霊を 1 体呼び出す

#### 小学校期以降は追加

### 4.3 達成判定
- 毎日の `finalizePlay()` / `nextDay()` でミッション進捗を更新
- 3 月末の両親面談までに達成したら **報酬獲得**

### 4.4 難易度
- ミッションの難易度は **プレイヤーの平均的な成果** の ±10% を狙う
- 「50% の確率で達成、50% の確率で未達」を目標（挑戦させる）

## 5. 両親面談（3 月末の演出）

### 5.1 画面構成（S19）
```
┌──────────────────────────┐
│  [共通HUD]                │
├──────────────────────────┤
│  🌸 3 月末                 │
│  お父さん・お母さんとの面談  │
├──────────────────────────┤
│  👩‍👨 「今年もおつかれさま」   │
│                            │
│  ▶ 今年の成長              │
│    💪 身体 F → D (+35)     │
│    🧠 知性 E → C (+42)     │
│    🎨 感性 F → E (+18)     │
│    👥 社交 G → F (+12)     │
│    🔥 情熱 F → D (+25)     │
│                            │
│  ▶ 今年のミッション         │
│    ✅ 身体を伸ばす（達成！）│
│    ❌ 読書家の卵（あと5冊） │
│    ✅ お友達マスター（達成）│
│                            │
│  ▶ 今年の思い出             │
│    🦒 動物園に行ったね      │
│    🎨 大きな絵を描けた      │
│    👫 ユウタと親友になった   │
│                            │
│  ▶ 報酬                    │
│    🏋 身体キッズ称号 ＋     │
│    👭 お友達マスター称号    │
│    🍬 大きなごほうび        │
│                            │
│  ▶ 来年もよろしく           │
│  [ 新年度のミッションを見る ]│
└──────────────────────────┘
```

### 5.2 両親のセリフ生成
- SPEC-041 の NPC システムを利用して、父 / 母 のどちらか（or 両方）が登場
- 具体的な数字を織り込む：「知性が C に上がったね、もう少しで B だ！」
- 思い出系：「今年は動物園に行けて楽しかったね」「ユウタ君とあんなに仲良くなって」

### 5.3 称号・報酬の受け渡し
- 達成ミッションの称号を **1 つずつタップで受け取る** 演出
- 称号は `player.titles` に追加され、プロファイル画面（SPEC-051）で閲覧可

### 5.4 年度切り替え
- 両親面談を閉じる → 翌朝（4/1）の起床 → 新年度のミッションモーダル
- `player.age` が誕生日（4 月 1 日で一致）により **+1 歳**
- 素養は SPEC-037 のデノミ対象ステージなら 1/4 に切り下げ

## 6. HUD への表示

### 6.1 ミッションバナー
HUD の真下に折り畳める「今年のミッション」バナーを追加：
```
📋 今年のミッション（1/3 達成）        ▼ 詳細
```
タップで詳細展開、現在の進捗を表示。

### 6.2 進捗計算
```js
function missionProgress(mission) {
  switch (mission.type) {
    case "soyouAtLeast":
      return player.soyou[mission.key] / mission.target;
    case "newPlaysDiscovered":
      return (player.unlockedPlays.length - mission.startCount) / mission.target;
    // ...
  }
}
```

## 7. データ構造

### 7.1 `prototype/data/missions.json`

```json
[
  {
    "id": "soyou_body_100",
    "lifeStageTag": "nursery",
    "category": "growth",
    "title": "身体をのばそう",
    "description": "今年中に 💪 身体を 100 以上に",
    "target": { "type": "soyouAtLeast", "key": "body", "value": 100 },
    "reward": { "title": "body_kid", "bonus": { "body": 20 } }
  },
  {
    "id": "discover_5_plays",
    "lifeStageTag": "nursery",
    "category": "experience",
    "title": "あたらしい遊びを見つけよう",
    "description": "新しい遊びを 5 つ発見",
    "target": { "type": "newPlaysDiscovered", "value": 5 },
    "reward": { "title": "explorer_seed", "bonus": { "intellect": 10 } }
  },
  {
    "id": "friend_3",
    "lifeStageTag": "nursery",
    "category": "relationship",
    "title": "お友達をつくろう",
    "description": "3 人の友達と仲良くなる",
    "target": { "type": "friendsAtLeast", "value": 3 },
    "reward": { "title": "friendship_master", "bonus": { "social": 20 } }
  }
]
```

### 7.2 プレイヤーオブジェクト拡張
```js
player.currentAnnualMissions = [
  { id: "soyou_body_100", startValue: 35, progress: 0.4, done: false },
  { id: "discover_5_plays", startValue: 3, progress: 0.2, done: false },
  { id: "friend_3", startValue: 1, progress: 0.33, done: false }
];
player.titles = ["body_kid", "explorer_seed"];
```

## 8. 実装の段階

### Phase 1（SPEC-050 §5 実装）
1. missions.json 作成（保育園期 12 件、幼稚園期 8 件）
2. `player.currentAnnualMissions` 初期化 & 4/1 の提示モーダル
3. `evaluateAnnualMissions()` を `nextDay()` 末尾で呼び出し、進捗更新
4. 3/31 朝に `renderParentalMeeting()` を発火（起床時）
5. HUD にミッションバナー（折りたたみ UI）

### Phase 2（後続）
6. 称号の視覚演出（紙吹雪、効果音）
7. 他ライフステージ用ミッション追加

## 9. テスト観点

- 4/1（Day 1）起床時：`currentAnnualMissions` に 3 件セットされる
- 絵本を 5 回遊ぶ → 読書家の卵ミッション 達成判定
- 3/31 起床時：`renderParentalMeeting()` が発火
- 達成ミッションの称号が `player.titles` に追加
- 面談モーダル閉じる → 新年度のミッションが再提示される

## 10. 改訂履歴
- 2026-04-19: 初版（SPEC-049 応用案 B+C を具体化）
