import { getEpiphanies } from "@/lib/epiphanies";
import { isLocale } from "@/lib/i18n";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  const cursor = Number(params.get("cursor") ?? 0) || 0;
  const lang = params.get("lang");
  return Response.json(getEpiphanies(cursor, lang && isLocale(lang) ? lang : undefined));
}
