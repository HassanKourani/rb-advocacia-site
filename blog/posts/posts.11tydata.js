// Shared settings for every post in this folder.
// The page address comes from the file name: blog/posts/meu-artigo.md -> /blog/meu-artigo
module.exports = {
  layout: "post.njk",
  eleventyComputed: {
    permalink: (data) => (data.published === false ? false : `/blog/${data.page.fileSlug}.html`),
  },
};
