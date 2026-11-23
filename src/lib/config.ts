// Reads settings from .env.local (Next.js loads it automatically; scripts load it via dotenv-like helper).
import path from "node:path";

function env(name: string, fallback = ""): string {
  const v = process.env[name];
  return v === undefined || v === "" ? fallback : v;
}

export const config = {
  root: process.cwd(),
  dataDir: path.join(process.cwd(), "data"),
  outputDir: path.resolve(env("REELHOUSE_OUTPUT_DIR", "./output")),
  musicDir: path.join(process.cwd(), "music"),
  voicesDir: path.join(process.cwd(), "voices"),
  ollamaHost: env("OLLAMA_HOST", "http://127.0.0.1:11434").replace(/\/$/, ""),
  ollamaModel: env("OLLAMA_MODEL", "qwen2.5:7b"),
  anthropicKey: env("ANTHROPIC_API_KEY"),
  claudeModel: env("CLAUDE_MODEL", "claude-opus-5-5"),
  forcedEngine: env("REELHOUSE_ENGINE") as "" | "ollama" | "claude" | "demo",
  forcedStyle: env("REELHOUSE_STYLE") as "" | "hook" | "cozy" | "gossip",
  narratorVoice: env("PIPER_NARRATOR_VOICE", "en_US-lessac-medium"),
  characterVoice: env("PIPER_CHARACTER_VOICE", "en_US-libritts_r-medium"),
  voiceOn: env("REELHOUSE_VOICE", "1") !== "0",
  musicOn: env("REELHOUSE_MUSIC", "1") !== "0",
  subreddits: env("REELHOUSE_SUBREDDITS", "aivideo,animation,WritingPrompts,shortstories")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  // Twist Tale idea sources: real tricks, facts and history.
  factSubreddits: env("REELHOUSE_FACT_SUBREDDITS", "todayilearned,explainlikeimfive,AskHistorians")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean),
  wikipediaDyk: env("REELHOUSE_WIKIPEDIA_DYK", "1") !== "0",
  trendsRss: process.env.REELHOUSE_TRENDS_RSS ?? "https://trends.google.com/trending/rss?geo=US",
  browserExecutable: env("REMOTION_BROWSER") || null,
  password: env("REELHOUSE_PASSWORD"),
  user: env("REELHOUSE_USER", "reelhouse"),
};
