/**
 * 极简 Markdown → HTML（无外部依赖）
 *
 * 块：段落（段内单个换行即换行）、# / ## / ### 标题、> 引用、--- 分隔线、
 *     - / 1. 列表、``` 代码块
 * 行内：**粗体**、*斜体*、***粗斜体***、~~删除线~~、`代码`、[链接](url)、![图片](url)、
 *     \* 转义；中文省略号「……」、破折号「——」各包一层 span，
 *     用来把点抬到中线、让破折号连成一条
 */

const esc = (s: string) =>
  s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

const ESCAPABLE = /\\([\\`*_{}\[\]()#+\-.!>~|])/g;

function inline(src: string): string {
  // 转义字符先换成占位符，最后还原
  const escaped: string[] = [];
  const s = src.replace(ESCAPABLE, (_, ch: string) => `\u0000${escaped.push(ch) - 1}\u0000`);

  const html = s
    .split(/(`[^`]+`)/)
    .map((part) => {
      if (/^`[^`]+`$/.test(part)) return `<code>${esc(part.slice(1, -1))}</code>`;
      return esc(part)
        .replace(/!\[([^\]]*)\]\(([^)\s]+)\)/g, '<img src="$2" alt="$1" loading="lazy">')
        .replace(/\[([^\]]+)\]\(([^)\s]+)\)/g, (_, text: string, href: string) =>
          /^https?:\/\//.test(href)
            ? `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`
            : `<a href="${href}">${text}</a>`,
        )
        .replace(/\*\*\*([^*]+)\*\*\*/g, "<strong><em>$1</em></strong>")
        .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
        .replace(/\*([^*\s](?:[^*]*[^*\s])?)\*/g, "<em>$1</em>")
        .replace(/~~([^~]+)~~/g, "<del>$1</del>")
        .replace(/\u2026{2,}/g, '<span class="ellip">$&</span>')
        .replace(/\u2014{2,}/g, '<span class="dash">$&</span>');
    })
    .join("");

  return html.replace(/\u0000(\d+)\u0000/g, (_, i: string) => esc(escaped[+i]));
}

const HEADING = /^(#{1,6})\s+(.*)$/;
const RULE = /^(-{3,}|\*{3,}|_{3,})\s*$/;
const QUOTE = /^>\s?/;
const ITEM = /^\s*([-*+]|\d+\.)\s+/;
const FENCE = /^```/;
const COMMENT = /^<!--.*-->$/;

export function markdown(src: string): string {
  const lines = src.replace(/\r\n?/g, "\n").split("\n");
  const out: string[] = [];
  let i = 0;

  const startsBlock = (l: string) =>
    HEADING.test(l) || RULE.test(l) || QUOTE.test(l) || ITEM.test(l) || FENCE.test(l) || COMMENT.test(l.trim());

  while (i < lines.length) {
    const line = lines[i];
    if (!line.trim() || COMMENT.test(line.trim())) {
      i++;
      continue;
    }

    let m: RegExpMatchArray | null;
    if ((m = line.match(HEADING))) {
      const level = Math.min(Math.max(2, m[1].length), 3); // h1 留给文章标题
      out.push(`<h${level}>${inline(m[2])}</h${level}>`);
      i++;
    } else if (RULE.test(line)) {
      out.push("<hr>");
      i++;
    } else if (FENCE.test(line)) {
      const buf: string[] = [];
      i++;
      while (i < lines.length && !FENCE.test(lines[i])) buf.push(lines[i++]);
      i++;
      out.push(`<pre><code>${esc(buf.join("\n"))}</code></pre>`);
    } else if (QUOTE.test(line)) {
      const buf: string[] = [];
      while (i < lines.length && QUOTE.test(lines[i])) buf.push(lines[i++].replace(QUOTE, ""));
      out.push(`<blockquote>${markdown(buf.join("\n"))}</blockquote>`);
    } else if (ITEM.test(line)) {
      const tag = /^\s*\d+\./.test(line) ? "ol" : "ul";
      const items: string[] = [];
      while (i < lines.length && ITEM.test(lines[i])) items.push(lines[i++].replace(ITEM, ""));
      out.push(`<${tag}>${items.map((t) => `<li>${inline(t)}</li>`).join("")}</${tag}>`);
    } else {
      const buf: string[] = [];
      while (i < lines.length && lines[i].trim() && !startsBlock(lines[i])) buf.push(lines[i++]);
      out.push(`<p>${buf.map(inline).join("<br>")}</p>`);
    }
  }
  return out.join("\n");
}
