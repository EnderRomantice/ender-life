export type Epiphany = {
  slug: string;
  time: string;
  place: string;
  author: string;
  title?: string;
  /** 列表中显示的部分（HTML） */
  excerpt: string;
  /** 截断后剩余的部分（HTML），点 More 原地展开；不截断时为 null */
  rest: string | null;
  /** 截断点在段落中间，展开部分紧接上一行 */
  cont: boolean;
};

export type EpiphanyArticle = Epiphany & {
  /** 全文（HTML） */
  html: string;
};

/** 左侧时间刻度上的一格 */
export type TimelineMark = { slug: string; label: string; title: string };
