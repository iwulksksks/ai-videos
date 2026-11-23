// App settings chosen in the Producer's Office, stored in SQLite.
import { getDb } from "./db";
import { config } from "./config";
import type { Engine, Look, StoryStyle } from "./story";

export type Settings = {
  autopilot: boolean;
  brief: string;
  storiesPerDay: number;
  style: StoryStyle;
  look: Look;
  engine: Engine;
};

const DEFAULTS: Settings = {
  autopilot: false,
  brief: "Epic underdog stories where an overlooked kid secretly has the strongest power of all.",
  storiesPerDay: 3,
  style: "hook",
  look: "2.5d",
  engine: "auto",
};

export function getSettings(): Settings {
  const rows = getDb().prepare("SELECT key, value FROM settings").all() as { key: string; value: string }[];
  const stored: Partial<Settings> = {};
  for (const r of rows) {
    try {
      (stored as Record<string, unknown>)[r.key] = JSON.parse(r.value);
    } catch {
      /* ignore bad rows */
    }
  }
  const s = { ...DEFAULTS, ...stored };
  if (config.forcedStyle) s.style = config.forcedStyle;
  if (config.forcedEngine) s.engine = config.forcedEngine;
  s.storiesPerDay = Math.max(1, Math.min(24, Math.round(s.storiesPerDay)));
  return s;
}

export function saveSettings(patch: Partial<Settings>): Settings {
  const d = getDb();
  const stmt = d.prepare(
    "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
  );
  const allowed: (keyof Settings)[] = ["autopilot", "brief", "storiesPerDay", "style", "look", "engine"];
  for (const k of allowed) {
    if (patch[k] !== undefined) stmt.run(k, JSON.stringify(patch[k]));
  }
  return getSettings();
}

export function getMeta(key: string): string | null {
  const row = getDb().prepare("SELECT value FROM settings WHERE key = ?").get(`meta:${key}`) as
    | { value: string }
    | undefined;
  return row ? row.value : null;
}

export function setMeta(key: string, value: string) {
  getDb()
    .prepare(
      "INSERT INTO settings (key, value) VALUES (?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value",
    )
    .run(`meta:${key}`, value);
}
