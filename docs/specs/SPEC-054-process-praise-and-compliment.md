# SPEC-054: 過程褒め原則と「親が褒められる」場面の実装

| 項目 | 内容 |
|---|---|
| 仕様ID | SPEC-054 |
| 機能名 | NPC セリフを過程褒め（process praise）に統一し、両親が他者から褒められる場面（parental_compliment）を追加 |
| 対応ファイル | `prototype/data/mission-scenarios.json`, `prototype/data/titles.json`, `prototype/data/parental-compliments.json`（新設）, `prototype/game.js` `triggerParentalComplimentEvent()`, `renderParentalComplimentModal()`, `prototype/index.html` `#screen-parental-compliment` / `prototype/styles.css` `.compliment-*` |
| 関連仕様 | SPEC-053（脳科学レビュー §3.3 §3.4）, SPEC-048 v3（4 軸）, SPEC-050（ストーリー型ミッション）, SPEC-041（NPC） |
| ステータス | **Active（PR #21/#22 を前提に追加実装）** |
| 最終更新 | 2026-04-25 |

## 0. 本 SPEC のコンセプト

### 0.1 解決したい問題

SPEC-053（脳科学レビュー）の §3.3 と §3.4 で指摘された 2 つの懸念に対応します：

1. **能力褒め混入**：現状の NPC セリフに「えらいね」「すごいね」が混ざっている。Dweck (2007) の Mindset 研究では、これらは **固定マインドセットを誘発** する。1-3 歳期の親の褒め方が 7-8 歳の学習成果を予測する（Gunderson 2018）ため、本作でも全セリフを **過程褒め** に統一する必要がある。

2. **4 軸④の薄さ**：「自分のことで両親が褒められる」は本作最強の独創的設計だが、現状はミッション達成時の連絡帳エントリーに偶発的に現れるのみ。**専用イベント** で明示的に演出することで、保護者目線のプレイヤーに最大の代理的報酬を提供する。

### 0.2 設計の核心：能力褒め vs 過程褒め

| 区分 | 例 | Dweck の評価 |
|---|---|---|
| **能力褒め（NG）** | 「えらいね」「すごいね」「天才だね」「頭いいね」「上手だね」 | 固定マインドセット誘発 → 挑戦回避 |
| **過程褒め（OK）** | 「がんばったね」「集中してたね」「諦めずにやれたね」「練習の成果だね」「工夫したね」 | 成長マインドセット誘発 → 挑戦受容 |
| **共感褒め（OK）** | 「お母さんも嬉しい」「ぜんぜんちがうね」「成長したね」 | 関係性 + 過程的観察 |

### 0.3 Why not：能力褒めを完全排除しない理由

実は **「すごいね」** などは日本語の自然な感嘆として完全には排除できない。本作では：
- **完全排除を目指さず**、過程・共感の言葉を必ず併記する方針
- 例：×「すごいね！」だけ → ◎「諦めずに練習したから、できるようになったね」

## 1. 過程褒めへの書き換え方針

### 1.1 NG → OK 変換テーブル

| Before（能力褒め） | After（過程褒め・共感） |
|---|---|
| 「えらいね〜、できたね！」 | 「がんばってきたね、できたね！」 |
| 「すごいね！」 | 「最後までやりきれたね」 |
| 「上手だね！」 | 「練習の成果だね」 |
| 「お父さん感動したよ」 | 「○○の頑張り、お父さん見てたよ」 |
| 「すごい成長したね」（既に過程的） | そのまま OK |
| 「とってもやさしいね！」 | 「お友達のことを考えられたね」 |
| 「えらい！」 | 「あきらめなかったね」 |

### 1.2 適用対象ファイル

- `prototype/data/mission-scenarios.json`：catalyst・accomplish の dialog
- `prototype/data/titles.json`：flavor.text
- 既存の `prototype/data/plays.json` の `renrakuchoTeacher` / `renrakuchoParent`：今回の本 SPEC 範囲外（別途 SPEC で対応予定）

### 1.3 残り作業（次 PR 予定）
- 連絡帳テンプレ（plays.json 内）の過程褒め化は **SPEC-027 v2** として別途
- 転生イントロ（isekai.json）など、保育園期以外のセリフは現状維持

## 2. 親が褒められる場面（parental_compliment）

### 2.1 コンセプト

> 「お子さん、上手に育てていますね」  
> プレイヤー（保護者目線）にとって、**自分自身が直接褒められる以上に嬉しい瞬間**。Braams et al. (2014) で母親脳の側坐核が活性化することが示されている、**最強の代理的報酬経路**。

### 2.2 場面の構造（3 幕、ミッションより軽量）

```
┌──────────┐    ┌──────────┐    ┌──────────┐
│ 出会い    │ →  │ 称賛      │ →  │ 余韻      │
│ Encounter │    │ Praise   │    │ Afterglow │
└──────────┘    └──────────┘    └──────────┘
 ▼ 散歩中・遊び後  ▼ 第三者が両親に  ▼ 両親同士の会話
   他者と遭遇       向かって褒める     プレイヤーは聞き手
```

### 2.3 発動条件

- **保育園期限定**（age 1-4）。phase0（初週）は発動しない
- 累積条件のいずれかを満たす：
  - 月に 1 回まで（cooldown 30 日）
  - プレイヤーが特定の累積行動をしている
- 場所による違い：
  - 自宅 → 父・母のどちらかが他者と電話で話す体
  - 公園 → ご近所さん／他の親
  - 児童館 → 先生から両親へ
  - 祖父母の家 → 親戚から両親へ

### 2.4 第三者の発言例（過程褒めで統一）

| 第三者 | セリフ |
|---|---|
| ご近所さん | 「○○ちゃん、いつも自分から挨拶してくれて、よく気を配ってる子ですね」 |
| 他の親 | 「お友達におもちゃを貸してあげていました。やさしさが育ってますね」 |
| 親戚 | 「絵本に夢中になって読んでる姿、集中力すごいですね」 |
| 先生 | 「お家でたくさん歌の練習をされてるんですね、保育園でも元気に歌ってくれます」 |

両親の反応：

| 受け取り方 | セリフ |
|---|---|
| 母（嬉しい） | 「ありがとうございます。家でも頑張ってるんです」 |
| 父（誇らしい） | 「うちの子も、よくやってるなと思います」 |

プレイヤー（主人公）はその場面を **聞いている** だけ。**両親が嬉しそうにしている顔** を見るのが報酬。

## 3. データ構造

### 3.1 `prototype/data/parental-compliments.json`

```json
[
  {
    "id": "pc_neighbor_greeting",
    "lifeStageTag": "nursery",
    "title": "ご近所さんとのあいさつ",
    "trigger": {
      "type": "enterLocation",
      "location": "near_park",
      "minAge": 2,
      "cooldownDays": 30,
      "requires": {
        "soyouAtLeast": { "social": 30 }
      }
    },
    "dialog": [
      { "speaker": "narration", "text": "公園で、ご近所のおばさんとすれ違った。" },
      { "speaker": "narrator_neighbor", "text": "あら○○ちゃん、こんにちは" },
      { "speaker": "player", "text": "「こんにちは」" },
      { "speaker": "narrator_neighbor", "text": "○○ちゃん、いつも自分から挨拶してくれて。よく気を配ってる子ですね", "emotion": "warm" },
      { "speaker": "mother", "text": "ありがとうございます。家でも頑張ってるんです", "emotion": "proud" },
      { "speaker": "narration", "text": "（お母さん、嬉しそう…）", "emotion": "happy_cry" }
    ],
    "rewards": {
      "soyouBonus": { "passion": 5, "social": 3 },
      "renrakuchoEntry": "ご近所さんに挨拶を褒められて、お母さんがとても嬉しそうでした。",
      "memorableDay": { "emotionText": "ご近所さんに挨拶をほめられた日" }
    }
  }
]
```

### 3.2 プレイヤー状態

```js
player._lastParentalComplimentDay = 0;  // cooldown 用
```

## 4. ゲームエンジンへの統合

### 4.1 トリガ判定
- `onLocationEntered(locationId)` 内でミッション判定の前に **parental_compliment 候補を判定**
- ミッションと同時発動しないよう優先度：
  1. ミッション達成（最優先）
  2. parental_compliment（cooldown 内なら無視）
  3. ミッション発端

### 4.2 描画
- 既存の `screen-mission-modal` を **共用** するか、専用画面 `screen-parental-compliment` を新設
- 本 SPEC では **専用画面 `#screen-parental-compliment`** を作って世界観を分ける（モーダル感を分離）
- 演出：
  - 背景：暖色系（オレンジ寄り、家庭的）
  - フォント：少し大きめ
  - 末尾に「（お母さん、嬉しそう…）」のナレーション

### 4.3 専用関数

```js
function maybeTriggerParentalCompliment(context) {
  if (player.day - (player._lastParentalComplimentDay || 0) < 30) return null;
  const candidates = PARENTAL_COMPLIMENTS.filter((pc) =>
    triggerMatches(pc.trigger, context) &&
    matchesRequires(pc.trigger.requires) &&
    matchesAgeAndStage(pc)
  );
  if (candidates.length === 0) return null;
  return candidates[Math.floor(Math.random() * candidates.length)];
}

function startParentalCompliment(pc) {
  player._lastParentalComplimentDay = player.day;
  // ダイアログ表示 → 報酬適用 → S2 へ
}
```

### 4.4 報酬の特性
- **量は控えめ**：素養 +3〜+10 程度（ミッションより軽い）
- **質を重視**：連絡帳エントリーと memorableDays への登録
- プレイヤーが感情で得る報酬を主軸にする

## 5. 第三者 NPC の追加（SPEC-041 拡張の前倒し）

| ID | 名前 | 場面 | 性格 |
|---|---|---|---|
| `narrator_neighbor` | ご近所さん | 散歩中・公園 | 温かい年配女性 |
| `narrator_other_parent` | 他のお母さん | 公園・児童館 | 同年代の親 |
| `narrator_relative` | おじさん／おばさん | 祖父母の家 | 親戚 |
| `narrator_park_oji` | 公園のおじいさん | 公園 | 散歩中の高齢者 |

これらは「直接プレイヤーと関係を結ぶ NPC」ではなく **イベント発火時の脇役**。SPEC-041 で本格 NPC 化する前の暫定処理。

speaker label を SPEAKER_LABEL に追加：

```js
const SPEAKER_LABEL = {
  // ... 既存 ...
  narrator_neighbor: "ご近所のおばさん",
  narrator_other_parent: "他のお母さん",
  narrator_relative: "親戚のおじさん",
  narrator_park_oji: "公園のおじいさん",
};
```

## 6. 8 つの parental_compliment 場面

| ID | 場所 | トリガ条件 | 第三者 | 褒められる側面 |
|---|---|---|---|---|
| `pc_neighbor_greeting` | near_park | social ≥ 30 | ご近所さん | 挨拶できる |
| `pc_park_share` | big_park | social ≥ 50 / m_share_toy 達成済み | 他のお母さん | おもちゃを貸せる |
| `pc_library_focus` | library | intellect ≥ 50 / picturebook 累計 20+ | 司書さん | 集中して読書 |
| `pc_grandparents_polite` | grandparents_house | social ≥ 40 | 親戚 | 行儀がいい |
| `pc_park_oji_song` | near_park / big_park | sensitivity ≥ 40 / song 累計 5+ | 公園のおじいさん | 歌が聞こえてくる |
| `pc_children_hall_share` | children_hall | social ≥ 50 | 児童館の先生 | 譲り合い |
| `pc_neighbor_active` | near_park | body ≥ 60 | ご近所さん | 元気に走り回る |
| `pc_other_parent_smile` | big_park | passion ≥ 30 | 他のお母さん | いつもニコニコ |

## 7. テスト観点

### 7.1 単体テスト
- `parental_compliment` のトリガ条件評価
- cooldown 30 日の判定

### 7.2 結合テスト
- 公園入場時に social 30+ で `pc_neighbor_greeting` が発動する
- ダイアログが正しく表示され、母「ありがとうございます」が含まれる
- 報酬（passion +5、social +3）が適用される
- 連絡帳ハイライトに追加される
- 30 日以内に再度公園に入っても発動しない（cooldown）

## 8. Why not：他の選択肢を選ばなかった理由

### 8.1 Why not：プレイヤー本人を直接褒める
- それは既存の達成モーダルで実施済み
- 本 SPEC は **「両親が他者から褒められる」場面** を追加する。プレイヤー（大人）視点での報酬経路を増やすため。

### 8.2 Why not：cooldown を週 1 回（短め）
- Dweck 研究では「過剰な褒めも逆効果」とされる
- 月 1 回が、希少性と報酬の質のバランスとして適切

### 8.3 Why not：必ず母／父どちらかが反応
- 本作はシングルマザー／シングルファザー設定もありうる（将来拡張）
- 今回は両親モデル前提だが、将来的に動的な NPC 選択へ。

### 8.4 Why not：プレイヤーがセリフを選ぶ
- SDT 自律性を尊重するなら選択肢を出すべきだが、**保育園期はプレイヤーが「主人公」というよりは「見守る側」**
- そのため、セリフを選ぶより「自然な物語が流れる」方を優先

## 9. 改訂履歴
- 2026-04-25: 初版（SPEC-053 §3.3 §3.4 への対応）
