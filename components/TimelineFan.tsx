"use client";

import { useState } from "react";
import { createPortal } from "react-dom";
import type { TimelineMark } from "@/lib/types";
import OptionWheel from "./reactbits/OptionWheel";

type Props = {
  marks: TimelineMark[];
  start: number;
  /** 长按打开时仍按着的指针，继续拖动即可拨动 */
  hold: { id: number; y: number } | null;
  onJump: (index: number) => void;
  onClosed: () => void;
};

/**
 * 长按左侧刻度后展开的扇形时间轴（React Bits · OptionWheel）。
 * 滚轮 / 拖动 / 方向键拨动；点中间那项、回车或拖动后松手跳过去；Esc 或点空白处收起。
 */
export default function TimelineFan({ marks, start, hold, onJump, onClosed }: Props) {
  const [open, setOpen] = useState(true);
  const [selected, setSelected] = useState(start);
  const mark = marks[selected];

  const commit = (index: number) => {
    if (!open) return;
    setOpen(false);
    onJump(index);
  };

  return createPortal(
    <div className={open ? "fan fan--open" : "fan"}>
      <div className="fan__veil" />
      <OptionWheel
        items={marks.map((m) => m.label)}
        defaultSelected={start}
        open={open}
        hold={hold}
        label="时间线"
        rowHeight={36}
        tilt={7.5}
        fade={0.16}
        smoothing={160}
        inset="var(--fan-inset)"
        onChange={(i) => setSelected(i)}
        onCommit={commit}
        onDismiss={() => setOpen(false)}
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
          <p className="fan__preview">{mark.preview}</p>
        </div>
      )}
      <p className="fan__hint" aria-hidden="true">
        滚动或拖动 · 点选跳转 · Esc 收起
      </p>
    </div>,
    document.body,
  );
}
