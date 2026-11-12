# NTLM は、パスワードがなくてもハッシュで答えられる。Windows は、その答えを外の共有にも自動で送る

広告を含みます（リンク先のサイトのページには、広告が出ることがあります）。

NTLM は、サーバーが出したチャレンジ（その場かぎりの値）に、パスワードから作ったハッシュで計算した応答を返す、Windows の認証方式だ。応答はパスワードそのものではなくハッシュから作られるので、ハッシュを盗まれれば本人として認証でき、Windows が外の SMB や WebDAV に自動で送る認証からは、応答が漏れる。この記事は、サイトに書いた記事の要点を短くまとめたもので、ログの記録の表と出典の全部は、最後に案内するサイトの記事にある。試すのは自分の環境と、許された演習の中だけにする。

## NTLM は、Kerberos が使えないときの代わり

Active Directory のドメインでは Kerberos が優先され、NTLM は代わりとして残っている。ワークグループの機器どうしの認証や、ドメインコントローラー以外の機器でのローカルのログオンには、今も NTLM が使われる[1]。共有を名前ではなく IP アドレスや DNS の別名で開くと、Kerberos ではなく NTLM になる[3]。

大きな違いは、相手の確かめ方だ。Kerberos はクライアントとサーバーが互いに相手を確かめられる。NTLM のクライアントはサーバーの正体を確かめる仕組みを持たず、サーバーが本物であることを前提に作られている[2]。

## チャレンジと応答と、NT ハッシュ

Microsoft の仕様 [MS-NLMP] では、NTLM は3つのメッセージでできている[4]。

- クライアントが NEGOTIATE を送る
- サーバーが 8 バイトの乱数（チャレンジ）を入れた CHALLENGE を返す
- クライアントが利用者の名前と応答を入れた AUTHENTICATE を返す

NTLM は自分のポートを持たず、SMB や HTTP のメッセージの中に埋め込まれて運ばれる[4]。

応答に使う鍵は、パスワードを MD4 にかけた値（NT ハッシュ）から作られる。式の中でパスワードが出てくるのは MD4 にかけるところだけなので、NT ハッシュを持っていれば、パスワードを知らなくても正しい応答が作れる[4]。盗んだハッシュで本人として認証するのが「パス・ザ・ハッシュ」（MITRE ATT&CK の T1550.002）だ[5]。仕様そのものも、NTLM が AES や SHA-256 に対応しないことを挙げ、アプリには一般に NTLM を使わないよう勧めている[4]。

## Windows は、外の共有にも自動で認証を送る

Windows は SMB の共有を開くとき、ログオン中の利用者の認証情報で自動で認証する。行き先が攻撃者のサーバーでも同じだ。ATT&CK はこれを「強制された認証」（T1187）とし、SMB が止められたときに WebDAV（80 番・443 番）が使われることにも触れている[6]。

きっかけは、外のサーバーを指す UNC パス（\\サーバー名\共有名 の形）を含むファイルやメッセージだ。開くと外のテンプレートを読み込む文書や、アイコンの場所を外の UNC パスにしたファイルでは、アイコンを表示しただけで認証が始まる[6]。Outlook の CVE-2023-23397 もこの形で、細工したメッセージの中の UNC パスから NTLMv2 の応答が送られた。修正版の Outlook は、信頼できるネットワークの外を指すパスを使わなくなった[7]。CISA は 2023年3月14日、これを悪用が確かめられた脆弱性の一覧（KEV）に加えている[8]。

漏れるのは、そのチャレンジに対する応答だ。別のチャレンジには使い回せないが、チャレンジを出したのが攻撃者なら、パスワードの候補から応答を計算して突き合わせる、手元での総当たりに使われうる[6]。

## リレーと、それを止める署名

リレーは、間に入った攻撃者が、本物のサーバーのチャレンジをクライアントに渡し、返ってきた応答をそのまま本物のサーバーに渡して、本人としてログオンする攻撃だ。NTLM のクライアントはサーバーを確かめないので、中継に気づけない[2]。ATT&CK は、LLMNR・NBT-NS・mDNS の名前の問い合わせに攻撃者が答えて間に入る方法を挙げている[9]。

守りは三つある。

- SMB 署名：メッセージごとに、パスワードから作られるセッション鍵で署名を付け、リレーを防ぐ[3]。Windows 11 24H2 と Windows Server 2025 では、送受信の SMB 接続で既定で必須になった[10]
- EPA（認証の拡張保護）：HTTP の上の認証に、TLS の通り道の情報を入れる。間に入られると値が食い違うので、サーバーは中継に気づける[11]
- 外向きの 445 番を止める：Microsoft は、インターネットへ出ていく TCP 445 番を会社のファイアウォールで止めるよう勧めている[12]

Microsoft は NTLM を減らしている。Windows Server 2025 で NTLMv1 は削除され、NTLMv2 も非推奨になった[13]。2026年1月29日には、次の大きな版でネットワークの NTLM 認証を既定で無効にする計画を示した。NTLM を消すわけではなく、必要なら有効に戻せる[14]。

## ログでは 4624 と 4776

- 4624（ログオンの成功）：NSA の手引きは、ログオンの種類が 3、認証パッケージが NTLM、ドメインのアカウントでなく、ANONYMOUS LOGON でもないものを、パス・ザ・ハッシュの横移動を見る条件に挙げている[15]
- 4776（資格情報の確認）：NTLM で資格情報を確かめたとき、その持ち主の機器に残る。ドメインのアカウントならドメインコントローラーだ[16]

## 全文はサイトに

Kerberos との違い、応答の計算、EPA の仕組み、NTLM の Operational のログ、自分の環境での確かめ方、出典20件は、サイトの記事にある。

[NTLM は、パスワードがなくてもハッシュで答えられる。Windows は、その答えを外の共有にも自動で送る（ムートン）](https://moutonarchive.com/ntlm.html?utm_source=note&utm_medium=referral&utm_campaign=ntlm)

## 参考文献

1. Microsoft Learn「NTLM overview」。https://learn.microsoft.com/windows-server/security/kerberos/ntlm-overview
2. Microsoft Learn「Kerberos authentication overview」。https://learn.microsoft.com/windows-server/security/kerberos/kerberos-authentication-overview
3. Microsoft Learn「Overview of Server Message Block signing in Windows」。https://learn.microsoft.com/windows-server/storage/file-server/smb-signing-overview
4. Microsoft「[MS-NLMP]: NT LAN Manager (NTLM) Authentication Protocol」。https://learn.microsoft.com/openspecs/windows_protocols/ms-nlmp/b38c36ed-2804-4868-a9ff-8dd3182128e4
5. MITRE ATT&CK「Use Alternate Authentication Material: Pass the Hash（T1550.002）」。https://attack.mitre.org/techniques/T1550/002/
6. MITRE ATT&CK「Forced Authentication（T1187）」。https://attack.mitre.org/techniques/T1187/
7. Microsoft Security Response Center（2023）「Microsoft Mitigates Outlook Elevation of Privilege Vulnerability」。https://msrc.microsoft.com/blog/2023/03/microsoft-mitigates-outlook-elevation-of-privilege-vulnerability/
8. CISA「Known Exploited Vulnerabilities Catalog」（CVE-2023-23397）。https://www.cisa.gov/known-exploited-vulnerabilities-catalog
9. MITRE ATT&CK「Adversary-in-the-Middle: Name Resolution Poisoning and SMB Relay（T1557.001）」。https://attack.mitre.org/techniques/T1557/001/
10. Microsoft Learn「SMB security hardening in Windows Server and Windows Client」。https://learn.microsoft.com/windows-server/storage/file-server/smb-security-hardening
11. Microsoft Learn「Extended Protection for Authentication Overview」。https://learn.microsoft.com/dotnet/framework/wcf/feature-details/extended-protection-for-authentication-overview
12. Microsoft Learn「Secure SMB Traffic in Windows Server」。https://learn.microsoft.com/windows-server/storage/file-server/smb-secure-traffic
13. Microsoft Learn「Features removed or no longer developed in Windows Server」。https://learn.microsoft.com/windows-server/get-started/removed-deprecated-features-windows-server
14. Microsoft Windows IT Pro Blog（2026）「Advancing Windows security: Disabling NTLM by default」。https://techcommunity.microsoft.com/blog/windows-itpro-blog/advancing-windows-security-disabling-ntlm-by-default/4489526
15. NSA「Windows Event Monitoring Guidance」（Event Forwarding Guidance）。https://github.com/nsacyber/Event-Forwarding-Guidance/tree/master/Events
16. Microsoft Learn「4776(S, F): The computer attempted to validate the credentials for an account」。https://learn.microsoft.com/previous-versions/windows/it-pro/windows-10/security/threat-protection/auditing/event-4776
