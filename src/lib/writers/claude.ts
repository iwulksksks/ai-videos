// Optional paid writer: Claude, using structured outputs so answers always match our schema.
import Anthropic from "@anthropic-ai/sdk";
import { zodOutputFormat } from "@anthropic-ai/sdk/helpers/zod";
import type { z } from "zod";
import { config } from "../config";
import { SYSTEM_PROMPT } from "./prompts";

let client: Anthropic | null = null;

export function claudeAvailable(): boolean {
  return Boolean(config.anthropicKey);
}

export async function claudeJson<T>(schema: z.ZodType<T>, prompt: string): Promise<T> {
  if (!config.anthropicKey) throw new Error("ANTHROPIC_API_KEY is not set");
  client ??= new Anthropic({ apiKey: config.anthropicKey });
  const response = await client.messages.parse({
    model: config.claudeModel,
    max_tokens: 16000,
    system: SYSTEM_PROMPT,
    output_config: {
      effort: "medium",
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      format: zodOutputFormat(schema as any),
    },
    messages: [{ role: "user", content: prompt }],
  });
  if (response.stop_reason === "refusal") throw new Error("Claude declined to write this one");
  if (response.stop_reason === "max_tokens") throw new Error("Claude's answer was cut off");
  const out = response.parsed_output;
  if (!out) throw new Error("Claude's answer could not be read");
  // Re-check with our own schema, which has length limits structured outputs can't enforce.
  return schema.parse(out);
}
