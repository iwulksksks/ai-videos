import path from "node:path";
import { NextResponse } from "next/server";
import { log } from "@/lib/db";
import { getJob } from "@/lib/pipeline";
import { postToYouTube, youtubeMode } from "@/lib/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const { jobId } = (await req.json()) as { jobId: number };
  const job = getJob(jobId);
  if (!job?.output_dir || !job.story_json) return NextResponse.json({ error: "That story isn't finished yet" }, { status: 400 });
  try {
    const mode = youtubeMode();
    const link = await postToYouTube({
      videoFile: path.join(job.output_dir, "video.mp4"),
      story: JSON.parse(job.story_json),
      privacy: mode === "off" ? "private" : mode,
    });
    log("ship", `Hatch uploaded "${job.title}" to YouTube: ${link}`, "info", jobId);
    return NextResponse.json({ ok: true, result: link });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
