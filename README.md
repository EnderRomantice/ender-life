# ender-life

```bash
pnpm install
pnpm dev                  # http://localhost:3000
pnpm build && pnpm start
```

- Epiphanies：`content/epiphanies/*.md`，一条一个文件（格式见 `lib/epiphanies.ts` 顶部注释）；正文里写 `<!-- more -->` 的条目可以点进全文
- 个人信息与头像：`lib/site.ts`（头像放到 `public/`，填 `avatar`）
- 字体职能：`lib/fonts.ts`（全部本地托管；中文为朱雀仿宋，SIL OFL 1.1）
