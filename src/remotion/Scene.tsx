// One beat on screen: depth layers + camera + lighting + characters + bubbles + captions.
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import type { Character, Look, StagedBeat, StoryStyle } from "../lib/story";
import { HEIGHT, WIDTH } from "../lib/story";
import { sceneLayers } from "./art/Backgrounds";
import { CharacterArt, motion } from "./art/Character";
import { SKY, seeded } from "./art/palette";
import { HookCaption, NarratorBox, SpeechBubble } from "./Text";

const FEET_Y = 1560;

type CameraState = { zoom: number; x: number; y: number; tilt: number };

function camera(beat: StagedBeat, frame: number, style: StoryStyle): CameraState {
  const t = interpolate(frame, [0, beat.durationInFrames], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  // Hook style punches in a little at each cut.
  const punch = style === "hook" ? interpolate(frame, [0, 6], [0.06, 0], { extrapolateRight: "clamp" }) : 0;
  switch (beat.camera) {
    case "push":
      return { zoom: 1 + 0.14 * t + punch, x: 0, y: -40 * t, tilt: 0 };
    case "pan-left":
      return { zoom: 1.12 + punch, x: 110 - 220 * t, y: 0, tilt: 3 - 6 * t };
    case "pan-right":
      return { zoom: 1.12 + punch, x: -110 + 220 * t, y: 0, tilt: -3 + 6 * t };
    case "close": {
      const lead = beat.cast[0];
      const cx = lead ? (0.5 - lead.x) * WIDTH : 0;
      return { zoom: 1.45 + 0.08 * t + punch, x: cx * 1.2, y: 260, tilt: 0 };
    }
    case "still":
    default:
      return { zoom: 1.03 + 0.02 * t, x: 0, y: 0, tilt: 0 };
  }
}

function Layer({ children, depth, cam, look, blur }: { children: React.ReactNode; depth: number; cam: CameraState; look: Look; blur: number }) {
  const deep = look === "2.5d";
  const f = deep ? depth : 1;
  const zoom = 1 + (cam.zoom - 1) * f;
  const tx = cam.x * f;
  const ty = cam.y * f;
  const rot = deep ? cam.tilt * (depth - 0.6) : 0;
  return (
    <AbsoluteFill
      style={{
        transform: `perspective(2400px) translate(${tx}px, ${ty}px) scale(${zoom}) rotateY(${rot}deg)`,
        transformOrigin: `50% ${(FEET_Y / HEIGHT) * 100}%`,
        filter: deep && blur > 0 ? `blur(${blur}px)` : undefined,
      }}
    >
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width={WIDTH} height={HEIGHT} style={{ overflow: "visible" }}>
        {children}
      </svg>
    </AbsoluteFill>
  );
}

function Lighting({ beat, frame }: { beat: StagedBeat; frame: number }) {
  const sky = SKY[beat.time];
  const r = seeded(beat.seed);
  const motes = Array.from({ length: 26 }, () => ({ x: r() * WIDTH, y: r() * HEIGHT, s: 2 + r() * 5, sp: 0.3 + r() * 0.8, ph: r() * 6 }));
  const rays = beat.time !== "night" && !["bedroom", "cafe", "classroom", "space"].includes(beat.setting);
  return (
    <AbsoluteFill style={{ pointerEvents: "none" }}>
      {/* color grade */}
      <AbsoluteFill style={{ background: sky.tint, mixBlendMode: "soft-light" }} />
      <AbsoluteFill style={{ background: sky.tint }} />
      {/* light rays */}
      {rays && (
        <AbsoluteFill
          style={{
            opacity: 0.22 + 0.06 * Math.sin(frame / 25),
            background: `repeating-linear-gradient(115deg, transparent 0px, transparent 90px, ${sky.light}55 120px, transparent 190px)`,
            maskImage: "linear-gradient(200deg, black 0%, transparent 60%)",
            WebkitMaskImage: "linear-gradient(200deg, black 0%, transparent 60%)",
            mixBlendMode: "screen",
          }}
        />
      )}
      {/* floating dust */}
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width={WIDTH} height={HEIGHT} style={{ position: "absolute" }}>
        {motes.map((m, i) => (
          <circle
            key={i}
            cx={(m.x + Math.sin(frame / 40 + m.ph) * 30) % WIDTH}
            cy={(m.y - frame * m.sp + HEIGHT * 4) % HEIGHT}
            r={m.s}
            fill={sky.light}
            opacity={0.35 + 0.3 * Math.sin(frame / 15 + m.ph)}
          />
        ))}
      </svg>
      {/* vignette */}
      <AbsoluteFill style={{ background: "radial-gradient(ellipse at 50% 45%, transparent 50%, rgba(0,0,20,0.55) 100%)" }} />
    </AbsoluteFill>
  );
}

export const Scene: React.FC<{
  beat: StagedBeat;
  index: number;
  characters: Character[];
  look: Look;
  style: StoryStyle;
}> = ({ beat, index, characters, look, style }) => {
  const frame = useCurrentFrame();
  const cam = camera(beat, frame, style);
  const layers = sceneLayers(beat.setting, beat.time, `b${index}`);
  const deep = look === "2.5d";
  const lineEnd = beat.lineStartFrame + Math.max(beat.lineFrames, 30) + 8;
  const speaking = beat.speaker != null && !!beat.line && frame >= beat.lineStartFrame && frame < lineEnd;
  const speakerCast = beat.cast.find((c) => c.who === beat.speaker);
  const fadeIn = style === "cozy" ? interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" }) : 1;

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden", opacity: fadeIn }}>
      <Layer depth={0.35} cam={cam} look={look} blur={beat.camera === "close" ? 7 : 3}>
        {layers.far}
      </Layer>
      <Layer depth={1} cam={cam} look={look} blur={0}>
        {layers.mid}
        {beat.cast.map((c, i) => {
          const ch = characters[c.who];
          if (!ch) return null;
          const talking = speaking && c.who === beat.speaker && frame < beat.lineStartFrame + Math.max(beat.lineFrames, 24);
          return (
            <g key={i} transform={`translate(${c.x * WIDTH} ${FEET_Y + i * 6}) scale(${c.scale})`}>
              <CharacterArt
                character={ch}
                mood={c.mood}
                action={c.action}
                frame={frame}
                look={look}
                facing={c.facing}
                talking={talking}
                time={beat.time}
                id={`${index}-${i}`}
                seed={beat.seed + i * 31}
              />
            </g>
          );
        })}
      </Layer>
      <Layer depth={1.7} cam={cam} look={look} blur={deep ? 6 : 0}>
        {layers.near}
      </Layer>
      {deep && <Lighting beat={beat} frame={frame} />}
      {speaking && speakerCast && (
        <SpeechBubble
          text={beat.line!}
          frame={frame - beat.lineStartFrame}
          x={(() => {
            // follow the camera roughly so the bubble sits above the speaker
            const m = motion(speakerCast.action, frame, speakerCast.facing, beat.seed);
            const sx = speakerCast.x * WIDTH + m.x * speakerCast.scale;
            return WIDTH / 2 + (sx - WIDTH / 2) * cam.zoom + cam.x;
          })()}
          y={Math.max(260, FEET_Y - (360 * speakerCast.scale + 120) * cam.zoom + cam.y - (cam.zoom - 1) * 0)}
          style={style}
        />
      )}
      {style === "hook"
        ? beat.captions.map((c, i) => (frame >= c.from && frame < (i === beat.captions.length - 1 ? beat.durationInFrames : c.to) ? <HookCaption key={i} chunk={c} frame={frame - c.from} /> : null))
        : <NarratorBox text={beat.narration} highlight={beat.captions[0]?.highlight ?? null} frame={frame} />}
    </AbsoluteFill>
  );
};
