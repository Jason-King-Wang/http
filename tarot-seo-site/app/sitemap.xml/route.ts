import { spreads } from "../data/tarot";

const staticPaths = ["", "/about", "/editorial-policy", "/privacy", "/terms", "/contact", "/guides/tarot-question-guide", "/guides/upright-reversed", "/guides/tarot-spreads-guide"];

export function GET(request: Request) {
  const origin = process.env.SITE_URL || new URL(request.url).origin;
  const paths = [...staticPaths, ...spreads.map((spread) => `/${spread.slug}`)];
  const today = new Date().toISOString().slice(0, 10);
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${paths.map((path) => `  <url><loc>${origin}${path || "/"}</loc><lastmod>${today}</lastmod><changefreq>${path === "" ? "weekly" : "monthly"}</changefreq><priority>${path === "" ? "1.0" : path.startsWith("/guides") ? "0.7" : "0.8"}</priority></url>`).join("\n")}\n</urlset>`;
  return new Response(body, { headers: { "content-type": "application/xml; charset=utf-8", "cache-control": "public, max-age=3600" } });
}
