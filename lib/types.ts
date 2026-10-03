export type Epiphany = {
  slug: string;
  time: string;
  place: string;
  author: string;
  title?: string;
  /** 列表中显示的部分（HTML） */
  excerpt: string;
  /** 有 <!-- more --> 时可点进全文 */
  hasMore: boolean;
};

export type EpiphanyArticle = Epiphany & {
  /** 全文（HTML） */
  html: string;
};
