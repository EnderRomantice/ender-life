"use client";

/**
 * OptionWheel — adapted from React Bits (https://reactbits.dev), © 2026 David Haz,
 * MIT + Commons Clause (see ./LICENSE.md).
 *
 * 改动：
 * - open：扇面展开 / 收拢（所有项从中线向两侧张开，收拢时反向）
 * - hold：长按打开后指针仍按着时，继续拖动即可拨动，松手即选中
 * - onCommit / onDismiss：点选中项或回车确认；Esc 或点空白处关闭
 * - renderItem：自定义每一项的内容
 * - 去掉了声音
 */

import { useRef, useState, useCallback, useEffect, type CSSProperties, type ReactNode } from "react";
import "./OptionWheel.css";

type Side = "left" | "right";

export interface OptionWheelProps {
  items: string[];
  defaultSelected?: number;
  onChange?: (index: number, item: string) => void;
  onCommit?: (index: number) => void;
  onDismiss?: () => void;
  onFolded?: () => void;
  open?: boolean;
  hold?: { id: number; y: number } | null;
  renderItem?: (item: string, index: number) => ReactNode;
  label?: string;
  side?: Side;
  rowHeight?: number;
  curve?: number;
  tilt?: number;
  blur?: number;
  fade?: number;
  minOpacity?: number;
  smoothing?: number;
  inset?: string;
  className?: string;
}

interface WheelConfig {
  count: number;
  items: string[];
  rowH: number;
  curve: number;
  tilt: number;
  blur: number;
  fade: number;
  minOpacity: number;
  side: Side;
  smoothing: number;
}

const OptionWheel = ({
  items,
  defaultSelected = 0,
  onChange,
  onCommit,
  onDismiss,
  onFolded,
  open = true,
  hold = null,
  renderItem,
  label,
  side = "left",
  rowHeight = 34,
  curve = 1,
  tilt = 6,
  blur = 0,
  fade = 0.25,
  minOpacity = 0,
  smoothing = 200,
  inset = "80px",
  className = "",
}: OptionWheelProps) => {
  const rootRef = useRef<HTMLDivElement>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const posRef = useRef(defaultSelected);
  const targetRef = useRef(defaultSelected);
  const bloomRef = useRef(0);
  const bloomTargetRef = useRef(open ? 1 : 0);
  const rafRef = useRef<number | null>(null);
  const lastRef = useRef(0);
  const cfgRef = useRef<WheelConfig>({} as WheelConfig);
  const onChangeRef = useRef(onChange);
  const onFoldedRef = useRef(onFolded);
  const selectedRef = useRef(defaultSelected);
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const dragRef = useRef<{ y: number; start: number; id: number } | null>(null);
  const dragMovedRef = useRef(false);
  const reducedRef = useRef(false);
  const [selectedIndex, setSelectedIndex] = useState(defaultSelected);
  const [isDragging, setIsDragging] = useState(false);

  onChangeRef.current = onChange;
  onFoldedRef.current = onFolded;
  cfgRef.current = {
    count: items.length,
    items,
    rowH: Math.max(rowHeight, 1),
    curve,
    tilt,
    blur,
    fade,
    minOpacity,
    side,
    smoothing,
  };

  // Single rAF loop that eases the wheel position (and the fan's opening)
  // toward their targets with frame-rate independent exponential smoothing,
  // then lays every option out along the curve based on its distance.
  const runFrame = useCallback((now: number) => {
    const dt = Math.min((now - lastRef.current) / 1000, 0.05);
    lastRef.current = now;
    const cfg = cfgRef.current;
    const reduced = reducedRef.current;
    const k = reduced ? 1 : 1 - Math.exp(-dt / (Math.max(cfg.smoothing, 1) / 1000));

    const target = targetRef.current;
    let next = posRef.current + (target - posRef.current) * k;
    const settled = Math.abs(target - next) < 0.001;
    if (settled) next = target;
    posRef.current = next;

    // 展开慢一点（舒展），收拢快一点
    const bTarget = bloomTargetRef.current;
    const bTau = bTarget > bloomRef.current ? 0.11 : 0.06;
    const kb = reduced ? 1 : 1 - Math.exp(-dt / bTau);
    let bloom = bloomRef.current + (bTarget - bloomRef.current) * kb;
    const bloomSettled = Math.abs(bTarget - bloom) < 0.002;
    if (bloomSettled) bloom = bTarget;
    bloomRef.current = bloom;

    const els = itemRefs.current;
    const n = cfg.count;
    const mirror = cfg.side === "right" ? -1 : 1;
    // Options sit on a circle whose radius keeps the arc length between two
    // neighbors equal to one row height, so tilt controls how tightly it curls.
    const tiltRad = (cfg.tilt * Math.PI) / 180;
    const R = tiltRad > 0.0005 ? cfg.rowH / tiltRad : 0;
    for (let i = 0; i < n; i++) {
      const el = els[i];
      if (!el) continue;
      const d = i - next;
      const dist = Math.abs(d);
      let x = 0;
      let y = d * cfg.rowH * bloom;
      let rot = 0;
      if (R > 0) {
        const ang = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, d * tiltRad)) * bloom;
        y = R * Math.sin(ang);
        x = -mirror * R * (1 - Math.cos(ang)) * cfg.curve;
        rot = (mirror * ang * 180) / Math.PI;
      }
      const opacity = Math.max(cfg.minOpacity, 1 - dist * cfg.fade) * Math.min(1, bloom * 1.4);
      el.style.transform = `translate(${x.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%)) rotate(${rot.toFixed(3)}deg)`;
      el.style.opacity = opacity.toFixed(3);
      el.style.filter = cfg.blur > 0 ? `blur(${(dist * cfg.blur).toFixed(2)}px)` : "none";
      el.style.visibility = opacity < 0.01 ? "hidden" : "visible";
      el.style.setProperty("--ow-p", Math.max(0, 1 - Math.min(dist, 1)).toFixed(4));
    }

    if (bloomSettled && bTarget === 0) onFoldedRef.current?.();
    rafRef.current = settled && bloomSettled ? null : requestAnimationFrame(runFrame);
  }, []);

  const startLoop = useCallback(() => {
    if (rafRef.current != null) {
      cancelAnimationFrame(rafRef.current);
    }
    lastRef.current = performance.now();
    rafRef.current = requestAnimationFrame(runFrame);
  }, [runFrame]);

  const applyTarget = useCallback(
    (value: number, snap: boolean) => {
      const cfg = cfgRef.current;
      let v = Math.min(Math.max(value, 0), Math.max(cfg.count - 1, 0));
      if (snap) v = Math.round(v);
      targetRef.current = v;
      const idx = Math.round(v);
      if (idx !== selectedRef.current) {
        selectedRef.current = idx;
        setSelectedIndex(idx);
        onChangeRef.current?.(idx, cfg.items[idx]);
      }
      startLoop();
    },
    [startLoop],
  );

  // 展开 / 收拢
  useEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    bloomTargetRef.current = open ? 1 : 0;
    if (open) rootRef.current?.focus({ preventScroll: true });
    startLoop();
  }, [open, startLoop]);

  // Wheel / touchpad scrolling, registered manually so it can be non-passive.
  useEffect(() => {
    const el = rootRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const cfg = cfgRef.current;
      const delta = e.deltaMode === 1 ? e.deltaY * 24 : e.deltaY;
      // Cap each event at one step so notchy mouse wheels move exactly one
      // option per click, while touchpads still scroll continuously.
      const step = Math.max(-1, Math.min(1, delta / cfg.rowH));
      applyTarget(targetRef.current + step, false);
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
      wheelTimerRef.current = setTimeout(() => applyTarget(targetRef.current, true), 140);
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => {
      el.removeEventListener("wheel", onWheel);
      if (wheelTimerRef.current) clearTimeout(wheelTimerRef.current);
    };
  }, [applyTarget]);

  // 长按打开时指针还按着：继续拖动就拨动，松手时如果拖动过就直接选中
  useEffect(() => {
    if (!hold) return;
    const start = targetRef.current;
    let moved = false;
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== hold.id) return;
      const dy = e.clientY - hold.y;
      if (!moved && Math.abs(dy) > 4) moved = true;
      if (moved) applyTarget(start + dy / cfgRef.current.rowH, false);
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId !== hold.id) return;
      cleanup();
      applyTarget(targetRef.current, true);
      if (moved) onCommit?.(selectedRef.current);
    };
    const cleanup = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onUp);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onUp);
    return cleanup;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hold, applyTarget]);

  const handlePointerDown = useCallback((e: React.PointerEvent<HTMLDivElement>) => {
    dragRef.current = { y: e.clientY, start: targetRef.current, id: e.pointerId };
    dragMovedRef.current = false;
    setIsDragging(true);
  }, []);

  const handlePointerMove = useCallback(
    (e: React.PointerEvent<HTMLDivElement>) => {
      const drag = dragRef.current;
      if (!drag) return;
      const dy = e.clientY - drag.y;
      if (!dragMovedRef.current && Math.abs(dy) > 4) {
        dragMovedRef.current = true;
        // Capture only once a real drag starts, so plain clicks still reach
        // the items and navigate to them.
        rootRef.current?.setPointerCapture(drag.id);
      }
      // 抓着扇面拖：内容跟手走（与长按时「指到哪选到哪」相反，是有意的）
      if (dragMovedRef.current) applyTarget(drag.start - dy / cfgRef.current.rowH, false);
    },
    [applyTarget],
  );

  const handlePointerEnd = useCallback(() => {
    if (!dragRef.current) return;
    dragRef.current = null;
    setIsDragging(false);
    if (dragMovedRef.current) applyTarget(targetRef.current, true);
  }, [applyTarget]);

  const handleItemClick = useCallback(
    (index: number) => {
      if (dragMovedRef.current) return;
      if (index === selectedRef.current && Math.abs(targetRef.current - index) < 0.01) {
        onCommit?.(index);
        return;
      }
      applyTarget(index, true);
    },
    [applyTarget, onCommit],
  );

  const handleRootClick = useCallback(
    (e: React.MouseEvent<HTMLDivElement>) => {
      if (dragMovedRef.current) return;
      if (!(e.target as Element).closest(".option-wheel__item")) onDismiss?.();
    },
    [onDismiss],
  );

  const handleKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLDivElement>) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onDismiss?.();
        return;
      }
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        onCommit?.(selectedRef.current);
        return;
      }
      let delta: number | null = null;
      if (e.key === "ArrowUp" || e.key === "ArrowLeft") delta = -1;
      else if (e.key === "ArrowDown" || e.key === "ArrowRight") delta = 1;
      if (delta == null) return;
      e.preventDefault();
      applyTarget(Math.round(targetRef.current) + delta, true);
    },
    [applyTarget, onCommit, onDismiss],
  );

  useEffect(() => {
    applyTarget(targetRef.current, false);
  }, [items, rowHeight, curve, tilt, blur, fade, minOpacity, side, smoothing, applyTarget]);

  useEffect(
    () => () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    },
    [],
  );

  return (
    <div
      ref={rootRef}
      role="listbox"
      tabIndex={0}
      aria-label={label}
      aria-activedescendant={`ow-option-${selectedIndex}`}
      className={`option-wheel${side === "right" ? " option-wheel--right" : ""}${isDragging ? " option-wheel--dragging" : ""}${className ? ` ${className}` : ""}`}
      style={{ "--ow-inset": inset } as CSSProperties}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerEnd}
      onPointerCancel={handlePointerEnd}
      onClick={handleRootClick}
      onKeyDown={handleKeyDown}
    >
      {items.map((text, index) => (
        <div
          key={`${text}-${index}`}
          id={`ow-option-${index}`}
          ref={(el) => {
            itemRefs.current[index] = el;
          }}
          role="option"
          aria-selected={selectedIndex === index}
          className={`option-wheel__item${selectedIndex === index ? " option-wheel__item--selected" : ""}`}
          onClick={() => handleItemClick(index)}
        >
          {renderItem ? renderItem(text, index) : text}
        </div>
      ))}
    </div>
  );
};

export default OptionWheel;
