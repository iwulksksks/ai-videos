// Sound Booth (Echo): records the narrator and the characters with Piper, then makes the music.
import fs from "node:fs";
import path from "node:path";
import { composeMusic, composeSfx } from "../audio/compose";
import { speak, voiceReady } from "../audio/piper";
import { wavDurationSeconds } from "../audio/wav";
import { config } from "../config";
import type { MusicMood, Story, StoryStyle } from "../story";
import type { BeatAudio, StagedPlan } from "./art";
import { FPS } from "../story";

export async function recordVoices(
  story: Story,
  jobDir: string,
  onLine?: (done: number, total: number) => void,
  style: StoryStyle = "hook",
): Promise<{ audio: BeatAudio[]; voiced: boolean; problem: string | null }> {
  const empty = story.beats.map(() => ({ narrationFile: null, narrationSeconds: null, lineFile: null, lineSeconds: null }));
  if (!config.voiceOn) return { audio: empty, voiced: false, problem: "Voiceover is switched off (REELHOUSE_VOICE=0)." };
  if (!voiceReady()) return { audio: empty, voiced: false, problem: "Piper voices are not installed yet (run: npm run setup:voice)." };
  const out: BeatAudio[] = [];
  const total = story.beats.reduce((n, b) => n + 1 + (b.speaker != null && b.line ? 1 : 0), 0);
  let done = 0;
  for (let i = 0; i < story.beats.length; i++) {
    const b = story.beats[i];
    const narrationFile = `beat-${String(i + 1).padStart(2, "0")}-narration.wav`;
    // Twist Tale: one brisk narrator (about 3 words a second) reads everything.
    const twist = style === "twist";
    // Town Gossip: a quick, chatty narrator; townsfolk shout their lines in their own voices.
    const brisk = twist ? { lengthScale: 0.9 } : style === "gossip" ? { lengthScale: 0.86 } : style === "whatif" || style === "pov" ? { lengthScale: 0.88 } : {};
    await speak(b.narration, path.join(jobDir, narrationFile), "narrator", brisk);
    onLine?.(++done, total);
    let lineFile: string | null = null;
    let lineSeconds: number | null = null;
    if (b.speaker != null && b.line) {
      lineFile = `beat-${String(i + 1).padStart(2, "0")}-line.wav`;
      // In Twist Tale the narrator also reads quoted lines, a touch slower for a different tone.
      await speak(b.line, path.join(jobDir, lineFile), twist ? "narrator" : { character: b.speaker }, twist ? { lengthScale: 1.05 } : {});
      lineSeconds = wavDurationSeconds(path.join(jobDir, lineFile));
      onLine?.(++done, total);
    }
    out.push({ narrationFile, narrationSeconds: wavDurationSeconds(path.join(jobDir, narrationFile)), lineFile, lineSeconds });
  }
  return { audio: out, voiced: true, problem: null };
}

export function pickMood(story: Story, style: StoryStyle): MusicMood {
  if (style === "hook") return "epic";
  if (style === "twist") return "curious";
  if (style === "gossip") return "playful";
  if (style === "whatif") return "adventure";
  if (style === "pov") return "mystery";
  const text = `${story.title} ${story.logline} ${story.beats.map((b) => b.narration).join(" ")}`.toLowerCase();
  const night = story.beats.filter((b) => b.time === "night" || b.setting === "space").length;
  if (/(mystery|secret|strange|shadow|whisper|clue|missing)/.test(text)) return "mystery";
  if (/(race|quest|journey|adventure|treasure|chase|explore)/.test(text)) return "adventure";
  if (/(lonely|miss|goodbye|cry|sad|lost|tears)/.test(text)) return "tender";
  if (night > story.beats.length / 2 || /(dream|star|moon|sleep|cloud)/.test(text)) return "dreamy";
  return "playful";
}

function findMp3s(mood: MusicMood): string[] {
  const dirs = [path.join(config.musicDir, mood), config.musicDir];
  for (const d of dirs) {
    if (!fs.existsSync(d)) continue;
    const files = fs.readdirSync(d).filter((f) => f.toLowerCase().endsWith(".mp3")).map((f) => path.join(d, f));
    if (files.length) return files;
  }
  return [];
}

/** Returns the music file name inside jobDir, or null when music is off. */
export function makeMusic(opts: { mood: MusicMood; seconds: number; seed: string; jobDir: string }): { file: string | null; source: string } {
  if (!config.musicOn) return { file: null, source: "off" };
  const mp3s = findMp3s(opts.mood);
  if (mp3s.length) {
    let h = 0;
    for (const c of opts.seed) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const src = mp3s[h % mp3s.length];
    fs.copyFileSync(src, path.join(opts.jobDir, "music.mp3"));
    return { file: "music.mp3", source: `your track "${path.basename(src)}"` };
  }
  composeMusic({ mood: opts.mood, seconds: opts.seconds, seed: opts.seed, outFile: path.join(opts.jobDir, "music.wav") });
  return { file: "music.wav", source: `an original ${opts.mood} tune` };
}

/** Sound effects track: one effect at the start of each beat that asks for one. */
export function makeSfx(plan: StagedPlan, jobDir: string): string | null {
  const events: { time: number; kind: NonNullable<StagedPlan["beats"][number]["sfx"]> }[] = [];
  let at = plan.introFrames;
  for (const b of plan.beats) {
    if (b.sfx && b.sfx !== "none") events.push({ time: at / FPS, kind: b.sfx });
    at += b.durationInFrames;
  }
  if (!events.length || !config.musicOn) return null;
  composeSfx({ events, seconds: plan.totalFrames / FPS, outFile: path.join(jobDir, "sfx.wav") });
  return "sfx.wav";
}
