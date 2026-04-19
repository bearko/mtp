# SPEC-035: 結果画面・サマリ画面の UI 統一（素養カード流用・スキル行・ステータスカット）

| 項目 | 内容 |
|---|---|
| 仕様ID | SPEC-035 |
| 機能名 | 結果画面（S3）・日サマリ（S10）・週サマリ（S9）の UI 刷新 |
| 対応ファイル | `prototype/index.html` #screen-playing / #screen-day-summary / #screen-highlight / `prototype/game.js` renderResult / renderDaySummary / showHighlight / renderSoyouResultList / renderSkillLines / `prototype/styles.css` .soyou-result-* |
| 関連仕様 | SPEC-002, SPEC-003, SPEC-021, SPEC-024, SPEC-025, SPEC-027, SPEC-033, SPEC-034 |
| ステータス | Active |
| 最終更新 | 2026-04-19 |

## 1. 目的

S2 遊び選択画面がグレードベースの素養カードに刷新されたのに対し、S3 遊び結果／S10 日の終わり／S9 週末サマリは **旧来のゲージ表現** で残っていた。

Issue #15 にて、**表示形式を S2 と統一しグレード表示にすることで、情報の一貫性と視認性を向上**させる方針が決まった。同時に、ヘッダーで再現可能な情報はカットし、**S10 の連絡帳（SPEC-027）がスクロール不要のファーストビュー**に来るよう情報密度を下げる。

## 2. 用語定義
- **素養カード（結果版）**：SPEC-034 §5.2 のカードを拡張し、プレイ前後の差分＋グレード推移を 1 枚で示す
- **スキル行**：獲得スキルを `{スキル名} Lv.{旧}→{新} 「{スキル}」で遊ぶ時の経験値を {旧%}→{新%} UP` の 1 行で示す表現
- **ファーストビュー**：画面読み込み直後にスクロール無しで見える最初の縦 1 スクリーン分

## 3. 前提
- SPEC-033 で `player.soyou = {body, intellect, sensitivity, social, passion}` に統合済み
- SPEC-034 で `renderSoyouList(preview)` が S2 用に存在
- SPEC-024 で `player.skills[catId] = { exp, lv }`、`skillBoostMultiplier(play)` = `1 + (avgLv - 1) * 0.02`（Lv51+ は 2.00 キャップ）

## 4. 共通ルール（3 画面共通）

### 4.1 カットする要素
- **ステータスカード丸ごと**（体力 / ジョウネツ / 友人数の数値比較リスト）
- **時間の流れカード**（クロック・前後時間・余剰）
- **ジョウネツ単独表示**（passion として素養カードに内包される）

ヘッダー（SPEC-034 §4）で現在の体力・残時間・年齢・日付が常に見えているため、結果画面での重複表示はしない。体力の「最終差分」を出したい場合は、ヘッダーの体力ゲージに一時的なゴースト赤帯（消費量の位置）を表示するにとどめる。

### 4.2 残す・強化する要素
- **獲得した素養**：素養カード（差分＋グレード推移の強調演出つき）
- **獲得スキル**：1 行テキスト表現。レベル上昇とブースト%差分を併記
- **連絡帳（S10 のみ）**：ファーストビューに配置

### 4.3 レイアウト順（3 画面共通）
```
┌──────────────────────┐
│ [共通HUD]              │
├──────────────────────┤
│ 🎮 遊び名・ヘッダー    │ ← 画面固有（S3/S10/S9）
├──────────────────────┤
│ 🌱 獲得した素養         │ ← 素養カード（S2 と同じビジュアル）
├──────────────────────┤
│ 🏷 獲得スキル          │ ← 1 行 × N（増加したスキルだけ）
├──────────────────────┤
│ 🏫 連絡帳（S10 のみ）   │ ← 上段にあるので ファーストビューで見える
├──────────────────────┤
│ フッター：続ける／次へ   │
└──────────────────────┘
```

## 5. 素養カード（結果版）

### 5.1 データ構造
前後の差分を 1 枚のカードに表示するため、`renderSoyouResultList(before, after, opts)` を新設する。

```js
/**
 * @spec SPEC-035 §5 結果画面用の素養リスト描画
 * before: {body, intellect, sensitivity, social, passion}
 * after:  同じ構造（現在値）
 * opts.emphasize: 増加したキーだけハイライトする場合に true
 */
function renderSoyouResultList(hostEl, before, after, opts);
```

### 5.2 DOM 構造
S2 の `renderSoyouList()` と同じ `.soyou-row` を流用するが、**差分値を常に `(+N)` バッジで表示**し、`value` セルは `旧 → 新` 形式で出す。ゼロ差分の素養は **カードから外す**（情報量削減）。

```html
<div class="soyou-row has-delta">
  <div class="soyou-icon">🧠</div>
  <div class="soyou-label">知性</div>
  <div class="soyou-grade grade-G">G</div>   <!-- グレード上昇時は "G→F" -->
  <span class="soyou-delta">+10</span>
  <div class="soyou-value">0<span class="soyou-value-arrow">→</span><span class="soyou-value-after">10</span></div>
</div>
```

### 5.3 経験値貯まった感の演出
グレード・実数値だけだと「経験値バーが埋まる快感」が失われる。以下を演出で補う：

- **fill-track アニメ**：素養カードの背景に細いゲージトラックを重ね、カード表示時に 0→ after/thresholdOfNextGrade % までスケールアップする薄い緑帯でフィル
- **+N バッジ ポップ**：（下からフェード＋微弾み）。数値は連番でカウントアップ（0→10 が 0.4 秒で加算）
- **グレードアップ強調**：グレード値の表示が `G → F` のときカード全体が `box-shadow: 0 0 12px rgba(255, 200, 60, 0.55)` で金色発光 + 🎉 絵文字をラベル左に一瞬表示
- **最大値到達（A→）**：控えめに紫色オーラ

これらは CSS Keyframes + `classList` トリガで実装。

### 5.4 `thresholdOfNextGrade(value)` の計算
次グレード到達までの進捗率を出すヘルパ。

```js
const GRADE_THRESHOLDS = [0, 20, 40, 66, 80, 110, 140, Infinity];
function progressToNextGrade(value) {
  const thr = GRADE_THRESHOLDS;
  for (let i = 1; i < thr.length; i++) {
    if (value < thr[i]) {
      const prev = thr[i-1];
      const span = thr[i] - prev;
      return { pct: ((value - prev) / span) * 100, nextAt: thr[i] };
    }
  }
  return { pct: 100, nextAt: null };
}
```

## 6. スキル行

### 6.1 仕様
- 1 行 1 スキル
- 表示内容：`{スキル名} Lv.{before}→{after} 「{スキル名}」で遊ぶ時の経験値を {before%}→{after%} UP`
- Lv が上がっていないスキル（exp だけ増加）は **Lv の矢印を省略**：`{スキル名} Lv.3 「...」で遊ぶ時の経験値を 4% UP`
- 新規獲得（before.lv が存在しない）：`✨ {スキル名} Lv.1 を覚えた！ 「...」で遊ぶ時の経験値を 0% UP`
- ブースト率の計算：`boostPct(lv) = Math.min(100, (lv - 1) * 2)`（スキル単体では 2%/Lv、Lv51+ は 100% キャップで表示）

### 6.2 DOM
```html
<ul class="skill-lines">
  <li class="skill-line">
    <span class="skill-line-name">遊具</span>
    <span class="skill-line-lv">Lv.<b>1</b>→<b>3</b></span>
    <span class="skill-line-effect">「遊具」で遊ぶ時の経験値を <b>2%</b> → <b>6%</b> UP</span>
  </li>
</ul>
```

Lv 矢印・effect 矢印には `.delta-highlight` クラスを付けて緑強調。

### 6.3 集計
- **S3**：`skillBefore` を `finalizePlay()` の `before` スナップショットから取得。current との差があるスキルだけ出力
- **S10**：`_daySnapshot.skillsStart` との差
- **S9**：`_autoHighlight.skillsBefore` との差

## 7. 画面別の差分

### 7.1 S3 遊び結果画面
- 旧：`<div class="card-title">獲得した素養</div>` の中に `gauge-group`、`<div class="card-title">ステータス</div>`、`<div class="card-title">時間の流れ</div>` が並んでいた
- 新：
  - ヘッダー画像（絵文字/動画）とプレイ名・ナレーションはそのまま維持
  - 直下に **`.soyou-result-list`**（`.soyou-row` の並び）
  - その下に **`.skill-lines`**（1 行 1 スキル）
  - ステータス・時間・ジョウネツカードは削除
- フッター：既存の `actions-result-normal`（🔁 もう一度遊ぶ / 次の遊びを選ぶ）、`actions-result-core`、`actions-result-sleep` は維持

### 7.2 S10 日サマリ画面（連絡帳ファーストビュー）
- 旧：`今日の遊び` → `素養` → `スキル` → `ステータス` → `連絡帳` の順（連絡帳が下でスクロール必要）
- 新：
  1. 画面ヘッダー「1日おわり」＋日付ヘッダー
  2. **連絡帳（SPEC-027）← ファーストビュー**
  3. 今日の遊び（絵文字だけ横並びで簡素に）
  4. 獲得した素養（素養カード）
  5. 獲得スキル（1 行 × N）
  6. フッター（続ける／スキップ／手動切替）
- ステータス・時間カードは削除

### 7.3 S9 週末サマリ画面
- 旧：`今週のハイライト` / 遊び回数 / 原体験 / スキル / 発見
- 新：
  1. 画面ヘッダー「今週のハイライト」＋範囲ラベル（N 週（M/D-M/D））
  2. **遊んだ回数** トップ 5（遊び名と回数のピル列）
  3. 獲得した素養（素養カード）
  4. 獲得スキル（1 行 × N）
  5. 今週の発見（既存の discovery カードは維持）
  6. フッター

## 8. 互換性
- 旧 `renderGaugeWithDelta` は S3/S10/S9 では呼ばなくなるが、その他（ツリー画面等）で使う可能性があるので関数自体は残す
- 旧 `#result-exp-gauges` / `#result-status-card` / `#result-status-gauges` / `#result-status` / `#result-skills-card` / `#result-clock-before` / `#result-clock-after` / `#result-spare` / `#result-passion` の DOM はしばらく残して `hidden` で制御。将来削除
- 連絡帳の位置変更（S10 §7.2）は既存の `#day-summary-renrakucho` 要素を DOM 順の頭に移動させる

### 8.1 削除済み DOM 参照は必ず null ガード（v2 で追加）
UI リデザインで DOM を削除した場合、`handleStaminaDepleted()` のような **想定外の実行パス** でも旧要素を参照しないようにする必要がある。本 SPEC 初版で `handleStaminaDepleted()` 内に以下のような参照が残っており、体力ゼロになった瞬間に `TypeError: Cannot read properties of null (reading 'textContent')` が発生して、以降のユーザー操作（スキップボタン・続けるボタン等）が一切反応しなくなるバグが出た：

```js
// 旧コード（バグあり）
renderClockDial(byId("result-clock-after"), { ... });
byId("result-spare").textContent = `⏳ 余剰時間 ${player.spareHours}h（+仮眠2h）`;
```

修正後：

```js
const clockAfterEl = byId("result-clock-after");
if (clockAfterEl) {
  try { renderClockDial(clockAfterEl, { ... }); } catch (e) { /* noop */ }
}
const spareEl = byId("result-spare");
if (spareEl) spareEl.textContent = `⏳ 余剰時間 ${player.spareHours}h（+仮眠2h）`;
```

**教訓**：DOM 削除を伴うリデザイン後、全ての `byId("...")` 参照を再検索し、null ガードまたは参照ごと削除する。SPEC-034 v3 でも同種修正（`startAutoLoop` / `stopAutoLoop`）を実施済み。

## 9. 実装メモ

### 9.1 新規関数
- `renderSoyouResultList(hostEl, before, after)` ：前後差分＋グレード推移＋アニメトリガ
- `renderSkillLines(hostEl, skillBeforeMap, skillAfterMap)` ：1 行 × N
- `boostPctFromLv(lv)` ：スキル単体 % 換算
- `progressToNextGrade(value)` ：素養カードの帯に使う

### 9.2 animateDeltaFillBar
```js
function animateCount(el, from, to, durationMs = 400) {
  const start = performance.now();
  function tick(now) {
    const t = Math.min(1, (now - start) / durationMs);
    el.textContent = Math.round(from + (to - from) * t);
    if (t < 1) requestAnimationFrame(tick);
  }
  requestAnimationFrame(tick);
}
```

## 10. テスト観点

- S3：絵本を遊ぶ → 素養カードに `知性 G +10 0→10`、スキル行に「読書 / 文字 / 感受性」3 行が出る。ステータス・時間カードは無い
- S10：日サマリを開いたとき、連絡帳カードが画面上部に見える（スクロール不要）
- S9：週末サマリで遊んだ回数・素養カード・スキル行が出る。旧ゲージ表示は無い
- 素養グレードアップ（20/40/66/80/110/140 境界）でカードが金色発光する
- スキル Lv アップ（`skillLvFromExp`）で skill-line の Lv が `旧→新` で表示、% も旧→新で出る

## 11. 改訂履歴
- 2026-04-19: 初版
- 2026-04-19 v2: 体力ゼロ時に handleStaminaDepleted() が削除済み #result-clock-after / #result-spare を触って TypeError になり、以降のスキップ等のボタンが効かなくなるバグを修正（§8.1 追加）
