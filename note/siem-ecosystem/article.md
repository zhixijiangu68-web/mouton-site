# SIEM と XDR は、置き換わる関係ではない。まわりの道具と、ラボでの学び方

広告を含みます（リンク先のサイトのページには、広告が出ることがあります）。

SIEM が XDR に置き換わったことを示す公的な調査は、探した範囲では見つからなかった。公的な手引きと製品の説明では、似た名前の道具は、ログを渡し合い、機能が重なる関係として書かれている。この記事は、似た名前の道具との違い、入れたあとの難しさ、MITRE ATT&CK の使い方、自分のラボで SIEM に触れる方法を、サイトに書いた記事から短くまとめたものだ。

## 似た名前の道具の違い

- **ログ管理**：あらゆるログを集めて保存し、検索できるようにする。
- **SIEM**：多くの機器のセキュリティにかかわるログを、形をそろえてつなげて分析し、アラートを出し、保存する。
- **SOAR**：SIEM のアラートやログをもとに、プレイブックに沿って対応を自動にする（端末の切り離しなど）。
- **EDR**：パソコンやサーバーの中の動きを見て、怪しい動きを見つけ、その端末で対応する。
- **XDR**：端末に加えて、ネットワーク・メール・クラウドなどの検知と対応を一つにまとめる。どこまでを含むかは製品ごとに違う。

この分け方は僕の整理だ。EDR は SIEM にログを渡す側にあり、共同の手引きは SIEM に入れるログの優先の最初に EDR のログを置いている[1]。製品の側でも境目は重なっていて、Wazuh は自分を XDR と SIEM の機能を一つにした基盤だと説明し[2]、Microsoft Sentinel はクラウドで動く SIEM で、SOAR の機能も持つと説明している[3]。

## 入れたあとに難しいのは、お金とデータと人

経営層向けの手引きは、SIEM と SOAR の費用として、製品の料金のほかに、専門の技能を持つ人を雇ってとどめる費用、育てる費用、外に任せるならその委託料を挙げている。料金は取り込む量で決まる仕組みが多く、取り込みを管理しないと払いすぎる危険がある、とも書いている[4]。

ログの取り込みは、一度つないだら終わりではない。機器の更新でログの形が変わる、エージェントが止まる、送り先の設定が消える。そうなっても、SIEM の画面には何も起きていないように見える。アラートがないことと、何も起きていないことは違う。共同の手引きが、取り込みが正しく続いているかを定期的に確かめるよう勧めているのは、このためだ[1]。

ルールの調整には、その組織のふだんの姿を知っている人が要る。誰が夜中にサーバーへ入るのかは、製品の標準のルールには書かれていない。

## MITRE ATT&CK は、ルールの抜けを探す地図

ATT&CK は、実際に観測された攻撃者の戦術と技術をまとめた知識のベースだ[5]。SIEM では二つの使い方がある。

一つは、ルールに番号を付けること。Wazuh のルール 40112（失敗が続いたあとの成功）には、T1078 と T1110 が付いている[6]。アラートが出たとき、それが攻撃のどの段階にあたるかが番号から分かる。

もう一つは、抜けを探すこと。自分のルールを ATT&CK の表に重ね、どの技術に検知があって、どこが空いているかを見る。ただ、表が埋まっていることと、検知できることは同じではない。ルールがあっても、必要なログが入っていなければ鳴らない。しきい値が環境に合っていなければ、鳴りすぎて読まれない。

## 自分のラボで SIEM に触れる

SIEM は、無料の版と公開のデータを使えば、自分のパソコンの中の仮想マシンや、自分で契約したクラウドの中で学べる。試すのは自分が持っている環境の中だけにする。他人のシステムやサービスに、許可なくログインを試したり、攻撃をまねた通信を送ったりすることは、日本では不正アクセス禁止法などに触れるおそれがある[7]。

- **Wazuh**：無料のオープンソース。手引きの「概念実証（proof of concept）」のガイドは、仮想マシンでラボを組み、スナップショットを取って、試すたびにきれいな状態に戻すことを勧めている。自分で用意した端末どうしで認証の失敗を起こし、Wazuh がアラートにするところを見る例もある[8]。
- **Elastic Security**：Elasticsearch と Kibana があれば使える[9]。検知ルールはリポジトリで公開されていて、どんな条件で鳴るのかを一行ずつ読める[10]。どの機能が無料かは版で変わるので、使う前に公式の表で確かめる。
- **Splunk**：無料の「Splunk Free」は、1日に取り込めるのが500MBまでで、作ったアラートは動かない[11]。練習用のデータセット「Boss of the SOC（BOTS）」の第3版を使えば、攻撃の通信を自分で起こさずに、すでに記録されたログで調べる練習ができる[12]。
- **LogonTracer**：JPCERT/CC の道具で、Windows のイベントログからログオンに関わるイベントを読み、アカウントと端末の関係をグラフにする。SIEM そのものではないが、4624 や 4625 がつなげるとどう見えるかを学ぶのに向いている[13]。

## 全文はサイトに

主な製品（Splunk・Microsoft Sentinel・Elastic・QRadar・Wazuh）の比較、ATT&CK の数え方、公的な資料を読む順の表、出典25件は、サイトの記事にある。

[SIEM と XDR は、置き換わる関係ではない。まわりの道具と、ラボでの学び方（ムートン）](https://moutonarchive.com/siem-ecosystem.html?utm_source=note&utm_medium=referral&utm_campaign=siem-ecosystem)

SIEM の仕組みは[1本目](https://moutonarchive.com/siem.html?utm_source=note&utm_medium=referral&utm_campaign=siem-ecosystem)、検知のルールと SOC の仕事は[2本目](https://moutonarchive.com/siem-detection.html?utm_source=note&utm_medium=referral&utm_campaign=siem-ecosystem)に書いた。

## 参考文献

1. ASD's ACSC・CISA ほか（2025）Priority logs for SIEM ingestion: Practitioner guidance。https://www.cyber.gov.au/business-government/detecting-responding-to-threats/event-logging/implementing-siem-soar-platforms/priority-logs-for-siem-ingestion-practitioner-guidance
2. Wazuh ドキュメント「Getting started with Wazuh」。https://github.com/wazuh/wazuh-documentation/blob/main/source/getting-started/index.rst
3. Microsoft Learn「What is Microsoft Sentinel?」。https://learn.microsoft.com/azure/sentinel/overview
4. ASD's ACSC・CISA ほか（2025）Implementing SIEM and SOAR platforms: Executive guidance。https://www.cyber.gov.au/business-government/detecting-responding-to-threats/event-logging/implementing-siem-soar-platforms/implementing-siem-and-soar-platforms-executive-guidance
5. MITRE ATT&CK（Enterprise、v20、2026年10月）。https://attack.mitre.org/
6. Wazuh 4.14.0 のルールのファイル（0280-attack_rules.xml のルール 40112）。https://github.com/wazuh/wazuh/blob/v4.14.0/ruleset/rules/0280-attack_rules.xml
7. 不正アクセス行為の禁止等に関する法律（平成11年法律第128号）。https://laws.e-gov.go.jp/law/411AC0000000128
8. Wazuh ドキュメント「Proof of concept guide」と「Detecting a brute-force attack」。https://github.com/wazuh/wazuh-documentation/blob/main/source/proof-of-concept-guide/index.rst ／ https://github.com/wazuh/wazuh-documentation/blob/main/source/proof-of-concept-guide/detect-brute-force-attack.rst
9. Elastic ドキュメント「Elastic Security requirements」。https://github.com/elastic/docs-content/blob/main/solutions/security/get-started/elastic-security-requirements.md
10. Elastic「Detection Rules」（README）。https://github.com/elastic/detection-rules
11. Splunk ドキュメント「About Splunk Free」（Splunk Enterprise 10.0）。https://help.splunk.com/en/splunk-enterprise/administer/admin-manual/10.0/configure-splunk-licenses/about-splunk-free
12. Splunk「Boss of the SOC (BOTS) Dataset Version 3」（README）。https://github.com/splunk/botsv3
13. JPCERT/CC「LogonTracer」（README）。https://github.com/JPCERTCC/LogonTracer
