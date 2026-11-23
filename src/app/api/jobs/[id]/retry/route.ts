import { NextResponse } from "next/server";
import { getDb, log } from "@/lib/db";
import { kick } from "@/lib/pipeline";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(_req: Request, ctx: { params: Promise<{ id: string }> }) {
  const id = Number((await ctx.params).id);
  getDb().prepare("UPDATE jobs SET stage = 'queued', attempts = 0, progress = 0, error = NULL WHERE id = ? AND stage IN ('failed','skipped')").run(id);
  log("producer", `Bea put story #${id} back on the line.`, "info", id);
  kick();
  return NextResponse.json({ ok: true });
}
