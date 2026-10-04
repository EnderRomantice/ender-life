"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useId, useRef, useState } from "react";
import { GlobeIcon } from "@primer/octicons-react";
import { htmlLang, localeNames, locales, stripLocale, switchLocalePath, type Locale } from "@/lib/i18n/config";

type Props = {
  lang: Locale;
  labels: { epiphanies: string; media: string; about: string };
  /** 地球按钮的无障碍名称（「语言」） */
  language: string;
};

/**
 * idle：显示导航；open：导航收进地球，语言选项从地球里吐出来；
 * closing：语言收回去，导航再吐出来，播完回到 idle
 */
type State = "idle" | "open" | "closing";

function isActive(rest: string, key: string) {
  if (key === "/") return rest === "/" || rest.startsWith("/epiphanies");
  return rest.startsWith(key);
}

/**
 * 导航 + 语言切换，同一行里来回换：
 * 点地球，导航往右收进地球，语言选项再从地球往左吐出来；再点一下（或 Esc、点别处）反过来。
 * 语言选项浮在导航原来的位置上，不占位，整行不会被推动。
 */
export default function Nav({ lang, labels, language }: Props) {
  const path = usePathname();
  const rest = stripLocale(path);
  const [state, setState] = useState<State>("idle");
  const rootRef = useRef<HTMLElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const langsId = useId();
  const open = state === "open";

  const links = [
    { key: "/", href: `/${lang}`, label: labels.epiphanies },
    { key: "/media", href: `/${lang}/media`, label: labels.media },
    { key: "/about", href: `/${lang}/about`, label: labels.about },
  ];

  const close = (refocus = false) => {
    setState((s) => (s !== "open" ? s : reducedMotion() ? "idle" : "closing"));
    if (refocus) buttonRef.current?.focus();
  };

  // 换了页面就收回来
  useEffect(() => {
    setState((s) => (s === "open" ? (reducedMotion() ? "idle" : "closing") : s));
  }, [path]);

  // 点别处、按 Esc 收回
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  return (
    <nav
      ref={rootRef}
      className="nav"
      data-lang={state}
      onBlur={(e) => {
        if (open && !rootRef.current?.contains(e.relatedTarget as Node | null)) close();
      }}
    >
      <div
        className="nav__links"
        inert={state === "open"}
        onAnimationEnd={(e) => {
          // 导航重新吐出来之后，回到静止状态
          if (e.target === e.currentTarget && e.animationName === "nav-out-of-globe") setState("idle");
        }}
      >
        {links.map((l) => (
          <Link key={l.key} href={l.href} aria-current={isActive(rest, l.key) ? "page" : undefined}>
            {l.label}
          </Link>
        ))}
      </div>
      <ul id={langsId} className="nav__langs" hidden={state === "idle"} aria-label={language}>
        {locales.map((l) => (
          <li key={l}>
            <Link
              className={`nav__lang nav__lang--${l}`}
              href={switchLocalePath(path, l)}
              hrefLang={htmlLang[l]}
              lang={htmlLang[l]}
              aria-current={l === lang ? "true" : undefined}
            >
              {localeNames[l]}
            </Link>
          </li>
        ))}
      </ul>
      <button
        ref={buttonRef}
        type="button"
        className="nav__globe"
        aria-label={language}
        title={language}
        aria-expanded={open}
        aria-controls={langsId}
        onClick={() => (open ? close() : setState("open"))}
      >
        <GlobeIcon size={16} aria-hidden="true" />
      </button>
    </nav>
  );
}

const reducedMotion = () => window.matchMedia("(prefers-reduced-motion: reduce)").matches;
