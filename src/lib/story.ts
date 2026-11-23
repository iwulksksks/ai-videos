// The shapes every agent agrees on. Shared by the web app, the writers and the video renderer,
// so this file must stay free of Node-only imports.
import { z } from "zod";

export const SETTINGS = [
  "forest",
  "city",
  "bedroom",
  "space",
  "beach",
  "castle",
  "cafe",
  "classroom",
  "palace",
  "arena",
  "workshop",
  "harbor",
  "canyon",
  "prison",
  "mine",
  "market",
  "lab",
  "town", // Brickbury main street (Town Gossip)
  "plaza", // Brickbury town square (Town Gossip)
] as const;
export const TIMES = ["day", "sunset", "night"] as const;
export const COLORS = ["yellow", "pink", "blue", "green", "orange", "purple", "red", "teal"] as const;
export const ACCESSORIES = ["none", "hat", "bow", "glasses", "crown", "scarf"] as const;
export const EXPRESSIONS = ["happy", "sad", "surprised", "angry", "thinking", "excited", "scared"] as const;
export const ACTIONS = ["idle", "enter", "jump", "shake", "walk"] as const;
export const CAMERAS = ["push", "pan-left", "pan-right", "still", "close", "insert"] as const;
// Objects drawn in code that "insert" close-ups can zoom into (Twist Tale explanations).
export const PROPS = ["none", "gear", "lever", "bell", "jar", "rail", "pendulum", "wheel", "rope"] as const;
export const SFX = ["none", "rumble", "snap", "crash", "whoosh", "ding"] as const;
export const MUSIC_MOODS = ["playful", "tender", "mystery", "adventure", "dreamy", "epic", "curious"] as const;
// Phone-screen scenes drawn in code (Town Gossip): a post, a view counter, a comment list,
// a wall of copycat videos, and the "original sound" page.
export const SCREENS = ["none", "post", "views", "comments", "copycats", "sound"] as const;
export const STYLES = ["twist", "hook", "cozy", "gossip"] as const;
export const LOOKS = ["2.5d", "flat"] as const;
export const ENGINES = ["auto", "ollama", "claude", "demo"] as const;

export type Setting = (typeof SETTINGS)[number];
export type TimeOfDay = (typeof TIMES)[number];
export type CharColor = (typeof COLORS)[number];
export type Accessory = (typeof ACCESSORIES)[number];
export type Expression = (typeof EXPRESSIONS)[number];
export type Action = (typeof ACTIONS)[number];
export type Camera = (typeof CAMERAS)[number];
export type MusicMood = (typeof MUSIC_MOODS)[number];
export type StoryStyle = (typeof STYLES)[number];
export type Look = (typeof LOOKS)[number];
export type Engine = (typeof ENGINES)[number];
export type Prop = (typeof PROPS)[number];
export type Sfx = (typeof SFX)[number];
export type Screen = (typeof SCREENS)[number];

// ---------- What the AI writers return ----------

export const ThemeSchema = z.object({
  theme: z.string().min(3).max(120),
  why: z.string().min(3).max(240),
});
export const ThemesSchema = z.object({ themes: z.array(ThemeSchema).min(1).max(6) });
export type Theme = z.infer<typeof ThemeSchema>;

// Niche Scout: what is working on story channels like ours (inspiration, never copied).
export const ScoutInsightsSchema = z.object({
  topics: z.array(ThemeSchema).min(1).max(6),
  hooks: z.array(z.object({ pattern: z.string().min(3).max(160), why: z.string().max(240) })).min(1).max(6),
});
export type ScoutInsights = z.infer<typeof ScoutInsightsSchema>;

export const PitchSchema = z.object({
  title: z.string().min(2).max(80),
  logline: z.string().min(8).max(240),
  genre: z.string().min(2).max(40),
  twist: z.string().min(4).max(240),
  // Twist Tale only: the real, checkable trick or fact that explains the ending.
  mechanism: z.string().max(300).nullable().optional(),
  era: z.string().max(80).nullable().optional(),
  skeptic: z.string().max(120).nullable().optional(),
});
export const PitchesSchema = z.object({ pitches: z.array(PitchSchema).min(1).max(5) });
export type Pitch = z.infer<typeof PitchSchema>;

export const CharacterSchema = z.object({
  name: z.string().min(1).max(24),
  color: z.enum(COLORS),
  accessory: z.enum(ACCESSORIES),
});
export type Character = z.infer<typeof CharacterSchema>;

export const CastSchema = z.object({
  who: z.number().int().min(0).max(4),
  mood: z.enum(EXPRESSIONS),
  action: z.enum(ACTIONS),
});
export type CastMember = z.infer<typeof CastSchema>;

export const BeatSchema = z.object({
  setting: z.enum(SETTINGS),
  time: z.enum(TIMES),
  narration: z.string().min(1).max(260),
  cast: z.array(CastSchema).max(3),
  speaker: z.number().int().min(0).max(4).nullable().optional(),
  line: z.string().max(140).nullable().optional(),
  prop: z.enum(PROPS).nullable().optional(), // object to show in close-up
  sfx: z.enum(SFX).nullable().optional(), // sound effect at the start of the beat
  screen: z.enum(SCREENS).nullable().optional(), // a phone-screen scene instead of the set
  screenText: z.string().max(48).nullable().optional(), // the catchphrase or post caption on the screen
  count: z.string().max(12).nullable().optional(), // view count shown on the screen, like "12M" or "1K"
});
export type Beat = z.infer<typeof BeatSchema>;

export const StorySchema = z.object({
  title: z.string().min(2).max(80),
  logline: z.string().min(4).max(240),
  characters: z.array(CharacterSchema).min(1).max(5),
  mechanism: z.string().max(300).nullable().optional(),
  beats: z.array(BeatSchema).min(3).max(26),
  caption: z.string().min(4).max(400),
  hashtags: z.array(z.string().min(1).max(40)).max(12),
});
export type Story = z.infer<typeof StorySchema>;

export const QaEditSchema = z.object({
  verdict: z.enum(["approved", "fixed", "rejected"]),
  issues: z.array(z.string()).max(12),
  story: StorySchema.nullable(),
});
export type QaEdit = z.infer<typeof QaEditSchema>;

// ---------- What the renderer needs ----------

export const FPS = 30;
export const WIDTH = 1080;
export const HEIGHT = 1920;

export type CaptionChunk = {
  text: string;
  highlight: string | null; // the one yellow word, if it is in this chunk
  from: number; // frame, relative to the beat
  to: number;
};

export type StagedCast = CastMember & {
  x: number; // 0..1 across the screen
  scale: number;
  facing: 1 | -1;
};

export type StagedBeat = Omit<Beat, "cast"> & {
  durationInFrames: number;
  camera: Camera;
  cast: StagedCast[];
  narrationAudio: string | null; // URL
  lineAudio: string | null; // URL
  narrationFrames: number; // how long the narrator speaks
  lineStartFrame: number; // when the character's line starts
  lineFrames: number;
  captions: CaptionChunk[];
  seed: number;
};

export type VideoProps = {
  title: string;
  style: StoryStyle;
  look: Look;
  characters: Character[];
  beats: StagedBeat[];
  musicSrc: string | null;
  sfxSrc: string | null; // sound effects track (not ducked)
  musicLoop: boolean; // true for your own MP3s, which may be shorter than the video
  musicMood: MusicMood;
  introFrames: number; // title card (cozy) or 0
  outroFrames: number; // "The End" / "Part 2?" card
};

export function totalFrames(p: Pick<VideoProps, "beats" | "introFrames" | "outroFrames">): number {
  return p.introFrames + p.beats.reduce((s, b) => s + b.durationInFrames, 0) + p.outroFrames;
}

// ---------- Style rules (used by writers, QA and the demo) ----------

export const STYLE_RULES = {
  twist: {
    minBeats: 18,
    maxBeats: 24,
    minWords: 3,
    maxWords: 20,
    maxLineWords: 10,
    seconds: "55 to 65",
  },
  hook: {
    minBeats: 12,
    maxBeats: 18,
    minWords: 4,
    maxWords: 12,
    maxLineWords: 8,
    seconds: "60 to 90",
  },
  gossip: {
    minBeats: 16,
    maxBeats: 26,
    minWords: 2,
    maxWords: 14,
    maxLineWords: 6,
    seconds: "50 to 70",
  },
  cozy: {
    minBeats: 5,
    maxBeats: 8,
    minWords: 4,
    maxWords: 30,
    maxLineWords: 14,
    seconds: "30 to 45",
  },
} as const;
