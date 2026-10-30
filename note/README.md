# note事業部

ムートンの note を、5 人の AI 社員（Claude Code のサブエージェント）で回すための部署。

> **2026-10-18 更新**：note の役割は、サイトの外から入口（無料の入門記事・3つの姿勢・ムートンについて）へ人を連れてくること。テーマは有料の3本の悩み（決められない／人の目／続かない）か、3つの姿勢から。記事は「今日のワーク」で終わらせず、最後に問いを一つ（2026-10-17、オーナー「安易に与えない」）。文章の物差しは `docs/content-quality.md`。サイトへのリンクは `?utm_source=note&utm_medium=referral&utm_campaign=<slug>`。前に作った `job-change`・`before-you-buy` はアーカイブの記事につながるので、いまは出さない。週の回し方は `docs/operations-20261018.md`

## 社員

| 担当 | エージェント | やること | 成果物 |
|---|---|---|---|
| リサーチ | `note-researcher` | 研究・公的機関などの情報を調べ、材料と参考文献をまとめる | `01-research.md` |
| 記事作成 | `note-writer` | ムートンの文体で本文を書く | `02-draft.md` |
| タイトル | `note-titler` | タイトル案・見出し画像の文言・ハッシュタグ | `03-titles.md` |
| 品質チェック | `note-editor` | 事実・出典・文体・ルールを確認し、完成稿を作る | `04-review.md`, `article.md` |
| SNS集客 | `note-sns` | X・Threads・Instagram の告知文と投稿計画 | `05-sns.md` |

定義は `.claude/agents/note-*.md`、全体の進め方は `.claude/skills/note/SKILL.md`。

## 使い方

Claude Code でこのリポジトリを開いて：

```
/note 朝の散歩が気分を変える理由
```

文体や読者を指定したいとき：

```
/note 転職の面接で緊張しない方法（です・ます調、20代の初めての転職）
```

1 人だけ動かすこともできる（例：「note-titler で note/morning-walk/ のタイトルを考え直して」）。

## 流れ

```
テーマ → リサーチ → 記事作成 → タイトル → 品質チェック → SNS集客
                        ↑            │
                        └─ 差し戻し ─┘（最大2回）
```

## 公開するとき（人がやること）

1. `04-review.md` の「人が確認すべきこと」を見る
2. `article.md` を note のエディタに貼る（`##` は大見出し、`###` は小見出しになる）
3. 見出し画像・ハッシュタグ・記事の説明を `03-titles.md` から設定して公開
4. 公開した URL を `05-sns.md` の `{URL}` に入れて投稿する

AI は note や SNS に投稿しない。公開の判断はムートン本人がする。

## 有料記事（note-paid）

> **2026-10-30 追加**：オーナー「noteの有料記事で利益を出したい」「〇の記事を作ってと指示したら作動するように」。note の有料記事は、上の無料の note とは別のスキル `.claude/skills/note-paid/` で作る

Claude Code でこのリポジトリを開いて：

```
エピクテトスの記事を作って
```

「〇〇の有料記事を作って」「note の有料記事を作って」「/note-paid 〇〇」でも動く。無料の note は上の `/note`、サイトの記事は「サイトに載せて」「掲載して」「サイトの〇〇の記事を作って」。

- 作るもの：無料部分・有料ライン・有料部分の本文、題・記事の説明・ハッシュタグ、見出し画像（1280×670）、X の告知文の下書き、価格の案（3つ並べて1つを推す）
- 型と根拠：`structure.md`（構成）・`style.md`（文体）・`funnel.md`（有料記事への導線と価格）・`titles.md`（題）・`hashtags.md`・`thumbnail.md`（見出し画像）・`checklist.md`（公開前の点検）。根拠は `analysis.md`（note で稼いでいる哲学の記事と、ネットの哲学の有料記事の調査。2026-10-30）。売れた数は1件も見えておらず、note の仕様・手数料もどれも未確認なので、型は「売れる型」ではない
- 置き場所：公開してよいもの（`00-brief.md`・`03-titles.md`・`thumb.json`・`thumbnail.png`・`05-sns.md`・`results.md`）は `note/<slug>/`。有料部分を含むもの（完成稿 `paid/article.md`・品質チェック `paid/04-review.md` など）は `note/<slug>/paid/` にだけ置き、コミットしない（このリポジトリは公開。`paid/` は `.gitignore` で外してある）
- 見出し画像：`node scripts/note-thumb/make.mjs note/<slug>/thumb.json --preview`（初回だけ `(cd scripts/note-thumb && npm ci)`。サイトのビルドには関係しない）
- 止まるところ：有料部分の中心の引用を原典で照らせないとき（判定「照合待ち」）と、有料部分にムートン本人の言葉が入るまで（「本人の言葉待ち」）は、公開しない
- 公開するとき（人がやること）：`paid/04-review.md` の「公開の設定」と「公開の前」（題・画像・有料エリア・価格・返金、特定商取引法の表記）。値段・公開・投稿はオーナーが決める
- 試運転：`note/epictetus-practice/`（照合待ち・本人の言葉待ち。公開していない）
