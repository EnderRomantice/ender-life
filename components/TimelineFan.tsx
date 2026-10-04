"use client";

import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import type { TimelineMark } from "@/lib/types";
import OptionWheel from "./reactbits/OptionWheel";
import { contentLang } from "@/lib/i18n/config";

type Props = {
  marks: TimelineMark[];
  label: string;
  hint: string;
  start: number;
  /** 长按时按下的指针：打开后一直按着，滑动拨动，松手结束 */
  hold: { id: number; y: number; touch?: boolean };
  onJump: (index: number) => void;
  /** 松手或取消的那一刻（收拢动画开始前） */
  onEnd: () => void;
  onClosed: () => void;
};

/**
 * 长按后展开的扇形时间轴（React Bits · OptionWheel）。
 * 按住不放：上下滑动或滚轮拨动；松手跳到停住的那一篇（没动过就只收起）；Esc 取消。
 */
export default function TimelineFan({ marks, label, hint, start, hold, onJump, onEnd, onClosed }: Props) {
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState(start);
  const mark = marks[selected];
  const labels = useMemo(() => marks.map((m) => m.label), [marks]);

  const end = (jumpTo: number | null) => {
    if (!open) return;
    setOpen(false);
    onEnd();
    if (jumpTo !== null) onJump(jumpTo);
  };

  return createPortal(
    <div className={open ? "fan fan--open" : "fan"}>
      <div className="fan__veil" />
      <OptionWheel
        items={labels}
        defaultSelected={start}
        hold={hold}
        open={open}
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
