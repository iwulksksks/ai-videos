// Brickbury: the paper-cutout home town of every Town Gossip video.
// Each episode opens with a headline in the town paper, is told by Mabel, a gossiping pigeon
// in the corner of the screen, and closes with the paper's "correction" (the twist).
// Pip is the one face in every episode. The neighbors around him rotate from a big pool,
// their clothes change color from episode to episode, and each episode gets a different
// story shape, so the videos don't all feel the same.
// Shared by the writers and the renderer, so keep it free of Node-only imports.
import type { CharColor, Character } from "./story";
import { COLORS } from "./story";

export const TOWN = {
  name: "Brickbury",
  paper: "The Brickbury Bugle",
  narrator: "Mabel", // the pigeon who tells every story
};

export type Outfit =
  | "cap"
  | "bun"
  | "mayor"
  | "ponytail"
  | "chef"
  | "police"
  | "goggles"
  | "headband"
  | "bald"
  | "pigtails"
  | "curly"
  | "beanie";

export type TownFolk = Character & {
  role: string; // for the writers
  // How the toy-block renderer draws them. The shirt comes from `color`, which changes per episode.
  skin: string;
  pants: string;
  hair: string;
  outfit: Outfit;
  fixedShirt?: string; // Pip's orange hoodie and the chef's whites never change
};

export const HERO: TownFolk = {
  name: "Pip",
  color: "orange",
  accessory: "hat",
  role: "the hero: an eager, slightly unlucky 11 year old who always has a plan; green cap worn backwards",
  skin: "#f2c79b",
  pants: "#3d5a99",
  hair: "#5a3a22",
  outfit: "cap",
  fixedShirt: "#ff8a2a",
};

/** Neighbors. Each episode uses 2 to 4 of them. */
export const NEIGHBORS: TownFolk[] = [
  { name: "Nana Pearl", color: "purple", accessory: "glasses", role: "Pip's grandma: sweet, knits, secretly very competitive", skin: "#f0c8a8", pants: "#6d5a8a", hair: "#eeeeee", outfit: "bun" },
  { name: "Mayor Bigsby", color: "red", accessory: "scarf", role: "the mayor: loud, loves a ribbon cutting, jumps on every trend", skin: "#e8b48c", pants: "#333a4a", hair: "#9a9a9a", outfit: "mayor" },
  { name: "Zoe", color: "teal", accessory: "bow", role: "the teenager next door: always filming, knows what's cool", skin: "#c98f62", pants: "#2b2b3a", hair: "#2a1a12", outfit: "ponytail" },
  { name: "Chef Mo", color: "yellow", accessory: "hat", role: "the baker: big, gentle, turns everything into a pastry", skin: "#a8714a", pants: "#4a4a4a", hair: "#1a1a1a", outfit: "chef", fixedShirt: "#ffffff" },
  { name: "Officer Dot", color: "blue", accessory: "hat", role: "the town's only police officer: takes tiny problems very seriously", skin: "#d9a27a", pants: "#1f2a44", hair: "#3a2a1a", outfit: "police" },
  { name: "Mr. Fenn", color: "blue", accessory: "none", role: "the mail carrier: knows everyone's business, terrible at keeping secrets", skin: "#f2d0b0", pants: "#3a4a6a", hair: "#c9a060", outfit: "beanie" },
  { name: "Coach Rhonda", color: "red", accessory: "none", role: "the gym coach: turns everything into a competition, has a whistle", skin: "#8a5a3c", pants: "#2a2a2a", hair: "#1a1a1a", outfit: "headband" },
  { name: "Bolt", color: "green", accessory: "glasses", role: "Pip's best friend: a kid inventor whose gadgets almost work", skin: "#c98f62", pants: "#4a3a2a", hair: "#2a1a12", outfit: "goggles" },
  { name: "Lulu", color: "pink", accessory: "bow", role: "Pip's little sister, 6: says exactly what everyone is thinking", skin: "#f2c79b", pants: "#a05a8a", hair: "#5a3a22", outfit: "pigtails" },
  { name: "Gus", color: "green", accessory: "none", role: "the grumpy old gardener next door: hates noise, secretly soft", skin: "#e8b48c", pants: "#5a4a3a", hair: "#bbbbbb", outfit: "bald" },
  { name: "Mrs. Plum", color: "purple", accessory: "none", role: "runs the hair salon: the town's fastest gossip", skin: "#b07850", pants: "#4a2a4a", hair: "#7a2a5a", outfit: "curly" },
  { name: "Ms. Kettle", color: "yellow", accessory: "glasses", role: "Pip's teacher: calm, tired, has seen everything", skin: "#f0c8a8", pants: "#3a3a4a", hair: "#8a5a2a", outfit: "bun" },
];

export const TOWN_CAST: TownFolk[] = [HERO, ...NEIGHBORS];

/** The town character with this name, if any (case, dots and spaces ignored). */
export function townFolk(name: string): TownFolk | undefined {
  const k = name.toLowerCase().replace(/[\s.]+/g, "");
  return TOWN_CAST.find((c) => c.name.toLowerCase().replace(/[\s.]+/g, "") === k);
}

// ---------- Story flows: each episode is told in a different way ----------
// A flow is not just a topic: it decides how the story is built, beat by beat. They are
// deliberately different from each other, and none of them is "something spreads through
// town and everyone copies it", so the videos don't all move the same way.

export type GossipShape = { id: string; name: string; plan: string; beats: string[] };

export const GOSSIP_SHAPES: GossipShape[] = [
  {
    id: "what-if",
    name: "What if...?",
    plan: "Mabel asks one big 'what if' about Brickbury (what if gravity took a day off, what if animals could talk, what if it rained soup, what if everyone swapped voices) and plays out the day it happens, minute by minute, through each neighbor's very different problem.",
    beats: [
      "The question, asked straight to the viewer ('What if...?').",
      "The first minute: one small, funny effect on Pip.",
      "A little later: something bigger happens to the whole street.",
      "Neighbor by neighbor: how THIS change hits each of them in a completely different way because of who they are (one beat or two each).",
      "The unexpected upside nobody thought of.",
      "Everything snaps back to normal, except for one funny thing that stays.",
    ],
  },
  {
    id: "mystery",
    name: "Whodunit",
    plan: "Something has gone missing or been ruined, and Mabel walks us through the investigation like a detective show.",
    beats: [
      "The crime: show what was there, then what's left (the empty plate, the broken thing).",
      "Who takes the case and how seriously.",
      "Suspect one: introduce them ('Suspect one.') and their shaky alibi.",
      "Suspect two, with an even worse alibi.",
      "Suspect three (often Pip), with evidence that looks bad.",
      "The clue nobody noticed.",
      "The reveal: the culprit is someone nobody suspected, for a funny or sweet reason.",
    ],
  },
  {
    id: "rewind",
    name: "How did we get here?",
    plan: "Open on a ridiculous final image with no context, then rewind and walk forward through time stamps until that image makes total sense.",
    beats: [
      "The absurd image, described plainly (someone on a roof, a cake in a tree).",
      "'Let me rewind.' Jump back several hours.",
      "Walk forward with a time stamp in every beat ('Five hours earlier,', 'Four hours earlier,'...). Each step is a small, reasonable choice that makes things a little worse.",
      "'Which brings us back to now.' The opening image, now understood.",
      "One more step nobody expected after it.",
    ],
  },
  {
    id: "plan-vs-reality",
    name: "The plan vs. what happened",
    plan: "Pip explains his perfect three-step plan, then we see each step as it really happened.",
    beats: [
      "What Pip wants and why it matters to him.",
      "'Step one:', 'Step two:', 'Step three:' of the plan, told quickly and confidently.",
      "'Here's what actually happened.'",
      "Step one for real, going sideways.",
      "Step two for real, going sideways in a new way.",
      "Step three for real.",
      "The result is the opposite of the plan, but somehow it works out (or almost).",
    ],
  },
  {
    id: "two-sides",
    name: "Two sides",
    plan: "The same day told twice: first how Pip saw it, then how the other person saw it. The second telling flips the meaning of every moment.",
    beats: [
      "Pip's version: he's sure a neighbor is up to something (angry with him, spying, plotting).",
      "Three moments from Pip's view that look bad.",
      "'Now here's what that neighbor saw.' Rewind.",
      "The same three moments from the other side, each one meaning something completely different.",
      "The two meet, and the truth is sweet or hilarious.",
    ],
  },
  {
    id: "documentary",
    name: "Nature documentary",
    plan: "Mabel narrates one neighbor like a wildlife documentary: their habitat, feeding habits, territory and rituals. Then something disturbs the habitat.",
    beats: [
      "Introduce the 'species' in documentary voice ('Here we see the rare Brickbury baker in his natural habitat.').",
      "Two or three of their strange daily habits, observed closely.",
      "An intruder enters the territory (usually Pip).",
      "The creature's dramatic reaction.",
      "A surprising new behavior nobody has ever recorded.",
    ],
  },
  {
    id: "heist",
    name: "The heist",
    plan: "Pip assembles a crew for a tiny, very important job (the last slice of pie, the front row at the fair, a hat back from the mayor).",
    beats: [
      "The target and why it's 'impossible'.",
      "Recruit the crew: one beat per member, each with one silly skill.",
      "The plan, in two quick beats.",
      "The job: each crew member's moment, with one hitch.",
      "It all goes wrong at once.",
      "An unexpected way it still works, or a twist about the target.",
    ],
  },
  {
    id: "diary",
    name: "One week",
    plan: "The story moves day by day through one week ('Monday.', 'Tuesday.'...). Each day something small changes, and by the weekend it adds up to something nobody saw coming.",
    beats: [
      "What normal looks like, and the one small thing that's different on Monday.",
      "One or two beats per day, Monday to Saturday, each opening with the day's name. Each day adds a new small detail.",
      "Sunday: everything adds up to the reveal.",
    ],
  },
  {
    id: "top-five",
    name: "Top five",
    plan: "A countdown list told as mini scenes ('The five worst things to bring to the Brickbury picnic'). Each entry is its own tiny scene with a different neighbor.",
    beats: [
      "Name the list.",
      "'Number five.' to 'Number two.': one or two beats each, each a quick scene with its own joke.",
      "'And number one.' The biggest entry, which connects the others or flips the list.",
    ],
  },
  {
    id: "training",
    name: "The training montage",
    plan: "Someone has one week to learn something they're terrible at (dancing, whistling, riding a bike, baking) for a big moment. A mentor trains them.",
    beats: [
      "The big moment coming up and how bad they are right now.",
      "They find an unlikely mentor.",
      "Training: three quick failures, each funnier than the last.",
      "One small breakthrough.",
      "The big moment, which goes wrong in one way and right in a completely unexpected way.",
    ],
  },
  {
    id: "theories",
    name: "The theories",
    plan: "Mabel asks one question about a neighbor's odd habit ('Why does Gus wear sunglasses at night?'). Different neighbors each give a wild theory, shown as if it were true. Then the real answer.",
    beats: [
      "The question, and the odd habit shown plainly.",
      "Theory one, from one neighbor, acted out as if it were real.",
      "Theory two, even wilder.",
      "Theory three, the wildest.",
      "Mabel goes and finds out. The real answer is simple and much funnier, or sweeter.",
    ],
  },
  {
    id: "new-neighbor",
    name: "The new neighbor",
    plan: "Someone new moves to Brickbury (invent them, with a name, a color and one strange habit). We meet them through Pip's attempts to say hello, each one failing differently.",
    beats: [
      "The moving truck, and the one strange thing everyone notices.",
      "Pip's first attempt to say hello, which goes wrong.",
      "Second attempt, with a different neighbor's 'help'.",
      "Third attempt, Pip's own idea.",
      "The newcomer's strange habit finally makes sense, and they become friends.",
    ],
  },
];

export function shapeById(id: string | null | undefined): GossipShape | undefined {
  return GOSSIP_SHAPES.find((s) => s.id === (id ?? "").trim().toLowerCase());
}

function shuffle<T>(arr: T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export type EpisodePlan = { shape: GossipShape; neighbors: TownFolk[] };

/**
 * Plans `count` episodes: different story shapes and different neighbors, avoiding the
 * shapes and neighbors used most recently.
 */
export function planEpisodes(count: number, recent: { shapes: string[]; neighbors: string[] } = { shapes: [], neighbors: [] }, rand: () => number = Math.random): EpisodePlan[] {
  const fresh = GOSSIP_SHAPES.filter((s) => !recent.shapes.includes(s.id));
  const shapes = [...shuffle(fresh.length >= count ? fresh : GOSSIP_SHAPES, rand)];
  const recentN = new Set(recent.neighbors.map((n) => n.toLowerCase()));
  return Array.from({ length: count }, (_, i) => {
    const shape = shapes[i % shapes.length];
    const size = 2 + Math.floor(rand() * 3); // 2 to 4 neighbors
    const preferred = shuffle(NEIGHBORS.filter((n) => !recentN.has(n.name.toLowerCase())), rand);
    const rest = shuffle(NEIGHBORS.filter((n) => recentN.has(n.name.toLowerCase())), rand);
    const neighbors = [...preferred, ...rest].slice(0, size);
    neighbors.forEach((n) => recentN.add(n.name.toLowerCase())); // spread neighbors across the pitches too
    return { shape, neighbors };
  });
}

/** Story characters for an episode: Pip first, then the neighbors, each in a fresh shirt color. */
export function episodeCast(neighborNames: string[], rand: () => number = Math.random): Character[] {
  const colors = shuffle(COLORS.filter((c) => c !== "orange"), rand) as CharColor[];
  const folks = neighborNames.map((n) => townFolk(n)).filter((f): f is TownFolk => !!f && f.name !== HERO.name);
  return [
    { name: HERO.name, color: HERO.color, accessory: HERO.accessory },
    ...folks.slice(0, 4).map((f, i) => ({ name: f.name, color: colors[i % colors.length], accessory: f.accessory })),
  ];
}
