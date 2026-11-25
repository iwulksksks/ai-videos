// One beat on screen: depth layers + camera + lighting + characters + bubbles + captions.
import React from "react";
import { AbsoluteFill, interpolate, useCurrentFrame, Easing } from "remotion";
import type { Character, Look, StagedBeat, StoryStyle } from "../lib/story";
import { HEIGHT, WIDTH, isPaper } from "../lib/story";
import { sceneLayers } from "./art/Backgrounds";
import { CharacterArt, motion } from "./art/Character";
import { SKY, seeded } from "./art/palette";
import { PropArt } from "./art/Props";
import { PaperCharacterArt } from "./art/PaperCharacter";
import { Counter, NewsCard, PAPER_LAYER_FILTER, PaperFinish, Pigeon, QuestionCard, TornCaption } from "./Paper";
import { FactPostcard, HomePostcard, LuggageTag, PassportCard, SnapshotFrame, TicketCaption } from "./Trip";
import { HookCaption, NarratorBox, SingleWordCaption, SpeechBubble } from "./Text";

const FEET_Y = 1560;

type CameraState = { zoom: number; x: number; y: number; tilt: number };

function camera(beat: StagedBeat, frame: number, style: StoryStyle): CameraState {
  const t = interpolate(frame, [0, beat.durationInFrames], [0, 1], {
    extrapolateRight: "clamp",
    easing: Easing.inOut(Easing.quad),
  });
  // Hook and Twist Tale punch in a little at each cut.
  const punch = style !== "cozy" ? interpolate(frame, [0, 6], [0.06, 0], { extrapolateRight: "clamp" }) : 0;
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
      // Toy-block people are taller, so frame them lower to keep the whole head in shot.
      return { zoom: 1.45 + 0.08 * t + punch, x: cx * 1.2, y: isPaper(style) ? 470 : 260, tilt: 0 };
    }
    case "insert":
      return { zoom: 1 + 0.12 * t + punch, x: 0, y: 0, tilt: 0 };
    case "still":
    default:
      return { zoom: 1.03 + 0.02 * t, x: 0, y: 0, tilt: 0 };
  }
}

// Depth of field is faked with "atmospheric haze" (a see-through wash of sky color on far layers).
// A real CSS blur looks similar but makes CPU rendering about 3 times slower.
function Layer({ children, depth, cam, look, haze = 0, hazeColor = "#ffffff", paper = false }: { children: React.ReactNode; depth: number; cam: CameraState; look: Look; haze?: number; hazeColor?: string; paper?: boolean }) {
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
        // Paper look: the layer becomes a sheet of cut card with a white edge and a shadow.
        filter: paper && depth >= 1 ? PAPER_LAYER_FILTER : undefined,
      }}
    >
      <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width={WIDTH} height={HEIGHT} style={{ overflow: "visible" }}>
        {/* Paper look: every shape without its own outline gets a white cut edge. */}
        {paper ? (
          <g stroke="#fffaf0" strokeWidth={6} strokeLinejoin="round" style={{ paintOrder: "stroke" }}>
            {children}
          </g>
        ) : (
          children
        )}
        {deep && haze > 0 && <rect x={-700} y={-700} width={WIDTH + 1400} height={HEIGHT + 1400} fill={hazeColor} opacity={haze} />}
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
  counter?: { label: string; unit: string } | null;
  country?: string | null;
  freshPlace?: boolean; // Country Story: the luggage tag changes on this beat
}> = ({ beat, index, characters, look, style, counter, country, freshPlace }) => {
  const frame = useCurrentFrame();
  const cam = camera(beat, frame, style);
  const layers = sceneLayers(beat.setting, beat.time, `b${index}`);
  const deep = look === "2.5d";
  const lineEnd = beat.lineStartFrame + Math.max(beat.lineFrames, 30) + 8;
  const speaking = beat.speaker != null && !!beat.line && frame >= beat.lineStartFrame && frame < lineEnd;
  const speakerCast = beat.cast.find((c) => c.who === beat.speaker);
  const fadeIn = style === "cozy" ? interpolate(frame, [0, 8], [0, 1], { extrapolateRight: "clamp" }) : 1;

  const captions =
    style === "cozy" ? (
      <NarratorBox text={beat.narration} highlight={beat.captions[0]?.highlight ?? null} frame={frame} />
    ) : (
      beat.captions.map((c, i) =>
        frame >= c.from && frame < (i === beat.captions.length - 1 ? beat.durationInFrames : c.to) ? (
          style === "country" ? (
            <TicketCaption key={i} chunk={c} frame={frame - c.from} index={index * 10 + i} />
          ) : style === "twist" ? (
            <SingleWordCaption key={i} chunk={c} frame={frame - c.from} low={beat.camera === "insert"} />
          ) : isPaper(style) ? (
            <TornCaption key={i} chunk={c} frame={frame - c.from} index={index * 10 + i} top={style === "whatif" ? 440 : 250} />
          ) : (
            <HookCaption key={i} chunk={c} frame={frame - c.from} />
          )
        ) : null,
      )
    );

  const paper = isPaper(style);
  const trip = style === "country";
  const land = country || beat.place || "Abroad";
  if (trip && beat.card === "passport") return <PassportCard beat={beat} frame={frame} characters={characters} country={land} />;
  if (trip && beat.card === "fact") return <FactPostcard beat={beat} frame={frame} country={land} />;
  if (trip && beat.card === "postcard") return <HomePostcard beat={beat} frame={frame} characters={characters} country={land} />;
  const journal = trip ? (
    <>
      <SnapshotFrame />
      <LuggageTag country={land} place={beat.place ?? null} frame={frame} fresh={!!freshPlace} />
    </>
  ) : null;
  if (paper && beat.card === "question") {
    return <QuestionCard beat={beat} frame={frame} characters={characters} />;
  }
  if (paper && (beat.card === "headline" || beat.card === "correction")) {
    return <NewsCard beat={beat} frame={frame} characters={characters} kind={beat.card} />;
  }
  const counterTag =
    style === "whatif" && counter && beat.counterTo != null ? (
      <Counter label={counter.label} unit={counter.unit} from={beat.counterFrom ?? beat.counterTo} to={beat.counterTo} frame={frame} duration={beat.durationInFrames} />
    ) : null;

  if (beat.camera === "insert" && beat.prop && beat.prop !== "none") {
    // A close-up of the mechanism: the set fades back, the object fills the frame.
    return (
      <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden" }}>
        <Layer depth={0.35} cam={{ ...cam, zoom: cam.zoom * 1.2 }} look={look} haze={0.55} hazeColor={SKY[beat.time].bottom}>
          {layers.far}
        </Layer>
        <AbsoluteFill style={{ transform: `scale(${cam.zoom})` }}>
          <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} width={WIDTH} height={HEIGHT} style={{ overflow: "visible" }}>
            <ellipse cx={WIDTH / 2} cy={1420} rx={420} ry={60} fill="#000" opacity={0.25} />
            <g transform={`translate(${WIDTH / 2} 900)`}>
              <PropArt prop={beat.prop} frame={frame} time={beat.time} />
            </g>
          </svg>
        </AbsoluteFill>
        {paper ? <PaperFinish /> : deep && <Lighting beat={beat} frame={frame} />}
        {journal}
        {counterTag}
        {captions}
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill style={{ backgroundColor: "#000", overflow: "hidden", opacity: fadeIn }}>
      <Layer depth={0.35} cam={cam} look={look} haze={paper ? 0.06 : beat.camera === "close" ? 0.3 : 0.16} hazeColor={SKY[beat.time].bottom} paper={paper}>
        {layers.far}
      </Layer>
      <Layer depth={1} cam={cam} look={look} paper={paper}>
        {layers.mid}
      </Layer>
      <Layer depth={1} cam={cam} look={look}>
        {beat.cast.map((c, i) => {
          const ch = characters[c.who];
          if (!ch) return null;
          const talking = speaking && c.who === beat.speaker && frame < beat.lineStartFrame + Math.max(beat.lineFrames, 24);
          return (
            <g key={i} transform={`translate(${c.x * WIDTH} ${FEET_Y + i * 6}) scale(${c.scale})`}>
              {paper ? (
                <PaperCharacterArt
                  character={ch}
                  mood={c.mood}
                  action={c.action}
                  frame={frame}
                  facing={c.facing}
                  talking={talking}
                  seed={beat.seed + i * 31}
                />
              ) : (
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
              )}
            </g>
          );
        })}
      </Layer>
      <Layer depth={1.7} cam={cam} look={look} paper={paper}>
        {layers.near}
      </Layer>
      {paper ? <PaperFinish /> : deep && <Lighting beat={beat} frame={frame} />}
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
          y={Math.max(260, FEET_Y - ((paper ? 470 : 360) * speakerCast.scale + 120) * cam.zoom + cam.y)}
          style={style}
        />
      )}
      {style === "gossip" && <Pigeon frame={frame} talking={frame < beat.narrationFrames} enter={index === 1} />}
      {journal}
      {counterTag}
      {captions}
    </AbsoluteFill>
  );
};
