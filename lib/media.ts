import fs from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";

/**
 * 影像：把照片放进 public/media/，文件名以日期开头即可，例如
 *   public/media/2026-10-04-chengdu-01.jpg
 *
 * 想补地点或说明时，在 content/media/ 放一个同名的 .md（可选）：
 *   ---
 *   date: 2026-10-04        覆盖文件名里的日期
 *   place: 成都 四川
 *   ---
 *   说明文字（可选）
 */

const MEDIA_DIR = path.join(process.cwd(), "public", "media");
const META_DIR = path.join(process.cwd(), "content", "media");
const IMAGE = /\.(jpe?g|png|webp|avif|gif)$/i;

export type MediaItem = {
  id: string;
  src: string;
  width: number;
  height: number;
  /** 排序用，YYYY-MM-DD */
  date: string;
  /** 显示用，2026-10-4 */
  time: string;
  place: string;
  caption: string;
};

function sidecar(name: string): { meta: Record<string, string>; body: string } {
  const file = path.join(META_DIR, `${name}.md`);
  if (!fs.existsSync(file)) return { meta: {}, body: "" };
  const raw = fs.readFileSync(file, "utf8");
  const m = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  const meta: Record<string, string> = {};
  if (!m) return { meta, body: raw.trim() };
  for (const line of m[1].split(/\r?\n/)) {
    const i = line.indexOf(":");
    if (i > 0) meta[line.slice(0, i).trim()] = line.slice(i + 1).trim().replace(/^["']|["']$/g, "");
  }
  return { meta, body: m[2].trim() };
}

let cached: MediaItem[] | null = null;

export function getMedia(): MediaItem[] {
  if (cached && process.env.NODE_ENV === "production") return cached;
  const files = fs.existsSync(MEDIA_DIR) ? fs.readdirSync(MEDIA_DIR).filter((f) => IMAGE.test(f)) : [];

  const items = files.flatMap((file): MediaItem[] => {
    const name = file.replace(/\.[^.]+$/, "");
    let size: { width?: number; height?: number; orientation?: number };
    try {
      size = imageSize(fs.readFileSync(path.join(MEDIA_DIR, file)));
    } catch {
      return [];
    }
    if (!size.width || !size.height) return [];
    // 手机照片常带 EXIF 旋转：5–8 表示横竖互换
    const rotated = (size.orientation ?? 1) >= 5;
    const { meta, body } = sidecar(name);
    const date =
      meta.date?.slice(0, 10) ??
      name.match(/^(\d{4}-\d{2}-\d{2})/)?.[1] ??
      fs.statSync(path.join(MEDIA_DIR, file)).mtime.toISOString().slice(0, 10);
    const [y, mo, d] = date.split("-").map(Number);
    return [
      {
        id: name,
        src: `/media/${encodeURIComponent(file)}`,
        width: rotated ? size.height : size.width,
        height: rotated ? size.width : size.height,
        date,
        time: y && mo && d ? `${y}-${mo}-${d}` : date,
        place: meta.place ?? "",
        caption: body,
      },
    ];
  });

  cached = items.sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : a.id < b.id ? -1 : 1));
  return cached;
}
