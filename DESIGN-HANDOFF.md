# UIデザイン実装ガイド — カネとジカンとジョウネツと

> デザインプロトタイプ（HTML/React）をネイティブ実装（React Native / Flutter）に移植する際の参考メモ。

---

## 📁 取り込むファイル

| ファイル | 役割 | 必要 |
|---|---|---|
| `game-ui.html` | 全画面のコンポーネント定義・App構成・共通スタイル | ✅ |
| `play-scene.jsx` | 「遊び中」画面。進捗リング・波アニメ・XPフロート演出 | ✅ |
| `result-enhanced.jsx` | 「遊び結果」画面。コンフェッティ・XPカウントアップ・LvUP演出 | ✅ |
| `ios-frame.jsx` | iOSフレームのスターターコンポーネント（今回未使用） | ❌ |

ブラウザで `game-ui.html` を開くだけで全画面を確認できる。  
`play-scene.jsx` と `result-enhanced.jsx` は `game-ui.html` から `<script type="text/babel" src="...">` で読み込む構成になっているため、**3ファイルを同じディレクトリに置く**こと。

---

## 🎨 デザインシステム

### カテゴリカラー（5種）

```js
const CAT = {
  body:    { g: ['#FF6B6B', '#FF8E53'], label: '身体系',  icon: '🏃' },
  create:  { g: ['#A18CD1', '#FBC2EB'], label: '創作系',  icon: '🎨' },
  explore: { g: ['#43E97B', '#38F9D7'], label: '探求系',  icon: '🔭' },
  social:  { g: ['#F093FB', '#F5576C'], label: '交流系',  icon: '💬' },
  compete: { g: ['#4FACFE', '#00F2FE'], label: '競技系',  icon: '🏆' },
};
```

- カード背景・アイコンバッジ・グロウシャドウをすべて `g[0]→g[1]` グラデーションで統一
- シャドウ色は `${g[0]}66`（40%透過）や `${g[0]}88`（53%透過）で統一感を出す
- React Native では `LinearGradient`（expo-linear-gradient）でそのまま再現可能

### ライフステージ別背景

| ステージ | 背景イメージ | カラー |
|---|---|---|
| 未就学〜小学生 | 青空・草原 | `#87CEEB → #FFF9C4 → #C8F7C5` |
| 中高生・大学生 | 夜・宇宙 | `#667eea → #764ba2 → #f093fb` |
| 社会人・中年 | ダーク・都会 | `#2b5876 → #4e4376 → #c0392b` |
| 定年・老後 | 黄金・夕暮れ | `#f7971e → #ffd200 → #f7971e` |

---

## 📱 レスポンシブ戦略

### デスクトップ
375×812px のフォンモックを横並びで展示（デザインレビュー用）。

### スマホ（≤600px）
フォン1台のみを `transform: scale()` でビューポートにフィットさせる。

```js
const scale = Math.min(window.innerWidth / 375, window.innerHeight / 812);
// <div style={{ transform: `scale(${scale})`, transformOrigin: 'center center' }}>
```

React Native / Flutter ではビューポートがそのままデバイス解像度に対応するため、  
`Dimensions.get('window')` でフォントサイズや余白のスケール計算に使う程度でよい。

---

## ⚙️ 画面遷移設計

```
MainScreen
  └─[今日、何して遊ぶ？]→ PlaySelectScreen
                              └─[カードタップ]→ PlayingScreen
                                                   └─[完了 or タップでスキップ]→ ResultScreen
                                                                                    └─[次の遊びへ]→ PlaySelectScreen
```

### 実装ポイント
- 各画面は `onComplete` / `onNext` / `onBack` のコールバックのみを受け取る**疎結合設計**
- `play` オブジェクト（`{ id, name, cat, icon, time, cost, pts }`）を親Appで保持して props で渡す
- `key={playKey}` を使い、遊びが変わるたびにアニメーションコンポーネントを**強制リマウント**してリセット

```jsx
const goPlaying = (p) => {
  setPlay(p);
  setPlayKey(k => k + 1);  // ← これでアニメが毎回最初から始まる
  setScreen('playing');
};
```

---

## 🎬 アニメーション実装のポイント

### 1. CSS `animation` + `both` fill-mode で順番に登場

```css
/* 要素ごとに delay をずらすだけで「順番に現れる」演出になる */
.xp-card    { animation: popIn     0.55s cubic-bezier(0.34,1.56,0.64,1) 0.55s both; }
.lv-badge   { animation: popIn     0.55s cubic-bezier(0.34,1.56,0.64,1) 1.40s both; }
.passion    { animation: fadeSlideUp 0.5s ease                          1.70s both; }
.cta-button { animation: fadeSlideUp 0.5s ease                          2.00s both; }
```

`both` = 開始前は `from` の状態で待機 → 遅延が長くても画面がちらつかない。  
React Native では `Animated.sequence` + `Animated.delay` で同様のことができる。

### 2. スプリングイージング（バウンス感）

```css
/* cubic-bezier(0.34, 1.56, 0.64, 1) = オーバーシュートあり */
animation: popIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1);
```

ゲームUIらしいポップな弾み感はこのイージング1本で解決。  
React Native では `Animated.spring` の `{ tension: 180, friction: 8 }` が近い。

### 3. XP数字カウントアップ（useCountUp hook）

```js
function useCountUp(target, duration, startDelay) {
  const [val, setVal] = useState(0);
  useEffect(() => {
    const timeout = setTimeout(() => {
      const start = Date.now();
      const tick = () => {
        const t = Math.min((Date.now() - start) / duration, 1);
        const eased = t === 1 ? 1 : 1 - Math.pow(2, -10 * t); // ease-out-expo
        setVal(Math.round(eased * target));
        if (t < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    }, startDelay);
    return () => clearTimeout(timeout);
  }, [target]);
  return val;
}
```

`ease-out-expo` で最初は速く、最後にぴたっと止まるカウントアップ。  
React Native では `Animated.Value` + `interpolate` で同様に実装できる。

### 4. 決定論的コンフェッティ（ランダム不使用）

コンフェッティの座標・回転・色はすべてハードコード。  
`Math.random()` を使うと再レンダリングのたびに位置が変わってしまうため、  
**固定値の配列として定義**することでアニメーションが安定する。

```js
const CONFETTI_PIECES = [
  { x: 18,  delay: 0.00, speed: 2.4, rot:  15, col: '#FFD700', w: 12, h: 6 },
  { x: 55,  delay: 0.05, speed: 2.7, rot: -35, col: '#FF6B9D', w:  8, h: 8 },
  // ... 合計20個
];
```

### 5. 「遊び中」画面のカテゴリ別シーン切り替え

```js
const SCENE_CONFIG = {
  body:    { bg: 'linear-gradient(...水色...)', water: [...], particles: ['💦','💧','🌊'] },
  explore: { bg: 'linear-gradient(...緑...)',   water: [...], particles: ['🦋','🍃','🌿'] },
  compete: { bg: 'linear-gradient(...紫...)',   water: [...], particles: ['⚡','✨','🎮'] },
  // ...
};
```

遊びカテゴリが変わると背景・波の色・浮かぶパーティクルが自動的に切り替わる。  
React Native では Lottie アニメーションのカラーパラメータを差し替える形で再現できる。

### 6. 進捗リング（SVG strokeDashoffset）

```jsx
const r = 52;
const circ = 2 * Math.PI * r;
const offset = circ * (1 - progress / 100);

<circle
  r={r} cx={65} cy={65}
  fill="none" stroke="white" strokeWidth={9}
  strokeDasharray={circ}
  strokeDashoffset={offset}   // ← ここを変えるだけで充填率が変わる
  strokeLinecap="round"
  style={{ transition: 'stroke-dashoffset 0.08s linear' }}
/>
```

`requestAnimationFrame` で `progress` を 0→100 に進めると滑らかなリングが描ける。  
React Native では `react-native-svg` の `Circle` + `Animated.Value` で同様に実装可能。

---

## 💡 ゲームUI全般のTips

| テーマ | コツ |
|---|---|
| **グロウ効果** | `box-shadow: 0 0 16px ${color}` を控えめに使うだけでゲームらしくなる |
| **glassmorphism** | `background: rgba(255,255,255,0.18)` + `backdrop-filter: blur(12px)` + `border: 1px solid rgba(255,255,255,0.3)` の3点セット |
| **バーの光沢** | バー充填後に `shimmer` アニメ（白い光が流れる）を追加するとリッチに見える |
| **タップフィードバック** | `transform: scale(0.97)` の `onPressIn` を入れるだけで満足感が大きく上がる |
| **文字の読みやすさ** | 暗い背景では `text-shadow: 0 2px 8px rgba(0,0,0,0.4)` を付けると文字が際立つ |
| **「次へ進みたくなる」CTA** | ボタンに `ctaPulse` アニメ（scale 1→1.03 を繰り返す）を付けると自然に目が行く |
| **LvUP演出の順序** | アイコン登場 → XP数字カウントアップ → バー充填 → Lvバッジ出現 → ジョウネツバー → CTAボタン の順で「積み上げ感」を演出 |

---

## 🔧 React Native移植チェックリスト

- [ ] `LinearGradient` → `expo-linear-gradient` の `<LinearGradient colors={[...]}>`
- [ ] `backdrop-filter: blur` → `@react-native-community/blur` の `BlurView`
- [ ] CSS `animation` → `Animated` API または `react-native-reanimated`
- [ ] SVGリング → `react-native-svg` の `Circle` + `strokeDashoffset`
- [ ] コンフェッティ → `react-native-confetti-cannon` または独自実装
- [ ] `transform: scale()` レスポンシブ → `useWindowDimensions` でスケール計算
- [ ] フォント → `Rounded Mplus 1c` などGoogle Fontsを `expo-font` でロード
