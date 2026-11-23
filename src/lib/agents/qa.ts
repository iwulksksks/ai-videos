// QA Lab (Vera): rule checks always, then an AI edit pass.
import { editStory, type WriterName } from "../writers";
import { STYLE_RULES, StorySchema, type Story, type StoryStyle } from "../story";

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
export function ruleCheck(input: Story, style: StoryStyle): { story: Story; issues: string[]; fatal: string[] } {
  const r = STYLE_RULES[style];
  const issues: string[] = [];
  const fatal: string[] = [];
  const story: Story = structuredClone(input);

  // Characters: unique names, at most 3.
  if (story.characters.length > 3) {
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
    if (shortBy > 2) fatal.push(`Only ${story.beats.length} beats; ${style} stories need at least ${r.minBeats}`);
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
    if (b.line && b.line.trim() && b.speaker == null) b.speaker = b.cast[0].who;
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

  // Hook: dialogue is rare.
  if (style === "hook") {
    const lines = story.beats.filter((b) => b.line);
    if (lines.length > 4) {
      lines.slice(4).forEach((b) => {
        b.line = null;
        b.speaker = null;
      });
      issues.push("Removed extra dialogue (hook stories keep it rare)");
    }
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

export async function runQa(story: Story, style: StoryStyle, jobId?: number): Promise<QaResult> {
  const rules = ruleCheck(story, style);
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
      const again = ruleCheck(edit.value.story, style);
      if (!again.fatal.length) current = again.story;
    }
  } catch {
    issues.push("The AI edit pass was skipped");
  }
  return { verdict: issues.length ? "fixed" : "approved", issues, story: current, editor };
}
