# ムートン：AI開発の7つの品質ゲート

方針：AIには実装や原因調査を任せられるが、本番公開に影響する最終判断は人間が行う。
公開サイトの見た目は、言葉（コピー）を先に決めてから整える（2026-10-18「コピーライティング第一」。言葉を隠していたトップのオープニングの演出は同日に外した。4タブは2026-10-14に廃止）。新しい演出は足さない。品質保証は主にGitHub Actionsで行う。

| # | ゲート | 実際の導入物 | 合格条件 |
|---|---|---|---|
| 1 | 要件の明文化 | .github/pull_request_template.md | 目的、変更範囲、観測可能な完了条件が明示される |
| 2 | 自動テスト | npm test、tests/design-version.test.mjs、scripts/check-site.mjs | Node単体テストとEleventyビルド、リンク等の静的検証が成功 |
| 3 | ブラウザ操作テスト | tests/browser-smoke.mjs | Chromiumでトップの3テーマ、記事一覧（journal.html）、モバイルメニュー、ディープリンク、記事を操作して成功 |
| 4 | 自動実行環境 | .github/workflows/build-check.yml、browser-smoke.yml | PR作成・更新時にチェックが実行される |
| 5 | セキュリティ | .github/workflows/security-scan.yml、Dependabot | CodeQL、npm audit（読者に届く依存関係＝`--omit=dev` で High 以上 0 件）、PRの依存関係レビュー（重大以上）が成功。ビルド用ツールの audit は報告のみ |
| 6 | AI修正ループ | .github/workflows/ci-failure-triage.yml、既存ai-shain.yml、.github/ai-shain.md（AI社員の業務マニュアル、2026-10-17） | 失敗時にIssueで再現と原因を記録し、人間の判断でAI修正を依頼できる。AI社員は担当→チェック担当の2段階で下書きPRを出す |
| 7 | マージ制御 | GitHubのmain Ruleset（管理画面で要設定） | PR・必須チェック・人間のレビューを通過しない変更はmainへ入らない |

## 日常の開発フロー

1. Issueに問題、期待結果、対象ページ、再現手順を記録する。
2. mainから変更用ブランチを作り、PRテンプレートに受け入れ条件を記載する。
3. npm ci → npm test をローカルで実行する。静的サイトの生成結果もコミットする。
4. PRの差分を人間が確認する。Build check、Browser smoke、Security scanを確認する。
5. 失敗時は Actions のログを読み、Browser smokeなら保存された test-results の画像を確認する。
6. CI failure triageが作成したIssueに原因と修正案を残す。必要なら権限のあるメンバーが @ai-shain とコメントして既存のAI社員を呼ぶ。
7. AIからの修正PRでも差分レビューと再テストを行い、承認後にマージする。

※ workflow_runで起動する失敗通知は「Issue作成」まで。自動的にAIの秘密鍵を扱わせたり、CI失敗コードを特権で実行したりしない。

## GitHubで必要な一度きりの管理設定（未自動化）

Repository → Settings → Rules → Rulesets（または Branch protection rules）でmain向けのルールを作る。

- 対象: main。Require a pull request before merging をオン。
- Require approvals: **1人で運営している間はオフ**（PRを作った本人は自分のPRを承認できないため、オンにするとオーナーもAIもマージできなくなる）。差分の確認はPR上で人間が行う運用にする。共同レビュー担当ができたら1以上にする。
- Require status checks to pass: 実際にPRで報告されたジョブ名を選択。Build check / build、Browser smoke / smoke、Security scan / CodeQL、Security scan / npm audit、Security scan / Dependency review を目安にする。
- Require branches to be up to date before merging（可能なら）、Block force pushes / deletions をオン。
- 承認をオフにしている間は、管理者の直接プッシュだけを禁止すれば足りる。承認をオンにする場合は、オーナーを Bypass list に入れておく（入れないと誰もマージできなくなる）。
- 設定後、テスト用PRで失敗チェックを発生させてマージをブロックすることを確認する。

注意：GitHubの管理画面によるRuleset作成はこのコード追加だけでは有効にならない。画面のチェック表示も、Rulesetがなければマージ阻止にはならない。

## 運用メモ

- ブラウザテストは現在Chromiumで実行する。Safari/WebKit・実機iPhoneの確認は必要な変更時に追加する。
- PlaywrightはBrowser smoke内でバージョン固定でインストールし、既存のpackage-lock.jsonを書き換えない。Dependabotのnpm更新対象には含まれないので、手動で定期更新する。
- CodeQLは静的解析であり、すべての脆弱性や秘密情報の流出を検出できるわけではない。
- npm auditの脆弱性が見つかった場合は、むやみに --force せず影響と修正を調査する。
- GitHub Actionsが失敗すると、CI failure triageに同じ名前の未解決Issueがあれば追記する。修正後は人間がIssueを閉じる。


## 2026-10-13 導入時に判明したブロッカー

初回CIでBuild checkとBrowser smokeは成功。Security scanは既存の依存関係とリポジトリ設定が原因で失敗した。
- npm auditで9件（High 5件、Moderate 4件）。詳細は Issue #106。Eleventyの破壊的ダウングレードを提案する npm audit fix --force は実施しない。
  - 9件はすべてビルド用ツール（@11ty/eleventy が使う braces・sprintf-js など）の中にあり、読者に配るHTMLには含まれない（`npm audit --omit=dev` は0件）。どちらも「細工した入力をビルドに渡すと止まる」種類で、原因の braces 3.0.3・sprintf-js 1.1.3 は最新版のため更新では解消できない。
  - 対応（2026-10-13）：マージを止める判定は `npm audit --omit=dev --audit-level=high` にし、全体の audit は報告のみ（continue-on-error）にした。直った版が出たら全体の audit も止める判定に戻す。
- Dependency reviewはDependency graphが未有効化のため実行不可。Settings → Security → Advanced Security から有効化して再実行する。
- CIが赤い間は、失敗を無視してmainへマージしない。
