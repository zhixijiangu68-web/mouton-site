# Linux のログは、手元にあるかぎり消せる。だから外へも送っておく

広告を含みます（リンク先のサイトのページには、広告が出ることがあります）。

Linux のログは、多くのプログラムが syslog の形で出し、rsyslog がテキストのファイルに、systemd-journald が journal という独自の形のファイルに書く。ログインや権限の記録は、sshd と sudo の行、wtmp と btmp、auditd の記録に分かれて残り、その機械の管理者の権限があれば消せる。この記事は、サイトに書いた記事の要点を短くまとめたもので、出典の全部は最後に案内するサイトの記事にある。例のアドレスは文書用のもの、ユーザー名は架空のものだけを使う。

## syslog は、facility と severity を持つ

syslog のメッセージには、どこから来たかを表す facility と、重さを表す severity が付く。RFC 5424 では facility は 0〜23 で、4 と 10 がセキュリティと認証（設定では auth と authpriv）、severity は 0（emerg）〜7（debug）だ[1]。先頭の山かっこの数は facility × 8 + severity で、`<34>` は facility 4 と severity 2 を表す[1]。

## rsyslog はテキストに、journald は journal に書く

- journald は、カーネルのメッセージ、syslog の関数で出されたメッセージ、サービスの標準出力と標準エラー、監査の記録を集める[2]
- journal は `/var/log/journal` に置けば残り、`/run/log/journal` なら再起動で消える[3]
- 名前が「_」で始まる項目（`_COMM`・`_UID` など）は journald が付け、送った側は書き換えられない[4]。logger の `-t` では好きな名前で syslog に書けるので[5]、「sshd」と名乗る行の出どころは `_COMM` で確かめられる
- rsyslog が入っていない機械では、ログは journal にしかない

journal は journalctl で読み、`-u`（ユニット）・`-t`（名乗り）・`-p`（重さ）・`-S`（時刻）・`-b`（起動）・`-g`（本文の正規表現）で絞る[6]。

## 認証の記録の置き場所

Debian の系統では `/var/log/auth.log`、Red Hat の系統では `/var/log/secure` に書かれることが多く、ATT&CK も認証のログの場所としてこの二つを並べている[7]。どちらも rsyslog の設定の結果だ[8]。Debian 12 からは rsyslog が標準では入らなくなり、ログは journalctl で読むよう案内されている[9]。

## sshd の行

sshd は既定で facility AUTH、細かさ INFO で書く[10]。成功は Accepted、失敗は Failed で始まり、方式・ユーザー名・送り元のアドレス・ポートが続く。存在しないユーザーには「invalid user」が付く[11]。

- `Invalid user admin01 from 203.0.113.50 port 50122`
- `Failed password for invalid user admin01 from 203.0.113.50 port 50122 ssh2`
- `Accepted publickey for user01 from 198.51.100.7 port 51022 ssh2: ED25519 SHA256:...`

ある利用者の公開鍵の失敗は、回数が MaxAuthTries（既定 6）の半分に届くまで VERBOSE で書かれ、INFO では残らない[10][11]。

## sudo の行

sudo の行には、実行した人・端末・ディレクトリー・なり代わった相手・コマンドが入る。断られたときは「user NOT in sudoers」「command not allowed」「3 incorrect password attempts」などの理由がユーザー名のあとに入る[12]。

`user01 : TTY=pts/0 ; PWD=/home/user01 ; USER=root ; COMMAND=/usr/bin/systemctl restart nginx`

## last・lastb と auditd

- last は `/var/log/wtmp` を読み、ログインと再起動の一覧を出す。lastb は失敗したログインの `/var/log/btmp` を読む。どちらもファイルがあるときだけ書かれる[13]
- auditd は、カーネルの監査の記録を `/var/log/audit/audit.log` に書く。ルールに「キー」を付けておくと、ausearch の `-k` で目的の記録だけを選べる。aureport は認証の試みやログインの集計を出す[14]

## 消える仕組みと、外へ送る理由

- logrotate は日に一度動き、`rotate` の数だけ古い版を残して、それより古いものを消す。`copytruncate` では行が抜けることがある[15]
- journal は既定でファイルシステムの 10%（上限 4G）を超えると、閉じた古いファイルから消す[3]
- ATT&CK は、侵入の跡を隠すために `/var/log` の下のログを消す動きを T1070.002 としてまとめている[7]

送った先の機械には、送り元で消されたあとも写しが残る。UDP の 514 番は確認応答も送り元の確かめもない[16]。rsyslog の説明書は、TCP の 6514 番の TLS を勧め、待ち行列を付けるよう書いている[17]。

## SOC で見る三つの変化

- 同じ送り元からの sshd の失敗の連続と、そのあとの成功
- 見慣れない sudo（ふだん使わない人、違う時刻、見慣れないコマンド、「NOT in sudoers」）
- ログの途切れ（届かなくなる、ファイルが急に小さくなる、時刻に穴が開く）。途切れは届いたログの中には出てこないので、届かないことを数えるルールが要る

試すのは、自分の機械か、許された演習の環境だけにする。

## 全文はサイトに

severity の表、journalctl と auditd の使い方の詳しい説明、自分の環境で確かめるコマンド、出典20件は、サイトの記事にある。

[Linux のログは、手元にあるかぎり消せる。だから外へも送っておく（ムートン）](https://moutonarchive.com/linux-log.html?utm_source=note&utm_medium=referral&utm_campaign=linux-log)

SSH の総当たりを見つける検知ルールは[SIEM の検知ルールの記事](https://moutonarchive.com/siem-detection.html?utm_source=note&utm_medium=referral&utm_campaign=linux-log)に書いた。

## 参考文献

1. Gerhards（2009）RFC 5424 The Syslog Protocol。https://www.rfc-editor.org/rfc/rfc5424
2. systemd の説明書「systemd-journald.service(8)」。https://github.com/systemd/systemd/blob/main/man/systemd-journald.service.xml
3. systemd の説明書「journald.conf(5)」。https://github.com/systemd/systemd/blob/main/man/journald.conf.xml
4. systemd の説明書「systemd.journal-fields(7)」。https://github.com/systemd/systemd/blob/main/man/systemd.journal-fields.xml
5. util-linux の説明書「logger(1)」。https://github.com/util-linux/util-linux/blob/master/misc-utils/logger.1.adoc
6. systemd の説明書「journalctl(1)」。https://github.com/systemd/systemd/blob/main/man/journalctl.xml
7. MITRE ATT&CK「Indicator Removal: Clear Linux or Mac System Logs」（T1070.002）。https://attack.mitre.org/techniques/T1070/002/
8. rsyslog の Red Hat 向けの設定の見本。https://github.com/rsyslog/rsyslog/blob/main/platform/redhat/rsyslog.conf
9. Debian「Release Notes for Debian 12 (bookworm)」5 章。https://www.debian.org/releases/bookworm/amd64/release-notes/ch-information.en.html
10. OpenSSH の説明書「sshd_config(5)」。https://github.com/openssh/openssh-portable/blob/master/sshd_config.5
11. OpenSSH のソース auth.c。https://github.com/openssh/openssh-portable/blob/master/auth.c
12. sudo の説明書「sudoers(5)」。https://github.com/sudo-project/sudo/blob/main/docs/sudoers.mdoc.in
13. util-linux の説明書「last(1)」。https://github.com/util-linux/util-linux/blob/master/login-utils/last.1.adoc
14. Linux Audit の説明書（auditd・audit.rules・ausearch・aureport）。https://github.com/linux-audit/audit-userspace/tree/master/docs
15. logrotate の説明書「logrotate(8)」。https://github.com/logrotate/logrotate/blob/main/logrotate.8.in
16. Okmianski（2009）RFC 5426 Transmission of Syslog Messages over UDP。https://www.rfc-editor.org/rfc/rfc5426
17. rsyslog の説明書「omfwd」。https://github.com/rsyslog/rsyslog/blob/main/doc/source/configuration/modules/omfwd.rst
