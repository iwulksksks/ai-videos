"use client";
// The whole app screen: the building on the left, the selected room's panel on the right.
import React, { useCallback, useEffect, useMemo, useState } from "react";
import type { StudioState } from "@/lib/state";
import { Building } from "./Building";
import { RoomPanel } from "./RoomPanel";
import { ROOMS, STAGE_LABEL, type RoomId } from "./rooms";

export function Studio() {
  const [state, setState] = useState<StudioState | null>(null);
  const [selected, setSelected] = useState<RoomId | null>("producer");
  const [pending, setPending] = useState<Partial<Record<RoomId, boolean>>>({});
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/state", { cache: "no-store" });
      if (!res.ok) throw new Error(`The studio answered ${res.status}`);
      setState(await res.json());
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }, []);

  useEffect(() => {
    const room = new URLSearchParams(window.location.search).get("room");
    if (room && ROOMS.some((r) => r.id === room)) setSelected(room as RoomId);
    void refresh();
    const t = setInterval(() => void refresh(), 2000);
    return () => clearInterval(t);
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
        if (!res.ok) throw new Error((data as { error?: string }).error ?? `Error ${res.status}`);
        await refresh();
        return data;
      } catch (e) {
        setError((e as Error).message);
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
