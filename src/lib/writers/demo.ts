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
    pitch: {
      title: "Mayor Bans All Noise",
      logline: "After Pip's sunrise tuba practice, the mayor bans all noise, and Brickbury takes it far too seriously.",
      genre: "comedy",
      twist: "Only Pip's tuba can save the mayor, so tuba practice becomes the law.",
      era: "new-rule",
      skeptic: "Mayor Bigsby, Gus, Coach Rhonda, Nana Pearl",
    },
    build: () => {
      const [PIP, MAYOR, GUS, RHONDA, NANA] = [0, 1, 2, 3, 4];
      return {
        title: "Mayor Bans All Noise",
        logline: "After Pip's sunrise tuba practice, the mayor bans all noise, and Brickbury takes it far too seriously.",
        mechanism: null,
        characters: cast("noise", "Mayor Bigsby", "Gus", "Coach Rhonda", "Nana Pearl"),
        beats: [
          headline("Mayor Bans All Noise After Pip Incident", [on(MAYOR, "angry"), on(PIP, "sad")]),
          beat("plaza", "day", "Okay, so the whole town was whispering. Even the dogs.", [on(NANA, "thinking"), on(RHONDA, "surprised")]),
          beat("town", "day", "It started when Pip practiced the tuba at sunrise.", [on(PIP, "excited", "jump")], { sfx: "rumble" }),
          beat("town", "day", "Gus next door did not love that.", [on(GUS, "angry", "shake")], { speaker: GUS, line: "My tomatoes are crying!" }),
          beat("plaza", "day", "So Mayor Bigsby made a brand new rule.", [on(MAYOR, "excited", "enter")], { speaker: MAYOR, line: "No noise. Anywhere. Ever." }),
          beat("cafe", "day", "And honey, people took it seriously.", [on(NANA, "thinking")]),
          beat("cafe", "day", "Nana Pearl knitted tiny socks for every spoon.", [on(NANA, "happy")]),
          beat("classroom", "day", "Coach Rhonda ran gym class with a silent whistle.", [on(RHONDA, "angry", "jump")]),
          beat("plaza", "day", "Kids played tag in total silence. Creepy.", [on(PIP, "happy", "walk"), on(RHONDA, "surprised")]),
          beat("town", "sunset", "Even I had to stop cooing. Torture.", [on(PIP, "thinking")]),
          beat("plaza", "sunset", "Then the mayor's hat blew into the fountain.", [on(MAYOR, "scared", "shake")], { sfx: "whoosh" }),
          beat("plaza", "sunset", "He couldn't yell for help. Against the rules.", [on(MAYOR, "scared", "shake")]),
          beat("plaza", "sunset", "He waved. Everyone politely waved back.", [on(NANA, "happy"), on(RHONDA, "happy"), on(MAYOR, "sad")]),
          beat("town", "sunset", "So Pip ran home for the loudest thing he owned.", [on(PIP, "excited", "walk")]),
          beat("plaza", "sunset", "One tuba blast, and the whole town came running.", [on(PIP, "excited", "jump"), on(GUS, "surprised")], { sfx: "rumble" }),
          beat("plaza", "night", "The mayor got his hat back. Slightly soggy.", [on(MAYOR, "happy")]),
          beat("town", "night", "Gus moved his tomatoes somewhere quieter.", [on(GUS, "thinking", "walk")]),
          correction("Correction: Noise is allowed again. Tuba practice is now the law.", [on(PIP, "excited"), on(MAYOR, "happy")]),
        ],
        caption: "the tomatoes have filed a complaint",
        hashtags: ["brickbury", "townGossip", "papercraft", "animation"],
      };
    },
  },
  {
    pitch: {
      title: "The Bakery Is Dying?",
      logline: "Pip says Chef Mo's buns are to die for, and by noon the whole town believes the bakery is dying.",
      genre: "comedy",
      twist: "The fake goodbye makes the bakery so busy that Mo keeps 'closing forever' every Friday, and Pip can't get a bun.",
      era: "rumor",
      skeptic: "Chef Mo, Officer Dot, Mr. Fenn, Mrs. Plum",
    },
    build: () => {
      const [PIP, MO, DOT, FENN, PLUM] = [0, 1, 2, 3, 4];
      return {
        title: "The Bakery Is Dying?",
        logline: "Pip says Chef Mo's buns are to die for, and by noon the whole town believes the bakery is dying.",
        mechanism: null,
        characters: cast("bakery", "Chef Mo", "Officer Dot", "Mr. Fenn", "Mrs. Plum"),
        beats: [
          headline("Brickbury Bakery Dying, Say Sources", [on(MO, "sad")]),
          beat("plaza", "sunset", "So I'm on the roof, and the whole town is crying at a bakery.", [on(PLUM, "sad", "shake"), on(FENN, "sad"), on(DOT, "sad")]),
          beat("cafe", "day", "That morning, Pip said Mo's buns were to die for.", [on(PIP, "excited", "jump"), on(MO, "happy")]),
          beat("cafe", "day", "Officer Dot only heard one word.", [on(DOT, "surprised", "enter")], { sfx: "ding" }),
          beat("town", "day", "She told Mr. Fenn the bakery was dying.", [on(DOT, "scared", "shake"), on(FENN, "surprised")], { speaker: DOT, line: "The bakery is dying!" }),
          beat("town", "day", "And Fenn? Told every mailbox on his route.", [on(FENN, "scared", "walk")]),
          beat("market", "day", "At the salon, Mrs. Plum added a few details.", [on(PLUM, "excited")], { speaker: PLUM, line: "I heard it first." }),
          beat("market", "day", "Now Mo was moving to the moon. Forever.", [on(PLUM, "thinking"), on(FENN, "surprised")]),
          beat("plaza", "sunset", "Somebody brought candles. Somebody brought a trumpet.", [on(FENN, "sad"), on(DOT, "sad"), on(PLUM, "sad")], { sfx: "whoosh" }),
          beat("cafe", "sunset", "Everyone lined up to buy one last bun.", [on(PLUM, "sad", "walk"), on(FENN, "sad", "walk")]),
          beat("cafe", "sunset", "Mo sold out in eleven minutes.", [on(MO, "surprised", "jump")], { sfx: "ding" }),
          beat("cafe", "sunset", "He baked more. Sold out again.", [on(MO, "excited", "shake")]),
          beat("cafe", "night", "Finally, Pip explained what he meant.", [on(PIP, "thinking"), on(MO, "thinking")]),
          beat("cafe", "night", "Mo looked at the line around the block. Then he smiled.", [on(MO, "happy")]),
          beat("town", "night", "And poor Pip? The line was too long. No bun.", [on(PIP, "sad")]),
          correction("Correction: The bakery isn't closing. It closes forever every Friday now.", [on(MO, "excited"), on(PIP, "surprised")]),
        ],
        caption: "it was a compliment",
        hashtags: ["brickbury", "townGossip", "papercraft", "animation"],
      };
    },
  },
  {
    pitch: {
      title: "Town Hunts Missing Bunny",
      logline: "Pip's little sister loses her stuffed bunny and the whole town turns the search into a full operation.",
      genre: "comedy",
      twist: "The bunny was on Pip's head the whole time, under his cap.",
      era: "lost",
      skeptic: "Lulu, Coach Rhonda, Bolt",
    },
    build: () => {
      const [PIP, LULU, RHONDA, BOLT] = [0, 1, 2, 3];
      return {
        title: "Town Hunts Missing Bunny",
        logline: "Pip's little sister loses her stuffed bunny and the whole town turns the search into a full operation.",
        mechanism: null,
        characters: cast("waffles", "Lulu", "Coach Rhonda", "Bolt"),
        beats: [
          headline("Town Hunts Missing Bunny, Finds Four Cats", [on(LULU, "sad"), on(BOLT, "surprised")]),
          beat("forest", "day", "Picture this. A whistle, a drone, and forty people in one bush.", [on(RHONDA, "angry", "shake"), on(BOLT, "excited")], { sfx: "whoosh" }),
          beat("bedroom", "day", "It all started with one stuffed bunny.", [on(LULU, "sad", "shake")]),
          beat("bedroom", "day", "Mister Waffles was gone.", [on(LULU, "scared", "shake"), on(PIP, "surprised")], { speaker: LULU, line: "Find him. Now." }),
          beat("town", "day", "Pip went straight to Coach Rhonda.", [on(PIP, "thinking", "walk"), on(RHONDA, "happy")]),
          beat("town", "day", "Big mistake. She made it a training drill.", [on(RHONDA, "excited", "jump")], { speaker: RHONDA, line: "Laps till we find him!" }),
          beat("plaza", "day", "Half the town was jogging in circles.", [on(RHONDA, "angry", "walk"), on(PIP, "scared", "walk")]),
          beat("workshop", "day", "Bolt built a bunny-finding drone.", [on(BOLT, "excited")], { sfx: "ding" }),
          beat("workshop", "day", "It found four cats and a mop.", [on(BOLT, "surprised", "shake")]),
          beat("beach", "sunset", "They searched the beach. I watched from a lamp post.", [on(RHONDA, "angry", "walk"), on(PIP, "sad", "walk")]),
          beat("harbor", "sunset", "Rhonda searched a boat that was not hers.", [on(RHONDA, "excited", "jump")], { sfx: "crash" }),
          beat("town", "sunset", "The drone flew straight into the town clock.", [on(BOLT, "scared", "shake")], { sfx: "crash" }),
          beat("bedroom", "night", "Pip came home to break the bad news.", [on(PIP, "sad"), on(LULU, "sad")]),
          beat("bedroom", "night", "Lulu just pointed at his cap.", [on(LULU, "angry"), on(PIP, "surprised")], { speaker: LULU, line: "Your hat has ears." }),
          beat("bedroom", "night", "Honey. He'd been wearing Mister Waffles all day.", [on(PIP, "scared", "shake")]),
          correction("Correction: The bunny was found. On Pip's head. Please stop jogging.", [on(PIP, "scared"), on(LULU, "happy")]),
        ],
        caption: "the whole town. all day.",
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
