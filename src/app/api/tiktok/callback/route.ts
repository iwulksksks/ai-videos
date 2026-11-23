import { NextResponse } from "next/server";
import { log } from "@/lib/db";
import { finishConnect } from "@/lib/tiktok";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const h = req.headers;
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? url.host;
  const proto = h.get("x-forwarded-proto") ?? url.protocol.replace(":", "");
  const origin = `${proto}://${host}`;
  const code = url.searchParams.get("code");
  if (!code) return NextResponse.redirect(`${origin}/?tiktok=cancelled`);
  try {
    await finishConnect(code, url.searchParams.get("state") ?? "", origin);
    log("ship", "Hatch is connected to TikTok.");
    return NextResponse.redirect(`${origin}/?room=ship&tiktok=connected`);
  } catch (e) {
    log("ship", `Connecting TikTok failed: ${(e as Error).message}`, "warn");
    return NextResponse.redirect(`${origin}/?room=ship&tiktok=failed`);
  }
}
