/**
 * 字体按职能分开，全部本地托管。
 *
 *   --f-display  IM Fell English   名字 · 署名（古典刻版斜体）
 *   --f-serif    EB Garamond       西文正文 · 导航 · 箴言
 *   --f-zh       朱雀仿宋          中文（构建时按全站文案裁剪为一个 WOFF2）
 *   --f-mono     Courier Prime     时间 · 出处（打字机，app/fonts，见 globals.css 顶部）
 */
import "@fontsource/im-fell-english/latin-400-italic.css";
import "@fontsource/eb-garamond/latin-400.css";
import "@fontsource/eb-garamond/latin-400-italic.css";
import "@/app/fonts/generated/zhuque.css";
