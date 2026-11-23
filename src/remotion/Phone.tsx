// Phone-screen scenes for Town Gossip, all drawn in code: a post, a view counter that races up,
// comments pouring in, a wall of copycat videos and the "original sound" page.
// The app is the made-up "Bloop", so no real app's look or name is used.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";
import fredokaUrl from "@fontsource/fredoka/files/fredoka-latin-600-normal.woff2";
import type { Character, Screen } from "../lib/story";
import { TOWN, formatCount, parseCount, townFolk } from "../lib/town";
import { CHAR_COLORS } from "./art/palette";

const FONT = "Fredoka";
loadFont({ family: FONT, url: fredokaUrl, weight: "600" });

const handleOf = (c: Character | undefined) => (c ? townFolk(c.name)?.handle ?? c.name.toLowerCase().replace(/\s+/g, ".") : "someone");

function Heart({ size = 70, color = "#fff" }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24">
      <path d="M12 21s-7.5-4.6-9.6-9.3C.9 8.3 3.1 4.5 6.8 4.5c2.1 0 3.6 1.2 5.2 3 1.6-1.8 3.1-3 5.2-3 3.7 0 5.9 3.8 4.4 7.2C19.5 16.4 12 21 12 21z" fill={color} />
    </svg>
  );
}

/** Ticks a number up from 0 over `frames`, ending at the target. */
function ticking(target: number, frame: number, frames: number) {
  const t = interpolate(frame, [4, frames], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return Math.round(target * (1 - Math.pow(1 - t, 3)));
}

/** App buttons drawn over a normal scene, so the scene looks like a video someone posted. */
export const PostOverlay: React.FC<{ frame: number; text: string; count: string | null; poster: Character | undefined }> = ({ frame, text, count, poster }) => {
  const likes = ticking(Math.max(1, Math.round(parseCount(count) / 8)) || 12, frame, 50);
  const pop = (d: number) => interpolate(frame, [d, d + 6], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ fontFamily: FONT, color: "#fff", pointerEvents: "none" }}>
      <AbsoluteFill style={{ background: "linear-gradient(180deg, rgba(0,0,0,0.35) 0%, transparent 14%, transparent 72%, rgba(0,0,0,0.55) 100%)" }} />
      <div style={{ position: "absolute", top: 70, width: "100%", textAlign: "center", fontSize: 44, opacity: 0.95 }}>
        <span style={{ background: "#ff4f7b", borderRadius: 16, padding: "4px 18px" }}>{TOWN.app}</span>
      </div>
      <div style={{ position: "absolute", right: 40, bottom: 520, display: "flex", flexDirection: "column", alignItems: "center", gap: 34, fontSize: 36 }}>
        <div style={{ width: 96, height: 96, borderRadius: 48, border: "5px solid #fff", background: CHAR_COLORS[poster?.color ?? "orange"] }} />
        <div style={{ textAlign: "center", transform: `scale(${0.6 + 0.4 * pop(2)})` }}>
          <Heart color="#ff4f7b" />
          <div>{formatCount(likes)}</div>
        </div>
        <div style={{ textAlign: "center", transform: `scale(${0.6 + 0.4 * pop(5)})` }}>
          <svg width={70} height={70} viewBox="0 0 24 24">
            <path d="M4 4h16v12H8l-4 4z" fill="#fff" />
          </svg>
          <div>{formatCount(Math.round(likes / 9))}</div>
        </div>
      </div>
      <div style={{ position: "absolute", left: 44, right: 180, bottom: 300, fontSize: 46, lineHeight: 1.25, textShadow: "0 3px 8px rgba(0,0,0,0.6)" }}>
        <div>@{handleOf(poster)}</div>
        <div style={{ fontSize: 40, opacity: 0.95 }}>{text}</div>
      </div>
    </AbsoluteFill>
  );
};

const ViewsScreen: React.FC<{ frame: number; total: number; count: string | null; text: string }> = ({ frame, total, count, text }) => {
  const target = parseCount(count) || 12_000_000;
  const n = ticking(target, frame, Math.max(20, total - 12));
  const shake = frame < total - 12 ? Math.sin(frame * 2.3) * 3 : 0;
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 42%, #2c2f7a, #0b0c24)", alignItems: "center", justifyContent: "center", fontFamily: FONT, color: "#fff" }}>
      <div style={{ fontSize: 210, lineHeight: 1, transform: `translateX(${shake}px)`, textShadow: "0 0 50px rgba(120,160,255,0.6)" }}>{formatCount(n)}</div>
      <div style={{ fontSize: 80, opacity: 0.9, marginTop: 10 }}>views</div>
      {text && <div style={{ fontSize: 48, opacity: 0.6, marginTop: 50, padding: "0 80px", textAlign: "center" }}>"{text}"</div>}
    </AbsoluteFill>
  );
};

const CommentsScreen: React.FC<{ frame: number; text: string; characters: Character[] }> = ({ frame, text, characters }) => {
  const extra = ["bricklover22", "grandpa.gus", "the.real.ted", "kayla.k", "moonpie", "lil.dan"];
  const people = [...characters.slice(1).map(handleOf), ...extra];
  const shout = text || "this!!";
  const say = [shout, `${shout}!`, shout.toUpperCase(), `${shout}!!`, `ok ${shout}`, `${shout} lol`, shout.toUpperCase() + "!!", `${shout}?`];
  const rows = people.slice(0, 8).map((who, i) => ({ who, said: say[i % say.length] }));
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ background: "#fbfbfd", fontFamily: FONT, padding: "120px 70px 0" }}>
      <div style={{ fontSize: 46, color: "#888", marginBottom: 30 }}>{formatCount(1000 + frame * 937)} comments</div>
      {rows.map((r, i) => {
        const s = spring({ frame: frame - i * 5, fps, config: { damping: 14, stiffness: 200 } });
        return (
          <div key={i} style={{ opacity: s, transform: `translateY(${(1 - s) * 40}px)`, marginBottom: 34 }}>
            <div style={{ fontSize: 38, color: "#999" }}>{r.who}</div>
            <div style={{ fontSize: 70, color: "#1d1d2b" }}>{r.said}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const CopycatsScreen: React.FC<{ frame: number; text: string; count: string | null }> = ({ frame, text, count }) => {
  const cols = ["#ffb38a", "#9ec9f2", "#f2a6d8", "#b8e6b0", "#fbe08a", "#d6c4f2"];
  const base = parseCount(count) || 2_000_000;
  const { fps } = useVideoConfig();
  return (
    <AbsoluteFill style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gridTemplateRows: "repeat(4, 1fr)", gap: 6, background: "#111", fontFamily: FONT }}>
      {Array.from({ length: 12 }, (_, i) => {
        const s = spring({ frame: frame - i * 2, fps, config: { damping: 12, stiffness: 240 } });
        return (
          <div key={i} style={{ background: cols[(i * 5) % cols.length], transform: `scale(${s})`, position: "relative", display: "flex", alignItems: "flex-start", justifyContent: "center", paddingTop: 30 }}>
            <div style={{ fontSize: 58, color: "#fff", textShadow: "0 3px 0 rgba(0,0,0,0.25)", textAlign: "center", padding: "0 10px", lineHeight: 1 }}>{text || "?"}</div>
            <div style={{ position: "absolute", left: 16, bottom: 14, fontSize: 36, color: "#fff" }}>▶ {formatCount(base * (1 + ((i * 7) % 10) / 5))}</div>
          </div>
        );
      })}
    </AbsoluteFill>
  );
};

const SoundScreen: React.FC<{ frame: number; text: string; count: string | null; hero: Character | undefined }> = ({ frame, text, count, hero }) => {
  const n = parseCount(count) || 1_000;
  return (
    <AbsoluteFill style={{ background: "#2a2147", alignItems: "center", fontFamily: FONT, color: "#fff", paddingTop: 300 }}>
      <div style={{ width: 520, height: 520, borderRadius: 260, background: "#0d0b18", display: "flex", alignItems: "center", justifyContent: "center", transform: `rotate(${frame * 3}deg)`, boxShadow: "0 0 0 14px #3a3060" }}>
        <div style={{ width: 200, height: 200, borderRadius: 100, background: "#ffe14d", color: "#1d1d2b", display: "flex", alignItems: "center", justifyContent: "center", fontSize: 44, textAlign: "center", padding: 16 }}>{text || "♪"}</div>
      </div>
      <div style={{ fontSize: 72, marginTop: 90 }}>original sound</div>
      <div style={{ fontSize: 50, opacity: 0.7, marginTop: 10 }}>@{handleOf(hero)}</div>
      <div style={{ fontSize: 120, marginTop: 60 }}>{formatCount(n)} views</div>
    </AbsoluteFill>
  );
};

/** A full-screen phone scene, or null when this screen type is drawn over the set instead. */
export const PhoneScreen: React.FC<{ screen: Screen; frame: number; total: number; text: string; count: string | null; characters: Character[] }> = ({ screen, frame, total, text, count, characters }) => {
  switch (screen) {
    case "views":
      return <ViewsScreen frame={frame} total={total} count={count} text={text} />;
    case "comments":
      return <CommentsScreen frame={frame} text={text} characters={characters} />;
    case "copycats":
      return <CopycatsScreen frame={frame} text={text} count={count} />;
    case "sound":
      return <SoundScreen frame={frame} text={text} count={count} hero={characters[0]} />;
    default:
      return null;
  }
};
