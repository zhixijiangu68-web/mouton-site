// サイト全体の設定。ここを書き換えて `npm run build` すると全ページに反映される。
export default {
  name: 'ムートン',
  // 公開しているアドレス。独自ドメインが決まったら置き換える（例: 'https://mouton.example'）。
  // 入れると canonical / og:url / sitemap.xml / robots.txt が出力される。
  url: 'https://moutonarchive.com/',
  description: 'ムートンの個人的な制作と記録の場所。哲学・生き方、身体、食事と科学についての記事と、おすすめの本。',
  author: {
    name: 'ムートン',
    x: 'kodoku__alone',
    // Instagram のユーザー名（@ なし）。フッター・運営者情報・links.html に出る。
    instagram: 'art.gagaga',
    bio: '興味を持ったことを試し、作り、その過程を残しています。哲学や生き方のこと、身体と食事のことを、論文やデータにあたりながら書いています。',
  },
  // Google Search Console の「HTML タグ」で確認するときの content の値。空なら出さない。
  searchConsole: '',
  // Google アナリティクス 4 の測定ID（例: 'G-XXXXXXXXXX'）。空なら何も読み込まない。
  analytics: { ga4: '' },
  // AmazonアソシエイトのトラッキングID（例: 'mouton-22'）。
  // 入れると Amazon リンクにタグ・rel="sponsored"・「PR」表示が付き、広告の表記も出る。
  // 楽天アフィリエイトID（例: '1a2b3c4d.5e6f7a8b.1a2b3c4d.5e6f7a8b'）。入れると商品カードに楽天のボタンが出る。
  affiliate: { amazonTag: 'yuiga2003-22', rakutenId: '' },
  // Google AdSense のパブリッシャーID（例: 'ca-pub-0000000000000000'）。記事ページにだけ広告枠を出す。
  ads: { adsenseClient: '', adsenseSlot: '' },
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
  // お問い合わせ先。空でないものだけページに表示する。
  contact: { formUrl: '', email: '', x: 'kodoku__alone' },
  // 運営者情報・プライバシーポリシーの制定日
  policyDate: '2026-10-05',
};
