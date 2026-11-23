import { NextResponse } from "next/server";
import { pitchIdeas } from "@/lib/pipeline";
import { getDb } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as { theme?: string; why?: string };
  try {
    const theme = body.theme ? { theme: body.theme.slice(0, 120), why: (body.why ?? "Picked by you").slice(0, 240) } : null;
    return NextResponse.json({ ideas: await pitchIdeas({ theme }) });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const { id } = (await req.json()) as { id: number };
  getDb().prepare("DELETE FROM ideas WHERE id = ? AND status = 'waiting'").run(id);
  return NextResponse.json({ ok: true });
}
