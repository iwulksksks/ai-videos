// Optional: Hatch uploads finished videos to YouTube as Shorts with Google's official YouTube Data API.
// Off unless YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET are set and you connect a channel.
import crypto from "node:crypto";
import fs from "node:fs";
import { getMeta, setMeta } from "./settings";
import type { Story } from "./story";

const AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
const TOKEN_URL = "https://oauth2.googleapis.com/token";
const UPLOAD_URL = "https://www.googleapis.com/upload/youtube/v3/videos";
const SCOPES = "https://www.googleapis.com/auth/youtube.upload";

export type YouTubeMode = "off" | "private" | "unlisted" | "public";
const MODES: YouTubeMode[] = ["off", "private", "unlisted", "public"];

type Tokens = { access_token: string; refresh_token: string; expires_at: number };

function clientId() {
  return process.env.YOUTUBE_CLIENT_ID ?? "";
}
function clientSecret() {
  return process.env.YOUTUBE_CLIENT_SECRET ?? "";
}

export function youtubeConfigured(): boolean {
  return Boolean(clientId() && clientSecret());
}

export function redirectUri(origin: string): string {
  return process.env.YOUTUBE_REDIRECT_URI || `${origin}/api/youtube/callback`;
}

function loadTokens(): Tokens | null {
  const raw = getMeta("youtube_tokens");
  return raw ? (JSON.parse(raw) as Tokens) : null;
}

function saveTokens(t: Tokens | null) {
  setMeta("youtube_tokens", t ? JSON.stringify(t) : "");
}

export function youtubeMode(): YouTubeMode {
  const m = getMeta("youtube_mode") as YouTubeMode;
  return MODES.includes(m) ? m : "off";
}

export function setYouTubeMode(m: YouTubeMode) {
  if (MODES.includes(m)) setMeta("youtube_mode", m);
}

export function youtubeAutoPost(): boolean {
  return youtubeConfigured() && youtubeMode() !== "off" && loadTokens() !== null;
}

export function youtubeStatus() {
  return {
    configured: youtubeConfigured(),
    connected: loadTokens() !== null,
    mode: youtubeMode(),
    uploadsToday: uploadsToday(),
  };
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

function uploadsToday(): number {
  const raw = getMeta("youtube_uploads");
  if (!raw) return 0;
  const [day, n] = raw.split(":");
  return day === today() ? Number(n) || 0 : 0;
}

export function authorizeUrl(origin: string): string {
  const state = crypto.randomBytes(16).toString("hex");
  setMeta("youtube_state", state);
  const p = new URLSearchParams({
    client_id: clientId(),
    redirect_uri: redirectUri(origin),
    response_type: "code",
    scope: SCOPES,
    access_type: "offline", // gives a refresh token so Hatch can keep uploading
    prompt: "consent",
    include_granted_scopes: "true",
    state,
  });
  return `${AUTH_URL}?${p.toString()}`;
}

async function tokenRequest(body: Record<string, string>) {
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_id: clientId(), client_secret: clientSecret(), ...body }),
  });
  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !data.access_token) throw new Error(data.error_description || data.error || `Google answered ${res.status}`);
  return data as { access_token: string; refresh_token?: string; expires_in?: number };
}

export async function finishConnect(code: string, state: string, origin: string): Promise<void> {
  if (!state || state !== getMeta("youtube_state")) throw new Error("The sign-in link expired. Please try connecting again.");
  const t = await tokenRequest({ code, grant_type: "authorization_code", redirect_uri: redirectUri(origin) });
  const old = loadTokens();
  const refresh = t.refresh_token || old?.refresh_token;
  if (!refresh) throw new Error("Google didn't give a refresh token. Remove Reelhouse from your Google account's third-party access and connect again.");
  saveTokens({ access_token: t.access_token, refresh_token: refresh, expires_at: Date.now() + (t.expires_in ?? 3600) * 1000 });
  if (youtubeMode() === "off") setYouTubeMode("private");
}

export function disconnect() {
  const t = loadTokens();
  saveTokens(null);
  if (t) {
    // Also revoke at Google; fine if it fails.
    void fetch(`https://oauth2.googleapis.com/revoke?token=${encodeURIComponent(t.refresh_token)}`, { method: "POST" }).catch(() => {});
  }
}

async function accessToken(): Promise<string> {
  const t = loadTokens();
  if (!t) throw new Error("No YouTube channel connected");
  if (t.expires_at - 60_000 > Date.now()) return t.access_token;
  try {
    const fresh = await tokenRequest({ grant_type: "refresh_token", refresh_token: t.refresh_token });
    const next = { ...t, access_token: fresh.access_token, expires_at: Date.now() + (fresh.expires_in ?? 3600) * 1000 };
    saveTokens(next);
    return next.access_token;
  } catch (e) {
    throw new Error(
      `YouTube sign-in expired (${(e as Error).message}). Click Connect YouTube again. ` +
        "Tip: while your Google project is in Testing, sign-ins expire after 7 days.",
    );
  }
}

function googleError(status: number, text: string): Error {
  try {
    const data = JSON.parse(text) as { error?: { message?: string; errors?: { reason?: string }[] } };
    const reason = data.error?.errors?.[0]?.reason;
    if (reason === "quotaExceeded" || reason === "uploadLimitExceeded") {
      return new Error("YouTube's daily upload limit is used up. It resets at midnight Pacific time.");
    }
    return new Error(data.error?.message || `YouTube answered ${status}`);
  } catch {
    return new Error(`YouTube answered ${status}`);
  }
}

/** Upload one finished video as a Short. Returns the video link. */
/** With publishAt (ms), the video is uploaded private and YouTube makes it public at that time. */
export async function postToYouTube(opts: {
  videoFile: string;
  story: Story;
  privacy?: Exclude<YouTubeMode, "off">;
  publishAt?: number;
}): Promise<string> {
  const privacy = opts.publishAt ? "private" : (opts.privacy ?? youtubeMode());
  if (privacy === "off") throw new Error("YouTube posting is off");
  const token = await accessToken();
  const size = fs.statSync(opts.videoFile).size;
  const { story } = opts;
  const tags = story.hashtags.map((h) => `#${h}`).join(" ");
  const title = `${story.title} #Shorts`.slice(0, 100);
  const description = [story.caption !== story.title ? story.caption : story.logline, tags, "#Shorts"].filter(Boolean).join("\n\n");
  const meta = {
    snippet: {
      title,
      description: description.slice(0, 4900),
      tags: story.hashtags.slice(0, 15),
      categoryId: "1", // Film & Animation
    },
    status: {
      privacyStatus: privacy,
      ...(opts.publishAt ? { publishAt: new Date(opts.publishAt).toISOString() } : {}),
      selfDeclaredMadeForKids: false,
      containsSyntheticMedia: true, // honest label: the story and voices are AI-made
    },
  };

  // Resumable upload: first ask for an upload address, then send the file.
  const start = await fetch(`${UPLOAD_URL}?uploadType=resumable&part=snippet,status`, {
    method: "POST",
    headers: {
      authorization: `Bearer ${token}`,
      "content-type": "application/json; charset=UTF-8",
      "x-upload-content-length": String(size),
      "x-upload-content-type": "video/mp4",
    },
    body: JSON.stringify(meta),
  });
  if (!start.ok) throw googleError(start.status, await start.text());
  const location = start.headers.get("location");
  if (!location) throw new Error("YouTube didn't return an upload address");

  const res = await fetch(location, {
    method: "PUT",
    headers: { "content-type": "video/mp4", "content-length": String(size) },
    body: fs.readFileSync(opts.videoFile),
  });
  const text = await res.text();
  if (!res.ok) throw googleError(res.status, text);
  const video = JSON.parse(text) as { id?: string };
  setMeta("youtube_uploads", `${today()}:${uploadsToday() + 1}`);
  return `https://youtube.com/shorts/${video.id}`;
}
