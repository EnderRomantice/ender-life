"use client";

import { useMemo, useState, type CSSProperties, type RefObject } from "react";
import { createPortal } from "react-dom";
import type { TimelineMark } from "@/lib/types";
import OptionWheel, { type WheelOrigin } from "./reactbits/OptionWheel";
import { contentLang } from "@/lib/i18n/config";

type Props = {
  marks: TimelineMark[];
  label: string;
  hint: string;
  start: number;
  /** 长按时按下的指针：打开后一直按着，滑动拨动，松手结束 */
  hold: { id: number; y: number; touch?: boolean };
  /** 页面左侧的时间刻度：扇面从它变形出来，收拢时变回去（窄屏上它不显示，就从左边展开） */
  from?: RefObject<HTMLElement | null>;
  onJump: (index: number) => void;
  /** 松手或取消的那一刻（收拢动画开始前） */
  onEnd: () => void;
  onClosed: () => void;
};

/**
 * 长按后展开的扇形时间轴（React Bits · OptionWheel）。
 * 按住不放：上下滑动或滚轮拨动；松手跳到停住的那一篇（没动过就只收起）；Esc 取消。
 */
/** 时间刻度里每一格的位置与强调程度，交给扇面当起点 */
function originOf(from: RefObject<HTMLElement | null> | undefined): WheelOrigin {
  let rows: HTMLElement[] = [];
  return {
    measure: () => {
      const el = from?.current;
      if (!el || !el.getClientRects().length) return [];
      const box = el.getBoundingClientRect();
      rows = [...el.querySelectorAll<HTMLElement>(".line-sidebar__item")];
      return rows.map((row) => {
        const marker = row.querySelector(".line-sidebar__marker");
        if (!marker) return null;
        const r = marker.getBoundingClientRect();
        const y = r.top + r.height / 2;
        // 刻度列自己能滚动：滚出可见范围的那几格从原处淡入
        return { x: r.left, y, visible: y >= box.top && y <= box.bottom };
      });
    },
    emphasis: (i) => Number.parseFloat(rows[i]?.style.getPropertyValue("--effect") || "0") || 0,
  };
}

export default function TimelineFan({ marks, label, hint, start, hold, from, onJump, onEnd, onClosed }: Props) {
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState(start);
  const mark = marks[selected];
  const labels = useMemo(() => marks.map((m) => m.label), [marks]);
  const origin = useMemo(() => originOf(from), [from]);
  // 扇面就在起点那一格的高度上张开（宽屏：左侧刻度里的那一格；窄屏：手指按下的高度），
  // 只是别太靠近屏幕上下边，免得一侧被裁掉
  const [center] = useState(() => {
    const h = window.innerHeight;
    const at = origin.measure()[start]?.y ?? hold.y;
    return Math.round(Math.min(Math.max(at, h * 0.36), h * 0.64));
  });

  const end = (jumpTo: number | null) => {
    if (!open) return;
    setOpen(false);
    onEnd();
    if (jumpTo !== null) onJump(jumpTo);
  };

  return createPortal(
    <div className={open ? "fan fan--open" : "fan"} style={{ "--fan-y": `${center}px` } as CSSProperties}>
      <div className="fan__veil" />
      <OptionWheel
        items={labels}
        defaultSelected={start}
        hold={hold}
        open={open}
        origin={origin}
        center={center}
        label={label}
        rowHeight={36}
        tilt={7.5}
        fade={0.16}
        smoothing={140}
        inset="var(--fan-inset)"
        onChange={(i) => setSelected(i)}
        onRelease={(i, moved) => end(moved && i !== start ? i : null)}
        onCancel={() => end(null)}
        onFolded={onClosed}
        renderItem={(label) => (
          <span className="fan__item">
            <span className="fan__tick" aria-hidden="true" />
            <span className="fan__label">{label}</span>
          </span>
        )}
      />
      {mark && (
        <div className="fan__caption" key={mark.slug} aria-live="polite">
          <div className="fan__meta">{mark.title}</div>
          <p className="fan__preview" lang={contentLang}>{mark.preview}</p>
        </div>
      )}
      <p className="fan__hint" aria-hidden="true">
        {hint}
      </p>
    </div>,
    document.body,
  );
}
