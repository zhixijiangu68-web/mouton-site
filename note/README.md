# note事業部

ムートンの note を、5 人の AI 社員（Claude Code のサブエージェント）で回すための部署。

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

## サイトの哲学記事を note に載せる分（2026-10-17）

`/note` で新しく書く記事とは別に、サイトの記事を**本文そのまま** note に載せる形にしたものがある。アカウントの設定（名前・ID・自己紹介・ヘッダー・アイコン）と公開の順番は `profile/profile.md`。

| 場所 | 中身 |
|---|---|
| `profile/` | ヘッダー画像（`header.jpg`）・アイコン（`icon.png`）・名前・自己紹介 |
| `start/` | 「はじめての方へ」（ブランドの考え方と、3人の哲学者への入口） |
| `free-kierkegaard/`・`free-nietzsche/`・`free-spinoza/` | 無料の入門記事（`article.md`・`03-titles.md`） |
| `paid-kierkegaard/`・`paid-nietzsche/`・`paid-spinoza/` | 有料記事の出品シート（`listing.md`）と、無料の冒頭（`free-part.md`）。**有料の続きの全文は公開リポジトリに入れない**（オーナーの手元の原稿を貼る） |
| `free-habit/` | 無料の記事「意志力に頼らない習慣設計」（オーナーの原稿、PDF 24ページ）。`review.md` に、原稿から変えたところとまだ確かめていないこと。全文は公開リポジトリに入れてよい（無料のため） |

- 本文はサイトの記事から写した。サイトの記事を直したら、note の版を直すかどうかを決める（直さないと古くなる）。
- 末尾の `{PAID_URL}` ・ `{URL_FREE_*}` ・ `{URL_PAID_*}` は、公開した note の URL に置き換えてから貼る。
- note で売るかどうか（A／B／C）の整理は `docs/note-monetization-20261017.md`。

## 公開するとき（人がやること）

1. `04-review.md` の「人が確認すべきこと」を見る
2. `article.md` を note のエディタに貼る（`##` は大見出し、`###` は小見出しになる）
3. 見出し画像・ハッシュタグ・記事の説明を `03-titles.md` から設定して公開
4. 公開した URL を `05-sns.md` の `{URL}` に入れて投稿する

AI は note や SNS に投稿しない。公開の判断はムートン本人がする。
