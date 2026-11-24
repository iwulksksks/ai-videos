// Everything the building needs to draw itself, in one snapshot.
import fs from "node:fs";
import { voiceStatus } from "./audio/piper";
import { latestReport } from "./agents/trends";
import { scoutStatus } from "./agents/scout";
import { config } from "./config";
import { getDb, recentActivity } from "./db";
import { isBusy, waitingIdeas, type JobRow } from "./pipeline";
import { nextRunAt } from "./scheduler";
import { getSettings } from "./settings";
import { tiktokStatus } from "./tiktok";
import { youtubeStatus } from "./youtube";
import type { Story } from "./story";
import { claudeAvailable } from "./writers/claude";
import { ollamaStatusCached } from "./writers/ollama";

export async function studioState() {
  const jobs = getDb().prepare("SELECT * FROM jobs ORDER BY id DESC LIMIT 30").all() as JobRow[];
  const ollama = await ollamaStatusCached();
  const trends = latestReport();
  return {
    settings: getSettings(),
    setup: {
      ollama: { running: ollama.running, modelReady: ollama.modelReady, model: config.ollamaModel },
      claude: claudeAvailable(),
      voice: voiceStatus(),
      music: config.musicOn,
      password: Boolean(config.password),
      outputDir: config.outputDir,
    },
    busy: isBusy(),
    nextRun: nextRunAt(),
    jobs: jobs.map((j) => ({
      id: j.id,
      title: j.title,
      stage: j.stage,
      progress: j.progress,
      attempts: j.attempts,
      style: j.style,
      look: j.look,
      engine: j.engine,
      error: j.error,
      source: j.source,
      created_at: j.created_at,
      updated_at: j.updated_at,
      story: j.story_json ? (JSON.parse(j.story_json) as Story) : null,
      qa: j.qa_json ? (JSON.parse(j.qa_json) as { verdict: string; issues: string[]; editor: string }) : null,
      hasVideo: !!j.output_dir && fs.existsSync(`${j.output_dir}/video.mp4`),
      folder: j.output_dir,
    })),
    ideas: waitingIdeas(),
    activity: recentActivity(80),
    trends: trends ? { ...trends.report, created_at: trends.created_at } : null,
    tiktok: tiktokStatus(),
    youtube: youtubeStatus(),
    scout: scoutStatus(),
  };
}

export type StudioState = Awaited<ReturnType<typeof studioState>>;
