# SPEC-032: メッセージマスタ（セリフ・ナレーションの外部化）

| 項目 | 内容 |
|---|---|
| 仕様ID | SPEC-032 |
| 機能名 | メッセージマスタ（セリフ・ナレーション・名前候補の JSON 外部化） |
| 対応ファイル | `prototype/data/isekai.json`, `prototype/data/names.json` / `prototype/game.js` `loadMessageMasters()`, `DEFAULT_ISEKAI_SCENES`, `DEFAULT_NAMES` |
| 関連仕様 | SPEC-028（マスタデータ管理の方針）, SPEC-031（転生イントロ） |
| ステータス | Active |
| 最終更新 | 2026-04-19 |

## 1. 目的

セリフ・ナレーション・名前候補などの **表示テキスト** を JSON で外部管理し、コードに触らずにメッセージの追加・修正ができるようにする（SPEC-028 の思想をメッセージ領域に拡張）。

まずは SPEC-031 の転生イントロと、主人公名のランダム化に対応する。将来的には保育園の連絡帳テンプレ、チュートリアルモーダル文言、ライフステージ説明なども同様に外部化する。

## 2. 対応ファイル（Phase 1）

| ファイル | 内容 |
|---|---|
| `prototype/data/isekai.json` | 転生イントロのシーン構造とメッセージ |
| `prototype/data/names.json` | 主人公名のランダム候補（性別別） |

## 3. スキーマ

### 3.1 `isekai.json`

```jsonc
{
  "scenes": [
    {
      "id":   string,              // scene1 .. scene4
      "bg":   "dark"|"halo"|"certificate"|"dawn",
      "messages": [                // シンプルなメッセージ列（scene1/4）
        { "speaker": Speaker, "text": string }
      ],
      "steps": [                   // 複合ステップ列（scene2 のみ）
        { "type": "message", "speaker": Speaker, "text": string }
        { "type": "input",   "field": "playerName", "placeholder": string, "confirmLabel": string }
      ],
      "certificate": {             // scene3 のみ
        "title": string,
        "fields": [{ "label": string, "value": string }],
        "stampText": string
      }
    }
  ]
}
```

- `Speaker` は `"narration" | "mystery" | "god" | "player"`
- `text` 内で `{playerName}` `{avatarName}` などのプレースホルダが使える（`player[key]` を置換）

### 3.2 `names.json`

```json
{
  "male":   [string, string, ...],
  "female": [string, string, ...]
}
```

- 最低 1 件以上の名前が必要
- 主人公の性別は SPEC-031 §5.1 の証明書 `性別` フィールドに従う

## 4. 読み込みフロー

`game.js` 起動時の `loadMasters()` と並列に `loadMessageMasters()` を実行する：

```js
async function loadMessageMasters() {
  try {
    const [isekai, names] = await Promise.all([
      fetch("data/isekai.json").then(r => r.json()),
      fetch("data/names.json").then(r => r.json()),
    ]);
    ISEKAI_SCENES = isekai.scenes || DEFAULT_ISEKAI_SCENES;
    NAMES = { male: names.male || DEFAULT_NAMES.male,
              female: names.female || DEFAULT_NAMES.female };
  } catch (e) {
    console.warn("[master] failed to load messages, using DEFAULT", e);
    ISEKAI_SCENES = DEFAULT_ISEKAI_SCENES;
    NAMES = DEFAULT_NAMES;
  }
}
```

## 5. 失敗モード
- `fetch` が失敗した場合：`DEFAULT_ISEKAI_SCENES` / `DEFAULT_NAMES` にフォールバック（`game.js` 内に最小限の同等データをハードコード）
- JSON パース失敗：上記と同じ

## 6. 拡張計画（Future）
- Phase 2：`tutorial.json`（SPEC-026 のモーダル文言）
- Phase 3：`renrakucho.json`（SPEC-027 の先生／家庭コメントテンプレ）
- Phase 4：i18n に対応できるよう `messages.{lang}.json` 構造に拡張

## 7. テスト観点
- JSON を編集してシーン 1 の「・・・」を別の文字列に変えると、リロード後反映される
- `names.json` の `male` を空にした場合、`DEFAULT_NAMES.male` にフォールバック
- プレースホルダ `{avatarName}` が正しく置換される

## 8. 改訂履歴
- 2026-04-19: 初版
