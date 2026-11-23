import { NextResponse } from "next/server";
import { authorizeUrl, tiktokConfigured } from "@/lib/tiktok";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function origin(req: Request) {
  const h = req.headers;
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const proto = h.get("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}

export async function GET(req: Request) {
  if (!tiktokConfigured()) return new Response("Add TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET to .env.local first (see TIKTOK.md).", { status: 400 });
  return NextResponse.redirect(authorizeUrl(origin(req)));
}
