"use client";

import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal, flushSync } from "react-dom";
import Masonry from "./reactbits/Masonry";
import type { MediaItem } from "@/lib/media";
import { contentLang } from "@/lib/i18n/config";

type Labels = { close: string; prev: string; next: string; photo: string };

type Props = {
  items: (MediaItem & { placeLabel: string })[];
  labels: Labels;
};

const HERO = "media-hero";

/** 用浏览器的 View Transition 做缩略图 ↔ 大图的过渡；不支持或减少动态时直接切换 */
function transition(update: () => void): ViewTransition | null {
  const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!document.startViewTransition || reduced) {
    update();
    return null;
  }
  return document.startViewTransition(update);
}

/** 缩略图已经加载好的那张图（浏览器缓存里有），大图出来之前先用它垫底 */
const cachedSrc = (id: string) =>
  document.querySelector<HTMLImageElement>(`[data-media-id="${CSS.escape(id)}"] img`)?.currentSrc ?? "";

/** 等垫底的小图解码完再截图，过渡时画面不会是空白 */
async function lowDecoded() {
  const img = document.querySelector<HTMLImageElement>(".lightbox__low");
  if (img?.src) await img.decode().catch(() => {});
}

export default function MediaGallery({ items, labels }: Props) {
  const [active, setActive] = useState<number | null>(null);
  const [low, setLow] = useState("");
  const dialogRef = useRef<HTMLDivElement>(null);
  const swipe = useRef<{ x: number; y: number } | null>(null);

  const thumbOf = (index: number) =>
    document.querySelector<HTMLElement>(`[data-media-id="${CSS.escape(items[index].id)}"] .masonry__inner`);

  const open = useCallback(
    (index: number, el: HTMLElement) => {
      el.style.viewTransitionName = HERO;
      transition(async () => {
        el.style.viewTransitionName = "";
        flushSync(() => {
          setLow(cachedSrc(items[index].id));
          setActive(index);
        });
        await lowDecoded();
      });
    },
    [items],
  );

  const close = useCallback(() => {
    if (active === null) return;
    const el = thumbOf(active);
    const vt = transition(() => {
      flushSync(() => setActive(null));
      if (el) el.style.viewTransitionName = HERO;
    });
    const done = () => {
      if (el) el.style.viewTransitionName = "";
      (el?.parentElement as HTMLElement | null)?.focus({ preventScroll: true });
    };
    if (vt) vt.finished.finally(done);
    else done();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active]);

  const step = useCallback(
    (delta: number) => {
      if (active === null) return;
      const next = (active + delta + items.length) % items.length;
      transition(async () => {
        flushSync(() => {
          setLow(cachedSrc(items[next].id));
          setActive(next);
        });
        await lowDecoded();
      });
    },
    [active, items],
  );

  // 打开时：页面不滚动，键盘可操作
  useEffect(() => {
    if (active === null) return;
    const html = document.documentElement;
    const prev = html.style.overflow;
    html.style.overflow = "hidden";
    dialogRef.current?.focus({ preventScroll: true });
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      else if (e.key === "ArrowLeft") step(-1);
      else if (e.key === "ArrowRight") step(1);
    };
    window.addEventListener("keydown", onKey);
    return () => {
      html.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [active, close, step]);

  const item = active === null ? null : items[active];

  return (
    <>
      <Masonry
        items={items.map((m) => ({ id: m.id, src: m.src, width: m.width, height: m.height, alt: m.caption || `${labels.photo} ${m.time}` }))}
        onSelect={open}
      />
      {item &&
        createPortal(
          <div
            ref={dialogRef}
            className="lightbox"
            role="dialog"
            aria-modal="true"
            aria-label={item.caption || `${labels.photo} ${item.time}`}
            tabIndex={-1}
            onClick={close}
            onPointerDown={(e) => {
              swipe.current = { x: e.clientX, y: e.clientY };
            }}
            onPointerUp={(e) => {
              const s = swipe.current;
              swipe.current = null;
              if (!s || e.pointerType === "mouse") return;
              const dx = e.clientX - s.x;
              if (Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(e.clientY - s.y)) {
                e.preventDefault();
                step(dx < 0 ? 1 : -1);
              }
            }}
          >
            <figure className="lightbox__figure">
              <div
                className="lightbox__frame"
                style={{
                  width: `min(92vw, ${((74 * item.width) / item.height).toFixed(3)}vh, 1100px)`,
                  aspectRatio: `${item.width} / ${item.height}`,
                  viewTransitionName: HERO,
                }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                {low && <img className="lightbox__low" src={low} alt="" aria-hidden="true" />}
                <Image src={item.src} alt="" fill sizes="(max-width: 1100px) 92vw, 1100px" priority />
              </div>
              <figcaption className="lightbox__caption">
                <span className="lightbox__meta">
                  {[item.time, item.placeLabel].filter(Boolean).join(" · ")}
                  {items.length > 1 && <span className="lightbox__count">{`${active! + 1} / ${items.length}`}</span>}
                </span>
                {item.caption && <span className="lightbox__text" lang={contentLang}>{item.caption}</span>}
              </figcaption>
            </figure>
            {items.length > 1 && (
              <>
                <button
                  type="button"
                  className="lightbox__nav lightbox__nav--prev"
                  aria-label={labels.prev}
                  onClick={(e) => {
                    e.stopPropagation();
                    step(-1);
                  }}
                >
                  ←
                </button>
                <button
                  type="button"
                  className="lightbox__nav lightbox__nav--next"
                  aria-label={labels.next}
                  onClick={(e) => {
                    e.stopPropagation();
                    step(1);
                  }}
                >
                  →
                </button>
              </>
            )}
            <button type="button" className="lightbox__close" aria-label={labels.close}>
              ×
            </button>
          </div>,
          document.body,
        )}
    </>
  );
}
