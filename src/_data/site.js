import { waitlistReady } from '../../scripts/waitlist-readiness.mjs';

// サイト全体の設定。ここを書き換えて `npm run build` すると全ページに反映される。
export default {
  name: 'ムートン',
  // 公開しているアドレス。独自ドメインが決まったら置き換える（例: 'https://mouton.example'）。
  // 入れると canonical / og:url / sitemap.xml / robots.txt が出力される。
  url: 'https://moutonarchive.com/',
  description: 'MOUTON — Philosophy of Life。迷いながら哲学を自分の毎日で試している、ムートンの個人ブランド。キルケゴール、ニーチェ、スピノザの考えを、いまの悩みに当てて読む文章（PDF）。答えではなく、自分で考えて選ぶための材料を。',
  author: {
    name: 'ムートン',
    // X のユーザー名（@ なし）。2026-10-27 オーナー「このアカウントをサイトに紐づけしてほしい」で紐づけ、同日ユーザー名を moutonarchive に変えた（前は kodoku__alone → Ever7tt）
    x: 'moutonarchive',
    // Instagram のユーザー名（@ なし）。フッター・運営者情報・links.html に出る。
    // 休止中（2026-10-06〜）は空。再開するときは 'art.gagaga' に戻す。
    instagram: '',
    // note のユーザー名（note.com/ の後ろ）。入れるとフッター・運営者情報に出る。
    note: '',
    bio: '迷いながら、哲学を自分の毎日で試し、記録している一人です。先生ではありません。キルケゴール、ニーチェ、スピノザの考えを、いまの悩みに当てて読む文章を書いています。答えは書かず、原典にあたり、言えないことは言い切らない。それを守っています。',
  },
  // Google Search Console の「HTML タグ」で確認するときの content の値。空なら出さない。
  searchConsole: '',
  // Google アナリティクス 4 の測定ID（例: 'G-XXXXXXXXXX'）。空なら何も読み込まない。
  analytics: { ga4: 'G-CLF0SMB36X' },
  // AmazonアソシエイトのトラッキングID（例: 'mouton-22'）。
  // 入れると Amazon リンクにタグ・rel="sponsored"・「PR」表示が付き、広告の表記も出る。
  // 楽天アフィリエイトID（例: '1a2b3c4d.5e6f7a8b.1a2b3c4d.5e6f7a8b'）。入れると商品カードに楽天のボタンが出る。
  affiliate: { amazonTag: 'yuiga2003-22', rakutenId: '5844aa3f.402b05a0.5844aa40.481ea3b1' },
  // Google AdSense のパブリッシャーID（例: 'ca-pub-0000000000000000'）。入れると全ページに AdSense のコードと ads.txt が出る。adsenseSlot も入れると記事の末尾に広告枠を出す。
  ads: { adsenseClient: 'ca-pub-2111458982949833', adsenseSlot: '' },
  // メールマガジンの登録フォームの送信先。空なら登録欄を出さない。
  // 例（Buttondown）: action: 'https://buttondown.com/api/emails/embed-subscribe/ユーザー名', emailField: 'email'
  newsletter: {
    service: '', // プライバシーポリシーに載せるサービス名（例: 'Buttondown'）
    action: '',
    emailField: 'email',
    hidden: {},
    title: '新しい記事を、メールで受け取る',
    text: '記事を書いたときに、ときどきお知らせします。',
  },
  // BD-06: 先行案内は既定で完全停止。URLを設定しただけでは受付できない。
  // 有効化は公式の配信先、本人確認、配信停止、個人情報・送信者情報のレビュー後にのみ行う。
  prelaunch: (() => {
    const config = {
      enabled: false,
      provider: '',              // 初期実装は 'buttondown' のみを許可
      waitlistAction: '',        // 実際のButtondown embed-subscribeのHTTPS URL
      waitlistEmailField: 'email',
      waitlistService: '',       // 'Buttondown'
      doubleOptInVerified: false,
      unsubscribeVerified: false,
      privacyReviewed: false,
      senderDetailsVerified: false,
    };
    return { ...config, ready: waitlistReady(config) };
  })(),
  // 2026-10-14: 販売先はStripe。納品のE2Eが終わるまで本番決済は有効にしない。
  // checkoutUrl：確認済みStripe本番Payment Linkのみ設定。テスト用URLは禁止。空なら購入不可。
  // legalUrl：特定商取引法に基づく表示のページ。checkoutUrl を入れるときは必須（npm test で確かめる）。
  product: {
    cleanScience: { priceJPY: 2980, priceText: '2,980', pages: 75, checkoutProvider: 'stripe', checkoutUrl: '', legalUrl: '', fulfillmentReady: false },
    // 哲学の有料記事3本（paid-*.html）。note ではなくこのサイトで販売する（Stripe → Cloudflare Worker → メールで PDF）。
    // 各記事の Payment Link は記事の front matter `paid.checkoutUrl`。納品の E2E が終わるまで fulfillmentReady は false のまま。
    philosophy: { priceJPY: 2980, checkoutProvider: 'stripe', legalUrl: '', fulfillmentReady: false },
  },
  // お問い合わせ先。空でないものだけページに表示する。
  contact: { formUrl: '', email: '', x: 'moutonarchive' },
  // 運営者情報・プライバシーポリシーの制定日
  policyDate: '2026-10-05',
};
