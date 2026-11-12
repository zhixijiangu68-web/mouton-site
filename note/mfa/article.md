# 確認コードは、偽のサイトにも打ち込める。多要素認証の強さは、鍵がどのサイトに結びつくかで決まる

広告を含みます（リンク先のサイトのページには、広告が出ることがあります）。

多要素認証（MFA）は、種類の違う二つ以上の要素で本人を確かめる。ただ、MFA の中にも強さの差がある。手で打ち込む確認コードは偽のサイトに中継されうるが、WebAuthn の鍵はサイトの名前に結びつくので、中継では使えない。この記事は、サイトに書いた記事の要点を短くまとめたもので、出典の全部と方法ごとの比べ方は、最後に案内するサイトの記事にある。

## 認証の要素は三つ

NIST の SP 800-63B（2025年の第4版）は、認証の要素を「知っているもの」「持っているもの」「本人であること」の三つとしている[1]。パスワードは知っているもの、ワンタイムパスワードのアプリやセキュリティキーは持っているもの、指紋や顔は本人であることに当たる。パスワードを二つ聞いても、要素は一つのままだ。

生体は単独では使わず、機器と組み合わせる多要素の一部としてだけ認められている。照合が確率で決まることと、生体が秘密ではないことが理由だ[1]。

## パスワードは、長さと照合で守る

SP 800-63B-4 のパスワードの決まりは、複雑さより長さと照合を重く見る[1]。

- パスワードだけで認証するなら15文字以上、多要素の一部なら8文字以上
- 大文字・数字・記号を混ぜる決まりを課さない
- 定期的な変更を求めない。漏れた形跡があるときは変えさせる
- 漏えいしたパスワードや辞書の言葉の一覧と照らし、載っていれば選び直させる
- パスワードマネージャーと貼り付けを許す

保存は、ソルトを付けた遅いハッシュで行う。ソルトは利用者ごとの乱数で、同じパスワードでも値が変わるので、前もって計算した表が使えない[2]。SHA-256 のような速いハッシュは推測を速く試させてしまうので、OWASP は Argon2id を第一に勧めている[2]。

## ワンタイムパスワードと SMS

HOTP（RFC 4226）は、共有した鍵とカウンターから6桁以上の数字を作る[3]。TOTP（RFC 6238）はカウンターの代わりに時刻を使い、既定では30秒ごとに値が変わる。一度通ったコードは二度目には受け付けない[4]。

ただ、手で打ち込むコードは、偽のサイトが受け取ってそのまま本物に渡せる。SP 800-63B-4 は、こうした方法をフィッシングに強いとは見なさない[1]。

SMS や音声通話でコードを送る方法は、SP 800-63B-4 で「制約つき」とされ、送る前に SIM の変更や番号の移転のような兆しを見るよう勧められている[1]。

## プッシュ通知と「MFA 疲れ」

承認を押すだけの通知では、パスワードを手に入れた攻撃者がログインを繰り返し、利用者が根負けして承認するのを待てる。MITRE ATT&CK はこれを T1621 としてまとめ、「MFA 疲れ」と呼んでいる[5]。

対策は、ログインの画面に出た数字をアプリに打ち込ませる「番号の照合」と、通知の数の上限だ。SP 800-63B-4 は、値を見比べて承認するだけの方式をもう受け入れず、値を打ち込ませる形を求めている[1]。

## フィッシングに強い認証は、鍵をサイトの名前に結びつける

WebAuthn では、認証器がサイトごとに鍵の組を作り、サイトは公開鍵だけを持つ。鍵はサイトの識別子（RP ID）に結びつき、ブラウザーはそのサイトのオリジンでしか鍵を使わせない[6]。署名するデータにはページのオリジンと、サイトが毎回送る乱数が入るので、偽のサイトが中継しても本物のサイトは受け付けない。利用者が偽物に気づかなくても防げる。

パスキーは、WebAuthn の仕様で、ユーザー名を先に入れなくても使える認証情報の呼び名だ[6]。

## MFA のあとと、MFA を通らない入口

ログインのあとは、セッションの Cookie が本人の証明になる。ATT&CK は、盗んだ Cookie で一部の MFA を素通りできると書いている[7]。

MFA をかけていない入口も狙われる。2026年11月6日、CISA は SonicWall の SSL VPN の脆弱性 CVE-2026-19868 を、悪用が確かめられた脆弱性の一覧に加えた。別の認証方式の正しい認証情報で、SAML で求めている MFA を回避できるおそれがあるという内容だ[8]。

## ログで見ること

- 一つのアカウントへの失敗の連続
- 多くのアカウントへの、同じ少数のパスワードでの失敗（パスワードスプレー）
- パスワードは通ったのに、MFA の拒否や時間切れが続く
- ログインの送り元が、MFA の端末の場所と合わない
- MFA の方法の新しい登録や、MFA の対象からの除外

試すのは、自分の機械と許可された演習の環境だけにする。

## 全文はサイトに

方法ごとの比べ方の表、TOTP を自分の環境で計算する方法、ログの見方の詳しい説明、出典17件は、サイトの記事にある。

[確認コードは、偽のサイトにも打ち込める。多要素認証の強さは、鍵がどのサイトに結びつくかで決まる（ムートン）](https://moutonarchive.com/mfa.html?utm_source=note&utm_medium=referral&utm_campaign=mfa)

## 参考文献

1. NIST（2025）SP 800-63B-4 Digital Identity Guidelines: Authentication and Authenticator Management。https://doi.org/10.6028/NIST.SP.800-63b-4
2. OWASP Cheat Sheet Series「Password Storage Cheat Sheet」。https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html
3. M'Raihi ほか（2005）RFC 4226 HOTP: An HMAC-Based One-Time Password Algorithm。https://www.rfc-editor.org/rfc/rfc4226
4. M'Raihi ほか（2011）RFC 6238 TOTP: Time-Based One-Time Password Algorithm。https://www.rfc-editor.org/rfc/rfc6238
5. MITRE ATT&CK「Multi-Factor Authentication Request Generation（T1621）」。https://attack.mitre.org/techniques/T1621/
6. W3C「Web Authentication: An API for accessing Public Key Credentials Level 3」。https://www.w3.org/TR/webauthn-3/
7. MITRE ATT&CK「Steal Web Session Cookie（T1539）」。https://attack.mitre.org/techniques/T1539/
8. CISA「Known Exploited Vulnerabilities Catalog」（CVE-2026-19868）。https://www.cisa.gov/known-exploited-vulnerabilities-catalog
