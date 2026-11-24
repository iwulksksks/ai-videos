// Clip Room: long videos go to YouTube whole; their best moments become short TikTok clips.
// Each clip is a stretch of the long story's beats with a new spoken first line (the hook), so it
// makes sense on its own, and an end card pointing to the full story.
// The helpers at the top are pure (used by QA and tests); renderClips needs Node.
import fs from "node:fs";
import path from "node:path";
import { speak, voiceReady } from "../audio/piper";
import { wavDurationSeconds } from "../audio/wav";
import { config } from "../config";
import { FPS, type Highlight, type Look, type Story, type StoryStyle } from "../story";
import { stageStory, type BeatAudio } from "./art";
import { renderVideo } from "./edit";
import { makeMusic, makeSfx, pickMood } from "./sound";

// A clip should run about 25 to 55 seconds.
const MIN_SECONDS = 20;
const MAX_SECONDS = 58;
const MAX_CLIPS = 3;
export const CLIP_END_TEXT = "Full story on YouTube";

/** Estimated seconds of each beat on screen (the same staging the renderer uses, before voices). */
function beatSeconds(story: Story, style: StoryStyle): number[] {
  return stageStory(story, style, []).beats.map((b) => b.durationInFrames / FPS);
}

// A stretch that doesn't start at the top gets a spoken hook line first (about 3 seconds), plus the end card.
function stretchSeconds(secs: number[], a: number, b: number): number {
  let s = a === 0 ? 0 : 3;
  for (let i = a; i <= b; i++) s += secs[i];
  return s + 2.2;
}

/** Grows or trims a stretch (0-based, inclusive) so it lasts MIN..MAX seconds. */
function fitStretch(secs: number[], start: number, end: number): [number, number] {
  const last = secs.length - 1;
  let a = Math.max(0, Math.min(start, last));
  let b = Math.max(a, Math.min(end, last));
  // Too long: a stretch that holds the ending keeps it (that's the payoff) and loses its start;
  // any other stretch keeps its start (where its own set-up is) and loses its end.
  const keepsEnding = b === last;
  while (stretchSeconds(secs, a, b) > MAX_SECONDS && b > a) {
    if (keepsEnding) a++;
    else b--;
  }
  while (stretchSeconds(secs, a, b) < MIN_SECONDS && (a > 0 || b < last)) {
    if (b < last) b++;
    else a--;
  }
  return [a, b];
}

// The opening beat usually states the rule or question, so it introduces any later stretch well.
function defaultHook(story: Story): string {
  return story.beats[0].narration.trim();
}

/**
 * Checks the writer's highlights (beat numbers from 1) and repairs them: in range, 20 to 60
 * seconds long, no exact duplicates, at most 3. When the writer gave none, picks the opening,
 * the middle and the ending.
 */
export function fixHighlights(story: Story, style: StoryStyle): { highlights: Highlight[]; issues: string[] } {
  const issues: string[] = [];
  const n = story.beats.length;
  const secs = beatSeconds(story, style);
  const out: Highlight[] = [];
  const seen = new Set<string>();
  for (const h of story.highlights ?? []) {
    if (!Number.isFinite(h.start) || !Number.isFinite(h.end) || h.start > n) {
      issues.push("Dropped a clip that pointed past the end of the story");
      continue;
    }
    const [a, b] = fitStretch(secs, Math.min(h.start, h.end) - 1, Math.max(h.start, h.end) - 1);
    if (a !== h.start - 1 || b !== h.end - 1) issues.push(`Adjusted a clip to beats ${a + 1}-${b + 1} so it runs 20 to 60 seconds`);
    const key = `${a}-${b}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ start: a + 1, end: b + 1, hook: (h.hook || defaultHook(story)).trim().slice(0, 160) });
    if (out.length >= MAX_CLIPS) break;
  }
  if (!out.length && n >= 6) {
    issues.push("No clips were marked, so the clip room picked the opening, the middle and the ending");
    const total = stretchSeconds(secs, 0, n - 1);
    const picks: [number, number][] = [];
    picks.push(fitStretch(secs, 0, Math.floor(n / 4)));
    if (total > MAX_SECONDS * 1.6) {
      const mid = Math.floor(n / 2);
      picks.push(fitStretch(secs, Math.floor(n / 3), mid));
    }
    picks.push(fitStretch(secs, Math.floor((n * 2) / 3), n - 1));
    for (const [a, b] of picks) {
      const key = `${a}-${b}`;
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({ start: a + 1, end: b + 1, hook: defaultHook(story) });
    }
  }
  return { highlights: out, issues };
}

/** The story of one clip: an opening hook beat (when the stretch doesn't start at the top), then the stretch. */
export function clipStory(story: Story, h: Highlight, index: number): Story {
  const a = h.start - 1;
  const b = h.end - 1;
  const stretch = story.beats.slice(a, b + 1);
  const first = stretch[0];
  const beats =
    a === 0
      ? stretch
      : [
          {
            ...first,
            narration: h.hook,
            line: null,
            speaker: null,
            prop: null,
            card: null,
            value: null,
            sfx: "ding" as const,
            cast: first.cast.length ? first.cast : [{ who: 0, mood: "surprised" as const, action: "idle" as const }],
          },
          ...stretch,
        ];
  return {
    ...story,
    title: `${story.title} (clip ${index + 1})`,
    beats,
    highlights: null,
    caption: `${h.hook} Full story on YouTube.`,
  };
}

/** Renders every clip of a long story into <folder>/clips/clip-N.mp4. Returns the files made. */
export async function renderClips(opts: {
  story: Story;
  style: StoryStyle;
  look: Look;
  jobDir: string; // holds the long video's voice files
  folder: string; // the shipped output folder
  audio: BeatAudio[]; // the long video's recorded voices, one per beat
  onProgress?: (p: number) => void;
  log?: (msg: string) => void;
}): Promise<{ file: string; story: Story }[]> {
  const { highlights } = fixHighlights(opts.story, opts.style);
  const outDir = path.join(opts.folder, "clips");
  fs.mkdirSync(outDir, { recursive: true });
  const made: { file: string; story: Story }[] = [];
  for (let k = 0; k < highlights.length; k++) {
    const h = highlights[k];
    const clip = clipStory(opts.story, h, k);
    const a = h.start - 1;
    const stretchAudio = opts.audio.slice(a, h.end);
    let audio: BeatAudio[] = stretchAudio;
    if (a !== 0) {
      // Record the new first line in the narrator's voice.
      let hookAudio: BeatAudio = { narrationFile: null, narrationSeconds: null, lineFile: null, lineSeconds: null };
      if (config.voiceOn && voiceReady() && stretchAudio.some((x) => x.narrationFile)) {
        const file = `clip-${k + 1}-hook.wav`;
        await speak(h.hook, path.join(opts.jobDir, file), "narrator", { lengthScale: 0.9 });
        hookAudio = { narrationFile: file, narrationSeconds: wavDurationSeconds(path.join(opts.jobDir, file)), lineFile: null, lineSeconds: null };
      }
      audio = [hookAudio, ...stretchAudio];
    }
    const plan = stageStory(clip, opts.style, audio);
    // Every clip ends on a short card that sends people to the full story.
    const outroFrames = Math.round(2.2 * FPS);
    const clipPlan = { ...plan, outroFrames, totalFrames: plan.totalFrames - plan.outroFrames + outroFrames };
    const seconds = clipPlan.totalFrames / FPS;
    const mood = pickMood(clip, opts.style);
    const music = makeMusic({ mood, seconds, seed: clip.title, jobDir: opts.jobDir });
    const sfxFile = makeSfx(clipPlan, opts.jobDir);
    const file = path.join(outDir, `clip-${k + 1}.mp4`);
    opts.log?.(`Cutting clip ${k + 1} of ${highlights.length} (beats ${h.start} to ${h.end}, about ${Math.round(seconds)} seconds).`);
    await renderVideo({
      jobDir: opts.jobDir,
      story: clip,
      style: opts.style,
      look: opts.look,
      plan: clipPlan,
      musicFile: music.file,
      sfxFile,
      musicMood: mood,
      outFile: file,
      endText: CLIP_END_TEXT,
      onProgress: (p) => opts.onProgress?.((k + p) / highlights.length),
    });
    fs.writeFileSync(path.join(outDir, `clip-${k + 1}.txt`), `${clip.caption}\n\n${clip.hashtags.map((t) => `#${t}`).join(" ")}\n`);
    made.push({ file, story: clip });
  }
  return made;
}
