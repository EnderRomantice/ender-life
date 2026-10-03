import { getAllEpiphanies } from "@/lib/epiphanies";
import { site } from "@/lib/site";

/**
 * RSS 2.0：/feed.xml
 * 订阅器（Feedly、Reeder、NetNewsWire……）填这个地址即可；页面 <head> 里也有自动发现的链接。
 * 文章原文是中文，链接指向中文版页面。
 */
export const dynamic = "force-dynamic";

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const cdata = (s: string) => `<![CDATA[${s.replace(/]]>/g, "]]]]><![CDATA[>")}]]>`;

/** 文章里的 date 没写时区，按北京时间（+08:00）处理 */
function rfc822(date: string): string {
  const d = new Date(/[zZ]|[+-]\d\d:?\d\d$/.test(date) ? date : `${date.length <= 10 ? `${date}T00:00` : date}+08:00`);
  return Number.isNaN(d.getTime()) ? new Date().toUTCString() : d.toUTCString();
}

/** 没有标题的条目用正文第一句当标题 */
function titleOf(html: string, title?: string): string {
  if (title) return title;
  const text = html
    .replace(/<br\s*\/?>|<\/p>/g, "\n")
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    .trim();
  const first = text.split("\n")[0].trim();
  return [...first].length > 40 ? `${[...first].slice(0, 40).join("")}…` : first;
}

export function GET(req: Request) {
  const origin = (process.env.SITE_URL ?? new URL(req.url).origin).replace(/\/$/, "");
  const entries = getAllEpiphanies();

  const items = entries
    .map((e) => {
      const link = `${origin}/zh/epiphanies/${e.slug}`;
      const meta = [e.time, e.place].filter(Boolean).join(" · ");
      return `    <item>
      <title>${esc(titleOf(e.html, e.title))}</title>
      <link>${link}</link>
      <guid isPermaLink="true">${link}</guid>
      <pubDate>${rfc822(e.date)}</pubDate>
      <author>${esc(`${site.email} (${site.name})`)}</author>
      <description>${cdata(`${meta ? `<p><small>${esc(meta)}</small></p>` : ""}${e.html}`)}</description>
    </item>`;
    })
    .join("\n");

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>${esc(site.name)}</title>
    <link>${origin}/zh</link>
    <atom:link href="${origin}/feed.xml" rel="self" type="application/rss+xml" />
    <description>${esc(`${site.name} 的顿悟：一些想法与片段 / Epiphanies`)}</description>
    <language>zh-CN</language>
    ${entries[0] ? `<lastBuildDate>${rfc822(entries[0].date)}</lastBuildDate>` : ""}
${items}
  </channel>
</rss>
`;

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
      "Cache-Control": "public, s-maxage=3600, stale-while-revalidate=86400",
    },
  });
}
