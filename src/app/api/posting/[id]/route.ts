import { NextResponse } from "next/server";
import { postAction, postingState } from "@/lib/posting";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** A button on one queued post: { action: "now" | "retry" | "cancel" }. */
export async function POST(req: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const { action } = (await req.json()) as { action: "now" | "retry" | "cancel" };
  if (!["now", "retry", "cancel"].includes(action)) return NextResponse.json({ error: "Unknown action" }, { status: 400 });
  try {
    postAction(Number(id), action);
    return NextResponse.json(postingState());
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 400 });
  }
}
