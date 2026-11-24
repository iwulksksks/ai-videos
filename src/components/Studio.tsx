"use client";
// The whole app screen: the building on the left, the selected room's panel on the right.
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { StudioState } from "@/lib/state";
import { Building } from "./Building";
import { RoomPanel } from "./RoomPanel";
import { ROOMS, STAGE_LABEL, type RoomId } from "./rooms";

const HOW_TO_FIX =
  "Check that the black Reelhouse window is still open. If it closed, double-click Start Reelhouse again.";
const OFFLINE = `The studio isn't answering, so this page can't update. ${HOW_TO_FIX} This message goes away by itself once the studio is back.`;
const SLOW =
  "The studio is very busy (usually while the AI writes a story) and is slow to answer. Nothing is wrong: the page will catch up by itself.";

/** What each button's request is for, in plain words, for error messages. */
function describe(url: string, method: string): string {
  if (url.startsWith("/api/settings")) return "save your settings";
  if (url.startsWith("/api/produce")) return "start a story";
  if (url.startsWith("/api/trends")) return "check trends";
  if (url.startsWith("/api/ideas")) return method === "DELETE" ? "remove that pitch" : "pitch ideas";
  if (url.startsWith("/api/scout")) return "update the niche scout";
  if (url.startsWith("/api/jobs")) return "retry that story";
  if (url.startsWith("/api/tiktok")) return "reach TikTok";
  if (url.startsWith("/api/youtube")) return "reach YouTube";
  return "do that";
}

/** The studio is up but took too long to answer. */
function isTimeout(e: unknown): boolean {
  return (e as Error)?.name === "AbortError" || (e as Error)?.name === "TimeoutError";
}

/** A browser "Failed to fetch" means the request never got an answer at all. */
function isNetworkError(e: unknown): boolean {
  return e instanceof TypeError || (e as Error)?.name === "AbortError" || (e as Error)?.name === "TimeoutError";
}

export function Studio() {
  const [state, setState] = useState<StudioState | null>(null);
  const [selected, setSelected] = useState<RoomId | null>("producer");
  const [pending, setPending] = useState<Partial<Record<RoomId, boolean>>>({});
  const [error, setError] = useState<string | null>(null);
  const [offline, setOffline] = useState<false | "slow" | "down">(false);
  const misses = useRef(0);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store", signal: AbortSignal.timeout(30000) });
      if (!res.ok) throw new Error(`The studio couldn't load its status (error ${res.status}). The black Reelhouse window shows why.`);
      setState(await res.json());
      misses.current = 0;
      setOffline(false);
    } catch (e) {
      misses.current += 1;
      // One missed check is normal while the computer is busy rendering; only speak up when it keeps happening.
      if (misses.current < 3) return;
      if (isTimeout(e)) setOffline("slow");
      else if (isNetworkError(e)) setOffline("down");
      else setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    const room = new URLSearchParams(window.location.search).get("room");
    if (room && ROOMS.some((r) => r.id === room)) setSelected(room as RoomId);
    // Ask again 2 seconds after each answer, never while a question is still open, so a busy
    // computer doesn't get a growing pile of unanswered questions.
    let stopped = false;
    let t: ReturnType<typeof setTimeout>;
    const loop = async () => {
      await refresh();
      if (!stopped) t = setTimeout(() => void loop(), 2000);
    };
    void loop();
    return () => {
      stopped = true;
      clearTimeout(t);
    };
  }, [refresh]);

  /** Run an action and mark a room busy while it runs. */
  const act = useCallback(
    async (room: RoomId, url: string, body?: unknown, method = "POST") => {
      setPending((p) => ({ ...p, [room]: true }));
      try {
        const res = await fetch(url, {
          method,
          headers: { "content-type": "application/json" },
          body: body === undefined ? undefined : JSON.stringify(body),
        });
        const data = await res.json().catch(() => ({}));
        if (!res.ok) {
          const why = (data as { error?: string }).error ?? `error ${res.status}`;
          throw new Error(`Couldn't ${describe(url, method)}: ${why}`);
        }
        setError(null);
        await refresh();
        return data;
      } catch (e) {
        setError(isNetworkError(e) ? `Couldn't ${describe(url, method)} because the studio isn't answering. ${HOW_TO_FIX}` : (e as Error).message);
        return null;
      } finally {
        setPending((p) => ({ ...p, [room]: false }));
      }
    },
    [refresh],
  );

  const busy = useMemo(() => {
    const b: Partial<Record<RoomId, boolean>> = { ...pending };
    const active = state?.jobs.find((j) => ["script", "qa", "voice", "art", "edit", "ship"].includes(j.stage));
    if (active) b[active.stage as RoomId] = true;
    if (state?.settings.autopilot) b.producer = b.producer || !!active;
    return b;
  }, [pending, state]);

  const hour = new Date().getHours();
  const night = hour < 6 || hour >= 19;
  const active = state?.jobs.find((j) => !["done", "failed", "skipped"].includes(j.stage));

  return (
    <main className="studio">
      <section className="left">
        <header className="topbar">
          <h1>Reelhouse</h1>
          <span className="tag">{state?.settings.autopilot ? "Autopilot on" : "Autopilot off"}</span>
          {active && (
            <span className="tag live">
              {STAGE_LABEL[active.stage]}: {active.title}
              {active.stage === "edit" ? ` ${Math.round(active.progress * 100)}%` : ""}
            </span>
          )}
        </header>
        <Building busy={busy} selected={selected} onSelect={setSelected} night={night} />
        <p className="hint">Click any room to see what its worker is doing.</p>
      </section>
      <section className="right">
        {offline && <div className="error">{offline === "slow" ? SLOW : OFFLINE}</div>}
        {error && (
          <div className="error" onClick={() => setError(null)}>
            {error} <small>(click to hide)</small>
          </div>
        )}
        {!state ? (
          <div className="panel">Opening the studio…</div>
        ) : selected ? (
          <RoomPanel room={selected} state={state} act={act} pending={pending} />
        ) : null}
      </section>
    </main>
  );
}
