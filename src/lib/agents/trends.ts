// Trend Lookout (Juno): reads top-of-week posts from Reddit and Google Trends, then groups them into themes.
import { config } from "../config";
import { getDb, log } from "../db";
import { getSettings } from "../settings";
import type { Theme } from "../story";
import { writeThemes } from "../writers";

export type TrendReport = {
  themes: Theme[];
  sources: { name: string; items: string[] }[];
  engine: string;
  offline: boolean;
};

const UA = "Reelhouse/1.0 (story trend reader)";
const TWELVE_HOURS = 12 * 60 * 60 * 1000;

async function reddit(sub: string): Promise<string[]> {
  const res = await fetch(`https://www.reddit.com/r/${encodeURIComponent(sub)}/top.json?t=week&limit=15`, {
    headers: { "user-agent": UA },
    signal: AbortSignal.timeout(10000),
  });
  if (!res.ok) throw new Error(`r/${sub} answered ${res.status}`);
  const data = (await res.json()) as { data?: { children?: { data?: { title?: string; over_18?: boolean } }[] } };
  return (data.data?.children ?? [])
    .map((c) => c.data)
    .filter((d): d is { title: string; over_18?: boolean } => !!d?.title && !d.over_18)
    .map((d) => d.title.slice(0, 160));
}

async function googleTrends(url: string): Promise<string[]> {
  const res = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Google Trends answered ${res.status}`);
  const xml = await res.text();
  return [...xml.matchAll(/<item>[\s\S]*?<title>(?:<!\[CDATA\[)?([\s\S]*?)(?:\]\]>)?<\/title>/g)].map((m) => m[1].trim()).slice(0, 20);
}

/** Wikipedia's "Did you know..." feed: short surprising true facts. */
async function wikipediaDyk(): Promise<string[]> {
  const url = "https://en.wikipedia.org/w/api.php?action=featuredfeed&feed=didyouknow&feedformat=atom";
  const res = await fetch(url, { headers: { "user-agent": UA }, signal: AbortSignal.timeout(10000) });
  if (!res.ok) throw new Error(`Wikipedia answered ${res.status}`);
  const xml = await res.text();
  const latest = /<entry>[\s\S]*?<summary[^>]*>([\s\S]*?)<\/summary>/.exec(xml)?.[1] ?? "";
  const html = latest.replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&quot;/g, '"').replace(/&amp;/g, "&");
  return [...html.matchAll(/<li>([\s\S]*?)<\/li>/g)]
    .map((m) => m[1].replace(/<[^>]+>/g, "").replace(/\s+/g, " ").trim())
    .filter((t) => t.length > 20)
    .slice(0, 12);
}

export function latestReport(): { report: TrendReport; created_at: string } | null {
  const row = getDb().prepare("SELECT report_json, created_at FROM trends ORDER BY id DESC LIMIT 1").get() as
    | { report_json: string; created_at: string }
    | undefined;
  if (!row) return null;
  return { report: JSON.parse(row.report_json) as TrendReport, created_at: row.created_at };
}

export function trendsDue(): boolean {
  const last = latestReport();
  if (!last) return true;
  return Date.now() - new Date(last.created_at + "Z").getTime() > TWELVE_HOURS;
}

export async function scoutTrends(force = false): Promise<TrendReport | null> {
  if (!force && !trendsDue()) return latestReport()?.report ?? null;
  log("trends", "Juno is climbing to the roof to check what's popular this week.");
  const sources: TrendReport["sources"] = [];
  const twist = getSettings().style === "twist";
  if (twist && config.wikipediaDyk) {
    try {
      sources.push({ name: "Wikipedia: Did you know", items: await wikipediaDyk() });
    } catch (e) {
      log("trends", `Couldn't read Wikipedia: ${(e as Error).message}`, "warn");
    }
  }
  for (const sub of twist ? config.factSubreddits : config.subreddits) {
    try {
      sources.push({ name: `r/${sub}`, items: await reddit(sub) });
    } catch (e) {
      log("trends", `Couldn't read r/${sub}: ${(e as Error).message}`, "warn");
    }
  }
  if (config.trendsRss && !twist) {
    try {
      sources.push({ name: "Google Trends", items: await googleTrends(config.trendsRss) });
    } catch (e) {
      log("trends", `Couldn't read Google Trends: ${(e as Error).message}`, "warn");
    }
  }
  const items = sources.flatMap((s) => s.items);
  if (!items.length) {
    const last = latestReport();
    log("trends", last ? "Looks like we're offline. Keeping the last trend report." : "Looks like we're offline and there's no earlier report.", "warn");
    return last?.report ?? null;
  }
  const themes = await writeThemes(items, getSettings().brief);
  const report: TrendReport = { themes: themes.value, sources, engine: themes.engine, offline: false };
  getDb().prepare("INSERT INTO trends (report_json) VALUES (?)").run(JSON.stringify(report));
  log("trends", `Found ${items.length} posts and grouped them into ${themes.value.length} themes (${themes.engine}).`);
  return report;
}
