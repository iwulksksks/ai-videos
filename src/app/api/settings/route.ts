import { NextResponse } from "next/server";
import { log } from "@/lib/db";
import { getSettings, saveSettings, setMeta } from "@/lib/settings";
import { ENGINES, LENGTHS, LOOKS, STYLES } from "@/lib/story";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json()) as Record<string, unknown>;
  const before = getSettings();
  const patch: Parameters<typeof saveSettings>[0] = {};
  if (typeof body.autopilot === "boolean") patch.autopilot = body.autopilot;
  if (typeof body.brief === "string") patch.brief = body.brief.slice(0, 600);
  if (typeof body.storiesPerDay === "number") patch.storiesPerDay = body.storiesPerDay;
  if (STYLES.includes(body.style as never)) patch.style = body.style as never;
  if (LOOKS.includes(body.look as never)) patch.look = body.look as never;
  if (LENGTHS.includes(body.length as never)) patch.length = body.length as never;
  if (ENGINES.includes(body.engine as never)) patch.engine = body.engine as never;
  const after = saveSettings(patch);
  if (patch.autopilot !== undefined && patch.autopilot !== before.autopilot) {
    if (patch.autopilot) setMeta("autopilot_last_run", "0");
    log("producer", patch.autopilot ? `Autopilot is ON: ${after.storiesPerDay} stories a day.` : "Autopilot is OFF.");
  }
  return NextResponse.json(after);
}
