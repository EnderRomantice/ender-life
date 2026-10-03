import fs from "node:fs";
import path from "node:path";
import { markdown } from "./markdown";
import { split } from "./excerpt";
import type { Epiphany, EpiphanyArticle, TimelineMark } from "./types";

/**
 * 每条 Epiphany 是 content/epiphanies 下的一个 .md 文件：
 *
 *   ---
 *   date: 2026-10-02T05:31     排序用
 *   time: 2026-10-2 5:31 AM    显示的时间（随意写）
 *   place: 成都 四川           显示的位置，单独一行（随意写）
 *   author: Ender
 *   title: ……                  可选，只在全文页显示
 *   ---
 *   正文……
 *   <!-- more -->              可选：手动指定截断位置；不写则自动在约 120 字处截断（见 excerpt.ts）
 *   其余……                     列表里点 More 原地展开
 */

const DIR = path.join(process.cwd(), "content", "epiphanies");
const MORE = /<!--\s*more\s*-->/i;

type Entry = EpiphanyArticle & { date: string };

function parse(file: string): Entry {
  const raw = fs.readFileSync(path.join(DIR, file), "utf8");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const meta: Record<string, string> = {};
  let body = raw;
  if (m) {
    for (const line of m[1].split(/\r?\n/)) {
      const i = line.indexOf(":");
      if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
    }
    body = m[2];
  }
  const [head, ...more] = body.split(MORE);
  const manual = more.join("\n\n").trim();
  const full = body.replace(MORE, "").trim();
  const parts = manual ? { head: head.trim(), rest: manual, cont: false } : split(full);
  return {
    slug: file.replace(/\.md$/, ""),
    date: meta.date ?? "",
    time: meta.time ?? "",
    place: meta.place ?? "",
    author: meta.author ?? "",
    title: meta.title || undefined,
    excerpt: markdown(parts.head),
    rest: parts.rest ? markdown(parts.rest) : null,
    cont: parts.cont,
    html: markdown(full),
  };
}

let cached: Entry[] | null = null;

function all(): Entry[] {
  if (cached && process.env.NODE_ENV === "production") return cached;
  const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith(".md")) : [];
  cached = files.map(parse).sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return cached;
}

export const PAGE_SIZE = 6;

export function getEpiphanies(cursor = 0, limit = PAGE_SIZE): { items: Epiphany[]; nextCursor: number | null } {
  const list = all();
  const start = Math.max(0, cursor);
  const items = list.slice(start, start + limit).map(({ slug, time, place, author, title, excerpt, rest, cont }) => ({
    slug,
    time,
    place,
    author,
    title,
    excerpt,
    rest,
    cont,
  }));
  const next = start + limit;
  return { items, nextCursor: next < list.length ? next : null };
}

/** 单篇的固定链接（列表里不再跳转，但保留地址方便分享） */
export function getEpiphany(slug: string): EpiphanyArticle | null {
  return all().find((x) => x.slug === slug) ?? null;
}

/** 左侧时间刻度：所有条目的日期（不含正文），按时间倒序 */
export function getTimeline(): TimelineMark[] {
  return all().map((e) => {
    const m = e.date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    return {
      slug: e.slug,
      label: m ? `${m[2]}.${m[3]}` : e.time,
      title: [e.time, e.place].filter(Boolean).join(" · "),
    };
  });
}
