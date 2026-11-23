// Picks which writer answers: Automatic tries Ollama, then Claude, then the demo templates.
import type { z } from "zod";
import { log, type Room } from "../db";
import { getSettings } from "../settings";
import {
  PitchesSchema,
  ScoutInsightsSchema,
  QaEditSchema,
  StorySchema,
  ThemesSchema,
  type Pitch,
  type ScoutInsights,
  type QaEdit,
  type Story,
  type StoryStyle,
  type Theme,
} from "../story";
import { claudeAvailable, claudeJson } from "./claude";
import { demoPitches, demoScout, demoStory, demoThemes } from "./demo";
import { ollamaJson, ollamaStatus } from "./ollama";
import { editPrompt, gossipNeighbors, pitchesPrompt, scoutPrompt, storyPrompt, themesPrompt } from "./prompts";
import { planEpisodes, shapeById } from "../town";

export type WriterName = "ollama" | "claude" | "demo";
export type Written<T> = { value: T; engine: WriterName };

async function enginesToTry(): Promise<WriterName[]> {
  const choice = getSettings().engine;
  if (choice === "demo") return ["demo"];
  if (choice === "ollama") return ["ollama", "demo"];
  if (choice === "claude") return ["claude", "demo"];
  const order: WriterName[] = [];
  const st = await ollamaStatus();
  if (st.running && st.modelReady) order.push("ollama");
  if (claudeAvailable()) order.push("claude");
  order.push("demo");
  return order;
}

async function write<T>(
  room: Room,
  schema: z.ZodType<T>,
  prompt: string,
  demo: () => T | null,
  jobId?: number,
): Promise<Written<T>> {
  const engines = await enginesToTry();
  for (const engine of engines) {
    try {
      if (engine === "ollama") return { value: await ollamaJson(schema, prompt), engine };
      if (engine === "claude") return { value: await claudeJson(schema, prompt), engine };
      const v = demo();
      if (v !== null) return { value: v, engine };
    } catch (e) {
      log(room, `The ${engine} writer had trouble: ${(e as Error).message}. Trying the next one.`, "warn", jobId);
    }
  }
  throw new Error("No writer could answer");
}

export async function writeThemes(items: string[], brief: string): Promise<Written<Theme[]>> {
  const r = await write("trends", ThemesSchema, themesPrompt(items, brief), () => ({ themes: demoThemes() }));
  return { value: r.value.themes, engine: r.engine };
}

export async function writeScout(
  videos: { title: string; channel: string; views: number; viewsPerDay: number }[],
  brief: string,
): Promise<Written<ScoutInsights>> {
  return write("scout", ScoutInsightsSchema, scoutPrompt(videos, brief), () => demoScout(videos));
}

export async function writePitches(opts: {
  theme: Theme | null;
  trends: Theme[];
  brief: string;
  usedTitles: string[];
  style: StoryStyle;
  count: number;
  niche?: ScoutInsights | null;
  recent?: { shapes: string[]; neighbors: string[] }; // Town Gossip: what the last episodes used
}): Promise<Written<Pitch[]>> {
  // Town Gossip: every pitch gets its own story shape and neighbors, avoiding recent ones.
  const plans = opts.style === "gossip" ? planEpisodes(opts.count, opts.recent) : undefined;
  const r = await write("research", PitchesSchema, pitchesPrompt({ ...opts, plans }), () => ({
    pitches: demoPitches(opts.style, opts.usedTitles).slice(0, opts.count),
  }));
  let pitches = r.value.pitches;
  if (plans && r.engine !== "demo") {
    // Keep the plan even if the writer forgot to echo it back.
    pitches = pitches.map((p, i) => {
      const plan = plans[i % plans.length];
      return {
        ...p,
        era: shapeById(p.era)?.id ?? plan.shape.id,
        skeptic: gossipNeighbors(p).length ? p.skeptic : plan.neighbors.map((n) => n.name).join(", "),
      };
    });
  }
  return { value: pitches, engine: r.engine };
}

export async function writeStory(pitch: Pitch, style: StoryStyle, jobId?: number): Promise<Written<Story>> {
  return write("script", StorySchema, storyPrompt(pitch, style), () => demoStory(pitch, style), jobId);
}

export async function editStory(
  story: Story,
  style: StoryStyle,
  issues: string[],
  jobId?: number,
): Promise<Written<QaEdit>> {
  // The demo "editor" simply approves stories that passed the rule checks.
  return write(
    "qa",
    QaEditSchema,
    editPrompt(story, style, issues),
    () => ({ verdict: issues.length ? "fixed" : "approved", issues, story: null }),
    jobId,
  );
}
