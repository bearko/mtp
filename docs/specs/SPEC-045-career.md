# SPEC-045: キャリア・職業システム（業界・企業・昇進・転職）

| 項目 | 内容 |
|---|---|
| 仕様ID | SPEC-045 |
| 機能名 | 社会人期（23-65歳）の職業・業界・昇進シミュレーション |
| 対応ファイル | `prototype/data/industries.json`（新設）、`prototype/game.js` `player.career`, `runJobHunting()`, `promotionCheck()` |
| 関連仕様 | SPEC-016 大学, SPEC-017 社会人, SPEC-033 素養, SPEC-042 経済, SPEC-038 英霊 |
| ステータス | **Draft（未実装）** |
| 最終更新 | 2026-04-19 |

## 1. 目的

大学卒業時点の素養／スキル／学歴から **業界** と **初期企業** を決定し、以後の社会人人生の 43 年間を「昇進・転職・独立・退職」のフレームワークで描く。

Issue #14 の社会人パート「保育園からコツコツと培ってきた素養やスキルによって業界や企業が決まる」を具体化。

## 2. 用語定義
- **業界（Industry）**：主な仕事の分類（例：IT、金融、医療、教育、芸術、スポーツ）
- **企業（Company）**：所属する会社・組織。業界内で S/A/B/C の格付けがある
- **職位（Position）**：新卒 → 一般 → 主任 → 係長 → 課長 → 部長 → 役員 → 独立
- **昇進（Promotion）**：一定期間＋素養＋スキル＋評価で 1 段上のポジションに進む
- **転職（Job Change）**：業界・企業を変える。タイミング・条件が重要
- **独立（Independence）**：会社を辞めて個人で活動する選択肢

## 3. 業界一覧

### 3.1 主要 9 業界

| ID | 業界名 | 主な素養 | 主なスキル | 解禁条件（大学卒業時） |
|---|---|---|---|---|
| `industry_it` | IT・ソフトウェア | intellect | music, crafting | intellect A + 大学 B 以上 |
| `industry_finance` | 金融 | intellect, social | reading, literacy | intellect A + 大学 A 以上 + 英霊福沢 |
| `industry_education` | 教育・研究 | intellect, sensitivity | reading, literacy | intellect A + 教育実習 |
| `industry_arts` | 芸術・エンタメ | sensitivity | music, crafting | sensitivity A + 発表会実績 |
| `industry_sports` | スポーツ・健康 | body | movement | body A + 部活継続 |
| `industry_medical` | 医療 | intellect, body | reading | 医学部卒 |
| `industry_law` | 法曹 | intellect, social | reading, literacy | 法科大学院卒 + 司法試験 |
| `industry_sales` | 営業・商社 | social, passion | literacy | social A |
| `industry_general` | 一般事務 | ー | ー | 無条件（デフォルト） |

### 3.2 業界内の企業格付け

| ランク | 説明 | 月給（初任） | 昇進速度 | 安定度 |
|---|---|---|---|---|
| S | 業界トップ（外資・名門） | 〜 40万 | 早い | 高 |
| A | 有名企業 | 28-34万 | 標準 | 高 |
| B | 中堅企業 | 22-28万 | 標準 | 高 |
| C | 一般企業 | 20-22万 | 遅い | 中 |
| D | 中小・零細 | 18-20万 | 遅い | 低 |
| E | スタートアップ | 30-50万（変動大） | 早い（or 独立） | 低 |

## 4. 就職活動フロー（SPEC-016 §10 と接続）

### 4.1 エントリー時期
- 大学 3 年の夏（インターン）
- 大学 3 年の冬〜大学 4 年の春（本エントリー）
- 有名校なら前倒し（大学 2 年夏〜）

### 4.2 選考プロセス
1. エントリーシート：intellect, sensitivity で通過率
2. 筆記試験：intellect, knowledge-based skill で判定
3. 面接：social, passion, 大学ランクで判定
4. 最終面接：total + 英霊効果（孫尚香 +10% 社交評価）

### 4.3 内定
- 内定先の業界・企業を `player.career = { industry, company, rank, position: "new_grad" }` に保存
- 複数内定 → プレイヤーが選ぶ

### 4.4 就職後
- 新卒 1 年目：`position: "new_grad"`
- 1 年経過 + 素養条件達成で `"junior"`（一般社員）に昇格

## 5. 職位階層

| Position | 年齢目安 | 昇進条件 | 月給係数 |
|---|---|---|---|
| new_grad | 22-23 | 1 年経過 | 1.0 |
| junior | 24-27 | 3 年 + intellect 60 | 1.2 |
| senior | 28-32 | 4 年 + intellect 80 / social 70 | 1.5 |
| chief | 33-38 | 5 年 + 評価 A + 昇進試験 | 2.0 |
| manager | 39-48 | 6 年 + 社内政治（social A） | 2.8 |
| director | 49-58 | 10 年 + passion A | 4.0 |
| executive | 59-65 | 役員推薦 | 6.0 |
| retired | 66+ | 定年退職 | – |

## 6. 昇進試験（SPEC-043 評価イベント）

### 6.1 タイミング
- 3 年経過ごとに `promotionCheck(player.career)` が発火
- 条件を満たしていれば自動昇進。あるいは選考イベントに進む

### 6.2 選考イベント
- SPEC-043 の枠組みで判定
- 判定式：`score = intellect*1.0 + social*0.8 + passion*0.5 + 業界スキル平均Lv*2`
- しきい値を超えれば昇進、下回れば再試験

## 7. 転職

### 7.1 発動条件
- 現職での `unsatisfactionDay >= 60`（後述）
- 内発的イベント：「もっと自分に合う仕事を」「家族との時間を」等
- 外発的イベント：リストラ（景気悪化で 5% 確率）

### 7.2 不満度
- 毎日 `unsatisfactionDay` に以下を加算：
  - 残業 3h 以上：+1
  - passion 30 未満：+0.3
  - リズム連続 3 日 40 未満：+0.5
- 50 を超えると転職モーダル

### 7.3 転職後
- 新しい業界/企業が決定
- 経験年数リセット（position は 1 段下がる）
- 給与は 0.8〜1.2 倍（ネゴ力 = social）

## 8. 独立（起業・フリーランス）

### 8.1 条件
- 業界経験 5 年以上
- `player.money >= 500万`
- passion A
- 英霊（孫尚香 or ダビデ）いれば +20% 成功率

### 8.2 独立後
- 月給固定 → 変動収入
- ランダムで ±100% の月収揺れ
- 5 年後までに黒字化しないと「廃業」→ 再就職（職位リセット）

## 9. ライフイベントとの連携（SPEC-046）

### 9.1 結婚・出産
- 結婚：`social A + age 27+ + romance relationship 90+`
- 出産：結婚後、パートナーとの関係値 85+ + player.money >= 50万
- 育児期（子供 0-3 歳）：仕事時間 -20%、passion +10、social +10

### 9.2 介護
- 親の年齢が +88 歳を超えた時点で 30% 確率で介護イベント
- 介護期：仕事時間 -30%、passion -5 / 月、social +5

## 10. 業界内の代表的な会社名（NPC 的イメージ）

- IT：`ソラテック` / `ネクストリア` / `クラウドフォース`
- 金融：`みずなみ銀行` / `東京セキュリティ証券`
- 教育：`日本文理大学` / `学林社`
- 芸術：`オープニング・レコード` / `キャンバス・ギャラリー`
- スポーツ：`スカイブルー FC` / `日本フィットネス`
- 医療：`中央総合病院` / `北浜クリニック`
- 法曹：`森田・小林法律事務所`
- 営業：`グローバルトレード` / `商事カンパニー`
- 一般：`日本総合商事` / `関東電機`

（すべて架空）

## 11. テスト観点
- 大学 S + intellect A + 司法試験合格で `industry_law` の企業 S に内定
- 3 年後に昇進判定、intellect 80 を満たしていれば junior → senior
- 転職時に給与 1.2 倍を獲得（social A + 交渉）
- 50 歳で director 昇進、役員推薦で executive に
- 62 歳で独立を選択、月収変動あり

## 12. 改訂履歴
- 2026-04-19: 初版
