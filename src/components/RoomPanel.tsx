"use client";
// The panel for each room: what the worker is doing, plus its controls.
import React, { useEffect, useState } from "react";
import type { StudioState } from "@/lib/state";
import { ROOMS, STAGE_LABEL, type RoomId } from "./rooms";

type Act = (room: RoomId, url: string, body?: unknown, method?: string) => Promise<unknown>;
type Job = StudioState["jobs"][number];
type Story = NonNullable<Job["story"]>;

function when(sqlTime: string) {
  const d = new Date(sqlTime.replace(" ", "T") + "Z");
  return d.toLocaleString(undefined, { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

function Log({ state, room }: { state: StudioState; room?: RoomId }) {
  const rows = state.activity.filter((a) => !room || a.room === room).slice(0, room ? 12 : 40);
  if (!rows.length) return <p className="muted">Nothing logged yet.</p>;
  return (
    <ul className="log">
      {rows.map((a) => (
        <li key={a.id} className={a.level}>
          <time>{when(a.created_at)}</time>
          {!room && <b>{ROOMS.find((r) => r.id === a.room)?.agent}: </b>}
          {a.message}
        </li>
      ))}
    </ul>
  );
}

function Check({ ok, children }: { ok: boolean; children: React.ReactNode }) {
  return (
    <li className={ok ? "ok" : "no"}>
      <span>{ok ? "✓" : "!"}</span> {children}
    </li>
  );
}

function Producer({ state, act, pending }: { state: StudioState; act: Act; pending: Partial<Record<RoomId, boolean>> }) {
  const [form, setForm] = useState(state.settings);
  const [dirty, setDirty] = useState(false);
  useEffect(() => {
    if (!dirty) setForm(state.settings);
  }, [state.settings, dirty]);
  const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => {
    setForm((f) => ({ ...f, [k]: v }));
    setDirty(true);
  };
  const save = async (patch?: Partial<typeof form>) => {
    // Only forget the typed-in changes once the studio has really saved them.
    // If saving fails, the form keeps what was typed so nothing jumps back.
    const saved = await act("producer", "/api/settings", patch ?? form);
    if (saved) setDirty(false);
  };
  const s = state.setup;
  return (
    <>
      <div className="card">
        <label className="switch">
          <input type="checkbox" checked={state.settings.autopilot} onChange={(e) => void save({ ...form, autopilot: e.target.checked })} />
          <span>Autopilot</span>
        </label>
        <p className="muted">
          {state.settings.autopilot
            ? `Making ${state.settings.storiesPerDay} stories a day.${state.nextRun ? ` Next one around ${new Date(state.nextRun).toLocaleTimeString(undefined, { hour: "numeric", minute: "2-digit" })}.` : ""}`
            : "Switch on and the studio makes stories by itself, spread across the day."}
        </p>
        <label>
          Channel brief
          <textarea rows={3} value={form.brief} onChange={(e) => set("brief", e.target.value)} />
        </label>
        <div className="row">
          <label>
            Stories per day
            <input type="number" min={1} max={24} value={form.storiesPerDay} onChange={(e) => set("storiesPerDay", Number(e.target.value))} />
          </label>
          <label>
            Story style
            <select value={form.style} onChange={(e) => set("style", e.target.value as typeof form.style)}>
              <option value="twist">Twist Tale (60s, real trick, loops)</option>
              <option value="hook">Hook (60-90s, underdog, Part 2?)</option>
              <option value="cozy">Cozy (30-45s, gentle tale)</option>
              <option value="gossip">Town Gossip (60s, Brickbury comedy, loops)</option>
              <option value="whatif">What If ("what if you..." with a ticking counter, real facts)</option>
              <option value="country">Country Story (Pip's trip: a real fun fact about a country, told as a story)</option>
              <option value="pov">POV Story (first person: the real reason behind a strange town rule)</option>
            </select>
          </label>
        </div>
        <label>
          Video length
          <select value={form.length} onChange={(e) => set("length", e.target.value as typeof form.length)}>
            <option value="long">Long, about 2.5 min, for YouTube, plus 2 or 3 best-moment clips for TikTok</option>
            <option value="short">Short, about 1 min, the same video everywhere</option>
          </select>
        </label>
        <div className="row">
          <label>
            Look
            <select value={form.look} onChange={(e) => set("look", e.target.value as typeof form.look)}>
              <option value="2.5d">2.5D (depth, lighting, camera)</option>
              <option value="flat">Flat 2D</option>
            </select>
          </label>
          <label>
            Story writer
            <select value={form.engine} onChange={(e) => set("engine", e.target.value as typeof form.engine)}>
              <option value="auto">Automatic (Ollama, then Claude, then demo)</option>
              <option value="ollama">Ollama (free, on this computer)</option>
              <option value="claude">Claude (needs an API key)</option>
              <option value="demo">Demo templates</option>
            </select>
          </label>
        </div>
        <div className="buttons">
          <button disabled={!dirty || pending.producer} onClick={() => void save()}>
            Save settings
          </button>
          <button className="secondary" disabled={pending.producer} onClick={() => void act("producer", "/api/produce", {})}>
            Make a story now
          </button>
        </div>
      </div>
      <div className="card">
        <h3>Studio setup</h3>
        <ul className="checks">
          <Check ok={s.ollama.running}>Ollama is {s.ollama.running ? "running" : "not running (install it from ollama.com and open it)"}</Check>
          <Check ok={s.ollama.modelReady}>
            Story model {s.ollama.model} {s.ollama.modelReady ? "is downloaded" : "is not downloaded (run: npm run setup:ollama)"}
          </Check>
          <Check ok={s.claude}>Claude {s.claude ? "is available" : "is not set up (optional)"}</Check>
          <Check ok={s.voice.enabled && s.voice.piper && s.voice.narrator}>
            Voices {!s.voice.enabled ? "are switched off" : s.voice.piper && s.voice.narrator ? "are ready" : "are not installed (run: npm run setup:voice)"}
          </Check>
          <Check ok={s.music}>Music {s.music ? "is on" : "is off"}</Check>
        </ul>
        <p className="muted">Videos are saved in {s.outputDir}</p>
      </div>
      <div className="card">
        <h3>Activity log</h3>
        <Log state={state} />
      </div>
    </>
  );
}

function Trends({ state, act, pending }: { state: StudioState; act: Act; pending: Partial<Record<RoomId, boolean>> }) {
  const t = state.trends;
  return (
    <>
      <div className="card">
        <p className="muted">{t ? `Last checked ${when(t.created_at)} (${t.engine}).` : "No trend report yet."} Juno checks at most every 12 hours on autopilot.</p>
        <button disabled={pending.trends} onClick={() => void act("trends", "/api/trends")}>
          {pending.trends ? "Checking…" : "Check trends now"}
        </button>
      </div>
      {t && (
        <>
          <div className="card">
            <h3>Story themes</h3>
            <ul className="list">
              {t.themes.map((th) => (
                <li key={th.theme}>
                  <b>{th.theme}</b>
                  <p className="muted">{th.why}</p>
                  <button className="small" disabled={pending.research} onClick={() => void act("research", "/api/ideas", th)}>
                    Pitch stories from this
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h3>What people are talking about</h3>
            {t.sources.map((src) => (
              <details key={src.name}>
                <summary>
                  {src.name} ({src.items.length})
                </summary>
                <ul className="mini">
                  {src.items.slice(0, 15).map((i, n) => (
                    <li key={n}>{i}</li>
                  ))}
                </ul>
              </details>
            ))}
          </div>
        </>
      )}
    </>
  );
}

function Scout({ state, act, pending }: { state: StudioState; act: Act; pending: Partial<Record<RoomId, boolean>> }) {
  const sc = state.scout;
  const r = sc.report;
  const [add, setAdd] = useState("");
  const [keywords, setKeywords] = useState(sc.keywords.join(", "));
  return (
    <>
      <div className="card">
        <h3>Channels Kit watches</h3>
        <p className="muted">Add story channels like ours (paste a YouTube channel link or @name). Kit reads their public feeds for free, finds which recent videos are doing best, and passes the winning topics and hook styles to the Research Desk. Stories stay our own: nothing is copied.</p>
        {!sc.channels.length && <p className="muted">No channels yet.</p>}
        <ul className="mini">
          {sc.channels.map((c) => (
            <li key={c.id}>
              {c.name}{" "}
              <button className="small secondary" onClick={() => void act("scout", "/api/scout", { remove: c.id })}>
                Remove
              </button>
            </li>
          ))}
        </ul>
        <label>
          Add a channel
          <input placeholder="https://www.youtube.com/@channelname" value={add} onChange={(e) => setAdd(e.target.value)} />
        </label>
        <button
          className="small"
          disabled={!add.trim() || pending.scout}
          onClick={() => void act("scout", "/api/scout", { add }).then((d) => d && setAdd(""))}
        >
          Add channel
        </button>
      </div>
      <div className="card">
        {sc.searchOn ? (
          <>
            <label>
              Also search YouTube for (comma separated)
              <input value={keywords} onChange={(e) => setKeywords(e.target.value)} />
            </label>
            <button className="small secondary" onClick={() => void act("scout", "/api/scout", { keywords: keywords.split(",") })}>
              Save keywords
            </button>
          </>
        ) : (
          <p className="muted">Optional: add YOUTUBE_API_KEY to .env.local and Kit will also search YouTube for this fortnight's most-viewed Shorts on your keywords (see YOUTUBE.md).</p>
        )}
        <p className="muted">{r ? `Last checked ${when(r.created_at.replace("T", " ").slice(0, 19))} (${r.engine}).` : "No report yet."} On autopilot Kit checks once a day.</p>
        <button disabled={pending.scout} onClick={() => void act("scout", "/api/scout", { run: true })}>
          {pending.scout ? "Scouting…" : "Scout now"}
        </button>
      </div>
      {r && (
        <>
          <div className="card">
            <h3>Topics that are working</h3>
            <ul className="list">
              {r.topics.map((t) => (
                <li key={t.theme}>
                  <b>{t.theme}</b>
                  <p className="muted">{t.why}</p>
                  <button className="small" disabled={pending.research} onClick={() => void act("research", "/api/ideas", t)}>
                    Pitch our own stories on this
                  </button>
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <h3>Hooks that are working</h3>
            <ul className="list">
              {r.hooks.map((h) => (
                <li key={h.pattern}>
                  <b>{h.pattern}</b>
                  <p className="muted">{h.why}</p>
                </li>
              ))}
            </ul>
          </div>
          <div className="card">
            <details>
              <summary>Top recent videos ({r.videos.length})</summary>
              <ul className="mini">
                {r.videos.map((v) => (
                  <li key={v.url}>
                    <a href={v.url} target="_blank" rel="noreferrer">
                      {v.title}
                    </a>{" "}
                    <span className="muted">
                      {v.channel}, {v.viewsPerDay.toLocaleString()} views/day
                    </span>
                  </li>
                ))}
              </ul>
            </details>
          </div>
        </>
      )}
    </>
  );
}

function Research({ state, act, pending }: { state: StudioState; act: Act; pending: Partial<Record<RoomId, boolean>> }) {
  const [theme, setTheme] = useState("");
  return (
    <>
      <div className="card">
        <label>
          Theme (optional)
          <input placeholder="e.g. a kid whose power everyone laughs at" value={theme} onChange={(e) => setTheme(e.target.value)} />
        </label>
        <button disabled={pending.research} onClick={() => void act("research", "/api/ideas", theme ? { theme } : {})}>
          {pending.research ? "Pitching…" : "Pitch new stories"}
        </button>
      </div>
      <div className="card">
        <h3>Idea board ({state.ideas.length} waiting)</h3>
        {!state.ideas.length && <p className="muted">No pitches waiting. Ask Pip for some.</p>}
        <ul className="list">
          {state.ideas.map((i) => (
            <li key={i.id}>
              <b>{i.title}</b> <span className="pill">{i.genre}</span>
              <p>{i.logline}</p>
              <p className="muted">Twist: {i.twist}</p>
              <div className="buttons">
                <button className="small" onClick={() => void act("producer", "/api/produce", { ideaId: i.id })}>
                  Produce
                </button>
                <button className="small secondary" onClick={() => void act("research", "/api/ideas", { id: i.id }, "DELETE")}>
                  Discard
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </>
  );
}

function StoryView({ story }: { story: Story }) {
  return (
    <div className="story">
      <h3>{story.title}</h3>
      <p className="muted">{story.logline}</p>
      <p>
        {story.characters.map((c) => (
          <span key={c.name} className="pill" style={{ borderColor: c.color }}>
            {c.name} ({c.color}
            {c.accessory !== "none" ? `, ${c.accessory}` : ""})
          </span>
        ))}
      </p>
      <ol className="beats">
        {story.beats.map((b, i) => (
          <li key={i}>
            <small>
              {b.setting} · {b.time} · {b.cast.map((c) => `${story.characters[c.who]?.name ?? "?"} ${c.mood}`).join(", ")}
            </small>
            <div>{b.narration}</div>
            {b.line && b.speaker != null && (
              <div className="line">
                {story.characters[b.speaker]?.name}: “{b.line}”
              </div>
            )}
          </li>
        ))}
      </ol>
    </div>
  );
}

function latestWith(state: StudioState, pred: (j: Job) => boolean): Job | undefined {
  return state.jobs.find(pred);
}

function JobLine({ job, act }: { job: Job; act: Act }) {
  return (
    <li>
      <b>{job.title}</b> <span className={`pill stage-${job.stage}`}>{STAGE_LABEL[job.stage]}</span>
      {job.source === "autopilot" && <span className="pill">autopilot</span>}
      {["script", "qa", "voice", "art", "edit", "ship"].includes(job.stage) && (
        <div className="bar">
          <div style={{ width: `${Math.round(job.progress * 100)}%` }} />
        </div>
      )}
      {job.error && <p className="muted">{job.error}</p>}
      {(job.stage === "failed" || job.stage === "skipped") && (
        <button className="small secondary" onClick={() => void act("producer", `/api/jobs/${job.id}/retry`)}>
          Try again
        </button>
      )}
    </li>
  );
}

function Ship({ state, act }: { state: StudioState; act: Act }) {
  const done = state.jobs.filter((j) => j.hasVideo);
  const tk = state.tiktok;
  const yt = state.youtube;
  return (
    <>
      <div className="card">
        <h3>Finished videos</h3>
        {!done.length && <p className="muted">Nothing shipped yet.</p>}
        <div className="videos">
          {done.map((j) => (
            <div key={j.id} className="video">
              <video src={`/api/video/${j.id}`} controls preload="metadata" playsInline />
              <b>{j.title}</b>
              {j.story && (
                <textarea readOnly rows={3} value={`${j.story.caption}\n\n${j.story.hashtags.map((h: string) => `#${h}`).join(" ")}`} onFocus={(e) => e.target.select()} />
              )}
              <div className="buttons">
                <a className="button small" href={`/api/video/${j.id}?download`}>
                  Download
                </a>
                {tk.connected && (
                  <button className="small secondary" onClick={() => void act("ship", "/api/tiktok/post", { jobId: j.id })}>
                    Send to TikTok
                  </button>
                )}
                {yt.connected && (
                  <button className="small secondary" onClick={() => void act("ship", "/api/youtube/post", { jobId: j.id })}>
                    Upload to YouTube
                  </button>
                )}
              </div>
              <small className="muted">{j.folder}</small>
            </div>
          ))}
        </div>
      </div>
      <div className="card">
        <h3>TikTok</h3>
        {!tk.configured ? (
          <p className="muted">
            Not set up yet. To let Hatch send videos to TikTok for you, open TIKTOK.md in your Reelhouse folder and follow Parts A to C. It takes about 30 minutes, once.
          </p>
        ) : !tk.connected ? (
          <a className="button" href="/api/tiktok/connect">
            Connect TikTok
          </a>
        ) : (
          <>
            <p>Connected{tk.account ? ` as ${tk.account}` : ""}.</p>
            <label>
              After each video
              <select value={tk.mode} onChange={(e) => void act("ship", "/api/tiktok", { mode: e.target.value })}>
                <option value="off">Don't post (I'll post myself)</option>
                <option value="draft">Send to my TikTok inbox to post from the app</option>
                <option value="direct">Post it straight away</option>
              </select>
            </label>
            <p className="muted">Until TikTok approves your developer app, direct posts are private (only you can see them).</p>
            <button className="small secondary" onClick={() => void act("ship", "/api/tiktok", { disconnect: true })}>
              Disconnect
            </button>
          </>
        )}
      </div>
      <div className="card">
        <h3>YouTube Shorts</h3>
        {!yt.configured ? (
          <p className="muted">
            Not set up. To let Hatch upload Shorts for you, follow the steps in YOUTUBE.md, then add YOUTUBE_CLIENT_ID and YOUTUBE_CLIENT_SECRET to .env.local and restart.
          </p>
        ) : !yt.connected ? (
          <a className="button" href="/api/youtube/connect">
            Connect YouTube
          </a>
        ) : (
          <>
            <p>Connected. Uploads today: {yt.uploadsToday} (Google allows about 6 a day by default).</p>
            <label>
              After each video
              <select value={yt.mode} onChange={(e) => void act("ship", "/api/youtube", { mode: e.target.value })}>
                <option value="off">Don't upload (I'll do it myself)</option>
                <option value="private">Upload as private (only me)</option>
                <option value="unlisted">Upload as unlisted (anyone with the link)</option>
                <option value="public">Upload as public</option>
              </select>
            </label>
            <p className="muted">Until Google verifies your project, every upload stays private, whatever you pick here. You can make it public in YouTube Studio.</p>
            <button className="small secondary" onClick={() => void act("ship", "/api/youtube", { disconnect: true })}>
              Disconnect
            </button>
          </>
        )}
      </div>
    </>
  );
}

export function RoomPanel({ room, state, act, pending }: { room: RoomId; state: StudioState; act: Act; pending: Partial<Record<RoomId, boolean>> }) {
  const info = ROOMS.find((r) => r.id === room)!;
  const current = latestWith(state, (j) => !["done", "failed", "skipped"].includes(j.stage));
  const latestStory = latestWith(state, (j) => !!j.story);
  let body: React.ReactNode = null;
  switch (room) {
    case "producer":
      body = <Producer state={state} act={act} pending={pending} />;
      break;
    case "trends":
      body = <Trends state={state} act={act} pending={pending} />;
      break;
    case "scout":
      body = <Scout state={state} act={act} pending={pending} />;
      break;
    case "research":
      body = <Research state={state} act={act} pending={pending} />;
      break;
    case "script":
      body = latestStory?.story ? (
        <div className="card">
          <p className="muted">
            Latest script{latestStory.engine ? `, written by ${latestStory.engine}` : ""}:
          </p>
          <StoryView story={latestStory.story} />
        </div>
      ) : (
        <div className="card muted">No scripts yet.</div>
      );
      break;
    case "qa":
      body = (
        <div className="card">
          <h3>Recent checks</h3>
          <ul className="list">
            {state.jobs
              .filter((j) => j.qa)
              .slice(0, 8)
              .map((j) => (
                <li key={j.id}>
                  <b>{j.title}</b> <span className={`pill verdict-${j.qa!.verdict}`}>{j.qa!.verdict}</span>
                  {j.qa!.issues.length > 0 && (
                    <ul className="mini">
                      {j.qa!.issues.map((i: string, n: number) => (
                        <li key={n}>{i}</li>
                      ))}
                    </ul>
                  )}
                </li>
              ))}
          </ul>
        </div>
      );
      break;
    case "voice":
      body = (
        <div className="card">
          <ul className="checks">
            <Check ok={state.setup.voice.enabled}>Voiceover {state.setup.voice.enabled ? "on" : "off (REELHOUSE_VOICE=0)"}</Check>
            <Check ok={state.setup.voice.piper}>Piper {state.setup.voice.piper ? "installed" : "not installed"}</Check>
            <Check ok={state.setup.voice.narrator}>Narrator voice {state.setup.voice.narrator ? "downloaded" : "missing"}</Check>
            <Check ok={state.setup.voice.characters}>Character voices {state.setup.voice.characters ? "downloaded" : "missing (narrator voice is used instead)"}</Check>
            <Check ok={state.setup.music}>Music {state.setup.music ? "on: composed fresh for every story, or your MP3s from music/" : "off"}</Check>
          </ul>
        </div>
      );
      break;
    case "art":
      body = latestStory?.story ? (
        <div className="card">
          <p className="muted">
            Scenes for “{latestStory.title}” in {latestStory.look === "2.5d" ? "2.5D: far, middle and close layers with a moving camera" : "Flat 2D"}.
          </p>
          <ol className="beats">
            {latestStory.story.beats.map((b: Story["beats"][number], i: number) => (
              <li key={i}>
                <small>
                  {b.setting} at {b.time}, {b.cast.length} on screen
                </small>
              </li>
            ))}
          </ol>
        </div>
      ) : (
        <div className="card muted">Nothing staged yet.</div>
      );
      break;
    case "edit":
      body = (
        <div className="card">
          <h3>On the line</h3>
          {!state.jobs.length && <p className="muted">No stories yet.</p>}
          <ul className="list">
            {state.jobs.slice(0, 10).map((j) => (
              <JobLine key={j.id} job={j} act={act} />
            ))}
          </ul>
        </div>
      );
      break;
    case "ship":
      body = <Ship state={state} act={act} />;
      break;
  }
  const working = current && current.stage === room;
  return (
    <div className="panel">
      <div className="panel-head">
        <h2>{info.name}</h2>
        <p>
          <b>{info.agent}</b> · {info.job}
        </p>
        {working && current && (
          <p className="live">
            Working on “{current.title}” {room === "edit" || room === "voice" ? `(${Math.round(current.progress * 100)}%)` : ""}
          </p>
        )}
      </div>
      {body}
      {room !== "producer" && (
        <div className="card">
          <h3>{info.agent}&apos;s notes</h3>
          <Log state={state} room={room} />
        </div>
      )}
    </div>
  );
}
