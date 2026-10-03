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
  /** 简介：每行一项 */
  bio: ["原名李文浩，四川南充人，现居成都", "热爱开源，时尚，摇滚/爵士乐"],
  email: "enderromantic@gmail.com",
  github: "EnderRomantice",
  /** 关于我（长段落 / 诗）：每段一项，段内换行用 \n */
  intro: [] as Verse[],
};
