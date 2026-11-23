import path from "node:path";
import { NextResponse } from "next/server";
import { log } from "@/lib/db";
import { getJob } from "@/lib/pipeline";
import { postToTikTok, tiktokMode, setTikTokMode } from "@/lib/tiktok";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { jobId } = (await req.json()) as { jobId: number };
  const job = getJob(jobId);
  if (!job?.output_dir || !job.story_json) return NextResponse.json({ error: "That story isn't finished yet" }, { status: 400 });
  const prev = tiktokMode();
  try {
    if (prev === "off") setTikTokMode("draft");
    const r = await postToTikTok({ videoFile: path.join(job.output_dir, "video.mp4"), story: JSON.parse(job.story_json) });
    log("ship", `Hatch sent "${job.title}" to TikTok (${r}).`, "info", jobId);
    return NextResponse.json({ ok: true, result: r });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  } finally {
    if (prev === "off") setTikTokMode("off");
  }
}
