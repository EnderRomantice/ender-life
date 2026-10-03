"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { GlobeIcon } from "@primer/octicons-react";
import { htmlLang, localeNames, locales, switchLocalePath, type Locale } from "@/lib/i18n/config";

type Props = { lang: Locale; label: string };

type State = "closed" | "open" | "closing";

/** 收起：有动画就先播完再藏；减少动态时直接藏 */
const folded = (s: State): State =>
  s !== "open" ? s : window.matchMedia("(prefers-reduced-motion: reduce)").matches ? "closed" : "closing";

/**
 * 语言选择：导航末尾一个小地球，点开浮出语言列表。
 * 列表绝对定位、不占位，开合都不会推动导航；
 * 关着的时候是 hidden，日文等字体在打开前不会去下载。
 */
export default function LangMenu({ lang, label }: Props) {
  const path = usePathname();
  const [state, setState] = useState<State>("closed");
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const listId = useId();
  const open = state === "open";

  const close = (refocus = false) => {
    setState(folded);
    if (refocus) buttonRef.current?.focus();
  };

  // 换了页面（包括切换语言）就收起
  useEffect(() => {
    setState("closed");
  }, [path]);

  // 点外面、按 Esc 收起
  useEffect(() => {
    if (!open) return;
    const onDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        close(true);
      }
    };
    window.addEventListener("pointerdown", onDown);
    window.addEventListener("keydown", onKey);
    return () => {
      window.removeEventListener("pointerdown", onDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <div
      ref={rootRef}
      className="lang"
      data-state={state}
      onBlur={(e) => {
        if (open && !rootRef.current?.contains(e.relatedTarget as Node | null)) close();
      }}
    >
      <button
        ref={buttonRef}
        type="button"
        className="lang__button"
        aria-label={label}
        title={label}
        aria-expanded={open}
        aria-controls={listId}
        onClick={() => setState(open ? folded : () => "open")}
      >
        <GlobeIcon size={16} aria-hidden="true" />
      </button>
      <ul
        id={listId}
        className="lang__list"
        hidden={state === "closed"}
        onAnimationEnd={() => setState((s) => (s === "closing" ? "closed" : s))}
      >
        {locales.map((l) => (
          <li key={l}>
            <Link
              className={`lang__item lang__item--${l}`}
              href={switchLocalePath(path, l)}
              hrefLang={htmlLang[l]}
              lang={htmlLang[l]}
              aria-current={l === lang ? "true" : undefined}
              onClick={() => close()}
            >
              {localeNames[l]}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
