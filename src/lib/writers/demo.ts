// Built-in demo writer. No AI at all: hand-written templates filled in with a little randomness,
// so the studio always works even with no Ollama and no Claude.
import type { Character, Pitch, Story, StoryStyle, Theme } from "../story";

function rng(seedText: string) {
  let h = 2166136261;
  for (const ch of seedText) h = Math.imul(h ^ ch.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    h ^= h >>> 16;
    return (h >>> 0) / 4294967296;
  };
}
const pick = <T,>(r: () => number, arr: readonly T[]): T => arr[Math.floor(r() * arr.length)];

// ---------------- Hook worlds ----------------

type HookWorld = {
  title: string;
  genre: string;
  rule: string; // first line
  thing: string; // "star mark"
  ranks: [string, string, string];
  scale: string; // "Most kids glow one star. The best get three."
  hero: string; // name
  rival: string;
  mentor: string;
  bigDay: string;
  rivalResult: string;
  heroResult: string;
  reaction: string;
  cliff: string;
};

const HOOK_WORLDS: HookWorld[] = [
  {
    title: "The Hundred Star Mark",
    genre: "fantasy",
    rule: "Everyone in my world gets their star mark at twelve.",
    thing: "star mark",
    ranks: ["One star means you farm.", "Three stars means you guard the city.", "Five stars means you rule."],
    scale: "Nobody has seen more than five in a hundred years.",
    hero: "Milo",
    rival: "Rex",
    mentor: "Queen Ada",
    bigDay: "Today the whole kingdom watched us at the palace.",
    rivalResult: "Rex lit up five stars and the crowd went wild.",
    heroResult: "Then my hand lit up. One hundred stars.",
    reaction: "The queen dropped her crown.",
    cliff: "And the old sky gate above the palace opened.",
  },
  {
    title: "The Silent Dragon Bond",
    genre: "adventure",
    rule: "In my village, a dragon chooses you on your tenth birthday.",
    thing: "dragon bond",
    ranks: ["Small dragons pick the cooks.", "Big dragons pick the knights.", "Golden dragons pick the heroes."],
    scale: "A golden dragon hasn't come down in fifty years.",
    hero: "Nia",
    rival: "Bram",
    mentor: "Elder Sol",
    bigDay: "Today every ten year old stood in the great arena.",
    rivalResult: "A huge red dragon landed beside Bram.",
    heroResult: "Then the sky went dark. Every dragon bowed to me.",
    reaction: "Even Bram's dragon knelt down.",
    cliff: "Then a voice in my head said, finally, the queen returns.",
  },
  {
    title: "Zero Color Kid",
    genre: "fantasy",
    rule: "Everyone in my city is born with a magic color.",
    thing: "magic color",
    ranks: ["Blue can make rain.", "Red can make fire.", "Gold can bend the sun."],
    scale: "Most people get one color. Legends get two.",
    hero: "Kai",
    rival: "Vera",
    mentor: "Master Oak",
    bigDay: "At sixteen we all show our color in the arena.",
    rivalResult: "Vera showed red and gold. Two colors.",
    heroResult: "I showed every color at once.",
    reaction: "The judges ran from their seats.",
    cliff: "And the sun above us blinked out.",
  },
];

function hookStory(world: HookWorld, r: () => number): Story {
  const heroColor = pick(r, ["teal", "blue", "green", "purple"] as const);
  const rivalColor = pick(r, ["red", "orange", "pink"] as const);
  const characters: Character[] = [
    { name: world.hero, color: heroColor, accessory: pick(r, ["none", "scarf", "glasses"] as const) },
    { name: world.rival, color: rivalColor, accessory: "hat" },
    { name: world.mentor, color: "yellow", accessory: "crown" },
  ];
  const home = pick(r, ["city", "forest", "classroom"] as const);
  const big = pick(r, ["palace", "arena"] as const);
  const beats: Story["beats"] = [
    { setting: big, time: "day", narration: world.rule, cast: [{ who: 0, mood: "thinking", action: "idle" }] },
    { setting: home, time: "day", narration: world.ranks[0], cast: [{ who: 0, mood: "happy", action: "walk" }] },
    { setting: home, time: "sunset", narration: world.ranks[1], cast: [{ who: 1, mood: "excited", action: "jump" }] },
    { setting: big, time: "sunset", narration: world.ranks[2], cast: [{ who: 2, mood: "happy", action: "idle" }] },
    { setting: home, time: "night", narration: world.scale, cast: [{ who: 0, mood: "thinking", action: "idle" }] },
    {
      setting: "classroom",
      time: "day",
      narration: `Everyone said I would be the weakest one.`,
      cast: [
        { who: 0, mood: "sad", action: "idle" },
        { who: 1, mood: "happy", action: "shake" },
      ],
      speaker: 1,
      line: "You? You'll get nothing.",
    },
    { setting: "bedroom", time: "night", narration: "I practiced alone every single night.", cast: [{ who: 0, mood: "angry", action: "jump" }] },
    { setting: big, time: "day", narration: world.bigDay, cast: [{ who: 0, mood: "scared", action: "enter" }, { who: 1, mood: "excited", action: "idle" }] },
    { setting: big, time: "day", narration: world.rivalResult, cast: [{ who: 1, mood: "excited", action: "jump" }] },
    { setting: big, time: "day", narration: "Then it was my turn.", cast: [{ who: 0, mood: "scared", action: "walk" }] },
    { setting: big, time: "sunset", narration: "Nothing happened for three long seconds.", cast: [{ who: 0, mood: "thinking", action: "idle" }, { who: 1, mood: "happy", action: "idle" }] },
    { setting: big, time: "night", narration: world.heroResult, cast: [{ who: 0, mood: "surprised", action: "jump" }] },
    {
      setting: big,
      time: "night",
      narration: world.reaction,
      cast: [
        { who: 2, mood: "surprised", action: "shake" },
        { who: 1, mood: "scared", action: "shake" },
      ],
      speaker: 2,
      line: "That's impossible!",
    },
    { setting: big, time: "night", narration: `Nobody laughed at me anymore.`, cast: [{ who: 0, mood: "excited", action: "idle" }, { who: 1, mood: "scared", action: "idle" }] },
    { setting: big, time: "night", narration: world.cliff, cast: [{ who: 0, mood: "surprised", action: "idle" }] },
  ];
  return {
    title: world.title,
    logline: `${world.hero} was told they'd get the weakest ${world.thing}. They got the strongest one ever.`,
    characters,
    beats,
    caption: `Everyone laughed at ${world.hero}. Then the ${world.thing} ceremony happened. Part 2?`,
    hashtags: ["animation", "story", "underdog", "fantasy", "shorts", "part2"],
  };
}

// ---------------- Cozy tales ----------------

type CozyTale = { title: string; genre: string; logline: string; twist: string; build: (r: () => number) => Story };

const COZY_TALES: CozyTale[] = [
  {
    title: "The Snail Who Raced",
    genre: "comedy",
    logline: "A tiny snail enters the forest's big race and finds a surprising shortcut.",
    twist: "The shortcut is riding on the winner's hat.",
    build: (r) => ({
      title: "The Snail Who Raced",
      logline: "A tiny snail enters the forest's big race and finds a surprising shortcut.",
      characters: [
        { name: "Pebble", color: pick(r, ["green", "teal"] as const), accessory: "bow" },
        { name: "Dash", color: "orange", accessory: "hat" },
      ],
      beats: [
        { setting: "forest", time: "day", narration: "In the sunny forest, everyone was getting ready for the Great Race.", cast: [{ who: 1, mood: "excited", action: "jump" }] },
        { setting: "forest", time: "day", narration: "Pebble the snail wanted to race too. Everyone giggled.", cast: [{ who: 0, mood: "happy", action: "enter" }, { who: 1, mood: "happy", action: "shake" }], speaker: 1, line: "You'll finish next Tuesday!" },
        { setting: "forest", time: "day", narration: "The race began. Dash zoomed off like a rocket.", cast: [{ who: 1, mood: "excited", action: "walk" }] },
        { setting: "forest", time: "sunset", narration: "Pebble was far behind, but she had an idea.", cast: [{ who: 0, mood: "thinking", action: "idle" }] },
        { setting: "forest", time: "sunset", narration: "When Dash stopped to nap, Pebble climbed onto his hat.", cast: [{ who: 1, mood: "happy", action: "idle" }, { who: 0, mood: "excited", action: "jump" }] },
        { setting: "beach", time: "sunset", narration: "Dash woke up and dashed all the way to the finish line.", cast: [{ who: 1, mood: "excited", action: "walk" }] },
        { setting: "beach", time: "sunset", narration: "Right at the end, Pebble slid down first.", cast: [{ who: 0, mood: "excited", action: "jump" }, { who: 1, mood: "surprised", action: "shake" }], speaker: 0, line: "Thanks for the ride!" },
        { setting: "beach", time: "night", narration: "Now they race together every Saturday. Pebble always rides up top.", cast: [{ who: 0, mood: "happy", action: "idle" }, { who: 1, mood: "happy", action: "idle" }] },
      ],
      caption: "Slow and steady... and very clever. 🐌",
      hashtags: ["cozy", "animation", "funny", "friendship", "shorts"],
    }),
  },
  {
    title: "Moon Cafe",
    genre: "heartwarming",
    logline: "A lonely robot opens a cafe on the moon and waits for a single customer.",
    twist: "The first customer is a shooting star who orders hot cocoa.",
    build: () => ({
      title: "Moon Cafe",
      logline: "A lonely robot opens a cafe on the moon and waits for a single customer.",
      characters: [
        { name: "Bolt", color: "blue", accessory: "glasses" },
        { name: "Twinkle", color: "yellow", accessory: "scarf" },
      ],
      beats: [
        { setting: "space", time: "night", narration: "Bolt built a tiny cafe on the moon.", cast: [{ who: 0, mood: "happy", action: "enter" }] },
        { setting: "cafe", time: "night", narration: "He baked cookies every day. But nobody came.", cast: [{ who: 0, mood: "sad", action: "idle" }] },
        { setting: "cafe", time: "night", narration: "One night, something bright crashed through the window.", cast: [{ who: 0, mood: "surprised", action: "shake" }, { who: 1, mood: "scared", action: "enter" }] },
        { setting: "cafe", time: "night", narration: "It was a tired little shooting star.", cast: [{ who: 1, mood: "sad", action: "idle" }], speaker: 1, line: "Do you have hot cocoa?" },
        { setting: "cafe", time: "night", narration: "Bolt made the best cocoa in the whole galaxy.", cast: [{ who: 0, mood: "excited", action: "jump" }, { who: 1, mood: "happy", action: "idle" }] },
        { setting: "space", time: "night", narration: "Twinkle told every star in the sky. Now the cafe is always full.", cast: [{ who: 0, mood: "happy", action: "idle" }, { who: 1, mood: "excited", action: "jump" }] },
      ],
      caption: "Every cafe needs its first customer. ☕✨",
      hashtags: ["cozy", "space", "animation", "wholesome", "shorts"],
    }),
  },
];

// ---------------- Public demo API ----------------

export function demoThemes(): Theme[] {
  return [
    { theme: "The kid everyone underestimated", why: "Underdog reveals are the most rewatched story shape on short video." },
    { theme: "A ceremony that decides your future", why: "Clear rules and big public moments make instant hooks." },
    { theme: "Tiny creatures with big dreams", why: "Cute heroes and gentle humor do well in cozy story feeds." },
  ];
}

export function demoPitches(style: StoryStyle, usedTitles: string[]): Pitch[] {
  const used = new Set(usedTitles.map((t) => t.toLowerCase()));
  const all: Pitch[] =
    style === "hook"
      ? HOOK_WORLDS.map((w) => ({
          title: w.title,
          logline: `${w.hero} is told they'll get the weakest ${w.thing}, but the ceremony proves everyone wrong.`,
          genre: w.genre,
          twist: w.heroResult,
        }))
      : COZY_TALES.map((t) => ({ title: t.title, logline: t.logline, genre: t.genre, twist: t.twist }));
  const fresh = all.filter((p) => !used.has(p.title.toLowerCase()));
  // When every template has been used, number the titles so they stay unique.
  if (fresh.length) return fresh;
  const n = usedTitles.length + 1;
  return all.map((p) => ({ ...p, title: `${p.title} ${n}` }));
}

export function demoStory(pitch: Pitch, style: StoryStyle): Story {
  const r = rng(pitch.title);
  const base = pitch.title.replace(/\s+\d+$/, "").toLowerCase();
  if (style === "hook") {
    const world = HOOK_WORLDS.find((w) => w.title.toLowerCase() === base) ?? pick(r, HOOK_WORLDS);
    const s = hookStory(world, r);
    return { ...s, title: pitch.title.slice(0, 80) };
  }
  const tale = COZY_TALES.find((t) => t.title.toLowerCase() === base) ?? pick(r, COZY_TALES);
  const s = tale.build(r);
  return { ...s, title: pitch.title.slice(0, 80) };
}
