"use client";

/**
 * Masonry — adapted from React Bits (https://reactbits.dev), © 2026 David Haz,
 * MIT + Commons Clause (see ./LICENSE.md).
 *
 * 改动：
 * - 布局在渲染时按图片宽高比算好（2 列、3 列各一套），用 CSS 变量和容器查询切换，
 *   服务端渲染出来就是对的，不用等测量、也不会跳动；列数变化时位置平滑过渡
 * - 图片用 next/image（懒加载、按显示尺寸输出），不再预加载全部图片
 * - 入场保留原版「自下而上、由虚到实、依次错开」的思路，幅度收小；悬停轻微缩小
 * - 去掉 gsap；点击交给外部（打开大图）
 */

import Image from "next/image";
import { useMemo, useState, type CSSProperties } from "react";
import "./Masonry.css";

export interface MasonryItem {
  id: string;
  src: string;
  width: number;
  height: number;
  alt: string;
}

interface MasonryProps {
  items: MasonryItem[];
  onSelect?: (index: number, element: HTMLElement) => void;
}

/** 间隔相对列宽的大致比例，只用于挑「最短的一列」 */
const GAP_RATIO = 0.05;

function layout(items: MasonryItem[], cols: number) {
  const units = new Array(cols).fill(0); // 每列累计高度（以列宽为单位）
  const gaps = new Array(cols).fill(0); // 每列已有的图片数（决定间隔数）
  const h = (c: number) => units[c] + gaps[c] * GAP_RATIO;
  const pos = items.map((it) => {
    let col = 0;
    for (let c = 1; c < cols; c++) if (h(c) < h(col) - 1e-9) col = c;
    const p = { x: col, yu: units[col], yg: gaps[col] };
    units[col] += it.height / it.width;
    gaps[col] += 1;
    return p;
  });
  let tall = 0;
  for (let c = 1; c < cols; c++) if (h(c) > h(tall)) tall = c;
  return { pos, hu: units[tall], hg: Math.max(0, gaps[tall] - 1) };
}

const Masonry: React.FC<MasonryProps> = ({ items, onSelect }) => {
  const two = useMemo(() => layout(items, 2), [items]);
  const three = useMemo(() => layout(items, 3), [items]);
  const [loaded, setLoaded] = useState<Set<string>>(() => new Set());

  return (
    <div
      className="masonry"
      style={
        {
          "--h2u": two.hu.toFixed(4),
          "--h2g": two.hg,
          "--h3u": three.hu.toFixed(4),
          "--h3g": three.hg,
        } as CSSProperties
      }
    >
      {items.map((item, i) => (
        <button
          key={item.id}
          type="button"
          className="masonry__item"
          aria-label={item.alt}
          data-media-id={item.id}
          onClick={(e) => onSelect?.(i, e.currentTarget.firstElementChild as HTMLElement)}
          style={
            {
              "--a": (item.height / item.width).toFixed(4),
              "--x2": two.pos[i].x,
              "--y2u": two.pos[i].yu.toFixed(4),
              "--y2g": two.pos[i].yg,
              "--x3": three.pos[i].x,
              "--y3u": three.pos[i].yu.toFixed(4),
              "--y3g": three.pos[i].yg,
            } as CSSProperties
          }
        >
          <span className="masonry__inner" style={{ "--i": Math.min(i, 14) } as CSSProperties}>
            <Image
              src={item.src}
              alt=""
              fill
              sizes="(max-width: 600px) 50vw, 220px"
              className={loaded.has(item.id) ? "is-loaded" : undefined}
              onLoad={() => setLoaded((s) => (s.has(item.id) ? s : new Set(s).add(item.id)))}
            />
          </span>
        </button>
      ))}
    </div>
  );
};

export default Masonry;
