import type { Metadata, Viewport } from "next";
import Link from "next/link";
import "@/lib/fonts";
import { site } from "@/lib/site";
import Nav from "@/components/Nav";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: site.name, template: `%s · ${site.name}` },
};

export const viewport: Viewport = {
  themeColor: "#fbf9f5",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <div className="page">
          <header className="header">
            <Link href="/" className="wordmark">
              {site.name}
            </Link>
            <Nav />
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
