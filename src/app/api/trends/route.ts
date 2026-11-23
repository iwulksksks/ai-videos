import { NextResponse } from "next/server";
import { scoutTrends } from "@/lib/agents/trends";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  try {
    return NextResponse.json({ report: await scoutTrends(true) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}
