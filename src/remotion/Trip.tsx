// Country Story's own look: a travel journal. Every scene is a snapshot taped into Pip's
// journal, a luggage tag says where we are, captions are printed on train tickets, a passport
// stamp opens the trip, the real fact arrives on the back of a postcard, and a "Greetings from"
// postcard home closes it. (Same paper puppets as the other Brickbury styles, nothing else shared.)
import React from "react";
import { AbsoluteFill, interpolate, spring, useVideoConfig } from "remotion";
import { loadFont } from "@remotion/fonts";
import fredokaUrl from "@fontsource/fredoka/files/fredoka-latin-600-normal.woff2";
import playfairUrl from "@fontsource/playfair-display/files/playfair-display-latin-900-normal.woff2";
import antonUrl from "@fontsource/anton/files/anton-latin-400-normal.woff2";
import type { CaptionChunk, Character, StagedBeat } from "../lib/story";
import { PaperCharacterArt, CUT } from "./art/PaperCharacter";
import { seeded } from "./art/palette";
import { PaperFinish } from "./Paper";

const FREDOKA = "Fredoka";
const PLAYFAIR = "Playfair Display";
const ANTON = "Anton";
loadFont({ family: FREDOKA, url: fredokaUrl, weight: "600" });
loadFont({ family: PLAYFAIR, url: playfairUrl, weight: "900" });
loadFont({ family: ANTON, url: antonUrl, weight: "400" });

const INK = "#1f2a44"; // passport-stamp blue
const RED = "#c8323c";
const KRAFT = "#d9b77e";
const CREAM = "#fbf4e2";

/** Which stamp colors a country gets: picked from its name so the same country always looks the same. */
function stampColors(country: string): [string, string] {
  const sets: [string, string][] = [
    ["#c8323c", "#1f4f8f"],
    ["#1f7a4f", "#e0a020"],
    ["#6a2d8f", "#d9562b"],
    ["#0f6f8f", "#c8323c"],
    ["#b0471c", "#215a3a"],
  ];
  let h = 0;
  for (const c of country) h = (h * 31 + c.charCodeAt(0)) >>> 0;
  return sets[h % sets.length];
}

function Highlighted({ text, highlight, mark = "#ffe14d" }: { text: string; highlight: string | null; mark?: string }) {
  return (
    <>
      {text.split(/\s+/).map((w, i) => {
        const hit = highlight && w.replace(/[^\p{L}\p{N}'-]/gu, "") === highlight;
        return (
          <span key={i} style={hit ? { background: mark, padding: "0 8px", borderRadius: 6 } : undefined}>
            {w}{" "}
          </span>
        );
      })}
    </>
  );
}

/** The journal page around every scene: a cream photo border with dark photo corners. */
export function SnapshotFrame() {
  const corner = (rot: number, pos: React.CSSProperties) => (
    <div style={{ position: "absolute", width: 120, height: 120, ...pos, transform: `rotate(${rot}deg)` }}>
      <svg viewBox="0 0 120 120" width={120} height={120}>
        <path d="M 0 0 L 120 0 L 0 120 Z" fill="#3a2a1e" />
        <path d="M 0 0 L 120 0 L 0 120 Z" fill="none" stroke="#5a4430" strokeWidth={4} />
      </svg>
    </div>
  );
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      <AbsoluteFill style={{ boxShadow: `inset 0 0 0 26px ${CREAM}, inset 0 0 0 30px rgba(60,40,20,0.35)` }} />
      {corner(0, { left: 10, top: 10 })}
      {corner(90, { right: 10, top: 10 })}
      {corner(180, { right: 10, bottom: 10 })}
      {corner(270, { left: 10, bottom: 10 })}
    </AbsoluteFill>
  );
}

/** A kraft-paper luggage tag on a string, top left: the country and where in it we are. */
export const LuggageTag: React.FC<{ country: string; place: string | null; frame: number; fresh: boolean }> = ({ country, place, frame, fresh }) => {
  const { fps } = useVideoConfig();
  const drop = fresh ? spring({ frame, fps, config: { damping: 7, stiffness: 120 } }) : 1;
  const swing = Math.sin(frame / 18) * 2.5 + (1 - drop) * 25;
  const [c1] = stampColors(country);
  return (
    <div style={{ position: "absolute", left: 70, top: 90, transformOrigin: "40px 0px", transform: `rotate(${-6 + swing}deg)` }}>
      <svg width={40} height={70} style={{ position: "absolute", left: 20, top: -60 }}>
        <path d="M 20 0 Q 30 35 20 70" stroke="#7a5a3a" strokeWidth={5} fill="none" />
      </svg>
      <div
        style={{
          width: 400,
          background: KRAFT,
          clipPath: "polygon(16% 0, 100% 0, 100% 100%, 16% 100%, 0 72%, 0 28%)",
          padding: "20px 26px 22px 96px",
          filter: "drop-shadow(6px 8px 0 rgba(40,20,10,0.3))",
          position: "relative",
        }}
      >
        <div style={{ position: "absolute", left: 30, top: "50%", width: 34, height: 34, marginTop: -17, borderRadius: 17, background: "#3a2a1e", boxShadow: `0 0 0 7px ${CUT}` }} />
        <div style={{ fontFamily: FREDOKA, fontSize: 30, letterSpacing: 5, color: c1 }}>{country.toUpperCase()}</div>
        {place && place.toLowerCase() !== country.toLowerCase() ? (
          <div style={{ fontFamily: PLAYFAIR, fontSize: place.length > 14 ? 44 : 56, lineHeight: 1.05, color: "#2b1d12" }}>{place}</div>
        ) : null}
      </div>
    </div>
  );
};

/** Captions: 2 or 3 words at a time, printed on a train ticket with punched-out notches. */
export const TicketCaption: React.FC<{ chunk: CaptionChunk; frame: number; index: number }> = ({ chunk, frame, index }) => {
  const { fps } = useVideoConfig();
  const s = spring({ frame, fps, config: { damping: 14, stiffness: 320, mass: 0.5 } });
  const r = seeded(index * 53 + chunk.text.length);
  const rot = (r() - 0.5) * 3;
  const notch = "radial-gradient(circle 26px at 0 50%, transparent 97%, #000) left / 51% 100% no-repeat, radial-gradient(circle 26px at 100% 50%, transparent 97%, #000) right / 51% 100% no-repeat";
  const serial = String(100 + ((index * 37) % 900));
  return (
    <AbsoluteFill style={{ justifyContent: "flex-start", alignItems: "center", paddingTop: 400 }}>
      <div style={{ transform: `rotate(${rot}deg) translateY(${(1 - s) * 40}px)`, opacity: Math.min(1, s * 1.5), filter: "drop-shadow(7px 9px 0 rgba(40,20,10,0.3))" }}>
        <div style={{ mask: notch, WebkitMask: notch, background: "#f7e9c4", display: "flex", alignItems: "stretch", maxWidth: 960 }}>
          <div style={{ padding: "26px 40px 30px 52px", fontFamily: FREDOKA, fontSize: 86, lineHeight: 1.05, color: "#2b1d12", textAlign: "center", flex: 1 }}>
            <Highlighted text={chunk.text} highlight={chunk.highlight} />
          </div>
          <div style={{ borderLeft: "5px dashed #b89a6a", padding: "0 40px 0 22px", display: "flex", alignItems: "center", fontFamily: ANTON, fontSize: 34, color: RED, writingMode: "vertical-rl", letterSpacing: 4 }}>
            Nº {serial}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
};

/** A round rubber stamp: "ARRIVED", the country, and the day. */
function Stamp({ country, top, bottom, color, size = 420 }: { country: string; top: string; bottom: string; color: string; size?: number }) {
  const name = country.toUpperCase();
  return (
    <svg viewBox="-210 -210 420 420" width={size} height={size} style={{ overflow: "visible" }}>
      <defs>
        <path id="stamp-top" d="M -150 0 A 150 150 0 0 1 150 0" />
        <path id="stamp-bottom" d="M -160 0 A 160 160 0 0 0 160 0" />
      </defs>
      <g fill="none" stroke={color} opacity={0.9}>
        <circle r={196} strokeWidth={12} />
        <circle r={176} strokeWidth={4} />
        <circle r={104} strokeWidth={4} />
      </g>
      <text fontFamily={ANTON} fontSize={44} letterSpacing={10} fill={color} textAnchor="middle">
        <textPath href="#stamp-top" startOffset="50%">{top}</textPath>
      </text>
      <text fontFamily={ANTON} fontSize={40} letterSpacing={8} fill={color} textAnchor="middle" dominantBaseline="hanging">
        <textPath href="#stamp-bottom" startOffset="50%">{bottom}</textPath>
      </text>
      <text fontFamily={ANTON} fontSize={name.length > 9 ? 44 : name.length > 6 ? 58 : 74} fill={color} textAnchor="middle" dominantBaseline="central">
        {name}
      </text>
      <path d="M -60 -200 L 40 210" stroke="#fff" strokeOpacity={0.3} strokeWidth={10} />
    </svg>
  );
}

/** Beat 1: Pip's passport opens and a stamp slams down on the country. The hook line runs underneath. */
export const PassportCard: React.FC<{ beat: StagedBeat; frame: number; characters: Character[]; country: string }> = ({ beat, frame, characters, country }) => {
  const { fps } = useVideoConfig();
  const step = Math.floor(frame / 2) * 2;
  const open = spring({ frame: step, fps, config: { damping: 14, stiffness: 110 } });
  const slam = spring({ frame: step - 14, fps, config: { damping: 9, stiffness: 320 } });
  const shake = slam > 0.05 && slam < 0.9 ? Math.sin(step) * 8 : 0;
  const [c1, c2] = stampColors(country);
  const hero = characters[beat.cast[0]?.who ?? 0];
  const lines = Array.from({ length: 22 }, (_, i) => i);
  const textIn = interpolate(frame, [18, 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, #3a6b64, #12302c)", alignItems: "center" }}>
      <div style={{ position: "absolute", top: 300, transform: `perspective(2000px) rotateX(${(1 - open) * 70}deg) rotate(${-2 + shake * 0.1}deg) translateY(${shake}px)`, transformOrigin: "50% 0%" }}>
        <div style={{ width: 920, height: 1080, background: "#efe6cf", borderRadius: 18, boxShadow: `0 0 0 10px ${CUT}, 0 0 0 22px #1d3b6b, 20px 28px 0 26px rgba(0,0,0,0.35)`, position: "relative", overflow: "hidden" }}>
          {/* security wave pattern */}
          <svg viewBox="0 0 920 1080" width={920} height={1080} style={{ position: "absolute", inset: 0 }}>
            {lines.map((i) => (
              <path key={i} d={`M 0 ${i * 50 + 20} Q 230 ${i * 50 - 10} 460 ${i * 50 + 20} T 920 ${i * 50 + 20}`} stroke="#c9d6c0" strokeWidth={3} fill="none" />
            ))}
          </svg>
          <div style={{ position: "absolute", left: 50, top: 40, fontFamily: ANTON, fontSize: 52, letterSpacing: 10, color: "#1d3b6b" }}>PASSPORT · VISAS</div>
          <div style={{ position: "absolute", right: 50, top: 50, fontFamily: FREDOKA, fontSize: 32, color: "#1d3b6b" }}>Page 7</div>
          {/* photo */}
          <div style={{ position: "absolute", left: 60, top: 150, width: 300, height: 380, background: "#d7e3ea", border: "6px solid #1d3b6b", overflow: "hidden" }}>
            {hero && (
              <svg viewBox="0 0 300 380" width={300} height={380}>
                <g transform="translate(150 640) scale(1.15)">
                  <PaperCharacterArt character={hero} mood="happy" action="idle" frame={0} facing={1} talking={false} seed={beat.seed} />
                </g>
              </svg>
            )}
          </div>
          <div style={{ position: "absolute", left: 390, top: 170, fontFamily: FREDOKA, fontSize: 34, color: "#3a3a3a", lineHeight: 1.6 }}>
            <div>Name: <b>{hero?.name ?? "Pip"}</b></div>
            <div>From: Brickbury</div>
            <div>Going to: <b style={{ color: c1 }}>{country}</b></div>
          </div>
          {/* the stamp */}
          <div style={{ position: "absolute", left: 400, top: 380, transform: `rotate(-14deg) scale(${slam < 0.02 ? 0 : 2.2 - 1.2 * slam})`, opacity: slam < 0.02 ? 0 : Math.min(1, slam * 2) }}>
            <Stamp country={country} top="ARRIVED" bottom="DAY ONE" color={c1} size={480} />
          </div>
          <div style={{ position: "absolute", left: 70, top: 600, transform: "rotate(9deg)", opacity: 0.35 }}>
            <svg width={220} height={140} viewBox="0 0 220 140">
              <rect x={8} y={8} width={204} height={124} rx={14} fill="none" stroke={c2} strokeWidth={8} />
              <text x={110} y={86} textAnchor="middle" fontFamily={ANTON} fontSize={46} fill={c2}>BRICKBURY</text>
            </svg>
          </div>
          {/* the hook line, typed into the page */}
          <div style={{ position: "absolute", left: 60, right: 60, bottom: 60, fontFamily: PLAYFAIR, fontSize: beat.narration.length > 60 ? 58 : 68, lineHeight: 1.1, color: "#231a14", opacity: textIn, transform: `translateY(${(1 - textIn) * 20}px)` }}>
            {beat.narration}
          </div>
        </div>
      </div>
      <PaperFinish />
    </AbsoluteFill>
  );
};

/** The real fact, written on the back of a postcard that flips over, with a "TRUE STORY" postmark. */
export const FactPostcard: React.FC<{ beat: StagedBeat; frame: number; country: string }> = ({ beat, frame, country }) => {
  const { fps } = useVideoConfig();
  const step = Math.floor(frame / 2) * 2;
  const flip = spring({ frame: step, fps, config: { damping: 13, stiffness: 100 } });
  const mark = spring({ frame: step - 16, fps, config: { damping: 9, stiffness: 300 } });
  const [c1, c2] = stampColors(country);
  const text = beat.narration.replace(/^(the real reason[?:,.]?\s*)/i, "");
  return (
    <AbsoluteFill style={{ background: `repeating-linear-gradient(90deg, #8a6a48 0 6px, #7c5e3f 6px 60px)`, alignItems: "center", justifyContent: "center" }}>
      <div style={{ position: "absolute", top: 200, fontFamily: ANTON, fontSize: 120, letterSpacing: 6, color: CREAM, textShadow: `7px 7px 0 ${c1}`, transform: `scale(${0.6 + 0.4 * flip})` }}>THE REAL REASON</div>
      <div style={{ transform: `perspective(2400px) rotateY(${(1 - flip) * 180}deg) rotate(3deg)` }}>
        <div style={{ width: 960, minHeight: 860, background: CREAM, borderRadius: 12, boxShadow: `0 0 0 9px ${CUT}, 18px 24px 0 9px rgba(0,0,0,0.35)`, padding: "48px 54px", position: "relative", backfaceVisibility: "hidden" }}>
          {/* stamp in the corner */}
          <div style={{ position: "absolute", right: 46, top: 40, width: 170, height: 210, background: c2, boxShadow: `0 0 0 10px #fff`, display: "flex", alignItems: "center", justifyContent: "center", outline: `4px dashed #ddd`, outlineOffset: 6 }}>
            <div style={{ fontFamily: ANTON, fontSize: 92, color: CREAM }}>{country.slice(0, 1).toUpperCase()}</div>
          </div>
          {/* the postmark */}
          <div style={{ position: "absolute", right: 150, top: 110, transform: `rotate(-12deg) scale(${mark < 0.02 ? 0 : 2 - mark})`, opacity: mark < 0.02 ? 0 : 0.85 }}>
            <svg viewBox="0 0 420 200" width={420} height={200}>
              <circle cx={100} cy={100} r={84} fill="none" stroke={INK} strokeWidth={8} />
              <text x={100} y={92} textAnchor="middle" fontFamily={ANTON} fontSize={34} fill={INK}>TRUE</text>
              <text x={100} y={132} textAnchor="middle" fontFamily={ANTON} fontSize={34} fill={INK}>STORY</text>
              {[0, 1, 2, 3].map((i) => (
                <path key={i} d={`M 196 ${52 + i * 32} q 28 -16 56 0 t 56 0 t 56 0 t 56 0`} stroke={INK} strokeWidth={7} fill="none" />
              ))}
            </svg>
          </div>
          <div style={{ fontFamily: FREDOKA, fontSize: 34, letterSpacing: 6, color: RED, marginTop: 6 }}>REAL FACT · {country.toUpperCase()}</div>
          <div style={{ fontFamily: PLAYFAIR, fontSize: text.length > 80 ? 64 : 76, lineHeight: 1.12, color: "#231a14", marginTop: 220, paddingRight: 10 }}>{text}</div>
          {/* address lines */}
          <div style={{ marginTop: 40, display: "grid", gap: 26 }}>
            {[0, 1].map((i) => (
              <div key={i} style={{ height: 4, background: "#c9b89a" }} />
            ))}
          </div>
        </div>
      </div>
      <PaperFinish />
    </AbsoluteFill>
  );
};

/** The last beat: a "Greetings from" postcard home, with the closing line written on it. */
export const HomePostcard: React.FC<{ beat: StagedBeat; frame: number; characters: Character[]; country: string }> = ({ beat, frame, characters, country }) => {
  const { fps } = useVideoConfig();
  const step = Math.floor(frame / 2) * 2;
  const s = spring({ frame: step, fps, config: { damping: 12, stiffness: 120 } });
  const [c1, c2] = stampColors(country);
  const hero = characters[beat.cast[0]?.who ?? 0];
  const name = country.toUpperCase();
  const text = beat.narration.replace(/^dear brickbury[,:]?\s*/i, "");
  return (
    <AbsoluteFill style={{ background: "radial-gradient(circle at 50% 40%, #f0c987, #b77b45)", alignItems: "center" }}>
      <div style={{ position: "absolute", top: 180, transform: `translateY(${(1 - s) * 1200}px) rotate(${-3 + (1 - s) * 12}deg)` }}>
        <div style={{ width: 940, background: c2, borderRadius: 12, padding: "36px 40px 44px", boxShadow: `0 0 0 9px ${CUT}, 18px 24px 0 9px rgba(0,0,0,0.35)` }}>
          <div style={{ fontFamily: FREDOKA, fontSize: 52, color: CREAM, letterSpacing: 3 }}>Greetings from</div>
          <div style={{ fontFamily: ANTON, fontSize: name.length > 8 ? 150 : 200, lineHeight: 0.95, color: "#ffd24d", WebkitTextStroke: `6px ${c1}`, paintOrder: "stroke", textShadow: `10px 10px 0 ${c1}` }}>{name}</div>
          <div style={{ marginTop: 34, background: CREAM, borderRadius: 8, padding: "30px 34px", fontFamily: PLAYFAIR, fontSize: text.length > 70 ? 54 : 64, lineHeight: 1.15, color: "#231a14" }}>
            <div style={{ fontFamily: FREDOKA, fontSize: 38, color: RED, marginBottom: 10 }}>Dear Brickbury,</div>
            {text}
            <div style={{ fontFamily: FREDOKA, fontSize: 38, color: "#555", marginTop: 14, textAlign: "right" }}>Love, {hero?.name ?? "Pip"}</div>
          </div>
        </div>
      </div>
      {hero && (
        <svg viewBox="0 0 1080 700" width={1080} height={700} style={{ position: "absolute", bottom: 0, overflow: "visible" }}>
          <g transform={`translate(800 ${900 - 200 * s}) scale(1.7)`}>
            <PaperCharacterArt character={hero} mood={beat.cast[0]?.mood ?? "happy"} action="idle" frame={frame} facing={-1} talking={false} seed={beat.seed} />
          </g>
        </svg>
      )}
      <PaperFinish />
    </AbsoluteFill>
  );
};
