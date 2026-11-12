# CVSS の 10.0 は、悪用されるかどうかを表さない。直す順番は、KEV と「外から届くか」で決める

広告を含みます（リンク先のサイトのページには、広告が出ることがあります）。

脆弱性の情報は、どの弱点か（CVE）、起きたときにどれほど重いか（CVSS）、悪用されそうか（EPSS）、実際に悪用されたか（KEV）の四つに分けて読むと整理できる。直す順番は、CVSS の点数の高さより先に、KEV に載ったかと、その機器がインターネットから届くかで決める。この記事は、サイトに書いた記事の要点を短くまとめたもので、カタログの項目の全部と、自分のパソコンでデータを読む方法は、最後に案内するサイトの記事にある。

## CVE は、一つの弱点に付く番号と、その記録

CVE は、公開された脆弱性に一つずつ付く番号で、番号ごとに「CVE レコード」という記録がある。番号の形は「CVE-年-数字」で、数字は4桁から19桁まで使える[1]。番号を割り当てるのは CNA（CVE Numbering Authority）と呼ばれる組織で、製品を作った会社自身のこともある。Palo Alto Networks のファイアウォールの OS「PAN-OS」の CVE-2024-3400 は、同社が CNA として2024年4月12日に公開した[2]。

記録には、CNA の欄のほかに、ほかの組織が情報を足す ADP の欄がある。CISA の ADP は、SSVC の判断材料と KEV に載った日付を足し、CNA が書いていない CVSS や CWE を補うことがある[3]。

## CVSS のベースの値は、深刻さで、悪用の起こりやすさではない

CVSS は、脆弱性の性質を項目ごとに評価し、0.0〜10.0 の点数と項目の並び（ベクトル）で表す決まりで、FIRST が管理している[4]。CVE-2024-3400 の記録には、v3.1 のベクトル「CVSS:3.1/AV:N/AC:L/PR:N/UI:N/S:C/C:H/I:H/A:H」と、ベースの値 10.0（CRITICAL）が入っている[2]。ネットワークから届き、権限も利用者の操作も要らず、機密性・完全性・可用性への影響がどれも高い、という読み方になる。

ベースの値は、時間や使う環境で変わらない、脆弱性そのものの性質を表す。v3.1 の利用者の手引きは「CVSS が測るのは深刻さで、リスクではない」という節を置いている[5]。2023年11月1日に公開された v4.0 は、項目をベース・脅威・環境・補足の四つのまとまりに分け、悪用の情報がないときは「攻撃されている」と同じに扱って、最悪の場合を前提に点数を出す。製品の会社や NVD が出すのは、ふつうベースだけの点数（CVSS-B）だ[4]。

## EPSS と SSVC は、悪用の見込みと状況を足す

- **EPSS**：FIRST が出している、CVE ごとに「これから30日のうちに悪用の動きが観測される確率」の見積もり。毎日更新される[6]。見積もりなので、値が低いことは、悪用されないことの約束ではない
- **SSVC の判断材料**：CISA が CVE レコードに足す三つの値。悪用の状況（none・poc・active）、偵察から悪用までを自動にできるか（yes・no）、攻撃者が得る支配の大きさ（partial・total）[3]。CVE-2024-3400 には active・yes・total が入っている[2]

## KEV は、実際に悪用が確かめられた脆弱性の一覧

KEV（Known Exploited Vulnerabilities）は、CISA が出している、実際に悪用が確かめられた脆弱性のカタログだ。載せる条件は、CVE の番号があること、悪用されている確かな証拠があること、直し方か避け方がはっきりしていることの三つで、スキャンや研究、PoC の公開だけでは載らない[7]。

KEV は2021年11月3日に、米国の連邦の行政機関に向けた指令 BOD 22-01 とともに始まり、最初の期限は、2021年以降の番号が2週間、それより前の番号が6か月だった[8]。2026年6月からは BOD 26-04「Prioritizing Security Updates Based on Risk」が根拠になり、カタログでは、6月11日から11月10日までに足された162件のうち、126件が3日、36件が14日の期限だった[9][10]。指令が縛るのは米国の連邦の機関だけだ[11]。

2026年11月10日の版は1,779件。ニュースの「KEV に○件追加」は、カタログの dateAdded（足された日）が同じ件数にあたり、11月10日は6件だった[9]。ランサムウェアに使われたと分かっている項目（Known）は361件、すでに入られていないかの確認（forensicTriage）を求める項目は103件ある[9]。

## 日本では、JVN と IPA の緊急対策情報を見る

日本の製品やサイトの脆弱性は、「情報セキュリティ早期警戒パートナーシップ」の流れで扱われる。IPA が届け出を受け付け、JPCERT/CC が製品の会社との調整をし、修正ができると JVN で公表される[12]。

IPA の2026年10月の「Microsoft 製品の脆弱性対策について」は、Windows のシェルの CVE-2026-96951 を、Microsoft が悪用を確認したものとして挙げ、至急の更新を呼びかけている[13]。同じ番号は、米国の10月13日に KEV に足された[9]。Microsoft の月例の更新は、ふつう毎月第2火曜日（米国の日付）に出る[14]。先に見るのは、月例パッチの件数より、その中で悪用が確かめられたものだ。

## 直す順番は、悪用の事実と、外から届くかで決める

- **先に直す**：KEV に載ったもののうち、VPN の入口やファイアウォール、メールの中継の機器のように、インターネットから直接届く機器。2026年に KEV に足された項目にも、SonicWall の SSL VPN、Ivanti Connect Secure、Cisco の Secure Firewall ASA と FTD、PAN-OS、Citrix NetScaler が並ぶ[9]
- **例**：CVE-2024-3400 は、PAN-OS の VPN の機能にあり、認証なしでファイアウォールの上で root の権限のコマンドを動かせる弱点だった。CVE の公開と同じ日に KEV に載り、期限は7日だった[2][9]。修正はすでに出ている
- **管理画面**：CISA の BOD 23-02 は、連邦の機関に、インターネットから届く管理画面を14日のうちに外から外すか、接続を制限するよう求めている[11]
- **KEV にないもの**：CVSS のベースの値に、インターネットから届くか、機器の大切さ、EPSS、SSVC を足して並べる[3][4][6]
- **直したあと**：直す前に入られていないかを、その機器のログでさかのぼって確かめる

どの順番でも、自分が何の製品のどの版を使っているかの一覧がなければ、KEV や告知と照らし合わせられない。

## 全文はサイトに

KEV のカタログの12の項目、BOD 22-01 と BOD 26-04 の期限をデータで数えた結果、自分のパソコンで KEV と CVE レコードを読む方法、出典15件は、サイトの記事にある。

[CVSS の 10.0 は、悪用されるかどうかを表さない。直す順番は、KEV と「外から届くか」で決める（ムートン）](https://moutonarchive.com/kev.html?utm_source=note&utm_medium=referral&utm_campaign=kev)

## 参考文献

1. CVE Program「CVE Record Format」のスキーマ。https://github.com/CVEProject/cve-schema/blob/main/schema/CVE_Record_Format.json
2. CVE-2024-3400 の CVE レコード。https://www.cve.org/CVERecord?id=CVE-2024-3400
3. CISA「CISA Vulnrichment」。https://github.com/cisagov/vulnrichment
4. FIRST（2023）Common Vulnerability Scoring System version 4.0: Specification Document。https://www.first.org/cvss/v4-0/specification-document
5. FIRST「CVSS v3.1 User Guide」。https://www.first.org/cvss/v3-1/user-guide
6. FIRST「Exploit Prediction Scoring System (EPSS)」。https://www.first.org/epss/
7. CISA「Reducing the Significant Risk of Known Exploited Vulnerabilities」。https://www.cisa.gov/known-exploited-vulnerabilities
8. CISA（2021）BOD 22-01: Reducing the Significant Risk of Known Exploited Vulnerabilities。https://www.cisa.gov/news-events/directives/bod-22-01-reducing-significant-risk-known-exploited-vulnerabilities
9. CISA「Known Exploited Vulnerabilities Catalog」（cisagov/kev-data。2026年11月10日の版で数えた）。https://github.com/cisagov/kev-data
10. CISA（2026）BOD 26-04: Prioritizing Security Updates Based on Risk。https://www.cisa.gov/news-events/directives/bod-26-04-prioritizing-security-updates-based-risk
11. CISA「Cyber Hygiene」の報告と通知の原稿（BOD 26-04 と BOD 23-02 の節）。https://github.com/cisagov/cyhy-reports
12. IPA「情報セキュリティ早期警戒パートナーシップガイドライン」の概要。https://www.ipa.go.jp/security/guide/vuln/ug65p90000019by0-att/partnership_guideline_overview_jp.pdf
13. IPA「Microsoft 製品の脆弱性対策について(2026年10月)」。https://www.ipa.go.jp/security/security-alert/2026/1014-ms.html
14. Microsoft Learn「Scalable Windows virtual machine patch management」。https://learn.microsoft.com/azure/architecture/virtual-machines/patch-management
