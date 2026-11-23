// Shipping Dock (Hatch): saves the finished story to output/<date>_<id>_<title>/.
import fs from "node:fs";
import path from "node:path";
import { config } from "../config";
import type { Story } from "../story";

export function slug(t: string): string {
  return (
    t
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 50) || "story"
  );
}

export function outputFolder(id: number | string, title: string): string {
  const date = new Date().toISOString().slice(0, 10);
  return path.join(config.outputDir, `${date}_${id}_${slug(title)}`);
}

export function shipStory(opts: { renderedFile: string; story: Story; folder: string; extra?: Record<string, unknown> }): string {
  fs.mkdirSync(opts.folder, { recursive: true });
  const video = path.join(opts.folder, "video.mp4");
  fs.copyFileSync(opts.renderedFile, video);
  const tags = opts.story.hashtags.map((h) => `#${h.replace(/^#/, "").replace(/\s+/g, "")}`).join(" ");
  fs.writeFileSync(path.join(opts.folder, "caption.txt"), tags ? `${opts.story.caption}\n\n${tags}\n` : `${opts.story.caption}\n`);
  fs.writeFileSync(path.join(opts.folder, "story.json"), JSON.stringify({ ...opts.story, ...opts.extra }, null, 2));
  return opts.folder;
}
