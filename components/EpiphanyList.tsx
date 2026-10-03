"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useWindowVirtualizer, type VirtualItem } from "@tanstack/react-virtual";
import type { Epiphany } from "@/lib/types";
import EpiphanyEntry from "./EpiphanyEntry";

type Props = {
  initialItems: Epiphany[];
  initialCursor: number | null;
};

/** 从全文页返回时，恢复已加载的条目、测量结果和滚动位置 */
type Snapshot = {
  items: Epiphany[];
  cursor: number | null;
  measurements: VirtualItem[];
  scrollY: number;
  revealed: Set<string>;
};
let snapshot: Snapshot | null = null;
let popped = false;
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    popped = true;
  });
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function EpiphanyList({ initialItems, initialCursor }: Props) {
  // 只有浏览器后退/前进时才恢复；从导航点进来则从头开始
  const [restored] = useState(() => {
    const s = popped ? snapshot : null;
    popped = false;
    return s;
  });
  const [items, setItems] = useState(() => restored?.items ?? initialItems);
  const [cursor, setCursor] = useState(() => (restored ? restored.cursor : initialCursor));
  const [mounted, setMounted] = useState(false);
  const [scrollMargin, setScrollMargin] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const loading = useRef(false);
  const revealed = useRef(restored?.revealed ?? new Set(initialItems.map((i) => i.slug)));
  const initialSlugs = useRef(new Set(restored ? [] : initialItems.map((i) => i.slug)));

  useIsoLayoutEffect(() => {
    const measure = () => {
      if (listRef.current) {
        setScrollMargin(listRef.current.getBoundingClientRect().top + window.scrollY);
      }
    };
    measure();
    setMounted(true);
    window.addEventListener("resize", measure);
    return () => window.removeEventListener("resize", measure);
  }, []);

  const virtualizer = useWindowVirtualizer({
    count: items.length,
    estimateSize: () => 240,
    overscan: 3,
    scrollMargin,
    getItemKey: (i) => items[i].slug,
    initialMeasurementsCache: restored?.measurements,
  });

  // 恢复滚动位置
  useIsoLayoutEffect(() => {
    if (mounted && restored) window.scrollTo(0, restored.scrollY);
  }, [mounted, restored]);

  // 离开时留一份快照
  const latest = useRef({ items, cursor });
  latest.current = { items, cursor };
  useEffect(
    () => () => {
      snapshot = {
        ...latest.current,
        measurements: virtualizer.measurementsCache,
        scrollY: window.scrollY,
        revealed: revealed.current,
      };
    },
    [virtualizer],
  );

  const virtualItems = virtualizer.getVirtualItems();

  const loadMore = useCallback(async () => {
    if (loading.current || cursor === null) return;
    loading.current = true;
    try {
      const res = await fetch(`/api/epiphanies?cursor=${cursor}`);
      const data: { items: Epiphany[]; nextCursor: number | null } = await res.json();
      setItems((prev) => [...prev, ...data.items]);
      setCursor(data.nextCursor);
    } finally {
      loading.current = false;
    }
  }, [cursor]);

  const lastIndex = virtualItems.at(-1)?.index ?? -1;
  useEffect(() => {
    if (mounted && lastIndex >= items.length - 2) loadMore();
  }, [mounted, lastIndex, items.length, loadMore]);

  const rows = mounted
    ? virtualItems.map((v) => ({ item: items[v.index], index: v.index, start: v.start }))
    : items.map((item, index) => ({ item, index, start: 0 }));

  return (
    <div
      ref={listRef}
      className="epiphanies"
      style={mounted ? { height: virtualizer.getTotalSize(), position: "relative" } : undefined}
    >
      {rows.map(({ item, index, start }) => (
        <div
          key={item.slug}
          data-index={index}
          ref={mounted ? virtualizer.measureElement : undefined}
          className="row"
          style={
            mounted
              ? {
                  position: "absolute",
                  top: 0,
                  left: 0,
                  width: "100%",
                  transform: `translateY(${start - scrollMargin}px)`,
                }
              : undefined
          }
        >
          <EpiphanyEntry
            item={item}
            order={index}
            initial={initialSlugs.current.has(item.slug)}
            revealed={revealed.current}
          />
        </div>
      ))}
    </div>
  );
}
