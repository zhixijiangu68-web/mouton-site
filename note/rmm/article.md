# 遠隔操作ツールは、本物のまま攻撃に使われる。だからウイルス対策は、ふつう鳴らない

広告を含みます（リンク先のサイトのページには、広告が出ることがあります）。

RMM（リモート監視・管理）ツールは、運用を受け持つ事業者（MSP）や社内の情報システムの担当が、離れた場所から多くの端末を見守り、操作するための正規のソフトだ。攻撃者は同じソフトを、だまして入れさせる道具や、入り込んだあとの出入り口として使う。この記事は、サイトに書いた記事の要点を短くまとめたもので、ログの手がかりの表と出典の全部は、最後に案内するサイトの記事にある。

## RMM と MSP

MITRE ATT&CK は、遠隔操作の道具を使うと、利用者がその場にいるかのように端末を操作でき、利用者やソフトの権限をそのまま受け継ぐと説明している。多くは入れるときに Windows のサービスを作り、その作りがそのまま攻撃者の居座り（永続化）にもなる[1]。

CISA・NSA・MS-ISAC の勧告 AA23-025A によると、MSP と社内のヘルプデスクは、ふだんから正規の RMM を使っている。攻撃者はこうした利用者を狙うことが多く、MSP のネットワークの信頼関係を悪用して、その MSP の多くの顧客に入り込める[2]。ATT&CK はこの形を「信頼された関係」（T1199）としてまとめている。外部の業者に渡した高い権限のアカウントが乗っ取られれば、そこから入られる[3]。

## 攻撃者が正規の RMM を選ぶ理由

AA23-025A は、守る側が知っておくこととして次の点を挙げている[2]。

- どの正規の RMM でも悪用できる
- インストールの要らないポータブル版を使えば、管理者の権限と、ソフトの導入を管理する仕組みの両方をすり抜けられる
- RMM を使っても、ウイルス対策はふつう反応しない
- 居座りと、外から命令を送る通り道（C2）の裏口として使われてきた
- 自前の不正なプログラムを作らずに済む

業務で同じ製品を使っている組織では、その通信先はふだんから許されているので、通信だけで業務と攻撃を見分けるのは難しくなる。

## 偽のサポートを装い、本人に入れさせる

AA23-025A は、2022年に米国の連邦政府の職員が狙われた例を書いている。ヘルプデスクを装ったメールから電話やリンクに誘い、攻撃者の RMM のサーバーにつながるよう設定された AnyDesk と ScreenConnect のポータブル版を取ってこさせた。攻撃者はつないだまま銀行のサイトへログインさせ、残高の表示を書き換えて、差額の「返金」を求めた[2]。

日本でも IPA が、ブラウザーに偽のセキュリティ警告と電話番号を出し、電話してきた人に遠隔操作のソフトを入れさせる「サポート詐欺」に注意を呼びかけている。勧めは、番号に電話しないこと、画面を閉じること、遠隔操作されてしまったらネットワークを切り、入れられたソフトを消して相談することだ[4][5]。

## 管理画面を乗っ取られると、顧客へまとめて広がる

2021年7月、Kaseya の RMM「VSA」の脆弱性を使ったランサムウェアの攻撃が、複数の MSP とその顧客に広がった[6]。Kaseya によると、直接侵害された顧客は60社未満で、すべてオンプレミス版の利用者だった。その多くがほかの会社に IT のサービスを提供していたため、影響は合わせて1,500社未満の会社に及んだ。修正は2021年7月11日に出ている[7]。

## 守る側がすること

- **使ってよい RMM を決め、ほかを止める**：AA23-025A は、使っている RMM を洗い出し、アプリの制御で許した RMM だけを動かすよう勧めている。許していない RMM のインストールだけでなく、ポータブル版の実行も止める。許した RMM も、VPN のような認めた経路の内側からだけ使わせる[2]
- **MSP との契約で、権限と責任を分ける**：共同の勧告 AA22-131A は、契約でセキュリティの役割と責任をはっきりさせること、MSP のアカウントを組織の中の管理者のグループに入れないこと、重要なログを少なくとも6か月残すことを勧めている[8]
- **多要素認証**：Kaseya の件で CISA と FBI は、MSP に、すべてのアカウントでの多要素認証と、RMM の管理画面を VPN か管理専用のネットワークの内側に置くことを勧めた[6]
- **外への通信を見る**：ATT&CK の対策は、ファイアウォールやプロキシで、遠隔操作のソフトが使うサイトへの外向きの通信を制限することを挙げている[1]

## ログでの見つけ方

RMM の多くはサービスとして入るので、Windows のシステムのログのイベント ID 7045（ソースは Service Control Manager）が手がかりになる。サービスの名前、実行ファイルの場所、開始の方法、動かすアカウントが記録される[9]。ただし、インストールしないポータブル版はここに出ないことがあるので、AA23-025A は RMM の実行のログも見るよう勧めている[2]。

一つの記録で決めず、遠隔操作のソフトが動き、サービスで居座り、外へ長くつながり続ける流れを一続きで見る[1]。鳴ったら、許可リストに載っている RMM か、導入した人と時刻に心当たりがあるかを確かめる。

試すのは、自分の機械か、学習用の仮想マシンと、許された演習の環境だけにする。

## 全文はサイトに

ログの手がかりの表、Windows の App Control の監査モード、公開されている検知のルール（Sigma）、2026年11月の報道、出典17件は、サイトの記事にある。

[遠隔操作ツールは、本物のまま攻撃に使われる。だからウイルス対策は、ふつう鳴らない（ムートン）](https://moutonarchive.com/rmm.html?utm_source=note&utm_medium=referral&utm_campaign=rmm)

## 参考文献

1. MITRE ATT&CK「T1219 Remote Access Tools」。https://attack.mitre.org/techniques/T1219/
2. CISA・NSA・MS-ISAC（2023）AA23-025A Protecting Against Malicious Use of Remote Monitoring and Management Software。https://www.cisa.gov/news-events/cybersecurity-advisories/aa23-025a
3. MITRE ATT&CK「T1199 Trusted Relationship」。https://attack.mitre.org/techniques/T1199/
4. IPA 安心相談窓口だより（2023）「遠隔操作ソフト（アプリ）を悪用される手口に気をつけて！」。https://www.ipa.go.jp/security/anshin/attention/2023/mgdayori20230411.html
5. IPA 安心相談窓口だより（2024）「パソコンに偽のウイルス感染警告を表示させるサポート詐欺に注意」。https://www.ipa.go.jp/security/anshin/attention/2024/mgdayori20241119.html
6. CISA・FBI（2021）CISA-FBI Guidance for MSPs and their Customers Affected by the Kaseya VSA Supply-Chain Ransomware Attack。https://www.cisa.gov/news-events/alerts/2021/07/04/cisa-fbi-guidance-msps-and-their-customers-affected-kaseya-vsa-supply-chain-ransomware-attack
7. Kaseya（2021）Important Notice。https://helpdesk.kaseya.com/hc/en-gb/articles/4403440684689-Important-Notice-August-4th-2021
8. 英国・豪州・カナダ・ニュージーランド・米国の機関の共同（2022）AA22-131A Protecting Against Cyber Threats to Managed Service Providers and their Customers。https://www.cisa.gov/news-events/cybersecurity-advisories/aa22-131a
9. Microsoft Learn「Troubleshoot unexpected reboots using system event logs」（イベント ID 7045）。https://learn.microsoft.com/en-us/troubleshoot/windows-server/performance/troubleshoot-unexpected-reboots-system-event-logs
