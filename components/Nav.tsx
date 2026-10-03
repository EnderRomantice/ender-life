"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { stripLocale, type Locale } from "@/lib/i18n/config";
import LangMenu from "./LangMenu";

type Props = {
  lang: Locale;
  labels: { epiphanies: string; media: string; about: string };
  /** 地球按钮的无障碍名称（「语言」） */
  language: string;
};

function isActive(rest: string, key: string) {
  if (key === "/") return rest === "/" || rest.startsWith("/epiphanies");
  return rest.startsWith(key);
}

export default function Nav({ lang, labels, language }: Props) {
  const rest = stripLocale(usePathname());
  const links = [
    { key: "/", href: `/${lang}`, label: labels.epiphanies },
    { key: "/media", href: `/${lang}/media`, label: labels.media },
    { key: "/about", href: `/${lang}/about`, label: labels.about },
  ];

  return (
    <nav className="nav">
      {links.map((l) => (
        <Link key={l.key} href={l.href} aria-current={isActive(rest, l.key) ? "page" : undefined}>
          {l.label}
        </Link>
      ))}
      <LangMenu lang={lang} label={language} />
    </nav>
  );
}
