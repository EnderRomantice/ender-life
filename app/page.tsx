import { ViewTransition } from "react";
import { getEpiphanies, getTimeline } from "@/lib/epiphanies";
import EpiphanyList from "@/components/EpiphanyList";

export const dynamic = "force-dynamic";

export default function EpiphaniesPage() {
  const { items, nextCursor } = getEpiphanies(0);
  return (
    <ViewTransition>
      <EpiphanyList initialItems={items} initialCursor={nextCursor} timeline={getTimeline()} />
    </ViewTransition>
  );
}
