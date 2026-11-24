// QA Lab (Vera): rule checks always, then an AI edit pass.
import { editStory, type WriterName } from "../writers";
import { STYLE_RULES, StorySchema, rulesFor, type Story, type StoryStyle, type VideoLength } from "../story";
import { fixHighlights } from "./clips";
import { HERO } from "../town";

export type QaResult = {
  verdict: "approved" | "fixed" | "rejected";
  issues: string[];
  story: Story | null;
  editor: WriterName | "rules";
};

const BANNED = /\b(disney|marvel|pixar|pokemon|pok[eé]mon|nintendo|mario|elsa|spider-?man|batman|superman|harry potter|naruto|goku|tiktok|youtube|instagram|coca-?cola|mcdonald'?s|nike|taylor swift|elon musk)\b/i;

function wordCount(s: string) {
  return s.split(/\s+/).filter(Boolean).length;
}

function trimWords(s: string, max: number) {
  const ws = s.split(/\s+/).filter(Boolean);
  if (ws.length <= max) return s;
  return ws.slice(0, max).join(" ").replace(/[,;:]$/, "") + (/[.!?]$/.test(ws[max - 1]) ? "" : ".");
}

/** Fix what can be fixed by rules. Returns `fatal` problems that make the story unusable. */
export function ruleCheck(input: Story, style: StoryStyle, length: VideoLength = "short"): { story: Story; issues: string[]; fatal: string[] } {
  const r = rulesFor(style, length);
  const short = STYLE_RULES[style];
  const issues: string[] = [];
  const fatal: string[] = [];
  const story: Story = structuredClone(input);

  // Town Gossip: Pip leads every episode; the neighbors around him change.
  if ((style === "gossip" || style === "whatif" || style === "pov") && story.characters[0]?.name.toLowerCase() !== HERO.name.toLowerCase()) {
    issues.push("Pip isn't character 0 in this episode");
  }
  // Characters: unique names, at most 3 (Town Gossip has its fixed cast of 5).
  if (style !== "gossip" && story.characters.length > 3) {
    story.characters = story.characters.slice(0, 3);
    issues.push("Trimmed the cast to 3 characters");
  }
  const seen = new Set<string>();
  story.characters.forEach((c, i) => {
    if (seen.has(c.name.toLowerCase())) {
      c.name = `${c.name} ${i + 1}`;
      issues.push(`Renamed a duplicate character to ${c.name}`);
    }
    seen.add(c.name.toLowerCase());
  });
  const n = story.characters.length;

  // Beat count.
  if (story.beats.length > r.maxBeats) {
    // Keep the start and the ending, drop from the middle.
    const keepEnd = 3;
    story.beats = [...story.beats.slice(0, r.maxBeats - keepEnd), ...story.beats.slice(-keepEnd)];
    issues.push(`Cut the story down to ${r.maxBeats} beats`);
  }
  if (story.beats.length < r.minBeats) {
    const shortBy = r.minBeats - story.beats.length;
    // A long story that came back short still works as a normal-length video.
    if (length === "long" && story.beats.length >= short.minBeats) issues.push(`Shorter than a long video should be (${story.beats.length} beats, aim for ${r.minBeats})`);
    else if (shortBy > 2) fatal.push(`Only ${story.beats.length} beats; ${style} stories need at least ${r.minBeats}`);
    else issues.push(`A little short (${story.beats.length} beats), allowed`);
  }

  story.beats.forEach((b, i) => {
    // Valid cast indexes, no duplicates.
    const before = b.cast.length;
    b.cast = b.cast.filter((c, j, arr) => c.who < n && arr.findIndex((o) => o.who === c.who) === j).slice(0, 3);
    if (b.cast.length !== before) issues.push(`Beat ${i + 1}: removed characters that don't exist`);
    if (!b.cast.length) {
      b.cast = [{ who: 0, mood: "happy", action: "idle" }];
      issues.push(`Beat ${i + 1}: nobody was on screen, added the hero`);
    }
    // Speaker and line must agree.
    if (b.speaker != null && b.speaker >= n) {
      b.speaker = null;
      issues.push(`Beat ${i + 1}: speaker didn't exist`);
    }
    if (b.line && b.line.trim() && b.speaker == null) b.speaker = b.cast[0]?.who ?? 0;
    if ((!b.line || !b.line.trim()) && b.speaker != null) b.speaker = null;
    if (b.line && !b.line.trim()) b.line = null;
    if (b.speaker != null && !b.cast.some((c) => c.who === b.speaker) && b.cast.length < 3) {
      b.cast.push({ who: b.speaker, mood: "happy", action: "idle" });
    }
    if (b.line && wordCount(b.line) > r.maxLineWords) {
      b.line = trimWords(b.line, r.maxLineWords);
      issues.push(`Beat ${i + 1}: shortened a long line`);
    }
    // Narration length.
    const wc = wordCount(b.narration);
    if (wc > r.maxWords + 4) {
      b.narration = trimWords(b.narration, r.maxWords + 2);
      issues.push(`Beat ${i + 1}: shortened the narration`);
    } else if (wc > r.maxWords) {
      issues.push(`Beat ${i + 1}: narration a bit long (${wc} words)`);
    }
    if (wc === 0) fatal.push(`Beat ${i + 1} has no narration`);
  });

  // Hook and Twist Tale: dialogue is rare.
  if (style !== "cozy") {
    const max = (style === "twist" || style === "whatif" ? 3 : style === "gossip" ? 6 : style === "pov" ? 5 : 4) * (length === "long" ? 2 : 1);
    const lines = story.beats.filter((b) => b.line);
    if (lines.length > max) {
      lines.slice(max).forEach((b) => {
        b.line = null;
        b.speaker = null;
      });
      issues.push(`Removed extra dialogue (${style} stories keep it rare)`);
    }
  }

  if (style === "twist") {
    if (!story.mechanism || story.mechanism.trim().length < 15) fatal.push("No real mechanism explains the ending");
    const words = story.beats.reduce((n, b) => n + wordCount(b.narration) + (b.line ? wordCount(b.line) : 0), 0);
    const k = length === "long" ? 2.3 : 1;
    if (words < 120 * k || words > 260 * k) issues.push(`About ${words} spoken words; Twist Tales aim for ${Math.round(170 * k)} to ${Math.round(200 * k)}`);
    const last = story.beats[story.beats.length - 1];
    if (/\b(part 2|part two|to be continued|stay tuned|subscribe)\b/i.test(last.narration)) {
      last.narration = last.narration.replace(/\s*(part 2|part two|to be continued|stay tuned|subscribe)[^.!?]*[.!?]?/gi, "").trim() || last.narration;
      issues.push("Removed a cliffhanger tease from the ending (Twist Tales stop on the punch line)");
    }
    if (story.caption !== story.title || story.hashtags.length) {
      story.caption = story.title;
      story.hashtags = [];
    }
  }

  if (style === "gossip") {
    // The episode opens on a Brickbury Bugle headline and closes on its correction.
    story.beats.forEach((b) => {
      if (b.card === "none") b.card = null;
    });
    story.beats.forEach((b, i) => {
      if (b.card && i !== 0 && i !== story.beats.length - 1) b.card = null;
      if (b.card) {
        b.line = null;
        b.speaker = null;
      }
    });
    if (story.beats[0].card !== "headline") {
      story.beats.unshift({ ...story.beats[0], card: "headline", narration: story.title, line: null, speaker: null, prop: null, sfx: "ding" });
      if (story.beats.length > r.maxBeats) story.beats.splice(Math.floor(story.beats.length / 2), 1);
      issues.push("Added the newspaper headline opening");
    }
    if (story.beats[story.beats.length - 1].card !== "correction") issues.push("No closing correction card; the twist lands better as one");
    const last = story.beats[story.beats.length - 1];
    if (/\b(part 2|part two|to be continued|stay tuned|subscribe|follow)\b/i.test(last.narration)) {
      issues.push("The ending teases more; Town Gossip should stop on the ironic twist");
    }
  }

  if (style === "whatif") {
    // Opens on the question card; the counter only climbs; no other cards.
    story.beats.forEach((b, i) => {
      if (b.card && (b.card !== "question" || i !== 0)) b.card = null;
    });
    if (story.beats[0].card !== "question") {
      const q = /^what if/i.test(story.title) ? story.title.replace(/\??$/, "?") : `What if ${story.title}?`;
      story.beats.unshift({ ...story.beats[0], card: "question", narration: q, line: null, speaker: null, prop: null, value: null, sfx: "ding" });
      if (story.beats.length > r.maxBeats) story.beats.splice(Math.floor(story.beats.length / 2), 1);
      issues.push("Added the question card opening");
    }
    const first = story.beats[0];
    first.line = null;
    first.speaker = null;
    first.value = null;
    if (!story.counter) issues.push("No counter set; the video will run without one");
    let top = -Infinity;
    let steps = 0;
    story.beats.forEach((b, i) => {
      if (b.value == null || !Number.isFinite(b.value)) return;
      if (b.value < top) {
        b.value = top;
        issues.push(`Beat ${i + 1}: the counter went backwards, held it`);
      } else if (b.value > top) steps++;
      top = b.value;
    });
    if (story.counter && steps < 4) issues.push(`The counter only climbs ${steps} times; What If needs a clear escalation`);
    if (!story.beats.slice(1).some((b) => /\byou(r)?\b/i.test(b.narration))) issues.push("Narration isn't in the second person ('you')");
    const last = story.beats[story.beats.length - 1];
    if (/\b(part 2|part two|to be continued|stay tuned|subscribe|follow)\b/i.test(last.narration)) {
      issues.push("The ending teases more; What If should stop on the most extreme step");
    }
  }

  if (style === "pov") {
    const last = story.beats[story.beats.length - 1];
    if (/\b(part 2|part two|to be continued|stay tuned|subscribe|follow)\b/i.test(last.narration)) {
      issues.push("The ending teases more; POV stories end on the real reason and a small joke");
    }
    if (!story.beats.some((b) => /\b(I|my|me)\b/.test(b.narration))) issues.push("Narration isn't in the first person ('I')");
    if (!story.beats.some((b) => /real reason/i.test(b.narration))) issues.push("No clear 'The real reason?' reveal");
  }

  // Long videos: check the stretches that become TikTok clips.
  if (length === "long") {
    const fixed = fixHighlights(story, style);
    story.highlights = fixed.highlights;
    issues.push(...fixed.issues);
  } else if (story.highlights) {
    story.highlights = null;
  }

  story.hashtags = story.hashtags
    .map((h) => h.replace(/^#+/, "").replace(/\s+/g, ""))
    .filter(Boolean)
    .slice(0, 8);

  const all = JSON.stringify(story);
  if (BANNED.test(all)) fatal.push("Mentions a real brand, person or existing franchise");

  const check = StorySchema.safeParse(story);
  if (!check.success) fatal.push(`Shape problem: ${check.error.issues[0]?.message ?? "unknown"}`);

  return { story, issues, fatal };
}

export async function runQa(story: Story, style: StoryStyle, jobId?: number, length: VideoLength = "short"): Promise<QaResult> {
  const rules = ruleCheck(story, style, length);
  if (rules.fatal.length) return { verdict: "rejected", issues: [...rules.fatal, ...rules.issues], story: null, editor: "rules" };

  let current = rules.story;
  let issues = [...rules.issues];
  let editor: QaResult["editor"] = "rules";
  try {
    const edit = await editStory(current, style, issues, jobId);
    editor = edit.engine;
    issues = [...issues, ...edit.value.issues.filter((i) => !issues.includes(i))];
    if (edit.value.verdict === "rejected") return { verdict: "rejected", issues, story: null, editor };
    if (edit.value.verdict === "fixed" && edit.value.story) {
      // Keep the clip stretches if the editor dropped them but kept the same beats.
      const edited = edit.value.story;
      if (!edited.highlights?.length && current.highlights?.length && edited.beats.length === current.beats.length) edited.highlights = current.highlights;
      const again = ruleCheck(edited, style, length);
      if (!again.fatal.length) current = again.story;
    }
  } catch {
    issues.push("The AI edit pass was skipped");
  }
  return { verdict: issues.length ? "fixed" : "approved", issues, story: current, editor };
}
