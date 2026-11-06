# SIEM は攻撃を止めない。ログをつなげて、人に知らせる仕組みだ

広告を含みます（リンク先のサイトのページには、広告が出ることがあります）。

SIEM（Security Information and Event Management）は、あちこちの機器に散らばったログを1か所に集め、形をそろえ、つなげて読み、怪しい動きを人に知らせる仕組みだ。攻撃を止める役目は、定義に入っていない。この記事は、サイトに書いた記事の要点を短くまとめたもので、出典の全部とログの種類ごとの表は、最後に案内するサイトの記事にある。

## 公的な定義は、集めることと知らせること

NIST の用語集は、SIEM のツールを「情報システムの構成要素からセキュリティのデータを集め、それを一つの画面で、行動につなげられる情報として示す機能を持つアプリケーション」と定義している[1]。

2025年5月にオーストラリアの ACSC が CISA などと出した実務者向けの手引きも、SIEM を、ネットワーク全体からログを集めて1か所にまとめ、セキュリティのために分析するものとしている。よく設定された SIEM は、ふだんの動きの基準（ベースライン）とルールを当てはめてログをつなげ、異常な動きに印を付ける[2]。

止める動きを受け持つのは、たとえば SOAR だ。同じ手引きは SOAR を、あらかじめ決めた「プレイブック」（対応の手順書）で対応を自動にする仕組みと説明し、影響を受けた端末をネットワークから切り離す例を挙げている[2]。SIEM の画面から遮断まで動かせる製品もあるが、それは製品が足した機能で、定義の外にある。

経営層向けの手引きは、SIEM も SOAR も「入れたら終わり（set and forget）」の道具ではなく、技能を持つ人が要る、終わりのない作業だと書いている[3]。

## SIEM の中で起きる五つの処理

- **集める**：ファイアウォールのログ、パソコンのログオンの記録、クラウドの操作の記録は、それぞれ別の場所にある。攻撃は段階を踏んで進み、段階ごとに痕跡の残る場所が違うので、1か所に集める。集め方には、機器に入れたエージェントに送らせる方法と、機器が送り出す syslog を受け取る方法がある[4]。
- **そろえる**：同じ出来事でも、機器ごとに項目の名前と並びが違う。SIEM は、送り元の IP アドレス・ユーザー名・結果といった共通の項目に当てはめ直す（正規化）。Elastic の共通の決まり ECS では、ユーザー名は user.name、結果は event.outcome に入る[5]。片方が「user」、もう片方が「account_name」のままなら、ルールは二つを同じ人だと分からない。
- **つなげる**：ログイン失敗の1件は、打ち間違いかもしれない。同じ送り元から数分のうちに何十件も失敗が続き、直後に成功があれば、推測が当たった可能性が出てくる。これが相関分析だ。
- **知らせる**：ルールの条件に合うと、重さの付いたアラートが担当者の画面に並ぶ。
- **残す**：侵入に気づくのは、しばらくたってからのこともある。さかのぼれる範囲は、どれだけの期間、どの形で残しているかで決まる。

## どのログから入れるか

2025年5月の共同の手引き「Priority logs for SIEM ingestion」は、SIEM に入れるログの源を、おおよそ優先の高い順に並べている。最初が EDR（端末での検知と対応の道具）のログで、ネットワーク機器、Microsoft のドメインコントローラー、Active Directory などのディレクトリー、Windows の端末のログと続く[6]。新しく入れるときは優先の高いものから入れ、取り込みが正しく続いているかを定期的に確かめるよう勧めている[6]。

Windows の認証のログでは、イベント ID が手がかりになる。JPCERT/CC の LogonTracer の説明では、ログオンの成功が 4624、失敗が 4625、ユーザーのアカウントの作成が 4720 だ[7]。SIEM のルールの多くは、こうした番号の組み合わせで書かれている。

## 多く集めればよいわけではない

同じ手引きは、ファイアウォールや DNS のログは量がとても多く、その量が中身の大切さを覆い隠すことがある、と書いている[6]。料金は取り込む量で決まる仕組みが多く、全部入れれば費用も雑音も増える[3]。

2024年8月の「Best practices for event logging and threat detection」は、組織として承認したログの方針を持つことを、四つの柱の最初に置いている[8]。何を、なぜ集めるかを先に決める順番だ。

SIEM が画面に出すのは、集めたログの中からルールが拾ったものだけだ。入っていないログの中で起きたことは、画面には出てこない。

## 全文はサイトに

ログの種類ごとに分かることの表、SIEM という名前の成り立ち、出典17件は、サイトの記事にある。

[SIEM は攻撃を止めない。ログをつなげて、人に知らせる仕組みだ（ムートン）](https://moutonarchive.com/siem.html?utm_source=note&utm_medium=referral&utm_campaign=siem)

検知のルールと SOC の仕事は[2本目](https://moutonarchive.com/siem-detection.html?utm_source=note&utm_medium=referral&utm_campaign=siem)、まわりの道具と自分のラボでの学び方は[3本目](https://moutonarchive.com/siem-ecosystem.html?utm_source=note&utm_medium=referral&utm_campaign=siem)に書いた。

## 参考文献

1. NIST CSRC 用語集「Security Information and Event Management (SIEM) Tool」（出どころは NIST SP 800-128）。https://csrc.nist.gov/glossary/term/security_information_and_event_management_tool
2. ASD's ACSC・CISA ほか（2025）Implementing SIEM and SOAR platforms: Practitioner guidance。https://www.cyber.gov.au/business-government/detecting-responding-to-threats/event-logging/implementing-siem-soar-platforms/implementing-siem-and-soar-platforms-practitioner-guidance
3. ASD's ACSC・CISA ほか（2025）Implementing SIEM and SOAR platforms: Executive guidance。https://www.cyber.gov.au/business-government/detecting-responding-to-threats/event-logging/implementing-siem-soar-platforms/implementing-siem-and-soar-platforms-executive-guidance
4. Wazuh ドキュメント「Components」。https://github.com/wazuh/wazuh-documentation/blob/main/source/getting-started/components/index.rst
5. Elastic「Elastic Common Schema (ECS)」の項目の定義（event.outcome、user.name）。https://github.com/elastic/ecs/blob/main/schemas/event.yml ／ https://github.com/elastic/ecs/blob/main/generated/csv/fields.csv
6. ASD's ACSC・CISA ほか（2025）Priority logs for SIEM ingestion: Practitioner guidance。https://www.cyber.gov.au/business-government/detecting-responding-to-threats/event-logging/implementing-siem-soar-platforms/priority-logs-for-siem-ingestion-practitioner-guidance
7. JPCERT/CC「LogonTracer」（README）。https://github.com/JPCERTCC/LogonTracer
8. ASD's ACSC・CISA・FBI・NSA ほか（2024）Best practices for event logging and threat detection。https://www.cisa.gov/resources-tools/resources/best-practices-event-logging-and-threat-detection
