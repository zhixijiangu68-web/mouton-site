# note事業部

ムートンの note を、5 人の AI 社員（Claude Code のサブエージェント）で回すための部署。

> **2026-10-18 更新**：note の役割は、サイトの外から入口（無料の入門記事・3つの姿勢・ムートンについて）へ人を連れてくること。テーマは有料の3本の悩み（決められない／人の目／続かない）か、3つの姿勢から。記事は「今日のワーク」で終わらせず、最後に問いを一つ（2026-10-17、オーナー「安易に与えない」）。文章の物差しは `docs/content-quality.md`。サイトへのリンクは `?utm_source=note&utm_medium=referral&utm_campaign=<slug>`。前に作った `job-change`・`before-you-buy` はアーカイブの記事につながるので、いまは出さない。週の回し方は `docs/operations-20261018.md`

> **2026-10-31 更新（いまの作り方）**：note は、サイトの記事（決定版）への入口。1本ずつ、サイトの記事から作る。全部は書かず、答えの核心はサイトに残す（引きは使ってよい。禁止は引いた答えがサイトにないことだけ）。題は4つの型×3人の審査で決め、最後に4つの目で点検し、見出し画像（1280×670）も作る。手順の全文は `.claude/skills/note/SKILL.md`。上の 10-18 の「テーマは有料の3本の悩み…」は、サイトの作り直し（10-21）より前の決まり

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

Claude Code でこのリポジトリを開いて、サイトの記事の slug を渡す：

```
/note patience
```

slug を渡さなければ、まだ note がない今の記事（`src/_data/currentArticles.js`）から部長が選ぶ。毎日 4:11 の定期実行も同じ手順で動き、未公開の在庫が3本以上なら作らない。

1 人だけ動かすこともできる（例：「note-titler で note/patience/ の題を考え直して」）。

## 流れ

```
在庫を数える → テーマ（サイトの記事）→ 分け方（note に書く話／サイトに残す答え）
→ リサーチ → 本文 → 題（4つの型 × 3人の審査）→ 品質チェック → 告知
→ 点検（事実・コピー・サイトへ行く理由・告知。blocking 0 まで、最大3回）
→ 見出し画像（3〜4案 × 3人の審査）→ 部長が自分で確かめる → PR・Issue #231
```

道具：見出し画像は `.claude/skills/note/thumb/`（`node render.mjs <spec.json> <名前>`、これまでの形は `thumb/examples/`）、本文の字数は `python3 .claude/skills/note/count.py note/<slug>/article.md`。

## 公開するとき（人がやること）

1. `04-review.md` の「人が確認すべきこと」を見る
2. `article.md` を note のエディタに貼る（`##` は大見出し、`###` は小見出しになる）
3. 見出し画像（`header.jpg`）・ハッシュタグ・記事の説明を `03-titles.md` から設定して公開
4. 公開した URL を `05-sns.md` の `{URL}` に入れて投稿する
5. 「出した」と伝える（Issue #231 に公開の記録を残し、在庫を数え直す）

AI は note や SNS に投稿しない。公開の判断はムートン本人がする。
