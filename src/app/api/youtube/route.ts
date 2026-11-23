import { NextResponse } from "next/server";
import { disconnect, setYouTubeMode, youtubeStatus, type YouTubeMode } from "@/lib/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as { mode?: YouTubeMode; disconnect?: boolean };
  if (body.disconnect) disconnect();
  if (body.mode) setYouTubeMode(body.mode);
  return NextResponse.json(youtubeStatus());
}
