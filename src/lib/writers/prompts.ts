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
  type ScoutInsights,
  type Story,
  type StoryStyle,
  type Theme,
} from "../story";
import { GOSSIP_SHAPES, HERO, NEIGHBORS, TOWN, episodeCast, shapeById, townFolk, type EpisodePlan } from "../town";

const TOWN_INTRO =
  `Town Gossip episodes all happen in ${TOWN.name}, a paper-cutout storybook town. Pip (${HERO.role}) is in every episode. ` +
  `The narrator is ${TOWN.narrator}, a nosy pigeon in reading glasses and a headscarf who sees everything from the rooftops. She tells the story to the viewer like juicy gossip: first person, conspiratorial, a little dramatic ("okay, so", "and honey,", "I saw the whole thing"), but she never uses the same opener twice in a row. ` +
  `Each episode opens with a headline in the town paper, ${TOWN.paper}, and closes with the paper's correction, which reveals what really happened. ` +
  `Every episode has a DIFFERENT kind of story, different neighbors and a different situation, so no two videos feel alike. Stories come from town life, not the internet. Never name a real app, site, brand or celebrity.`;

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
      : opts.style === "twist"
      ? `Pitch ${opts.count} different original stories. Each pitch: title (4 to 8 words, title case, framed as a mystery like "Why ...", "How ... Worked" or "The ... That ...", no emoji or hashtags), logline (one sentence), genre (one or two words), twist (the payoff in one sentence), mechanism (the real trick or fact, explained correctly in one or two plain sentences), era (when and where it is set) and skeptic (who mocks the hero).`
      : `Pitch ${opts.count} different original stories. Each pitch: title (max 6 words), logline (one sentence), genre (one or two words) and twist (the surprise in one sentence).`,
    opts.style === "twist" || opts.style === "gossip"
      ? 'Answer as JSON: {"pitches":[{"title":"...","logline":"...","genre":"...","twist":"...","mechanism":"...","era":"...","skeptic":"..."}]}'
      : 'Answer as JSON: {"pitches":[{"title":"...","logline":"...","genre":"...","twist":"..."}]}',
  ]
    .filter(Boolean)
    .join("\n");
}

function vocab(style?: StoryStyle): string {
  return [
    `Allowed settings: ${SETTINGS.join(", ")}.`,
    `Allowed times: ${TIMES.join(", ")}.`,
    `Character colors: ${COLORS.join(", ")}. Accessories: ${ACCESSORIES.join(", ")}.`,
    `Moods: ${EXPRESSIONS.join(", ")}. Actions: ${ACTIONS.join(", ")}.`,
    style === "gossip"
      ? "Characters are paper-cutout puppets. In each beat, 'cast' lists who is on screen by their index in 'characters' (0 to 4), with a mood and action. Use at most 3 on screen."
      : "Characters are simple round cartoon blobs, so describe them only by name, color and accessory.",
    style === "gossip" ? "" : "In each beat, 'cast' lists who is on screen by their index in 'characters' (0, 1 or 2), with a mood and action. Use at most 3 on screen.",
    "'speaker' is the index of the character saying 'line' in that beat, or null when nobody speaks. 'line' is null when nobody speaks.",
    `Optional per beat: 'prop' (${PROPS.join(", ")}) shows a big close-up of that object instead of the characters, for explaining how something works; 'sfx' (${SFX.join(", ")}) plays a sound effect as the beat starts. Use null when not needed.`,
    style === "gossip" ? "'card' is 'headline' on the first beat, 'correction' on the last beat, and null on every other beat." : "",
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

function gossipRules(pitch: Pitch): string[] {
  const r = STYLE_RULES.gossip;
  const shape = shapeById(pitch.era) ?? null;
  let names = gossipNeighbors(pitch);
  if (!names.length) names = NEIGHBORS.slice(0, 3).map((n) => n.name);
  const cast = episodeCast(names);
  return [
    `STYLE TOWN GOSSIP. ${r.minBeats} to ${r.maxBeats} beats, ${r.seconds} seconds, 140 to 190 spoken words in total.`,
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
      : style === "gossip"
      ? gossipRules(pitch)
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
    style === "gossip" ? "Use the characters exactly as listed above, in that order. Character 0 (Pip) is the hero." : "Use 1 to 3 characters. Character 0 is the hero.",
    vocab(style),
    "",
        style === "gossip"
      ? 'Answer as JSON: {"title":"...","logline":"...","mechanism":null,"characters":[{"name":"...","color":"...","accessory":"..."}],"beats":[{"setting":"...","time":"...","narration":"...","cast":[{"who":0,"mood":"...","action":"..."}],"speaker":null,"line":null,"prop":null,"sfx":null,"card":null}],"caption":"...","hashtags":["..."]}'
      : 'Answer as JSON: {"title":"...","logline":"...","mechanism":null,"characters":[{"name":"...","color":"...","accessory":"..."}],"beats":[{"setting":"...","time":"...","narration":"...","cast":[{"who":0,"mood":"...","action":"..."}],"speaker":null,"line":null,"prop":null,"sfx":null}],"caption":"...","hashtags":["..."]}',
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
