# リール動画の書き出し

`reel.json` を読み、黒背景・線画の頭・「心の窓」に言葉や絵が切り替わる 1080×1920 / 30fps の mp4（無音）と、表紙用の `cover.png` を書き出す。

```sh
npm install                                  # 初回だけ
node render.mjs <reel.json> [出力フォルダ]     # 出力フォルダを省くと reel.json と同じ場所
```

ffmpeg が必要。Chromium は Playwright のものを使う（`CHROME_PATH` で指定もできる）。

## reel.json の書き方

```json
{
  "title": "恐怖の正体は「不快感」かもしれない",
  "source": "fear.html",
  "fps": 30,
  "window": { "x": 545, "y": 760, "width": 620, "height": 450 },
  "screens": [
    { "text": "怖い。", "duration": 1.4, "size": 96, "cover": true },
    { "strike": "危険", "text": "不快", "duration": 1.8 },
    { "text": "動いた記録が、\n自信になる。", "duration": 2.2, "size": 58, "marker": true },
    { "image": "assets/stairs.svg", "text": "一段ずつ", "duration": 1.6 },
    { "text": "続きは\nプロフィールの\nリンクから", "sub": "記事名", "duration": 2.6, "size": 46 }
  ]
}
```

| 項目 | 意味 |
|---|---|
| `text` | 窓の中の言葉。`\n` で改行。1画面12字以内が目安 |
| `size` | 文字の大きさ（px、既定 76） |
| `strike` | 打ち消し線つきで上に出す言葉（「~~危険~~ 不快」のような転換） |
| `marker` | `true` で黄色のマーカーを引く |
| `sub` | 下に小さく出す補足 |
| `image` | 窓の中に出す絵（reel.json からの相対パス。白黒・線画推奨、自前の素材のみ） |
| `duration` | 表示する秒数 |
| `cover` | `true` の画面を表紙（cover.png）にする |
| `window` | 心の窓の位置と大きさ（省略可） |

見本：`../examples/fear/reel.json`

## 早送りカット型（cuts.mjs）

素材の映像を約0.5秒ずつ切り替え、一言を重ねる型。`node cuts.mjs <cuts.json>`。書き方は `instagram/cuts/README.md`。
