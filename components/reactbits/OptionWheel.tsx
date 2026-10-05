"use client";

/**
 * OptionWheel — adapted from React Bits (https://reactbits.dev), © 2026 David Haz,
 * MIT + Commons Clause (see ./LICENSE.md).
 *
 * 改动：
 * - 只保留「按住—滑动—松手」：长按打开后指针一直按着，上下滑动拨动扇面
 *   （内容跟手走），也可以同时用滚轮；松手时通过 onRelease 告诉外面停在哪一项
 * - open：扇面展开 / 收拢。给了 origin 时，每一项从 origin 里对应的那一格（例如页面左侧的
 *   时间刻度）出发，沿各自的路径变形到弧线上，收拢时原路回去；中间那一项先动，两侧依次跟上。
 *   没有 origin 时，从左边一条压扁的竖线里展开
 * - Esc：取消
 * - renderItem：自定义每一项的内容
 * - 去掉了点击选项、声音
 */

import { useRef, useState, useCallback, useEffect, useLayoutEffect, type CSSProperties, type ReactNode } from "react";
import "./OptionWheel.css";

type Side = "left" | "right";

/** 扇面从哪里变出来、收拢回哪里 */
export interface WheelOrigin {
  /** 每一项对应的那一格：刻度左端中点的视口坐标；visible 为 false 时从那里淡入 */
  measure: () => ({ x: number; y: number; visible: boolean } | null)[];
  /** 那一格当时的强调程度（0..1，例如当前项 / 光标附近）；用来让起点的样子和它一致 */
  emphasis?: (index: number) => number;
}

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
  origin?: WheelOrigin;
  /** 扇面中线的纵坐标（视口 px）；默认视口正中 */
  center?: number;
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
  origin,
  center,
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
  // 每一项各自的展开进度（0 = 在起点那一格，1 = 在弧线上）与速度：临界阻尼弹簧，起步和落地都是缓的，
  // 中途反向也连续
  const bloomRef = useRef<number[]>([]);
  const velRef = useRef<number[]>([]);
  const openRef = useRef(open);
  const toggledAtRef = useRef(0);
  const originRef = useRef<({ dx: number; dy: number; visible: boolean } | null)[]>([]);
  const originPropRef = useRef(origin);
  const centerRef = useRef(center);
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
  originPropRef.current = origin;
  centerRef.current = center;
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

  /** 量出每一项起点那一格相对于它在扇面里的基准位置（left = inset，top = 视口中线）的偏移 */
  const measureOrigin = useCallback(() => {
    const root = rootRef.current;
    const pts = originPropRef.current?.measure() ?? [];
    const mid = centerRef.current ?? (root?.clientHeight ?? window.innerHeight) / 2;
    originRef.current = itemRefs.current.map((el, i) => {
      const p = pts[i];
      if (!el || !p) return null;
      return { dx: p.x - el.offsetLeft, dy: p.y - mid, visible: p.visible };
    });
  }, []);

  /** 按当前的滚动位置与各项的展开进度，把每一项摆到起点与弧线之间 */
  const layout = useCallback(() => {
    const cfg = cfgRef.current;
    const els = itemRefs.current;
    const n = cfg.count;
    const pos = posRef.current;
    const mirror = cfg.side === "right" ? -1 : 1;
    // Options sit on a circle whose radius keeps the arc length between two
    // neighbors equal to one row height, so tilt controls how tightly it curls.
    const tiltRad = (cfg.tilt * Math.PI) / 180;
    const R = tiltRad > 0.0005 ? cfg.rowH / tiltRad : 0;
    const emphasis = originPropRef.current?.emphasis;
    for (let i = 0; i < n; i++) {
      const el = els[i];
      if (!el) continue;
      const d = i - pos;
      const dist = Math.abs(d);
      // 扇面上的位置
      let fx = 0;
      let fy = d * cfg.rowH;
      let frot = 0;
      if (R > 0) {
        const ang = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, d * tiltRad));
        fy = R * Math.sin(ang);
        fx = -mirror * R * (1 - Math.cos(ang)) * cfg.curve;
        frot = (mirror * ang * 180) / Math.PI;
      }
      const fOpacity = Math.max(cfg.minOpacity, 1 - dist * cfg.fade);
      // 起点：对应的那一格；没有就是左边一条压扁的竖线（看不见，从那里淡入）
      const o = originRef.current[i];
      const ox = o ? o.dx : 0;
      const oy = o ? o.dy : d * cfg.rowH * 0.4;
      const oOpacity = o?.visible ? 1 : 0;
      const b = bloomRef.current[i] ?? 0;
      const x = ox + (fx - ox) * b;
      const y = oy + (fy - oy) * b;
      const rot = frot * b;
      const opacity = oOpacity + (fOpacity - oOpacity) * b;
      el.style.transform = `translate(${x.toFixed(2)}px, calc(${y.toFixed(2)}px - 50%)) rotate(${rot.toFixed(3)}deg)`;
      el.style.opacity = opacity.toFixed(3);
      el.style.visibility = opacity < 0.01 ? "hidden" : "visible";
      el.style.setProperty("--ow-p", Math.max(0, 1 - Math.min(dist, 1)).toFixed(4));
      el.style.setProperty("--ow-b", b.toFixed(4));
      el.style.setProperty("--ow-e", b < 1 && emphasis ? emphasis(i).toFixed(4) : "0");
    }
  }, []);

  // Single rAF loop: the wheel position eases toward its target with
  // frame-rate independent exponential smoothing; every option's bloom runs
  // its own critically damped spring (staggered from the middle outward).
  const runFrame = useCallback(
    (now: number) => {
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

      // 展开：中间先动，越往外越晚（最多晚 120ms）；收拢：外侧先回去，中间最后落回原位
      const isOpen = openRef.current;
      const since = (now - toggledAtRef.current) / 1000;
      const omega = isOpen ? 15 : 21;
      let bloomSettled = true;
      for (let i = 0; i < cfg.count; i++) {
        const spread = Math.min(Math.abs(i - next) / 4, 1);
        const wait = isOpen ? 0.12 * spread : 0.08 * (1 - spread);
        const goal = since < wait ? (isOpen ? 0 : 1) : isOpen ? 1 : 0;
        let b = bloomRef.current[i] ?? 0;
        let v = velRef.current[i] ?? 0;
        if (reduced) {
          b = isOpen ? 1 : 0;
          v = 0;
        } else {
          // 小步长积分，保证弹簧稳定
          for (let t = dt; t > 0; t -= 1 / 240) {
            const h = Math.min(t, 1 / 240);
            v += (omega * omega * (goal - b) - 2 * omega * v) * h;
            b += v * h;
          }
        }
        const final = isOpen ? 1 : 0;
        if (Math.abs(final - b) < 0.002 && Math.abs(v) < 0.02 && goal === final) {
          b = final;
          v = 0;
        } else bloomSettled = false;
        bloomRef.current[i] = Math.min(Math.max(b, 0), 1);
        velRef.current[i] = v;
      }

      layout();

      if (bloomSettled && !isOpen) onFoldedRef.current?.();
      rafRef.current = settled && bloomSettled ? null : requestAnimationFrame(runFrame);
    },
    [layout],
  );

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

  // 第一次出现：量好起点，在第一帧画出来之前就把每一项摆在起点上，不会闪一下
  useLayoutEffect(() => {
    reducedRef.current = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    measureOrigin();
    layout();
  }, [measureOrigin, layout]);

  // 展开 / 收拢：收拢前重新量一次起点（期间页面可能已经跳转、刻度的当前项变了）
  useEffect(() => {
    if (openRef.current !== open) {
      openRef.current = open;
      if (!open) measureOrigin();
    }
    toggledAtRef.current = performance.now();
    if (open) rootRef.current?.focus({ preventScroll: true });
    startLoop();
  }, [open, startLoop, measureOrigin]);

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
      style={{ "--ow-inset": inset, ...(center != null && { "--ow-center": `${center}px` }) } as CSSProperties}
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
