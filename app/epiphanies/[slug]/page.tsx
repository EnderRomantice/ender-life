import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { getEpiphany } from "@/lib/epiphanies";

export const dynamic = "force-dynamic";

type Params = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  const e = getEpiphany((await params).slug);
  if (!e) return {};
  return { title: e.title ?? e.excerpt.replace(/<[^>]+>/g, "").split(/\n/)[0].slice(0, 40) };
}

export default async function EpiphanyPage({ params }: Params) {
  const e = getEpiphany((await params).slug);
  if (!e) notFound();

  return (
    <ViewTransition>
    <article className="article">
      <div className="meta">
        <time className="meta-time">{e.time}</time>
        {e.place && <span className="meta-place">{e.place}</span>}
      </div>
      {e.title && <h1 className="article-title">{e.title}</h1>}
      <div className="prose" dangerouslySetInnerHTML={{ __html: e.html }} />
    </article>
    </ViewTransition>
  );
}
