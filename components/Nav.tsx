"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const links = [
  { href: "/", label: "Epiphanies" },
  { href: "/about", label: "About" },
];

function isActive(path: string, href: string) {
  if (href === "/") return path === "/" || path.startsWith("/epiphanies");
  return path.startsWith(href);
}

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="nav">
      {links.map((l) => (
        <Link key={l.href} href={l.href} aria-current={isActive(path, l.href) ? "page" : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
