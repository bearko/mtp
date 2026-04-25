# SPEC-046: ライフイベント（恋愛・結婚・出産・病気・移住・死亡）

| 項目 | 内容 |
|---|---|
| 仕様ID | SPEC-046 |
| 機能名 | 人生の節目となる大きなイベントの統合仕様 |
| 対応ファイル | `prototype/data/life-events.json`（新設）、`prototype/game.js` `runLifeEvent()`, `player.life.{status}` |
| 関連仕様 | SPEC-041 NPC, SPEC-042 経済, SPEC-045 キャリア, SPEC-018 老後 |
| ステータス | **Draft（未実装）** |
| 最終更新 | 2026-04-19 |

## 1. 目的

プレイヤーが 100 年の人生を通じて経験する、**1 回性かつ重いイベント** を一元管理する。キャリアや学業と並行して走る「人生の物語」軸を構築する。

## 2. 主要ライフイベント一覧

| ID | 名前 | 主な年齢 | 発動条件 | 影響 |
|---|---|---|---|---|
| `first_love` | 初恋 | 13-18歳 | social 40+ / sensitivity 40+ | NPC relationships に romance 追加 |
| `confession` | 告白 | 13-22歳 | relationship_value 70+ / passion 50+ | 恋人化 or 失恋 |
| `breakup` | 失恋 | 13-30歳 | 恋人関係中のランダム or 選択 | passion -20, sensitivity +10 |
| `marriage` | 結婚 | 24-40歳 | 恋人 90+ / money 100万+ / career stable | パートナー NPC 化 |
| `childbirth` | 出産 | 25-42歳 | 結婚後 / money 50万+ | `child_1` NPC 追加 |
| `second_child` | 第二子 | 28-45歳 | 第一子 3歳+ / money 100万+ | `child_2` NPC 追加 |
| `illness_minor` | 軽い病気 | 全期 | ランダム（年 10%） | stamina -10 / 5 日 |
| `illness_serious`| 大きな病気 | 40-75歳 | ランダム + 生活習慣 | stamina cap -30 / 30 日 |
| `parents_illness`| 親の病気 | 40-60歳 | ランダム | money -50万 / 介護期 |
| `grandparent_death`| 祖父母の死別 | 15-35歳 | 祖父母 age >= 85 | sensitivity +20, passion -5 |
| `parent_death` | 親の死別 | 50-70歳 | 親 age >= 85 | sensitivity +30, social -5 |
| `job_loss` | リストラ | 30-60歳 | 景気ランダム + 業界 | career リセット |
| `promotion_major`| 大昇進 | 40-60歳 | SPEC-045 規定 | social +50 / money 大幅 UP |
| `move_city` | 引越し | 全期 | 任意 | 友人関係 -20 / 新規出会い |
| `move_abroad` | 海外移住 | 25-50歳 | intellect 120 / 英語スキル Lv50 | 友人リセット / intellect +50 |
| `hobby_deep_dive`| 趣味の深掘り | 40-80歳 | 同カテゴリ 100 回 | sensitivity / passion +30 |
| `health_check` | 健康診断 | 40+ | 年 1 回 | 体力ケース可視化 |
| `retirement_party`| 退職パーティー | 65歳 | 社会人 30 年以上 | passion +30 / 同僚祝福 |
| `grandchild` | 初孫 | 60-75歳 | 子ども 25歳+ | sensitivity +30 |
| `natural_death` | 自然死 | 85-100歳 | 寿命到達 | ゲーム終了 |

## 3. 恋愛フロー（詳細）

### 3.1 初恋
- 中学校入学以降、毎月 5% の確率で「気になる人ができた」モーダル
- 候補：`friend_*` の中で social 系傾向のキャラから 1 人抽選（性別は仮決め）
- プレイヤーは `relationships["romance_*"]` に追加される（value 40 からスタート）

### 3.2 告白
- relationship value 70+ で「告白する？」選択肢
- 成功率：`player.social + player.passion + relationship.value の和` を基準に判定（SPEC-043 の評価式応用）
- 成功：value = 95、恋人として確定、passion +30
- 失敗：value = 20 に減、passion -10、2 ヶ月のクールダウン

### 3.3 恋人期
- デート（映画／カラオケ／遊園地／旅行）を行うと relationship +5
- 疎遠（30 日会わない）で -5
- value が 50 以下に落ちると「倦怠期」モーダル → 別れる or 関係修復

### 3.4 結婚
- value 95+ / 両方 age 24+ で「結婚する？」モーダル
- 結婚式：money -300〜500万、social +30、passion +20
- パートナー NPC 化：`spouse` という専用 id に入れ替え
- 以後、家計・育児・介護に影響

## 4. 出産・育児フロー

### 4.1 出産
- 結婚後、相手との relationship 90+ で「子どもを持つ？」
- 選択すると 9 ヶ月後（270 日後）に出産
- 出産時：money -50万、女性キャラなら stamina cap -10（1 年間）
- `player.children[]` に新しい子 NPC を追加

### 4.2 育児期
- 子ども 0-3 歳：仕事時間 -20%、social +10、sensitivity +5
- 子ども 4-6 歳：新しい遊び「子どもと遊ぶ」解禁（intellect +5, passion +5）
- 子ども 7-18 歳：学費支出、成人すると独立

### 4.3 親としての子育て（将来拡張）
- 自分の子にプレイヤーが「してあげたこと」が子どもの素養に反映
- 子ども自身の人生（エピソード）は次作テーマ（メタ構造）

## 5. 病気・健康

### 5.1 軽い病気
- 毎年 10% の確率で発動
- 5 日間 stamina -10、リズム -15
- 治療費：1 回 5000〜20000 円
- 自然回復

### 5.2 大きな病気
- 年 2% の確率で発動（40 歳以降）
- 30 日間の療養期（仕事休職）
- stamina cap -30（永続の可能性あり）
- 治療費：10万〜50万
- 医療保険加入（SPEC-未定）で軽減

### 5.3 健康診断
- 40 歳以降、年 1 回
- 結果で以下のフラグが立つ：
  - 健康：何もなし
  - 要注意：食事・運動に気をつけるトースト
  - 要検査：病気発動確率 +10%

## 6. 移住

### 6.1 都市内引越し
- 任意で選択可能
- 友人関係 -20（疎遠化）
- 新しいエリアで新規 NPC 登場

### 6.2 海外移住
- intellect 120 / 英語 Lv 50 が条件
- 移住すると：
  - 既存の友人関係 -40
  - 新しい NPC 大量解禁（業界が芸術・IT・金融なら海外支店）
  - intellect +50、sensitivity +30

## 7. 死亡イベント

### 7.1 NPC の死
- 祖父母：age 85 到達で 10% / 年の確率で死亡
- 親：age 85 到達で 15% / 年
- 死亡時：モーダルで通知、葬儀シーン、sensitivity +20〜30

### 7.2 自分の死
- age 100 到達で自動死亡（寿命）
- 特殊条件（重病連続 + 不健康）で早死に（最早 55）
- 死後：「あなたの人生サマリ」画面（SPEC-040 §12）

## 8. 回想モード（老後）

### 8.1 老後の S14 回想画面（将来）
- 66 歳以降、ドックに「思い出」アイコン追加
- ライフイベント history を時系列で閲覧
- 各エピソードをタップ → その日の素養値・関係値・プレイ履歴を表示
- 「自分はこういう人生を歩んだ」の感動演出

## 9. データ構造

```json
{
  "id": "marriage",
  "name": "結婚",
  "trigger": {
    "minAge": 24,
    "maxAge": 40,
    "relationshipIdPrefix": "romance_",
    "minRelationshipValue": 95,
    "minMoney": 1000000,
    "careerStable": true
  },
  "outcome": {
    "money": -3000000,
    "soyou": { "social": 30, "passion": 20 },
    "spouseFrom": "romance_*",
    "history": "{partnerName} と結婚式を挙げた。これから二人で。",
    "toastDuration": 5000
  }
}
```

## 10. フロー統合図

```
0─────5────13────18────22────30────40────50────65────80────100
 ︱出生 初恋 初恋 受験 卒業 結婚 出産 子立ち 退職 老衰 死亡
             告白                育児         孫
                         転職    病気  介護
                                  ↓      ↓
                                健康診断 祖父母死
```

## 11. テスト観点
- 中学 1 年の夏：social 50, sensitivity 50 で 5% 抽選 → first_love 発動
- 高校 2 年：relationship 72, passion 60 で告白成功率 70%
- 結婚：money 150万, romance 95 で marriage 選択肢 開放
- 出産：marriage 後 270 日で child_1 が relationships に追加
- 自分の親 age 86：親の死亡抽選が 15% / 年で開始
- age 100 到達で自然死、エンディングサマリ画面

## 12. 改訂履歴
- 2026-04-19: 初版
