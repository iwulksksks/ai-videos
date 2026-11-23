// The instructions every AI writer gets. Kept in one place so Ollama and Claude write the same way.
import {
  ACCESSORIES,
  ACTIONS,
  PROPS,
  SFX,
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
    opts.style === "twist"
      ? "Style TWIST TALE: a 60-second tale built on a REAL, checkable mechanism (a clever trick, an invention, a law of physics, a psychology effect or a true historical event). Someone does something that looks foolish, everyone laughs, the sensible choice seems right, then it fails and the hero's strange act turns out to be genius because of that mechanism. Characters and story are original; only the mechanism is real. Avoid mechanisms you are not sure about."
      : opts.style === "hook"
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
    opts.style === "twist"
      ? `Pitch ${opts.count} different original stories. Each pitch: title (4 to 8 words, title case, framed as a mystery like "Why ...", "How ... Worked" or "The ... That ...", no emoji or hashtags), logline (one sentence), genre (one or two words), twist (the payoff in one sentence), mechanism (the real trick or fact, explained correctly in one or two plain sentences), era (when and where it is set) and skeptic (who mocks the hero).`
      : `Pitch ${opts.count} different original stories. Each pitch: title (max 6 words), logline (one sentence), genre (one or two words) and twist (the surprise in one sentence).`,
    opts.style === "twist"
      ? 'Answer as JSON: {"pitches":[{"title":"...","logline":"...","genre":"...","twist":"...","mechanism":"...","era":"...","skeptic":"..."}]}'
      : 'Answer as JSON: {"pitches":[{"title":"...","logline":"...","genre":"...","twist":"..."}]}',
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
    `Optional per beat: 'prop' (${PROPS.join(", ")}) shows a big close-up of that object instead of the characters, for explaining how something works; 'sfx' (${SFX.join(", ")}) plays a sound effect as the beat starts. Use null when not needed.`,
    "caption: a short, punchy social caption (one or two sentences). hashtags: 5 to 8 tags without the # sign.",
  ].join("\n");
}

export function storyPrompt(pitch: Pitch, style: StoryStyle): string {
  const r = STYLE_RULES[style];
  const styleRules =
    style === "twist"
      ? [
          `STYLE TWIST TALE. ${r.minBeats} to ${r.maxBeats} beats, ${r.seconds} seconds, 170 to 200 spoken words in total.`,
          "Each beat's narration is 1 or 2 short sentences. One third-person narrator tells it ('he', 'she' or a first name), fast and casual.",
          "Beat plan, in order:",
          "1. A strange act with NO context: the hero does something that looks foolish (beat 1 only).",
          "2. Start the next beat with 'You see,' and set up the stakes in 2 or 3 beats.",
          "3. Everyone mocks the hero: exactly one short quoted mocking line, given as 'line' with the skeptic as 'speaker'.",
          "4. The rival's sensible choice looks right; the hero is shamed.",
          "5. A ticking sign: something slowly changes.",
          "6. The payoff: the rival's choice fails (use an sfx like crash, snap or rumble here).",
          "7. The mechanism explained correctly in 2 or 3 plain beats, using a 'prop' close-up where an object helps.",
          "The final beat ends on the punch line. No cliffhanger, no 'part 2', no outro, so the video loops.",
          "The mechanism must be real and explained correctly. Put it in one or two plain sentences in the 'mechanism' field.",
          "Title: 4 to 8 words, title case, mystery framing. caption: the title only. hashtags: an empty list.",
        ]
      : style === "hook"
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
    pitch.mechanism ? `Real mechanism: ${pitch.mechanism}` : "",
    pitch.era ? `Era and place: ${pitch.era}` : "",
    pitch.skeptic ? `Who mocks the hero: ${pitch.skeptic}` : "",
    "",
    ...styleRules,
    "Use 1 to 3 characters. Character 0 is the hero.",
    vocab(),
    "",
    'Answer as JSON: {"title":"...","logline":"...","mechanism":null,"characters":[{"name":"...","color":"...","accessory":"..."}],"beats":[{"setting":"...","time":"...","narration":"...","cast":[{"who":0,"mood":"...","action":"..."}],"speaker":null,"line":null,"prop":null,"sfx":null}],"caption":"...","hashtags":["..."]}',
  ]
    .filter((l) => l !== "")
    .join("\n");
}

export function editPrompt(story: Story, style: StoryStyle, issues: string[]): string {
  return [
    `You are Vera, the story editor. Review this ${style.toUpperCase()} story before it goes to animation.`,
    issues.length
      ? `Our rule checker already found and patched these problems: ${issues.join("; ")}.`
      : "Our rule checker found no problems.",
    style === "twist"
      ? "Check: beat 1 is a strange act with no context; a 'You see,' setup; one quoted mocking line; the sensible choice looks right, then fails; the mechanism is explained in plain words; it ends on the punch line with no cliffhanger. FACT CHECK: the 'mechanism' must be real and explained correctly. If it is wrong, made up, or you are not sure it is true, the verdict is 'rejected'."
      : style === "hook"
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
