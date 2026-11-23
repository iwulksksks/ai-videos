// The instructions every AI writer gets. Kept in one place so Ollama and Claude write the same way.
import {
  ACCESSORIES,
  ACTIONS,
  COLORS,
  EXPRESSIONS,
  SETTINGS,
  STYLE_RULES,
  TIMES,
  type Pitch,
  type Story,
  type StoryStyle,
  type Theme,
} from "../story";

const SAFETY =
  "Stories are always original and suitable for all ages. No real people, celebrities, brands, " +
  "franchises or existing characters. No gore, no romance beyond friendship, no politics.";

export const SYSTEM_PROMPT =
  "You are the writers' room of Reelhouse, a tiny animation studio that makes short vertical story " +
  "videos for TikTok, Reels and Shorts. You always answer with a single JSON object that matches the " +
  "requested shape exactly, with no extra commentary. " +
  SAFETY;

export function themesPrompt(items: string[], brief: string): string {
  return [
    `Our channel brief: "${brief}".`,
    "Here is what people are talking about online this week (post titles and search trends):",
    ...items.slice(0, 40).map((t) => `- ${t}`),
    "",
    "Group these into 3 to 5 story THEMES we could turn into short original animated stories that fit our brief.",
    "A theme is a short story idea seed (for example: 'a kid whose power everyone laughs at').",
    "For each, add 'why': one sentence on why it is trending or why it will hook viewers.",
    'Answer as JSON: {"themes":[{"theme":"...","why":"..."}]}',
  ].join("\n");
}

export function pitchesPrompt(opts: {
  theme: Theme | null;
  trends: Theme[];
  brief: string;
  usedTitles: string[];
  style: StoryStyle;
  count: number;
}): string {
  const styleNote =
    opts.style === "hook"
      ? "Style HOOK: first-person underdog stories. A world with one clear rule (everyone gets a power, mark, rank or creature at a certain age). The overlooked hero turns out to be far beyond everyone else, ending on a cliffhanger."
      : "Style COZY: gentle, funny, warm little tales with an emotional payoff and no moral lecture.";
  return [
    `Channel brief: "${opts.brief}".`,
    styleNote,
    opts.theme ? `Today's theme: "${opts.theme.theme}" (${opts.theme.why}).` : "",
    opts.trends.length
      ? `Trending themes for inspiration: ${opts.trends.map((t) => t.theme).join("; ")}.`
      : "",
    opts.usedTitles.length
      ? `Do NOT reuse or closely copy these titles we already made: ${opts.usedTitles.slice(0, 60).join("; ")}.`
      : "",
    `Pitch ${opts.count} different original stories. Each pitch: title (max 6 words), logline (one sentence), genre (one or two words) and twist (the surprise in one sentence).`,
    'Answer as JSON: {"pitches":[{"title":"...","logline":"...","genre":"...","twist":"..."}]}',
  ]
    .filter(Boolean)
    .join("\n");
}

function vocab(): string {
  return [
    `Allowed settings: ${SETTINGS.join(", ")}.`,
    `Allowed times: ${TIMES.join(", ")}.`,
    `Character colors: ${COLORS.join(", ")}. Accessories: ${ACCESSORIES.join(", ")}.`,
    `Moods: ${EXPRESSIONS.join(", ")}. Actions: ${ACTIONS.join(", ")}.`,
    "Characters are simple round cartoon blobs, so describe them only by name, color and accessory.",
    "In each beat, 'cast' lists who is on screen by their index in 'characters' (0, 1 or 2), with a mood and action. Use at most 3 on screen.",
    "'speaker' is the index of the character saying 'line' in that beat, or null when nobody speaks. 'line' is null when nobody speaks.",
    "caption: a short, punchy social caption (one or two sentences). hashtags: 5 to 8 tags without the # sign.",
  ].join("\n");
}

export function storyPrompt(pitch: Pitch, style: StoryStyle): string {
  const r = STYLE_RULES[style];
  const styleRules =
    style === "hook"
      ? [
          `STYLE HOOK. ${r.minBeats} to ${r.maxBeats} beats, ${r.seconds} seconds total.`,
          "Narration is FIRST PERSON: the hero (character 0) tells the story and says 'I'.",
          `Each beat's narration is ONE short spoken sentence of ${r.minWords} to ${r.maxWords} words.`,
          "The VERY FIRST narration line states the world's rule, like: 'Everyone in my world gets their star mark at twelve.'",
          "Structure, in order: the rule; stakes and ranks in 2-3 quick beats; I am the overlooked underdog; the big day where others get impressive results; my turn, with a reveal far beyond anyone else; shocked reactions; a final cliffhanger line that sets up part 2.",
          `Dialogue is rare: at most 3 short reaction lines, each under ${r.maxLineWords} words.`,
          "Use palace or arena settings for the big day. Use 'surprised', 'scared' or 'excited' moods on reaction beats.",
        ]
      : [
          `STYLE COZY. ${r.minBeats} to ${r.maxBeats} beats, ${r.seconds} seconds total.`,
          "Narration is a warm third-person storyteller, one or two short sentences per beat.",
          "Structure: setup, rising problem, turn, payoff. Gentle, funny and emotional, no moral lecture.",
          `Characters may speak short lines (under ${r.maxLineWords} words) in some beats.`,
        ];
  return [
    `Write the full story for this pitch.`,
    `Title: ${pitch.title}`,
    `Logline: ${pitch.logline}`,
    `Genre: ${pitch.genre}`,
    `Twist: ${pitch.twist}`,
    "",
    ...styleRules,
    "Use 1 to 3 characters. Character 0 is the hero.",
    vocab(),
    "",
    'Answer as JSON: {"title":"...","logline":"...","characters":[{"name":"...","color":"...","accessory":"..."}],"beats":[{"setting":"...","time":"...","narration":"...","cast":[{"who":0,"mood":"...","action":"..."}],"speaker":null,"line":null}],"caption":"...","hashtags":["..."]}',
  ].join("\n");
}

export function editPrompt(story: Story, style: StoryStyle, issues: string[]): string {
  return [
    `You are Vera, the story editor. Review this ${style.toUpperCase()} story before it goes to animation.`,
    issues.length
      ? `Our rule checker already found and patched these problems: ${issues.join("; ")}.`
      : "Our rule checker found no problems.",
    style === "hook"
      ? "Check: first line states the world's rule; first person; underdog; clear reveal far beyond everyone; shocked reactions; ends on a cliffhanger; every narration line is short and punchy."
      : "Check: clear setup, problem, turn and payoff; gentle and funny; no moral lecture.",
    "Also check it is original, all-ages and mentions no real people or brands.",
    "If it is good, verdict 'approved' and story null.",
    "If you can improve it with small edits, verdict 'fixed' and return the full corrected story (same shape, same rules).",
    "If it is unsafe or unusable, verdict 'rejected' with story null.",
    "List what you noticed in 'issues' (short phrases).",
    vocab(),
    "",
    "The story:",
    JSON.stringify(story),
    "",
    'Answer as JSON: {"verdict":"approved|fixed|rejected","issues":["..."],"story":null}',
  ].join("\n");
}
