// Builds the blog. The home page (index.html), CSS, JS and assets are copied as they are;
// only the blog pages (Markdown posts and .njk templates) are generated.
// Posts live in blog/posts/*.md and are written through Pages CMS (see .pages.yml).

const dateFmt = new Intl.DateTimeFormat("pt-BR", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" });

export default function (config) {
  for (const p of ["index.html", "css", "js", "assets", "robots.txt"]) config.addPassthroughCopy(p);

  config.ignores.add("README.md");
  config.ignores.add("api/**");
  config.ignores.add("node_modules/**");

  // Published posts, newest first. A post with "published: false" is a draft: no page, not listed.
  config.addCollection("posts", (api) =>
    api
      .getFilteredByGlob("blog/posts/*.md")
      .filter((p) => p.data.published !== false)
      .sort((a, b) => b.date - a.date)
  );

  config.addFilter("dataBR", (d) => dateFmt.format(new Date(d)));
  config.addFilter("isoDate", (d) => new Date(d).toISOString().slice(0, 10));
  config.addFilter("absUrl", (path, base) => new URL(path, base).href);
  // Vercel serves blog/x.html at /blog/x (cleanUrls), so links and canonicals drop ".html"
  config.addFilter("cleanUrl", (u) => u.replace(/\/index\.html$/, "").replace(/\.html$/, "") || "/");

  return {
    dir: { input: ".", output: "_site", includes: "_includes", data: "_data" },
    templateFormats: ["md", "njk"],
    markdownTemplateEngine: false,
  };
}
