import { ViewTransition } from "react";
import { notFound } from "next/navigation";
import { getEpiphanies, getTimeline } from "@/lib/epiphanies";
import { getDictionary, isLocale } from "@/lib/i18n";
import EpiphanyList from "@/components/EpiphanyList";

export const dynamic = "force-dynamic";

type Props = { params: Promise<{ lang: string }> };

export default async function EpiphaniesPage({ params }: Props) {
  const { lang } = await params;
  if (!isLocale(lang)) notFound();
  const t = getDictionary(lang);
  const { items, nextCursor } = getEpiphanies(0, lang);

  return (
    <ViewTransition>
      <EpiphanyList
        initialItems={items}
        initialCursor={nextCursor}
        timeline={getTimeline(lang)}
        lang={lang}
        t={{ more: t.more, timeline: t.timeline, fanHint: t.fanHint, fanHintTouch: t.fanHintTouch }}
      />
    </ViewTransition>
  );
}
