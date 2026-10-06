# 電子書籍『基準を、自分の中に置く』

サイトの哲学カテゴリーの記事17本を、1冊の電子書籍（EPUB）にまとめたもの。文体は常体。サイトのビルドとは関係しない。

## 中身

- `manuscript/`: 原稿。**ここを直す**
  - `00-hajimeni.md`・`99-owarini.md`・`part1.md`〜`part6.md`（各部の扉）は書き下ろし
  - `01`〜`17` はサイトの記事から作り、本向けに手直ししたもの（Web用の要約文・リンク・図のラベルを外し、敬体の3本を常体に直した）
- `metadata.yaml`: 書名・著者などの情報。`epub.css`: 本文のデザイン
- `cover/`: 表紙（1600×2560、KDPの推奨サイズ）
- `dist/kijun.epub`: できあがり。`dist/kijun.md` は校正用に全文を1ファイルにまとめたもの
- `source/`・`scripts/extract.py`・`scripts/draft.py`: 記事から最初の原稿を作ったときの記録。原稿はもう手で直しているので、ふつうは使わない

## 作り直す

```
python3 book/scripts/build.py              # EPUB を作る（pandoc が必要）
cd book/cover && npm install && node make.mjs   # 表紙を作り直す
```

章の並びと部の分け方は `scripts/build.py` の `PARTS` で決めている。
