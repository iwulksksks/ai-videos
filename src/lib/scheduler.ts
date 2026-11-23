// Autopilot clock. Starts with the server (see src/instrumentation.ts), so it works with no browser open.
import { log } from "./db";
import { autopilotRun, isBusy, recoverJobs } from "./pipeline";
import { getMeta, getSettings, setMeta } from "./settings";

const g = globalThis as unknown as { __reelhouseScheduler?: NodeJS.Timeout };

export function nextRunAt(): number | null {
  const s = getSettings();
  if (!s.autopilot) return null;
  const every = (24 * 60 * 60 * 1000) / s.storiesPerDay;
  const last = Number(getMeta("autopilot_last_run") ?? 0);
  return Math.max(Date.now(), last + every);
}

async function tick() {
  try {
    const s = getSettings();
    if (!s.autopilot) return;
    const next = nextRunAt();
    if (next === null || next > Date.now()) return;
    if (isBusy()) return; // wait until the line is free, so runs don't pile up
    setMeta("autopilot_last_run", String(Date.now()));
    await autopilotRun();
  } catch (e) {
    log("producer", `Autopilot hiccup: ${(e as Error).message}`, "error");
  }
}

export function startScheduler() {
  if (g.__reelhouseScheduler) return;
  recoverJobs();
  // If autopilot was just switched on and never ran, the first run happens within a minute.
  g.__reelhouseScheduler = setInterval(() => void tick(), 60 * 1000);
  setTimeout(() => void tick(), 5000);
  log("producer", "The studio is open. Bea is at her desk.");
}
