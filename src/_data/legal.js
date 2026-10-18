// 特定商取引法に基づく表記（legal.html）・返品の条件・購入者向けのお問い合わせ。
// オーナーの情報なので、AI は値を書き込まない。必要な欄がすべて埋まるまで legal.html は作られない（公開されない）。
// 埋めたら、src/_data/site.js の product.*.legalUrl に 'https://moutonarchive.com/legal.html' を入れる。
const legal = {
  // 販売事業者。個人は戸籍上の氏名（屋号だけは不可。屋号を併記するのはよい）
  seller: '',
  // 運営責任者（個人なら上と同じ氏名でよい）
  manager: '',
  // 所在地と電話番号。discloseOnRequest を true にすると、ページには「請求があれば遅滞なく開示します」と出して省略する
  // （請求があったら、実際に遅滞なく開示する必要がある。条件は消費者庁の通信販売のページで確かめる）
  address: '',
  phone: '',
  discloseOnRequest: true, // 2026-10-16 オーナー決定：住所・電話番号は請求があれば開示
  // 購入者向けのお問い合わせメール（返信できるもの）と、受付・返信の目安（例：'メールは24時間受付。返信は2営業日以内'）
  email: '',
  hours: '',
  // 支払方法。Stripe の決済画面で実際に選べるものと一致させる（例：'クレジットカード（Visa・Mastercard・American Express・JCB）'）
  payMethods: '',
  refund: {
    // 'none'：お支払い後の返品・返金なし（下の例外は対応する）／'days'：購入から days 日以内は理由を問わず返金
    policy: 'none', // 2026-10-16 オーナー決定：基本は返金なし。重複購入は返金で対応
    days: 0,
    // 例外（重複購入・メールが届かない・ファイルが開けない）の連絡期限（日）
    contactDays: 30,
  },
};
legal.ready = Boolean(
  legal.seller && legal.manager && legal.email && legal.hours && legal.payMethods &&
  (legal.discloseOnRequest || (legal.address && legal.phone)) &&
  (legal.refund.policy === 'none' || (legal.refund.policy === 'days' && legal.refund.days > 0))
);
export default legal;
