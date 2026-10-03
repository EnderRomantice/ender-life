/** 站点支持的语言。只翻译网站本身（导航、介绍、地名等），文章原文不翻译。 */
export const locales = ["zh", "en"] as const;
export type Locale = (typeof locales)[number];

/** 浏览器语言既不是中文也不是英文时，用英文 */
export const fallbackLocale: Locale = "en";

export const isLocale = (value: string | undefined | null): value is Locale =>
  !!value && (locales as readonly string[]).includes(value);

/** 按 Accept-Language 的优先级挑一个支持的语言 */
export function negotiate(header: string | null): Locale {
  if (!header) return fallbackLocale;
  const ranked = header
    .split(",")
    .map((part) => {
      const [tag, ...params] = part.trim().toLowerCase().split(";");
      const q = params.find((p) => p.trim().startsWith("q="));
      return { tag, q: q ? Number(q.trim().slice(2)) || 0 : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { tag } of ranked) {
    const base = tag.split("-")[0];
    if (isLocale(base)) return base;
  }
  return fallbackLocale;
}

/** html 的 lang 属性 */
export const htmlLang: Record<Locale, string> = { zh: "zh-CN", en: "en" };

/** 把站内路径换成另一种语言：/zh/about → /en/about */
export function switchLocalePath(pathname: string, to: Locale): string {
  const rest = pathname.replace(/^\/(zh|en)(?=\/|$)/, "");
  return `/${to}${rest}`;
}
