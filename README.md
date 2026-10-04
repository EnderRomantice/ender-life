# ender-life

```bash
pnpm install
pnpm dev                  # http://localhost:3000
pnpm build && pnpm start
```

- Epiphanies：`content/epiphanies/*.md`，一条一个文件（格式见 `lib/epiphanies.ts` 顶部注释）；正文里写 `<!-- more -->` 的条目可以点进全文
- 个人信息与头像：`lib/site.ts`（头像放到 `public/`，填 `avatar`）
- 字体职能：`lib/fonts.ts`（全部本地托管；中文为朱雀仿宋，SIL OFL 1.1）
- `pnpm dev` / `pnpm build` 会先扫描全部文章、页面文案和 `lib/site.ts`，只生成这些文字需要的中文字体，包含折叠全文与 About 页。开发中新增文案后运行 `pnpm fonts`，或重启开发服务。
- 中文完整源字体仅供构建使用，位于 `scripts/fonts/`，不作为浏览器资源导入；来源为 [朱雀仿宋 v0.108](https://github.com/TrionesType/zhuque/releases/tag/v0.108)，许可证见 `scripts/fonts/OFL.txt`。生成的 `app/fonts/generated/` 不提交。

- 影像（Media）：照片放进 `public/media/`，文件名以日期开头（如 `2026-10-04-chengdu-01.jpg`）即可出现在各语言的 `/…/media`；想补地点、说明，在 `content/media/` 放同名 `.md`（格式见 `lib/media.ts` 顶部注释）。新增照片后重新部署。
- RSS：`/feed.xml`（RSS 2.0，含全文）；页面 `<head>` 带自动发现链接，About 页也有入口。部署后若想固定订阅地址里的域名，可设置环境变量 `SITE_URL`（如 `https://example.com`）。
- 多语言：`/zh/…`、`/en/…`、`/ru/…`、`/ja/…`，导航右侧的小地球切换；界面文字与地名对照在 `lib/i18n/index.ts`，个人介绍在 `lib/site.ts`（每种语言一份）。文章原文不翻译。
