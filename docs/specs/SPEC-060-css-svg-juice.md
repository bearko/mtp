# SPEC-060: CSS/SVG 演出強化

| 項目 | 内容 |
|---|---|
| 仕様ID | SPEC-060 |
| 機能名 | CSS/SVG 演出強化 |
| 対応ファイル | `prototype/index.html` (`#play-css-stage`), `prototype/game.js` (`PLAY_SCENE_CONFIG`, `renderPlaySceneStage()`, `setPlaySceneComplete()`), `prototype/styles.css` (`.play-css-*`) |
| 関連仕様 | SPEC-003, SPEC-029, SPEC-034, SPEC-035 |
| ステータス | Active |
| 最終更新 | 2026-04-27 |

## 1. 目的

本番素材（画像・映像・音声）は別途用意して GitHub に入れる方針としつつ、素材がない段階でも CSS/SVG だけで遊び中の没入感を上げる。

## 2. 用語定義

- **CSS/SVG 演出**: 外部画像・外部音声を使わず、CSS グラデーション、絵文字、SVG リング、軽いアニメーションで作る演出。
- **カテゴリシーン**: 遊びの主素養に応じて背景色、粒子、文言を切り替える表現。

## 3. 入力（Input）

- `play.gain`
- `play.icon`
- `play.name`
- `screen-playing` の進捗率

## 4. 出力（Output）

- S3 遊び中画面に、カテゴリ別グラデーション背景、浮遊パーティクル、SVG 進捗リングを表示する。
- 完了時に `COMPLETE!` オーバーレイを一瞬表示する。
- `prototype/data/videos/{playId}.mp4` がある遊びでは、既存の動画を優先する。

## 5. 挙動（Behavior）

1. `startPlay(play)` で `renderPlaySceneStage(play)` を呼ぶ。
2. `play.gain` の最大素養を主カテゴリとして選ぶ。
3. 主カテゴリに応じて `PLAY_SCENE_CONFIG` の class / label / particles を適用する。
4. `requestAnimationFrame` の進捗率で `.play-css-ring-progress` の `strokeDashoffset` を更新する。
5. 進捗100% またはスキップ時に `setPlaySceneComplete(true)` を呼び、完了オーバーレイを表示する。
6. 動画がある場合は `tryPlayIntroVideo()` が `#play-video` を表示する。CSS/SVG 演出は背景として残るが、動画表示を優先する。

## 6. UIへの反映

- S3 遊び中: 従来の絵文字だけの表示から、カード型の演出ステージへ変更する。
- S3 結果: `#result-panel` は既存通り下に表示する。
- 固定 HUD / 共通パラメーターバー / フッター高さは変更しない。

## 7. 想定される利用シナリオ

- `picturebook` は知性系として、緑〜水色系の発見演出を出す。
- 身体系遊びは水色系の全力プレイ演出を出す。
- 情熱が主の遊びは紫〜紺系の熱量演出を出す。

## 8. 例外・エッジケース

- `play.gain` が空の場合は `body` 扱いにする。
- モーション過多を避けるため、アニメーションは軽量な transform / opacity / SVG stroke のみ使う。
- ランダム配置は使わず、粒子位置は固定配列で安定させる。

## 9. 判断基準と Why not

- ✅ 採用: カテゴリ別グラデーション、浮遊パーティクル、SVG 進捗リング。外部素材なしで没入感が上がる。
- ✅ 採用: 動画がある場合は既存 SPEC-029 を優先。素材追加方針と衝突しない。
- ❌ 不採用: 外部 CDN / 生成 API から動的に画像を取得する。オフライン方針とユーザー指定に反する。
- ❌ 不採用: Lottie 等の新依存追加。現行プロトタイプは依存なし静的 HTML/JS なので重い。
- ❌ 不採用: 大量コンフェッティ常時表示。SPEC-053 の報酬系レビュー上、刺激過多を避ける。

## 10. 未決事項・TODO

- 本番画像・映像が増えた段階で、CSS/SVG 演出をフォールバック専用にするか、動画と併用するか再判断する。
- SE / BGM は別 SPEC で音量・ミュート・ユーザー操作後再生制約を扱う。
