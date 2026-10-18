// legal.html は、src/_data/legal.js の必要な欄がすべて埋まったときだけ作る。
export default {
  eleventyExcludeFromCollections: true,
  permalink: data => (data.legal && data.legal.ready ? 'legal.html' : false),
};
