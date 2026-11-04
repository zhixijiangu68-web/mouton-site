# IDS（侵入検知システム）：手元に置く資料（2026-11-04 時点）

記事：https://moutonarchive.com/ids.html

この資料の版・料金・日付は、2026年11月4日に公式の資料を検索で確かめたもの。原典のページを開いて確かめ直している途中で、変わりやすい。使う前に、出典の公式ページを見る。特定の製品を勧めるものではない。

## 要点（5つ）

1. IDS は見つけて知らせる仕組み、IPS は通り道に入って止める仕組み。違いは製品の名前より置き方で決まる（通信のコピーを見るなら知らせるだけ）[2][3]
2. 侵入に自分で最初に気づけた組織は52%、気づくまでの中央値は14日（M-Trends 2026。2025年の事案）[1]
3. 無料の中心は Suricata・Snort 3・Zeek。Snort 2 は2026年10月21日、Security Onion 2.4 は2026年10月1日にサポートが終わった [6][31]
4. 暗号化された通信は、復号する／復号せず特徴で見る／見えない、の3通り。どれを取るかで製品が分かれる [4][36][42]
5. 第三者の試験は版に結びつき、Gartner の Leader は検知性能の試験ではない。選ぶ前に「どこを見るか」「誰が警告を読むか」を決める [7][8][9]

## 比較表

### 無料で使える主な IDS

| 名前 | 見る場所と方式 | 止めるか | ライセンス | 向いている使い方 |
|---|---|---|---|---|
| Suricata 8 | ネットワーク。シグネチャとプロトコル解析 | IPS モード（NFQUEUE・AF_PACKET）で止められる | GPL v2 | 検知も遮断も一つで。EVE JSON で SIEM に流す |
| Snort 3 | ネットワーク。シグネチャが中心 | IPS として使える | GPL v2 | Talos のルールに合わせたい。Snort 2 からの移行 |
| Zeek 9 | ネットワーク。プロトコル解析とスクリプト | 記録と分析が中心（止める機能は確かめていない） | BSD | 何が起きたかを細かく残して、あとから調べる |
| Security Onion 3 | Suricata・Zeek・Elastic をまとめた配布 | 確かめていない（中の Suricata の設定による） | 本体は Elastic License 2.0（要確認） | 学ぶ。小さな組織で一式をそろえる（Oracle Linux 9） |
| Wazuh 4.14 | 機械の中。ログ分析と改ざんの検知 | その機械で対処（active response） | GPL v2 | サーバーや PC の中の変化を見る |
| OSSEC | 機械の中。ログ分析と改ざんの検知 | その機械で対処（active response） | GPL v2 | 小さく、軽く、ホスト型を始める |

### ルール

| ルール | 出しているところ | 費用 | 注意 |
|---|---|---|---|
| Snort Community | Cisco Talos | 無料・登録不要 | |
| Snort Registered | Cisco Talos | 無料・登録が要る | 新しいルールは Subscriber の30日後（2014年の説明。いまも同じかは確かめていない） |
| Snort Subscriber | Cisco Talos | 有料 | |
| ET Open | Proofpoint | 無料 | Suricata・Snort 向け |
| ET Pro | Proofpoint | 有料 | ET Open を丸ごと含むので、同時に入れない |

### 商用（性能の数字はすべてメーカーの発表）

| 種類 | 例 | 暗号化された通信 |
|---|---|---|
| 次世代ファイアウォールの IPS | Cisco Secure Firewall（Snort 3）、Palo Alto Networks Advanced Threat Prevention、Fortinet FortiGate、Check Point | 復号して見る（FortiGate のディープインスペクション、Check Point の HTTPS Inspection）、または復号せずに特徴で見る（Cisco の Encrypted Visibility Engine） |
| 専用の IPS | Trend Micro TippingPoint（Digital Vaccine の仮想パッチ） | 未確認 |
| NDR | Darktrace、Vectra AI、ExtraHop RevealX、Corelight（Zeek と Suricata が土台） | ExtraHop は TLS 1.3 を含めて復号できる（メーカーの説明）。ほかは主に特徴やメタデータで見る |

### クラウド（料金は地域で違う。AWS は米国東部の例、Google Cloud は地域を確かめていない）

| サービス | 止めるか | 検知のもと | 暗号化 | 料金 |
|---|---|---|---|---|
| AWS Network Firewall | 止められる | Suricata 互換のルール、AWS 管理のルール | TLS インスペクションで復号できる | 米国東部で1時間0.395ドル＋1GBあたり0.065ドル。TLS インスペクションを使うと時間料金が加わる |
| Google Cloud IDS | 止めない（検知と警告） | Palo Alto Networks の脅威のシグネチャ | 復号しない | 1時間1.50ドル＋1GBあたり0.07ドル |
| Azure Firewall Premium | 止められる（シグネチャごとに無効・警告・警告して拒否） | Microsoft 管理のシグネチャ | TLS インスペクションで復号できる | 公式のページから取れなかった |

## 選ぶときのチェックリスト

- [ ] 見たい場所を決めた（境目を通る通信／内側どうしの通信／機械の中）
- [ ] 止めたいのか、知らせてほしいのかを決めた（止めるなら、誤って止めたときの影響も考えた）
- [ ] 通信の取り出し方を決めた（タップかミラーポートか。NAT の内側で取るか）
- [ ] 暗号化された通信の扱いを決めた（復号する／特徴で見る／端末の記録で埋める）
- [ ] 流す量と、機能を全部有効にしたときの処理能力を確かめた（カタログの最大値ではなく）
- [ ] ルールと脅威の情報が、どこから、どれくらいの遅れで届くかを確かめた
- [ ] 警告を集める先を決めた（SIEM に流せる形か）
- [ ] 警告を誰が、いつ読むかを決めた
- [ ] 使う版がサポート中か確かめた（Snort 2・Security Onion 2.4 は終了）
- [ ] 第三者の試験の結果を、版と試験の年つきで読んだ
- [ ] 費用を、代金だけでなく、更新・調整・警告を読む人の時間で見積もった
- [ ] 管理者として許可を得た範囲で、自分の環境の通信（保存した PCAP）で候補を試した

## 運用するときのチェックリスト

- [ ] 取りこぼし（Zeek の capture loss など）を定期的に見ている
- [ ] 取りこぼしがあるとき、手前のタップやミラーポートで落ちていないか確かめた
- [ ] いきなり止めず、試験運用で誤検知を見てから本番に移した
- [ ] 誤検知のルールの調整を、決まった間隔で続けている
- [ ] エンジンとルールの更新を当てている（守る道具そのものにも脆弱性が出る）
- [ ] 警告を読む人と時間が、実際に回っている
- [ ] 暗号化で見えない部分を、端末の記録で埋めている

## 用語

- IDS：侵入検知システム。通信やログを見て、攻撃らしいものを知らせる
- IPS：侵入防止システム。通信の通り道に入って、攻撃らしいものを止める
- IDPS：IDS と IPS をまとめた呼び方（NIST SP 800-94）
- NIDS／HIDS：ネットワーク型／ホスト型の IDS
- シグネチャ型：知られた攻撃の型と照らす検知
- アノマリー型：ふだんからのずれを見る検知
- ステートフルプロトコル解析：通信の手順が決まりに合っているかを見る検知
- NDR：ネットワークの検知と対応。内側の通信の振る舞いを見る製品の分類
- NGFW：次世代ファイアウォール。IPS などの機能を持つファイアウォール
- SIEM：色々なログを集めて、突き合わせて分析する仕組み
- タップ（TAP）：回線から通信のコピーを取り出す専用の機器
- ミラーポート（SPAN）：スイッチの通信のコピーを出すポート
- PCAP：保存した通信のファイル
- EVE JSON：Suricata の記録の形式。1行1件の JSON
- JA3／JA4：TLS の始めのあいさつの特徴から作る「話し方の指紋」
- 仮想パッチ：脆弱性を直す前に、それを狙う通信を IPS で止めること
- 誤検知：攻撃ではないものを攻撃として知らせること

## 出典（記事と同じ番号）

番号は記事の参考文献と同じ。

1. Mandiant（Google Cloud）（2026）M-Trends 2026。2025年に対応した事案のまとめ。 https://cloud.google.com/blog/topics/threat-intelligence/m-trends-2026?hl=en
2. NIST（2007）SP 800-94 Guide to Intrusion Detection and Prevention Systems (IDPS)。 https://csrc.nist.gov/pubs/sp/800/94/final
3. Google Cloud、Cloud IDS の概要。 https://docs.cloud.google.com/intrusion-detection-system/docs/overview
4. Google Cloud、Cloud IDS のトラブルシューティング（暗号化された通信は復号できない）。 https://docs.cloud.google.com/intrusion-detection-system/docs/troubleshooting
5. Zeek の文書、x509.log（TLS 1.3 では証明書が暗号化される）。 https://docs.zeek.org/en/master/logs/x509.html
6. Snort ブログ（2026-10-21）オープンソースの Snort 2 のサポート終了の告知。 https://blog.snort.org/2026/10/end-of-life-announcement-for-open.html
7. CyberRatings.org（2025）エンタープライズ・ファイアウォールの比較試験の結果の発表。 https://prnewswire.com/news-releases/cyberratingsorg-announces-enterprise-firewall-test-results-302184011.html
8. CyberRatings.org・NSS Labs（2025-11-25）エンタープライズ・ファイアウォールの再試験の結果の発表（転載）。 https://www.finanzen.net/nachricht/aktien/cyberratings-org-and-nss-labs-announce-follow-on-enterprise-firewall-results-15311424
9. Gartner（2025）Magic Quadrant for Hybrid Mesh Firewall の案内（Palo Alto Networks の掲載）。 https://www.paloaltonetworks.com/network-security/gartner-hybrid-mesh-firewalls-mq-2025
10. Security Onion の文書、使い方（暗号化で見えない部分は端末の記録で埋める）。 https://docs.securityonion.net/en/3/main/use-cases/
11. CIS Controls v8.1 Guide（2024）。Control 13 Network Monitoring and Defense。 https://researchsoc.iu.edu/resources/crosswalks/cis_controls__v8.1_guide__2024_0801.pdf
12. NIST（2012年案・2022年取り下げ）SP 800-94 Rev.1 の案。 https://csrc.nist.gov/pubs/sp/800/94/r1/ipd
13. IPA、SP 800-94 の日本語訳「侵入検知および侵入防止システム（IDPS）に関するガイド」。 https://www.ipa.go.jp/security/reports/oversea/nist/ug65p90000019cp4-att/begoj9000000bfom.pdf
14. IPA（2023）産業用制御システム向け侵入検知製品等の導入手引書。 https://www.ipa.go.jp/security/controlsystem/icsidshandbook.html
15. IBM Cost of a Data Breach 2026 の報道（Help Net Security、2026-07-30）。 https://www.helpnetsecurity.com/2026/07/30/ibm-cost-of-a-data-breach-2026/
16. IPA「情報セキュリティ10大脅威 2026」。 https://www.ipa.go.jp/security/10threats/10threats2026.html
17. 警察庁「令和7年上半期におけるサイバー空間をめぐる脅威の情勢等について」。 https://www.npa.go.jp/publications/statistics/cybersecurity/data/R7kami/R07_kami_cyber_jyosei.pdf
18. NIST（2024）Cybersecurity Framework 2.0（CSWP 29）。 https://doi.org/10.6028/NIST.CSWP.29
19. Suricata（2025-07-08）Suricata 8.0.0 の公開。 https://suricata.io/2025/07/08/suricata-8-0-0-released/
20. Suricata の文書、Linux でのインラインの IPS の設定。 https://docs.suricata.io/en/latest/ips/setting-up-ipsinline-for-linux.html
21. Suricata 8.0.7 の公開（公式フォーラム）。 https://forum.suricata.io/t/suricata-8-0-7-released/6467
22. Suricata の文書、JA3・JA4 のキーワード。 https://docs.suricata.io/en/latest/rules/ja-keywords.html
23. Snort ブログ（2020）Snort 2 と Snort 3 の違い。 https://blog.snort.org/2020/08/snort-3-2-differences.html
24. Snort、ルールセットの違い（Community・Registered・Subscriber）。 https://www.snort.org/faq/what-are-the-differences-in-the-rule-sets
25. Proofpoint、ET Pro ルールセットのデータシート（ET Open は rules.emergingthreats.net）。 https://www.proofpoint.com/us/resources/data-sheets/et-pro-ruleset
26. Zeek の公式リポジトリ（README）。 https://github.com/zeek/zeek
27. Zeek（2026-09）Zeek 9 の紹介。 https://zeek.org/2026/09/introducing-zeek-9/
28. Zeek 8.0.11・9.0.1 のセキュリティリリース（2026-10-26）。 https://community.zeek.org/t/zeek-bugfix-security-releases-8-0-11-and-9-0-1/8088
29. Security Onion ブログ（2026-03）Security Onion 3.0.0 の公開。 https://blog.securityonion.net/2026/03/security-onion-300-now-available-with.html
30. Corelight、Open NDR とセンサーの仕様。 https://corelight.com/products/open-ndr/
31. Security Onion の文書、サポート終了（2.4 は 2026-10-01）。 https://docs.securityonion.net/en/3/main/eol/
32. Wazuh の文書、ファイルの改ざん検知。 https://documentation.wazuh.com/current/getting-started/use-cases/file-integrity.html
33. OSSEC の文書、OSSEC について。 https://www.ossec.net/docs/about.html
34. Cisco、Secure Firewall の Encrypted Visibility Engine。 https://secure.cisco.com/secure-firewall/docs/encrypted-visibility-engine
35. Palo Alto Networks、Advanced Threat Prevention のデータシート。 https://paloaltonetworks.com/resources/datasheets/advanced-threat-prevention
36. Fortinet、FortiGate のディープインスペクション（7.6.5 管理ガイド）。 https://docs.fortinet.com/document/fortigate/7.6.5/administration-guide/122078/deep-inspection
37. Fortinet コミュニティ、Technical Tip：SSL の Certificate Inspection と Deep Inspection の違い。 https://community.fortinet.com/t5/FortiGate/Technical-Tip-Differences-between-SSL-Certificate-Inspection-and/ta-p/192301
38. Check Point、R81.10 Security Gateway の HTTPS Inspection。 https://sc1.checkpoint.com/documents/R81.10/WebAdminGuides/EN/CP_R81.10_Quantum_SecurityGateway_Guide/Topics-FWG/HTTPS-Inspection.htm
39. Trend Micro、TippingPoint の製品ページ。 https://www.trendmicro.com/en_us/business/products/network/tipping-point.html
40. Darktrace、Darktrace / NETWORK。 https://darktrace.com/ja/products/network
41. Vectra AI、Vectra AI Platform。 https://www.vectra.ai/platform
42. ExtraHop、RevealX の復号。 https://www.extrahop.com/resources/security/secure-decryption
43. Microsoft、Azure Firewall Premium の機能。 https://learn.microsoft.com/azure/firewall/premium-features
44. AWS ブログ、Network Firewall の TLS インスペクション。 https://aws.amazon.com/blogs/security/tls-inspection-configuration-for-encrypted-egress-traffic-and-aws-network-firewall
45. AWS Network Firewall の料金。 https://aws.amazon.com/network-firewall/pricing/
46. Google Cloud IDS の料金。 https://cloud.google.com/intrusion-detection-system/pricing
47. Gartner（2025）Magic Quadrant for Network Detection and Response の案内（Darktrace の掲載）。 https://www.darktrace.com/resources/gartner-ndr-magic-quadrant-2025
48. Security Onion の文書、構成（SPAN・TAP、NAT の内側で取る）。 https://docs.securityonion.net/en/2.4/architecture.html
49. Corelight、センサーの仕様（メーカーの発表）。 https://corelight.com/platform/sensor-specifications
50. Security Onion の文書、必要な機械（Import・Eval）。 https://docs.securityonion.net/en/3/main/hardware/
51. Security Onion の文書、Grid（Zeek の取りこぼし）。 https://docs.securityonion.net/en/2.4/grid.html
52. SANS Internet Storm Center、Brad Duncan の日誌（練習用の PCAP の扱いの注意）。 https://isc.sans.edu/diary/27228
53. TryHackMe、Snort の部屋。 https://tryhackme.com/room/snort
54. Hack The Box Academy、Working with IDS/IPS。 https://academy.hackthebox.com/course/preview/working-with-idsips

## 試すときの決まり

試すのは、自分の機械と、許可された演習の環境の中だけ。人のネットワークを許可なく監視したり、調べたりしない。公開の PCAP には本物のマルウェアが入っていることがあるので、ネットにつながない仮想環境で、ファイルを取り出さずに読む。製品やサービスの弱点に気づいたら、公開せず、作った会社か IPA の届け出の窓口に知らせる。
