// Captions, narrator box, speech bubbles and title cards.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";
import antonUrl from "@fontsource/anton/files/anton-latin-400-normal.woff2";
import fredokaUrl from "@fontsource/fredoka/files/fredoka-latin-600-normal.woff2";
import type { CaptionChunk, StoryStyle } from "../lib/story";

// Fonts ship inside the project (open-source Anton and Fredoka), so rendering works offline.
const ANTON = "Anton";
const FREDOKA = "Fredoka";
loadFont({ family: ANTON, url: antonUrl, weight: "400" });
loadFont({ family: FREDOKA, url: fredokaUrl, weight: "600" });

const YELLOW = "#ffe14d";

function clean(w: string) {
  return w.replace(/[^\p{L}\p{N}'-]/gu, "");
}

function Words({ text, highlight, color = "#fff", marker = false }: { text: string; highlight: string | null; color?: string; marker?: boolean }) {
  let used = false;
  return (
    <>
      {text.split(/\s+/).map((w, i) => {
        const hit = !used && highlight !== null && clean(w) === highlight;
        if (hit) used = true;
        return (
          <span key={i} style={hit && marker ? { color, background: YELLOW, borderRadius: 10, padding: "0 6px" } : { color: hit ? YELLOW : color }}>
            {w}
            {" "}
          </span>
        );
      })}
    </>
  );
}

export const HookCaption: React.FC<{ chunk: CaptionChunk; frame: number }> = ({ chunk, frame }) => {
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 12, stiffness: 220, mass: 0.6 } });
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 1590 }}>
      <div
        style={{
          fontFamily: ANTON,
          fontSize: 118,
          lineHeight: 1.05,
          textAlign: "center",
          textTransform: "uppercase",
          padding: "0 70px",
          transform: `scale(${0.7 + 0.3 * pop})`,
          WebkitTextStroke: "14px #000",
          paintOrder: "stroke fill",
          textShadow: "0 10px 0 rgba(0,0,0,0.45)",
          letterSpacing: 1,
        }}
      >
        <Words text={chunk.text} highlight={chunk.highlight} />
      </div>
    </AbsoluteFill>
  );
};

/** Twist Tale captions: one big white outlined word at a time, centered. */
export const SingleWordCaption: React.FC<{ chunk: CaptionChunk; frame: number; low?: boolean }> = ({ chunk, frame, low }) => {
  const { fps } = useVideoConfig();
  const pop = spring({ frame, fps, config: { damping: 14, stiffness: 260, mass: 0.5 } });
  return (
    <AbsoluteFill style={low ? { justifyContent: "flex-end", alignItems: "center", paddingBottom: 300 } : { justifyContent: "center", alignItems: "center", paddingBottom: 260 }}>
      <div
        style={{
          fontFamily: ANTON,
          fontSize: 150,
          lineHeight: 1,
          textAlign: "center",
          textTransform: "uppercase",
          color: "#fff",
          padding: "0 60px",
          transform: `scale(${0.8 + 0.2 * pop})`,
          WebkitTextStroke: "16px #111",
          paintOrder: "stroke fill",
          textShadow: "0 12px 0 rgba(0,0,0,0.35)",
        }}
      >
        {chunk.text}
      </div>
    </AbsoluteFill>
  );
};

export const NarratorBox: React.FC<{ text: string; highlight: string | null; frame: number }> = ({ text, highlight, frame }) => {
  const o = interpolate(frame, [4, 14], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ alignItems: "center", paddingTop: 150 }}>
      <div
        style={{
          opacity: o,
          transform: `translateY(${(1 - o) * -30}px)`,
          margin: "0 70px",
          padding: "34px 44px",
          background: "rgba(255,250,236,0.94)",
          borderRadius: 40,
          border: "8px solid #3b2a1a",
          boxShadow: "0 14px 0 rgba(0,0,0,0.25)",
          fontFamily: FREDOKA,
          fontSize: 58,
          lineHeight: 1.25,
          color: "#3b2a1a",
          textAlign: "center",
        }}
      >
        <Words text={text} highlight={highlight} color="#3b2a1a" marker />
      </div>
    </AbsoluteFill>
  );
};

export const SpeechBubble: React.FC<{ text: string; frame: number; x: number; y: number; style: StoryStyle }> = ({ text, frame, x, y, style }) => {
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 11, stiffness: 200 } });
  const width = Math.min(860, 120 + text.length * 30);
  const left = Math.min(1080 - width - 30, Math.max(30, x - width / 2));
  const tail = Math.min(width - 60, Math.max(60, x - left));
  return (
    <div
      style={{
        position: "absolute",
        left,
        top: y - 40,
        width,
        transform: `translateY(-100%) scale(${s})`,
        transformOrigin: `${tail}px 100%`,
      }}
    >
      <div
        style={{
          background: "#fff",
          border: "8px solid #222",
          borderRadius: 50,
          padding: "26px 36px",
          fontFamily: style === "hook" ? ANTON : FREDOKA,
          fontSize: style === "hook" ? 64 : 56,
          textTransform: style === "hook" ? "uppercase" : "none",
          color: "#222",
          textAlign: "center",
          lineHeight: 1.15,
        }}
      >
        {text}
      </div>
      <svg width={80} height={60} style={{ position: "absolute", left: tail - 30, bottom: -50 }}>
        <path d="M 6 0 L 40 52 L 60 0 Z" fill="#fff" stroke="#222" strokeWidth={8} strokeLinejoin="round" />
        <rect x={10} y={0} width={46} height={10} fill="#fff" />
      </svg>
    </div>
  );
};

export const TitleCard: React.FC<{ title: string; frame: number; total: number }> = ({ title, frame, total }) => {
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 12 } });
  const out = interpolate(frame, [total - 10, total], [1, 0], { extrapolateLeft: "clamp" });
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, #ffe9b8, #ff9f7a)", alignItems: "center", justifyContent: "center", opacity: out }}>
      <div style={{ fontFamily: FREDOKA, fontSize: 120, color: "#3b2a1a", textAlign: "center", padding: "0 80px", transform: `scale(${s})`, lineHeight: 1.1 }}>
        {title}
      </div>
    </AbsoluteFill>
  );
};

export const EndCard: React.FC<{ style: StoryStyle; frame: number; text?: string | null }> = ({ style, frame, text }) => {
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 9, stiffness: 160 } });
  if (text) {
    // TikTok clips: send people to the full story.
    const nudge = 1 + 0.03 * Math.sin(frame / 5);
    return (
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, #fff3d6, #ffd84d)", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontFamily: FREDOKA, fontSize: 120, color: "#2b2b3a", textAlign: "center", padding: "0 90px", lineHeight: 1.1, transform: `scale(${s * nudge})` }}>
          {text}
        </div>
      </AbsoluteFill>
    );
  }
  if (style === "hook") {
    const pulse = 1 + 0.04 * Math.sin(frame / 4);
    return (
      <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 50%, #2b1a55, #05030f)", alignItems: "center", justifyContent: "center" }}>
        <div
          style={{
            fontFamily: ANTON,
            fontSize: 230,
            color: YELLOW,
            transform: `scale(${s * pulse})`,
            WebkitTextStroke: "16px #000",
            paintOrder: "stroke fill",
            textShadow: "0 0 60px rgba(255,225,77,0.6)",
          }}
        >
          PART 2?
        </div>
      </AbsoluteFill>
    );
  }
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, #fff3d6, #f7b27a)", alignItems: "center", justifyContent: "center" }}>
      <div style={{ fontFamily: FREDOKA, fontSize: 170, color: "#3b2a1a", transform: `scale(${s})` }}>The End</div>
    </AbsoluteFill>
  );
};
