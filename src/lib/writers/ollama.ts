// Free local writer: Ollama. Uses Ollama's JSON "format" option with our schema,
// and gives the model one chance to correct an answer that doesn't match.
import { z } from "zod";
import { config } from "../config";
import { SYSTEM_PROMPT } from "./prompts";

type ChatMessage = { role: "system" | "user" | "assistant"; content: string };

export type OllamaStatus = { running: boolean; modelReady: boolean; models: string[] };

let cached: { at: number; status: OllamaStatus } | null = null;

/**
 * Ollama's status, remembered for 20 seconds. The page asks for the studio's status every few
 * seconds; while Ollama is busy writing, asking it each time made the page slow to load.
 */
export async function ollamaStatusCached(): Promise<OllamaStatus> {
  if (cached && Date.now() - cached.at < 20_000) return cached.status;
  const status = await ollamaStatus();
  cached = { at: Date.now(), status };
  return status;
}

export async function ollamaStatus(): Promise<OllamaStatus> {
  try {
    const res = await fetch(`${config.ollamaHost}/api/tags`, { signal: AbortSignal.timeout(2500) });
    if (!res.ok) return { running: false, modelReady: false, models: [] };
    const data = (await res.json()) as { models?: { name: string }[] };
    const models = (data.models ?? []).map((m) => m.name);
    const want = config.ollamaModel.includes(":") ? config.ollamaModel : `${config.ollamaModel}:latest`;
    return { running: true, modelReady: models.includes(want) || models.includes(config.ollamaModel), models };
  } catch {
    return { running: false, modelReady: false, models: [] };
  }
}

async function chat(messages: ChatMessage[], format: unknown): Promise<string> {
  // Streamed, so a long story on a slower computer never hits the 5-minute "no answer yet" limit
  // that a single all-at-once reply runs into.
  const res = await fetch(`${config.ollamaHost}/api/chat`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      model: config.ollamaModel,
      messages,
      format,
      stream: true,
      options: { temperature: 0.85, num_ctx: 8192 },
    }),
    signal: AbortSignal.timeout(20 * 60 * 1000),
  });
  if (!res.ok || !res.body) throw new Error(`Ollama answered ${res.status}: ${await res.text().catch(() => "")}`);
  const reader = res.body.pipeThrough(new TextDecoderStream()).getReader();
  let text = "";
  let pending = "";
  const take = (line: string) => {
    if (!line.trim()) return;
    const part = JSON.parse(line) as { message?: { content?: string }; error?: string };
    if (part.error) throw new Error(`Ollama: ${part.error}`);
    text += part.message?.content ?? "";
  };
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    pending += value;
    const lines = pending.split("\n");
    pending = lines.pop() ?? "";
    lines.forEach(take);
  }
  take(pending);
  return text;
}

function tryParse<T>(schema: z.ZodType<T>, text: string): { ok: true; value: T } | { ok: false; error: string } {
  let json: unknown;
  try {
    json = JSON.parse(text);
  } catch (e) {
    return { ok: false, error: `Not valid JSON: ${(e as Error).message}` };
  }
  const parsed = schema.safeParse(json);
  if (parsed.success) return { ok: true, value: parsed.data };
  return {
    ok: false,
    error: parsed.error.issues
      .slice(0, 12)
      .map((i) => `${i.path.join(".") || "(root)"}: ${i.message}`)
      .join("; "),
  };
}

export async function ollamaJson<T>(schema: z.ZodType<T>, prompt: string): Promise<T> {
  const format = z.toJSONSchema(schema, { target: "draft-7", unrepresentable: "any" });
  const messages: ChatMessage[] = [
    { role: "system", content: SYSTEM_PROMPT },
    { role: "user", content: prompt },
  ];
  const first = await chat(messages, format);
  const r1 = tryParse(schema, first);
  if (r1.ok) return r1.value;

  // One correction retry.
  messages.push({ role: "assistant", content: first });
  messages.push({
    role: "user",
    content: `That answer did not match the required shape. Problems: ${r1.error}. Reply again with the full corrected JSON object only.`,
  });
  const second = await chat(messages, format);
  const r2 = tryParse(schema, second);
  if (r2.ok) return r2.value;
  throw new Error(`Ollama's answer didn't match after a retry: ${r2.error}`);
}
