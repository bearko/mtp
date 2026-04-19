# SPEC-029: 遊び中ムービー再生

| 項目 | 内容 |
|---|---|
| 仕様ID | SPEC-029 |
| 機能名 | 遊び中ムービー再生（Play Intro Video） |
| 対応ファイル | `prototype/data/videos/{playId}.mp4` / `prototype/index.html` `#play-video`, `#play-video-el` / `prototype/game.js` `tryPlayIntroVideo()`, `hidePlayVideo()` / `prototype/styles.css` `.play-video` |
| 関連仕様 | SPEC-003（遊び実行）, SPEC-028（マスタデータ） |
| ステータス | Active |
| 最終更新 | 2026-04-19 |

## 1. 目的
遊びの没入感を高めるため、遊び選択後の S3「遊び中」画面（`screen-playing`）の冒頭に、遊びごとの短尺（約 5 秒）ムービーを流す。

世界観を補強し、何の遊びをしているかの理解を助ける効果を狙う。ムービーが存在しない遊びについては従来の絵文字＋アニメ画面をそのまま使う（後方互換）。

## 2. 用語定義
- **プレイ動画（Play Video）**：遊び ID と 1:1 対応する動画ファイル。`data/videos/{playId}.mp4`
- **動画プローブ**：再生前に `fetch(path, { method: "HEAD" })` で存在を確認する処理
- **フォールバック**：動画が存在しない or 読み込みに失敗した場合に、従来の `screen-playing` 中央アニメを表示する挙動

## 3. 前提
- 遊び ID は SPEC-028 `plays.json` で定義されているもの
- 動画は **MP4 / H.264 / AAC** を基本とし、モバイルブラウザ（iOS Safari, Android Chrome）で autoplay 可能であること
- 想定尺は **5 秒程度**（長すぎるとタップ数削減の努力と相反する）
- 縦横比は 9:16（縦向き）または 16:9（横向き）。`object-fit: cover` で中央合わせ

## 4. 画面仕様
### 4.1 配置
S3 `screen-playing` の本文エリア上部に `<div id="play-video">` を新設し、その中に `<video id="play-video-el" muted playsinline>` を配置する。
- 動画あり：`#play-video` を表示し、従来の絵文字アニメ領域（`#play-anim`）を隠す
- 動画なし：`#play-video` を隠し、従来の `#play-anim` を表示（現状維持）

### 4.2 ライフサイクル
1. `selectPlay(id)` → `startPlay()` で S3 に遷移する直前に `tryPlayIntroVideo(play.id)` を呼ぶ
2. `tryPlayIntroVideo` は以下の処理：
   1. `fetch("data/videos/${id}.mp4", { method: "HEAD" })` で 200 が返るか確認
   2. 返れば `<video>` の `src` にセット、`#play-video` を表示、`#play-anim` を非表示、`play()`
   3. 返らなければ何もしない（フォールバック）
3. 動画再生中でも「遊びをやめる」「経過を飛ばす」等のユーザー操作で即停止＆プレイ画面の通常フローに戻る
4. 動画が 5 秒未満で終わった場合は、`ended` イベントを待ってそのまま通常アニメの表示には切り替えない（最後のフレームを保持）
5. 画面遷移（`showScreen`）で `screen-playing` 以外に切り替わる際は `hidePlayVideo()` で停止＆src クリア

### 4.3 レイアウト
- 幅：画面幅いっぱい（max 600px）
- 高さ：アスペクト比を維持。横動画なら `aspect-ratio: 16/9`、縦動画なら `aspect-ratio: 9/16`
- 背景：黒
- コントロール：非表示（`controls` 属性を付けない）

## 5. 実装詳細
### 5.1 HTML
```html
<section id="screen-playing" class="screen" hidden>
  <div class="play-stage">
    <div id="play-video" class="play-video" hidden>
      <video id="play-video-el" muted playsinline></video>
    </div>
    <div id="play-anim" class="play-anim">…（従来）…</div>
    <div id="play-label">…</div>
    <p id="play-narration">…</p>
    …
  </div>
</section>
```

### 5.2 JavaScript
```js
async function tryPlayIntroVideo(playId) {
  const path = `data/videos/${playId}.mp4`;
  try {
    const res = await fetch(path, { method: "HEAD" });
    if (!res.ok) return false;
  } catch (e) {
    return false;
  }
  const wrap = byId("play-video");
  const vid  = byId("play-video-el");
  const anim = byId("play-anim");
  vid.src = path;
  wrap.hidden = false;
  if (anim) anim.hidden = true;
  try {
    await vid.play();
  } catch (e) {
    // autoplay 失敗（iOS 低電力など）。動画は出すがユーザータップ待ち
  }
  return true;
}

function hidePlayVideo() {
  const wrap = byId("play-video");
  const vid  = byId("play-video-el");
  const anim = byId("play-anim");
  if (!wrap) return;
  wrap.hidden = true;
  if (anim) anim.hidden = false;
  if (vid) {
    try { vid.pause(); } catch (e) {}
    vid.removeAttribute("src");
    vid.load();
  }
}
```

### 5.3 `showScreen` へのフック
`showScreen(id)` 内で、`id !== "screen-playing"` のときに `hidePlayVideo()` を呼ぶ。

### 5.4 ファイル配置
- `prototype/data/videos/` 新設
- `README.md` に追加方法を記載
- プレイヤーまたは制作者が `{playId}.mp4` を追加するだけで自動で適用

## 6. 失敗モードと UX
| 失敗 | 挙動 |
|---|---|
| 404（ファイルなし） | フォールバック（従来画面） |
| autoplay ブロック | `play()` を try/catch。動画は画面に出すが一時停止状態 |
| `load()` 時エラー | フォールバック |
| 再生中に画面遷移 | `hidePlayVideo()` で停止＆リソース解放 |

## 7. テスト観点
- ファイルが無い遊びでは従来画面どおりに動く（Phase 0 の絵本・滑り台・砂場を検証）
- 無関係な mp4 を `slide.mp4` として置くと、滑り台選択時に再生される
- 「経過を飛ばす」「遊びをやめる」を押したあと他の遊びに切り替えても前の動画が残らない（`hidePlayVideo`）
- 遊びツリー／S2 に戻っても `#play-video` が hidden になっている

## 8. 改訂履歴
- 2026-04-19: 初版
