// Art Studio (Dot): stages every beat. Pure and deterministic: same story + same audio = same plan.
import {
  FPS,
  type Beat,
  type CaptionChunk,
  type Camera,
  type CastMember,
  type Character,
  type StagedBeat,
  type StagedCast,
  type Story,
  type StoryStyle,
} from "../story";

export type BeatAudio = {
  narrationFile: string | null; // file name inside the job folder
  narrationSeconds: number | null;
  lineFile: string | null;
  lineSeconds: number | null;
};

export type StagedPlan = {
  beats: (Omit<StagedBeat, "narrationAudio" | "lineAudio"> & { narrationFile: string | null; lineFile: string | null })[];
  introFrames: number;
  outroFrames: number;
  totalFrames: number;
};

const WORDS_PER_SECOND = 2.7;
const STOP = new Set(
  "the a an and or but of to in on at for with from my me i you your our we they them their his her its it is was were be been are am this that then than so very just all every into over out up down not no".split(
    " ",
  ),
);

function words(text: string): string[] {
  return text.split(/\s+/).filter(Boolean);
}

export function readingSeconds(text: string): number {
  return words(text).length / WORDS_PER_SECOND + 0.3;
}

/** The ONE yellow word: numbers first, then names, otherwise the longest meaningful word. */
export function keyWord(text: string, names: string[]): string | null {
  const ws = words(text).map((w) => w.replace(/[^\p{L}\p{N}'-]/gu, ""));
  const num = ws.find((w) => /\d/.test(w) || /^(one|two|three|four|five|ten|hundred|thousand|million|every|first|last)$/i.test(w));
  if (num) return num;
  const lowerNames = names.map((n) => n.toLowerCase());
  const name = ws.find((w) => lowerNames.includes(w.toLowerCase()));
  if (name) return name;
  const candidates = ws.filter((w) => w.length > 3 && !STOP.has(w.toLowerCase()));
  if (!candidates.length) return null;
  return candidates.reduce((a, b) => (b.length > a.length ? b : a));
}

export function captionChunks(text: string, frames: number, style: StoryStyle, names: string[]): CaptionChunk[] {
  const ws = words(text);
  if (!ws.length) return [];
  const highlight = keyWord(text, names);
  if (style === "cozy") return [{ text, highlight, from: 0, to: frames }];
  if (style === "twist") {
    // One big word at a time, timed by its length.
    const weights = ws.map((w) => w.length + 2);
    const total = weights.reduce((a, b) => a + b, 0);
    let at = 0;
    return ws.map((w, i) => {
      const from = at;
      at = i === ws.length - 1 ? frames : Math.min(frames, at + Math.max(3, Math.round((weights[i] / total) * frames)));
      return { text: w.replace(/[.,;:]+$/, ""), highlight: null, from, to: at };
    });
  }
  // Hook: 2-3 words at a time, timed by letters so longer words stay up longer.
  const groups: string[][] = [];
  let cur: string[] = [];
  for (const w of ws) {
    cur.push(w);
    const endsSentence = /[.!?,]$/.test(w);
    if (cur.length >= 3 || (endsSentence && cur.length >= 2)) {
      groups.push(cur);
      cur = [];
    }
  }
  if (cur.length) {
    if (cur.length === 1 && groups.length) groups[groups.length - 1].push(...cur);
    else groups.push(cur);
  }
  const weights = groups.map((g) => g.join(" ").length + 4);
  const total = weights.reduce((a, b) => a + b, 0);
  let at = 0;
  return groups.map((g, i) => {
    const len = Math.max(6, Math.round((weights[i] / total) * frames));
    const from = at;
    at = i === groups.length - 1 ? frames : Math.min(frames, at + len);
    const t = g.join(" ");
    const has = highlight ? g.some((w) => w.replace(/[^\p{L}\p{N}'-]/gu, "") === highlight) : false;
    return { text: t, highlight: has ? highlight : null, from, to: at };
  });
}

function hashText(t: string): number {
  let h = 2166136261;
  for (const c of t) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

const REACTION_MOODS = new Set(["surprised", "scared", "excited", "angry"]);

function chooseCamera(beat: Beat, i: number, style: StoryStyle, total: number): Camera {
  const reaction = beat.cast.some((c) => REACTION_MOODS.has(c.mood));
  if (beat.prop && beat.prop !== "none") return "insert";
  if (style === "gossip") {
    if (beat.card && beat.card !== "none") return "still";
    if (i === 0) return "close"; // open on a face
    if (reaction && beat.cast.length <= 2) return "close";
    return (["push", "close", "pan-right", "still", "pan-left", "close"] as const)[i % 6];
  }
  if (style === "twist") {
    if (i === 0) return "close"; // the strange act, up close
    if (reaction && beat.cast.length <= 2) return "close";
    return (["push", "pan-right", "close", "pan-left", "still"] as const)[i % 5];
  }
  if (style === "hook") {
    if (i === 0) return "push";
    if (i === total - 1) return "push";
    if (reaction && beat.cast.length <= 2) return "close";
    return (["pan-left", "push", "pan-right", "close"] as const)[i % 4];
  }
  if (i === 0) return "push";
  if (reaction) return "push";
  return (["still", "pan-right", "push", "pan-left"] as const)[i % 4];
}

function placeCast(cast: CastMember[], characters: Character[], camera: Camera): StagedCast[] {
  const valid = cast.filter((c, idx, arr) => c.who < characters.length && arr.findIndex((o) => o.who === c.who) === idx).slice(0, 3);
  const slots = valid.length === 1 ? [0.5] : valid.length === 2 ? [0.3, 0.7] : [0.2, 0.5, 0.8];
  const scale = camera === "close" ? (valid.length === 1 ? 1.55 : 1.25) : valid.length === 3 ? 0.85 : 1;
  return valid.map((c, i) => ({
    ...c,
    x: slots[i],
    scale,
    facing: slots[i] < 0.5 ? 1 : slots[i] > 0.5 ? -1 : 1,
  }));
}

export function stageStory(story: Story, style: StoryStyle, audio: BeatAudio[]): StagedPlan {
  const names = story.characters.map((c) => c.name);
  const pad = style === "cozy" ? 0.7 : style === "hook" ? 0.25 : style === "gossip" ? 0.1 : 0.15;
  const minSeconds = style === "cozy" ? 3.5 : style === "hook" ? 2.2 : style === "gossip" ? 1.5 : 1.8;
  const beats = story.beats.map((beat, i) => {
    const a = audio[i] ?? { narrationFile: null, narrationSeconds: null, lineFile: null, lineSeconds: null };
    const narrSec = a.narrationSeconds ?? readingSeconds(beat.narration);
    const hasLine = beat.speaker != null && !!beat.line;
    const lineSec = hasLine ? (a.lineSeconds ?? readingSeconds(beat.line!)) : 0;
    const gap = hasLine ? 0.15 : 0;
    // Newspaper cards need a moment to spin in and be read.
    const screenMin = style === "gossip" && beat.card && beat.card !== "none" ? 2.6 : 0;
    const seconds = Math.max(minSeconds, screenMin, narrSec + gap + lineSec + pad);
    const durationInFrames = Math.round(seconds * FPS);
    const narrationFrames = Math.round(narrSec * FPS);
    const camera = chooseCamera(beat, i, style, story.beats.length);
    const cast = placeCast(beat.cast.length ? beat.cast : [{ who: 0, mood: "happy", action: "idle" }], story.characters, camera);
    return {
      ...beat,
      cast,
      camera,
      durationInFrames,
      narrationFile: a.narrationFile,
      lineFile: hasLine ? a.lineFile : null,
      narrationFrames,
      lineStartFrame: Math.round((narrSec + gap) * FPS),
      lineFrames: Math.round(lineSec * FPS),
      captions: captionChunks(beat.narration, narrationFrames, style, names),
      seed: hashText(`${story.title}-${i}`),
    };
  });
  const introFrames = style === "cozy" ? Math.round(2.5 * FPS) : 0;
  // Twist Tale and Town Gossip stop dead on the punch line so the video loops.
  const outroFrames = style === "twist" || style === "gossip" ? 0 : Math.round((style === "hook" ? 2.2 : 2.5) * FPS);
  const totalFrames = introFrames + beats.reduce((s, b) => s + b.durationInFrames, 0) + outroFrames;
  return { beats, introFrames, outroFrames, totalFrames };
}
