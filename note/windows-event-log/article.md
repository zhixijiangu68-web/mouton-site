# Windows のセキュリティのログには、監査ポリシーで決めたことしか残らない

広告を含みます（リンク先のサイトのページには、広告が出ることがあります）。

Windows は、ログオンやプロセスの起動のような出来事を、番号（イベント ID）つきでイベントログに書く。何が残るかは監査ポリシーと Sysmon の設定で決まり、記録の対象にしていない出来事は残らない。この記事は、サイトに書いた記事の要点を短くまとめたもので、ログオンの種類の表と出典の全部は、最後に案内するサイトの記事にある。

## ログの名前とイベント ID で探す

Windows の基本のログは三つある。Application はアプリケーションの出来事、Security はログオンの成功と失敗のような監査の出来事、System は OS の部品の出来事を残す[1]。Sysmon のように、出し手が自分のログ（チャネル）を持つものもある。イベント ID はログと出し手ごとに決まるので、ログの名前と組にして読む。

## 何を残すかは、監査ポリシーで決まる

Microsoft の「Events to Monitor」は、監査に関わるグループポリシーの多くが既定で「未構成」だと書き、Advanced Audit Policy Configuration で監査を設定するよう勧めている[2]。監査には細かい分類があり、それぞれで成功・失敗・両方を選べる。今効いている設定は `auditpol /get /category:*` で見られる[3]。

## ログオンの記録

- 4624：アカウントがログオンした
- 4625：ログオンに失敗した（理由は Status と SubStatus のコード）
- 4634・4647：ログオフした・利用者がログオフを始めた
- 4648：資格情報を明示して使ったログオンの試み
- 4740：アカウントのロックアウト

4624 では、ログオンしたアカウント、ログオンの種類（LogonType）、相手のアドレスと端末名、認証の方式、ログオン ID を読む[2][4]。

LogonType の主な番号は、2 が対話型、3 がネットワーク越し（共有フォルダーなど）、5 がサービス、7 がロックの解除、10 がリモートの対話型（リモートデスクトップ）だ[5]。MITRE の分析の例 CAR-2016-04-005 も、「4624 で LogonType が 10」をリモートデスクトップのログオンとして拾い、許された端末からかを比べる[6]。

## 管理者の権限、アカウントとグループ

4672 は、新しいログオンに管理者と同じ強さの特別な権限が割り当てられたことを表す[2][3]。

アカウントの作成は 4720、削除は 4726、セキュリティのグループへのメンバーの追加は 4728（グローバル）・4732（ローカル）・4756（ユニバーサル）だ[2]。「Events to Monitor」は、4720 や 4732 を重さ「低」とし、思いがけないときや数がふだんを大きく超えたときに調べるとしている。監査ポリシーの変更（4719）は「高」で、1件でも調べる[2]。

## 4688 は、設定しなければコマンドラインを残さない

4688（新しいプロセスが作られた）を残すには Audit Process Creation を、コマンドラインまで残すには Include command line in process creation events を有効にする。どちらも既定では有効ではない。有効にするとコマンドラインが平文で入り、Security のログを読める人なら誰もが読める。コマンドラインにはパスワードが入りうるので、ログを読める人をしぼることと一緒に決める[7]。

## Sysmon

Sysmon は Sysinternals の道具で、サービスとドライバーとして動き、出来事をイベントログに書く。プロセスの起動（1）には本人と親のコマンドラインとハッシュが入り、ほかにネットワークの接続（3）、ファイルの作成（11）、DNS の問い合わせ（22）などがある。3 は既定では残らない。Sysmon は出来事を分析しないので、分析は SIEM の側でする[8]。

## サービスの追加とログの消去

- 7045：System のログに残るサービスの追加。サービスの名前と実行ファイルのパスが入る[4]。ATT&CK の検知の例は、ふだん使わない場所（C:\Users\ や C:\Temp\）の実行ファイルを目印にしている[9]
- 1102：Security のログが消された。ほかのログを消したときは System のログに 104 が残る[2][10]

MITRE の CAR-2016-04-002 は、ふだんの運用でログが消されることは考えにくいとし、ログを1か所に集めておけば痕跡を消すのがずっと難しくなると書いている[6]。

## SOC での見方と、SIEM への送り方

MITRE ATT&CK の検知の例には、次のものがある[9]。

- 同じか似たアカウントへの 4625 が続く（パスワードの推測）。多くのアカウントに失敗が広がる（パスワードスプレー）
- ふだんと違うログオンの種類や時刻。ローカルのアカウントが業務時間の外に使われる
- リモートデスクトップのログオンの直後に、cmd.exe や powershell.exe が動く

深夜の管理者のログオンは、夜の保守もあるので時刻だけでは決めない。ATT&CK は、業務時間の幅や、リモートデスクトップを使う人の範囲を、環境に合わせて調整する項目にしている[9]。

端末の中のログは、その端末で消せる。Windows Event Collector で集める側へ転送するか、SIEM のエージェントで送っておく[8][11]。Splunk では、Splunk Add-on for Microsoft Windows と Splunk Add-on for Sysmon で、XML の形のまま取り込む[4]。

## 全文はサイトに

ログオンの種類の表、auditpol・wevtutil・Get-WinEvent で自分の環境で確かめる方法、出典19件は、サイトの記事にある。

[Windows のセキュリティのログには、監査ポリシーで決めたことしか残らない（ムートン）](https://moutonarchive.com/windows-event-log.html?utm_source=note&utm_medium=referral&utm_campaign=windows-event-log)

ログを1か所に集める SIEM の仕組みは[SIEM の記事](https://moutonarchive.com/siem.html?utm_source=note&utm_medium=referral&utm_campaign=windows-event-log)、失敗のあとの成功を見る検知ルールは[検知ルールの記事](https://moutonarchive.com/siem-detection.html?utm_source=note&utm_medium=referral&utm_campaign=windows-event-log)に書いた。

## 参考文献

1. Microsoft「Eventlog Key」。https://learn.microsoft.com/windows/win32/eventlog/eventlog-key
2. Microsoft「Appendix L: Events to Monitor」。https://learn.microsoft.com/windows-server/identity/ad-ds/plan/appendix-l--events-to-monitor
3. Microsoft「Monitoring Active Directory for Signs of Compromise」。https://learn.microsoft.com/windows-server/identity/ad-ds/plan/security-best-practices/monitoring-active-directory-for-signs-of-compromise
4. Splunk「security_content」のデータソースの定義（Windows Event Log Security 4624・4672、System 7045、Sysmon EventID 1）。https://github.com/splunk/security_content/tree/develop/data_sources
5. Microsoft「SECURITY_LOGON_TYPE enumeration (ntsecapi.h)」。https://learn.microsoft.com/windows/win32/api/ntsecapi/ne-ntsecapi-security_logon_type
6. MITRE Cyber Analytics Repository「CAR-2016-04-005」「CAR-2016-04-002」。https://car.mitre.org/analytics/CAR-2016-04-005/ ／ https://car.mitre.org/analytics/CAR-2016-04-002/
7. Microsoft「Command line process auditing」。https://learn.microsoft.com/windows-server/identity/ad-ds/manage/component-updates/command-line-process-auditing
8. Russinovich・Garnier「Sysmon v15.22」。https://learn.microsoft.com/sysinternals/downloads/sysmon
9. MITRE ATT&CK の検知の戦略 DET0551・DET0487・DET0560・DET0407・DET0327・DET0552。https://attack.mitre.org/detectionstrategies/DET0551 ほか
10. SigmaHQ のルール「Eventlog Cleared」ほか。https://github.com/SigmaHQ/sigma/tree/master/rules/windows/builtin
11. Microsoft「Windows Event Collector」。https://learn.microsoft.com/windows/win32/wec/windows-event-collector
