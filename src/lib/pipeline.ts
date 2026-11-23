// The production line: script -> qa -> voice -> art -> edit -> ship, one job at a time.
import fs from "node:fs";
import path from "node:path";
import { stageStory, type StagedPlan } from "./agents/art";
import { renderVideo } from "./agents/edit";
import { runQa } from "./agents/qa";
import { shipStory, outputFolder } from "./agents/ship";
import { makeMusic, pickMood, recordVoices } from "./agents/sound";
import { latestReport, scoutTrends } from "./agents/trends";
import { postToTikTok, tiktokAutoPost } from "./tiktok";
import { config } from "./config";
import { getDb, log } from "./db";
import { getSettings } from "./settings";
import { FPS, type Look, type Pitch, type Story, type StoryStyle, type Theme } from "./story";
import { writePitches, writeStory } from "./writers";

export type Stage = "queued" | "script" | "qa" | "voice" | "art" | "edit" | "ship" | "done" | "failed" | "skipped";

export type JobRow = {
  id: number;
  idea_id: number | null;
  title: string;
  stage: Stage;
  progress: number;
  attempts: number;
  style: StoryStyle;
  look: Look;
  story_json: string | null;
  qa_json: string | null;
  engine: string | null;
  error: string | null;
  output_dir: string | null;
  source: string;
  created_at: string;
  updated_at: string;
};

export type IdeaRow = {
  id: number;
  title: string;
  logline: string;
  genre: string;
  twist: string;
  theme: string | null;
  status: "waiting" | "used";
  created_at: string;
};

const STAGE_ROOM = { script: "script", qa: "qa", voice: "voice", art: "art", edit: "edit", ship: "ship" } as const;

function update(id: number, fields: Partial<Omit<JobRow, "id">>) {
  const keys = Object.keys(fields);
  if (!keys.length) return;
  const sets = keys.map((k) => `${k} = @${k}`).join(", ");
  getDb()
    .prepare(`UPDATE jobs SET ${sets}, updated_at = datetime('now') WHERE id = @id`)
    .run({ ...fields, id });
}

export function getJob(id: number): JobRow | undefined {
  return getDb().prepare("SELECT * FROM jobs WHERE id = ?").get(id) as JobRow | undefined;
}

export function jobDir(id: number): string {
  return path.join(config.dataDir, "jobs", String(id));
}

// ---------------- Ideas ----------------

export function usedTitles(): string[] {
  const d = getDb();
  const a = d.prepare("SELECT title FROM ideas").all() as { title: string }[];
  const b = d.prepare("SELECT title FROM jobs").all() as { title: string }[];
  return [...new Set([...a, ...b].map((r) => r.title))];
}

export function waitingIdeas(): IdeaRow[] {
  return getDb().prepare("SELECT * FROM ideas WHERE status = 'waiting' ORDER BY id DESC").all() as IdeaRow[];
}

/** Research Desk (Pip): pitch new stories from a theme + trends. */
export async function pitchIdeas(opts: { theme?: Theme | null; count?: number } = {}): Promise<IdeaRow[]> {
  const s = getSettings();
  const report = latestReport()?.report ?? null;
  const trends = report?.themes ?? [];
  const theme = opts.theme ?? trends[Math.floor(Math.random() * Math.max(1, trends.length))] ?? null;
  log("research", `Pip is pitching stories${theme ? ` about "${theme.theme}"` : " from the channel brief"}.`);
  const used = usedTitles();
  const res = await writePitches({ theme, trends, brief: s.brief, usedTitles: used, style: s.style, count: opts.count ?? 4 });
  const usedLower = new Set(used.map((t) => t.toLowerCase()));
  const fresh = res.value.filter((p) => !usedLower.has(p.title.toLowerCase()));
  const ins = getDb().prepare("INSERT INTO ideas (title, logline, genre, twist, theme) VALUES (?, ?, ?, ?, ?)");
  for (const p of fresh) ins.run(p.title, p.logline, p.genre, p.twist, theme?.theme ?? null);
  log("research", `Pitched ${fresh.length} new idea${fresh.length === 1 ? "" : "s"} (${res.engine}).`);
  return waitingIdeas();
}

/** Producer (Bea): picks the strongest waiting pitch. Simple scoring: punchy title, clear twist, fits the style. */
export function pickBestIdea(): IdeaRow | null {
  const ideas = waitingIdeas();
  if (!ideas.length) return null;
  const style = getSettings().style;
  const score = (i: IdeaRow) => {
    let s = 0;
    const words = i.title.split(/\s+/).length;
    s += words <= 5 ? 2 : 0;
    s += i.twist.length > 20 ? 2 : 0;
    s += /\d/.test(i.twist + i.title) ? 1 : 0;
    if (style === "hook" && /(power|mark|rank|chosen|strongest|weakest|ceremony|secret|only)/i.test(i.logline + i.twist)) s += 3;
    if (style === "cozy" && /(friend|tiny|little|cozy|home|cafe|warm)/i.test(i.logline + i.twist)) s += 3;
    s += i.theme ? 1 : 0;
    return s;
  };
  return [...ideas].sort((a, b) => score(b) - score(a))[0];
}

export function createJob(idea: IdeaRow, source: "manual" | "autopilot"): number {
  const s = getSettings();
  const d = getDb();
  d.prepare("UPDATE ideas SET status = 'used' WHERE id = ?").run(idea.id);
  const r = d
    .prepare("INSERT INTO jobs (idea_id, title, style, look, source) VALUES (?, ?, ?, ?, ?)")
    .run(idea.id, idea.title, s.style, s.look, source);
  const id = Number(r.lastInsertRowid);
  log("producer", `Bea green-lit "${idea.title}" (${s.style}, ${s.look === "2.5d" ? "2.5D" : "Flat 2D"}).`, "info", id);
  kick();
  return id;
}

// ---------------- The line ----------------

async function runJob(job: JobRow): Promise<void> {
  const dir = jobDir(job.id);
  fs.mkdirSync(dir, { recursive: true });
  const idea = job.idea_id
    ? (getDb().prepare("SELECT * FROM ideas WHERE id = ?").get(job.idea_id) as IdeaRow | undefined)
    : undefined;
  const pitch: Pitch = idea
    ? { title: idea.title, logline: idea.logline, genre: idea.genre, twist: idea.twist }
    : { title: job.title, logline: job.title, genre: "story", twist: "a surprise ending" };

  // Script Room
  update(job.id, { stage: "script", progress: 0, error: null });
  log("script", `Quill is writing "${pitch.title}".`, "info", job.id);
  const written = await writeStory(pitch, job.style, job.id);
  let story: Story = written.value;
  update(job.id, { story_json: JSON.stringify(story), engine: written.engine, title: story.title });
  log("script", `Wrote ${story.beats.length} beats with ${story.characters.map((c) => c.name).join(", ")} (${written.engine}).`, "info", job.id);

  // QA Lab
  update(job.id, { stage: "qa" });
  const qa = await runQa(story, job.style, job.id);
  update(job.id, { qa_json: JSON.stringify({ verdict: qa.verdict, issues: qa.issues, editor: qa.editor }) });
  if (qa.verdict === "rejected" || !qa.story) {
    log("qa", `Vera rejected it: ${qa.issues.slice(0, 3).join("; ")}`, "warn", job.id);
    throw new Error(`Rejected by QA: ${qa.issues.slice(0, 3).join("; ")}`);
  }
  story = qa.story;
  update(job.id, { story_json: JSON.stringify(story) });
  log("qa", qa.verdict === "approved" ? "Vera approved it." : `Vera fixed ${qa.issues.length} thing${qa.issues.length === 1 ? "" : "s"}.`, "info", job.id);

  // Sound Booth
  update(job.id, { stage: "voice", progress: 0 });
  const voices = await recordVoices(story, dir, (d, t) => update(job.id, { progress: d / t }));
  log("voice", voices.voiced ? "Echo recorded the narrator and the cast." : `Echo skipped voices. ${voices.problem}`, voices.voiced ? "info" : "warn", job.id);

  // Art Studio
  update(job.id, { stage: "art", progress: 0 });
  const plan: StagedPlan = stageStory(story, job.style, voices.audio);
  fs.writeFileSync(path.join(dir, "plan.json"), JSON.stringify(plan));
  const seconds = plan.totalFrames / FPS;
  log("art", `Dot staged ${plan.beats.length} scenes, ${seconds.toFixed(0)} seconds long.`, "info", job.id);

  // Music (Sound Booth again, now that the length is known)
  const mood = pickMood(story, job.style);
  const music = makeMusic({ mood, seconds, seed: story.title, jobDir: dir });
  log("voice", music.file ? `Echo made the music: ${music.source}.` : "Music is switched off.", "info", job.id);

  // Edit Bay
  update(job.id, { stage: "edit", progress: 0 });
  log("edit", "Splice started rendering.", "info", job.id);
  const rendered = path.join(dir, "render.mp4");
  await renderVideo({
    jobDir: dir,
    story,
    style: job.style,
    look: job.look,
    plan,
    musicFile: music.file,
    musicMood: mood,
    outFile: rendered,
    onProgress: (p) => update(job.id, { progress: p }),
  });
  log("edit", "Splice finished the render.", "info", job.id);

  // Shipping Dock
  update(job.id, { stage: "ship", progress: 0 });
  const folder = shipStory({
    renderedFile: rendered,
    story,
    folder: outputFolder(job.id, story.title),
    extra: { style: job.style, look: job.look, mood, writer: written.engine, qa: qa.issues },
  });
  fs.rmSync(rendered, { force: true });
  update(job.id, { stage: "done", progress: 1, output_dir: folder });
  log("ship", `Hatch packed "${story.title}" into ${path.basename(folder)}.`, "info", job.id);

  if (tiktokAutoPost()) {
    try {
      const r = await postToTikTok({ videoFile: path.join(folder, "video.mp4"), story });
      log("ship", `Hatch sent it to TikTok (${r}).`, "info", job.id);
    } catch (e) {
      log("ship", `TikTok posting failed: ${(e as Error).message}`, "warn", job.id);
    }
  }
}

let running = false;

/** Process queued jobs one at a time. Safe to call often. */
export function kick() {
  if (running) return;
  running = true;
  void (async () => {
    try {
      for (;;) {
        const job = getDb().prepare("SELECT * FROM jobs WHERE stage = 'queued' ORDER BY id LIMIT 1").get() as JobRow | undefined;
        if (!job) break;
        update(job.id, { attempts: job.attempts + 1 });
        try {
          await runJob({ ...job, attempts: job.attempts + 1 });
        } catch (e) {
          const msg = (e as Error).message;
          const attempts = job.attempts + 1;
          const failedAt = getJob(job.id)?.stage ?? "script";
          const room = STAGE_ROOM[failedAt as keyof typeof STAGE_ROOM] ?? "producer";
          if (attempts < 2) {
            log(room, `Something went wrong (${msg}). Trying this story once more.`, "warn", job.id);
            update(job.id, { stage: "queued", progress: 0, error: msg });
          } else {
            log(room, `Failed twice (${msg}). Marked as skipped.`, "error", job.id);
            update(job.id, { stage: "skipped", error: msg });
          }
        }
      }
    } finally {
      running = false;
    }
  })();
}

/** On server start: anything left mid-way by a crash or restart goes back in the queue. */
export function recoverJobs() {
  getDb()
    .prepare("UPDATE jobs SET stage = 'queued', progress = 0 WHERE stage IN ('script','qa','voice','art','edit','ship')")
    .run();
  kick();
}

export function isBusy(): boolean {
  return running;
}

// ---------------- Autopilot ----------------

/** One autopilot run: refill pitches if needed, pick one, queue it. */
export async function autopilotRun(): Promise<number | null> {
  log("producer", "Autopilot run: Bea is checking the idea board.");
  if (waitingIdeas().length < 3) {
    await scoutTrends(false).catch((e) => log("trends", `Trend check failed: ${(e as Error).message}`, "warn"));
    await pitchIdeas().catch((e) => log("research", `Pitching failed: ${(e as Error).message}`, "warn"));
  }
  const idea = pickBestIdea();
  if (!idea) {
    log("producer", "No pitches to choose from this time.", "warn");
    return null;
  }
  return createJob(idea, "autopilot");
}
