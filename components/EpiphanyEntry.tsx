"use client";

import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent } from "react";
import type { Epiphany } from "@/lib/types";

type Props = {
  item: Epiphany;
  order: number;
  initial: boolean;
  revealed: Set<string>;
  expanded: Set<string>;
};

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

const MORE =
  '<button type="button" class="more" aria-expanded="false">' +
  '<span class="more-dots" aria-hidden="true">…</span><span class="more-label">More</span></button>';

/** 把「… More」接在摘要最后一段的末尾 */
const withMore = (html: string) =>
  html.endsWith("</p>") ? `${html.slice(0, -4)}${MORE}</p>` : `${html}<p>${MORE}</p>`;

// 起步柔和、落地更柔和，避免「唰」一下撑开
const EASE = "cubic-bezier(0.33, 0, 0.2, 1)";

export default function EpiphanyEntry({ item, order, initial, revealed, expanded }: Props) {
  const ref = useRef<HTMLElement>(null);
  const restRef = useRef<HTMLDivElement>(null);
  const [veiled, setVeiled] = useState(() => !initial && !revealed.has(item.slug));
  const [open, setOpen] = useState(() => expanded.has(item.slug));
  const animate = useRef(false);

  useEffect(() => {
    if (!veiled || !ref.current) return;
    const el = ref.current;
    const io = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) {
          revealed.add(item.slug);
          setVeiled(false);
          io.disconnect();
        }
      },
      { threshold: 0 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [veiled, item.slug, revealed]);

  const onClick = (e: MouseEvent) => {
    if (open || !(e.target as Element).closest(".more")) return;
    expanded.add(item.slug);
    animate.current = true;
    setOpen(true);
  };

  // 展开：高度从 0 平滑撑开，文字随后淡入
  useIsoLayoutEffect(() => {
    const el = restRef.current;
    if (!open || !animate.current || !el) return;
    animate.current = false;
    el.focus({ preventScroll: true });
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    el.style.overflow = "hidden";
    const h = el.getBoundingClientRect().height;
    const grow = el.animate([{ height: "0px" }, { height: `${h}px` }], { duration: 700, easing: EASE });
    el.animate(
      [
        { opacity: 0, transform: "translateY(6px)" },
        { opacity: 1, transform: "none" },
      ],
      { duration: 640, delay: 100, easing: "ease-out", fill: "backwards" },
    );
    el.animate([{ filter: "blur(2px)" }, { filter: "blur(0)" }], {
      duration: 380,
      delay: 100,
      easing: "ease-out",
      fill: "backwards",
    });
    grow.onfinish = grow.oncancel = () => {
      el.style.overflow = "";
    };
  }, [open]);

  const cls = ["entry", initial && "entry--intro", veiled && "is-veiled", open && "is-open"]
    .filter(Boolean)
    .join(" ");

  return (
    <article
      ref={ref}
      className={cls}
      style={initial ? { animationDelay: `${order * 0.04}s` } : undefined}
    >
      <div className="meta">
        <time className="meta-time">{item.time}</time>
        {item.place && <span className="meta-place">{item.place}</span>}
      </div>
      <div className="body">
        <div
          className="excerpt"
          onClick={item.rest ? onClick : undefined}
          dangerouslySetInnerHTML={{ __html: item.rest ? withMore(item.excerpt) : item.excerpt }}
        />
        {item.rest && open && (
          <div
            ref={restRef}
            tabIndex={-1}
            className={item.cont ? "rest rest--cont" : "rest"}
            dangerouslySetInnerHTML={{ __html: item.rest }}
          />
        )}
      </div>
    </article>
  );
}
