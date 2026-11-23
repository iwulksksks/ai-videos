// SQLite storage: ideas, jobs, settings, activity log and trend reports.
import Database from "better-sqlite3";
import fs from "node:fs";
import path from "node:path";
import { config } from "./config";

let db: Database.Database | null = null;

export function getDb(): Database.Database {
  if (db) return db;
  fs.mkdirSync(config.dataDir, { recursive: true });
  db = new Database(path.join(config.dataDir, "reelhouse.db"));
  db.pragma("journal_mode = WAL");
  db.exec(`
    CREATE TABLE IF NOT EXISTS settings (key TEXT PRIMARY KEY, value TEXT NOT NULL);
    CREATE TABLE IF NOT EXISTS ideas (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      logline TEXT NOT NULL,
      genre TEXT NOT NULL,
      twist TEXT NOT NULL,
      theme TEXT,
      status TEXT NOT NULL DEFAULT 'waiting', -- waiting | used
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS jobs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      idea_id INTEGER,
      title TEXT NOT NULL,
      stage TEXT NOT NULL DEFAULT 'queued', -- queued | script | qa | voice | art | edit | ship | done | failed | skipped
      progress REAL NOT NULL DEFAULT 0,
      attempts INTEGER NOT NULL DEFAULT 0,
      style TEXT NOT NULL,
      look TEXT NOT NULL,
      story_json TEXT,
      qa_json TEXT,
      engine TEXT,
      error TEXT,
      output_dir TEXT,
      source TEXT NOT NULL DEFAULT 'manual', -- manual | autopilot
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS activity (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      room TEXT NOT NULL,
      message TEXT NOT NULL,
      level TEXT NOT NULL DEFAULT 'info',
      job_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS trends (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      report_json TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
  `);
  // Columns added later (Twist Tale pitches).
  const cols = (db.prepare("PRAGMA table_info(ideas)").all() as { name: string }[]).map((c) => c.name);
  for (const c of ["mechanism", "era", "skeptic"]) if (!cols.includes(c)) db.exec(`ALTER TABLE ideas ADD COLUMN ${c} TEXT`);
  return db;
}

export type Room =
  | "trends"
  | "scout"
  | "producer"
  | "research"
  | "script"
  | "qa"
  | "voice"
  | "art"
  | "edit"
  | "ship";

export function log(room: Room, message: string, level: "info" | "warn" | "error" = "info", jobId?: number) {
  getDb()
    .prepare("INSERT INTO activity (room, message, level, job_id) VALUES (?, ?, ?, ?)")
    .run(room, message, level, jobId ?? null);
  const tag = level === "info" ? "" : ` [${level}]`;
  console.log(`[reelhouse:${room}]${tag} ${message}`);
}

export type ActivityRow = {
  id: number;
  room: Room;
  message: string;
  level: string;
  job_id: number | null;
  created_at: string;
};

export function recentActivity(limit = 60, room?: Room): ActivityRow[] {
  const d = getDb();
  if (room)
    return d
      .prepare("SELECT * FROM activity WHERE room = ? ORDER BY id DESC LIMIT ?")
      .all(room, limit) as ActivityRow[];
  return d.prepare("SELECT * FROM activity ORDER BY id DESC LIMIT ?").all(limit) as ActivityRow[];
}
