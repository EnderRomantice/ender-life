import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { getEpiphany } from "@/lib/epiphanies";
import { contentLang, isLocale, localizePlace } from "@/lib/i18n";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ lang: string; slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const e = getEpiphany((await params).slug);
  if (!e) return {};
  return { title: e.title ?? e.excerpt.replace(/<[^>]+>/g, "").split(/\n/)[0].slice(0, 40) };
}

export default async function EpiphanyPage({ params }: Params) {
  const { lang, slug } = await params;
  const e = getEpiphany(slug);
  if (!e || !isLocale(lang)) notFound();
  const place = localizePlace(e.place, lang);

  return (
    <ViewTransition>
    <article className="article">
      <div className="meta">
        <time className="meta-time">{e.time}</time>
        {place && <span className="meta-place">{place}</span>}
      </div>
      {e.title && <h1 className="article-title" lang={contentLang}>{e.title}</h1>}
      <div className="prose" lang={contentLang} dangerouslySetInnerHTML={{ __html: e.html }} />
    </article>
    </ViewTransition>
  );
}
