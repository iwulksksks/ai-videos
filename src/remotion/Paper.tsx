// Town Gossip's own look: paper-cut edges and grain, Mabel the pigeon narrator, the Brickbury
// Bugle newspaper cards, and torn-paper captions.
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";
import fredokaUrl from "@fontsource/fredoka/files/fredoka-latin-600-normal.woff2";
import playfairUrl from "@fontsource/playfair-display/files/playfair-display-latin-900-normal.woff2";
import type { CaptionChunk, Character, StagedBeat } from "../lib/story";
import { TOWN } from "../lib/town";
import { PaperCharacterArt, CUT } from "./art/PaperCharacter";
import { seeded } from "./art/palette";

const FREDOKA = "Fredoka";
const PLAYFAIR = "Playfair Display";
loadFont({ family: FREDOKA, url: fredokaUrl, weight: "600" });
loadFont({ family: PLAYFAIR, url: playfairUrl, weight: "900" });

/** CSS filter that gives a whole layer a hard paper shadow. (White cut edges are strokes on the pieces: much faster than a filter.) */
export const PAPER_LAYER_FILTER = "drop-shadow(9px 12px 0 rgba(42,26,16,0.3))";

// A small paper-grain tile, drawn once by the browser and repeated (much faster than full-frame noise).
const GRAIN = `url("data:image/svg+xml;utf8,${encodeURIComponent(
  '<svg xmlns="http://www.w3.org/2000/svg" width="240" height="240"><filter id="g"><feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 0.55  0 0 0 0 0.45  0 0 0 0 0.35  0 0 0 0.9 0"/></filter><rect width="240" height="240" filter="url(#g)"/></svg>',
)}")`;

/** Paper grain and a warm, soft vignette over the whole frame. */
export function PaperFinish() {
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ backgroundImage: GRAIN, backgroundRepeat: "repeat", mixBlendMode: "multiply", opacity: 0.3 }} />
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 55%, rgba(60,30,10,0.35) 100%)" }} />
    </AbsoluteFill>
  );
}

/** Mabel: a nosy paper pigeon in reading glasses and a headscarf who tells every story. */
export const Pigeon: React.FC<{ frame: number; talking: boolean; enter: boolean }> = ({ frame, talking, enter }) => {
  const step = Math.floor(frame / 3) * 3;
  const r = seeded(step * 7 + 3);
  const inT = enter ? interpolate(step, [0, 12], [1, 0], { extrapolateRight: "clamp" }) : 0;
  const bob = talking ? Math.sin(step / 2.5) * 10 : Math.sin(step / 14) * 4;
  const beak = talking && Math.sin(step / 1.8) > 0 ? 12 : 0;
  const tilt = (r() - 0.5) * 3 + (talking ? Math.sin(step / 5) * 4 : 0);
  const e = { stroke: CUT, strokeWidth: 6, paintOrder: "stroke" as const, strokeLinejoin: "round" as const };
  return (
    <svg width={330} height={330} viewBox="-165 -200 330 330" style={{ position: "absolute", right: -10, bottom: 210, overflow: "visible", transform: `translateX(${inT * 300}px)` }}>
      <g transform={`rotate(${tilt})`}>
        <ellipse cx={14} cy={112} rx={90} ry={12} fill="#000" opacity={0.15} />
        {/* tail and body */}
        <path d="M 60 40 L 150 80 L 140 100 L 50 80 Z" fill="#6d7385" {...e} />
        <path d="M -80 20 Q -90 -60 -10 -70 Q 90 -70 90 30 Q 80 100 0 104 Q -70 100 -80 20 Z" fill="#9aa3b5" {...e} />
        <path d="M 0 0 Q 60 -10 80 40 Q 40 70 0 50 Z" fill="#7b8396" {...e} />
        {/* legs */}
        <path d="M -20 100 l -6 20 M 20 100 l 6 20" stroke="#ff8a6a" strokeWidth={7} strokeLinecap="round" />
        {/* shimmering neck */}
        <path d="M -70 -20 Q -70 -70 -20 -80 Q 10 -60 0 -10 Q -40 0 -70 -20 Z" fill="#6fb59a" {...e} />
        <path d="M -60 -30 Q -50 -60 -20 -66 Q -10 -40 -20 -16 Z" fill="#9a6fb5" opacity={0.8} />
        {/* head */}
        <g transform={`translate(${-40 + bob * 0.6} ${-110 + bob * 0.3})`}>
          <path d="M -50 0 a 50 50 0 1 0 100 0 a 50 50 0 1 0 -100 0 Z" fill="#a6aec0" {...e} />
          {/* headscarf */}
          <path d="M -54 -6 Q -50 -58 0 -60 Q 50 -58 54 -6 Q 0 -30 -54 -6 Z" fill="#ff7aa8" {...e} />
          <path d="M 44 -14 l 40 16 l -36 10 Z" fill="#ff5a8f" {...e} />
          <circle cx={-14} cy={-44} r={5} fill="#fff" opacity={0.8} />
          <circle cx={14} cy={-48} r={5} fill="#fff" opacity={0.8} />
          {/* beak */}
          <path d={`M -48 8 L -86 ${14} L -48 ${22}`} fill="#f2b25a" {...e} />
          <path d={`M -48 22 L -80 ${26 + beak} L -48 ${30}`} fill="#d9963a" {...e} />
          {/* eye behind reading glasses */}
          <circle cx={-14} cy={4} r={11} fill="#ffb347" />
          <circle cx={-16} cy={4} r={5} fill="#2b2220" />
          <circle cx={-14} cy={4} r={20} fill="rgba(255,255,255,0.2)" stroke="#3a2a4a" strokeWidth={5} />
          <path d="M 6 2 L 46 -6" stroke="#3a2a4a" strokeWidth={4} />
        </g>
      </g>
    </svg>
  );
};

/** The Brickbury Bugle: a headline opens the episode, a correction closes it. */
export const NewsCard: React.FC<{ beat: StagedBeat; frame: number; characters: Character[]; kind: "headline" | "correction" }> = ({ beat, frame, characters, kind }) => {
  const { fps } = useVideoConfig();
  const step = Math.floor(frame / 2) * 2;
  // The paper spins in like an old film, then settles.
  const s = spring({ frame: step, fps, config: { damping: 12, stiffness: 120 } });
  const spin = (1 - s) * (kind === "headline" ? -540 : 360);
  const stamp = spring({ frame: step - 14, fps, config: { damping: 9, stiffness: 260 } });
  const text = beat.narration.replace(/^correction[:,]?\s*/i, "");
  const days = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
  const day = days[beat.seed % 7];
  const cast = beat.cast.slice(0, 3);
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 45%, #6b4a33, #2a1a10)", alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          width: 900,
          background: "#f6efdf",
          padding: "44px 48px 40px",
          boxShadow: `0 0 0 8px ${CUT}, 18px 24px 0 rgba(0,0,0,0.35)`,
          transform: `rotate(${spin + (kind === "headline" ? -2.5 : 2)}deg) scale(${0.2 + 0.8 * s})`,
          color: "#231a14",
          position: "relative",
        }}
      >
        <div style={{ fontFamily: PLAYFAIR, fontSize: 78, textAlign: "center", letterSpacing: 1, lineHeight: 1 }}>{TOWN.paper.toUpperCase()}</div>
        <div style={{ display: "flex", justifyContent: "space-between", fontFamily: FREDOKA, fontSize: 30, borderTop: "5px solid #231a14", borderBottom: "2px solid #231a14", margin: "16px 0 26px", padding: "6px 0" }}>
          <span>{day} edition</span>
          <span>{kind === "headline" ? "Breaking" : "Page 2"}</span>
          <span>1 crumb</span>
        </div>
        {kind === "correction" && <div style={{ fontFamily: PLAYFAIR, fontSize: 56, marginBottom: 10 }}>Correction:</div>}
        <div style={{ fontFamily: PLAYFAIR, fontSize: text.length > 50 ? 70 : 86, lineHeight: 1.04, textTransform: kind === "headline" ? "uppercase" : "none" }}>{text}</div>
        {kind === "headline" && cast.length > 0 && (
          <div style={{ marginTop: 30, height: 520, background: "#d8ccb4", border: "4px solid #231a14", overflow: "hidden", position: "relative", filter: "grayscale(1) contrast(1.15)" }}>
            <svg viewBox="0 0 900 520" width="100%" height="100%">
              {cast.map((c, i) => {
                const ch = characters[c.who];
                if (!ch) return null;
                const x = cast.length === 1 ? 400 : 200 + (i * 500) / (cast.length - 1);
                return (
                  <g key={i} transform={`translate(${x} 560) scale(0.95)`}>
                    <PaperCharacterArt character={ch} mood={c.mood} action="idle" frame={frame} facing={i === 0 ? 1 : -1} talking={false} seed={beat.seed + i} />
                  </g>
                );
              })}
            </svg>
          </div>
        )}
        {kind === "correction" && (
          <div
            style={{
              position: "absolute",
              right: 30,
              top: -40,
              border: "8px solid #c8323c",
              color: "#c8323c",
              fontFamily: FREDOKA,
              fontSize: 64,
              padding: "4px 22px",
              borderRadius: 14,
              transform: `rotate(-14deg) scale(${2.4 - 1.4 * stamp})`,
              opacity: stamp > 0.02 ? 1 : 0,
              background: "rgba(246,239,223,0.6)",
            }}
          >
            OOPS
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

/** Captions: 2 to 3 words at a time on a torn strip of paper near the top. */
export const TornCaption: React.FC<{ chunk: CaptionChunk; frame: number; index: number }> = ({ chunk, frame, index }) => {
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 13, stiffness: 300, mass: 0.5 } });
  const r = seeded(index * 97 + chunk.text.length);
  const teeth = Array.from({ length: 24 }, (_, i) => `${(i / 23) * 100}% ${r() * 9}%`).join(", ");
  const bottom = Array.from({ length: 24 }, (_, i) => `${100 - (i / 23) * 100}% ${100 - r() * 9}%`).join(", ");
  const rot = (index % 2 ? 1 : -1) * (1.5 + r() * 1.5);
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 250 }}>
      <div style={{ transform: `rotate(${rot}deg) scale(${0.85 + 0.15 * s})`, filter: "drop-shadow(8px 10px 0 rgba(40,20,10,0.3))" }}>
        <div
          style={{
            clipPath: `polygon(${teeth}, ${bottom})`,
            background: "#fbf6ea",
            padding: "30px 46px",
            fontFamily: FREDOKA,
            fontSize: 92,
            lineHeight: 1.05,
            color: "#231a14",
            textAlign: "center",
            maxWidth: 900,
          }}
        >
          {chunk.text.split(/\s+/).map((w, i) => {
            const hit = chunk.highlight && w.replace(/[^\p{L}\p{N}'-]/gu, "") === chunk.highlight;
            return (
              <span key={i} style={hit ? { background: "#ffe14d", padding: "0 8px", borderRadius: 6 } : undefined}>
                {w}{" "}
              </span>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};
