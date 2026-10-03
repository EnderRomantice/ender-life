import type { Locale } from "./config";

export * from "./config";

/** 界面文字。新增语言时照着补一份即可。 */
export const dictionaries = {
  zh: {
    nav: { epiphanies: "顿悟", media: "影像", about: "关于" },
    switchLabel: "EN",
    switchTitle: "Switch to English",
    more: "展开",
    contact: "联系",
    timeline: "时间线",
    fanHint: "按住上下滑动 · 松手跳转 · Esc 取消",
    fanHintTouch: "按住上下滑动 · 松手跳转",
    aboutTitle: "关于",
    rssTitle: "用 RSS 订阅",
    mediaEmpty: "这里还没有照片。",
    lightbox: { close: "关闭", prev: "上一张", next: "下一张", photo: "照片" },
  },
  en: {
    nav: { epiphanies: "Epiphanies", media: "Media", about: "About" },
    switchLabel: "中文",
    switchTitle: "切换到中文",
    more: "More",
    contact: "Contact",
    timeline: "Timeline",
    fanHint: "Hold and slide · Release to jump · Esc to cancel",
    fanHintTouch: "Hold and slide · Release to jump",
    aboutTitle: "About",
    rssTitle: "Subscribe via RSS",
    mediaEmpty: "No photos yet.",
    lightbox: { close: "Close", prev: "Previous", next: "Next", photo: "Photo" },
  },
} satisfies Record<Locale, unknown>;

export type Dictionary = (typeof dictionaries)["zh"];

export const getDictionary = (lang: Locale): Dictionary => dictionaries[lang];

/**
 * 地名：文章里写「城市 省份」（空格分隔），英文页逐个翻译后用逗号连接，
 * 例如「成都 四川」→「Chengdu, Sichuan」。查不到的词原样保留——写新地名时在这里补一行。
 */
const PLACES: Record<string, string> = {
  中国: "China",
  北京: "Beijing",
  上海: "Shanghai",
  天津: "Tianjin",
  重庆: "Chongqing",
  四川: "Sichuan",
  成都: "Chengdu",
  广汉: "Guanghan",
  南充: "Nanchong",
  绵阳: "Mianyang",
  乐山: "Leshan",
  云南: "Yunnan",
  大理: "Dali",
  昆明: "Kunming",
  丽江: "Lijiang",
  浙江: "Zhejiang",
  杭州: "Hangzhou",
  江苏: "Jiangsu",
  南京: "Nanjing",
  苏州: "Suzhou",
  广东: "Guangdong",
  广州: "Guangzhou",
  深圳: "Shenzhen",
  香港: "Hong Kong",
  澳门: "Macau",
  台湾: "Taiwan",
  台北: "Taipei",
  陕西: "Shaanxi",
  西安: "Xi’an",
  湖北: "Hubei",
  武汉: "Wuhan",
  湖南: "Hunan",
  长沙: "Changsha",
  福建: "Fujian",
  厦门: "Xiamen",
  西藏: "Tibet",
  拉萨: "Lhasa",
  日本: "Japan",
  东京: "Tokyo",
  京都: "Kyoto",
  大阪: "Osaka",
  美国: "USA",
  加州: "California",
  旧金山: "San Francisco",
  纽约: "New York",
};

export function localizePlace(place: string, lang: Locale): string {
  if (lang === "zh" || !place) return place;
  return place
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => PLACES[part] ?? part)
    .join(", ");
}
