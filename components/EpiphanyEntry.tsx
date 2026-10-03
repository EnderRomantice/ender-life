"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Epiphany } from "@/lib/types";

type Props = {
  item: Epiphany;
  order: number;
  initial: boolean;
  revealed: Set<string>;
};

export default function EpiphanyEntry({ item, order, initial, revealed }: Props) {
  const ref = useRef<HTMLElement>(null);
  const [veiled, setVeiled] = useState(() => !initial && !revealed.has(item.slug));

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

  const cls = ["entry", item.hasMore && "entry--more", initial && "entry--intro", veiled && "is-veiled"]
    .filter(Boolean)
    .join(" ");

  const body = <div className="body" dangerouslySetInnerHTML={{ __html: item.excerpt }} />;

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
      {item.hasMore ? (
        <Link href={`/epiphanies/${item.slug}`} className="entry-link">
          {body}
        </Link>
      ) : (
        body
      )}
    </article>
  );
}
