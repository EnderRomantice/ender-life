import { getEpiphanies } from "@/lib/epiphanies";
import EpiphanyList from "@/components/EpiphanyList";

export const dynamic = "force-dynamic";

export default function EpiphaniesPage() {
  const { items, nextCursor } = getEpiphanies(0);
  return <EpiphanyList initialItems={items} initialCursor={nextCursor} />;
}
