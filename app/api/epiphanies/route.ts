import { getEpiphanies } from "@/lib/epiphanies";

export const dynamic = "force-dynamic";

export function GET(req: Request) {
  const cursor = Number(new URL(req.url).searchParams.get("cursor") ?? 0) || 0;
  return Response.json(getEpiphanies(cursor));
}
