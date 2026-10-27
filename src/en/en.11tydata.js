// English edition (moutonarchive.com/en/). Pages here are written to en/ and
// reach the shared CSS, scripts and images one level up.
export default {
  lang: 'en',
  root: '../',
  // 英語版を休んでいるあいだ（site.english が false）は検索に出さない
  eleventyComputed: { noindex: data => data.noindex || !data.site.english },
};
