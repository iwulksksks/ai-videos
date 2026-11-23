import { NextResponse } from "next/server";
import { createJob, pickBestIdea, waitingIdeas } from "@/lib/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { ideaId?: number };
  const idea = body.ideaId ? waitingIdeas().find((i) => i.id === body.ideaId) : pickBestIdea();
  if (!idea) return NextResponse.json({ error: "No waiting pitch to produce. Ask Pip for pitches first." }, { status: 400 });
  return NextResponse.json({ jobId: createJob(idea, "manual") });
}
