"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useWindowVirtualizer, type VirtualItem } from "@tanstack/react-virtual";
import type { Epiphany, TimelineMark } from "@/lib/types";
import type { Locale } from "@/lib/i18n/config";
import EpiphanyEntry from "./EpiphanyEntry";
import LineSidebar from "./reactbits/LineSidebar";
import TimelineFan from "./TimelineFan";

type Props = {
  initialItems: Epiphany[];
  initialCursor: number | null;
  timeline: TimelineMark[];
  lang: Locale;
  /** 界面文字（来自 lib/i18n） */
  t: { more: string; timeline: string; fanHint: string; fanHintTouch: string };
};

/** 跳转到某条时，让它停在视口顶部往下这么多像素 */
const JUMP_OFFSET = 88;
/** 视口中这个高度（比例）所在的条目算作「正在读」 */
const READING_LINE = 0.3;
/** 在页面上按住多久展开成扇形时间轴 */
const HOLD_MS = 450;

/** 从全文页返回时，恢复已加载的条目、测量结果和滚动位置 */
type Snapshot = {
  /** 快照属于哪种语言：换了语言再后退，不能把另一种语言的条目恢复回来 */
  lang: Locale;
  items: Epiphany[];
  cursor: number | null;
  measurements: VirtualItem[];
  scrollY: number;
  revealed: Set<string>;
  expanded: Set<string>;
};
let snapshot: Snapshot | null = null;
let popped = false;
if (typeof window !== "undefined") {
  window.addEventListener("popstate", () => {
    popped = true;
  });
}

const useIsoLayoutEffect = typeof window === "undefined" ? useEffect : useLayoutEffect;

export default function EpiphanyList({ initialItems, initialCursor, timeline, lang, t }: Props) {
  // 只有浏览器后退/前进时才恢复；从导航点进来则从头开始
  const [restored] = useState(() => {
    const s = popped && snapshot?.lang === lang ? snapshot : null;
    popped = false;
    return s;
  });
  const [items, setItems] = useState(() => restored?.items ?? initialItems);
  const [cursor, setCursor] = useState(() => (restored ? restored.cursor : initialCursor));
  const [mounted, setMounted] = useState(false);
  const [scrollMargin, setScrollMargin] = useState(0);
  const listRef = useRef<HTMLDivElement>(null);
  const revealed = useRef(restored?.revealed ?? new Set(initialItems.map((i) => i.slug)));
  const expanded = useRef(restored?.expanded ?? new Set<string>());
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
        lang,
        ...latest.current,
        measurements: virtualizer.measurementsCache,
        scrollY: window.scrollY,
        revealed: revealed.current,
        expanded: expanded.current,
      };
    },
    [virtualizer, lang],
  );

  const virtualItems = virtualizer.getVirtualItems();

  // 已加载的条目与游标（同步更新，供连续加载时读取），以及正在进行的请求
  const store = useRef({ items, cursor });
  const inflight = useRef<Promise<void> | null>(null);

  const loadMore = useCallback((): Promise<void> => {
    if (inflight.current) return inflight.current;
    const from = store.current.cursor;
    if (from === null) return Promise.resolve();
    const run = (async () => {
      try {
        const res = await fetch(`/api/epiphanies?cursor=${from}&lang=${lang}`);
        const data: { items: Epiphany[]; nextCursor: number | null } = await res.json();
        const seen = new Set(store.current.items.map((i) => i.slug));
        const next = [...store.current.items, ...data.items.filter((i) => !seen.has(i.slug))];
        store.current = { items: next, cursor: data.nextCursor };
        setItems(next);
        setCursor(data.nextCursor);
      } finally {
        inflight.current = null;
      }
    })();
    inflight.current = run;
    return run;
  }, [lang]);

  // ———— 时间刻度：跟随阅读位置，点击跳转 ————
  const [active, setActive] = useState(0);
  const jumping = useRef(false);
  const pending = useRef<number | null>(null);
  const [jumpTick, setJumpTick] = useState(0);

  useEffect(() => {
    if (!mounted) return;
    let raf = 0;
    const update = () => {
      raf = 0;
      if (jumping.current) return;
      const ms = virtualizer.measurementsCache;
      const y = window.scrollY + window.innerHeight * READING_LINE;
      let idx = 0;
      for (let i = 0; i < ms.length; i++) {
        if (ms[i].start <= y) idx = i;
        else break;
      }
      setActive(idx);
    };
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [mounted, virtualizer, items.length]);

  const jumpTo = useCallback(
    async (index: number) => {
      // 还没加载到的条目，先一页页加载过来
      try {
        while (store.current.items.length <= index && store.current.cursor !== null) await loadMore();
      } catch {
        return;
      }
      pending.current = index;
      setJumpTick((n) => n + 1);
    },
    [loadMore],
  );

  useEffect(() => {
    const index = pending.current;
    if (index === null) return;
    pending.current = null;
    const target = () => Math.max(0, (virtualizer.measurementsCache[index]?.start ?? 0) - JUMP_OFFSET);
    const smooth = !window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    jumping.current = true;
    setActive(index);
    window.scrollTo({ top: target(), behavior: smooth ? "smooth" : "auto" });

    // 中间的条目滚动时才被测量，落定后按真实位置校正一次
    const settle = () => {
      const t = target();
      if (Math.abs(window.scrollY - t) > 2) window.scrollTo({ top: t });
      jumping.current = false;
    };
    const timer = window.setTimeout(settle, 1400);
    const onEnd = () => {
      window.clearTimeout(timer);
      settle();
    };
    window.addEventListener("scrollend", onEnd, { once: true });
    return () => {
      window.clearTimeout(timer);
      window.removeEventListener("scrollend", onEnd);
      jumping.current = false;
    };
  }, [jumpTick, virtualizer]);

  // ———— 长按（页面任意处，鼠标或手指）：展开扇形时间轴 ————
  const [fan, setFan] = useState<{ start: number; hold: { id: number; y: number; touch: boolean } } | null>(null);
  const [press, setPress] = useState<{ x: number; y: number; touch: boolean } | null>(null);
  const activeRef = useRef(active);
  activeRef.current = active;
  const fanOpen = useRef(false);
  fanOpen.current = fan !== null;
  const suppressClickUntil = useRef(0);
  const unlockTouch = useRef<(() => void) | null>(null);

  /** 手指按住展开后：页面不再跟着手指滚动，也不弹系统菜单，直到松手 */
  const lockTouch = useCallback(() => {
    unlockTouch.current?.();
    const prevent = (e: Event) => {
      if (e.cancelable) e.preventDefault();
    };
    window.addEventListener("touchmove", prevent, { passive: false });
    window.addEventListener("contextmenu", prevent);
    unlockTouch.current = () => {
      window.removeEventListener("touchmove", prevent);
      window.removeEventListener("contextmenu", prevent);
      unlockTouch.current = null;
    };
  }, []);

  useEffect(() => {
    if (!mounted || timeline.length < 2) return;
    // 触屏上，列表页的长按归扇形时间轴（不再触发系统的选字 / 链接菜单）
    document.documentElement.classList.add("fan-gesture");
    let p: { timer: number; id: number; x: number; y: number; touch: boolean } | null = null;
    const cancel = () => {
      if (!p) return;
      window.clearTimeout(p.timer);
      p = null;
      setPress(null);
    };
    const noMenu = (e: Event) => {
      if (p?.touch) e.preventDefault();
    };
    const onDown = (e: PointerEvent) => {
      if (fanOpen.current || !e.isPrimary) return;
      const touch = e.pointerType !== "mouse";
      if (!touch && e.button !== 0) return;
      if (e.ctrlKey || e.metaKey || e.shiftKey || e.altKey) return;
      const target = e.target as Element;
      if (target.closest("input, textarea, select, [contenteditable]")) return;
      const tick = target.closest<HTMLElement>(".timeline [data-index]");
      const start = tick ? Number(tick.dataset.index) : activeRef.current;
      const { pointerId: id, clientX: x, clientY: y } = e;
      const timer = window.setTimeout(() => {
        p = null;
        setPress(null);
        window.getSelection()?.removeAllRanges();
        if (touch) {
          lockTouch();
          navigator.vibrate?.(8);
        }
        setFan({ start, hold: { id, y, touch } });
      }, HOLD_MS);
      p = { timer, id, x, y, touch };
      setPress({ x, y, touch });
    };
    const onMove = (e: PointerEvent) => {
      if (!p || e.pointerId !== p.id) return;
      if (Math.hypot(e.clientX - p.x, e.clientY - p.y) > (p.touch ? 10 : 8)) cancel();
    };
    const onUp = (e: PointerEvent) => {
      if (p && e.pointerId === p.id) cancel();
    };
    // 松手后紧跟着的那次 click 不算数
    const onClick = (e: MouseEvent) => {
      if (performance.now() < suppressClickUntil.current) {
        e.preventDefault();
        e.stopPropagation();
      }
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", cancel);
    window.addEventListener("scroll", cancel, { passive: true });
    window.addEventListener("blur", cancel);
    window.addEventListener("click", onClick, true);
    window.addEventListener("contextmenu", noMenu);
    return () => {
      cancel();
      unlockTouch.current?.();
      document.documentElement.classList.remove("fan-gesture");
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", cancel);
      window.removeEventListener("scroll", cancel);
      window.removeEventListener("blur", cancel);
      window.removeEventListener("click", onClick, true);
      window.removeEventListener("contextmenu", noMenu);
    };
  }, [mounted, timeline.length, lockTouch]);

  // 扇形打开期间：不选中文字、不拖动链接，光标是「抓着」
  useEffect(() => {
    if (!fan) return;
    const root = document.documentElement;
    const prevent = (e: Event) => e.preventDefault();
    root.classList.add("is-scrubbing");
    document.addEventListener("selectstart", prevent);
    document.addEventListener("dragstart", prevent);
    return () => {
      root.classList.remove("is-scrubbing");
      document.removeEventListener("selectstart", prevent);
      document.removeEventListener("dragstart", prevent);
    };
  }, [fan]);

  const lastIndex = virtualItems.at(-1)?.index ?? -1;
  useEffect(() => {
    if (mounted && lastIndex >= items.length - 2) loadMore();
  }, [mounted, lastIndex, items.length, loadMore]);

  const rows = mounted
    ? virtualItems.map((v) => ({ item: items[v.index], index: v.index, start: v.start }))
    : items.map((item, index) => ({ item, index, start: 0 }));

  return (
    <>
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
            expanded={expanded.current}
            lang={lang}
            moreLabel={t.more}
          />
        </div>
      ))}
    </div>
    {timeline.length > 1 && (
      <aside
        className={["timeline", press && "timeline--pressing", fan && "timeline--fanned"].filter(Boolean).join(" ")}
      >
        <LineSidebar
          items={timeline.map((t) => t.label)}
          titles={timeline.map((t) => t.title)}
          active={active}
          label={t.timeline}
          proximityRadius={56}
          maxShift={6}
          markerLength={18}
          markerGap={10}
          itemGap={14}
          smoothing={120}
          onItemClick={(i) => jumpTo(i)}
        />
      </aside>
    )}
    {press && (
      <span
        className={press.touch ? "hold-ring hold-ring--touch" : "hold-ring"}
        style={{ left: press.x, top: press.y }}
        aria-hidden="true"
      >
        <svg viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="13" />
        </svg>
      </span>
    )}
    {fan && (
      <TimelineFan
        marks={timeline}
        label={t.timeline}
        hint={fan.hold.touch ? t.fanHintTouch : t.fanHint}
        start={fan.start}
        hold={fan.hold}
        onJump={(i) => jumpTo(i)}
        onEnd={() => {
          suppressClickUntil.current = performance.now() + 400;
          unlockTouch.current?.();
        }}
        onClosed={() => setFan(null)}
      />
    )}
    </>
  );
}
