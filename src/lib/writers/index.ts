// Picks which writer answers: Automatic tries Ollama, then Claude, then the demo templates.
import { z } from "zod";
import { log, type Room } from "../db";
import { getSettings } from "../settings";
import {
  PitchesSchema,
  ScoutInsightsSchema,
  QaEditSchema,
  BeatSchema,
  StorySchema,
  ThemesSchema,
  rulesFor,
  type Beat,
  type Pitch,
  type ScoutInsights,
  type QaEdit,
  type Story,
  type StoryStyle,
  type Theme,
  type VideoLength,
} from "../story";
import { povCast } from "../town";
import { claudeAvailable, claudeJson } from "./claude";
import { demoPitches, demoScout, demoStory, demoThemes } from "./demo";
import { ollamaJson, ollamaStatus } from "./ollama";
import { editPrompt, expandPrompt, gossipNeighbors, pitchesPrompt, scoutPrompt, storyPrompt, themesPrompt, whatifCounter } from "./prompts";
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

export async function writeStory(pitch: Pitch, style: StoryStyle, jobId?: number, length: VideoLength = "short"): Promise<Written<Story>> {
  // POV Story: Pip plus two neighbors, picked from the title so a retry keeps the same cast.
  const cast = style === "pov" ? povCast(pitch.title) : [];
  const r = await write("script", StorySchema, storyPrompt(pitch, style, length, cast), () => demoStory(pitch, style, length), jobId);
  // What If: fall back to the counter the pitch planned when the writer leaves it out.
  if (style === "whatif" && !r.value.counter) r.value.counter = whatifCounter(pitch);
  // Small local models often stop well short of the beat count; stretch the draft to length.
  if (r.engine !== "demo") r.value = await stretchStory(r.value, style, length, r.engine, jobId);
  return r;
}

const StretchSchema = z.object({ beats: z.array(BeatSchema).min(1).max(20) });

/** At most this many beats asked for in one go, so a small model can manage it. */
const MAX_BEATS_PER_ASK = 10;

/**
 * Bring a story that came back too short up to the beat count Vera checks for. It asks the same
 * writer to retell a few beats at a time as more, smaller beats, keeping the opening beat and the
 * final beat (the hook and the punch line) as they are. Any step that fails is simply skipped.
 */
export async function stretchStory(
  input: Story,
  style: StoryStyle,
  length: VideoLength,
  engine: WriterName,
  jobId?: number,
  ask: (prompt: string) => Promise<Beat[]> = (prompt) => askBeats(engine, prompt),
): Promise<Story> {
  const r = rulesFor(style, length);
  if (input.beats.length >= r.minBeats) return input;
  // Aim a little past the minimum, since the editor may trim a beat or two.
  const aim = Math.min(r.maxBeats, r.minBeats + 3);
  const story: Story = structuredClone(input);
  // For each beat, the beat of the original draft it came from (to keep the TikTok clip marks right).
  let origin = story.beats.map((_, i) => i);
  const startCount = story.beats.length;
  log("script", `Quill's draft has ${startCount} beats; this video needs at least ${r.minBeats}. Telling it in more, smaller steps.`, "info", jobId);

  for (let round = 0; round < 3 && story.beats.length < aim; round++) {
    // Work through the middle of the story (not the first or last beat) a few beats at a time.
    let i = story.beats.length > 3 ? 1 : 0;
    while (story.beats.length < aim) {
      const lastMiddle = story.beats.length > 3 ? story.beats.length - 2 : story.beats.length - 1;
      if (i > lastMiddle) break;
      const left = lastMiddle - i + 1; // beats not yet stretched this round
      const need = aim - story.beats.length;
      // Spread what's missing over the beats still to go: each becomes this many.
      const factor = Math.max(2, Math.ceil((left + need) / left));
      const size = Math.max(1, Math.min(lastMiddle - i + 1, Math.floor(MAX_BEATS_PER_ASK / factor)));
      const from = i;
      const to = i + size - 1;
      const want = Math.min(size * factor, size + need + 1, MAX_BEATS_PER_ASK + 2);
      let beats: Beat[] = [];
      try {
        beats = cleanBeats(await ask(expandPrompt({ story, style, length, from, to, want })), story, style, from, to);
      } catch (e) {
        log("script", `Couldn't stretch beats ${from + 1} to ${to + 1}: ${(e as Error).message}`, "warn", jobId);
      }
      if (beats.length > size) {
        story.beats.splice(from, size, ...beats);
        const spread = beats.map((_, k) => origin[from + Math.min(size - 1, Math.floor((k * size) / beats.length))]);
        origin = [...origin.slice(0, from), ...spread, ...origin.slice(to + 1)];
        i = from + beats.length;
      } else {
        i = to + 1;
      }
    }
  }

  // The writer's TikTok clip marks pointed at the old beat numbers; move them to the new ones.
  if (story.highlights?.length) {
    story.highlights = story.highlights
      .map((h) => {
        const starts = origin.findIndex((o) => o >= h.start - 1);
        let ends = -1;
        origin.forEach((o, k) => {
          if (o <= h.end - 1) ends = k;
        });
        return starts >= 0 && ends >= starts ? { ...h, start: starts + 1, end: ends + 1 } : null;
      })
      .filter((h): h is NonNullable<typeof h> => h !== null);
  }

  if (story.beats.length > startCount) log("script", `Quill stretched the story from ${startCount} to ${story.beats.length} beats.`, "info", jobId);
  if (story.beats.length < r.minBeats) log("script", `The story is still only ${story.beats.length} beats long.`, "warn", jobId);
  return story;
}

/** Keep new beats in line with the story around them, so the rule checks don't trip on them. */
function cleanBeats(beats: Beat[], story: Story, style: StoryStyle, from: number, to: number): Beat[] {
  const n = story.characters.length;
  let floor = [...story.beats.slice(0, from)].reverse().find((b) => typeof b.value === "number")?.value ?? null;
  const ceiling = story.beats.slice(to + 1).find((b) => typeof b.value === "number")?.value ?? null;
  return beats
    .filter((b) => b.narration.trim().length > 0)
    .map((b) => {
      const out: Beat = { ...b, card: null, cast: b.cast.filter((c) => c.who >= 0 && c.who < n) };
      if (out.speaker != null && (out.speaker < 0 || out.speaker >= n)) {
        out.speaker = null;
        out.line = null;
      }
      if (style === "whatif" && typeof out.value === "number") {
        // The counter only goes up.
        let v = out.value;
        if (floor !== null && v < floor) v = floor;
        if (ceiling !== null && v > ceiling) v = ceiling;
        out.value = v;
        floor = v;
      }
      return out;
    });
}

async function askBeats(engine: WriterName, prompt: string): Promise<Beat[]> {
  if (engine === "ollama") return (await ollamaJson(StretchSchema, prompt)).beats;
  if (engine === "claude") return (await claudeJson(StretchSchema, prompt)).beats;
  return [];
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
