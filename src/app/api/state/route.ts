import { NextResponse } from "next/server";
import { studioState } from "@/lib/state";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(await studioState());
}
