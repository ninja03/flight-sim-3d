# 3D Flight Simulator ✈️

Three.js で作った、ブラウザで動くアーケード調の 3D フライトシミュレーターです。
ビルドツール不使用・依存は `three` のみ。デスクトップ（キーボード）とモバイル（タッチ）の両方で遊べます。

## 公開サイト

🌐 **https://ninja03.github.io/flight-sim-3d/**

`main` ブランチに push すると GitHub Actions（`.github/workflows/pages.yml`）が
静的サイトをビルドして自動デプロイします。

## 起動方法

```bash
npm install   # three を取得し、postinstall で vendor/ に ESM ビルドをコピー
npm start
```

ブラウザで <http://localhost:5173> を開くと起動します（ポートは `PORT` 環境変数で変更可能）。

> `index.html` の import map は `./vendor/three.module.min.js` を参照します。
> このファイルは `scripts/vendor-three.js` が `node_modules/three/build/` からコピーする
> 生成物なので、コミット対象外（`.gitignore`）です。`npm install` で自動的に生成されます。

### npm スクリプト

| コマンド | 内容 |
| --- | --- |
| `npm start` / `npm run dev` | 静的サーバーを起動（<http://localhost:5173>） |
| `npm run vendor` | `node_modules/three/build` から `vendor/` へ three をコピー |
| `npm run pages` | デプロイ用の静的サイトを `dist/` に組み立てる |


## 遊び方

滑走路付近から離陸し、8 個のオレンジ色のゲート（リング）を順番くぐって周回します。
全ゲートクリアで達成メッセージが表示されます。

### キーボード操作

| キー | 動作 |
| --- | --- |
| `W` / `S` | ピッチ（機首下げ / 機首上げ） |
| `A` / `D` | ロール（左右の傾き） |
| `Q` / `E` | ラダー（左右旋回） |
| `Shift` / `Ctrl` | スロットル 増 / 減 |
| `Space` | エアブレーキ |
| `C` | 視点切替（CHASE ⇄ COCKPIT） |
| `R` | リセット |

### タッチ操作（スマートフォン / タブレット）

- 左スティック : ピッチ / ロール
- `▲` `▼` : スロットル 増 / 減
- `BRAKE` : エアブレーキ
- `CAM` : 視点切替 / `RST` : リセット

タッチ端末では自動で検出され、影の無効化・地形分割数やオブジェクト数の削減など、
パフォーマンス重視の設定に切り替わります。

## 実装している飛行モデル（アーケード寄り）

- 姿勢は YXZ オーダーのオイラー角（heading / pitch / roll）で管理
- バンク角による協調旋回（`turnRate = g·tan(roll) / speed`）
- 推力 − 抗力 − 経路方向の重力による速度積分、失速速度以下の降下と自動復帰
- 地上摩擦・離陸時の機首上げ制限・接地/墜落判定（高速または姿勢不良でクラッシュ）
- 自動レベル（入力が無いときのピッチ/ロールのトリム）

## 環境（ワールド）

- 8000m × 8000m のプロシージャル地形（value noise + fBm、頂点色分け・フラットシェーディング）
- 地形メッシュと当たり判定高さが同じノイズ関数を使うため、見た目は常に一致する
- 滑走路、街並み、木、雲、リングゲート
- 半球光 + 平行光（シャドウマップ）、距離フォグ

## ディレクトリ構成

```
.
├── index.html            # HUD / ヘルプ / import map
├── style.css             # HUD とタッチコントロールのスタイル
├── server.js             # 依存ゼロの静的ファイルサーバー（開発用）
├── package.json
├── scripts/
│   ├── vendor-three.js   # three の ESM ビルドを vendor/ へコピー
│   └── build-pages.js    # デプロイサイトを dist/ に組み立て
├── .github/workflows/
│   └── pages.yml         # GitHub Pages へ自動デプロイ
└── src/
    ├── main.js       # 初期化・ゲームループ・ゲート判定
    ├── aircraft.js   # 機体のモデルと飛行物理
    ├── world.js      # 地形・街・雲・ゲートなどの配置
    ├── terrain.js    # ノイズによる地形生成と高さ参照
    ├── camera.js     # 追従 / コックピット視点
    ├── input.js      # キーボード入力
    ├── hud.js        # 計器表示
    └── touch.js      # 画面内タッチコントロール
```

生成されるディレクトリ（コミット対象外）:

- `vendor/` … three の ESM ビルド（`npm install` で生成）
- `dist/` … Pages にアップロードされる静的サイト（`npm run pages` で生成）


## 技術スタック

- [Three.js](https://threejs.org/) r169（ES Modules / import map）
- Vanilla JavaScript（フレームワーク・バンドラーなし）
- Node.js 標準 `http` モジュールによる静的サーバー

## 動作環境

WebGL2 対応の最新ブラウザ（Chrome / Edge / Firefox / Safari）。
