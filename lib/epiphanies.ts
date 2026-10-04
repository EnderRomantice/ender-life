import fs from "node:fs";
import path from "node:path";
import { markdown } from "./markdown";
import { charWidth, split } from "./excerpt";
import { contentLang, htmlLang, localizePlace, locales, type Locale } from "./i18n";
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
 *
 * 译文：在原文旁边放同名加语言后缀的文件，只写正文即可——
 *
 *   2026-10-02-late-nights.md      中文原文
 *   2026-10-02-late-nights.en.md   英文译文
 *   2026-10-02-late-nights.ru.md   俄文译文
 *   2026-10-02-late-nights.ja.md   日文译文
 *
 * 日期、时间、地点都取原文的（地点会按界面语言翻译）；译文里也可以写 front matter
 * 的 title、<!-- more -->。某种语言没有译文时，那个语言下显示中文原文。
 */

const DIR = path.join(process.cwd(), "content", "epiphanies");
const MORE = /<!--\s*more\s*-->/i;
const TRANSLATION = new RegExp(`\\.(${locales.join("|")})\\.md$`);

/** 一种语言的正文 */
type Body = Pick<EpiphanyArticle, "title" | "excerpt" | "rest" | "cont" | "html" | "lang">;

type Entry = {
  slug: string;
  date: string;
  time: string;
  place: string;
  author: string;
  original: Body;
  translations: Partial<Record<Locale, Body>>;
};

function read(file: string): { meta: Record<string, string>; body: string } {
  const raw = fs.readFileSync(path.join(DIR, file), "utf8");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const meta: Record<string, string> = {};
  if (!m) return { meta, body: raw };
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return { meta, body: m[2] };
}

function render(meta: Record<string, string>, body: string, lang: string): Body {
  const [head, ...more] = body.split(MORE);
  const manual = more.join("\n\n").trim();
  const full = body.replace(MORE, "").trim();
  const parts = manual ? { head: head.trim(), rest: manual, cont: false } : split(full);
  return {
    title: meta.title || undefined,
    excerpt: markdown(parts.head),
    rest: parts.rest ? markdown(parts.rest) : null,
    cont: parts.cont,
    html: markdown(full),
    lang,
  };
}

function parse(file: string, files: Set<string>): Entry {
  const slug = file.replace(/\.md$/, "");
  const { meta, body } = read(file);
  const translations: Partial<Record<Locale, Body>> = {};
  for (const l of locales) {
    const name = `${slug}.${l}.md`;
    if (!files.has(name)) continue;
    const t = read(name);
    translations[l] = render(t.meta, t.body, htmlLang[l]);
  }
  return {
    slug,
    date: meta.date ?? "",
    time: meta.time ?? "",
    place: meta.place ?? "",
    author: meta.author ?? "",
    original: render(meta, body, contentLang),
    translations,
  };
}

let cached: Entry[] | null = null;

function all(): Entry[] {
  if (cached && process.env.NODE_ENV === "production") return cached;
  const files = fs.existsSync(DIR) ? fs.readdirSync(DIR).filter((f) => f.endsWith(".md")) : [];
  const names = new Set(files);
  cached = files
    .filter((f) => !TRANSLATION.test(f))
    .map((f) => parse(f, names))
    .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : 0));
  return cached;
}

/** 这种语言的正文：有译文用译文，没有就用原文 */
const bodyOf = (e: Entry, lang?: Locale): Body => (lang && e.translations[lang]) || e.original;

export const PAGE_SIZE = 6;

export function getEpiphanies(
  cursor = 0,
  lang?: Locale,
  limit = PAGE_SIZE,
): { items: Epiphany[]; nextCursor: number | null } {
  const list = all();
  const start = Math.max(0, cursor);
  const items = list.slice(start, start + limit).map((e): Epiphany => {
    const { title, excerpt, rest, cont, lang: bodyLang } = bodyOf(e, lang);
    return { slug: e.slug, time: e.time, place: e.place, author: e.author, title, excerpt, rest, cont, lang: bodyLang };
  });
  const next = start + limit;
  return { items, nextCursor: next < list.length ? next : null };
}

/** 单篇的固定链接（列表里不再跳转，但保留地址方便分享） */
export function getEpiphany(slug: string, lang?: Locale): EpiphanyArticle | null {
  const e = all().find((x) => x.slug === slug);
  if (!e) return null;
  return { slug: e.slug, time: e.time, place: e.place, author: e.author, ...bodyOf(e, lang) };
}

/** 截到大约 max 个汉字宽；西文不切断单词 */
function clip(text: string, max: number): string {
  const chars = [...text];
  let w = 0;
  let i = 0;
  for (; i < chars.length; i++) {
    w += charWidth(chars[i]);
    if (w > max) break;
  }
  if (i >= chars.length) return text;
  let cut = chars.slice(0, i).join("");
  const space = cut.lastIndexOf(" ");
  if (/[\p{L}\p{N}]$/u.test(cut) && /^[\p{L}\p{N}]/u.test(chars[i]) && space > cut.length * 0.6) {
    cut = cut.slice(0, space);
  }
  return `${cut.replace(/[\s,.;:，、；：]+$/, "")}…`;
}

/** 摘要的第一句左右，纯文本，给扇形时间轴里的预览用 */
function preview(html: string, max = 48): string {
  const text = html
    .replace(/<br\s*\/?>|<\/p>\s*<p>/g, "\u0001") // 换行 / 分段处
    .replace(/<[^>]+>/g, "")
    .replace(/&quot;/g, '"')
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&amp;/g, "&")
    // 断在中文标点后的直接接上，其余留一个空格
    .replace(/([，。！？；：、…」』）”])\s*\u0001\s*/g, "$1")
    .replace(/\s*\u0001\s*/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return clip(text, max);
}

/** 左侧时间刻度：所有条目的日期（不含正文），按时间倒序 */
export function getTimeline(lang: Locale): TimelineMark[] {
  return all().map((e) => {
    const m = e.date.match(/^(\d{4})-(\d{2})-(\d{2})/);
    const body = bodyOf(e, lang);
    return {
      slug: e.slug,
      label: m ? `${m[2]}.${m[3]}` : e.time,
      title: [e.time, localizePlace(e.place, lang)].filter(Boolean).join(" · "),
      preview: preview(body.excerpt),
      lang: body.lang,
    };
  });
}

/** 全部条目的中文原文（含全文与排序用的 date），给 RSS 用 */
export function getAllEpiphanies(): (EpiphanyArticle & { date: string })[] {
  return all().map((e) => ({ slug: e.slug, date: e.date, time: e.time, place: e.place, author: e.author, ...e.original }));
}
