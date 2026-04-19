# 遊び中ムービー置き場 / Play Videos

@spec [`SPEC-029-play-video.md`](../../../docs/specs/SPEC-029-play-video.md)

## 概要
このフォルダには、S3「遊び中」画面（`screen-playing`）の頭に流す短尺ムービーを置く。

## 命名規則
- ファイル名：`{playId}.mp4`（例：`picturebook.mp4`, `slide.mp4`, `sandbox.mp4`）
- `playId` は `prototype/data/plays.json` の `id` と 1:1 対応
- 想定尺：**5 秒前後**（長すぎるとプレイ体験を阻害する）
- 形式：`.mp4`（H.264 / AAC 推奨）、縦横比は 16:9 か 9:16

## 挙動
- 遊び選択後、`screen-playing` が表示される直前に `fetch(path, { method: "HEAD" })` で存在確認
- 存在すれば画面中央に `<video autoplay muted playsinline>` で再生
- 存在しなければ従来通りのアニメーション画面のまま
- 再生中でも「遊びをやめる」ボタンで即スキップ可能

## 追加方法
1. 5 秒前後の .mp4 を用意
2. `prototype/data/videos/{playId}.mp4` として置く
3. プレビュー URL をリロードすると自動的に適用される
