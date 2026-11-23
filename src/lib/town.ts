// Brickbury: the home town of every Town Gossip video.
// Pip is the one face in every episode. The neighbors around him rotate from a big pool,
// their clothes change color from episode to episode, and each episode gets a different
// story shape, so the videos don't all feel the same.
// Shared by the writers and the renderer, so keep it free of Node-only imports.
import type { CharColor, Character } from "./story";
import { COLORS } from "./story";

export const TOWN = {
  name: "Brickbury",
  // A made-up video app, so stories never name a real one.
  app: "Bloop",
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
  handle: string; // their @name on the app
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
  handle: "pip.official",
  skin: "#f2c79b",
  pants: "#3d5a99",
  hair: "#5a3a22",
  outfit: "cap",
  fixedShirt: "#ff8a2a",
};

/** Neighbors. Each episode uses 2 to 4 of them. */
export const NEIGHBORS: TownFolk[] = [
  { name: "Nana Pearl", color: "purple", accessory: "glasses", role: "Pip's grandma: sweet, knits, secretly very competitive", handle: "nana.pearl", skin: "#f0c8a8", pants: "#6d5a8a", hair: "#eeeeee", outfit: "bun" },
  { name: "Mayor Bigsby", color: "red", accessory: "scarf", role: "the mayor: loud, loves a ribbon cutting, jumps on every trend", handle: "mayor.bigsby", skin: "#e8b48c", pants: "#333a4a", hair: "#9a9a9a", outfit: "mayor" },
  { name: "Zoe", color: "teal", accessory: "bow", role: "the teenager next door: always filming, knows what's cool", handle: "zoe.zoomz", skin: "#c98f62", pants: "#2b2b3a", hair: "#2a1a12", outfit: "ponytail" },
  { name: "Chef Mo", color: "yellow", accessory: "hat", role: "the baker: big, gentle, turns everything into a pastry", handle: "chef.mo", skin: "#a8714a", pants: "#4a4a4a", hair: "#1a1a1a", outfit: "chef", fixedShirt: "#ffffff" },
  { name: "Officer Dot", color: "blue", accessory: "hat", role: "the town's only police officer: takes tiny problems very seriously", handle: "officer.dot", skin: "#d9a27a", pants: "#1f2a44", hair: "#3a2a1a", outfit: "police" },
  { name: "Mr. Fenn", color: "blue", accessory: "none", role: "the mail carrier: knows everyone's business, terrible at keeping secrets", handle: "fenn.delivers", skin: "#f2d0b0", pants: "#3a4a6a", hair: "#c9a060", outfit: "beanie" },
  { name: "Coach Rhonda", color: "red", accessory: "none", role: "the gym coach: turns everything into a competition, has a whistle", handle: "coach.rhonda", skin: "#8a5a3c", pants: "#2a2a2a", hair: "#1a1a1a", outfit: "headband" },
  { name: "Bolt", color: "green", accessory: "glasses", role: "Pip's best friend: a kid inventor whose gadgets almost work", handle: "bolt.builds", skin: "#c98f62", pants: "#4a3a2a", hair: "#2a1a12", outfit: "goggles" },
  { name: "Lulu", color: "pink", accessory: "bow", role: "Pip's little sister, 6: says exactly what everyone is thinking", handle: "lulu", skin: "#f2c79b", pants: "#a05a8a", hair: "#5a3a22", outfit: "pigtails" },
  { name: "Gus", color: "green", accessory: "none", role: "the grumpy old gardener next door: hates noise, secretly soft", handle: "gus.grows", skin: "#e8b48c", pants: "#5a4a3a", hair: "#bbbbbb", outfit: "bald" },
  { name: "Mrs. Plum", color: "purple", accessory: "none", role: "runs the hair salon: the town's fastest gossip", handle: "plum.salon", skin: "#b07850", pants: "#4a2a4a", hair: "#7a2a5a", outfit: "curly" },
  { name: "Ms. Kettle", color: "yellow", accessory: "glasses", role: "Pip's teacher: calm, tired, has seen everything", handle: "ms.kettle", skin: "#f0c8a8", pants: "#3a3a4a", hair: "#8a5a2a", outfit: "bun" },
];

export const TOWN_CAST: TownFolk[] = [HERO, ...NEIGHBORS];

/** The town character with this name, if any (case, dots and spaces ignored). */
export function townFolk(name: string): TownFolk | undefined {
  const k = name.toLowerCase().replace(/[\s.]+/g, "");
  return TOWN_CAST.find((c) => c.name.toLowerCase().replace(/[\s.]+/g, "") === k);
}

// ---------- Story shapes: each episode gets a different kind of story ----------

export type GossipShape = { id: string; name: string; plan: string; screens: boolean };

export const GOSSIP_SHAPES: GossipShape[] = [
  { id: "viral", name: "It went viral", plan: "Something small Pip does gets posted and blows up, the neighbors pile on with their own versions, it escalates, and Pip ends up left out of his own trend.", screens: true },
  { id: "rumor", name: "The rumor", plan: "Someone half-hears something Pip said. It changes a little every time it's passed on, until the whole town believes something absurd. The truth comes out in a way that makes it worse, or better.", screens: false },
  { id: "new-rule", name: "The new rule", plan: "The mayor (or someone in charge) makes a well-meant new rule because of something Pip did. Everyone follows it way too hard, chaos follows, and the rule gets undone in an ironic way.", screens: false },
  { id: "contest", name: "The contest", plan: "A town contest (bake-off, pet show, science fair, garden prize, talent night). Everyone takes it far too seriously, sabotage and alliances happen, and the winner is the one nobody expected.", screens: false },
  { id: "lost", name: "The lost thing", plan: "Pip loses something that matters. The whole town joins the search and each neighbor's 'help' makes it bigger and sillier. It was somewhere ridiculous the whole time.", screens: false },
  { id: "gadget", name: "The gadget", plan: "Someone gets a new gadget or invention that promises to make life easier. It slowly takes over the town in funny ways, until one tiny thing breaks it.", screens: false },
  { id: "secret", name: "The secret", plan: "Pip is trusted with a secret (a surprise party, a gift, a hidden talent). Keeping it gets harder and harder as neighbors get close. It comes out at the worst moment, and the ending is warm.", screens: false },
  { id: "challenge", name: "The challenge", plan: "A silly challenge starts as a dare and spreads through town, getting harder each time someone tries it, until the least likely person tops everyone.", screens: true },
  { id: "job-swap", name: "Job for a day", plan: "Pip takes over a neighbor's job for one day (mail route, bakery, salon, police desk). Every task goes sideways in a new way, but he accidentally fixes something nobody else could.", screens: false },
  { id: "new-neighbor", name: "The new neighbor", plan: "Someone new moves to Brickbury (invent them, with a name, a color and one strange habit). The town guesses wild things about them. The real reason for the habit is sweet or funny.", screens: false },
  { id: "prank", name: "The prank", plan: "Pip plans a harmless prank on a neighbor. Every step goes wrong, it snowballs across town, and the prank ends up landing on Pip himself.", screens: false },
  { id: "power-out", name: "Everything stops", plan: "Something everyone depends on stops working for a day (power, phones, the town clock, the bridge). Everyone copes in their own odd way and the town is better for it, until it comes back.", screens: false },
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

/** "12M" -> 12000000. Returns 0 when it can't read it. */
export function parseCount(s: string | null | undefined): number {
  if (!s) return 0;
  const m = /([\d.,]+)\s*([kmb])?/i.exec(s);
  if (!m) return 0;
  const n = parseFloat(m[1].replace(/,/g, ""));
  const mult = { k: 1e3, m: 1e6, b: 1e9 }[(m[2] ?? "").toLowerCase() as "k" | "m" | "b"] ?? 1;
  return Math.round(n * mult);
}

/** 12000000 -> "12M", 1530 -> "1.5K". */
export function formatCount(n: number): string {
  const f = (v: number, u: string) => `${v >= 100 ? Math.round(v) : Math.round(v * 10) / 10}${u}`;
  if (n >= 1e9) return f(n / 1e9, "B");
  if (n >= 1e6) return f(n / 1e6, "M");
  if (n >= 1e3) return f(n / 1e3, "K");
  return String(Math.round(n));
}
