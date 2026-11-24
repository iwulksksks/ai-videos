// Built-in demo writer. No AI at all: hand-written templates filled in with a little randomness,
// so the studio always works even with no Ollama and no Claude.
import type { Character, Pitch, ScoutInsights, Story, StoryStyle, Theme } from "../story";
import { episodeCast } from "../town";

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

// ---------------- Twist Tales (real mechanisms, original stories) ----------------

type TwistTale = { pitch: Pitch; build: (r: () => number) => Story };

type B = Story["beats"][number];
const beat = (setting: B["setting"], time: B["time"], narration: string, cast: B["cast"], extra: Partial<B> = {}): B => ({
  setting,
  time,
  narration,
  cast,
  speaker: null,
  line: null,
  prop: null,
  sfx: null,
  ...extra,
});

const TWIST_TALES: TwistTale[] = [
  {
    pitch: {
      title: "Why She Poured Water on the Sand",
      logline: "A girl wastes precious water on the sand in front of a giant stone, and the whole work camp laughs.",
      genre: "history",
      twist: "The wet sand lets a handful of people pull what fifty could not.",
      mechanism:
        "Damp sand is stiffer than dry sand because tiny water bridges hold the grains together, so a sled stops ploughing a pile of sand in front of it and needs about half the pulling force.",
      era: "An ancient desert quarry",
      skeptic: "The foreman, Bram",
    },
    build: (r) => ({
      title: "Why She Poured Water on the Sand",
      logline: "A girl wastes precious water on the sand in front of a giant stone, and the whole work camp laughs.",
      mechanism:
        "Damp sand is stiffer than dry sand because tiny water bridges hold the grains together, so a sled stops ploughing a pile of sand in front of it and needs about half the pulling force.",
      characters: [
        { name: "Tali", color: pick(r, ["teal", "green", "blue"] as const), accessory: "scarf" },
        { name: "Bram", color: "red", accessory: "hat" },
      ],
      beats: [
        beat("canyon", "day", "She poured a whole jar of water onto the sand.", [{ who: 0, mood: "thinking", action: "idle" }]),
        beat("canyon", "day", "You see, water was the most precious thing in the desert.", [{ who: 0, mood: "happy", action: "walk" }]),
        beat("canyon", "day", "And the king wanted a stone the size of a house moved by summer.", [{ who: 1, mood: "angry", action: "idle" }]),
        beat("canyon", "day", "Fifty men pulled it on a wooden sled. It barely moved.", [{ who: 1, mood: "angry", action: "shake" }], { prop: "rope" }),
        beat("canyon", "sunset", "So every morning, Tali walked ahead of the sled and wet the sand.", [{ who: 0, mood: "happy", action: "walk" }]),
        beat("canyon", "sunset", "The workers laughed until they cried.", [{ who: 1, mood: "excited", action: "jump" }, { who: 0, mood: "sad", action: "idle" }], { speaker: 1, line: "She's watering the desert!" }),
        beat("market", "day", "Bram, the foreman, had a better plan.", [{ who: 1, mood: "happy", action: "enter" }]),
        beat("market", "day", "More men. More rope. More shouting.", [{ who: 1, mood: "excited", action: "shake" }]),
        beat("canyon", "day", "He banned her from the work site.", [{ who: 1, mood: "angry", action: "idle" }, { who: 0, mood: "sad", action: "walk" }]),
        beat("canyon", "day", "With a hundred men, the stone crawled forward.", [{ who: 1, mood: "happy", action: "idle" }]),
        beat("canyon", "sunset", "But every day, the pile of sand in front of the sled grew taller.", [{ who: 1, mood: "thinking", action: "idle" }]),
        beat("canyon", "sunset", "The sled dug in like a shovel.", [{ who: 1, mood: "scared", action: "shake" }]),
        beat("canyon", "day", "Then the ropes snapped.", [{ who: 1, mood: "surprised", action: "jump" }], { sfx: "snap" }),
        beat("canyon", "day", "The stone slid back and buried the sled.", [{ who: 1, mood: "scared", action: "shake" }], { sfx: "crash" }),
        beat("canyon", "day", "That night, Tali brought her water jar back.", [{ who: 0, mood: "thinking", action: "enter" }]),
        beat("canyon", "night", "She wet a strip of sand, just enough to darken it.", [{ who: 0, mood: "happy", action: "idle" }], { prop: "jar" }),
        beat("canyon", "day", "In the morning, twenty people pulled. The stone glided.", [{ who: 0, mood: "excited", action: "walk" }, { who: 1, mood: "surprised", action: "idle" }]),
        beat("canyon", "day", "Here's why. Dry sand grains roll apart and pile up in front of the sled.", [{ who: 0, mood: "happy", action: "idle" }], { prop: "wheel" }),
        beat("canyon", "day", "A little water makes tiny bridges between the grains, so the sand turns firm.", [{ who: 0, mood: "thinking", action: "idle" }], { prop: "jar" }),
        beat("canyon", "sunset", "Firm sand doesn't pile up, so pulling takes about half the force.", [{ who: 0, mood: "happy", action: "idle" }, { who: 1, mood: "sad", action: "idle" }]),
        beat("canyon", "sunset", "Bram never laughed at a jar of water again.", [{ who: 1, mood: "sad", action: "idle" }, { who: 0, mood: "excited", action: "jump" }]),
      ],
      caption: "Why She Poured Water on the Sand",
      hashtags: [],
    }),
  },
  {
    pitch: {
      title: "How a Boy Made Ice in the Desert",
      logline: "A boy digs shallow pools in the desert to make ice, and the whole town laughs at him.",
      genre: "science",
      twist: "On a clear night his pools freeze while the air is still above freezing.",
      mechanism:
        "On clear, dry nights water loses heat by radiating it straight up to the cold sky, so very shallow water shaded from the wind can freeze even when the air is a few degrees above freezing.",
      era: "An old desert town",
      skeptic: "Mirza the ice merchant",
    },
    build: () => ({
      title: "How a Boy Made Ice in the Desert",
      logline: "A boy digs shallow pools in the desert to make ice, and the whole town laughs at him.",
      mechanism:
        "On clear, dry nights water loses heat by radiating it straight up to the cold sky, so very shallow water shaded from the wind can freeze even when the air is a few degrees above freezing.",
      characters: [
        { name: "Navi", color: "orange", accessory: "none" },
        { name: "Mirza", color: "purple", accessory: "crown" },
      ],
      beats: [
        beat("canyon", "night", "He was digging puddles in the desert at midnight.", [{ who: 0, mood: "thinking", action: "idle" }]),
        beat("market", "day", "You see, the town was so hot that ice cost more than silver.", [{ who: 1, mood: "happy", action: "idle" }]),
        beat("market", "day", "Mirza sold it, carried down from the mountains on camels.", [{ who: 1, mood: "excited", action: "jump" }]),
        beat("market", "sunset", "Half of it melted on the way, so he doubled the price.", [{ who: 1, mood: "happy", action: "idle" }]),
        beat("canyon", "sunset", "Navi said he would make ice right here.", [{ who: 0, mood: "excited", action: "jump" }]),
        beat("market", "day", "The whole market laughed.", [{ who: 1, mood: "excited", action: "shake" }, { who: 0, mood: "sad", action: "idle" }], { speaker: 1, line: "Ice? In a desert? Go home." }),
        beat("canyon", "sunset", "Navi built a tall mud wall, facing the sun.", [{ who: 0, mood: "happy", action: "walk" }]),
        beat("canyon", "night", "Behind it, he filled long pools, only a finger deep.", [{ who: 0, mood: "thinking", action: "idle" }], { prop: "jar" }),
        beat("canyon", "night", "The first night, nothing.", [{ who: 0, mood: "sad", action: "idle" }]),
        beat("market", "day", "Mirza bought more camels.", [{ who: 1, mood: "excited", action: "walk" }]),
        beat("canyon", "night", "The second night, the water felt colder.", [{ who: 0, mood: "surprised", action: "idle" }]),
        beat("canyon", "night", "The third night, the sky was clear, dry and full of stars.", [{ who: 0, mood: "thinking", action: "idle" }], { sfx: "whoosh" }),
        beat("canyon", "day", "At dawn, his pools had a skin of ice.", [{ who: 0, mood: "excited", action: "jump" }], { sfx: "ding" }),
        beat("market", "day", "That week, Mirza's camels arrived carrying buckets of water.", [{ who: 1, mood: "scared", action: "shake" }], { sfx: "crash" }),
        beat("market", "day", "Navi was selling ice for the price of bread.", [{ who: 0, mood: "happy", action: "idle" }, { who: 1, mood: "surprised", action: "idle" }]),
        beat("canyon", "night", "Here's the trick. Everything warm glows invisible heat.", [{ who: 0, mood: "happy", action: "idle" }]),
        beat("canyon", "night", "On a clear, dry night, water sends that heat straight up into the freezing sky.", [{ who: 0, mood: "thinking", action: "idle" }]),
        beat("canyon", "night", "Shallow water loses heat faster than the air can warm it back.", [{ who: 0, mood: "thinking", action: "idle" }], { prop: "jar" }),
        beat("canyon", "sunset", "The wall blocks the sun and the warm wind, so it freezes above zero.", [{ who: 0, mood: "happy", action: "idle" }]),
        beat("market", "day", "Mirza still sells ice. He buys it from Navi.", [{ who: 1, mood: "sad", action: "idle" }, { who: 0, mood: "excited", action: "jump" }]),
      ],
      caption: "How a Boy Made Ice in the Desert",
      hashtags: [],
    }),
  },
];


// ---------------- Town Gossip (Brickbury episodes) ----------------
// Each demo episode is a different story shape with a different set of neighbors.

type GossipEpisode = { pitch: Pitch; build: () => Story };
const on = (who: number, mood: B["cast"][number]["mood"], action: B["cast"][number]["action"] = "idle") => ({ who, mood, action });
const cast = (seed: string, ...names: string[]) => episodeCast(names, rng(seed));

const headline = (narration: string, cast: B["cast"]) => beat("town", "day", narration, cast, { card: "headline", sfx: "ding" });
const correction = (narration: string, cast: B["cast"]) => beat("town", "night", narration, cast, { card: "correction", sfx: "crash" });

const GOSSIP_EPISODES: GossipEpisode[] = [
  {
    // Flow: what if...?
    pitch: {
      title: "What If Brickbury Lost Gravity?",
      logline: "Mabel imagines the day gravity takes a break in Brickbury, minute by minute.",
      genre: "comedy",
      twist: "Gravity never actually left, but Mrs. Plum sells the floating haircut anyway.",
      era: "what-if",
      skeptic: "Chef Mo, Coach Rhonda, Mrs. Plum",
    },
    build: () => {
      const [PIP, MO, RHONDA, PLUM] = [0, 1, 2, 3];
      return {
        title: "What If Brickbury Lost Gravity?",
        logline: "Mabel imagines the day gravity takes a break in Brickbury, minute by minute.",
        mechanism: null,
        characters: cast("gravity", "Chef Mo", "Coach Rhonda", "Mrs. Plum"),
        beats: [
          headline("Gravity Takes Day Off. Town Floats Away.", [on(PIP, "surprised"), on(PLUM, "surprised")]),
          beat("town", "day", "What if Brickbury lost its gravity? For one whole day?", [on(PIP, "thinking")]),
          beat("bedroom", "day", "Minute one. Pip's cereal floats right off the spoon.", [on(PIP, "surprised", "jump")], { sfx: "whoosh" }),
          beat("town", "day", "Minute five. Every hat in town drifts away.", [on(PIP, "excited", "jump")]),
          beat("cafe", "day", "Chef Mo? Worst morning of his life.", [on(MO, "scared", "jump")]),
          beat("cafe", "day", "Flour everywhere. A permanent indoor snowstorm.", [on(MO, "scared", "shake")], { sfx: "whoosh" }),
          beat("classroom", "day", "Coach Rhonda? Best morning of hers.", [on(RHONDA, "excited", "jump")]),
          beat("classroom", "day", "Everyone can do a backflip. Nobody can land.", [on(RHONDA, "excited", "jump"), on(PIP, "scared", "jump")], { speaker: RHONDA, line: "Ten more laps. Up!" }),
          beat("market", "day", "At Mrs. Plum's salon, every haircut comes out perfectly round.", [on(PLUM, "thinking", "jump")]),
          beat("market", "day", "She'd call it a trend. And charge double.", [on(PLUM, "excited")], { speaker: PLUM, line: "It's called the Cloud." }),
          beat("town", "sunset", "By lunch, half the town is tied to lamp posts.", [on(PIP, "scared", "jump")]),
          beat("town", "sunset", "Me included. Pigeons need gravity too, honey.", [on(PIP, "thinking")]),
          beat("town", "sunset", "But then Pip floats past the clock tower.", [on(PIP, "excited", "jump")]),
          beat("town", "sunset", "And sees the whole town at once, for the first time.", [on(PIP, "happy", "jump")], { sfx: "ding" }),
          beat("town", "night", "Then gravity comes back. All at once.", [on(PIP, "scared", "shake")], { sfx: "crash" }),
          beat("plaza", "night", "Every hat in Brickbury lands on the wrong head.", [on(MO, "surprised"), on(RHONDA, "surprised"), on(PLUM, "surprised")]),
          correction("Correction: Gravity did not leave. Mrs. Plum is selling Cloud haircuts anyway.", [on(PLUM, "excited"), on(PIP, "happy")]),
        ],
        caption: "the hats are still being returned",
        hashtags: ["brickbury", "whatIf", "townGossip", "papercraft"],
      };
    },
  },
  {
    // Flow: whodunit
    pitch: {
      title: "Who Ate the Mayor's Cake?",
      logline: "The mayor's prize cake vanishes and Officer Dot interrogates three suspects, including Pip.",
      genre: "mystery comedy",
      twist: "The culprit is Mabel, the narrator.",
      era: "mystery",
      skeptic: "Mayor Bigsby, Officer Dot, Chef Mo, Nana Pearl",
    },
    build: () => {
      const [PIP, MAYOR, DOT, MO, NANA] = [0, 1, 2, 3, 4];
      return {
        title: "Who Ate the Mayor's Cake?",
        logline: "The mayor's prize cake vanishes and Officer Dot interrogates three suspects, including Pip.",
        mechanism: null,
        characters: cast("cake", "Mayor Bigsby", "Officer Dot", "Chef Mo", "Nana Pearl"),
        beats: [
          headline("Mayor's Prize Cake Vanishes. Town in Shock.", [on(MAYOR, "scared")]),
          beat("plaza", "day", "This morning, the mayor's prize cake sat right here.", [on(MAYOR, "happy")]),
          beat("plaza", "day", "By lunch? A plate and some crumbs.", [on(MAYOR, "scared", "shake")], { sfx: "crash" }),
          beat("plaza", "day", "Officer Dot took the case. Very seriously.", [on(DOT, "angry", "enter")], { speaker: DOT, line: "Nobody leaves town." }),
          beat("cafe", "day", "Suspect one. Chef Mo, who baked it.", [on(MO, "surprised")]),
          beat("cafe", "day", "His alibi? Baking a second cake. Suspicious.", [on(MO, "scared", "shake")], { speaker: MO, line: "I bake when I'm nervous!" }),
          beat("bedroom", "day", "Suspect two. Nana Pearl, famous cake lover.", [on(NANA, "thinking")]),
          beat("bedroom", "day", "She was knitting a cake cozy. For which cake, Nana?", [on(NANA, "surprised")]),
          beat("town", "day", "Suspect three. Pip. Frosting on his sleeve.", [on(PIP, "scared", "shake"), on(DOT, "angry")]),
          beat("town", "day", "He said it was toothpaste. Nobody believed him.", [on(PIP, "sad")], { speaker: PIP, line: "It's minty!" }),
          beat("plaza", "sunset", "Then Dot found the real clue.", [on(DOT, "thinking")], { sfx: "ding" }),
          beat("plaza", "sunset", "Tiny footprints in the frosting. Three toes each.", [on(DOT, "surprised")]),
          beat("plaza", "sunset", "Everyone slowly looked up. At my roof.", [on(PIP, "surprised"), on(MO, "surprised"), on(NANA, "surprised")]),
          beat("plaza", "sunset", "Okay. Fine. I had a bite.", [on(MAYOR, "angry")]),
          beat("plaza", "night", "A big bite. The whole cake, technically.", [on(MAYOR, "angry", "shake"), on(PIP, "happy")]),
          correction("Correction: Pip did not eat the cake. Our reporter did. She regrets nothing.", [on(PIP, "happy"), on(MAYOR, "angry")]),
        ],
        caption: "the case is closed. the beak is full.",
        hashtags: ["brickbury", "townGossip", "papercraft", "animation"],
      };
    },
  },
  {
    // Flow: rewind
    pitch: {
      title: "Why Is Gus on the Roof?",
      logline: "Grumpy Gus ends up on his roof in pajamas, and Mabel rewinds the day hour by hour to explain.",
      genre: "comedy",
      twist: "Gus isn't stuck: he discovered kites and refuses to come down.",
      era: "rewind",
      skeptic: "Gus, Bolt, Lulu",
    },
    build: () => {
      const [PIP, GUS, BOLT, LULU] = [0, 1, 2, 3];
      return {
        title: "Why Is Gus on the Roof?",
        logline: "Grumpy Gus ends up on his roof in pajamas, and Mabel rewinds the day hour by hour to explain.",
        mechanism: null,
        characters: cast("roof", "Gus", "Bolt", "Lulu"),
        beats: [
          headline("Grumpy Gardener on Roof, Refuses to Explain", [on(GUS, "angry")]),
          beat("town", "sunset", "So Gus is on his roof. In pajamas. Holding a hose.", [on(GUS, "angry", "shake")]),
          beat("town", "sunset", "How did we get here? Let me rewind.", [on(PIP, "thinking")], { sfx: "whoosh" }),
          beat("bedroom", "day", "Six hours earlier, Lulu's kite got stuck.", [on(LULU, "sad", "shake")], { speaker: LULU, line: "It's in Gus's yard!" }),
          beat("town", "day", "Five hours earlier, Pip asked Gus nicely.", [on(PIP, "happy"), on(GUS, "angry")], { speaker: GUS, line: "Off my lawn." }),
          beat("workshop", "day", "Four hours earlier, Bolt built a kite-grabbing robot arm.", [on(BOLT, "excited")], { sfx: "ding" }),
          beat("town", "day", "Three hours earlier, it grabbed Gus's hose instead.", [on(BOLT, "scared", "shake")], { sfx: "snap" }),
          beat("town", "day", "And would not let go.", [on(GUS, "surprised", "jump")]),
          beat("town", "sunset", "Two hours earlier, the hose dragged Gus up his ladder.", [on(GUS, "scared", "shake")]),
          beat("town", "sunset", "One hour earlier, he reached the top. And saw it.", [on(GUS, "surprised")]),
          beat("town", "sunset", "Lulu's kite. Stuck on his chimney.", [on(GUS, "thinking")]),
          beat("town", "sunset", "Which brings us back to now.", [on(GUS, "angry")], { sfx: "whoosh" }),
          beat("town", "sunset", "Gus could finally climb down.", [on(PIP, "excited"), on(LULU, "excited")]),
          beat("town", "night", "Instead, he flew the kite. From the roof.", [on(GUS, "happy", "jump")]),
          beat("town", "night", "Seventy years old. First kite ever.", [on(GUS, "excited", "jump")]),
          correction("Correction: Gus is not stuck. He lives up there now. With the kite.", [on(GUS, "happy"), on(LULU, "happy")]),
        ],
        caption: "he's not coming down",
        hashtags: ["brickbury", "townGossip", "papercraft", "animation"],
      };
    },
  },
  {
    // Flow: plan vs. what happened
    pitch: {
      title: "Pip's Perfect Surprise Party",
      logline: "Pip has a flawless three-step plan for Nana's surprise party, and then we see what actually happened.",
      genre: "comedy",
      twist: "Nana finds out, hides too, and surprises everyone, so Pip is the one who gets surprised.",
      era: "plan-vs-reality",
      skeptic: "Nana Pearl, Zoe, Chef Mo",
    },
    build: () => {
      const [PIP, NANA, ZOE, MO] = [0, 1, 2, 3];
      return {
        title: "Pip's Perfect Surprise Party",
        logline: "Pip has a flawless three-step plan for Nana's surprise party, and then we see what actually happened.",
        mechanism: null,
        characters: cast("party", "Nana Pearl", "Zoe", "Chef Mo"),
        beats: [
          headline("Local Boy Plans Perfect Surprise. Experts Doubtful.", [on(PIP, "excited"), on(NANA, "happy")]),
          beat("bedroom", "day", "Pip had a perfect plan for Nana's birthday.", [on(PIP, "excited")]),
          beat("bedroom", "day", "Step one. Zoe keeps Nana busy at the park.", [on(PIP, "thinking")]),
          beat("bedroom", "day", "Step two. Chef Mo bakes a giant cake.", [on(PIP, "happy")]),
          beat("bedroom", "day", "Step three. Everyone hides. Nana walks in. Surprise.", [on(PIP, "excited", "jump")]),
          beat("bedroom", "day", "Now. Here's what actually happened.", [on(PIP, "happy")], { sfx: "whoosh" }),
          beat("forest", "day", "Step one. Zoe kept Nana busy by telling her everything.", [on(ZOE, "excited"), on(NANA, "surprised")], { speaker: ZOE, line: "Oops. It's a surprise." }),
          beat("cafe", "day", "Step two. Chef Mo baked a giant cake.", [on(MO, "excited")]),
          beat("cafe", "day", "Too giant. It would not fit through the door.", [on(MO, "scared", "shake")], { sfx: "crash" }),
          beat("bedroom", "sunset", "Step three. Everyone hid.", [on(PIP, "excited"), on(ZOE, "happy")]),
          beat("bedroom", "sunset", "But Nana knew. So Nana hid too.", [on(NANA, "thinking")]),
          beat("bedroom", "sunset", "Everyone waited in total silence. For an hour.", [on(PIP, "thinking"), on(ZOE, "sad")]),
          beat("bedroom", "night", "Then Nana jumped out first.", [on(NANA, "excited", "jump")], { speaker: NANA, line: "Surprise!", sfx: "crash" }),
          beat("bedroom", "night", "Pip screamed. Mo dropped the cake.", [on(PIP, "scared", "shake"), on(MO, "scared")]),
          beat("bedroom", "night", "Nana called it her best birthday ever.", [on(NANA, "happy"), on(PIP, "happy")]),
          correction("Correction: The surprise party worked. Pip was the one surprised.", [on(PIP, "surprised"), on(NANA, "excited")]),
        ],
        caption: "step four: never plan again",
        hashtags: ["brickbury", "townGossip", "papercraft", "animation"],
      };
    },
  },
];

// ---------------- Public demo API ----------------

/** No-AI fallback for the Niche Scout: simple counting over the top titles. */
export function demoScout(videos: { title: string; viewsPerDay: number }[]): ScoutInsights {
  const top = videos.slice(0, 12);
  const shapes: [RegExp, string, string][] = [
    [/^why\b/i, "Why [someone] did [something strange]", "Opens a mystery the viewer wants solved"],
    [/^how\b/i, "How [someone] [did the impossible]", "Promises a clever method"],
    [/^the\b/i, "The [object or person] That [surprising result]", "Names one thing and hints at a payoff"],
    [/\?$/, "A question title", "Viewers stay to hear the answer"],
    [/\d/, "A number in the title (years, amounts, ages)", "Specific numbers feel real and checkable"],
    [/\b(everyone|they|laughed|mocked|crazy|stupid)\b/i, "Everyone laughed at [hero] until...", "Ridicule then payoff"],
  ];
  const hooks = shapes
    .map(([re, pattern, why]) => ({ pattern, why: `${why}. ${top.filter((v) => re.test(v.title)).length} of the top ${top.length} titles use it.`, n: top.filter((v) => re.test(v.title)).length }))
    .filter((h) => h.n > 0)
    .sort((a, b) => b.n - a.n)
    .slice(0, 4)
    .map(({ pattern, why }) => ({ pattern, why }));
  const stop = new Set("the a an of to in and for on with how why what this that is was did his her they he she it from by at as be who are were your you my i".split(" "));
  const counts = new Map<string, number>();
  for (const v of top) for (const w of new Set(v.title.toLowerCase().match(/[a-z]{4,}/g) ?? [])) if (!stop.has(w)) counts.set(w, (counts.get(w) ?? 0) + 1);
  const words = [...counts.entries()].filter(([, n]) => n > 1).sort((a, b) => b[1] - a[1]).slice(0, 4);
  const topics = words.length
    ? words.map(([w, n]) => ({ theme: `Stories about ${w}`, why: `"${w}" shows up in ${n} of the best-performing recent titles.` }))
    : [{ theme: "Old tricks that looked foolish but were genius", why: "A steady performer in ridicule-then-payoff story shorts." }];
  return { topics, hooks: hooks.length ? hooks : [{ pattern: "Why [someone] did [something strange]", why: "Opens a mystery the viewer wants solved" }] };
}

export function demoThemes(): Theme[] {
  return [
    { theme: "Old tricks that looked foolish but were genius", why: "Ridicule-then-payoff tales built on a real trick are the most rewatched story shorts." },
    { theme: "The kid everyone underestimated", why: "Underdog reveals are the most rewatched story shape on short video." },
    { theme: "A ceremony that decides your future", why: "Clear rules and big public moments make instant hooks." },
    { theme: "Tiny creatures with big dreams", why: "Cute heroes and gentle humor do well in cozy story feeds." },
  ];
}

export function demoPitches(style: StoryStyle, usedTitles: string[]): Pitch[] {
  const used = new Set(usedTitles.map((t) => t.toLowerCase()));
  const all: Pitch[] =
    style === "twist"
      ? TWIST_TALES.map((t) => t.pitch)
      : style === "gossip"
      ? GOSSIP_EPISODES.map((e) => e.pitch)
      : style === "hook"
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
  if (style === "twist") {
    const tale = TWIST_TALES.find((t) => t.pitch.title.toLowerCase() === base) ?? pick(r, TWIST_TALES);
    const s = tale.build(r);
    return { ...s, title: pitch.title.slice(0, 80), caption: pitch.title.slice(0, 80) };
  }
  if (style === "gossip") {
    const ep = GOSSIP_EPISODES.find((e) => e.pitch.title.toLowerCase() === base) ?? pick(r, GOSSIP_EPISODES);
    return { ...ep.build(), title: pitch.title.slice(0, 80) };
  }
  if (style === "hook") {
    const world = HOOK_WORLDS.find((w) => w.title.toLowerCase() === base) ?? pick(r, HOOK_WORLDS);
    const s = hookStory(world, r);
    return { ...s, title: pitch.title.slice(0, 80) };
  }
  const tale = COZY_TALES.find((t) => t.title.toLowerCase() === base) ?? pick(r, COZY_TALES);
  const s = tale.build(r);
  return { ...s, title: pitch.title.slice(0, 80) };
}
