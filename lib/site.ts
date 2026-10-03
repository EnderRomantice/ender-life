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
  /** 简介：每段一项 */
  bio: [
    "I am Ender, a remote software development engineer currently living in Chengdu (China).",
    "Currently, I work remotely as a front-end development intern at an artificial intelligence startup in San Francisco.",
    "I love music, especially experimental rock. I also enjoy fashion, reading, and open source.",
    "I have my own unique understanding of food, and I’m passionate about finding undiscovered delicacies in every city (but I’m very picky about food, which is contradictory).",
    "I believe in the infinite possibilities of life, and I have many goals in life. In the technology field, my goal is to become an open-source star.",
    "This website is just for recording some of my thoughts; it might be called a blog. I would be honored if it could offer you any help or inspiration.",
    "If you want to grab a coffee with me, anytime!",
  ],
  email: "enderromantic@gmail.com",
  github: "EnderRomantice",
  /** 关于我（长段落 / 诗）：每段一项，段内换行用 \n */
  intro: [] as Verse[],
};
