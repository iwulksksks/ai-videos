import { NextResponse } from "next/server";
import { postingState, saveSchedule, type Schedule } from "@/lib/posting";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  return NextResponse.json(postingState());
}

/** Save the posting schedule: { on?, timeZone?, tiktok?: ["19:00"], youtube?: ["18:00"] }. */
export async function POST(req: Request) {
  const body = (await req.json()) as Partial<Schedule>;
  saveSchedule(body);
  return NextResponse.json(postingState());
}
