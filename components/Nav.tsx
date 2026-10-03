"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { switchLocalePath, type Locale } from "@/lib/i18n/config";

type Props = {
  lang: Locale;
  labels: { epiphanies: string; media: string; about: string };
  switchLabel: string;
  switchTitle: string;
};

function isActive(rest: string, key: string) {
  if (key === "/") return rest === "/" || rest.startsWith("/epiphanies");
  return rest.startsWith(key);
}

export default function Nav({ lang, labels, switchLabel, switchTitle }: Props) {
  const path = usePathname();
  const rest = path.replace(/^\/(zh|en)(?=\/|$)/, "") || "/";
  const other: Locale = lang === "zh" ? "en" : "zh";
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
      <Link
        className="nav-lang"
        href={switchLocalePath(path, other)}
        hrefLang={other}
        lang={other === "zh" ? "zh-CN" : "en"}
        title={switchTitle}
      >
        {switchLabel}
      </Link>
    </nav>
  );
}
