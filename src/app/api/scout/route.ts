import { NextResponse } from "next/server";
import { addScoutChannel, removeScoutChannel, runScout, scoutStatus, setScoutKeywords } from "@/lib/agents/scout";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** { run: true } scouts now; { add: "link or @handle" } watches a channel; { remove: id }; { keywords: [...] }. */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { run?: boolean; add?: string; remove?: string; keywords?: string[] };
  try {
    if (body.add) await addScoutChannel(body.add);
    if (body.remove) removeScoutChannel(body.remove);
    if (body.keywords) setScoutKeywords(body.keywords);
    if (body.run) await runScout(true);
    return NextResponse.json(scoutStatus());
  } catch (e) {
    const msg = (e as Error).message;
    return NextResponse.json({ error: body.add ? `Couldn't add "${body.add}": ${msg}. Paste the channel's link (youtube.com/@name).` : msg }, { status: 500 });
  }
}
