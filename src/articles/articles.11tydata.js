export default {
  layout: 'article.njk',
  permalink: data => `${data.page.fileSlug}.html`,
  isArticle: true,
};
