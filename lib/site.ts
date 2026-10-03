export type Verse = {
  text: string;
  source?: string;
};

export const site = {
  name: "Ender",
  /** 箴言（显示时自动加引号、斜体）；留空则不显示 */
  motto: "",
  /** 放一张照片到 public/，例如 "/avatar.jpg"；为空时显示首字母 */
  avatar: "/avatar.jpg",
  /** 简介：每段一项，中英文各一份 */
  bio: {
    zh: [
      "我是 Ender，一名远程工作的软件开发工程师，现居中国成都。",
      "目前，我在旧金山的一家人工智能初创公司远程担任前端开发实习生。",
      "我热爱音乐，尤其是实验摇滚；也喜欢时尚、阅读和开源。",
      "我对食物有自己独到的理解，热衷于在每座城市寻找还没被发现的美味（但我又非常挑食，这很矛盾）。",
      "我相信人生有无限可能，也给自己定了许多目标。在技术领域，我的目标是成为一名开源明星。",
      "这个网站只是用来记录我的一些想法，或许可以叫它博客。如果它能给你带来些许帮助或启发，我会深感荣幸。",
      "想找我喝杯咖啡的话，随时欢迎！",
    ],
    en: [
      "I am Ender, a remote software development engineer currently living in Chengdu (China).",
      "Currently, I work remotely as a front-end development intern at an artificial intelligence startup in San Francisco.",
      "I love music, especially experimental rock. I also enjoy fashion, reading, and open source.",
      "I have my own unique understanding of food, and I’m passionate about finding undiscovered delicacies in every city (but I’m very picky about food, which is contradictory).",
      "I believe in the infinite possibilities of life, and I have many goals in life. In the technology field, my goal is to become an open-source star.",
      "This website is just for recording some of my thoughts; it might be called a blog. I would be honored if it could offer you any help or inspiration.",
      "If you want to grab a coffee with me, anytime!",
    ],
  },
  email: "enderromantic@gmail.com",
  github: "EnderRomantice",
  /** 关于我（长段落 / 诗）：每段一项，段内换行用 \n */
  intro: [] as Verse[],
};
