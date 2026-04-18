# SPEC-002: 遊び選択（候補抽出と実行可否）

| 項目 | 内容 |
|---|---|
| 仕様ID | SPEC-002 |
| 機能名 | 遊び選択 |
| 対応ファイル | `prototype/game.js` の `PLAYS`, `isPlayAvailable`, `renderChooseScreen` |
| 関連仕様 | SPEC-001, SPEC-003, SPEC-007 |
| ステータス | Active |
| 最終更新 | 2026-04-18 |

## 1. 目的
プレイヤーの現在状態（年齢・季節・所持金・友人数・体力・余剰時間）に応じて、  
「今、実行できる遊び / できない遊び」を明示し、意思決定の場を提供する。

## 2. 用語定義
- **遊びマスタ（Play）**：遊び1種の定義データ。`PLAYS` 配列に格納。
- **実行可否（Availability）**：プレイヤーの現状況で遊びが実行できるかどうかのフラグと理由。

## 3. 入力（Input）
- プレイヤー状態（SPEC-001）
- 遊びマスタ（各遊びの `timeCost`, `moneyCost`, `staminaCost`, `seasons`, `ageMin`, `ageMax`, `minFriends`, `friendBonusPerPerson`, `gain`）

## 4. 出力（Output）
- 各遊びカードに「遊ぶ」ボタンとコスト、獲得予測、ロック理由を表示。

## 5. 挙動（Behavior）
### 5.1 ロック判定ルール（いずれか1つでも該当でロック）
| 条件 | ロック理由の表示 |
|---|---|
| `play.seasons` に現在の季節が含まれない | 「○季は季節外」 |
| `player.age < play.ageMin` | 「○歳以上が必要」 |
| `player.age > play.ageMax` | 「○歳まで」 |
| `player.money < play.moneyCost` | 「所持金不足 (¥○必要)」 |
| `player.spareHours < play.timeCost` | 「時間不足」 |
| `player.stamina < play.staminaCost` | 「体力不足」 |
| `player.friends < play.minFriends` | 「友人○人以上必要」（SPEC-007） |

### 5.2 並び順
- 実行可能な遊びを上、ロック中の遊びを下に並べる。

### 5.3 友人数の表示（SPEC-007連動）
- `minFriends` が設定されている遊びには、必要人数と「1人ごとの経験値ボーナス」を明示する。

## 6. UIへの反映
- 画面：S2 遊びを選ぶ（`#screen-choose`）
- 画面設計書：`docs/screen-design.md` §2.2

## 7. 想定される利用シナリオ
- 5歳・夏・所持金0円の子が、プール（¥300）を選択しようとすると「所持金不足 (¥300必要)」でロック表示される。
- 友人0人の状態では、鬼ごっこ・ごっこ遊びが「友人1人以上必要」でロック表示される。

## 8. 例外・エッジケース
- 候補がすべてロックされた場合、「何もしない（1h休む）」または「今日をおわる」を選択可能にしている。
