import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { ViewTransition } from "react";
import { getMedia } from "@/lib/media";
import { getDictionary, isLocale, localizePlace } from "@/lib/i18n";
import MediaGallery from "@/components/MediaGallery";

type Props = { params: Promise<{ lang: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { lang } = await params;
  return { title: isLocale(lang) ? getDictionary(lang).nav.media : "Media" };
}

/** 影像：public/media/ 里的照片，瀑布流排列，点开看大图（说明见 lib/media.ts） */
export default async function MediaPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  const items = getMedia().map((m) => ({ ...m, placeLabel: localizePlace(m.place, lang) }));

  return (
    <ViewTransition>
      <section className="media">
        {items.length > 0 ? (
          <MediaGallery items={items} labels={t.lightbox} />
        ) : (
          <p className="media-empty">{t.mediaEmpty}</p>
        )}
      </section>
    </ViewTransition>
  );
}
