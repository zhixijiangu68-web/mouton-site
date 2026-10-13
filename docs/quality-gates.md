# ムートン：AI開発の7つの品質ゲート

方針：AIには実装や原因調査を任せられるが、本番公開に影響する最終判断は人間が行う。
公開サイトの見た目・4タブ・トップの演出は変更しない。品質保証は主にGitHub Actionsで行う。

| # | ゲート | 実際の導入物 | 合格条件 |
|---|---|---|---|
| 1 | 要件の明文化 | .github/pull_request_template.md | 目的、変更範囲、観測可能な完了条件が明示される |
| 2 | 自動テスト | npm test、tests/design-version.test.mjs、scripts/check-site.mjs | Node単体テストとEleventyビルド、リンク等の静的検証が成功 |
| 3 | ブラウザ操作テスト | tests/browser-smoke.mjs | Chromiumでトップの4タブ、モバイルメニュー、ディープリンク、記事を操作して成功 |
| 4 | 自動実行環境 | .github/workflows/build-check.yml、browser-smoke.yml | PR作成・更新時にチェックが実行される |
| 5 | セキュリティ | .github/workflows/security-scan.yml、Dependabot | CodeQL、npm audit、PRの依存関係レビュー（重大以上）が成功 |
| 6 | AI修正ループ | .github/workflows/ci-failure-triage.yml、既存ai-shain.yml | 失敗時にIssueで再現と原因を記録し、人間の判断でAI修正を依頼できる |
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
- Require approvals: 1以上。本人1人だけの個人リポジトリの場合、他者による承認が必要でマージできなくなるため共同レビュー担当を設定する。レビュー担当がいない間は「人間による自己レビュー」を運用上必須とする。
- Require status checks to pass: 実際にPRで報告されたジョブ名を選択。Build check / build、Browser smoke / smoke、Security scan / CodeQL、Security scan / npm audit、Security scan / Dependency review を目安にする。
- Require branches to be up to date before merging（可能なら）、Block force pushes / deletions をオン。
- Do not allow bypassing を選び、管理者も直接mainへプッシュできないようにする（プランや所有者権限により制限される場合がある）。
- 設定後、テスト用PRで失敗チェックを発生させてマージをブロックすることを確認する。

注意：GitHubの管理画面によるRuleset作成はこのコード追加だけでは有効にならない。画面のチェック表示も、Rulesetがなければマージ阻止にはならない。

## 運用メモ

- ブラウザテストは現在Chromiumで実行する。Safari/WebKit・実機iPhoneの確認は必要な変更時に追加する。
- PlaywrightはBrowser smoke内でバージョン固定でインストールし、既存のpackage-lock.jsonを書き換えない。Dependabotのnpm更新対象には含まれないので、手動で定期更新する。
- CodeQLは静的解析であり、すべての脆弱性や秘密情報の流出を検出できるわけではない。
- npm auditの脆弱性が見つかった場合は、むやみに --force せず影響と修正を調査する。
- GitHub Actionsが失敗すると、CI failure triageに同じ名前の未解決Issueがあれば追記する。修正後は人間がIssueを閉じる。
