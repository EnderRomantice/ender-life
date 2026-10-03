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
      "我是 Ender，一名全栈开发实习生，现居中国成都。我曾为旧金山，西雅图，北京等国际化城市的初创公司工作。我很喜欢 remote，并且未来预期会保持这种工作方式。",
      "技术上面，我最常用 React, TypeScript。个人审美上 Go 和 Rust 都符合预期，TS 很优雅，所以我特别喜欢。",
      "我擅长构建 AI Agent 应用，特别是融入 Agent 到现有工作流程，我叫它 AI-\u2060Power。我也参与构建过 AI native 的组织，关于这一点我有许多想法，很愿意和任何人聊聊。",
      "我热爱任何形式的设计和美学，包括但不限于，网页设计，服装设计，音乐美学。我最喜欢的是实验摇滚与爵士乐（纯爵士会特别喜欢一些）。我也喜欢时尚、阅读和开源。",
      "我对食物很有自己的看法。每到一座城市，我都会去找藏在角落里的好味道——尽管我挑食得厉害，这多少有点矛盾。",
      "我相信人生有无限可能，也给自己定了不少目标。在技术上，我的目标是做出真正被人喜爱、被人使用的开源项目。",
      "这里是我写下想法的地方，你愿意的话，叫它博客也行。如果这里有什么能帮到你、给你一点启发，我会深感荣幸。",
      `想一起喝杯咖啡吗？线上线下都行，随时欢迎！[给我发封邮件](mailto:${email})就好。`,
    ],
    en: [
      "I’m Ender, a full-stack development intern based in Chengdu, China. I’ve worked for startups in international cities such as San Francisco, Seattle, and Beijing. I love working remotely, and I expect to keep working this way in the future.",
      "In tech, I mostly work with React and TypeScript. Aesthetically, Go and Rust both live up to my expectations, and TypeScript is so elegant that it’s my particular favorite.",
      "I’m good at building AI agent applications, especially weaving agents into existing workflows. I call it AI-\u2060Power. I’ve also helped build an AI-native organization; I have a lot of thoughts on that, and I’d love to talk about it with anyone.",
      "I love design and aesthetics in every form, including but not limited to web design, fashion design, and the aesthetics of music. My favorites are experimental rock and jazz (I have a special soft spot for pure jazz). I’m also into fashion, reading, and open source.",
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
