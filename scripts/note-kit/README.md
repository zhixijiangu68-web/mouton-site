# note 公開キットと検査（scripts/note-kit/）

note に記事を貼るための「公開キット」（claude.ai の非公開アーティファクト）を作るスクリプトと、note の記事の検査。2026-10-18 に、セッションの一時フォルダからリポジトリに移した（一時フォルダは、セッションが終わると消えるため）。

- 公開キット：https://claude.ai/artifact/Gs3AeLZ44JgAd9faz77DAR （オーナーだけが開ける。使い方は `note/README.md` の「公開キット」）
- AI は note に投稿しない。キットは、オーナーがコピーして貼るための道具。

## ファイル

| ファイル | 中身 |
|---|---|
| `make_kit.py` | `note/` の記事・出品シートから、キットの `index.html` と `files.json`（見出し画像の対応）を作る |
| `kit_template.html` | キットのページ（データは `make_kit.py` が差しこむ） |
| `index-anxiety.json` | 目次の各記事の「不安」の一行（はじめの目次記事から写したもの） |
| `lint_series.py` | 30本（`note/series-30/`）の検査。`plan_data.py` の設計データを使う |
| `lint_next30.py` | 次の30本（`note/next-30/`）の検査。`note/next-30/plan.md` を読む |

## キットを作り直す

```sh
NOTE_KIT_OUT=/tmp/note-kit NOTE_PRIVATE_DIR=<非公開の原稿のフォルダ> python3 scripts/note-kit/make_kit.py
```

- 出力：`$NOTE_KIT_OUT/index.html` と `files.json`（`NOTE_KIT_OUT` がなければ `/tmp/note-kit`）。
- **有料記事の全文は公開リポジトリに入れない。** 「選べない」の有料の続きは、`$NOTE_PRIVATE_DIR/paid-choice/paid-rest.md` から読む。なければ、キットに「有料の続きをコピー」を出さない（オーナーに渡した全文のファイルが元）。
- 公開：Claude の Artifact ツールで、`index.html` を上の URL に publish する。`files` には `files.json` の対応（`img/...` → リポジトリの画像）を渡す。
- キットに入れた URL と「下書き」「公開」の印は、アーティファクトのデータベース（`kit/state`）にある。Claude は読める。
- 中で決めていること（`make_kit.py` の先頭）：
  - 公開の順番のグループ
  - Claude が確かめた記事の番号（`REVIEWED`・`REVIEWED_N30`。ほかは「確認中」で、本文をコピーできない）
  - 無料の記事から有料記事への案内（`note/paid-links.md` の表を読む）

## 検査

```sh
python3 scripts/note-kit/lint_series.py [番号 ...]
python3 scripts/note-kit/lint_next30.py [番号 ...]
```

字数・形（「このまま続くと」「周りを見ると」）・禁止の言い方・やり方やワークの言葉・書き手の体験の書き方・注意の一文・「次に読む」・ハッシュタグ・参考の番号を調べる。見出し画像は `scripts/og/note-cover.mjs`。
