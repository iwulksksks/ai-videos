// Posting schedule (Shipping Dock): finished videos wait in a queue and go out at the times you pick.
//
// TikTok: apps can't ask TikTok to post later, so Reelhouse itself sends each waiting video at its
// time. The computer has to be on (and Reelhouse running) then. If it was off, the first missed video
// goes out as soon as Reelhouse is back, and the rest move to the next free times.
//
// YouTube: Reelhouse uploads right away and tells YouTube when to make it public ("publishAt"), so
// YouTube publishes it on time even with the computer off. This only matters for public uploads;
// private and unlisted ones are uploaded straight away.
import fs from "node:fs";
import { getDb, log } from "./db";
import { getMeta, setMeta } from "./settings";
import type { Story } from "./story";
import { postToTikTok, tiktokAutoPost } from "./tiktok";
import { postToYouTube, youtubeAutoPost, youtubeMode } from "./youtube";

export type Platform = "tiktok" | "youtube";
export const PLATFORMS: Platform[] = ["tiktok", "youtube"];

export type Schedule = {
  /** false: post as soon as each video is finished (the old behaviour). */
  on: boolean;
  /** Time zone the times below are in. */
  timeZone: string;
  /** Daily posting times, "HH:MM" on a 24-hour clock, one video per time. */
  tiktok: string[];
  youtube: string[];
};

export const DEFAULT_SCHEDULE: Schedule = {
  on: false,
  timeZone: "Asia/Manila",
  tiktok: ["12:00", "19:00", "21:00"],
  youtube: ["18:00"],
};

const MAX_TIMES = 8;
// YouTube needs publishAt to be in the future; leave room for the upload itself.
const YOUTUBE_LEAD_MS = 15 * 60 * 1000;
const DAY = 24 * 60 * 60 * 1000;

export type PostStatus = "waiting" | "posting" | "scheduled" | "posted" | "failed" | "canceled";

export type PostRow = {
  id: number;
  job_id: number | null;
  platform: Platform;
  file: string;
  label: string;
  story_json: string;
  status: PostStatus;
  due_at: number; // ms since 1970
  result: string | null;
  error: string | null;
  attempts: number;
  created_at: string;
  posted_at: string | null;
};

export function ensurePostsTable() {
  getDb().exec(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      job_id INTEGER,
      platform TEXT NOT NULL,          -- tiktok | youtube
      file TEXT NOT NULL,
      label TEXT NOT NULL,
      story_json TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'waiting', -- waiting | posting | scheduled | posted | failed | canceled
      due_at INTEGER NOT NULL,
      result TEXT,
      error TEXT,
      attempts INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      posted_at TEXT
    );
  `);
}

function db() {
  ensurePostsTable();
  return getDb();
}

// ---------- the schedule ----------

export function cleanTimes(list: unknown): string[] {
  if (!Array.isArray(list)) return [];
  const out = new Set<string>();
  for (const v of list) {
    const m = /^(\d{1,2}):(\d{2})$/.exec(String(v).trim());
    if (!m) continue;
    const h = Number(m[1]);
    const min = Number(m[2]);
    if (h > 23 || min > 59) continue;
    out.add(`${String(h).padStart(2, "0")}:${String(min).padStart(2, "0")}`);
  }
  return [...out].sort().slice(0, MAX_TIMES);
}

function validZone(z: unknown): string | null {
  if (typeof z !== "string" || !z) return null;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: z });
    return z;
  } catch {
    return null;
  }
}

export function getSchedule(): Schedule {
  let stored: Partial<Schedule> = {};
  try {
    stored = JSON.parse(getMeta("post_schedule") ?? "{}") as Partial<Schedule>;
  } catch {
    /* use defaults */
  }
  return {
    on: typeof stored.on === "boolean" ? stored.on : DEFAULT_SCHEDULE.on,
    timeZone: validZone(stored.timeZone) ?? DEFAULT_SCHEDULE.timeZone,
    tiktok: Array.isArray(stored.tiktok) ? cleanTimes(stored.tiktok) : DEFAULT_SCHEDULE.tiktok,
    youtube: Array.isArray(stored.youtube) ? cleanTimes(stored.youtube) : DEFAULT_SCHEDULE.youtube,
  };
}

export function saveSchedule(patch: Partial<Schedule>): Schedule {
  const cur = getSchedule();
  const next: Schedule = {
    on: typeof patch.on === "boolean" ? patch.on : cur.on,
    timeZone: validZone(patch.timeZone) ?? cur.timeZone,
    tiktok: patch.tiktok !== undefined ? cleanTimes(patch.tiktok) : cur.tiktok,
    youtube: patch.youtube !== undefined ? cleanTimes(patch.youtube) : cur.youtube,
  };
  setMeta("post_schedule", JSON.stringify(next));
  // Videos already waiting move to the new times.
  for (const p of PLATFORMS) reslot(p, Date.now());
  return next;
}

/** Minutes the zone is ahead of UTC at a given moment (Manila: +480). */
function zoneOffsetMinutes(timeZone: string, at: number): number {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone,
    hourCycle: "h23",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  }).formatToParts(new Date(at));
  const n = (t: string) => Number(parts.find((p) => p.type === t)?.value);
  const asUtc = Date.UTC(n("year"), n("month") - 1, n("day"), n("hour"), n("minute"), n("second"));
  return Math.round((asUtc - Math.floor(at / 1000) * 1000) / 60000);
}

/** The y/m/d of a moment in the zone. */
function zoneDate(timeZone: string, at: number): { y: number; m: number; d: number } {
  const off = zoneOffsetMinutes(timeZone, at);
  const local = new Date(at + off * 60000);
  return { y: local.getUTCFullYear(), m: local.getUTCMonth(), d: local.getUTCDate() };
}

/** The moment it is "HH:MM" on a given day in the zone. */
function zoneTime(timeZone: string, day: { y: number; m: number; d: number }, hhmm: string): number {
  const [h, min] = hhmm.split(":").map(Number);
  const guess = Date.UTC(day.y, day.m, day.d, h, min);
  // Two passes handle days when the clocks change (not needed for Manila, but harmless).
  let t = guess - zoneOffsetMinutes(timeZone, guess) * 60000;
  t = guess - zoneOffsetMinutes(timeZone, t) * 60000;
  return t;
}

/** Posting times from `from` onwards, earliest first, for the next `days` days. */
export function upcomingSlots(times: string[], timeZone: string, from: number, days = 60): number[] {
  if (!times.length) return [];
  const out: number[] = [];
  const start = zoneDate(timeZone, from);
  for (let i = 0; i <= days; i++) {
    const day = zoneDate(timeZone, Date.UTC(start.y, start.m, start.d, 12) + i * DAY);
    for (const t of times) {
      const at = zoneTime(timeZone, day, t);
      if (at >= from) out.push(at);
    }
  }
  return out.sort((a, b) => a - b);
}

/** True when this platform's videos should wait for a posting time. */
function waitsForSlot(platform: Platform, s: Schedule): boolean {
  if (!s.on || !s[platform].length) return false;
  // Private and unlisted YouTube uploads aren't seen by anyone, so there's nothing to time.
  if (platform === "youtube" && youtubeMode() !== "public") return false;
  return true;
}

function earliestFrom(platform: Platform, now: number): number {
  return platform === "youtube" ? now + YOUTUBE_LEAD_MS : now;
}

/** Gives every waiting post of a platform its own posting time, oldest video first. */
export function reslot(platform: Platform, now: number) {
  const s = getSchedule();
  const waiting = db()
    .prepare("SELECT id FROM posts WHERE platform = ? AND status = 'waiting' ORDER BY id")
    .all(platform) as { id: number }[];
  if (!waiting.length) return;
  const set = db().prepare("UPDATE posts SET due_at = ? WHERE id = ?");
  if (!waitsForSlot(platform, s)) {
    for (const w of waiting) set.run(now, w.id);
    return;
  }
  // Times already used by YouTube videos that are uploaded and waiting to go public.
  const taken = new Set(
    (db().prepare("SELECT due_at FROM posts WHERE platform = ? AND status = 'scheduled'").all(platform) as { due_at: number }[]).map((r) => r.due_at),
  );
  let slots = upcomingSlots(s[platform], s.timeZone, earliestFrom(platform, now)).filter((t) => !taken.has(t));
  if (slots.length < waiting.length) slots = upcomingSlots(s[platform], s.timeZone, earliestFrom(platform, now), 400).filter((t) => !taken.has(t));
  waiting.forEach((w, i) => set.run(slots[i] ?? now, w.id));
}

// ---------- the queue ----------

/** Called when a video is finished: queues it for each platform that is switched on. */
export function queueFinishedVideo(opts: {
  jobId: number;
  title: string;
  video: { file: string; story: Story };
  tiktokClips: { file: string; story: Story }[];
}) {
  const now = Date.now();
  const add = db().prepare(
    "INSERT INTO posts (job_id, platform, file, label, story_json, due_at) VALUES (?, ?, ?, ?, ?, ?)",
  );
  const queued: string[] = [];
  if (tiktokAutoPost()) {
    // Long videos send their clips to TikTok; short ones go up whole.
    const posts = opts.tiktokClips.length ? opts.tiktokClips : [opts.video];
    posts.forEach((p, i) => {
      const label = posts.length > 1 ? `${opts.title} (clip ${i + 1})` : opts.title;
      add.run(opts.jobId, "tiktok", p.file, label, JSON.stringify(p.story), now);
    });
    reslot("tiktok", now);
    queued.push(posts.length > 1 ? `${posts.length} clips for TikTok` : "TikTok");
  }
  if (youtubeAutoPost()) {
    add.run(opts.jobId, "youtube", opts.video.file, opts.title, JSON.stringify(opts.video.story), now);
    reslot("youtube", now);
    queued.push("YouTube");
  }
  if (queued.length) {
    const s = getSchedule();
    const next = db()
      .prepare("SELECT MIN(due_at) AS t FROM posts WHERE job_id = ? AND status = 'waiting'")
      .get(opts.jobId) as { t: number | null };
    const timed = s.on && next.t && next.t > now + 60_000;
    log(
      "ship",
      timed
        ? `Hatch queued "${opts.title}" for ${queued.join(" and ")}. First post: ${formatWhen(next.t!, s.timeZone)}.`
        : `Hatch queued "${opts.title}" for ${queued.join(" and ")}, going out now.`,
      "info",
      opts.jobId,
    );
    void tickPosting();
  }
}

export function formatWhen(at: number, timeZone: string): string {
  return new Date(at).toLocaleString("en-US", { timeZone, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

const g = globalThis as unknown as { __reelhousePosting?: boolean };

async function sendOne(post: PostRow, now: number) {
  const story = JSON.parse(post.story_json) as Story;
  db().prepare("UPDATE posts SET status = 'posting', attempts = attempts + 1 WHERE id = ?").run(post.id);
  try {
    if (!fs.existsSync(post.file)) throw new Error("The video file is gone (moved or deleted?)");
    if (post.platform === "tiktok") {
      const r = await postToTikTok({ videoFile: post.file, story });
      db().prepare("UPDATE posts SET status = 'posted', result = ?, error = NULL, due_at = ?, posted_at = datetime('now') WHERE id = ?").run(r, Date.now(), post.id);
      log("ship", `Hatch sent "${post.label}" to TikTok (${r}).`, "info", post.job_id ?? undefined);
    } else {
      // A public upload with a time in the future: YouTube holds it and publishes it then.
      const later = waitsForSlot("youtube", getSchedule()) && post.due_at > now + 5 * 60 * 1000;
      const link = await postToYouTube({ videoFile: post.file, story, publishAt: later ? post.due_at : undefined });
      if (later) {
        db().prepare("UPDATE posts SET status = 'scheduled', result = ?, error = NULL, posted_at = datetime('now') WHERE id = ?").run(link, post.id);
        log("ship", `Hatch uploaded "${post.label}" to YouTube. It goes public ${formatWhen(post.due_at, getSchedule().timeZone)}: ${link}`, "info", post.job_id ?? undefined);
      } else {
        db().prepare("UPDATE posts SET status = 'posted', result = ?, error = NULL, posted_at = datetime('now') WHERE id = ?").run(link, post.id);
        log("ship", `Hatch uploaded "${post.label}" to YouTube: ${link}`, "info", post.job_id ?? undefined);
      }
    }
  } catch (e) {
    const msg = (e as Error).message;
    db().prepare("UPDATE posts SET status = 'failed', error = ? WHERE id = ?").run(msg, post.id);
    log("ship", `${post.platform === "tiktok" ? "TikTok posting" : "YouTube upload"} of "${post.label}" failed: ${msg}`, "warn", post.job_id ?? undefined);
  }
}

/** Sends whatever is due. Runs every minute from the scheduler; safe to call often. */
export async function tickPosting() {
  if (g.__reelhousePosting) return;
  g.__reelhousePosting = true;
  try {
    const now = Date.now();
    // TikTok: one video per posting time. A missed time sends one video now; the rest move along.
    const tk = db()
      .prepare("SELECT * FROM posts WHERE platform = 'tiktok' AND status = 'waiting' AND due_at <= ? ORDER BY due_at, id LIMIT 1")
      .get(now) as PostRow | undefined;
    if (tk) {
      await sendOne(tk, now);
      reslot("tiktok", Date.now());
    }
    // YouTube: upload everything waiting now; public ones carry their publish time.
    const yts = db().prepare("SELECT * FROM posts WHERE platform = 'youtube' AND status = 'waiting' ORDER BY id").all() as PostRow[];
    for (const yt of yts) {
      // Times may have slipped into the past while the computer was off.
      const fresh = db().prepare("SELECT * FROM posts WHERE id = ?").get(yt.id) as PostRow;
      if (fresh.status !== "waiting") continue;
      if (waitsForSlot("youtube", getSchedule()) && fresh.due_at < Date.now() + YOUTUBE_LEAD_MS) {
        reslot("youtube", Date.now());
      }
      const ready = db().prepare("SELECT * FROM posts WHERE id = ?").get(yt.id) as PostRow;
      await sendOne(ready, Date.now());
    }
    // YouTube videos whose publish time has passed count as posted.
    db().prepare("UPDATE posts SET status = 'posted' WHERE platform = 'youtube' AND status = 'scheduled' AND due_at <= ?").run(Date.now());
  } catch (e) {
    log("ship", `Posting hiccup: ${(e as Error).message}`, "error");
  } finally {
    g.__reelhousePosting = false;
  }
}

/** On server start: a post cut off by a crash or restart goes back to waiting. */
export function recoverPosts() {
  db().prepare("UPDATE posts SET status = 'waiting' WHERE status = 'posting'").run();
  for (const p of PLATFORMS) reslot(p, Date.now());
}

/** Buttons in the Shipping Dock. */
export function postAction(id: number, action: "retry" | "now" | "cancel") {
  const post = db().prepare("SELECT * FROM posts WHERE id = ?").get(id) as PostRow | undefined;
  if (!post) throw new Error("That post isn't in the queue any more");
  if (action === "cancel") {
    if (post.status !== "waiting" && post.status !== "failed") throw new Error("Only waiting posts can be taken off the queue");
    db().prepare("UPDATE posts SET status = 'canceled' WHERE id = ?").run(id);
    reslot(post.platform, Date.now());
  } else if (action === "retry") {
    if (post.status !== "failed") throw new Error("Only failed posts can be tried again");
    db().prepare("UPDATE posts SET status = 'waiting', error = NULL WHERE id = ?").run(id);
    reslot(post.platform, Date.now());
  } else {
    if (post.status !== "waiting" && post.status !== "failed") throw new Error("This one has already gone out");
    // Jump the queue: goes out now, without a YouTube publish time.
    // (sendNow marks it "posting" before its first await, so the minute tick can't grab it too.)
    void sendNow(post).then(() => reslot(post.platform, Date.now()));
  }
}

async function sendNow(post: PostRow) {
  const story = JSON.parse(post.story_json) as Story;
  db().prepare("UPDATE posts SET status = 'posting', attempts = attempts + 1 WHERE id = ?").run(post.id);
  try {
    const r =
      post.platform === "tiktok"
        ? await postToTikTok({ videoFile: post.file, story })
        : await postToYouTube({ videoFile: post.file, story });
    db().prepare("UPDATE posts SET status = 'posted', result = ?, error = NULL, due_at = ?, posted_at = datetime('now') WHERE id = ?").run(r, Date.now(), post.id);
    log("ship", `Hatch posted "${post.label}" to ${post.platform === "tiktok" ? "TikTok" : "YouTube"} now (${r}).`, "info", post.job_id ?? undefined);
  } catch (e) {
    const msg = (e as Error).message;
    db().prepare("UPDATE posts SET status = 'failed', error = ? WHERE id = ?").run(msg, post.id);
    log("ship", `Posting "${post.label}" failed: ${msg}`, "warn", post.job_id ?? undefined);
  }
}

/** What the Shipping Dock shows. */
export function postingState() {
  const s = getSchedule();
  const rows = db()
    .prepare(
      `SELECT * FROM posts WHERE status IN ('waiting','posting','failed','scheduled')
       OR (status = 'posted' AND posted_at >= datetime('now','-3 days'))
       ORDER BY CASE WHEN status IN ('waiting','posting','scheduled') THEN 0 ELSE 1 END, due_at, id LIMIT 40`,
    )
    .all() as PostRow[];
  const next = (p: Platform) => upcomingSlots(s[p], s.timeZone, earliestFrom(p, Date.now()), 2)[0] ?? null;
  return {
    schedule: s,
    nextSlot: { tiktok: s.on ? next("tiktok") : null, youtube: s.on ? next("youtube") : null },
    youtubeTimed: waitsForSlot("youtube", { ...s, on: true }),
    posts: rows.map((r) => ({
      id: r.id,
      jobId: r.job_id,
      platform: r.platform,
      label: r.label,
      status: r.status,
      dueAt: r.due_at,
      when: r.due_at > 0 ? formatWhen(r.due_at, s.timeZone) : "now",
      result: r.result,
      error: r.error,
    })),
  };
}
