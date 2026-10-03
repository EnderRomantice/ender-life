import type { Locale } from "./config";

export * from "./config";

/** 界面文字。新增语言时照着补一份即可。 */
export const dictionaries = {
  zh: {
    nav: { epiphanies: "顿悟", media: "影像", about: "关于" },
    language: "语言",
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
    language: "Language",
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
  ru: {
    nav: { epiphanies: "Озарения", media: "Снимки", about: "Обо мне" },
    language: "Язык",
    more: "Ещё",
    contact: "Контакты",
    timeline: "Хронология",
    fanHint: "Удерживайте и ведите · Отпустите, чтобы перейти · Esc — отмена",
    fanHintTouch: "Удерживайте и ведите · Отпустите, чтобы перейти",
    aboutTitle: "Обо мне",
    rssTitle: "Подписаться через RSS",
    mediaEmpty: "Здесь пока нет фотографий.",
    lightbox: { close: "Закрыть", prev: "Предыдущая", next: "Следующая", photo: "Фото" },
  },
  ja: {
    nav: { epiphanies: "気づき", media: "写真", about: "自己紹介" },
    language: "言語",
    more: "続きを読む",
    contact: "連絡先",
    timeline: "タイムライン",
    fanHint: "押したまま上下にスライド · 離すと移動 · Esc でキャンセル",
    fanHintTouch: "押したまま上下にスライド · 離すと移動",
    aboutTitle: "自己紹介",
    rssTitle: "RSS で購読",
    mediaEmpty: "まだ写真はありません。",
    lightbox: { close: "閉じる", prev: "前へ", next: "次へ", photo: "写真" },
  },
} satisfies Record<Locale, unknown>;

export type Dictionary = (typeof dictionaries)["zh"];

export const getDictionary = (lang: Locale): Dictionary => dictionaries[lang];

/**
 * 地名：文章里写「城市 省份」（空格分隔），其他语言逐个翻译，
 * 例如「成都 四川」→ 英文「Chengdu, Sichuan」、俄文「Чэнду, Сычуань」、日文「成都 四川」。
 * 查不到的词原样保留——写新地名时在这里补一行。
 */
type PlaceNames = { en: string; ru: string; ja: string };

const PLACES: Record<string, PlaceNames> = {
  中国: { en: "China", ru: "Китай", ja: "中国" },
  北京: { en: "Beijing", ru: "Пекин", ja: "北京" },
  上海: { en: "Shanghai", ru: "Шанхай", ja: "上海" },
  天津: { en: "Tianjin", ru: "Тяньцзинь", ja: "天津" },
  重庆: { en: "Chongqing", ru: "Чунцин", ja: "重慶" },
  四川: { en: "Sichuan", ru: "Сычуань", ja: "四川" },
  成都: { en: "Chengdu", ru: "Чэнду", ja: "成都" },
  广汉: { en: "Guanghan", ru: "Гуанхань", ja: "広漢" },
  南充: { en: "Nanchong", ru: "Наньчун", ja: "南充" },
  绵阳: { en: "Mianyang", ru: "Мяньян", ja: "綿陽" },
  乐山: { en: "Leshan", ru: "Лэшань", ja: "楽山" },
  云南: { en: "Yunnan", ru: "Юньнань", ja: "雲南" },
  大理: { en: "Dali", ru: "Дали", ja: "大理" },
  昆明: { en: "Kunming", ru: "Куньмин", ja: "昆明" },
  丽江: { en: "Lijiang", ru: "Лицзян", ja: "麗江" },
  浙江: { en: "Zhejiang", ru: "Чжэцзян", ja: "浙江" },
  杭州: { en: "Hangzhou", ru: "Ханчжоу", ja: "杭州" },
  江苏: { en: "Jiangsu", ru: "Цзянсу", ja: "江蘇" },
  南京: { en: "Nanjing", ru: "Нанкин", ja: "南京" },
  苏州: { en: "Suzhou", ru: "Сучжоу", ja: "蘇州" },
  广东: { en: "Guangdong", ru: "Гуандун", ja: "広東" },
  广州: { en: "Guangzhou", ru: "Гуанчжоу", ja: "広州" },
  深圳: { en: "Shenzhen", ru: "Шэньчжэнь", ja: "深圳" },
  香港: { en: "Hong Kong", ru: "Гонконг", ja: "香港" },
  澳门: { en: "Macau", ru: "Макао", ja: "マカオ" },
  台湾: { en: "Taiwan", ru: "Тайвань", ja: "台湾" },
  台北: { en: "Taipei", ru: "Тайбэй", ja: "台北" },
  陕西: { en: "Shaanxi", ru: "Шэньси", ja: "陝西" },
  西安: { en: "Xi’an", ru: "Сиань", ja: "西安" },
  湖北: { en: "Hubei", ru: "Хубэй", ja: "湖北" },
  武汉: { en: "Wuhan", ru: "Ухань", ja: "武漢" },
  湖南: { en: "Hunan", ru: "Хунань", ja: "湖南" },
  长沙: { en: "Changsha", ru: "Чанша", ja: "長沙" },
  福建: { en: "Fujian", ru: "Фуцзянь", ja: "福建" },
  厦门: { en: "Xiamen", ru: "Сямынь", ja: "厦門" },
  西藏: { en: "Tibet", ru: "Тибет", ja: "チベット" },
  拉萨: { en: "Lhasa", ru: "Лхаса", ja: "ラサ" },
  日本: { en: "Japan", ru: "Япония", ja: "日本" },
  东京: { en: "Tokyo", ru: "Токио", ja: "東京" },
  京都: { en: "Kyoto", ru: "Киото", ja: "京都" },
  大阪: { en: "Osaka", ru: "Осака", ja: "大阪" },
  美国: { en: "USA", ru: "США", ja: "アメリカ" },
  加州: { en: "California", ru: "Калифорния", ja: "カリフォルニア" },
  旧金山: { en: "San Francisco", ru: "Сан-Франциско", ja: "サンフランシスコ" },
  西雅图: { en: "Seattle", ru: "Сиэтл", ja: "シアトル" },
  纽约: { en: "New York", ru: "Нью-Йорк", ja: "ニューヨーク" },
};

export function localizePlace(place: string, lang: Locale): string {
  if (lang === "zh" || !place) return place;
  const parts = place
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => PLACES[part]?.[lang] ?? part);
  // 日文沿用中文的「城市 省份」写法，其余用逗号连接
  return parts.join(lang === "ja" ? " " : ", ");
}
