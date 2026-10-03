import type { Metadata, Viewport } from "next";
import { notFound } from "next/navigation";
import "@/lib/fonts";
import { site } from "@/lib/site";
import { getDictionary, htmlLang, isLocale, locales } from "@/lib/i18n";
import Nav from "@/components/Nav";
import Wordmark from "@/components/Wordmark";
import "../globals.css";

export const metadata: Metadata = {
  title: { default: site.name, template: `%s · ${site.name}` },
  // RSS 自动发现：订阅器填网站首页地址也能找到 /feed.xml
  alternates: { types: { "application/rss+xml": [{ url: "/feed.xml", title: site.name }] } },
};

export const viewport: Viewport = {
  themeColor: "#fbf9f5",
};

/** 只有 /zh、/en、/ru、/ja；其他前缀 404（无前缀的地址由 proxy.ts 先重定向） */
export const dynamicParams = false;

export function generateStaticParams() {
  return locales.map((lang) => ({ lang }));
}

type Props = { children: React.ReactNode; params: Promise<{ lang: string }> };

export default async function RootLayout({ children, params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);

  return (
    <html lang={htmlLang[lang]}>
      <body>
        <div className="page">
          <header className="header">
            <Wordmark name={site.name} href={`/${lang}`} />
            <Nav lang={lang} labels={t.nav} language={t.language} />
          </header>
          <main>{children}</main>
        </div>
      </body>
    </html>
  );
}
