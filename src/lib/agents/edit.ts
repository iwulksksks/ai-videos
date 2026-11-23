// Edit Bay (Splice): animates everything with Remotion and renders the MP4.
import fs from "node:fs";
import http from "node:http";
import type { AddressInfo } from "node:net";
import os from "node:os";
import path from "node:path";
import { config } from "../config";
import type { Look, MusicMood, Story, StoryStyle, VideoProps } from "../story";
import type { StagedPlan } from "./art";

let bundlePromise: Promise<string> | null = null;

async function getBundle(): Promise<string> {
  if (!bundlePromise) {
    bundlePromise = (async () => {
      const { bundle } = await import("@remotion/bundler");
      return bundle({
        entryPoint: path.join(config.root, "src", "remotion", "index.ts"),
        onProgress: () => undefined,
      });
    })().catch((e) => {
      bundlePromise = null;
      throw e;
    });
  }
  return bundlePromise;
}

const MIME: Record<string, string> = { ".wav": "audio/wav", ".mp3": "audio/mpeg" };

/** A tiny file server so the renderer can fetch this story's audio files. */
function serveFolder(dir: string): Promise<{ url: string; close: () => void }> {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const name = decodeURIComponent((req.url ?? "/").split("?")[0]).replace(/^\/+/, "");
      const file = path.join(dir, path.basename(name));
      if (!name || !fs.existsSync(file)) {
        res.writeHead(404).end();
        return;
      }
      const stat = fs.statSync(file);
      const type = MIME[path.extname(file).toLowerCase()] ?? "application/octet-stream";
      const range = req.headers.range;
      const cors = { "Access-Control-Allow-Origin": "*", "Accept-Ranges": "bytes" };
      if (range) {
        const m = /bytes=(\d*)-(\d*)/.exec(range);
        const start = m && m[1] ? parseInt(m[1], 10) : 0;
        const end = m && m[2] ? parseInt(m[2], 10) : stat.size - 1;
        res.writeHead(206, { ...cors, "Content-Type": type, "Content-Range": `bytes ${start}-${end}/${stat.size}`, "Content-Length": end - start + 1 });
        fs.createReadStream(file, { start, end }).pipe(res);
      } else {
        res.writeHead(200, { ...cors, "Content-Type": type, "Content-Length": stat.size });
        fs.createReadStream(file).pipe(res);
      }
    });
    server.listen(0, "127.0.0.1", () => {
      const port = (server.address() as AddressInfo).port;
      resolve({ url: `http://127.0.0.1:${port}`, close: () => server.close() });
    });
  });
}

export function buildProps(opts: {
  story: Story;
  style: StoryStyle;
  look: Look;
  plan: StagedPlan;
  musicFile: string | null;
  sfxFile?: string | null;
  musicMood: MusicMood;
  baseUrl: string | null;
}): VideoProps {
  const url = (f: string | null) => (f && opts.baseUrl ? `${opts.baseUrl}/${encodeURIComponent(f)}` : null);
  return {
    title: opts.story.title,
    style: opts.style,
    look: opts.look,
    characters: opts.story.characters,
    beats: opts.plan.beats.map(({ narrationFile, lineFile, ...b }) => ({
      ...b,
      narrationAudio: url(narrationFile),
      lineAudio: url(lineFile),
    })),
    musicSrc: url(opts.musicFile),
    sfxSrc: url(opts.sfxFile ?? null),
    musicLoop: !!opts.musicFile && opts.musicFile.endsWith(".mp3"),
    musicMood: opts.musicMood,
    introFrames: opts.plan.introFrames,
    outroFrames: opts.plan.outroFrames,
  };
}

export async function renderVideo(opts: {
  jobDir: string;
  story: Story;
  style: StoryStyle;
  look: Look;
  plan: StagedPlan;
  musicFile: string | null;
  sfxFile?: string | null;
  musicMood: MusicMood;
  outFile: string;
  onProgress?: (p: number) => void;
}): Promise<void> {
  const { renderMedia, selectComposition } = await import("@remotion/renderer");
  const serveUrl = await getBundle();
  const server = await serveFolder(opts.jobDir);
  try {
    const inputProps = buildProps({ ...opts, baseUrl: server.url });
    const browserExecutable = config.browserExecutable ?? undefined;
    const composition = await selectComposition({ serveUrl, id: "Story", inputProps, browserExecutable });
    let last = -1;
    await renderMedia({
      composition,
      serveUrl,
      codec: "h264",
      outputLocation: opts.outFile,
      inputProps,
      browserExecutable,
      crf: 22,
      concurrency: Math.max(1, os.cpus().length),
      imageFormat: "jpeg",
      jpegQuality: 88,
      onProgress: ({ progress }) => {
        const pct = Math.round(progress * 100);
        if (pct !== last) {
          last = pct;
          opts.onProgress?.(progress);
        }
      },
    });
  } finally {
    server.close();
  }
}
