/**
 * 自动截断：列表里只显示前约 120 字，其余点 More 原地展开。
 *
 * - 按「字」计：汉字/全角 1，西文字母、数字、空格 0.5（视觉宽度约为汉字一半），图片记 60
 * - 优先在段落之间截断，不切断句子
 * - 截完剩下不到 60 字就不截了，免得点开只多一两句
 * - 单段特别长时，退而在段内换行处、再不行在句末截断
 * - 正文里写了 <!-- more --> 时以它为准（在 epiphanies.ts 里处理）
 */

export const EXCERPT = 120;
export const MIN_REST = 60;
export const MAX_HEAD = 200;
const IMAGE = 60;

const CJK =
  /[⺀-⿿　-〿぀-ヿ㄀-ㇿ㐀-䶿一-鿿豈-﫿︰-﹏＀-￯]/;
const BLOCK_START = /^(#{1,6}\s|>|\s*([-*+]|\d+\.)\s|```|(-{3,}|\*{3,}|_{3,})\s*$)/;
const SENTENCE_END = /(?:[。！？；…]|[.!?;](?=[\s"')]|$))+[”’」』"')）]*/g;

export function weight(md: string): number {
  const text = md
    .replace(/<!--[\s\S]*?-->/g, "")
    .replace(/!\[[^\]]*\]\([^)]*\)/g, "\u0001")
    .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1")
    .replace(/^\s*(#{1,6}|>|[-*+]|\d+\.)\s+/gm, "")
    .replace(/[*_~`\\]/g, "");
  let w = 0;
  for (const ch of text) {
    if (ch === "\n") continue;
    w += ch === "\u0001" ? IMAGE : CJK.test(ch) ? 1 : 0.5;
  }
  return w;
}

/** 按空行切块；代码块内部的空行不算 */
function blocks(src: string): string[] {
  const out: string[] = [];
  let buf: string[] = [];
  let fence = false;
  for (const line of src.split("\n")) {
    if (/^```/.test(line)) fence = !fence;
    if (!fence && !line.trim()) {
      if (buf.length) out.push(buf.join("\n"));
      buf = [];
    } else buf.push(line);
  }
  if (buf.length) out.push(buf.join("\n"));
  return out;
}

/** 纯文字段落（没有标题、引用、列表、代码块）才允许在段内截断 */
const plain = (block: string) => block.split("\n").every((l) => !BLOCK_START.test(l));

/** 行内标记是否成对，避免把 **粗体** 或 [链接](url) 切成两半 */
function balanced(s: string): boolean {
  const t = s.replace(/\\./g, "");
  const n = (re: RegExp) => (t.match(re) ?? []).length;
  return (
    n(/`/g) % 2 === 0 &&
    n(/\*/g) % 2 === 0 &&
    n(/~~/g) % 2 === 0 &&
    n(/\[/g) === n(/\]/g) &&
    n(/\(/g) === n(/\)/g)
  );
}

function splitLine(line: string, need: number): [string, string] | null {
  for (const m of line.matchAll(SENTENCE_END)) {
    const end = m.index! + m[0].length;
    const head = line.slice(0, end);
    const tail = line.slice(end).trim();
    if (!tail) return null;
    if (weight(head) >= need && balanced(head)) return [head, tail];
  }
  return null;
}

function splitBlock(block: string, need: number): [string, string] | null {
  const lines = block.split("\n");
  const at = (k: number): [string, string] | null =>
    k > 0 && k < lines.length ? [lines.slice(0, k).join("\n"), lines.slice(k).join("\n")] : null;

  let acc = 0;
  for (let k = 0; k < lines.length; k++) {
    const w = weight(lines[k]);
    if (acc + w >= need) {
      if (acc + w <= need + (MAX_HEAD - EXCERPT)) return at(k + 1);
      // 这一行本身就很长：在句末截断
      const s = splitLine(lines[k], need - acc);
      if (s) return [[...lines.slice(0, k), s[0]].join("\n"), [s[1], ...lines.slice(k + 1)].join("\n")];
      return acc >= need / 2 ? at(k) : at(k + 1);
    }
    acc += w;
  }
  return null;
}

export type Split = {
  head: string;
  rest: string | null;
  /** 截断点在段落中间：展开后的第一行紧接上文换行，而不是另起一段 */
  cont: boolean;
};

export function split(src: string): Split {
  const whole: Split = { head: src, rest: null, cont: false };
  const bs = blocks(src);
  const ws = bs.map(weight);
  if (ws.reduce((a, b) => a + b, 0) < EXCERPT + MIN_REST) return whole;

  const join = (xs: string[]) => xs.join("\n\n");
  let acc = 0;
  for (let i = 0; i < bs.length; i++) {
    if (acc + ws[i] < EXCERPT) {
      acc += ws[i];
      continue;
    }
    const before = bs.slice(0, i);
    const after = bs.slice(i + 1);
    let res: Split = { head: join([...before, bs[i]]), rest: join(after), cont: false };

    if (acc + ws[i] > MAX_HEAD) {
      if (acc >= EXCERPT / 2) {
        // 前面已经够一段读的了，长段整段留到展开里
        res = { head: join(before), rest: join([bs[i], ...after]), cont: false };
      } else if (plain(bs[i])) {
        const inner = splitBlock(bs[i], EXCERPT - acc);
        if (inner) res = { head: join([...before, inner[0]]), rest: join([inner[1], ...after]), cont: true };
      }
    }
    return res.rest && weight(res.rest) >= MIN_REST ? res : whole;
  }
  return whole;
}
