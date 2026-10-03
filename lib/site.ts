export type Verse = {
  text: string;
  source?: string;
};

const email = "enderromantic@gmail.com";

export const site = {
  name: "Ender",
  /** 箴言（显示时自动加引号、斜体）；留空则不显示 */
  motto: "",
  /** 放一张照片到 public/，例如 "/avatar.jpg"；为空时显示首字母 */
  avatar: "/avatar.jpg",
  /** 简介：每段一项，中英文各一份；支持 Markdown 行内语法（链接、强调等） */
  bio: {
    zh: [
      "我是 Ender，一名前端开发实习生，人在中国成都，远程为旧金山的一家 AI 初创公司工作。",
      "我热爱音乐，尤其是实验摇滚；也喜欢时尚、阅读和开源。",
      "我对食物很有自己的看法。每到一座城市，我都会去找藏在角落里的好味道——尽管我挑食得厉害，这多少有点矛盾。",
      "我相信人生有无限可能，也给自己定了不少目标。在技术上，我的目标是做出真正被人喜爱、被人使用的开源项目。",
      "这里是我写下想法的地方，你愿意的话，叫它博客也行。如果这里有什么能帮到你、给你一点启发，我会深感荣幸。",
      `想一起喝杯咖啡吗？线上线下都行，随时欢迎！[给我发封邮件](mailto:${email})就好。`,
    ],
    en: [
      "I’m Ender, a front-end development intern based in Chengdu, China, working remotely for an AI startup in San Francisco.",
      "I love music, especially experimental rock. I’m also into fashion, reading, and open source.",
      "I have strong opinions about food. I’m always hunting for hidden gems in every city I visit, even though I’m incredibly picky, which is a bit of a contradiction.",
      "I believe life holds endless possibilities, and I have plenty of goals. In tech, mine is to build open-source projects that people genuinely love and use.",
      "This site is where I write down my thoughts; call it a blog, if you like. If anything here helps or inspires you, I’d be truly honored.",
      `Want to grab a coffee, virtual or in person? Anytime! Just [drop me an email](mailto:${email}).`,
    ],
  },
  email,
  github: "EnderRomantice",
  /** 关于我（长段落 / 诗）：每段一项，段内换行用 \n */
  intro: [] as Verse[],
};
