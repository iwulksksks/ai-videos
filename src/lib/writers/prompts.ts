// The instructions every AI writer gets. Kept in one place so Ollama and Claude write the same way.
import {
  ACCESSORIES,
  ACTIONS,
  PROPS,
  SFX,
  COLORS,
  EXPRESSIONS,
  SETTINGS,
  TIMES,
  isPaper,
  rulesFor,
  type VideoLength,
  type Pitch,
  type ScoutInsights,
  type Story,
  type StoryStyle,
  type Character,
  type Theme,
} from "../story";
import { GOSSIP_SHAPES, HERO, NEIGHBORS, TOWN, episodeCast, shapeById, townFolk, type EpisodePlan } from "../town";

const TOWN_INTRO =
  `Town Gossip episodes all happen in ${TOWN.name}, a paper-cutout storybook town. Pip (${HERO.role}) is in every episode. ` +
  `The narrator is ${TOWN.narrator}, a nosy pigeon in reading glasses and a headscarf who sees everything from the rooftops. She tells the story to the viewer like juicy gossip: first person, conspiratorial, a little dramatic ("okay, so", "and honey,", "I saw the whole thing"), but she never uses the same opener twice in a row. ` +
  `Each episode opens with a headline in the town paper, ${TOWN.paper}, and closes with the paper's correction, which reveals what really happened. ` +
  `Every episode has a DIFFERENT kind of story, different neighbors and a different situation, so no two videos feel alike. Stories come from town life, not the internet. Never name a real app, site, brand or celebrity.`;

const WHATIF_INTRO =
  `What If videos ask one wild question and answer it to the viewer, step by step, in the SECOND person ("you"). ` +
  `Pip (${HERO.role}), a paper-cutout puppet, plays "you" on screen; there is no other narrator character. ` +
  "A counter at the top of the screen (depth, height, days, speed, socks...) climbs through the whole video, and every step is bigger, stranger and worse than the last. " +
  "Every step is a REAL, checkable fact (a real depth, record, temperature, body effect or law of physics), told in plain words a kid understands. " +
  "It opens on the question and ends on the most extreme step with a funny final line, so the video loops.";

const POV_INTRO =
  `POV Story videos are first-person mysteries told by Pip (${HERO.role}), a paper-cutout puppet in ${TOWN.name}, the paper-cutout storybook town. ` +
  "Each one starts from ONE strange rule everybody in town follows without knowing why (nobody whistles after dark, every door is painted twice a year, the bakery never sells bread on Tuesdays). " +
  "Pip is the one kid who asks why, follows the clues, and finds THE REAL REASON, which is surprising, funny or kind, and makes sense of every clue. " +
  "No chosen ones, no deadly trials or games, no paradise, no villains taking over the town, no rules about colors, and no little sister. Stories come from town life, not the internet.";

function povRules(length: VideoLength): string[] {
  const r = rulesFor("pov", length);
  return [
    `STYLE POV STORY. ${r.minBeats} to ${r.maxBeats} beats, ${r.seconds} seconds.`,
    POV_INTRO,
    "Narration is FIRST PERSON: Pip (character 0) tells it and says 'I', past tense, casual and quick, like telling a friend.",
    `ONE short sentence per beat, ideally ${r.minWords + 3} to ${r.maxWords} words, so the picture changes about every 3 seconds.`,
    "Story flow, in this order (each step is one or more beats):",
    "  1. Beat 1 states the rule as a plain fact of life, 6 to 14 words, like 'In Brickbury, nobody is allowed to whistle after dark.'",
    "  2. How the town lives with it: two or three quick, funny specifics.",
    "  3. Why it matters to me: the rule gets in MY way, or I'm the only one who asks why.",
    "  4. The day it happens: I break the rule or start asking, and something odd happens.",
    "  5. Three clues, each from a different neighbor or place, and each one changes what I think. Start them 'First clue:', 'Second clue:', 'Last clue:'.",
    "  6. The scary theory everyone believes, and for a moment it looks true.",
    "  7. The real reason, revealed in two or three beats: surprising, funny or kind, and it explains every clue. Start the reveal beat with 'The real reason?'",
    "  8. What changes after, and a last beat that is a small joke calling back to the rule. No 'part 2', no 'follow for more'.",
    `Neighbors may say short lines (under ${r.maxLineWords} words), at most 5 in the story.`,
    "Use settings that fit each step and change them as you go (town, plaza, market, cafe, bedroom, forest, harbor, workshop...).",
    "Title: 'The Real Reason' plus the rule, 5 to 10 words, title case (like 'The Real Reason Nobody Whistles After Dark'). caption: one short line. hashtags: 4 to 6.",
  ];
}

/** Long videos ask for the clip stretches in the answer too. */
function withHighlights(format: string, length: VideoLength): string {
  if (length !== "long") return format;
  return format.replace('"caption":"..."', '"highlights":[{"start":1,"end":12,"hook":"..."}],"caption":"..."');
}

/** Long videos: more story, plus the stretches that become TikTok clips. */
function longRules(style: StoryStyle): string[] {
  const r = rulesFor(style, "long");
  return [
    `LENGTH: this is a LONG video for YouTube, about 2.5 minutes: ${r.minBeats} to ${r.maxBeats} beats, ${r.seconds} seconds, about 380 to 460 spoken words.`,
    `Write ALL ${r.minBeats} or more beats: count them before you answer. Keep every beat as short as the rules above say; the extra length comes from more story steps, more clues, more reactions and more small moments, not longer sentences.`,
    "Also return 'highlights': 2 or 3 stretches of the story that work as stand-alone TikTok clips of 65 to 85 seconds each (about 20 to 26 beats; never under one minute). Good picks: the opening with its rule or question, the biggest moment, and the ending with the twist.",
    "Each highlight: 'start' and 'end' are beat numbers counted from 1, both included. 'hook' is a NEW opening line of 6 to 14 words, in the same narrator's voice, that makes the clip make sense to someone who never saw the rest. Highlights may overlap. The last one should include the final beat.",
  ];
}

function folkLine(name: string, i: number, color?: string): string {
  const f = townFolk(name);
  return `${i}. ${name}${color ? ` (${color} clothes this time)` : ""}${f ? `: ${f.role}` : ""}.`;
}

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

export function scoutPrompt(videos: { title: string; channel: string; views: number; viewsPerDay: number }[], brief: string): string {
  return [
    `Our channel brief: "${brief}".`,
    "These are recent short story videos from channels in our niche, ranked by views per day (best first):",
    ...videos.slice(0, 30).map((v) => `- "${v.title}" (${v.channel}, ${v.viewsPerDay.toLocaleString("en-US")} views/day)`),
    "",
    "Study what is working. Do NOT copy any title, plot or character.",
    "1. topics: 3 to 5 broad subject areas that are performing well and that we could cover with our OWN original story (for example 'medieval building tricks' or 'survival science in the desert'). 'theme' is the topic; 'why' says which videos show it is working.",
    "2. hooks: 3 to 5 reusable title or opening patterns that are working, written as templates (for example 'Why [person] did [strange act]'), with 'why' explaining what makes them click.",
    'Answer as JSON: {"topics":[{"theme":"...","why":"..."}],"hooks":[{"pattern":"...","why":"..."}]}',
  ].join("\n");
}

export function pitchesPrompt(opts: {
  theme: Theme | null;
  trends: Theme[];
  brief: string;
  usedTitles: string[];
  style: StoryStyle;
  count: number;
  niche?: ScoutInsights | null;
  plans?: EpisodePlan[]; // Town Gossip: one story shape and neighbor line-up per pitch
}): string {
  const styleNote =
    opts.style === "twist"
      ? "Style TWIST TALE: a 60-second tale built on a REAL, checkable mechanism (a clever trick, an invention, a law of physics, a psychology effect or a true historical event). Someone does something that looks foolish, everyone laughs, the sensible choice seems right, then it fails and the hero's strange act turns out to be genius because of that mechanism. Characters and story are original; only the mechanism is real. Avoid mechanisms you are not sure about."
      : opts.style === "gossip"
      ? [
          "Style TOWN GOSSIP: 60-second comedy episodes of small-town life, each told in a different story flow (a what if, a whodunit, a rewind, plan vs. reality, a nature documentary, a heist...), with an ending that makes people rewatch and comment.",
          TOWN_INTRO,
          "Each pitch has its own STORY FLOW below: the way the story is told, not just its topic. Invent a premise that suits that flow. Never use the pattern 'something spreads and everyone in town copies it one by one'.",
          "Write each pitch for its own story flow and neighbors below. Make each one feel fresh: a different situation, different jokes, a different ending. Do not build every episode around a catchphrase; if one has a catchphrase, it must be new.",
          ...(opts.plans ?? []).map(
            (p, i) => `Pitch ${i + 1}: story flow "${p.shape.name}" (${p.shape.plan}) Neighbors: ${p.neighbors.map((n) => `${n.name} (${n.role})`).join("; ")}.`,
          ),
        ].join("\n")
      : opts.style === "whatif"
      ? [
          "Style WHAT IF: 60-second 'What if you...' videos that escalate one wild question with real facts.",
          WHATIF_INTRO,
          "Pick questions where a single number can climb the whole time (meters dug, kilometers climbed, days without X, speed, size, how many) and where the real facts get more surprising at each step. Mix science, space, the human body, animals, history and everyday life; don't pitch the same kind of question twice.",
        ].join("\n")
      : opts.style === "pov"
      ? [
          "Style POV STORY: first-person story-time mysteries about the real reason behind a strange town rule.",
          POV_INTRO,
          "Pitch rules that feel oddly specific and believable, where the real reason is a genuine surprise. Vary them: some funny, some sweet, some spooky-but-safe.",
        ].join("\n")
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
    opts.niche
      ? `What is working right now on story channels like ours (inspiration only: never copy another channel's title, plot or characters): topics ${opts.niche.topics.map((t) => t.theme).join("; ")}. Title and hook shapes: ${opts.niche.hooks.map((h) => h.pattern).join("; ")}.`
      : "",
    opts.usedTitles.length
      ? `Do NOT reuse or closely copy these titles we already made: ${opts.usedTitles.slice(0, 60).join("; ")}.`
      : "",
    opts.style === "gossip"
      ? `Pitch ${opts.count} episodes, in the order above. Each pitch: title (3 to 7 words, catchy), logline (one sentence), genre (one or two words), twist (the ending in one sentence), era (the flow's id: ${(opts.plans ?? []).map((p) => p.shape.id).join(", ")}, in order) and skeptic (the neighbors' names, comma separated, exactly as given).`
      : opts.style === "whatif"
      ? `Pitch ${opts.count} different What If videos. Each pitch: title (starts with "What If You", 4 to 8 words, title case), logline (one sentence), genre (one or two words, like science or space), twist (the final, most extreme step and its funny line), mechanism (the real facts the steps are built on, in two or three plain sentences, with real numbers) and era (the counter as "LABEL | unit", for example "DEPTH | m", "DAYS AWAKE | days" or "SPEED | km/h").`
      : opts.style === "pov"
      ? `Pitch ${opts.count} different POV stories. Each pitch: title ("The Real Reason" plus the rule, 5 to 10 words, title case), logline (the rule and why it matters to Pip, one sentence), genre (one or two words, like mystery or comedy), twist (the real reason, in one sentence) and skeptic (the scary theory everyone believes, in one sentence).`
      : opts.style === "twist"
      ? `Pitch ${opts.count} different original stories. Each pitch: title (4 to 8 words, title case, framed as a mystery like "Why ...", "How ... Worked" or "The ... That ...", no emoji or hashtags), logline (one sentence), genre (one or two words), twist (the payoff in one sentence), mechanism (the real trick or fact, explained correctly in one or two plain sentences), era (when and where it is set) and skeptic (who mocks the hero).`
      : `Pitch ${opts.count} different original stories. Each pitch: title (max 6 words), logline (one sentence), genre (one or two words) and twist (the surprise in one sentence).`,
    opts.style === "twist" || opts.style === "gossip" || opts.style === "whatif" || opts.style === "pov"
      ? 'Answer as JSON: {"pitches":[{"title":"...","logline":"...","genre":"...","twist":"...","mechanism":"...","era":"...","skeptic":"..."}]}'
      : 'Answer as JSON: {"pitches":[{"title":"...","logline":"...","genre":"...","twist":"..."}]}',
  ]
    .filter(Boolean)
    .join("\n");
}

export function vocab(style?: StoryStyle): string {
  return [
    `Allowed settings: ${SETTINGS.join(", ")}.`,
    `Allowed times: ${TIMES.join(", ")}.`,
    `Character colors: ${COLORS.join(", ")}. Accessories: ${ACCESSORIES.join(", ")}.`,
    `Moods: ${EXPRESSIONS.join(", ")}. Actions: ${ACTIONS.join(", ")}.`,
    style && isPaper(style)
      ? "Characters are paper-cutout puppets. In each beat, 'cast' lists who is on screen by their index in 'characters' (0 to 4), with a mood and action. Use at most 3 on screen."
      : "Characters are simple round cartoon blobs, so describe them only by name, color and accessory.",
    style === "gossip" ? "" : "In each beat, 'cast' lists who is on screen by their index in 'characters' (0, 1 or 2), with a mood and action. Use at most 3 on screen.",
    "'speaker' is the index of the character saying 'line' in that beat, or null when nobody speaks. 'line' is null when nobody speaks.",
    `Optional per beat: 'prop' (${PROPS.join(", ")}) shows a big close-up of that object instead of the characters, for explaining how something works; 'sfx' (${SFX.join(", ")}) plays a sound effect as the beat starts. Use null when not needed.`,
    style === "gossip" ? "'card' is 'headline' on the first beat, 'correction' on the last beat, and null on every other beat." : "",
    style === "whatif" ? "'card' is 'question' on the first beat and null on every other beat. 'value' is the counter's number in that beat (a plain number in the counter's unit, never text), or null to keep the last value." : "",
    "caption: a short, punchy social caption (one or two sentences). hashtags: 5 to 8 tags without the # sign.",
  ]
    .filter(Boolean)
    .join("\n");
}

/** The neighbors a Town Gossip pitch was planned with (stored in its 'skeptic' field). */
export function gossipNeighbors(pitch: Pick<Pitch, "skeptic">): string[] {
  const names = (pitch.skeptic ?? "").split(/[,;]| and /).map((n) => n.trim()).filter(Boolean);
  return names.map((n) => townFolk(n)?.name).filter((n): n is string => !!n && n !== HERO.name);
}

function gossipRules(pitch: Pitch, length: VideoLength): string[] {
  const r = rulesFor("gossip", length);
  const shape = shapeById(pitch.era) ?? null;
  let names = gossipNeighbors(pitch);
  if (!names.length) names = NEIGHBORS.slice(0, 3).map((n) => n.name);
  const cast = episodeCast(names);
  return [
    `STYLE TOWN GOSSIP. ${r.minBeats} to ${r.maxBeats} beats, ${r.seconds} seconds, ${spokenWords(length, "140 to 190")} spoken words in total.`,
    TOWN_INTRO,
    "Characters for this episode (use exactly these, in this order, as 'characters', with these colors and accessories):",
    ...cast.map((c, i) => folkLine(c.name, i, i === 0 ? undefined : c.color)),
    `'characters' JSON: ${JSON.stringify(cast)}`,
    `STORY FLOW: "${(shape ?? GOSSIP_SHAPES[0]).name}". ${(shape ?? GOSSIP_SHAPES[0]).plan}`,
    "Build the middle of the episode on these steps, in this order (each step is one or more beats):",
    ...(shape ?? GOSSIP_SHAPES[0]).beats.map((b, i) => `  ${i + 1}. ${b}`),
    "Follow this flow closely: it is what makes this episode feel different from the others. Do NOT use the pattern 'something spreads and every neighbor joins in or copies it one by one'.",
    "Every scene should make sense for THIS situation: pick settings that fit it, and give each neighbor something only they would do.",
    `Beat 1 is the HEADLINE card ('card': 'headline'): its narration is a punchy, slightly wrong newspaper headline of 5 to 10 words that makes people need to know more (for example "Local Boy Steals Moon, Says Mayor"). Put the characters it is about in its cast. No line.`,
    `From beat 2, ${TOWN.narrator} tells the story following the flow above. Give each neighbor something only they would do.`,
    `The LAST beat is the CORRECTION card ('card': 'correction'): its narration starts with "Correction:" and reveals the twist in one funny sentence that flips the headline. Everything before it builds to it.`,
    `Narration: ${TOWN.narrator} speaks every beat in first person, ONE short sentence per beat, ideally 5 to 12 words, so the picture changes about every 3 seconds.`,
    `Characters may speak short lines (under ${r.maxLineWords} words), at most 6 in the episode. Don't repeat the same line over and over, and don't build the episode around a catchphrase.`,
    `Use settings that fit the story: ${["town", "plaza", "cafe", "classroom", "bedroom", "market", "forest", "beach", "workshop", "lab", "harbor", "city"].join(", ")}. Vary them.`,
    "The correction is the punch line: no 'part 2', no 'follow for more', so it loops.",
    "Title: 3 to 7 words, catchy. caption: one short funny line. hashtags: 4 to 6.",
  ];
}

/** The counter a What If pitch was planned with (stored in its 'era' field as "LABEL | unit"). */
export function whatifCounter(pitch: Pick<Pitch, "era">): { label: string; unit: string } {
  const [label, unit] = (pitch.era ?? "").split("|").map((s) => s.trim());
  return { label: (label || "LEVEL").toUpperCase().slice(0, 28), unit: (unit ?? "").slice(0, 12) };
}

function whatifRules(pitch: Pitch, length: VideoLength): string[] {
  const r = rulesFor("whatif", length);
  const counter = whatifCounter(pitch);
  const cast = episodeCast([]);
  return [
    `STYLE WHAT IF. ${r.minBeats} to ${r.maxBeats} beats, ${r.seconds} seconds, ${spokenWords(length, "150 to 200")} spoken words in total.`,
    WHATIF_INTRO,
    `'characters' JSON (Pip plays "you"; you may add at most 2 extra one-off characters, like a pilot or a scientist): ${JSON.stringify(cast)}`,
    `'counter' JSON: ${JSON.stringify(counter)}. Pick a different label or unit only if it reads better.`,
    `Beat 1 is the QUESTION card ('card': 'question'): its narration is the question itself, starting with "What if you", 6 to 12 words. Pip in its cast. No value, no line.`,
    "Beat 2 starts at the beginning (the counter's starting value, usually 0) in an everyday place.",
    "Then climb: each beat (or pair of beats) is one step with a bigger 'value' and one real fact about what happens to you there. Make the steps jump in size (1, 10, 100, 1,000...), and make each step more surprising or worse than the last. Values never go down.",
    "Say the number in the narration the way a person says it ('Four kilometers.', 'Day three.'), then the fact. Facts must be true and correctly explained; when you are not sure of a fact, leave it out.",
    "Second person, present tense: 'you grab a shovel', 'your ears pop'. ONE or two short sentences per beat, ideally 6 to 14 words, so the picture changes about every 3 seconds.",
    "Pip's mood and action should show how 'you' feel at each step (excited at first, then surprised, scared, exhausted).",
    `Pip may say up to 3 short, funny lines (under ${r.maxLineWords} words) as reactions.`,
    "The LAST beat is the most extreme step, with a funny closing line. No 'part 2', no 'follow for more', so it loops.",
    "Use settings that fit each step and change them as you go (for example forest, mine, canyon, space, beach, city, lab, harbor).",
    "Put the real facts you used in 'mechanism', in one or two plain sentences.",
    "Title: the question, 4 to 8 words, title case. caption: one short line. hashtags: 4 to 6.",
  ];
}

/** Spoken words for the whole video: the short number, or the long video's number. */
function spokenWords(length: VideoLength, short: string): string {
  return length === "long" ? "380 to 460" : short;
}

export function storyPrompt(pitch: Pitch, style: StoryStyle, length: VideoLength = "short", cast: Character[] = []): string {
  // Every number in the prompt comes from the same rules Vera checks against, for this length.
  const r = rulesFor(style, length);
  const styleRules =
    style === "twist"
      ? [
          `STYLE TWIST TALE. ${r.minBeats} to ${r.maxBeats} beats, ${r.seconds} seconds, ${spokenWords(length, "170 to 200")} spoken words in total.`,
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
      : style === "gossip"
      ? gossipRules(pitch, length)
      : style === "whatif"
      ? whatifRules(pitch, length)
      : style === "pov"
      ? [
          ...povRules(length),
          `'characters' JSON (Pip is "I"; the neighbors may change color but keep their names): ${JSON.stringify(cast.length ? cast : episodeCast([]))}`,
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
    pitch.skeptic ? (style === "pov" ? `The scary theory everyone believes: ${pitch.skeptic}` : `Who mocks the hero: ${pitch.skeptic}`) : "",
    "",
    ...styleRules,
    ...(length === "long" ? longRules(style) : []),
    style === "gossip" ? "Use the characters exactly as listed above, in that order. Character 0 (Pip) is the hero." : style === "whatif" ? "Character 0 (Pip) is 'you'." : style === "pov" ? "Use the characters exactly as listed above. Character 0 (Pip) is 'I'." : "Use 1 to 3 characters. Character 0 is the hero.",
    vocab(style),
    "",
    withHighlights(
      style === "whatif"
      ? 'Answer as JSON: {"title":"...","logline":"...","mechanism":"...","counter":{"label":"...","unit":"..."},"characters":[{"name":"...","color":"...","accessory":"..."}],"beats":[{"setting":"...","time":"...","narration":"...","cast":[{"who":0,"mood":"...","action":"..."}],"speaker":null,"line":null,"prop":null,"sfx":null,"card":null,"value":null}],"caption":"...","hashtags":["..."]}'
      : style === "gossip"
      ? 'Answer as JSON: {"title":"...","logline":"...","mechanism":null,"characters":[{"name":"...","color":"...","accessory":"..."}],"beats":[{"setting":"...","time":"...","narration":"...","cast":[{"who":0,"mood":"...","action":"..."}],"speaker":null,"line":null,"prop":null,"sfx":null,"card":null}],"caption":"...","hashtags":["..."]}'
      : 'Answer as JSON: {"title":"...","logline":"...","mechanism":null,"characters":[{"name":"...","color":"...","accessory":"..."}],"beats":[{"setting":"...","time":"...","narration":"...","cast":[{"who":0,"mood":"...","action":"..."}],"speaker":null,"line":null,"prop":null,"sfx":null}],"caption":"...","hashtags":["..."]}',
      length,
    ),
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
      : style === "gossip"
      ? "Check: Pip is character 0; beat 1 is a 'headline' card with a punchy headline; Mabel the pigeon narrates in first person, gossipy and short; the middle follows one clear story flow (a what if, a whodunit, a rewind, plan vs. reality, two sides, a documentary, a heist, a week of days, a top five, a training montage, theories, or a new neighbor); it does NOT use the 'something spreads and everyone copies it one by one' pattern (if it does, rewrite it, verdict 'fixed'); each neighbor does something only they would do; the last beat is a 'correction' card starting with 'Correction:' that lands the twist; no 'part 2' or 'follow'; it is actually funny; no catchphrase repeated over and over; it's about town life, not the internet; no real app, brand or person is named."
      : style === "whatif"
      ? "Check: beat 1 is a 'question' card starting with 'What if you'; narration is second person ('you'), present tense, short; 'counter' is set and every step has a 'value' that only goes up, in big jumps; each step is more extreme than the last; it ends on the most extreme step with a funny line and no 'part 2'. FACT CHECK every number and claim: depths, heights, temperatures, records, body effects. Fix anything wrong with small edits (verdict 'fixed'); if the core idea is false or you are not sure the facts are true, the verdict is 'rejected'."
      : style === "pov"
      ? "Check: Pip is character 0 and narrates in first person ('I'); beat 1 states one strange town rule as a plain fact; the story follows the flow: how the town lives with it, why it matters to me, the day it happens, three clues, the scary theory, then 'The real reason?' reveal that explains every clue, and a small joke callback to end; sentences are short; no chosen ones, deadly trials, paradise, color rules, villains taking over or little sister; no 'part 2'. If 'highlights' are present, keep them and keep their beat numbers right after any edit."
      : style === "hook"
      ? "Check: first line states the world's rule; first person; underdog; clear reveal far beyond everyone; shocked reactions; ends on a cliffhanger; every narration line is short and punchy."
      : "Check: clear setup, problem, turn and payoff; gentle and funny; no moral lecture.",
    "Also check it is original, all-ages and mentions no real people or brands.",
    "If it is good, verdict 'approved' and story null.",
    "If you can improve it with small edits, verdict 'fixed' and return the full corrected story (same shape, same rules).",
    "If it is unsafe or unusable, verdict 'rejected' with story null.",
    "List what you noticed in 'issues' (short phrases).",
    vocab(style),
    "",
    "The story:",
    JSON.stringify(story),
    "",
    'Answer as JSON: {"verdict":"approved|fixed|rejected","issues":["..."],"story":null}',
  ].join("\n");
}

/**
 * Small local models often write far fewer beats than asked. This asks for one stretch of the
 * story again, told in more, smaller beats, so the whole story reaches the length Vera checks for.
 */
export function expandPrompt(opts: {
  story: Story;
  style: StoryStyle;
  length: VideoLength;
  from: number; // first beat of the stretch, counted from 0
  to: number; // last beat of the stretch, counted from 0, included
  want: number; // how many beats the stretch should become
}): string {
  const { story, style, length, from, to, want } = opts;
  const r = rulesFor(style, length);
  const part = story.beats.slice(from, to + 1);
  const voice =
    style === "pov" || style === "hook"
      ? "first person ('I'), like the rest of the story"
      : style === "whatif"
      ? "second person ('you'), present tense, like the rest of the story"
      : style === "gossip"
      ? `${TOWN.narrator}'s gossipy first person, like the rest of the story`
      : "the same narrator voice as the rest of the story";
  const prevValue = [...story.beats.slice(0, from)].reverse().find((b) => typeof b.value === "number")?.value;
  const nextValue = story.beats.slice(to + 1).find((b) => typeof b.value === "number")?.value;
  return [
    `This ${style.toUpperCase()} story is too short: it has ${story.beats.length} beats and needs ${r.minBeats} to ${r.maxBeats}.`,
    "Here is the whole story, one line per beat, so you know what happens:",
    ...story.beats.map((b, i) => `${i + 1}. ${b.narration}${b.line ? ` ("${b.line}")` : ""}`),
    "",
    `Rewrite ONLY beats ${from + 1} to ${to + 1} as exactly ${want} beats.`,
    "Tell the same events in the same order, but slower: add the small moments in between, reactions, details, a clue or a joke, so each beat is one quick picture.",
    `Do not repeat what happens before beat ${from + 1} or after beat ${to + 1}, and do not end the story early.`,
    `Narration is ${voice}: ONE short sentence per beat, ${r.minWords} to ${r.maxWords} words. Lines a character says are under ${r.maxLineWords} words, and most beats have no line.`,
    `Characters (use their index in 'cast' and 'speaker'): ${story.characters.map((c, i) => `${i} = ${c.name}`).join(", ")}.`,
    style === "whatif"
      ? `Each beat has a 'value' for the counter (${story.counter?.label ?? "the counter"}${story.counter?.unit ? `, in ${story.counter.unit}` : ""}) that never goes down${typeof prevValue === "number" ? `, starting from at least ${prevValue}` : ""}${typeof nextValue === "number" ? ` and staying at or below ${nextValue}` : ""}. Every fact must be true.`
      : "",
    "'card' is null on every one of these beats.",
    vocab(style),
    "",
    "The beats to rewrite:",
    JSON.stringify(part),
    "",
    `Answer as JSON with ${want} beats: {"beats":[{"setting":"...","time":"...","narration":"...","cast":[{"who":0,"mood":"...","action":"..."}],"speaker":null,"line":null,"prop":null,"sfx":null${style === "whatif" ? ',"value":null' : ""}}]}`,
  ]
    .filter((l) => l !== "")
    .join("\n");
}
