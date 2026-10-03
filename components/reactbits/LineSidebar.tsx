"use client";

/**
 * LineSidebar — adapted from React Bits (https://reactbits.dev), © 2026 David Haz,
 * MIT + Commons Clause (see ./LICENSE.md).
 *
 * 改动：
 * - 当前项可由外部控制（active），用来跟随滚动位置
 * - 每项是 <button>，可以用键盘操作；titles 作为完整说明
 * - 样式改写为本站的纸墨配色（见 LineSidebar.css）
 */

import { useRef, useState, useCallback, useEffect, type CSSProperties } from "react";
import "./LineSidebar.css";

type Falloff = "linear" | "smooth" | "sharp";

export interface LineSidebarProps {
  items: string[];
  titles?: string[];
  active?: number | null;
  label?: string;
  proximityRadius?: number;
  maxShift?: number;
  falloff?: Falloff;
  markerLength?: number;
  markerGap?: number;
  tickScale?: number;
  itemGap?: number;
  smoothing?: number;
  onItemClick?: (index: number, label: string) => void;
  className?: string;
}

const FALLOFF_CURVES: Record<Falloff, (p: number) => number> = {
  linear: (p) => p,
  smooth: (p) => p * p * (3 - 2 * p),
  sharp: (p) => p * p * p,
};

const LineSidebar = ({
  items,
  titles,
  active = null,
  label,
  proximityRadius = 100,
  maxShift = 30,
  falloff = "smooth",
  markerLength = 60,
  markerGap = 0,
  tickScale = 0.5,
  itemGap = 20,
  smoothing = 100,
  onItemClick,
  className = "",
}: LineSidebarProps) => {
  const listRef = useRef<HTMLUListElement>(null);
  const itemRefs = useRef<(HTMLLIElement | null)[]>([]);
  const targetsRef = useRef<number[]>([]);
  const currentRef = useRef<number[]>([]);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const activeRef = useRef<number | null>(active);
  const smoothingRef = useRef(smoothing);
  const [activeIndex, setActiveIndex] = useState<number | null>(active);

  activeRef.current = activeIndex;
  smoothingRef.current = smoothing;

  useEffect(() => setActiveIndex(active), [active]);

  // Single rAF loop that eases every item's --effect toward its target using
  // frame-rate independent exponential smoothing, so color, shift and scale
  // all move together without staggering CSS transitions.
  const runFrame = useCallback((now: number) => {
    const dt = Math.min((now - lastRef.current) / 1000, 0.05);
    lastRef.current = now;
    const tau = Math.max(smoothingRef.current, 1) / 1000;
    const k = 1 - Math.exp(-dt / tau);

    let moving = false;
    const els = itemRefs.current;
    for (let i = 0; i < els.length; i++) {
      const el = els[i];
      if (!el) continue;
      const target = Math.max(targetsRef.current[i] || 0, activeRef.current === i ? 1 : 0);
      const cur = currentRef.current[i] || 0;
      const next = cur + (target - cur) * k;
      const settled = Math.abs(target - next) < 0.0015;
      const value = settled ? target : next;
      currentRef.current[i] = value;
      el.style.setProperty("--effect", value.toFixed(4));
      if (!settled) moving = true;
    }

    rafRef.current = moving ? requestAnimationFrame(runFrame) : null;
  }, []);

  const startLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
    }
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(runFrame);
  }, [runFrame]);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLUListElement>) => {
      const list = listRef.current;
      if (!list) return;
      const rect = list.getBoundingClientRect();
      const pointerY = e.clientY - rect.top;
      const ease = FALLOFF_CURVES[falloff] ?? FALLOFF_CURVES.linear;
      const els = itemRefs.current;
      for (let i = 0; i < els.length; i++) {
        const el = els[i];
        if (!el) continue;
        const center = el.offsetTop + el.offsetHeight / 2;
        const distance = Math.abs(pointerY - center);
        targetsRef.current[i] = ease(Math.max(0, 1 - distance / proximityRadius));
      }
      startLoop();
    },
    [falloff, proximityRadius, startLoop],
  );

  const handlePointerLeave = useCallback(() => {
    targetsRef.current = targetsRef.current.map(() => 0);
    startLoop();
  }, [startLoop]);

  const handleClick = useCallback(
    (index: number, text: string) => {
      setActiveIndex(index);
      onItemClick?.(index, text);
    },
    [onItemClick],
  );

  useEffect(() => {
    startLoop();
  }, [activeIndex, items.length, startLoop]);

  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    },
    [],
  );

  return (
    <nav
      aria-label={label}
      className={`line-sidebar line-sidebar--markers line-sidebar--scale-tick${className ? ` ${className}` : ""}`}
      style={
        {
          "--marker-length": `${markerLength}px`,
          "--marker-gap": `${markerGap}px`,
          "--tick-scale": tickScale,
          "--max-shift": `${maxShift}px`,
          "--item-gap": `${itemGap}px`,
        } as CSSProperties
      }
    >
      <ul
        ref={listRef}
        className="line-sidebar__list"
        onPointerMove={handlePointerMove}
        onPointerLeave={handlePointerLeave}
      >
        {items.map((text, index) => (
          <li
            key={`${text}-${index}`}
            ref={(el) => {
              itemRefs.current[index] = el;
            }}
            className="line-sidebar__item"
          >
            <button
              type="button"
              className="line-sidebar__button"
              title={titles?.[index]}
              aria-label={titles?.[index] ?? text}
              aria-current={activeIndex === index ? "true" : undefined}
              onClick={() => handleClick(index, text)}
              onFocus={() => {
                targetsRef.current = items.map((_, i) => (i === index ? 1 : 0));
                startLoop();
              }}
              onBlur={handlePointerLeave}
            >
              <span className="line-sidebar__marker" aria-hidden="true" />
              <span className="line-sidebar__label" aria-hidden="true">
                {text}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default LineSidebar;
