# SIEM の検知ルールは、入れた日から調整が始まる

広告を含みます（リンク先のサイトのページには、広告が出ることがあります）。

製品に入っている検知ルールは、置かれる環境のふだんの姿を知らないまま作られていて、入れたあとに人が合わせていく前提で書かれている。この記事は、「ログイン失敗が続いたあとの成功」を例に、ルールが何を見るか、どう調整するか、鳴ったアラートを SOC（セキュリティの監視と対応をする部署）のアナリストがどう読むかを、サイトに書いた記事から短くまとめたものだ。ルールが何を見ているかまでを扱い、攻撃の手順は書かない。

## ルールは、失敗のあとの成功を見る

総当たり（ブルートフォース）は、MITRE ATT&CK の「Brute Force」（T1110）にあたり、パスワードを繰り返し推測してアカウントに入ろうとする手口とされる[1]。ATT&CK の検知の例は、ログオンの失敗が続いたあとに成功が来る順番を見る。失敗が続くだけなら、パスワードを忘れた人の記録かもしれない。失敗のあとに成功があると、推測が当たった可能性が出てくる[1]。

無料の SIEM の Wazuh は、これを重さの段階で表している。SSH の認証の失敗1件はルール 5760（重さ 5）で、それだけではセキュリティ上の意味はないとされる。同じ送り元からの失敗が160秒に12回重なるとルール 40111（重さ 10）、そのあと240秒のうちに同じ送り元で成功が来るとルール 40112（重さ 12）が鳴る[2][3]。1件では意味のない出来事が、つながるごとに重くなっていく。

## 時間の幅と回数は、ルールごとに違う

同じ「失敗のあとの成功」でも、Wazuh は失敗のアラートのあと240秒、Elastic の公開の SSH のルールは同じ端末・送り元・ユーザー名で15秒のうちに25回の失敗、と条件が違う[2][4]。ATT&CK は、時間の幅や失敗の数を「環境に合わせて変える項目」として書いている[1]。どれが正しいという違いではない。

パスワードスプレー（T1110.003）は、よく使われるパスワードを、多くの違うアカウントに少しずつ試す手口だ。一つのアカウントあたりの失敗は1回か2回で、アカウントごとに数えるルールのしきい値には届かない。ATT&CK の検知の例は、決めた時間の幅の中で、いくつのアカウントにわたって失敗が出たかを数える[5]。手口の形が変われば、数える単位も変える。

## 調整と例外は、入れたあともずっと続く

Elastic の手引きは、検知の仕組みを育てる流れを七つの段階で示し、用意されたルールを有効にするのは3番目に置いている。その前に、どの脅威が自分の環境にとって大事かを決め、ATT&CK で足りないところを探す段階がある。調整と雑音の削減は、続けるものだと書いている[6]。

直し方は二つに分かれる。ルールが広すぎて、どの環境でもふつうの動きに反応するなら、問い合わせやしきい値を変える（調整）。ルールは正しいが、自分の環境に特有の安全な動きに反応するなら、例外を足す。手引きは、社内で作ったアプリケーションがルールに反応してしまうとき、その名前を例外に足すやり方を示している[6]。

## SOC アナリストは、トリアージから始める

SOC のアナリストの仕事は、SIEM の画面に並んだアラートのトリアージ（ふるい分け）から始まることが多い。本当に怪しいか、どれくらい急ぐか、次の担当に渡すかを、ここで決める。Elastic の SSH のルールには調べ方が付いていて、ユーザー名と送り元の IP アドレスを調べ、同じユーザーや端末に出た過去48時間のほかのアラートを見て、端末が組織の中でどんな役目かを確かめる順になっている[4]。

## 誤検知の多くは、正しく鳴った害のない動き

オックスフォード大学のアラーマディらは、SOC の実務者への調査と聞き取りをもとに、2022年に「99% False Positives」という題の研究を発表した。実務者が誤検知と呼ぶアラートの多くは、ルールの誤りではなく、ルールどおりに鳴ったが、その環境では正当な動きだったもので、著者たちはこれを「benign trigger（害のない引き金）」と呼んだ[7]。管理者が障害の対応で夜中にサーバーへ入った記録は、ルールから見れば怪しく、組織から見れば仕事の一部だ。

ルールが間違っているならルールを直し、ルールは正しいが文脈を知らないなら、例外や資産・利用者の情報で文脈を足す。アラートが多すぎると一つひとつを丁寧に見られなくなり、アラート疲れと呼ばれる状態になる。アラートの数を減らすことと、一つひとつに文脈を持たせることは、別々の手当てだ。

## AI があっても、判断は人に残る

SIEM には機械学習や生成 AI の機能が足されてきている。それでも2025年の公的な手引きは、SIEM と SOAR が役に立つには、技能を持つ人による監視と、定期的な試験と、改善の繰り返しが要るとしている[8]。ルールが鳴ったあとに、それが仕事なのか攻撃なのかを決める材料を持っているのは、その組織を知っている人だ。

## 全文はサイトに

三つのルールの比較表、ログイン以外の検知の例（アカウントの作成、イベントログの消去）、ルールの種類、Sigma、出典17件は、サイトの記事にある。

[SIEM の検知ルールは、入れた日から調整が始まる（ムートン）](https://moutonarchive.com/siem-detection.html?utm_source=note&utm_medium=referral&utm_campaign=siem-detection)

SIEM の仕組みは[1本目](https://moutonarchive.com/siem.html?utm_source=note&utm_medium=referral&utm_campaign=siem-detection)、まわりの道具と自分のラボでの学び方は[3本目](https://moutonarchive.com/siem-ecosystem.html?utm_source=note&utm_medium=referral&utm_campaign=siem-detection)に書いた。

## 参考文献

1. MITRE ATT&CK「Brute Force」（T1110）と、検知の戦略 DET0463。https://attack.mitre.org/techniques/T1110/ ／ https://attack.mitre.org/detectionstrategies/DET0463
2. Wazuh 4.14.0 のルールのファイル（0280-attack_rules.xml のルール 40111・40112、0095-sshd_rules.xml のルール 5760）。https://github.com/wazuh/wazuh/blob/v4.14.0/ruleset/rules/0280-attack_rules.xml ／ https://github.com/wazuh/wazuh/blob/v4.14.0/ruleset/rules/0095-sshd_rules.xml
3. Wazuh ドキュメント「Rules classification」（4.14.0 の版。ルールの重さの段階）。https://github.com/wazuh/wazuh-documentation/blob/v4.14.0/source/user-manual/ruleset/rules/rules-classification.rst
4. Elastic の検知ルール「Potential Successful SSH Brute Force Attack」。https://github.com/elastic/detection-rules/blob/main/rules/linux/credential_access_potential_successful_linux_ssh_bruteforce.toml
5. MITRE ATT&CK「Password Spraying」（T1110.003）と、検知の戦略 DET0487。https://attack.mitre.org/techniques/T1110/003/
6. Elastic ドキュメント「Detections and alerts」と「Tune detection rules」。https://github.com/elastic/docs-content/blob/main/solutions/security/detect-and-alert.md ／ https://github.com/elastic/docs-content/blob/main/solutions/security/detect-and-alert/tune-detection-rules.md
7. Alahmadi・Axon・Martinovic（2022）99% False Positives: A Qualitative Study of SOC Analysts' Perspectives on Security Alarms。31st USENIX Security Symposium。https://www.usenix.org/conference/usenixsecurity22/presentation/alahmadi
8. ASD's ACSC・CISA ほか（2025）Implementing SIEM and SOAR platforms: Practitioner guidance。https://www.cyber.gov.au/business-government/detecting-responding-to-threats/event-logging/implementing-siem-soar-platforms/implementing-siem-and-soar-platforms-practitioner-guidance
