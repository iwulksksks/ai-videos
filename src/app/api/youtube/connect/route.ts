import { NextResponse } from "next/server";
import { authorizeUrl, youtubeConfigured } from "@/lib/youtube";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function origin(req: Request) {
  const h = req.headers;
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function GET(req: Request) {
  if (!youtubeConfigured()) return new Response("Add YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET to .env.local first (see YOUTUBE.md).", { status: 400 });
  return NextResponse.redirect(authorizeUrl(origin(req)));
}
