"use client";

/**
 * OptionWheel — adapted from React Bits (https://reactbits.dev), © 2026 David Haz,
 * MIT + Commons Clause (see ./LICENSE.md).
 *
 * 改动：
 * - 只保留「按住—滑动—松手」：长按打开后指针一直按着，上下滑动拨动扇面
 *   （内容跟手走），也可以同时用滚轮；松手时通过 onRelease 告诉外面停在哪一项
 * - open：扇面展开 / 收拢（各项从中线向两侧张开，收拢时反向）
 * - Esc：取消
 * - renderItem：自定义每一项的内容
 * - 去掉了点击选项、声音
 */

import { useRef, useState, useCallback, useEffect, type CSSProperties, type ReactNode } from "react";
import "./OptionWheel.css";

type Side = "left" | "right";

export interface OptionWheelProps {
  items: string[];
  defaultSelected?: number;
  /** 打开时仍按着的指针（id 与当时的纵坐标） */
  hold: { id: number; y: number };
  onChange?: (index: number, item: string) => void;
  /** 松手：停在哪一项、期间是否拨动过 */
  onRelease?: (index: number, moved: boolean) => void;
  onCancel?: () => void;
  onFolded?: () => void;
  open?: boolean;
  renderItem?: (item: string, index: number) => ReactNode;
  label?: string;
  side?: Side;
  rowHeight?: number;
  curve?: number;
  tilt?: number;
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
  fade: number;
  minOpacity: number;
  side: Side;
  smoothing: number;
}

const OptionWheel = ({
  items,
  defaultSelected = 0,
  hold,
  onChange,
  onRelease,
  onCancel,
  onFolded,
  open = true,
  renderItem,
  label,
  side = "left",
  rowHeight = 34,
  curve = 1,
  tilt = 6,
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
  const onReleaseRef = useRef(onRelease);
  const onCancelRef = useRef(onCancel);
  const onFoldedRef = useRef(onFolded);
  const selectedRef = useRef(defaultSelected);
  const wheelTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const movedRef = useRef(false);
  const draggingRef = useRef(false);
  const reducedRef = useRef(false);
  const [selectedIndex, setSelectedIndex] = useState(defaultSelected);

  onChangeRef.current = onChange;
  onReleaseRef.current = onRelease;
  onCancelRef.current = onCancel;
  onFoldedRef.current = onFolded;
  cfgRef.current = {
    count: items.length,
    items,
    rowH: Math.max(rowHeight, 1),
    curve,
    tilt,
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
    // 手指 / 鼠标拖动时几乎直接跟随，松手吸附时再用正常的缓动
    const tau = draggingRef.current ? 18 : cfg.smoothing;
    const k = reduced ? 1 : 1 - Math.exp(-dt / (Math.max(tau, 1) / 1000));

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
      el.style.visibility = opacity < 0.01 ? "hidden" : "visible";
      el.style.setProperty("--ow-p", Math.max(0, 1 - Math.min(dist, 1)).toFixed(4));
    }

    if (bloomSettled && bTarget === 0) onFoldedRef.current?.();
    rafRef.current = settled && bloomSettled ? null : requestAnimationFrame(runFrame);
  }, []);

  // 已在运行就不重启：原版每次指针移动都重启循环并重置时间戳，
  // 导致每帧的 dt 极小、缓动几乎不动，拖动时明显跟不上手
  const startLoop = useCallback(() => {
    if (rafRef.current != null) return;
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
      movedRef.current = true;
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

  // 按住滑动：内容跟手走（往上滑，更早的条目转到中间）；松手结束。
  // 按增量累计：慢慢滑一格对一格，快速划过时按速度放大（最多约 3 倍），长列表也能一下拨远
  useEffect(() => {
    let lastY = hold.y;
    let lastT = performance.now();
    let done = false;
    const onMove = (e: PointerEvent) => {
      if (e.pointerId !== hold.id || done) return;
      if (!movedRef.current) {
        if (Math.abs(e.clientY - hold.y) <= 4) return;
        movedRef.current = true;
        draggingRef.current = true;
      }
      const now = performance.now();
      const step = e.clientY - lastY;
      const v = Math.abs(step) / Math.max(now - lastT, 1); // px/ms
      lastY = e.clientY;
      lastT = now;
      const gain = 1 + Math.min(2, Math.max(0, (v - 0.35) * 1.6));
      applyTarget(targetRef.current - (step / cfgRef.current.rowH) * gain, false);
    };
    const finish = (release: boolean) => {
      if (done) return;
      done = true;
      draggingRef.current = false;
      cleanup();
      applyTarget(targetRef.current, true);
      if (release) onReleaseRef.current?.(selectedRef.current, movedRef.current);
      else onCancelRef.current?.();
    };
    const onUp = (e: PointerEvent) => {
      if (e.pointerId === hold.id) finish(true);
    };
    const onCancelPointer = (e: PointerEvent) => {
      if (e.pointerId === hold.id) finish(false);
    };
    const onBlur = () => finish(false);
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        finish(false);
      }
    };
    const cleanup = () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
      window.removeEventListener("pointercancel", onCancelPointer);
      window.removeEventListener("blur", onBlur);
      window.removeEventListener("keydown", onKey);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
    window.addEventListener("pointercancel", onCancelPointer);
    window.addEventListener("blur", onBlur);
    window.addEventListener("keydown", onKey);
    return cleanup;
  }, [hold, applyTarget]);

  useEffect(() => {
    applyTarget(targetRef.current, false);
  }, [items, rowHeight, curve, tilt, fade, minOpacity, side, smoothing, applyTarget]);

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
      tabIndex={-1}
      aria-label={label}
      aria-activedescendant={`ow-option-${selectedIndex}`}
      className={`option-wheel${side === "right" ? " option-wheel--right" : ""}${className ? ` ${className}` : ""}`}
      style={{ "--ow-inset": inset } as CSSProperties}
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
        >
          {renderItem ? renderItem(text, index) : text}
        </div>
      ))}
    </div>
  );
};

export default OptionWheel;
