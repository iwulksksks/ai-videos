// Optional: Hatch posts finished videos to TikTok with TikTok's official Content Posting API.
// Off unless TIKTOK_CLIENT_KEY and TIKTOK_CLIENT_SECRET are set and you connect an account.
import crypto from "node:crypto";
import fs from "node:fs";
import { getMeta, setMeta } from "./settings";
import type { Story } from "./story";

const AUTH_URL = "https://www.tiktok.com/v2/auth/authorize/";
const API = "https://open.tiktokapis.com/v2";
const SCOPES = "user.info.basic,video.upload,video.publish";

export type TikTokMode = "off" | "draft" | "direct";

type Tokens = {
  access_token: string;
  refresh_token: string;
  expires_at: number; // ms
  refresh_expires_at: number; // ms
  open_id: string;
  display_name?: string;
};

function clientKey() {
  return process.env.TIKTOK_CLIENT_KEY ?? "";
}
function clientSecret() {
  return process.env.TIKTOK_CLIENT_SECRET ?? "";
}

export function tiktokConfigured(): boolean {
  return Boolean(clientKey() && clientSecret());
}

export function redirectUri(origin: string): string {
  return process.env.TIKTOK_REDIRECT_URI || `${origin}/api/tiktok/callback`;
}

function loadTokens(): Tokens | null {
  const raw = getMeta("tiktok_tokens");
  return raw ? (JSON.parse(raw) as Tokens) : null;
}

function saveTokens(t: Tokens | null) {
  setMeta("tiktok_tokens", t ? JSON.stringify(t) : "");
}

export function tiktokMode(): TikTokMode {
  const m = getMeta("tiktok_mode");
  return m === "draft" || m === "direct" ? m : "off";
}

export function setTikTokMode(m: TikTokMode) {
  setMeta("tiktok_mode", m);
}

export function tiktokAutoPost(): boolean {
  return tiktokConfigured() && tiktokMode() !== "off" && loadTokens() !== null;
}

export function tiktokStatus() {
  const t = loadTokens();
  return {
    configured: tiktokConfigured(),
    connected: Boolean(t && t.refresh_expires_at > Date.now()),
    account: t?.display_name ?? null,
    mode: tiktokMode(),
  };
}

export function authorizeUrl(origin: string): string {
  const state = crypto.randomBytes(16).toString("hex");
  setMeta("tiktok_state", state);
  const p = new URLSearchParams({
    client_key: clientKey(),
    scope: SCOPES,
    response_type: "code",
    redirect_uri: redirectUri(origin),
    state,
  });
  return `${AUTH_URL}?${p.toString()}`;
}

async function tokenRequest(body: Record<string, string>): Promise<Tokens> {
  const res = await fetch(`${API}/oauth/token/`, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ client_key: clientKey(), client_secret: clientSecret(), ...body }),
  });
  const data = (await res.json()) as {
    access_token?: string;
    refresh_token?: string;
    expires_in?: number;
    refresh_expires_in?: number;
    open_id?: string;
    error?: string;
    error_description?: string;
  };
  if (!res.ok || !data.access_token) throw new Error(data.error_description || data.error || `TikTok answered ${res.status}`);
  return {
    access_token: data.access_token,
    refresh_token: data.refresh_token ?? "",
    expires_at: Date.now() + (data.expires_in ?? 86400) * 1000,
    refresh_expires_at: Date.now() + (data.refresh_expires_in ?? 31536000) * 1000,
    open_id: data.open_id ?? "",
  };
}

export async function finishConnect(code: string, state: string, origin: string): Promise<void> {
  if (!state || state !== getMeta("tiktok_state")) throw new Error("The sign-in link expired. Please try connecting again.");
  const t = await tokenRequest({ code, grant_type: "authorization_code", redirect_uri: redirectUri(origin) });
  try {
    const res = await fetch(`${API}/user/info/?fields=display_name`, { headers: { authorization: `Bearer ${t.access_token}` } });
    const data = (await res.json()) as { data?: { user?: { display_name?: string } } };
    t.display_name = data.data?.user?.display_name;
  } catch {
    /* name is optional */
  }
  saveTokens(t);
  if (tiktokMode() === "off") setTikTokMode("draft");
}

export function disconnect() {
  saveTokens(null);
}

async function accessToken(): Promise<string> {
  let t = loadTokens();
  if (!t) throw new Error("No TikTok account connected");
  if (t.expires_at - 60_000 < Date.now()) {
    const fresh = await tokenRequest({ grant_type: "refresh_token", refresh_token: t.refresh_token });
    t = { ...t, ...fresh, display_name: t.display_name };
    saveTokens(t);
  }
  return t.access_token;
}

async function api<T>(pathname: string, token: string, body: unknown): Promise<T> {
  const res = await fetch(`${API}${pathname}`, {
    method: "POST",
    headers: { authorization: `Bearer ${token}`, "content-type": "application/json; charset=UTF-8" },
    body: JSON.stringify(body),
  });
  const data = (await res.json()) as { data?: T; error?: { code?: string; message?: string } };
  if (!res.ok || (data.error && data.error.code !== "ok")) {
    throw new Error(data.error?.message || data.error?.code || `TikTok answered ${res.status}`);
  }
  return data.data as T;
}

/** Upload one finished video. "draft" sends it to your TikTok inbox to post from the app; "direct" posts it. */
export async function postToTikTok(opts: { videoFile: string; story: Story }): Promise<string> {
  const mode = tiktokMode();
  if (mode === "off") throw new Error("TikTok posting is off");
  const token = await accessToken();
  const size = fs.statSync(opts.videoFile).size;
  // TikTok wants chunks between 5 and 64 MB; anything under 64 MB goes up in one piece.
  const CHUNK = 10 * 1024 * 1024;
  const chunkSize = size <= 64 * 1024 * 1024 ? size : CHUNK;
  const total = Math.max(1, Math.floor(size / chunkSize));
  const source_info = { source: "FILE_UPLOAD", video_size: size, chunk_size: chunkSize, total_chunk_count: total };

  let init: { publish_id: string; upload_url: string };
  if (mode === "direct") {
    const creator = await api<{ privacy_level_options?: string[] }>("/post/publish/creator_info/query/", token, {});
    const options = creator.privacy_level_options ?? ["SELF_ONLY"];
    const privacy = options.includes("PUBLIC_TO_EVERYONE") ? "PUBLIC_TO_EVERYONE" : options[0];
    const tags = opts.story.hashtags.map((h) => `#${h}`).join(" ");
    init = await api("/post/publish/video/init/", token, {
      post_info: {
        title: `${opts.story.caption} ${tags}`.slice(0, 2200),
        privacy_level: privacy,
        disable_comment: false,
        disable_duet: false,
        disable_stitch: false,
      },
      source_info,
    });
  } else {
    init = await api("/post/publish/inbox/video/init/", token, { source_info });
  }

  const fd = fs.openSync(opts.videoFile, "r");
  try {
    for (let i = 0; i < total; i++) {
      const start = i * chunkSize;
      const end = i === total - 1 ? size - 1 : start + chunkSize - 1;
      const buf = Buffer.alloc(end - start + 1);
      fs.readSync(fd, buf, 0, buf.length, start);
      const res = await fetch(init.upload_url, {
        method: "PUT",
        headers: { "content-type": "video/mp4", "content-range": `bytes ${start}-${end}/${size}`, "content-length": String(buf.length) },
        body: buf,
      });
      if (!res.ok) throw new Error(`Upload failed with ${res.status}`);
    }
  } finally {
    fs.closeSync(fd);
  }
  return mode === "direct" ? `posted, id ${init.publish_id}` : `sent to your TikTok inbox, id ${init.publish_id}`;
}
