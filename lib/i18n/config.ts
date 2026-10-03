/** 站点支持的语言。只翻译网站本身（导航、介绍、地名等），文章原文不翻译。 */
export const locales = ["zh", "en", "ru", "ja"] as const;
export type Locale = (typeof locales)[number];

/** 语言菜单里显示的名字：用各自的语言写 */
export const localeNames: Record<Locale, string> = {
  zh: "中文",
  en: "English",
  ru: "Русский",
  ja: "日本語",
};

/** 浏览器语言都不在支持范围内时，用英文 */
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
export const htmlLang: Record<Locale, string> = { zh: "zh-CN", en: "en", ru: "ru", ja: "ja" };

/** 文章原文的语言（只翻译界面，不翻译文章） */
export const contentLang = "zh-CN";

const LOCALE_PREFIX = new RegExp(`^/(${locales.join("|")})(?=/|$)`);

/** 去掉路径里的语言前缀：/ja/about → /about */
export const stripLocale = (pathname: string) => pathname.replace(LOCALE_PREFIX, "") || "/";

/** 把站内路径换成另一种语言：/zh/about → /en/about */
export function switchLocalePath(pathname: string, to: Locale): string {
  const rest = stripLocale(pathname);
  return `/${to}${rest === "/" ? "" : rest}`;
}
