import { NextResponse } from "next/server";
import { disconnect, setTikTokMode, tiktokStatus, type TikTokMode } from "@/lib/tiktok";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as { mode?: TikTokMode; disconnect?: boolean };
  if (body.disconnect) disconnect();
  if (body.mode && ["off", "draft", "direct"].includes(body.mode)) setTikTokMode(body.mode);
  return NextResponse.json(tiktokStatus());
}
