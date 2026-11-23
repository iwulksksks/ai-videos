// Niche Scout (Kit): watches story channels like ours and finds which topics and hooks are working right now.
// Free by default: reads each channel's public YouTube feed (no key). With YOUTUBE_API_KEY it also searches
// YouTube for this week's most-viewed Shorts on our keywords. Results are inspiration only, never copied.
import { log } from "../db";
import { getMeta, getSettings, setMeta } from "../settings";
import type { ScoutInsights } from "../story";
import { writeScout } from "../writers";

export type ScoutChannel = { id: string; name: string; input: string };
export type ScoutVideo = {
  title: string;
  channel: string;
  url: string;
  views: number;
  published: string;
  viewsPerDay: number;
  source: "channel" | "search";
};
export type ScoutReport = ScoutInsights & {
  videos: ScoutVideo[];
  engine: string;
  created_at: string;
  notes: string[];
};

const UA = "Mozilla/5.0 (Reelhouse niche scout)";
const DAY = 24 * 60 * 60 * 1000;
const DEFAULT_KEYWORDS = ["clever trick story", "history facts animation", "how it works short story"];

export function scoutChannels(): ScoutChannel[] {
  const raw = getMeta("scout_channels");
  return raw ? (JSON.parse(raw) as ScoutChannel[]) : [];
}

export function scoutKeywords(): string[] {
  const raw = getMeta("scout_keywords");
  return raw ? (JSON.parse(raw) as string[]) : DEFAULT_KEYWORDS;
}

export function setScoutKeywords(words: string[]) {
  setMeta("scout_keywords", JSON.stringify(words.map((w) => w.trim()).filter(Boolean).slice(0, 5)));
}

export function latestScout(): ScoutReport | null {
  const raw = getMeta("scout_report");
  return raw ? (JSON.parse(raw) as ScoutReport) : null;
}

export function scoutStatus() {
  return {
    channels: scoutChannels(),
    keywords: scoutKeywords(),
    searchOn: Boolean(process.env.YOUTUBE_API_KEY),
    report: latestScout(),
  };
}

function decode(s: string) {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">");
}

async function get(url: string): Promise<string> {
  const res = await fetch(url, { headers: { "user-agent": UA, "accept-language": "en" }, signal: AbortSignal.timeout(12000) });
  if (!res.ok) throw new Error(`answered ${res.status}`);
  return res.text();
}

/** Turn a channel link, @handle or channel ID into a channel ID. */
async function resolveChannelId(input: string): Promise<string> {
  const direct = /(UC[\w-]{22})/.exec(input);
  if (direct) return direct[1];
  const s = input.trim();
  const url = /^https?:\/\//.test(s)
    ? s
    : s.startsWith("@")
      ? `https://www.youtube.com/${s}`
      : `https://www.youtube.com/@${s.replace(/\s+/g, "")}`;
  const html = await get(url);
  const id =
    /<link rel="canonical" href="https:\/\/www\.youtube\.com\/channel\/(UC[\w-]{22})"/.exec(html)?.[1] ??
    /"externalId":"(UC[\w-]{22})"/.exec(html)?.[1] ??
    /"channelId":"(UC[\w-]{22})"/.exec(html)?.[1];
  if (!id) throw new Error("couldn't find that channel");
  return id;
}

async function channelFeed(id: string): Promise<{ name: string; videos: ScoutVideo[] }> {
  const xml = await get(`https://www.youtube.com/feeds/videos.xml?channel_id=${id}`);
  const name = decode(/<title>([\s\S]*?)<\/title>/.exec(xml)?.[1] ?? id);
  const videos: ScoutVideo[] = [];
  for (const m of xml.matchAll(/<entry>([\s\S]*?)<\/entry>/g)) {
    const e = m[1];
    const vid = /<yt:videoId>([^<]+)<\/yt:videoId>/.exec(e)?.[1];
    const title = decode(/<title>([\s\S]*?)<\/title>/.exec(e)?.[1] ?? "");
    const published = /<published>([^<]+)<\/published>/.exec(e)?.[1] ?? "";
    const views = Number(/<media:statistics views="(\d+)"/.exec(e)?.[1] ?? 0);
    if (!vid || !title) continue;
    const days = Math.max(1, (Date.now() - new Date(published).getTime()) / DAY);
    videos.push({ title, channel: name, url: `https://youtube.com/shorts/${vid}`, views, published, viewsPerDay: Math.round(views / days), source: "channel" });
  }
  return { name, videos };
}

export async function addScoutChannel(input: string): Promise<ScoutChannel> {
  const id = await resolveChannelId(input);
  const list = scoutChannels();
  const found = list.find((c) => c.id === id);
  if (found) return found;
  const feed = await channelFeed(id);
  const ch = { id, name: feed.name, input: input.trim() };
  setMeta("scout_channels", JSON.stringify([...list, ch].slice(0, 20)));
  log("scout", `Kit is now watching ${ch.name}.`);
  return ch;
}

export function removeScoutChannel(id: string) {
  setMeta("scout_channels", JSON.stringify(scoutChannels().filter((c) => c.id !== id)));
}

/** Optional: this week's most-viewed short videos for our keywords (YouTube Data API key, about 100 quota units per keyword). */
async function searchShorts(keywords: string[], key: string): Promise<ScoutVideo[]> {
  const after = new Date(Date.now() - 14 * DAY).toISOString();
  const ids = new Map<string, string>();
  for (const q of keywords.slice(0, 3)) {
    const p = new URLSearchParams({ part: "snippet", type: "video", videoDuration: "short", order: "viewCount", publishedAfter: after, maxResults: "15", q, key, relevanceLanguage: "en" });
    const data = JSON.parse(await get(`https://www.googleapis.com/youtube/v3/search?${p}`)) as { items?: { id?: { videoId?: string } }[] };
    for (const it of data.items ?? []) if (it.id?.videoId) ids.set(it.id.videoId, q);
  }
  if (!ids.size) return [];
  const p = new URLSearchParams({ part: "snippet,statistics", id: [...ids.keys()].slice(0, 50).join(","), key });
  const data = JSON.parse(await get(`https://www.googleapis.com/youtube/v3/videos?${p}`)) as {
    items?: { id: string; snippet?: { title?: string; channelTitle?: string; publishedAt?: string }; statistics?: { viewCount?: string } }[];
  };
  return (data.items ?? []).map((v) => {
    const published = v.snippet?.publishedAt ?? "";
    const views = Number(v.statistics?.viewCount ?? 0);
    const days = Math.max(1, (Date.now() - new Date(published).getTime()) / DAY);
    return { title: decode(v.snippet?.title ?? ""), channel: v.snippet?.channelTitle ?? "", url: `https://youtube.com/shorts/${v.id}`, views, published, viewsPerDay: Math.round(views / days), source: "search" as const };
  });
}

export function scoutDue(): boolean {
  const r = latestScout();
  return !r || Date.now() - new Date(r.created_at).getTime() > DAY;
}

export async function runScout(force = false): Promise<ScoutReport | null> {
  if (!force && !scoutDue()) return latestScout();
  const channels = scoutChannels();
  const key = process.env.YOUTUBE_API_KEY ?? "";
  if (!channels.length && !key) {
    if (force) log("scout", "Kit has no channels to watch yet. Add a few story channels like ours in the Niche Scout room.", "warn");
    return latestScout();
  }
  log("scout", "Kit is checking what's working on story channels like ours.");
  const notes: string[] = [];
  let videos: ScoutVideo[] = [];
  for (const c of channels) {
    try {
      videos.push(...(await channelFeed(c.id)).videos);
    } catch (e) {
      notes.push(`Couldn't read ${c.name}: ${(e as Error).message}`);
    }
  }
  if (key) {
    try {
      videos.push(...(await searchShorts(scoutKeywords(), key)));
    } catch (e) {
      notes.push(`YouTube search failed: ${(e as Error).message}`);
    }
  }
  // Recent videos only, ranked by views per day, so fresh hits beat old classics.
  const seen = new Set<string>();
  videos = videos
    .filter((v) => Date.now() - new Date(v.published).getTime() < 60 * DAY && !seen.has(v.url) && seen.add(v.url))
    .sort((a, b) => b.viewsPerDay - a.viewsPerDay)
    .slice(0, 30);
  notes.forEach((n) => log("scout", n, "warn"));
  if (!videos.length) {
    log("scout", "Kit couldn't find any recent videos (offline?). Keeping the last report.", "warn");
    return latestScout();
  }
  const insights = await writeScout(videos, getSettings().brief);
  const report: ScoutReport = { ...insights.value, videos, engine: insights.engine, created_at: new Date().toISOString(), notes };
  setMeta("scout_report", JSON.stringify(report));
  log("scout", `Kit studied ${videos.length} recent videos and found ${report.topics.length} topics and ${report.hooks.length} hook patterns (${insights.engine}).`);
  return report;
}
