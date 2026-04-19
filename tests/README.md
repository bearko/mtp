# tests/

@spec [`docs/specs/SPEC-036-testing.md`](../docs/specs/SPEC-036-testing.md)

## レイヤー
- **unit/**：Node.js 単体で動く単体テスト（1 秒以内）
- **integration/**：puppeteer-core で `prototype/index.html` を開く結合テスト（各 10 秒以内）
- **scenario/**：1 週間〜1 年の通しプレイ（各 30 秒以内）

## 実行
```bash
# 全部
./tests/run.sh
# 層を絞る
./tests/run.sh unit
./tests/run.sh integration
./tests/run.sh scenario
```

integration / scenario は `python3 -m http.server 8765` を起動しておく必要がある（`run.sh` が未起動なら自動で立ち上げる）。

## 書き方
```js
// @spec SPEC-033 §10
const { describe, it, assertEq } = require("../lib/assert.js");

describe("soyouGrade 境界値", () => {
  it("0 → G", () => assertEq(soyouGrade(0), "G"));
  it("20 → F", () => assertEq(soyouGrade(20), "F"));
});
```

## ルール
1. ファイル名は `*.test.js` 固定
2. 冒頭に `@spec SPEC-XXX §節` で対応仕様を明記
3. 失敗時は exit 1 で終わるよう投げっぱなしで OK（`describe/it` が捕捉してログ）
