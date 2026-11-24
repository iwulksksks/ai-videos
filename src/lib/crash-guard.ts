// Keeps the studio running when one background step throws an error nobody caught.
// Without this, a single stray error (a lost connection while rendering, a helper program
// that won't start) closes the whole server, and the page can only say "Failed to fetch".
import fs from "node:fs";
import path from "node:path";
import { config } from "./config";

const g = globalThis as unknown as { __reelhouseCrashGuard?: boolean };

function record(kind: string, err: unknown) {
  const e = err instanceof Error ? err : new Error(String(err));
  const line = `[${new Date().toISOString()}] ${kind}: ${e.stack ?? e.message}\n`;
  console.error(`[reelhouse] ${kind} (the studio kept running): ${e.message}`);
  try {
    fs.mkdirSync(config.dataDir, { recursive: true });
    fs.appendFileSync(path.join(config.dataDir, "problems.log"), line);
  } catch {
    /* nothing more we can do */
  }
  void import("./db")
    .then(({ log }) => log("producer", `Something went wrong behind the scenes, but the studio kept running: ${e.message}`, "error"))
    .catch(() => undefined);
}

export function keepServerAlive() {
  if (g.__reelhouseCrashGuard) return;
  g.__reelhouseCrashGuard = true;
  process.on("uncaughtException", (err) => record("Uncaught error", err));
  process.on("unhandledRejection", (err) => record("Unhandled error", err));
}
