/**
 * 字体按职能分开，全部本地托管。
 *
 *   --f-display  IM Fell English   名字 · 署名（古典刻版斜体）
 *   --f-serif    EB Garamond       西文正文 · 导航 · 箴言（含俄文的西里尔字母）
 *   --f-zh       朱雀仿宋          中文（构建时按全站文案裁剪为一个 WOFF2）
 *   Zen Old Mincho                日文界面的假名、日文汉字（按 unicode-range 分片，用到才下载）
 *   --f-mono     Courier Prime     时间 · 出处（打字机，app/fonts，见 globals.css 顶部）
 */
import "@fontsource/im-fell-english/latin-400-italic.css";
// 全部子集（拉丁、西里尔等）都带 unicode-range，页面用到哪个字符才下载哪个分片；
// 中文页面只会下载拉丁，俄文页面再加上西里尔
import "@fontsource/eb-garamond/400.css";
import "@fontsource/eb-garamond/400-italic.css";
import "@fontsource/zen-old-mincho/400.css";
import "@/app/fonts/generated/zhuque.css";
