# YouTube 第1本「神は死んだ」制作フォルダ

ムートン YouTube 第1本の制作物一式。`_` で始まるフォルダなので、GitHub Pages のサイトには公開されない。

## 進み具合

| # | 工程 | 状態 |
|---|---|---|
| 1 | Elias 最終ナレーション（8:01） | 用意済み。`assets/narration.mp3` に置く |
| 2–3 | 映像設計（8:01 版） | **確定** → `edit.csv` |
| 4–5 | 字幕の読み込み・確認 | SRT 待ち。`python3 render.py --check` で自動チェック |
| 6–11 | 素材配置・冒頭・テロップ・ラスト・BGM | `render.py` で自動化済み。素材待ち |
| 12 | 通し確認 | 書き出し後 |
| 13 | サムネイル | **確定** → `thumbnail.jpg`（1280×720・230KB） |
| 14 | タイトル | **確定** → `plan.md` |
| 15 | 概要欄・チャプター | **完成**（チャプター時刻は SRT で最終確認） → `plan.md` |
| 16–17 | 限定公開で確認 → 公開 | 動画完成後 |
| 18 | X・サイト・Shorts 展開 | **完成**（動画 URL 待ち） → `plan.md` |

## 動画の作り方

### 1. 素材を置く

```
assets/
  narration.mp3        Elias 最終ナレーション（8:01）
  subtitles.srt        最終字幕
  bgm.mp3              BGM 1曲（任意。静かなアンビエント／ピアノ／ドローン）
  clips/
    nietzsche.jpg      ← edit.csv の clip 列の名前 + 拡張子。動画（mp4/mov）でも画像（jpg/png）でもよい
    night_street_1.mp4
    ...
```

使う素材の名前（`edit.csv` の clip 列）:

| 名前 | 素材 | 名前 | 素材 |
|---|---|---|---|
| `nietzsche` | ニーチェ | `watch_gears` | Watch gears |
| `night_street_1` | Night street 1 | `man_window_city` | Man at window city |
| `night_street_2` | Night street 2 | `man_window` | Man at window |
| `cathedral` | Cathedral | `silhouette_forest` | Silhouette forest |
| `misty_path` | Misty path | `crowd_bw` | Crowd BW |
| `old_books` | Old books | `city_crowd` | City crowd |
| `church_window` | Church cross window | `man_back` | Man back viewpoint |
| `cobblestone` | Cobblestone street | `sunrise_road` | Sunrise road |
| `smoke_stacks` | Smoke stacks | `dawn` | Dawn |
| `steam_train` | Steam train | | |

### 2. チェックする

```
python3 render.py --check
```

ナレーションの長さ、字幕（表示時間が短すぎる行・長すぎる行・重なり・全角半角の混在）、テロップが字幕のどこに出るか、足りない素材、短すぎる素材を一覧にする。

### 3. 書き出す

```
python3 render.py --preview   # 960x540 の確認用（約3分）
python3 render.py             # 1920x1080 / 30fps の本番 → out/ep01-nietzsche.mp4
```

必要なのは Python 3 と ffmpeg。初回だけ Google Fonts から Noto Serif JP / Noto Sans JP を取得する。

## スクリプトがやること

- **音声が基準**：ナレーションは 0:00 からそのまま。映像は `edit.csv` の時刻に合わせる
- **冒頭**：0:00 は黒画面。字幕の「神は死んだ」の行に合わせて、大きな「神は死んだ。」がフェードイン → 沈黙 → ニーチェ → 夜の石畳
- **カット**：0.8 秒のクロスフェードでつなぐ。どのカットもゆっくり 5% 寄る（`effect` を `none` にすると止める）
- **素材が短いとき**：0.7 倍までスローにして、それでも足りなければ最後のコマで静止
- **素材がまだないとき**：名前入りの仮画面で書き出す（全体の尺とテンポを先に確認できる）
- **字幕**：画面下部、白文字＋薄い影・縁取り（Noto Sans JP）
- **大きなテロップ**：`telops.csv` の 5 つだけ。字幕からその言葉を探して、話している間＋直後の「間」に表示。テロップと同じ短い字幕は重複するので隠す
- **BGM**：-27dB でかなり小さく、最初 4 秒・最後 6 秒をフェード
- **ラスト**：ナレーション終了後 4.5 秒映像を残し、最後の 2.5 秒で黒へ

時刻は映像設計の表から入れてある。実際のナレーションと区切りがずれていたら `edit.csv` の時刻を直して書き出し直す。
